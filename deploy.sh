#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(dirname -- "${BASH_SOURCE[0]}")"
cd -- "$SCRIPT_DIR" || exit 1
SCRIPT_NAME="$(basename -- "$0")"

if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    CYAN='\033[0;36m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m'
    CHECK="✓"
    CROSS="✗"
    WARNING="⚠"
    WAIT="⏳"
else
    GREEN=''
    RED=''
    YELLOW=''
    CYAN=''
    BLUE=''
    BOLD=''
    NC=''
    CHECK="[OK]"
    CROSS="[FAIL]"
    WARNING="[WARN]"
    WAIT="[WAIT]"
fi

success() {
    printf '%b %s%b\n' "${GREEN}${CHECK}" "$1" "${NC}"
}

error() {
    printf '%b %s%b\n' "${RED}${CROSS}" "$1" "${NC}" >&2
}

warning() {
    printf '%b %s%b\n' "${YELLOW}${WARNING}" "$1" "${NC}" >&2
}

major_section() {
    local title="$1"
    printf '\n'
    printf '%b%s%b\n' "${CYAN}" "${title}" "${NC}"
}

minor_section() {
    local title="$1"
    printf '\n'
    printf '%b%s%b\n' "${BLUE}" "${title}" "${NC}"
}

BUILD_PID=""
TMP_FILES=()

register_temp_file() {
    TMP_FILES+=("$1")
}

cleanup() {
    local exit_code=$?
    if [[ -n "${BUILD_PID:-}" ]] && kill -0 "$BUILD_PID" 2>/dev/null; then
        kill -TERM "$BUILD_PID" 2>/dev/null || true
        wait "$BUILD_PID" 2>/dev/null || true
    fi
    for tmp in "${TMP_FILES[@]}"; do
        if [[ -f "$tmp" ]]; then
            rm -f "$tmp" 2>/dev/null || true
        fi
    done
    if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
        printf '\033[?25h%b' "${NC}" 2>/dev/null || true
    fi
    exit "$exit_code"
}

trap cleanup EXIT INT TERM HUP

to_unix_path() {
    local p="$1"
    [[ -z "$p" ]] && return 0
    if command -v cygpath >/dev/null 2>&1; then
        cygpath -u "$p" 2>/dev/null || printf '%s' "$p"
    else
        local converted="${p//\\//}"
        if [[ "$converted" =~ ^([a-zA-Z]):/(.*)$ ]]; then
            local drive="${BASH_REMATCH[1]}"
            local rest="${BASH_REMATCH[2]}"
            local drive_lower
            drive_lower="$(printf '%s' "$drive" | tr '[:upper:]' '[:lower:]')"
            printf '/%s/%s' "$drive_lower" "$rest"
        else
            printf '%s' "$converted"
        fi
    fi
}

CLI_COMPOSE_FILES=()
CLI_PROFILES=()
CLI_ENV_FILE=""
CLI_PROJECT_NAME=""
CLI_REGISTRY=""
CLI_TAGS=()
CLI_NO_BUILD=0
CLI_DRY_RUN=0
CLI_PUSH=0
MAX_WAIT=120
INTERVAL=3
COMMAND=""
ARGS=()

parse_cli_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --file)
                if [[ $# -ge 2 && "$2" != -* ]]; then
                    CLI_COMPOSE_FILES+=("$2")
                    shift 2
                else
                    error "--file requires a Compose file path argument"
                    exit 1
                fi
                ;;
            --profile)
                if [[ $# -ge 2 && "$2" != -* ]]; then
                    CLI_PROFILES+=("$2")
                    shift 2
                else
                    error "--profile requires a profile name argument"
                    exit 1
                fi
                ;;
            --env-file)
                if [[ $# -ge 2 && "$2" != -* ]]; then
                    CLI_ENV_FILE="$2"
                    shift 2
                else
                    error "--env-file requires an environment file path argument"
                    exit 1
                fi
                ;;
            -p|--project-name)
                if [[ $# -ge 2 && "$2" != -* ]]; then
                    CLI_PROJECT_NAME="$2"
                    shift 2
                else
                    error "--project-name requires a project name argument"
                    exit 1
                fi
                ;;
            -r|--registry)
                if [[ $# -ge 2 && "$2" != -* ]]; then
                    CLI_REGISTRY="$2"
                    shift 2
                else
                    error "--registry requires a registry URL or namespace (e.g., docker.io/user, ghcr.io/org)"
                    exit 1
                fi
                ;;
            -t|--tag)
                if [[ $# -ge 2 && "$2" != -* ]]; then
                    IFS=',' read -ra split_tags <<< "$2"
                    for t in "${split_tags[@]}"; do
                        [[ -n "$t" ]] && CLI_TAGS+=("$t")
                    done
                    shift 2
                else
                    error "--tag requires an image tag argument (e.g., v1.0.0, latest)"
                    exit 1
                fi
                ;;
            --no-build)
                CLI_NO_BUILD=1
                shift 1
                ;;
            --dry-run)
                CLI_DRY_RUN=1
                shift 1
                ;;
            --push)
                CLI_PUSH=1
                shift 1
                ;;
            --max-wait)
                if [[ $# -ge 2 && "$2" =~ ^[0-9]+$ ]]; then
                    MAX_WAIT="$2"
                    shift 2
                else
                    error "--max-wait requires a positive integer argument (seconds)"
                    exit 1
                fi
                ;;
            --interval)
                if [[ $# -ge 2 && "$2" =~ ^[0-9]+$ ]]; then
                    INTERVAL="$2"
                    shift 2
                else
                    error "--interval requires a positive integer argument (seconds)"
                    exit 1
                fi
                ;;
            --no-color)
                GREEN='' RED='' YELLOW='' CYAN='' BLUE='' BOLD='' NC=''
                CHECK="[OK]" CROSS="[FAIL]" WARNING="[WARN]" WAIT="[WAIT]"
                shift 1
                ;;
            -f)
                if [[ "$COMMAND" == "clean" || "$COMMAND" == "purge" || "$COMMAND" == "prune" || "$COMMAND" == "stop" ]]; then
                    ARGS+=("-f")
                    shift 1
                elif [[ $# -ge 2 && "$2" != -* ]]; then
                    CLI_COMPOSE_FILES+=("$2")
                    shift 2
                else
                    if [[ -n "$COMMAND" ]]; then
                        ARGS+=("-f")
                        shift 1
                    else
                        error "-f requires a Compose file argument"
                        exit 1
                    fi
                fi
                ;;
            *)
                if [[ -z "$COMMAND" ]]; then
                    COMMAND="$1"
                else
                    ARGS+=("$1")
                fi
                shift 1
                ;;
        esac
    done
    COMMAND="${COMMAND:-start}"
}

parse_cli_args "$@"

ACTIVE_COMPOSE_FILES=()

detect_compose_files() {
    if [[ "${#CLI_COMPOSE_FILES[@]}" -gt 0 ]]; then
        for f in "${CLI_COMPOSE_FILES[@]}"; do
            if [[ ! -f "$f" ]]; then
                error "Specified Compose file not found: $f"
                return 1
            fi
            ACTIVE_COMPOSE_FILES+=("$f")
        done
        return 0
    fi

    if [[ -n "${COMPOSE_FILE:-}" ]]; then
        IFS=':' read -ra cf_arr <<< "$COMPOSE_FILE"
        for f in "${cf_arr[@]}"; do
            [[ -f "$f" ]] && ACTIVE_COMPOSE_FILES+=("$f")
        done
        if [[ "${#ACTIVE_COMPOSE_FILES[@]}" -gt 0 ]]; then
            return 0
        fi
    fi

    local primary_found=""
    for candidate in "docker-compose.yaml" "docker-compose.yml"; do
        if [[ -f "$candidate" ]]; then
            primary_found="$candidate"
            ACTIVE_COMPOSE_FILES+=("$candidate")
            break
        fi
    done

    if [[ -z "$primary_found" ]]; then
        return 1
    fi

    for override in "docker-compose.override.yaml" "docker-compose.override.yml"; do
        if [[ -f "$override" ]]; then
            ACTIVE_COMPOSE_FILES+=("$override")
            break
        fi
    done

    return 0
}

detect_env_file() {
    if [[ -n "${CLI_ENV_FILE:-}" ]]; then
        if [[ ! -f "$CLI_ENV_FILE" ]]; then
            error "Specified environment file not found: $CLI_ENV_FILE"
            return 1
        fi
        printf '%s' "$CLI_ENV_FILE"
        return 0
    fi
    if [[ -f ".env" ]]; then
        printf '%s' ".env"
        return 0
    fi
    return 1
}

COMPOSE=(docker compose)

if detect_compose_files; then
    for f in "${ACTIVE_COMPOSE_FILES[@]}"; do
        COMPOSE+=(-f "$f")
    done
fi

ENV_FILE=""
if [[ -n "${CLI_ENV_FILE:-}" ]]; then
    if [[ ! -f "$CLI_ENV_FILE" ]]; then
        error "Specified environment file not found: $CLI_ENV_FILE"
        exit 1
    fi
    ENV_FILE="$CLI_ENV_FILE"
    COMPOSE+=(--env-file "$ENV_FILE")
elif [[ -f ".env" ]]; then
    ENV_FILE=".env"
    COMPOSE+=(--env-file "$ENV_FILE")
fi

if [[ -n "${CLI_PROJECT_NAME:-}" ]]; then
    COMPOSE+=(-p "$CLI_PROJECT_NAME")
elif [[ -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
    COMPOSE+=(-p "$COMPOSE_PROJECT_NAME")
fi

for prof in "${CLI_PROFILES[@]}"; do
    COMPOSE+=(--profile "$prof")
done

detect_project_name() {
    if [[ -n "${CLI_PROJECT_NAME:-}" ]]; then
        printf '%s' "$CLI_PROJECT_NAME"
        return 0
    fi
    if [[ -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
        printf '%s' "$COMPOSE_PROJECT_NAME"
        return 0
    fi
    local name=""
    if [[ "${#ACTIVE_COMPOSE_FILES[@]}" -gt 0 ]]; then
        name="$("${COMPOSE[@]}" config 2>/dev/null | awk '/^name:[[:space:]]*/{print $2; exit}' || true)"
    fi
    if [[ -n "$name" ]]; then
        printf '%s' "$name"
        return 0
    fi
    local raw_dir
    raw_dir="$(basename -- "$PWD")"
    printf '%s' "$raw_dir" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]/-/g' -e 's/^-*//' -e 's/-*$//'
}

PROJECT_NAME="$(detect_project_name)"
CACHE_DIR=".${PROJECT_NAME}_cache"
LOGS_DIR="logs"

declare -A SVC_IS_BUILDABLE
declare -A SVC_CONTEXT
declare -A SVC_DOCKERFILE
declare -A SVC_PORTS
declare -A SVC_IMAGE
SERVICES_INITIALIZED=0

init_services_metadata() {
    if [[ "$SERVICES_INITIALIZED" -eq 1 ]]; then
        return 0
    fi

    local compose_cfg
    compose_cfg="$("${COMPOSE[@]}" config 2>/dev/null | tr -d '\r' || true)"
    if [[ -z "$compose_cfg" ]]; then
        return 1
    fi

    local _svc _is_build _ctx _df _ports _img
    while IFS='|' read -r _svc _is_build _ctx _df _ports _img; do
        _svc="${_svc//$'\r'/}"
        [[ -z "$_svc" ]] && continue
        SVC_IS_BUILDABLE["$_svc"]="$_is_build"
        SVC_CONTEXT["$_svc"]="$_ctx"
        SVC_DOCKERFILE["$_svc"]="${_df:-Dockerfile}"
        SVC_PORTS["$_svc"]="$_ports"
        SVC_IMAGE["$_svc"]="${_img:-${PROJECT_NAME}-${_svc}:latest}"
    done < <(printf '%s\n' "$compose_cfg" | awk '
    BEGIN { in_services = 0; current_svc = ""; in_build = 0; in_ports = 0 }
    /^[[:space:]]*#/ { next }
    /^services:/ { in_services = 1; next }
    in_services && /^[a-zA-Z0-9_]+:/ && !/^services:/ { in_services = 0; current_svc = "" }
    in_services && /^  [a-zA-Z0-9_.-]+:/ {
        current_svc = $1; sub(/:$/, "", current_svc); sub(/^  /, "", current_svc)
        svc_list = (svc_list ? svc_list " " : "") current_svc
        is_build[current_svc] = 0; context[current_svc] = ""; dockerfile[current_svc] = ""; image[current_svc] = ""
        in_build = 0; in_ports = 0; next
    }
    in_services && current_svc != "" {
        if (/^    image:[[:space:]]*/) {
            val = $0; sub(/^    image:[[:space:]]*/, "", val); sub(/[[:space:]]+$/, "", val)
            gsub(/^["\x27]|["\x27]$/, "", val)
            image[current_svc] = val
            next
        }
        if (/^    build:[[:space:]]*[^[:space:]]/) {
            is_build[current_svc] = 1; in_build = 1; in_ports = 0
            val = $0; sub(/^    build:[[:space:]]*/, "", val); sub(/[[:space:]]+$/, "", val)
            gsub(/^["\x27]|["\x27]$/, "", val)
            context[current_svc] = val
            next
        }
        if (/^    build:[[:space:]]*$/) { is_build[current_svc] = 1; in_build = 1; in_ports = 0; next }
        if (/^    ports:/) { in_ports = 1; in_build = 0; next }
        if (/^    [a-zA-Z0-9_]+:/) { in_build = 0; in_ports = 0 }
        if (in_build && /^[[:space:]]+context:[[:space:]]*/) {
            val = $0; sub(/^[[:space:]]+context:[[:space:]]*/, "", val); sub(/[[:space:]]+$/, "", val)
            gsub(/^["\x27]|["\x27]$/, "", val)
            context[current_svc] = val
        }
        if (in_build && /^[[:space:]]+dockerfile:[[:space:]]*/) {
            val = $0; sub(/^[[:space:]]+dockerfile:[[:space:]]*/, "", val); sub(/[[:space:]]+$/, "", val)
            gsub(/^["\x27]|["\x27]$/, "", val)
            dockerfile[current_svc] = val
        }
        if (in_ports && /^[[:space:]]+published:[[:space:]]*/) {
            val = $0; sub(/^[[:space:]]+published:[[:space:]]*"?/, "", val); sub(/"?[[:space:]]*$/, "", val)
            ports[current_svc] = (ports[current_svc] ? ports[current_svc] "," : "") val
        }
    }
    END {
        n = split(svc_list, arr, " ")
        for (i = 1; i <= n; i++) {
            s = arr[i]
            print s "|" is_build[s] "|" context[s] "|" dockerfile[s] "|" ports[s] "|" image[s]
        }
    }
    ')

    SERVICES_INITIALIZED=1
}

get_services() {
    local services_list
    services_list="$("${COMPOSE[@]}" config --services 2>/dev/null | tr -d '\r' || true)"
    if [[ -n "$services_list" ]]; then
        printf '%s\n' "$services_list"
    fi
}

get_buildable_services() {
    init_services_metadata
    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)

    for svc in "${services[@]}"; do
        if [[ "${SVC_IS_BUILDABLE[$svc]:-0}" -eq 1 ]]; then
            printf '%s\n' "$svc"
        fi
    done
}

is_service_buildable() {
    local svc="${1//$'\r'/}"
    [[ -z "$svc" ]] && return 1
    init_services_metadata
    [[ "${SVC_IS_BUILDABLE[$svc]:-0}" -eq 1 ]]
}

get_service_image() {
    local svc="${1//$'\r'/}"
    [[ -z "$svc" ]] && return 0
    init_services_metadata
    printf '%s' "${SVC_IMAGE[$svc]:-${PROJECT_NAME}-${svc}:latest}"
}

get_project_volumes() {
    local vols=()
    while IFS= read -r line; do
        line="${line//$'\r'/}"
        [[ -n "$line" ]] && vols+=("$line")
    done < <(docker volume ls --filter "label=com.docker.compose.project=${PROJECT_NAME}" --format '{{.Name}}' 2>/dev/null || true)

    if [[ "${#vols[@]}" -gt 0 ]]; then
        printf '%s\n' "${vols[@]}" | sort -u
    fi
}

get_project_images() {
    local imgs=()
    while IFS= read -r line; do
        line="${line//$'\r'/}"
        [[ -n "$line" ]] && imgs+=("$line")
    done < <(docker images --filter "label=com.docker.compose.project=${PROJECT_NAME}" --format '{{.Repository}}:{{.Tag}}' 2>/dev/null || true)

    if [[ "${#imgs[@]}" -gt 0 ]]; then
        printf '%s\n' "${imgs[@]}" | sort -u
    fi
}

check_prerequisites() {
    local check_daemon="${1:-1}"
    minor_section "Checking Prerequisites"
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker CLI is not installed or not in PATH"
        exit 1
    fi
    if [[ "$check_daemon" -eq 1 ]]; then
        if ! docker info >/dev/null 2>&1; then
            error "Docker daemon is not running. Please start Docker."
            exit 1
        fi
        success "Docker daemon is reachable"
    fi

    if [[ "${#ACTIVE_COMPOSE_FILES[@]}" -gt 0 ]]; then
        success "Compose file loaded: ${ACTIVE_COMPOSE_FILES[*]}"
    else
        error "No Docker Compose file found (checked docker-compose.yaml, docker-compose.yml)"
        printf 'Specify a file with: %s -f <compose-file>\n' "$SCRIPT_NAME" >&2
        exit 1
    fi

    if [[ -n "${ENV_FILE:-}" && -f "${ENV_FILE}" ]]; then
        success "Environment file loaded: ${ENV_FILE}"
    else
        error ".env file not found. A valid .env file is required for configuration."
        printf 'Please create a .env file or specify one with: %s --env-file <file>\n' "$SCRIPT_NAME" >&2
        exit 1
    fi
}

validate_compose() {
    major_section "🔍 Validating Configuration [${PROJECT_NAME}]"
    local compose_output
    if compose_output="$("${COMPOSE[@]}" config 2>&1)"; then
        success "Docker Compose configuration is valid"
    else
        error "Docker Compose configuration is invalid"
        printf '\n%s\n' "$compose_output" >&2
        exit 1
    fi
}

declare -A COMPUTED_HASHES

get_hash_cmd() {
    if command -v sha256sum >/dev/null 2>&1; then
        printf 'sha256sum'
    elif command -v shasum >/dev/null 2>&1; then
        printf 'shasum'
    elif command -v md5sum >/dev/null 2>&1; then
        printf 'md5sum'
    else
        printf 'cksum'
    fi
}

hash_file() {
    local f="$1"
    [[ ! -f "$f" ]] && return 0
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$f"
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$f"
    elif command -v md5sum >/dev/null 2>&1; then
        md5sum "$f"
    else
        cksum "$f"
    fi
}

compute_service_hash() {
    local service="$1"
    if [[ -n "${COMPUTED_HASHES[$service]:-}" ]]; then
        printf '%s' "${COMPUTED_HASHES[$service]}"
        return 0
    fi

    init_services_metadata

    local tmp_file
    tmp_file="$(mktemp "${TMPDIR:-/tmp}/${PROJECT_NAME}_hash_${service}_XXXXXX" 2>/dev/null || mktemp 2>/dev/null || printf '/tmp/%s_hash_%s_%s' "$PROJECT_NAME" "$service" "$$")"
    register_temp_file "$tmp_file"

    local cfg_hash
    cfg_hash="$("${COMPOSE[@]}" config --hash "$service" 2>/dev/null | awk '{print $2}' || true)"
    if [[ -n "$cfg_hash" ]]; then
        printf 'cfg:%s\n' "$cfg_hash" >> "$tmp_file"
    fi

    for cf in "${ACTIVE_COMPOSE_FILES[@]}"; do
        if [[ -f "$cf" ]]; then
            hash_file "$cf" >> "$tmp_file" 2>/dev/null || true
        fi
    done
    if [[ -n "${ENV_FILE:-}" && -f "$ENV_FILE" ]]; then
        hash_file "$ENV_FILE" >> "$tmp_file" 2>/dev/null || true
    fi

    if is_service_buildable "$service"; then
        local raw_ctx="${SVC_CONTEXT[$service]:-}"
        local raw_df="${SVC_DOCKERFILE[$service]:-Dockerfile}"
        local ctx_dir
        ctx_dir="$(to_unix_path "$raw_ctx")"
        [[ -z "$ctx_dir" ]] && ctx_dir="."

        local df_path="$ctx_dir/$raw_df"
        if [[ -f "$df_path" ]]; then
            hash_file "$df_path" >> "$tmp_file" 2>/dev/null || true
        elif [[ -f "$raw_df" ]]; then
            hash_file "$raw_df" >> "$tmp_file" 2>/dev/null || true
        fi

        if [[ -d "$ctx_dir" ]]; then
            local hash_bin
            hash_bin="$(get_hash_cmd)"
            find "$ctx_dir" -type f \
                -not -path '*/.git/*' \
                -not -path '*/node_modules/*' \
                -not -path '*/.gradle/*' \
                -not -path '*/build/*' \
                -not -path '*/dist/*' \
                -not -path '*/target/*' \
                -not -path '*/.next/*' \
                -not -path '*/__pycache__/*' \
                -not -path '*/.venv/*' \
                -not -path '*/.idea/*' \
                -not -path '*/.vscode/*' \
                -not -path "*/${CACHE_DIR}/*" \
                -not -path "*/${LOGS_DIR}/*" \
                -not -name '*.log' \
                -not -name '*.tmp' \
                -exec "$hash_bin" {} + >> "$tmp_file" 2>/dev/null || true
        fi
    fi

    local final_hash=""
    if [[ -s "$tmp_file" ]]; then
        if command -v sha256sum >/dev/null 2>&1; then
            final_hash="$(sort "$tmp_file" 2>/dev/null | sha256sum | cut -d' ' -f1)"
        elif command -v shasum >/dev/null 2>&1; then
            final_hash="$(sort "$tmp_file" 2>/dev/null | shasum -a 256 | cut -d' ' -f1)"
        elif command -v md5sum >/dev/null 2>&1; then
            final_hash="$(sort "$tmp_file" 2>/dev/null | md5sum | cut -d' ' -f1)"
        else
            final_hash="$(sort "$tmp_file" 2>/dev/null | cksum | cut -d' ' -f1)"
        fi
    fi
    rm -f "$tmp_file" 2>/dev/null || true

    COMPUTED_HASHES["$service"]="$final_hash"
    printf '%s' "$final_hash"
}

has_code_changed() {
    local service="$1"
    local hash_file="${CACHE_DIR}/${service}.hash"
    local current_hash
    current_hash="$(compute_service_hash "$service")"

    if [[ -z "$current_hash" ]]; then
        return 1
    fi

    if [[ ! -f "$hash_file" ]]; then
        return 0
    fi

    local cached_hash
    cached_hash="$(cat "$hash_file" 2>/dev/null || printf '')"
    if [[ "$cached_hash" != "$current_hash" ]]; then
        return 0
    fi

    return 1
}

save_service_hash() {
    local service="$1"
    mkdir -p "$CACHE_DIR"
    local current_hash
    current_hash="$(compute_service_hash "$service")"
    if [[ -n "$current_hash" ]]; then
        printf '%s' "$current_hash" > "${CACHE_DIR}/${service}.hash"
    fi
}

check_and_prepare_services() {
    local force_recreate="${1:-0}"
    mkdir -p "$CACHE_DIR"
    mkdir -p "$LOGS_DIR"

    major_section "🔍 Checking Code Changes & Docker Images"
    init_services_metadata

    local all_services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && all_services+=("$line")
    done < <(get_services)

    if [[ "${#all_services[@]}" -eq 0 ]]; then
        error "No services found in Compose configuration"
        exit 1
    fi

    local services_to_rebuild=()
    local services_to_recreate=()

    for service in "${all_services[@]}"; do
        local image_name
        image_name="$(get_service_image "$service")"
        local is_buildable=0
        if is_service_buildable "$service"; then
            is_buildable=1
        fi

        local image_exists=0
        local container_exists=0
        local code_changed=0

        if docker image inspect "$image_name" >/dev/null 2>&1; then
            image_exists=1
        fi

        local container_id
        container_id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || printf '')"
        if [[ -n "$container_id" ]]; then
            container_exists=1
        fi

        if has_code_changed "$service"; then
            code_changed=1
        fi

        if [[ "$force_recreate" -eq 1 ]]; then
            warning "$service: Force recreate requested"
            [[ "$is_buildable" -eq 1 ]] && services_to_rebuild+=("$service")
            services_to_recreate+=("$service")
        elif [[ "$is_buildable" -eq 1 && "$image_exists" -eq 0 ]]; then
            warning "$service: Docker image '$image_name' not found (build required)"
            services_to_rebuild+=("$service")
            services_to_recreate+=("$service")
        elif [[ "$is_buildable" -eq 1 && "$code_changed" -eq 1 ]]; then
            warning "$service: Source code changes detected (rebuild & recreate required)"
            services_to_rebuild+=("$service")
            services_to_recreate+=("$service")
        elif [[ "$is_buildable" -eq 0 && "$code_changed" -eq 1 ]]; then
            warning "$service: Configuration changes detected (recreate required)"
            services_to_recreate+=("$service")
        elif [[ "$container_exists" -eq 0 ]]; then
            success "$service: Container missing (will be created)"
            services_to_recreate+=("$service")
        else
            success "$service: Up to date"
        fi
    done

    if [[ "${#services_to_rebuild[@]}" -gt 0 ]]; then
        major_section "🔨 Building Docker Images (${services_to_rebuild[*]})"
        local build_log
        local frame=0
        local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
        build_log="$(mktemp "${TMPDIR:-/tmp}/${PROJECT_NAME}_build_XXXXXX.log" 2>/dev/null || mktemp 2>/dev/null || printf '/tmp/%s_build_%s.log' "$PROJECT_NAME" "$$")"
        register_temp_file "$build_log"

        ("${COMPOSE[@]}" build "${services_to_rebuild[@]}") >"$build_log" 2>&1 &
        BUILD_PID=$!

        while kill -0 "$BUILD_PID" 2>/dev/null; do
            if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
                printf '\r%b' "${CYAN}${frames[$frame]} Compiling and building [${services_to_rebuild[*]}]${NC}"
                frame=$(( (frame + 1) % ${#frames[@]} ))
            fi
            sleep 0.1
        done

        if wait "$BUILD_PID"; then
            BUILD_PID=""
            if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
                printf '\r\033[K'
            fi
            success "Docker images built successfully"
            for service in "${services_to_rebuild[@]}"; do
                save_service_hash "$service"
            done
        else
            BUILD_PID=""
            if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
                printf '\r\033[K'
            fi
            error "Docker image build failed"
            printf '\n' >&2
            cat "$build_log" >&2
            rm -f "$build_log" 2>/dev/null || true
            exit 1
        fi
        rm -f "$build_log" 2>/dev/null || true
    fi

    if [[ "${#services_to_recreate[@]}" -gt 0 ]]; then
        major_section "🔄 Starting / Recreating Containers (${services_to_recreate[*]})"
        if "${COMPOSE[@]}" up -d --force-recreate "${services_to_recreate[@]}"; then
            success "Containers recreated and started: ${services_to_recreate[*]}"
            for service in "${services_to_recreate[@]}"; do
                save_service_hash "$service"
            done
        else
            error "Failed to recreate containers"
            exit 1
        fi
    fi
}

start_containers() {
    major_section "🐳 Starting Services"
    if "${COMPOSE[@]}" up -d; then
        success "Containers running in detached mode"
    else
        error "Failed to start containers"
        exit 1
    fi
}

wait_for_services() {
    major_section "⏳ Checking Service Health"
    printf '%s\n' "Waiting for services to become healthy..."

    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)

    declare -A service_status
    declare -A service_exit_codes
    local start_time
    local current_time
    local elapsed
    local container
    local info
    local status
    local health
    local exit_code
    local frame=0
    local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

    start_time="$(date +%s)"
    while true; do
        local all_done=1
        local terminal_failure=0
        current_time="$(date +%s)"
        elapsed=$((current_time - start_time))

        if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
            printf '\r%b' "${CYAN}${frames[$frame]} Checking service health... (${elapsed}s / ${MAX_WAIT}s)${NC}"
            frame=$(( (frame + 1) % ${#frames[@]} ))
        fi

        for service in "${services[@]}"; do
            container="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
            if [[ -z "$container" ]]; then
                service_status["$service"]="not_found"
                all_done=0
                continue
            fi

            local svc_failed=0
            local svc_unhealthy=0
            local svc_pending=0
            local svc_completed=0
            local svc_healthy=0
            local svc_running=0

            while IFS= read -r cid; do
                cid="${cid//$'\r'/}"
                [[ -z "$cid" ]] && continue
                info="$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.State.ExitCode}}' "$cid" 2>/dev/null || echo "unknown|none|1")"

                IFS='|' read -r status health exit_code <<< "$info"
                service_exit_codes["$service"]="$exit_code"

                case "$status" in
                    running)
                        case "$health" in
                            healthy)
                                svc_healthy=1
                                ;;
                            starting)
                                svc_pending=1
                                ;;
                            unhealthy)
                                svc_unhealthy=1
                                ;;
                            none)
                                svc_running=1
                                ;;
                            *)
                                svc_pending=1
                                ;;
                        esac
                        ;;
                    created|restarting)
                        svc_pending=1
                        ;;
                    exited)
                        if [[ "$exit_code" -eq 0 ]]; then
                            svc_completed=1
                        else
                            svc_failed=1
                        fi
                        ;;
                    dead)
                        svc_failed=1
                        ;;
                    *)
                        svc_pending=1
                        ;;
                esac
            done <<< "$container"

            if [[ "$svc_failed" -eq 1 ]]; then
                service_status["$service"]="failed"
                terminal_failure=1
            elif [[ "$svc_unhealthy" -eq 1 ]]; then
                service_status["$service"]="unhealthy"
                terminal_failure=1
            elif [[ "$svc_pending" -eq 1 ]]; then
                service_status["$service"]="starting"
                all_done=0
            elif [[ "$svc_completed" -eq 1 ]]; then
                service_status["$service"]="completed"
            elif [[ "$svc_healthy" -eq 1 ]]; then
                service_status["$service"]="healthy"
            elif [[ "$svc_running" -eq 1 ]]; then
                service_status["$service"]="running"
            else
                service_status["$service"]="starting"
                all_done=0
            fi
        done

        if [[ "$terminal_failure" -eq 1 || "$all_done" -eq 1 ]]; then
            break
        fi

        if [[ "$elapsed" -ge "$MAX_WAIT" ]]; then
            if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
                printf '\r\033[K'
            fi
            warning "Service health check timed out after ${MAX_WAIT}s"
            break
        fi

        sleep "$INTERVAL"
    done

    if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
        printf '\r\033[K'
    fi

    major_section "📊 Service Status"
    local failed=0
    for service in "${services[@]}"; do
        status="${service_status[$service]:-unknown}"
        printf '%-20s' "$service"
        case "$status" in
            healthy)
                printf '%b\n' "${GREEN}${CHECK} Healthy${NC}"
                ;;
            running)
                printf '%b\n' "${GREEN}${CHECK} Running${NC}"
                ;;
            completed)
                printf '%b\n' "${GREEN}${CHECK} Completed (Exit Code 0)${NC}"
                ;;
            starting)
                printf '%b\n' "${YELLOW}${WAIT} Starting / Pending${NC}"
                failed=1
                ;;
            unhealthy)
                printf '%b\n' "${RED}${CROSS} Unhealthy${NC}"
                failed=1
                ;;
            failed)
                local ec="${service_exit_codes[$service]:-unknown}"
                printf '%b\n' "${RED}${CROSS} Failed (Exit Code ${ec})${NC}"
                failed=1
                ;;
            not_found)
                printf '%b\n' "${RED}${CROSS} Container Not Found${NC}"
                failed=1
                ;;
            *)
                printf '%b\n' "${RED}${CROSS} Unknown Status (${status})${NC}"
                failed=1
                ;;
        esac
    done

    if [[ "$failed" -ne 0 ]]; then
        printf '\n'
        error "One or more services failed health checks or did not start cleanly."
        printf '\n'
        for service in "${services[@]}"; do
            local st="${service_status[$service]:-unknown}"
            if [[ "$st" == "failed" || "$st" == "unhealthy" || "$st" == "starting" ]]; then
                minor_section "🔍 Recent logs for ${service} (last 25 lines):"
                "${COMPOSE[@]}" logs --tail=25 "$service" 2>&1 || true
                printf '\n'
            fi
        done
        printf '%s\n' "To follow live logs:"
        printf '%b\n' "${CYAN}./${SCRIPT_NAME} live-logs <service>${NC}"
        printf '\n'
        exit 1
    fi
}

show_endpoints() {
    major_section "🌐 ${PROJECT_NAME} Services & Endpoints"
    init_services_metadata

    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)

    for svc in "${services[@]}"; do
        local ports="${SVC_PORTS[$svc]:-}"
        if [[ -n "$ports" ]]; then
            IFS=',' read -ra port_arr <<< "$ports"
            for p in "${port_arr[@]}"; do
                [[ -z "$p" ]] && continue
                if [[ "$p" == "443" || "$p" == "8443" ]]; then
                    printf '%-18s : https://localhost:%s\n' "$svc" "$p"
                else
                    printf '%-18s : http://localhost:%s\n' "$svc" "$p"
                fi
            done
        else
            printf '%-18s : (internal network / no published ports)\n' "$svc"
        fi
    done
}

detect_registry() {
    if [[ -n "${CLI_REGISTRY:-}" ]]; then
        printf '%s' "${CLI_REGISTRY%/}"
        return 0
    fi
    if [[ -n "${DOCKER_REGISTRY:-}" ]]; then
        printf '%s' "${DOCKER_REGISTRY%/}"
        return 0
    fi
    if [[ -n "${REGISTRY:-}" ]]; then
        printf '%s' "${REGISTRY%/}"
        return 0
    fi
    return 1
}

detect_target_tags() {
    if [[ "${#CLI_TAGS[@]}" -gt 0 ]]; then
        for t in "${CLI_TAGS[@]}"; do
            printf '%s\n' "$t"
        done
        return 0
    fi
    if [[ -n "${IMAGE_TAG:-}" ]]; then
        printf '%s\n' "$IMAGE_TAG"
        return 0
    fi
    if [[ -n "${DOCKER_TAG:-}" ]]; then
        printf '%s\n' "$DOCKER_TAG"
        return 0
    fi
    local git_sha=""
    if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        git_sha="$(git rev-parse --short HEAD 2>/dev/null || true)"
    fi
    if [[ -n "$git_sha" ]]; then
        printf '%s\n' "$git_sha"
        printf 'latest\n'
        return 0
    fi
    printf 'latest\n'
}

push_service_image() {
    local service="$1"
    local registry="$2"
    local tags_str="$3"
    local dry_run="${4:-0}"
    local no_build="${5:-0}"

    local local_image
    local_image="$(get_service_image "$service")"

    local image_exists=0
    if docker image inspect "$local_image" >/dev/null 2>&1; then
        image_exists=1
    fi

    if is_service_buildable "$service"; then
        local changed=0
        if has_code_changed "$service"; then
            changed=1
        fi

        if [[ "$image_exists" -eq 0 || ("$no_build" -eq 0 && "$changed" -eq 1) ]]; then
            minor_section "🔨 Building image for ${service} before push..."
            if [[ "$dry_run" -eq 1 ]]; then
                printf '[dry-run] Would build image for service: %s\n' "$service"
            else
                "${COMPOSE[@]}" build "$service"
                save_service_hash "$service"
                local_image="$(get_service_image "$service")"
            fi
        fi
    elif [[ "$image_exists" -eq 0 ]]; then
        error "Image '$local_image' for service '$service' does not exist locally. Build or pull it first."
        return 1
    fi

    local image_without_tag="${local_image%%:*}"
    local target_repo=""

    if [[ -n "$registry" ]]; then
        local clean_img_name
        clean_img_name="$(basename -- "$image_without_tag")"
        target_repo="${registry}/${clean_img_name}"
    else
        if [[ "$image_without_tag" =~ [/] ]]; then
            target_repo="$image_without_tag"
        else
            error "Cannot push '${local_image}': no remote registry specified."
            printf 'Provide a registry with: %s push %s -r <registry> (e.g. -r ghcr.io/org or -r docker.io/username)\n' "$SCRIPT_NAME" "$service" >&2
            printf 'Or define DOCKER_REGISTRY in your .env file.\n' >&2
            return 1
        fi
    fi

    local tag_list=()
    while IFS= read -r t; do
        [[ -n "$t" ]] && tag_list+=("$t")
    done <<< "$tags_str"

    major_section "🚀 Pushing ${service} -> ${target_repo} (${tag_list[*]})"

    for tag in "${tag_list[@]}"; do
        local remote_image="${target_repo}:${tag}"

        if [[ "$dry_run" -eq 1 ]]; then
            printf '[dry-run] Would tag:  %s -> %s\n' "$local_image" "$remote_image"
            printf '[dry-run] Would push: %s\n' "$remote_image"
            continue
        fi

        if [[ "$local_image" != "$remote_image" ]]; then
            if ! docker tag "$local_image" "$remote_image"; then
                error "Failed to tag '$local_image' as '$remote_image'"
                return 1
            fi
            success "Tagged: ${local_image} -> ${remote_image}"
        fi

        printf '%b\n' "${CYAN}Uploading ${remote_image} to Docker registry...${NC}"
        if docker push "$remote_image"; then
            local digest
            digest="$(docker inspect --format='{{index .RepoDigests 0}}' "$remote_image" 2>/dev/null || true)"
            success "Successfully pushed: ${remote_image}"
            if [[ -n "$digest" ]]; then
                printf '  • %bDigest:%b %s\n' "${GREEN}" "${NC}" "$digest"
            fi
        else
            error "Failed to push '${remote_image}'."
            local reg_domain="${target_repo%%/*}"
            local login_domain=""
            if [[ -n "$reg_domain" && "$reg_domain" =~ [.:] ]]; then
                login_domain="$reg_domain"
                warning "Authentication required for ${reg_domain}."
            else
                warning "Authentication required for Docker Hub."
            fi

            if [[ -t 0 ]]; then
                printf '\n%bWould you like to run "docker login" now to authenticate? [Y/n]:%b ' "${YELLOW}" "${NC}"
                local do_login=""
                read -r do_login || do_login="y"
                if [[ -z "$do_login" || "$do_login" =~ ^[yY]([eE][sS])?$ ]]; then
                    if [[ -n "$login_domain" ]]; then
                        docker login "$login_domain"
                    else
                        docker login
                    fi
                    printf '\n%bRetrying upload for %s...%b\n' "${CYAN}" "$remote_image" "${NC}"
                    if docker push "$remote_image"; then
                        local digest
                        digest="$(docker inspect --format='{{index .RepoDigests 0}}' "$remote_image" 2>/dev/null || true)"
                        success "Successfully pushed: ${remote_image}"
                        if [[ -n "$digest" ]]; then
                            printf '  • %bDigest:%b %s\n' "${GREEN}" "${NC}" "$digest"
                        fi
                        continue
                    fi
                fi
            fi
            return 1
        fi
    done

    return 0
}

push_images() {
    local target_service="${1:-}"
    local registry=""
    registry="$(detect_registry || true)"

    local raw_tags
    raw_tags="$(detect_target_tags)"

    local services_to_push=()

    if [[ -n "$target_service" ]]; then
        local services=()
        while IFS= read -r line; do
            [[ -n "$line" ]] && services+=("$line")
        done < <(get_services)

        local valid=0
        for s in "${services[@]}"; do
            if [[ "$s" == "$target_service" ]]; then
                valid=1
                break
            fi
        done
        if [[ "$valid" -eq 0 ]]; then
            error "Unknown service: $target_service"
            printf '\n%s\n' "Available services: ${services[*]}" >&2
            exit 1
        fi
        services_to_push+=("$target_service")
    else
        while IFS= read -r line; do
            [[ -n "$line" ]] && services_to_push+=("$line")
        done < <(get_buildable_services)

        if [[ "${#services_to_push[@]}" -eq 0 ]]; then
            while IFS= read -r line; do
                [[ -n "$line" ]] && services_to_push+=("$line")
            done < <(get_services)
        fi
    fi

    if [[ "${#services_to_push[@]}" -eq 0 ]]; then
        error "No services found to push."
        exit 1
    fi

    major_section "📦 Pushing Images to Docker Registry [${PROJECT_NAME}]"
    if [[ -n "$registry" ]]; then
        printf 'Registry:        %b%s%b\n' "${CYAN}" "$registry" "${NC}"
    else
        printf 'Registry:        %b(using image repository configured in Compose)%b\n' "${CYAN}" "${NC}"
    fi
    printf 'Target Services: %s\n' "${services_to_push[*]}"

    local push_failed=0
    for svc in "${services_to_push[@]}"; do
        if ! push_service_image "$svc" "$registry" "$raw_tags" "$CLI_DRY_RUN" "$CLI_NO_BUILD"; then
            push_failed=1
            break
        fi
    done

    if [[ "$push_failed" -ne 0 ]]; then
        printf '\n'
        error "One or more images failed to push to the registry."
        exit 1
    fi

    printf '\n'
    success "All target images successfully uploaded to the registry."
}

clean_environment() {
    local clean_volumes=0
    local clean_images=0
    local force=0

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -v|--volumes|volumes|volume|vol)
                clean_volumes=1
                shift
                ;;
            -i|--images|images|image|img)
                clean_images=1
                shift
                ;;
            -a|--all|all)
                clean_volumes=1
                clean_images=1
                shift
                ;;
            -f|--force|force|-y|--yes)
                force=1
                shift
                ;;
            -h|--help|help)
                printf '\n%s\n' "Usage: $SCRIPT_NAME clean [options]"
                printf 'Options:\n'
                printf '  -a, --all, all           Clean project persistent volumes and built container images\n'
                printf '  -v, --volumes, volumes   Clean project persistent Docker volumes\n'
                printf '  -i, --images, images     Remove Docker container images built for this project\n'
                printf '  -f, --force, force       Skip interactive confirmation prompt\n\n'
                return 0
                ;;
            *)
                error "Unknown clean option: $1"
                printf 'Usage: %s clean [-v|--volumes] [-i|--images] [-a|--all] [-f|--force]\n' "$SCRIPT_NAME" >&2
                exit 1
                ;;
        esac
    done

    if [[ "$clean_volumes" -eq 0 && "$clean_images" -eq 0 ]]; then
        if [[ "$force" -eq 1 ]]; then
            clean_volumes=1
            clean_images=1
        elif [[ -t 0 ]]; then
            major_section "🧹 Clean & Purge [${PROJECT_NAME}]"
            minor_section "Select cleanup scope:"
            printf '  %b1)%b All (Containers + Project Volumes + Project Images + Cache)\n' "${CYAN}" "${NC}"
            printf '  %b2)%b Volumes only (Reset project persistent databases, caches & logs)\n' "${CYAN}" "${NC}"
            printf '  %b3)%b Project Images only (Remove project container images)\n' "${CYAN}" "${NC}"
            printf '  %b4)%b Cancel\n' "${CYAN}" "${NC}"
            printf '\n%bSelect option [1-4]:%b ' "${YELLOW}" "${NC}"
            local choice
            read -r choice
            case "$choice" in
                1)
                    clean_volumes=1
                    clean_images=1
                    ;;
                2)
                    clean_volumes=1
                    ;;
                3)
                    clean_images=1
                    ;;
                *)
                    printf '%b\n' "${BLUE}Clean operation cancelled.${NC}"
                    return 0
                    ;;
            esac
        else
            clean_volumes=1
            clean_images=1
        fi
    fi

    local detected_vols=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && detected_vols+=("$line")
    done < <(get_project_volumes)

    local detected_imgs=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && detected_imgs+=("$line")
    done < <(get_project_images)

    if [[ "$force" -eq 0 ]]; then
        major_section "⚠️  Clean Confirmation [${PROJECT_NAME}]"
        printf '%b\n' "${YELLOW}The following actions will be performed:${NC}"
        printf '  • Stop and remove running project containers\n'
        if [[ "$clean_volumes" -eq 1 ]]; then
            printf '  • %bPERMANENTLY DELETE project persistent volumes%b:\n' "${RED}" "${NC}"
            if [[ "${#detected_vols[@]}" -gt 0 ]]; then
                for vol in "${detected_vols[@]}"; do
                    printf '      - %s\n' "$vol"
                done
            else
                printf '      (No project persistent volumes detected)\n'
            fi
        fi
        if [[ "$clean_images" -eq 1 ]]; then
            printf '  • %bRemove built project container images%b:\n' "${RED}" "${NC}"
            if [[ "${#detected_imgs[@]}" -gt 0 ]]; then
                for img in "${detected_imgs[@]}"; do
                    printf '      - %s\n' "$img"
                done
            else
                printf '      (No project container images detected)\n'
            fi
            printf '  • Clear build hash cache (%s)\n' "$CACHE_DIR"
        fi

        if [[ -t 0 ]]; then
            printf '\n%bAre you sure you want to proceed? [y/N]:%b ' "${YELLOW}" "${NC}"
            local confirm
            read -r confirm
            if [[ ! "$confirm" =~ ^[yY]([eE][sS])?$ ]]; then
                printf '%b\n' "${BLUE}Clean operation aborted.${NC}"
                return 0
            fi
        else
            warning "Running in non-interactive environment without --force. Aborting to prevent accidental data loss."
            printf 'Run with: %s clean --force (or -f) to bypass confirmation.\n' "$SCRIPT_NAME" >&2
            exit 1
        fi
    fi

    major_section "🛑 Stopping & Removing Containers"
    local compose_args=("--remove-orphans")
    if [[ "$clean_volumes" -eq 1 ]]; then
        compose_args+=("-v")
    fi

    "${COMPOSE[@]}" down "${compose_args[@]}" 2>/dev/null || true
    success "Containers stopped and removed"

    if [[ "$clean_volumes" -eq 1 ]]; then
        major_section "🗑️  Cleaning Project Persistent Volumes"
        for vol in "${detected_vols[@]}"; do
            if docker volume inspect "$vol" >/dev/null 2>&1; then
                if docker volume rm -f "$vol" >/dev/null 2>&1; then
                    success "Removed volume: $vol"
                else
                    warning "Could not remove volume: $vol (may still be referenced)"
                fi
            fi
        done
        if [[ -d "$LOGS_DIR" ]]; then
            rm -f "${LOGS_DIR}"/*.log 2>/dev/null || true
            success "Cleared local service log files ($LOGS_DIR/)"
        fi
        success "Persistent volumes cleanup complete"
    fi

    if [[ "$clean_images" -eq 1 ]]; then
        major_section "🖼️  Cleaning Project Container Images"
        for img in "${detected_imgs[@]}"; do
            if docker image inspect "$img" >/dev/null 2>&1; then
                if docker rmi -f "$img" >/dev/null 2>&1; then
                    success "Removed image: $img"
                else
                    warning "Could not remove image: $img (may still be referenced)"
                fi
            fi
        done

        if [[ -d "$CACHE_DIR" ]]; then
            rm -rf "$CACHE_DIR"
            success "Cleared build hash cache ($CACHE_DIR)"
        fi
        success "Container images cleanup complete"
    fi

    major_section "✨ Cleanup Complete"
    if [[ "$clean_volumes" -eq 1 && "$clean_images" -eq 1 ]]; then
        success "${PROJECT_NAME} environment completely cleaned (containers, volumes, images, cache)."
    elif [[ "$clean_volumes" -eq 1 ]]; then
        success "${PROJECT_NAME} volumes cleaned. Images preserved."
    elif [[ "$clean_images" -eq 1 ]]; then
        success "${PROJECT_NAME} images removed. Volumes preserved."
    fi
    printf '\n'
    printf '%b\n' "${BLUE}To start afresh:${NC}  ./${SCRIPT_NAME} start"
    printf '\n'
}

stop_containers() {
    local flag="${1:-}"
    case "$flag" in
        -v|--volumes|volumes|volume|vol)
            shift
            clean_environment -v "$@"
            ;;
        -i|--images|images|image|img)
            shift
            clean_environment -i "$@"
            ;;
        -a|--all|all)
            shift
            clean_environment -a "$@"
            ;;
        *)
            major_section "🛑 Stopping [${PROJECT_NAME}]"
            if "${COMPOSE[@]}" down; then
                printf '\n'
                success "All containers stopped and removed"
            else
                error "Failed to stop containers"
                exit 1
            fi
            ;;
    esac
}

recreate_containers() {
    local target_service="${1:-}"
    check_prerequisites
    validate_compose

    if [[ -n "$target_service" ]]; then
        local services=()
        while IFS= read -r line; do
            [[ -n "$line" ]] && services+=("$line")
        done < <(get_services)

        local valid=0
        for s in "${services[@]}"; do
            if [[ "$s" == "$target_service" ]]; then
                valid=1
                break
            fi
        done
        if [[ "$valid" -eq 0 ]]; then
            error "Unknown service: $target_service"
            printf '\n%s\n' "Available services: ${services[*]}" >&2
            exit 1
        fi

        major_section "🔄 Recreating Service: ${target_service}"
        if is_service_buildable "$target_service"; then
            printf '%s\n' "Rebuilding image for ${target_service}..."
            "${COMPOSE[@]}" build "$target_service"
            save_service_hash "$target_service"
        fi

        printf '%s\n' "Recreating container for ${target_service}..."
        "${COMPOSE[@]}" up -d --no-deps --force-recreate "$target_service"
        success "Container '${target_service}' recreated successfully"
        wait_for_services
    else
        check_and_prepare_services 1
        wait_for_services
    fi
}

restart_containers() {
    local target_service="${1:-}"
    if [[ -n "$target_service" ]]; then
        major_section "🔄 Restarting Service: ${target_service}"
        if is_service_buildable "$target_service" && has_code_changed "$target_service"; then
            warning "Code change detected in ${target_service}. Rebuilding and recreating container..."
            "${COMPOSE[@]}" build "$target_service"
            "${COMPOSE[@]}" up -d --no-deps --force-recreate "$target_service"
            save_service_hash "$target_service"
            success "Recreated ${target_service} container with updated code"
        else
            "${COMPOSE[@]}" restart "$target_service"
            success "Restarted ${target_service} container"
        fi
        wait_for_services
    else
        major_section "🔄 Restarting [${PROJECT_NAME}]"
        if "${COMPOSE[@]}" down; then
            success "Existing containers stopped"
        else
            error "Failed to stop existing containers"
            exit 1
        fi
        start 0
    fi
}

show_status() {
    major_section "📊 Status [${PROJECT_NAME}]"
    "${COMPOSE[@]}" ps
}

show_live_logs() {
    local service=""
    local lines=100
    local save_flag=""

    for arg in "$@"; do
        case "$arg" in
            --save|-s)
                save_flag="--save"
                ;;
            [0-9]*)
                lines="$arg"
                ;;
            -*)
                ;;
            *)
                if [[ -z "$service" ]]; then
                    service="$arg"
                fi
                ;;
        esac
    done

    mkdir -p "$LOGS_DIR"

    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)

    if [[ -z "$service" && -t 0 ]]; then
        minor_section "Select a service to view live logs:"
        local i=1
        for s in "${services[@]}"; do
            printf '  %b%d)%b %-15s\n' "${CYAN}" "$i" "${NC}" "$s"
            i=$((i + 1))
        done
        printf '  %b%d)%b %-15s\n' "${CYAN}" "$i" "${NC}" "all services"
        printf '\n%bSelect service [1-%d]:%b ' "${YELLOW}" "$i" "${NC}"
        local choice
        read -r choice
        if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 ]] && [[ "$choice" -le "${#services[@]}" ]]; then
            service="${services[$((choice - 1))]}"
        elif [[ "$choice" -eq "$i" ]]; then
            service=""
        else
            warning "Invalid choice. Streaming logs for all services..."
            service=""
        fi
    fi

    if [[ -n "$service" ]]; then
        local valid=0
        for s in "${services[@]}"; do
            if [[ "$s" == "$service" ]]; then
                valid=1
                break
            fi
        done
        if [[ "$valid" -eq 0 ]]; then
            error "Unknown service: $service"
            printf '\n%s\n' "Available services: ${services[*]}" >&2
            exit 1
        fi
    fi

    if [[ -n "$service" ]]; then
        major_section "📜 Live Logs: ${service}"
        local log_file="${LOGS_DIR}/${service}.log"
        printf '%b\n' "${CYAN}Streaming live logs for '${service}' (Press Ctrl+C to stop)...${NC}"
        if [[ "$save_flag" == "--save" ]]; then
            printf '%b\n' "${GREEN}Also saving logs to: ${log_file}${NC}\n"
            "${COMPOSE[@]}" logs -f --tail="$lines" -t "$service" 2>&1 | tee -a "$log_file"
        else
            printf '%b\n' "${BLUE}Tip: Run './${SCRIPT_NAME} live-logs ${service} --save' to also save to ${log_file}${NC}\n"
            "${COMPOSE[@]}" logs -f --tail="$lines" -t "$service"
        fi
    else
        major_section "📜 Live Logs: All Services"
        printf '%b\n' "${CYAN}Streaming live logs for all services (Press Ctrl+C to stop)...${NC}\n"
        if [[ "$save_flag" == "--save" ]]; then
            local all_log="${LOGS_DIR}/all.log"
            printf '%b\n' "${GREEN}Also saving logs to: ${all_log}${NC}\n"
            "${COMPOSE[@]}" logs -f --tail="$lines" -t 2>&1 | tee -a "$all_log"
        else
            "${COMPOSE[@]}" logs -f --tail="$lines" -t
        fi
    fi
}

start() {
    local force_recreate="${1:-0}"
    major_section "🚀 Starting Deployment [${PROJECT_NAME}]"
    check_prerequisites
    validate_compose
    check_and_prepare_services "$force_recreate"

    if [[ "${CLI_PUSH:-0}" -eq 1 ]]; then
        push_images ""
    fi

    start_containers
    wait_for_services
    show_endpoints

    printf '\n'
    printf '%b\n' "${GREEN}${CHECK} ${PROJECT_NAME} deployment completed successfully.${NC}"
    printf '\n'
    printf '%b\n' "${BLUE}💡 Live Logs Tip:${NC}  ./${SCRIPT_NAME} live-logs [service]"
    printf '%b\n' "${BLUE}💡 Push Tip:     ${NC}  ./${SCRIPT_NAME} push [service] -r <registry>"
    printf '%b\n' "${BLUE}💡 Recreate Tip: ${NC}  ./${SCRIPT_NAME} recreate [service]"
    printf '%b\n' "${BLUE}💡 Clean Tip:    ${NC}  ./${SCRIPT_NAME} clean"
}

usage() {
    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services 2>/dev/null || true)

    printf '\n'
    printf '%b\n' "${BOLD}Production Docker Compose Controller [${PROJECT_NAME}]${NC}"
    printf '%s\n' "Usage: ./$SCRIPT_NAME [OPTIONS] [COMMAND] [ARGS...]"
    printf '\n'
    printf '%b\n' "${CYAN}Global Options:${NC}"
    printf '  -f, --file <file>           Specify an alternate Compose file (default: docker-compose.yaml or docker-compose.yml)\n'
    printf '      --env-file <file>       Specify an alternate environment file (default: .env)\n'
    printf '  -p, --project-name <name>   Specify an alternate project name (default: from compose or dir)\n'
    printf '  -r, --registry <url>        Specify target Docker registry (e.g. ghcr.io/org, docker.io/user)\n'
    printf '  -t, --tag <tag>             Specify image tag(s) to push (comma-separated or repeatable)\n'
    printf '      --push                  Push images to registry during deployment (start --push)\n'
    printf '      --no-build              Skip rebuilding images before pushing\n'
    printf '      --dry-run               Preview tagging and push operations without executing\n'
    printf '      --max-wait <seconds>    Max seconds to wait for service health (default: 120)\n'
    printf '      --interval <seconds>    Polling interval for health check (default: 3)\n'
    printf '      --no-color              Disable ANSI color codes and emojis (auto-detected in non-TTY)\n'
    printf '\n'
    printf '%b\n' "${CYAN}Lifecycle Commands:${NC}"
    printf '  start                       Smart start (rebuilds and recreates only services with detected changes)\n'
    printf '  start --recreate            Force rebuild and recreate all containers\n'
    printf '  stop                        Stop and remove containers\n'
    printf '  stop -v                     Stop containers and remove project persistent volumes\n'
    printf '  restart [service]           Restart service(s) (rebuilds automatically if code changed)\n'
    printf '  recreate [service]          Force rebuild and recreate service container(s)\n'
    printf '  push [service]              Upload/push built container image(s) to Docker registry\n'
    printf '  upload [service]            Alias for push\n'
    printf '  login [registry]            Log in to Docker registry (Docker Hub, GHCR, etc.)\n'
    printf '  clean                       Safe interactive clean (containers, volumes, project images)\n'
    printf '  clean -v, --volumes         Clean project persistent Docker volumes\n'
    printf '  clean -i, --images          Remove Docker container images built for this project\n'
    printf '  clean -a, --all             Clean all: containers, persistent volumes & built images\n'
    printf '  clean -f, --force           Bypass confirmation prompt (safe for CI/CD)\n'
    printf '  purge                       Alias for clean\n'
    printf '  live-logs [svc] [n] [--save] Follow live logs (interactive menu if svc omitted, --save logs to file)\n'
    printf '  logs [service]              Alias for live-logs\n'
    printf '  status, ps                  Show service status, health, and port mappings\n'
    printf '  config, validate            Validate and display resolved Compose configuration\n'
    printf '  help                        Show this help message\n'
    printf '\n'
    if [[ "${#services[@]}" -gt 0 ]]; then
        printf '%b\n' "${CYAN}Discovered Services in Compose:${NC}"
        for s in "${services[@]}"; do
            s="${s//$'\r'/}"
            [[ -z "$s" ]] && continue
            local b_flag="(pre-built)"
            if is_service_buildable "$s"; then
                b_flag="(buildable: ${SVC_CONTEXT[$s]:-.})"
            fi
            printf '  • %-18s %s\n' "$s" "$b_flag"
        done
        printf '\n'
    fi
}

show_config() {
    check_prerequisites 0
    validate_compose
    major_section "📋 Resolved Services & Configuration"
    init_services_metadata
    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)
    for s in "${services[@]}"; do
        printf 'Service: %-15s | Buildable: %s | Image: %-25s | Ports: %s\n' \
            "$s" "${SVC_IS_BUILDABLE[$s]:-0}" "$(get_service_image "$s")" "${SVC_PORTS[$s]:-none}"
    done
}

PARAM1="${ARGS[0]:-}"

case "$COMMAND" in
    start)
        if [[ "$PARAM1" == "--recreate" || "$PARAM1" == "-r" || "$PARAM1" == "--build" ]]; then
            start 1
        else
            start 0
        fi
        ;;
    stop)
        check_prerequisites
        stop_containers "${ARGS[@]+"${ARGS[@]}"}"
        ;;
    restart)
        check_prerequisites
        restart_containers "$PARAM1"
        ;;
    recreate|rebuild)
        check_prerequisites
        recreate_containers "$PARAM1"
        ;;
    push|upload)
        for a in "${ARGS[@]+"${ARGS[@]}"}"; do
            if [[ "$a" == "-h" || "$a" == "--help" || "$a" == "help" ]]; then
                printf 'Usage: %s push [service] [-r|--registry <url>] [-t|--tag <tag>] [--no-build] [--dry-run]\n' "$SCRIPT_NAME"
                exit 0
            fi
        done
        check_prerequisites
        validate_compose
        push_images "$PARAM1"
        ;;
    login)
        target_reg="${PARAM1:-}"
        if [[ -z "$target_reg" ]]; then
            target_reg="$(detect_registry || true)"
        fi
        if [[ -n "$target_reg" ]]; then
            reg_domain="${target_reg%%/*}"
            if [[ "$reg_domain" =~ [.:] ]]; then
                printf '%bLogging in to registry:%b %s\n' "${CYAN}" "${NC}" "$reg_domain"
                docker login "$reg_domain"
            else
                printf '%bLogging in to Docker Hub...%b\n' "${CYAN}" "${NC}"
                docker login
            fi
        else
            printf '%bLogging in to Docker Hub...%b\n' "${CYAN}" "${NC}"
            docker login
        fi
        ;;
    clean|purge|prune)
        for a in "${ARGS[@]+"${ARGS[@]}"}"; do
            if [[ "$a" == "-h" || "$a" == "--help" || "$a" == "help" ]]; then
                clean_environment -h
                exit 0
            fi
        done
        check_prerequisites
        clean_environment "${ARGS[@]+"${ARGS[@]}"}"
        ;;
    status|ps)
        check_prerequisites
        show_status
        ;;
    live-logs|live_logs|livestats|logs)
        for a in "${ARGS[@]+"${ARGS[@]}"}"; do
            if [[ "$a" == "-h" || "$a" == "--help" || "$a" == "help" ]]; then
                printf 'Usage: %s live-logs [service] [lines] [--save]\n' "$SCRIPT_NAME"
                exit 0
            fi
        done
        check_prerequisites
        show_live_logs "${ARGS[@]+"${ARGS[@]}"}"
        ;;
    config|validate)
        show_config
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        error "Unknown command: $COMMAND"
        usage
        exit 1
        ;;
esac
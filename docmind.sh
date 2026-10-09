#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(dirname -- "${BASH_SOURCE[0]}")"
cd -- "$SCRIPT_DIR" || exit 1

COMPOSE=(docker compose --env-file .env)
CACHE_DIR=".docmind_cache"
LOGS_DIR="logs"

MAX_WAIT=120
INTERVAL=3

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECK="✓"
CROSS="✗"
WARNING="⚠"
WAIT="⏳"

success() {
    printf '%b\n' "${GREEN}${CHECK} $1${NC}"
}

error() {
    printf '%b\n' "${RED}${CROSS} $1${NC}"
}

warning() {
    printf '%b\n' "${YELLOW}${WARNING} $1${NC}"
}

major_section() {
    local title="$1"
    printf '\n'
    printf '%b\n' "${CYAN}${title}${NC}"
}

minor_section() {
    local title="$1"
    printf '\n'
    printf '%b\n' "${BLUE}${title}${NC}"
}

get_services() {
    local services_list
    if services_list="$("${COMPOSE[@]}" config --services 2>/dev/null)" && [[ -n "$services_list" ]]; then
        printf '%s\n' "$services_list"
    else
        printf '%s\n' "postgres" "qdrant" "backend" "frontend" "nginx"
    fi
}

get_buildable_services() {
    printf '%s\n' "backend" "frontend" "nginx"
}

check_prerequisites() {
    minor_section "Checking Environment"
    if [[ ! -f ".env" ]]; then
        error ".env file not found"
        exit 1
    fi
    success ".env found"

    minor_section "Checking Docker"
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker is not installed"
        exit 1
    fi
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running"
        exit 1
    fi
    success "Docker is running"
}

validate_compose() {
    major_section "🔍 Validating Configuration"
    local compose_output
    if compose_output="$("${COMPOSE[@]}" config 2>&1)"; then
        success "Docker Compose configuration is valid"
    else
        error "Docker Compose configuration is invalid"
        printf '\n%s\n' "$compose_output"
        exit 1
    fi
}

compute_service_hash() {
    local service="$1"
    local tmp_file
    tmp_file="$(mktemp 2>/dev/null || printf '/tmp/docmind_hash_%s_%s' "$service" "$$")"

    case "$service" in
        backend)
            if [[ -d "backend/doc-mind/src" ]]; then
                find backend/doc-mind/src -type f -exec sha256sum {} + >> "$tmp_file" 2>/dev/null
            fi
            for f in backend/doc-mind/build.gradle backend/doc-mind/settings.gradle backend/doc-mind/Dockerfile backend/doc-mind/gradle.properties; do
                [[ -f "$f" ]] && sha256sum "$f" >> "$tmp_file" 2>/dev/null
            done
            ;;
        frontend)
            if [[ -d "frontend/doc-mind/src" ]]; then
                find frontend/doc-mind/src -type f -exec sha256sum {} + >> "$tmp_file" 2>/dev/null
            fi
            for f in frontend/doc-mind/package.json frontend/doc-mind/package-lock.json frontend/doc-mind/vite.config.ts frontend/doc-mind/tsconfig*.json frontend/doc-mind/index.html frontend/doc-mind/Dockerfile; do
                [[ -f "$f" ]] && sha256sum "$f" >> "$tmp_file" 2>/dev/null
            done
            ;;
        nginx)
            if [[ -d "nginx" ]]; then
                find nginx -type f -exec sha256sum {} + >> "$tmp_file" 2>/dev/null
            fi
            ;;
        *)
            rm -f "$tmp_file"
            printf ''
            return
            ;;
    esac

    # Factor in environment and compose definition if present
    [[ -f ".env" ]] && sha256sum ".env" >> "$tmp_file" 2>/dev/null
    [[ -f "docker-compose.yaml" ]] && sha256sum "docker-compose.yaml" >> "$tmp_file" 2>/dev/null

    local hash=""
    if [[ -s "$tmp_file" ]]; then
        if command -v sha256sum >/dev/null 2>&1; then
            hash="$(sort "$tmp_file" 2>/dev/null | sha256sum | cut -d' ' -f1)"
        elif command -v md5sum >/dev/null 2>&1; then
            hash="$(sort "$tmp_file" 2>/dev/null | md5sum | cut -d' ' -f1)"
        fi
    fi
    rm -f "$tmp_file"
    printf '%s' "$hash"
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

    local buildable_services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && buildable_services+=("$line")
    done < <(get_buildable_services)

    local services_to_rebuild=()
    local services_to_recreate=()

    for service in "${buildable_services[@]}"; do
        local image_name="docmind-${service}:latest"
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
            services_to_rebuild+=("$service")
            services_to_recreate+=("$service")
        elif [[ "$image_exists" -eq 0 ]]; then
            warning "$service: Docker image '$image_name' not found (build required)"
            services_to_rebuild+=("$service")
            services_to_recreate+=("$service")
        elif [[ "$code_changed" -eq 1 ]]; then
            warning "$service: Source code changes detected (rebuild & recreate required)"
            services_to_rebuild+=("$service")
            services_to_recreate+=("$service")
        elif [[ "$container_exists" -eq 0 ]]; then
            success "$service: Image up to date (container will be created)"
            services_to_recreate+=("$service")
        else
            success "$service: Code & image up to date"
        fi
    done

    # Check non-buildable pre-built images (postgres, qdrant)
    local all_services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && all_services+=("$line")
    done < <(get_services)

    for service in "${all_services[@]}"; do
        local is_buildable=0
        for bs in "${buildable_services[@]}"; do
            [[ "$service" == "$bs" ]] && is_buildable=1 && break
        done
        if [[ "$is_buildable" -eq 0 ]]; then
            local container_id
            container_id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || printf '')"
            if [[ -z "$container_id" ]]; then
                services_to_recreate+=("$service")
            fi
        fi
    done

    # Rebuild images if any code changed or images are missing
    if [[ "${#services_to_rebuild[@]}" -gt 0 ]]; then
        major_section "🔨 Building Docker Images (${services_to_rebuild[*]})"
        local build_log
        local build_pid
        local frame=0
        local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
        build_log="$(mktemp 2>/dev/null || printf '/tmp/docmind_build_%s.log' "$$")"

        ("${COMPOSE[@]}" build "${services_to_rebuild[@]}") >"$build_log" 2>&1 &
        build_pid=$!

        while kill -0 "$build_pid" 2>/dev/null; do
            printf '\r%b' "${CYAN}${frames[$frame]} Compiling and building [${services_to_rebuild[*]}]${NC}"
            frame=$(( (frame + 1) % ${#frames[@]} ))
            sleep 0.1
        done

        if wait "$build_pid"; then
            printf '\r\033[K'
            success "Docker images built successfully"
            for service in "${services_to_rebuild[@]}"; do
                save_service_hash "$service"
            done
        else
            printf '\r\033[K'
            error "Docker image build failed"
            printf '\n'
            cat "$build_log"
            rm -f "$build_log"
            exit 1
        fi
        rm -f "$build_log"
    fi

    # Recreate containers where code changed or container is missing
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
    major_section "⏳ Checking Services"
    printf '%s\n' "Waiting for services to become healthy..."
    
    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)

    declare -A service_status
    local start_time
    local current_time
    local elapsed
    local service
    local container
    local info
    local status
    local health
    local frame=0
    local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

    start_time="$(date +%s)"
    while true; do
        local all_done=1
        local failed_found=0
        current_time="$(date +%s)"
        elapsed=$((current_time - start_time))

        printf '\r%b' "${CYAN}${frames[$frame]} Checking service health... (${elapsed}s / ${MAX_WAIT}s)${NC}"
        frame=$(( (frame + 1) % ${#frames[@]} ))

        for service in "${services[@]}"; do
            container="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null)"
            if [[ -z "$container" ]]; then
                service_status["$service"]="not_found"
                all_done=0
                continue
            fi
            
            info="$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null)"
            status="${info%%|*}"
            health="${info#*|}"

            if [[ "$status" != "running" ]]; then
                service_status["$service"]="failed"
                failed_found=1
            elif [[ "$health" == "healthy" ]]; then
                service_status["$service"]="healthy"
            elif [[ "$health" == "unhealthy" ]]; then
                service_status["$service"]="unhealthy"
                failed_found=1
            elif [[ "$health" == "starting" ]]; then
                service_status["$service"]="starting"
                all_done=0
            elif [[ "$health" == "none" ]]; then
                service_status["$service"]="running"
            else
                service_status["$service"]="starting"
                all_done=0
            fi
        done

        if [[ "$failed_found" -eq 1 || "$all_done" -eq 1 ]]; then
            break
        fi

        if [[ "$elapsed" -ge "$MAX_WAIT" ]]; then
            printf '\r\033[K'
            warning "Service health check timed out after ${MAX_WAIT}s"
            break
        fi

        sleep "$INTERVAL"
    done
    printf '\r\033[K'

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
            starting)
                printf '%b\n' "${YELLOW}${WAIT} Starting${NC}"
                failed=1
                ;;
            unhealthy)
                printf '%b\n' "${RED}${CROSS} Unhealthy${NC}"
                failed=1
                ;;
            failed)
                printf '%b\n' "${RED}${CROSS} Failed${NC}"
                failed=1
                ;;
            not_found)
                printf '%b\n' "${RED}${CROSS} Not Found${NC}"
                failed=1
                ;;
            *)
                printf '%b\n' "${RED}${CROSS} Unknown${NC}"
                failed=1
                ;;
        esac
    done
    if [[ "$failed" -ne 0 ]]; then
        printf '\n'
        error "Some services are not healthy"
        printf '\n'
        printf '%s\n' "Check live logs with:"
        printf '%b\n' "${CYAN}./docmind.sh live-logs <service>${NC}"
        printf '\n'
        exit 1
    fi
}

clean_environment() {
    local clean_volumes=0
    local clean_images=0
    local force=0

    # Parse arguments
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
                printf '\n%s\n' "Usage: $0 clean [options]"
                printf 'Options:\n'
                printf '  -a, --all, all           Clean both persistent volumes and container images\n'
                printf '  -v, --volumes, volumes   Clean all persistent Docker volumes (resets DB & vector store)\n'
                printf '  -i, --images, images     Remove all Docker container images (docmind-*, postgres, qdrant)\n'
                printf '  -f, --force, force       Skip confirmation prompt\n\n'
                return 0
                ;;
            *)
                error "Unknown clean option: $1"
                printf 'Usage: %s clean [-v|--volumes] [-i|--images] [-a|--all] [-f|--force]\n' "$0"
                exit 1
                ;;
        esac
    done

    # If neither -v nor -i was specified
    if [[ "$clean_volumes" -eq 0 && "$clean_images" -eq 0 ]]; then
        if [[ "$force" -eq 1 ]]; then
            clean_volumes=1
            clean_images=1
        elif [[ -t 0 ]]; then
            major_section "🧹 DocMind Clean & Purge"
            minor_section "Select cleanup scope:"
            printf '  %b1)%b All (Containers + Persistent Volumes + Container Images + Cache)\n' "${CYAN}" "${NC}"
            printf '  %b2)%b Volumes only (Reset PostgreSQL, Qdrant, Redis data & logs)\n' "${CYAN}" "${NC}"
            printf '  %b3)%b Container Images only (Remove DocMind & base images)\n' "${CYAN}" "${NC}"
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
            # Non-interactive without specific target: clean all
            clean_volumes=1
            clean_images=1
        fi
    fi

    # Confirmation prompt if force not specified
    if [[ "$force" -eq 0 ]]; then
        major_section "⚠️  DocMind Clean Confirmation"
        printf '%b\n' "${YELLOW}The following actions will be performed:${NC}"
        printf '  • Stop and remove running DocMind containers\n'
        if [[ "$clean_volumes" -eq 1 ]]; then
            printf '  • %bPERMANENTLY DELETE all persistent volumes%b:\n' "${RED}" "${NC}"
            printf '      - docmind_postgres_data (PostgreSQL database)\n'
            printf '      - docmind_qdrant_data   (Qdrant vector store)\n'
            printf '      - docmind_redis_data    (Redis cache)\n'
            printf '      - docmind_backend_logs  (Application logs)\n'
        fi
        if [[ "$clean_images" -eq 1 ]]; then
            printf '  • %bRemove all container images%b:\n' "${RED}" "${NC}"
            printf '      - docmind-backend:latest\n'
            printf '      - docmind-frontend:latest\n'
            printf '      - docmind-nginx:latest\n'
            printf '      - postgres:18-alpine\n'
            printf '      - qdrant/qdrant:latest\n'
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
            warning "Running in non-interactive shell without --force. Aborting to prevent accidental data loss."
            printf 'Run with: %s clean --force (or -f) to bypass confirmation.\n' "$0"
            exit 1
        fi
    fi

    major_section "🛑 Stopping & Removing Containers"
    local compose_args=("--remove-orphans")
    if [[ "$clean_volumes" -eq 1 ]]; then
        compose_args+=("-v")
    fi
    if [[ "$clean_images" -eq 1 ]]; then
        compose_args+=("--rmi" "all")
    fi

    "${COMPOSE[@]}" down "${compose_args[@]}" 2>/dev/null || true
    success "DocMind containers stopped"

    if [[ "$clean_volumes" -eq 1 ]]; then
        major_section "🗑️  Cleaning Persistent Volumes"
        local volumes=(
            "docmind_postgres_data"
            "docmind_qdrant_data"
            "docmind_redis_data"
            "docmind_backend_logs"
        )
        for vol in "${volumes[@]}"; do
            if docker volume inspect "$vol" >/dev/null 2>&1; then
                if docker volume rm -f "$vol" >/dev/null 2>&1; then
                    success "Removed volume: $vol"
                else
                    warning "Could not remove volume: $vol (may still be in use)"
                fi
            else
                printf '%s\n' "Volume '$vol' already cleaned or does not exist"
            fi
        done
        if [[ -d "$LOGS_DIR" ]]; then
            rm -f "${LOGS_DIR}"/*.log 2>/dev/null || true
            success "Cleared local service log files ($LOGS_DIR/)"
        fi
        success "All DocMind persistent volumes cleaned"
    fi

    if [[ "$clean_images" -eq 1 ]]; then
        major_section "🖼️  Cleaning Container Images"
        local images=(
            "docmind-backend:latest"
            "docmind-frontend:latest"
            "docmind-nginx:latest"
            "postgres:18-alpine"
            "qdrant/qdrant:latest"
        )
        for img in "${images[@]}"; do
            if docker image inspect "$img" >/dev/null 2>&1; then
                if docker rmi -f "$img" >/dev/null 2>&1; then
                    success "Removed image: $img"
                else
                    warning "Could not remove image: $img (may still be referenced)"
                fi
            else
                printf '%s\n' "Image '$img' already cleaned or does not exist"
            fi
        done

        if [[ -d "$CACHE_DIR" ]]; then
            rm -rf "$CACHE_DIR"
            success "Cleared build hash cache ($CACHE_DIR)"
        fi
        success "All DocMind container images removed"
    fi

    major_section "✨ Cleanup Complete"
    if [[ "$clean_volumes" -eq 1 && "$clean_images" -eq 1 ]]; then
        success "DocMind environment completely cleaned (containers, volumes, images, cache)."
    elif [[ "$clean_volumes" -eq 1 ]]; then
        success "DocMind volumes cleaned. Images were preserved."
    elif [[ "$clean_images" -eq 1 ]]; then
        success "DocMind container images removed. Volumes were preserved."
    fi
    printf '\n'
    printf '%b\n' "${BLUE}To start DocMind afresh:${NC}  ./docmind.sh start"
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
            major_section "🛑 Stopping DocMind"
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
            [[ "$s" == "$target_service" ]] && valid=1 && break
        done
        if [[ "$valid" -eq 0 ]]; then
            error "Unknown service: $target_service"
            printf '\n%s\n' "Available services: ${services[*]}"
            exit 1
        fi

        major_section "🔄 Recreating Service: ${target_service}"
        local is_buildable=0
        for bs in "backend" "frontend" "nginx"; do
            [[ "$target_service" == "$bs" ]] && is_buildable=1 && break
        done

        if [[ "$is_buildable" -eq 1 ]]; then
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
        local is_buildable=0
        for bs in "backend" "frontend" "nginx"; do
            [[ "$target_service" == "$bs" ]] && is_buildable=1 && break
        done

        if [[ "$is_buildable" -eq 1 ]] && has_code_changed "$target_service"; then
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
        major_section "🔄 Restarting DocMind"
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
    major_section "📊 DocMind Status"
    "${COMPOSE[@]}" ps
}

show_live_logs() {
    local service="${1:-}"
    local lines="${2:-100}"
    local save_flag="${3:-}"

    mkdir -p "$LOGS_DIR"

    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)

    if [[ -z "$service" ]]; then
        if [[ -t 0 ]]; then
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
    fi

    if [[ -n "$service" ]]; then
        local valid=0
        for s in "${services[@]}"; do
            [[ "$s" == "$service" ]] && valid=1 && break
        done
        if [[ "$valid" -eq 0 ]]; then
            error "Unknown service: $service"
            printf '\n%s\n' "Available services:"
            for s in "${services[@]}"; do
                printf '  %s\n' "$s"
            done
            exit 1
        fi
    fi

    if [[ -n "$lines" ]]; then
        if ! [[ "$lines" =~ ^[0-9]+$ ]] || [[ "$lines" -eq 0 ]]; then
            if [[ "$lines" == "--save" || "$lines" == "-s" ]]; then
                save_flag="--save"
                lines=100
            else
                error "Log limit must be a positive number"
                exit 1
            fi
        fi
    fi

    if [[ -n "$service" ]]; then
        major_section "📜 Live Logs: ${service}"
        local log_file="${LOGS_DIR}/${service}.log"
        printf '%b\n' "${CYAN}Streaming live logs for '${service}' (Press Ctrl+C to stop)...${NC}"
        if [[ "$save_flag" == "--save" || "$save_flag" == "-s" ]]; then
            printf '%b\n' "${GREEN}Also saving logs to: ${log_file}${NC}\n"
            "${COMPOSE[@]}" logs -f --tail="$lines" -t "$service" 2>&1 | tee -a "$log_file"
        else
            printf '%b\n' "${BLUE}Tip: Run './docmind.sh live-logs ${service} --save' to also save to ${log_file}${NC}\n"
            "${COMPOSE[@]}" logs -f --tail="$lines" -t "$service"
        fi
    else
        major_section "📜 Live Logs: All Services"
        printf '%b\n' "${CYAN}Streaming live logs for all services (Press Ctrl+C to stop)...${NC}\n"
        "${COMPOSE[@]}" logs -f --tail="$lines" -t
    fi
}

start() {
    local force_recreate="${1:-0}"
    major_section "🚀 Starting DocMind"
    check_prerequisites
    validate_compose
    check_and_prepare_services "$force_recreate"
    start_containers
    wait_for_services

    major_section "🌐 DocMind Services"
    printf '%-10s : %s\n' "Nginx" "https://localhost (HTTP: http://localhost)"
    printf '%-10s : %s\n' "Frontend" "http://localhost:5173"
    printf '%-10s : %s\n' "Backend" "http://localhost:8080"
    printf '%-10s : %s\n' "Swagger" "http://localhost:8080/swagger-ui/index.html"
    printf '%-10s : %s\n' "Qdrant" "http://localhost:6333/dashboard"
    printf '\n'
    printf '%b\n' "${GREEN}${CHECK} DocMind is successfully up and running.${NC}"
    printf '\n'
    printf '%b\n' "${BLUE}💡 Live Logs Tip:${NC}  ./docmind.sh live-logs <service>   (e.g., ./docmind.sh live-logs backend)"
    printf '%b\n' "${BLUE}💡 Recreate Tip: ${NC}  ./docmind.sh recreate <service>    (e.g., ./docmind.sh recreate frontend)"
    printf '%b\n' "${BLUE}💡 Clean Tip:    ${NC}  ./docmind.sh clean                 (clean volumes / container images)"
}

usage() {
    local services=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && services+=("$line")
    done < <(get_services)

    printf '\n'
    printf '%s\n' "Usage:"
    printf '  %s\n' "$0 start                     Start services (recreates containers if code changed)"
    printf '  %s\n' "$0 start --recreate          Force rebuild and recreate all containers"
    printf '  %s\n' "$0 stop                      Stop and remove containers"
    printf '  %s\n' "$0 stop -v                   Stop containers and remove all persistent volumes"
    printf '  %s\n' "$0 restart [service]         Restart services (recreates if code changed)"
    printf '  %s\n' "$0 recreate [service]        Force rebuild and recreate container(s)"
    printf '  %s\n' "$0 clean                     Interactive clean (containers, volumes, images)"
    printf '  %s\n' "$0 clean -v, --volumes       Clean persistent Docker volumes (resets DB & vectors)"
    printf '  %s\n' "$0 clean -i, --images        Remove all Docker container images"
    printf '  %s\n' "$0 clean -a, --all           Clean all: containers, persistent volumes & images"
    printf '  %s\n' "$0 clean -f, --force         Bypass confirmation prompt (can combine: clean -a -f)"
    printf '  %s\n' "$0 purge                     Alias for clean"
    printf '  %s\n' "$0 live-logs [service]       Follow live logs per service (with timestamps)"
    printf '  %s\n' "$0 live-logs <svc> --save    Follow live logs and append to logs/<service>.log"
    printf '  %s\n' "$0 logs [service] [lines]    Follow service logs (alias for live-logs)"
    printf '  %s\n' "$0 status                    Show service status and health"
    printf '  %s\n' "$0 help                      Show this help message"
    printf '\n'
    printf '%s\n' "Services:"
    for s in "${services[@]}"; do
        printf '  %s\n' "$s"
    done
    printf '\n'
}

COMMAND="${1:-start}"
PARAM1="${2:-}"
PARAM2="${3:-}"
PARAM3="${4:-}"
[[ $# -gt 0 ]] && shift

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
        stop_containers "$@"
        ;;
    restart)
        check_prerequisites
        restart_containers "$PARAM1"
        ;;
    recreate|rebuild)
        check_prerequisites
        recreate_containers "$PARAM1"
        ;;
    clean|purge|prune)
        check_prerequisites
        clean_environment "$@"
        ;;
    status)
        check_prerequisites
        show_status
        ;;
    live-logs|live_logs|livestats)
        check_prerequisites
        show_live_logs "$PARAM1" "$PARAM2" "$PARAM3"
        ;;
    logs)
        check_prerequisites
        show_live_logs "$PARAM1" "$PARAM2" "$PARAM3"
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
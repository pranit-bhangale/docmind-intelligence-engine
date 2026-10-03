/**
 * Utility functions for role formatting and authority checks.
 */

/**
 * Formats backend role authority string (e.g. ROLE_PLATFORM_ADMIN) into a clean, human-readable label.
 *
 * Mappings:
 * - ROLE_PLATFORM_ADMIN / ROLE_SUPER_ADMIN -> "Platform Admin"
 * - ROLE_COMPANY_ADMIN -> "Company Admin"
 * - ROLE_ADMIN -> "Admin"
 * - ROLE_USER -> "User"
 */
export function formatRoleLabel(roleName?: string): string {
  if (!roleName) return 'User';
  const norm = roleName.toUpperCase().trim();

  if (norm === 'ROLE_PLATFORM_ADMIN' || norm === 'PLATFORM_ADMIN') {
    return 'Platform Admin';
  }
  if (norm === 'ROLE_COMPANY_ADMIN' || norm === 'COMPANY_ADMIN') {
    return 'Company Admin';
  }
  if (norm === 'ROLE_ADMIN' || norm === 'ADMIN') {
    return 'Admin';
  }
  if (norm === 'ROLE_USER' || norm === 'USER') {
    return 'User';
  }

  // Fallback title-casing for custom or newly added roles
  return norm
    .replace('ROLE_', '')
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

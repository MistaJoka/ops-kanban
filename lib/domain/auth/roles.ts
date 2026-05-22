export const ORG_ROLES = ['owner', 'manager', 'worker', 'viewer'] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export const WRITE_ROLES: OrgRole[] = ['owner', 'manager', 'worker'];
export const ADMIN_ROLES: OrgRole[] = ['owner', 'manager'];
export const OWNER_ONLY: OrgRole[] = ['owner'];

export function canCreateCard(role: OrgRole): boolean {
  return role !== 'viewer';
}

export function canMoveCard(role: OrgRole): boolean {
  return role !== 'viewer';
}

export function canManageMoney(role: OrgRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canArchiveCard(role: OrgRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canDeleteCard(role: OrgRole): boolean {
  return ADMIN_ROLES.includes(role);
}

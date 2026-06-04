export type Role = 'admin' | 'pharmacist' | 'cashier';

export interface UserLike {
  role: Role;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  pharmacist: 'Pharmacist',
  cashier: 'Cashier',
};

export const NAV_PERMISSIONS = {
  dashboard: ['admin', 'pharmacist', 'cashier'],
  medicines: ['admin', 'pharmacist'],
  pos: ['admin', 'cashier'],
  customers: ['admin', 'cashier'],
  suppliers: ['admin'],
  users: ['admin'],
  reports: ['admin', 'pharmacist', 'cashier'],
} as const satisfies Record<string, Role[]>;

export const REPORT_TAB_PERMISSIONS = {
  'low-stock': ['admin', 'pharmacist'],
  'near-expiry': ['admin', 'pharmacist'],
  'daily-sales': ['admin', 'pharmacist', 'cashier'],
} as const satisfies Record<string, Role[]>;

export type ReportTabId = keyof typeof REPORT_TAB_PERMISSIONS;

export function hasRoleAccess(user: UserLike | null | undefined, allowedRoles: readonly Role[]) {
  return !!user && allowedRoles.includes(user.role);
}

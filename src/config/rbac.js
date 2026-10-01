// Single source of truth for Role Based Access Control.
// Permission format: "resource:action". Roles map to a list of permissions.
// The admin panel receives the same list from /api/auth/me so the UI and API always agree.

export const PERMISSIONS = {
  'dashboard:view': 'See the dashboard',
  'dashboard:finance': 'See fee numbers on the dashboard',
  'batches:view': 'View batches',
  'batches:manage': 'Create and edit batches',
  'batches:delete': 'Delete batches',
  'students:view': 'View students',
  'students:create': 'Admit students',
  'students:update': 'Edit students',
  'students:delete': 'Delete students',
  'students:export': 'Export student list',
  'attendance:view': 'View attendance',
  'attendance:mark': 'Mark and edit attendance',
  'fees:view': 'View fee details and payments',
  'fees:collect': 'Collect fees',
  'fees:receipt': 'Print receipts',
  'fees:dues': 'See pending fees list',
  'fees:delete': 'Delete payments',
  'enquiries:view': 'View enquiries',
  'enquiries:update': 'Update enquiry status',
  'enquiries:delete': 'Delete enquiries',
  'users:view': 'View staff accounts',
  'users:manage': 'Create staff, change roles, disable, reset passwords',
};

const ALL = Object.keys(PERMISSIONS);

export const ROLES = {
  admin: {
    label: 'Admin',
    description: 'Owner. Full access including staff accounts.',
    permissions: ALL,
  },
  manager: {
    label: 'Manager',
    description: 'Runs the centre. Everything except staff accounts and deleting payments.',
    permissions: ALL.filter((p) => !p.startsWith('users:') && p !== 'fees:delete'),
  },
  accountant: {
    label: 'Accountant',
    description: 'Fees and money only. Cannot edit students or attendance.',
    permissions: [
      'dashboard:view', 'dashboard:finance', 'batches:view', 'students:view', 'students:export',
      'fees:view', 'fees:collect', 'fees:receipt', 'fees:dues',
    ],
  },
  teacher: {
    label: 'Teacher',
    description: 'Attendance and student lists. No fee details.',
    permissions: ['dashboard:view', 'batches:view', 'students:view', 'attendance:view', 'attendance:mark'],
  },
  receptionist: {
    label: 'Receptionist',
    description: 'Front desk. Admissions, enquiries and collecting fees. Cannot delete.',
    permissions: [
      'dashboard:view', 'batches:view', 'students:view', 'students:create', 'students:update',
      'attendance:view', 'enquiries:view', 'enquiries:update',
      'fees:view', 'fees:collect', 'fees:receipt', 'fees:dues',
    ],
  },
};

// Old accounts created before RBAC had role "staff"; treat them as receptionist.
export const normalizeRole = (role) => (ROLES[role] ? role : role === 'staff' ? 'receptionist' : null);
export const ROLE_KEYS = Object.keys(ROLES);

export const permissionsFor = (role) => ROLES[normalizeRole(role)]?.permissions ?? [];
export const hasPermission = (role, perm) => permissionsFor(role).includes(perm);

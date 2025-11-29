/**
 * Role-Based Access Control Configuration
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'], // All permissions
  [ROLES.ADMIN]: [
    'users:read',
    'users:update',
    'listings:read',
    'listings:update',
    'listings:delete',
    'bookings:read',
    'analytics:read'
  ],
  [ROLES.MODERATOR]: [
    'users:read',
    'listings:read',
    'listings:update'
  ]
};

const hasPermission = (role, permission) => {
  const rolePermissions = PERMISSIONS[role] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  hasPermission
};


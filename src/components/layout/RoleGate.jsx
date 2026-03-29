import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const ROLE_HIERARCHY = {
  unverified: 0,
  householdMember: 1,
  householdAdmin: 2,
  blockCaptain: 3,
  neighborhoodCaptain: 4,
  cityCountyCaptain: 5,
};

/**
 * RoleGate protects routes by requiring a minimum role level.
 * Firestore security rules are the primary access control — this is UX only.
 *
 * @param {object} props
 * @param {string} props.minRole - Minimum role required
 * @param {string[]} [props.allowedRoles] - If set, only these exact roles are allowed
 * @param {string} [props.redirectTo] - Where to redirect if denied (default: '/')
 * @param {React.ReactNode} props.children
 */
export function RoleGate({ minRole, allowedRoles, redirectTo = '/', children }) {
  const role = useAuthStore((s) => s.role);

  if (!role) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (allowedRoles) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to={redirectTo} replace />;
    }
    return children;
  }

  if (minRole) {
    const userLevel = ROLE_HIERARCHY[role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 999;
    if (userLevel < requiredLevel) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
}

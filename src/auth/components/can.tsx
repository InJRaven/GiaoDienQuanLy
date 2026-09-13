import { ReactNode } from 'react';
import { useAuth } from '@/auth/context/auth-context';

export interface CanProps {
  permission?: string;
  role?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Declarative component for UI authorization based on permissions and roles
 * Usage:
 *   <Can permission="payroll:approve">
 *     <ApproveButton />
 *   </Can>
 */
export function Can({
  permission,
  role,
  anyPermissions,
  allPermissions,
  fallback = null,
  children,
}: CanProps) {
  const { can, hasRole, hasAnyPermission, hasAllPermissions } = useAuth();

  let isAllowed = true;

  if (permission && !can(permission)) {
    isAllowed = false;
  }

  if (role && !hasRole(role)) {
    isAllowed = false;
  }

  if (anyPermissions && !hasAnyPermission(anyPermissions)) {
    isAllowed = false;
  }

  if (allPermissions && !hasAllPermissions(allPermissions)) {
    isAllowed = false;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

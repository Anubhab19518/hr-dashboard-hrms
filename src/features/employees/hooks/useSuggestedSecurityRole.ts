import { useMemo } from 'react';
import type { SecurityRole } from '../types/employee-iam';

/**
 * Mapping of HR Job Role titles to suggested Security Role codes.
 * HR Job Role (organizational designation) != Security Role (RBAC permission bundle).
 */
const JOB_ROLE_TO_SECURITY_ROLE_MAP: Record<string, string> = {
  'hr executive': 'HR_EXECUTIVE',
  'hr manager': 'HR_ADMIN',
  'human resources executive': 'HR_EXECUTIVE',
  'human resources manager': 'HR_ADMIN',
  'site supervisor': 'ATTENDANCE_MANAGER',
  supervisor: 'ATTENDANCE_MANAGER',
  'field supervisor': 'ATTENDANCE_MANAGER',
  'payroll officer': 'PAYROLL_ADMIN',
  'payroll manager': 'PAYROLL_ADMIN',
  'payroll specialist': 'PAYROLL_ADMIN',
  'inventory incharge': 'SCM_ADMIN',
  'inventory manager': 'SCM_ADMIN',
  'store manager': 'SCM_ADMIN',
  'warehouse manager': 'SCM_ADMIN',
  'security guard': 'EMPLOYEE',
  'security officer': 'EMPLOYEE',
  'field worker': 'EMPLOYEE',
  staff: 'EMPLOYEE',
  employee: 'EMPLOYEE',
};

/**
 * Hook to suggest a default Security Role based on the selected HR Job Role title.
 */
export function useSuggestedSecurityRole(
  jobRoleTitle?: string,
  availableRoles: SecurityRole[] = [],
): SecurityRole | null {
  return useMemo(() => {
    if (!jobRoleTitle || !jobRoleTitle.trim()) {
      return availableRoles.find((r) => r.code === 'EMPLOYEE') ?? null;
    }

    const normalized = jobRoleTitle.trim().toLowerCase();
    const targetCode = JOB_ROLE_TO_SECURITY_ROLE_MAP[normalized] ?? 'EMPLOYEE';

    return (
      availableRoles.find((r) => r.code.toUpperCase() === targetCode.toUpperCase()) ??
      availableRoles.find((r) => r.code === 'EMPLOYEE') ??
      availableRoles[0] ??
      null
    );
  }, [jobRoleTitle, availableRoles]);
}

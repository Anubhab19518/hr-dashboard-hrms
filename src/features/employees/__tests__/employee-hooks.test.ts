import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuggestedSecurityRole } from '../hooks/useSuggestedSecurityRole';
import type { SecurityRole } from '../types/employee-iam';

const mockRoles: SecurityRole[] = [
  {
    id: '1',
    name: 'Employee',
    code: 'EMPLOYEE',
    isSystem: true,
    description: 'Employee self-service',
  },
  { id: '2', name: 'HR Admin', code: 'HR_ADMIN', isSystem: true, description: 'HR Admin' },
  {
    id: '3',
    name: 'HR Executive',
    code: 'HR_EXECUTIVE',
    isSystem: true,
    description: 'HR Executive',
  },
  {
    id: '4',
    name: 'Attendance Manager',
    code: 'ATTENDANCE_MANAGER',
    isSystem: true,
    description: 'Attendance Manager',
  },
  {
    id: '5',
    name: 'Payroll Admin',
    code: 'PAYROLL_ADMIN',
    isSystem: true,
    description: 'Payroll Admin',
  },
];

describe('useSuggestedSecurityRole Hook', () => {
  it('defaults to EMPLOYEE when job role title is empty or missing', () => {
    const { result } = renderHook(() => useSuggestedSecurityRole('', mockRoles));
    expect(result.current?.code).toBe('EMPLOYEE');

    const { result: result2 } = renderHook(() => useSuggestedSecurityRole(undefined, mockRoles));
    expect(result2.current?.code).toBe('EMPLOYEE');
  });

  it('suggests HR_ADMIN for HR Manager', () => {
    const { result } = renderHook(() => useSuggestedSecurityRole('HR Manager', mockRoles));
    expect(result.current?.code).toBe('HR_ADMIN');
  });

  it('suggests ATTENDANCE_MANAGER for Site Supervisor', () => {
    const { result } = renderHook(() => useSuggestedSecurityRole('Site Supervisor', mockRoles));
    expect(result.current?.code).toBe('ATTENDANCE_MANAGER');
  });

  it('suggests PAYROLL_ADMIN for Payroll Officer', () => {
    const { result } = renderHook(() => useSuggestedSecurityRole('Payroll Officer', mockRoles));
    expect(result.current?.code).toBe('PAYROLL_ADMIN');
  });

  it('falls back to EMPLOYEE for unrecognized role', () => {
    const { result } = renderHook(() =>
      useSuggestedSecurityRole('Chief Happiness Officer', mockRoles),
    );
    expect(result.current?.code).toBe('EMPLOYEE');
  });
});

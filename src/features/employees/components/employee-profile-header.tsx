'use client';

import type { ComponentType } from 'react';
import { useAuthStore } from '@/lib/client/auth-store';
import { Badge } from '@/components/atoms/badge';
import { Card, CardContent } from '@/components/atoms/card';
import { User, Building2, Camera, Clock, Shield, Calendar } from '@/components/atoms/icons';
import type { Employee, EmployeeStatus, EmploymentType } from '../types/employee.types';

export type EmployeeProfileTab =
  'info' | 'assignments' | 'security' | 'biometrics' | 'attendance' | 'holidays';

interface EmployeeProfileHeaderProps {
  employee: Employee;
  activeTab: EmployeeProfileTab;
  onTabChange: (tab: EmployeeProfileTab) => void;
}

interface TabItem {
  id: EmployeeProfileTab;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}

export function EmployeeProfileHeader({
  employee,
  activeTab,
  onTabChange,
}: EmployeeProfileHeaderProps) {
  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase();

  const getStatusBadge = (status?: EmployeeStatus | string) => {
    const s = String(status || 'ACTIVE')
      .trim()
      .toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'PROBATION':
        return <Badge variant="warning">Probation</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'TERMINATED':
      case 'EXITED':
        return <Badge variant="destructive">Terminated</Badge>;
      case 'RESIGNED':
        return <Badge variant="secondary">Resigned</Badge>;
      // Legacy values from older data
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'ON_LEAVE':
      case 'LEAVE':
        return <Badge variant="warning">On Leave</Badge>;
      default:
        return <Badge variant="success">{s || 'Active'}</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type?: EmploymentType | string) => {
    const t = String(type || 'FULL_TIME')
      .trim()
      .toUpperCase();
    switch (t) {
      case 'FULL_TIME':
      case 'SALARIED':
      case 'PERMANENT':
      case 'FULLTIME':
        return <Badge variant="primary">Full Time</Badge>;
      case 'PART_TIME':
      case 'HOURLY':
      case 'PARTTIME':
        return <Badge variant="secondary">Part Time</Badge>;
      case 'CONTRACTOR':
      case 'CONTRACT':
      case 'CONTRACTUAL':
        return <Badge variant="outline">Contractor</Badge>;
      case 'CASUAL':
      case 'DAILY_WAGE':
      case 'DAILYWAGE':
      case 'TEMP':
      case 'TEMPORARY':
        return <Badge variant="warning">Casual / Daily Wage</Badge>;
      case 'INTERN':
      case 'TRAINEE':
      case 'INTERNSHIP':
        return <Badge variant="info">Intern</Badge>;
      default:
        return <Badge variant="primary">{t || 'Full Time'}</Badge>;
    }
  };

  const getAssignmentBadge = () => {
    if (employee.currentAssignment) {
      const { assignmentType, companyName, companyType, departmentName, jobRoleName } =
        employee.currentAssignment;
      if (assignmentType === 'INTERNAL' || companyType === 'INTERNAL') {
        return (
          <Badge variant="primary">
            Internal{' '}
            {jobRoleName ? `— ${jobRoleName}` : departmentName ? `— ${departmentName}` : 'Staff'}
          </Badge>
        );
      }
      return (
        <Badge variant="info">
          Deployed @ {companyName || 'Client'}
          {jobRoleName ? ` — ${jobRoleName}` : ''}
        </Badge>
      );
    }
    if (employee.companyName) {
      const isInternal =
        employee.companyName.toLowerCase().includes('hq') ||
        employee.companyName.toLowerCase().includes('internal');
      return (
        <Badge variant={isInternal ? 'primary' : 'info'}>
          {isInternal ? `Internal — ${employee.companyName}` : `Deployed @ ${employee.companyName}`}
        </Badge>
      );
    }
    return <Badge variant="warning">Unassigned / Bench</Badge>;
  };

  const tabs: readonly TabItem[] = [
    { id: 'info', label: 'Personal & Employment', Icon: User },
    { id: 'assignments', label: 'Site & Shifts', Icon: Building2 },
    { id: 'security', label: 'Security & Access', Icon: Shield },
    { id: 'biometrics', label: 'Biometric Face ID', Icon: Camera },
    { id: 'attendance', label: 'Attendance & Timecard', Icon: Clock },
    { id: 'holidays', label: 'Holidays & Time Off', Icon: Calendar },
  ];

  return (
    <Card variant="subtle" style={{ marginBottom: 'var(--space-6)' }}>
      <CardContent style={{ padding: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'hsl(var(--primary-color) / 0.15)',
                color: 'hsl(var(--primary-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                border: '2px solid hsl(var(--primary-color) / 0.3)',
              }}
            >
              {initials}
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                }}
              >
                <h1
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {employee.firstName} {employee.lastName}
                </h1>
                {getStatusBadge(employee.status)}
                {getEmploymentTypeBadge(employee.employmentType)}
                {getAssignmentBadge()}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-secondary))',
                  marginTop: 'var(--space-1)',
                }}
              >
                <span>
                  Employer / Workspace: <strong>{activeWorkspace?.name || 'Workspace'}</strong>
                </span>
                <span>
                  Code: <strong>{employee.employeeCode}</strong>
                </span>
                {employee.email && <span>Email: {employee.email}</span>}
                {employee.phone && <span>Phone: {employee.phone}</span>}
                <span>
                  Joined:{' '}
                  {employee.dateOfJoining
                    ? new Date(employee.dateOfJoining).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            borderTop: '1px solid hsl(var(--border-subtle))',
            paddingTop: 'var(--space-4)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive
                    ? 'hsl(var(--primary-color))'
                    : 'hsl(var(--bg-secondary))',
                  color: isActive
                    ? 'hsl(var(--primary-foreground, 0 0% 100%))'
                    : 'hsl(var(--text-secondary))',
                }}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

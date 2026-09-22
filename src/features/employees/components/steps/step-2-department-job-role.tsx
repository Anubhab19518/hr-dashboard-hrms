'use client';

import { useState, useEffect, useMemo } from 'react';
import { Briefcase, Sparkles } from '@/components/atoms/icons';
import { OrganizationService } from '@/features/organization/services/organization.service';
import type { Department, JobRole } from '@/features/organization/types/organization.types';
import type { EmployeeSecurityFormValues } from '../../types/employee-iam';

interface Step2DepartmentJobRoleProps {
  values: EmployeeSecurityFormValues;
  onChange: (patch: Partial<EmployeeSecurityFormValues>) => void;
  onJobRoleSelected?: (jobRole: JobRole | null) => void;
  error?: string | null;
}

export function Step2DepartmentJobRole({
  values,
  onChange,
  onJobRoleSelected,
  error,
}: Step2DepartmentJobRoleProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [depts, roles] = await Promise.all([
          OrganizationService.getDepartments(),
          OrganizationService.getJobRoles(),
        ]);
        if (mounted) {
          setDepartments(depts.filter((d) => d.status === 'ACTIVE' || d.isActive));
          setJobRoles(roles.filter((r) => r.status === 'ACTIVE' || r.isActive));
        }
      } catch (err) {
        console.error('Failed to load departments/roles', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter job roles by selected department if department is selected
  const availableJobRoles = useMemo(() => {
    if (!values.departmentId) return jobRoles;
    return jobRoles.filter(
      (role) => !role.departmentId || role.departmentId === values.departmentId,
    );
  }, [jobRoles, values.departmentId]);

  // Find currently selected job role
  const selectedRoleObj = useMemo(() => {
    return jobRoles.find((r) => r.id === values.jobRoleId) ?? null;
  }, [jobRoles, values.jobRoleId]);

  const handleDepartmentChange = (deptId: string) => {
    onChange({ departmentId: deptId || undefined });
    // If current job role belongs to a different department, reset job role
    if (deptId && selectedRoleObj?.departmentId && selectedRoleObj.departmentId !== deptId) {
      onChange({ jobRoleId: undefined });
      onJobRoleSelected?.(null);
    }
  };

  const handleJobRoleChange = (roleId: string) => {
    const role = jobRoles.find((r) => r.id === roleId) ?? null;
    onChange({
      jobRoleId: roleId || undefined,
      departmentId: role?.departmentId || values.departmentId,
    });
    onJobRoleSelected?.(role);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'hsl(var(--text-primary))',
          }}
        >
          Department & Organizational Designation
        </h3>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'hsl(var(--text-muted))' }}>
          Select the operational department and HR Job Role for hierarchy and organizational
          structuring.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Architectural Callout: HR Job Role != Security Role */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          fontSize: '0.8125rem',
          lineHeight: '1.4',
        }}
      >
        <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '2px', color: '#1e3a8a' }}>
            HR Job Role ≠ Security Role
          </strong>
          The HR Job Role defines the employee's title and organizational placement. It does not
          directly grant backend API privileges. You will configure security permissions and
          credentials in the next steps.
        </div>
      </div>

      {/* Dropdown Pickers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Department Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="emp-dept"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}
          >
            Operational Department
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="emp-dept"
              disabled={loading}
              value={values.departmentId || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid hsl(var(--border-subtle, 214 32% 91%))',
                backgroundColor: 'hsl(var(--surface-primary, 0 0% 100%))',
                fontSize: '0.875rem',
                color: 'hsl(var(--text-primary))',
                height: '42px',
              }}
            >
              <option value="">-- All / General Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            Optional: Assigns employee to a cost center or corporate department.
          </span>
        </div>

        {/* HR Job Role Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="emp-job-role"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}
          >
            HR Job Role / Designation
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="emp-job-role"
              disabled={loading}
              value={values.jobRoleId || ''}
              onChange={(e) => handleJobRoleChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid hsl(var(--border-subtle, 214 32% 91%))',
                backgroundColor: 'hsl(var(--surface-primary, 0 0% 100%))',
                fontSize: '0.875rem',
                color: 'hsl(var(--text-primary))',
                height: '42px',
              }}
            >
              <option value="">-- Select HR Designation --</option>
              {availableJobRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.isSupervisorRole ? '★ (Supervisor)' : ''}
                </option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            Used to recommend appropriate Security Roles in Step 3.
          </span>
        </div>
      </div>

      {/* Selected Designation Badge Card */}
      {selectedRoleObj && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'hsl(var(--surface-secondary, 210 40% 98%))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={20} style={{ color: 'hsl(var(--color-primary))' }} />
            <div>
              <div
                style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}
              >
                {selectedRoleObj.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                {selectedRoleObj.description || 'No description provided for this job role.'}
              </div>
            </div>
          </div>
          {selectedRoleObj.isSupervisorRole && (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Supervisor Role
            </span>
          )}
        </div>
      )}
    </div>
  );
}

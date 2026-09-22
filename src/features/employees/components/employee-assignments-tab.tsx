'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Building2, User } from '@/components/atoms/icons';
import { Modal } from '@/components/molecules/modal';
import { EmptyState } from '@/components/molecules/empty-state';
import { EmployeeService } from '../services/employee.service';
import { OrganizationService } from '@/features/organization';
import type { Company, Department, JobRole, Site, Shift } from '@/features/organization';
import type { EmployeeAssignment, SupervisorOption } from '../types/employee.types';
import type { AssignEmployeeInput } from '../schemas/employee.schema';

interface EmployeeAssignmentsTabProps {
  employeeId: string;
}

export function EmployeeAssignmentsTab({ employeeId }: EmployeeAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Organization Catalogs
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allJobRoles, setAllJobRoles] = useState<JobRole[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const [formData, setFormData] = useState<AssignEmployeeInput>({
    assignmentType: 'INTERNAL',
    companyId: '',
    departmentId: '',
    jobRoleId: '',
    siteId: '',
    shiftId: '',
    supervisorId: '',
    reportingToEmployeeId: '',
    effectiveFrom: new Date().toISOString().split('T')[0] ?? '',
    effectiveTo: '',
  });

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await EmployeeService.getEmployeeAssignments(employeeId);
      setAssignments(Array.isArray(data) ? data : []);
    } catch {
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  // Load all baseline organization data on mount
  useEffect(() => {
    void (async () => {
      setIsLoadingOptions(true);
      try {
        const [compsData, deptsData, rolesData, sitesData, shiftsData, supList] = await Promise.all(
          [
            OrganizationService.getCompanies(),
            OrganizationService.getDepartments(),
            OrganizationService.getJobRoles(),
            OrganizationService.getSites(),
            OrganizationService.getShifts(),
            EmployeeService.getSupervisorOptions(employeeId),
          ],
        );

        const validComps = Array.isArray(compsData) ? compsData : [];
        const validDepts = Array.isArray(deptsData) ? deptsData : [];
        const validRoles = Array.isArray(rolesData) ? rolesData : [];
        const validSites = Array.isArray(sitesData) ? sitesData : [];
        const validShifts = Array.isArray(shiftsData) ? shiftsData : [];

        // Read persisted company mappings from localStorage
        let storedDeptMap: Record<string, string> = {};
        let storedRoleMap: Record<string, string> = {};
        if (typeof window !== 'undefined') {
          try {
            const dStr = localStorage.getItem('hr_dept_company_map');
            if (dStr) storedDeptMap = JSON.parse(dStr);
            const rStr = localStorage.getItem('hr_role_company_map');
            if (rStr) storedRoleMap = JSON.parse(rStr);
          } catch {
            // Ignore JSON parse errors
          }
        }

        const internalComp = validComps.find((c) => c.type === 'INTERNAL');
        const fallbackInternalId = internalComp?.id ?? validComps[0]?.id ?? '';

        // Map departments with their companyId
        const mappedDepts = validDepts.map((d) => ({
          ...d,
          companyId:
            d.companyId ||
            ((d as unknown as Record<string, unknown>).company_id as string) ||
            storedDeptMap[d.id] ||
            fallbackInternalId,
        }));

        // Create department -> company lookup map
        const deptCompanyMap = new Map<string, string>();
        for (const d of mappedDepts) {
          if (d.companyId) {
            deptCompanyMap.set(d.id, d.companyId);
          }
        }

        // Map job roles with their companyId
        const mappedRoles = validRoles.map((role) => ({
          ...role,
          companyId:
            role.companyId ||
            ((role as unknown as Record<string, unknown>).company_id as string) ||
            storedRoleMap[role.id] ||
            (role.departmentId ? deptCompanyMap.get(role.departmentId) : undefined) ||
            fallbackInternalId,
        }));

        setCompanies(validComps);
        setAllDepartments(mappedDepts);
        setAllJobRoles(mappedRoles);
        setAllSites(validSites);
        setAllShifts(validShifts);
        setSupervisors(Array.isArray(supList) ? supList : []);
      } catch {
        // Keep defaults
      } finally {
        setIsLoadingOptions(false);
      }
    })();
  }, [employeeId]);

  // Derived Internal Company ID
  const internalCompanyId = useMemo(() => {
    return companies.find((c) => c.type === 'INTERNAL')?.id ?? null;
  }, [companies]);

  // Client Companies list
  const clientCompanies = useMemo(() => {
    return companies.filter((c) => c.type === 'CLIENT');
  }, [companies]);

  // Effective target company for scoping
  const targetCompanyId = useMemo(() => {
    if (formData.assignmentType === 'INTERNAL') {
      return internalCompanyId;
    }
    return formData.companyId || null;
  }, [formData.assignmentType, formData.companyId, internalCompanyId]);

  // Filtered departments strictly scoped to target company
  const availableDepartments = useMemo(() => {
    if (!targetCompanyId) return [];
    return allDepartments.filter((d) => {
      if (d.companyId) {
        return d.companyId === targetCompanyId;
      }
      return targetCompanyId === internalCompanyId;
    });
  }, [allDepartments, targetCompanyId, internalCompanyId]);

  // Filtered job roles strictly scoped to target company and selected department
  const availableJobRoles = useMemo(() => {
    if (!targetCompanyId) return [];
    const targetDeptIds = new Set(availableDepartments.map((d) => d.id));

    const companyRoles = allJobRoles.filter((role) => {
      if (role.companyId) {
        return role.companyId === targetCompanyId;
      }
      if (role.departmentId && targetDeptIds.has(role.departmentId)) {
        return true;
      }
      if (!role.companyId && !role.departmentId) {
        return targetCompanyId === internalCompanyId;
      }
      return false;
    });

    if (formData.departmentId) {
      return companyRoles.filter((r) => r.departmentId === formData.departmentId);
    }
    return companyRoles;
  }, [
    allJobRoles,
    targetCompanyId,
    availableDepartments,
    formData.departmentId,
    internalCompanyId,
  ]);

  // Filtered sites for client company
  const availableSites = useMemo(() => {
    if (formData.assignmentType !== 'CLIENT_DEPLOYMENT' || !formData.companyId) {
      return [];
    }
    return allSites.filter((s) => s.companyId === formData.companyId);
  }, [allSites, formData.assignmentType, formData.companyId]);

  // Filtered shifts for company
  const availableShifts = useMemo(() => {
    if (!targetCompanyId) return allShifts;
    return allShifts.filter((s) => s.companyId === targetCompanyId || !s.companyId);
  }, [allShifts, targetCompanyId]);

  // Handle Assignment Type Toggle
  const handleAssignmentTypeChange = (type: 'INTERNAL' | 'CLIENT_DEPLOYMENT') => {
    setError(null);
    setFormData({
      assignmentType: type,
      companyId: '',
      departmentId: '',
      jobRoleId: '',
      siteId: '',
      shiftId: '',
      supervisorId: '',
      reportingToEmployeeId: '',
      effectiveFrom: new Date().toISOString().split('T')[0] ?? '',
      effectiveTo: '',
    });
  };

  // Handle Client Company Change in CLIENT_DEPLOYMENT mode
  const handleClientCompanyChange = (companyId: string) => {
    setFormData((prev) => ({
      ...prev,
      companyId,
      departmentId: '',
      jobRoleId: '',
      siteId: '',
      shiftId: '',
    }));
  };

  // Handle Department Change
  const handleDepartmentChange = (departmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      departmentId,
      jobRoleId: '',
    }));
  };

  const handleCreateAssignment = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const sanitized: AssignEmployeeInput = {
        assignmentType: formData.assignmentType,
        companyId: formData.assignmentType === 'CLIENT_DEPLOYMENT' ? formData.companyId : undefined,
        departmentId: formData.departmentId || undefined,
        jobRoleId: formData.jobRoleId,
        siteId:
          formData.assignmentType === 'CLIENT_DEPLOYMENT' && formData.siteId
            ? formData.siteId
            : undefined,
        shiftId: formData.shiftId || undefined,
        supervisorId: formData.supervisorId || undefined,
        reportingToEmployeeId: formData.supervisorId || formData.reportingToEmployeeId || undefined,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || undefined,
      };

      const created = await EmployeeService.createAssignment(employeeId, sanitized);
      setAssignments((prev) => [created, ...prev]);
      setIsModalOpen(false);
      void fetchAssignments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create assignment';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerminateAssignment = async (assignmentId?: string) => {
    try {
      await EmployeeService.terminateAssignment(employeeId, {
        endDate: new Date().toISOString().split('T')[0] ?? '',
      });
      void fetchAssignments();
    } catch {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, isActive: false, effectiveTo: new Date().toISOString().split('T')[0] }
            : a,
        ),
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Card variant="subtle">
        <CardHeader
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <CardTitle>Workforce Deployments & Assignments</CardTitle>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              Internal operational postings, client site deployments, and reporting lines
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
            + New Assignment
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
              }}
            >
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              title="No assignments recorded"
              description="This employee has not been assigned to any internal department or client deployment yet."
              actionLabel="Create First Assignment"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {assignments.map((assignment) => {
                const isInternal =
                  assignment.assignmentType === 'INTERNAL' ||
                  (!assignment.companyId && !assignment.companyName);

                const roleName =
                  assignment.jobRoleName ||
                  allJobRoles.find((r) => r.id === assignment.jobRoleId)?.name ||
                  assignment.jobRoleId;

                const shiftObj = allShifts.find((s) => s.id === assignment.shiftId);
                const shiftName =
                  assignment.shiftName ||
                  (shiftObj
                    ? `${shiftObj.name}${shiftObj.startTime && shiftObj.endTime ? ` (${shiftObj.startTime} - ${shiftObj.endTime})` : ''}`
                    : undefined) ||
                  (assignment.shiftId ? `Shift #${assignment.shiftId.slice(0, 8)}` : undefined);

                const companyName =
                  assignment.companyName ||
                  companies.find((c) => c.id === assignment.companyId)?.name ||
                  (isInternal ? 'Internal Workspace Assignment' : 'Client Deployment');

                const departmentName =
                  assignment.departmentName ||
                  allDepartments.find((d) => d.id === assignment.departmentId)?.name;

                const siteName =
                  assignment.siteName ||
                  allSites.find((s) => s.id === assignment.siteId)?.name ||
                  (assignment.siteId ? `Site #${assignment.siteId.slice(0, 8)}` : undefined);

                const rawAssign = assignment as unknown as Record<string, unknown>;
                const rawSupervisorObj = rawAssign.supervisor as
                  Record<string, unknown> | undefined;
                const rawReportingToObj = rawAssign.reportingToEmployee as
                  Record<string, unknown> | undefined;
                const rawReportingToSnakeObj = rawAssign.reporting_to_employee as
                  Record<string, unknown> | undefined;

                const directSupName =
                  assignment.supervisorName ||
                  assignment.reportingToEmployeeName ||
                  (rawAssign.supervisor_name as string | undefined) ||
                  (rawAssign.reporting_to_employee_name as string | undefined) ||
                  (rawSupervisorObj
                    ? (rawSupervisorObj.name as string) ||
                      `${(rawSupervisorObj.firstName as string) || ''} ${(rawSupervisorObj.lastName as string) || ''}`.trim()
                    : undefined) ||
                  (rawReportingToObj
                    ? (rawReportingToObj.name as string) ||
                      `${(rawReportingToObj.firstName as string) || ''} ${(rawReportingToObj.lastName as string) || ''}`.trim()
                    : undefined) ||
                  (rawReportingToSnakeObj
                    ? (rawReportingToSnakeObj.name as string) ||
                      `${(rawReportingToSnakeObj.firstName as string) || (rawReportingToSnakeObj.first_name as string) || ''} ${(rawReportingToSnakeObj.lastName as string) || (rawReportingToSnakeObj.last_name as string) || ''}`.trim()
                    : undefined);

                const currentSupId =
                  assignment.supervisorId ||
                  assignment.reportingToEmployeeId ||
                  (rawAssign.supervisor_id as string | undefined) ||
                  (rawAssign.reporting_to_employee_id as string | undefined) ||
                  (rawAssign.managerId as string | undefined) ||
                  (rawAssign.manager_id as string | undefined);

                const supName =
                  (directSupName && directSupName.trim() ? directSupName.trim() : undefined) ||
                  (currentSupId
                    ? supervisors.find((s) => s.id === currentSupId || s.code === currentSupId)
                        ?.name
                    : undefined);

                const isAssignmentActive =
                  assignment.isActive !== false &&
                  (!assignment.effectiveTo || new Date(assignment.effectiveTo) >= new Date());

                return (
                  <div
                    key={assignment.id}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'hsl(var(--bg-secondary) / 0.6)',
                      border: '1px solid hsl(var(--border-subtle))',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-4)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--space-3)',
                        minWidth: '280px',
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isInternal
                            ? 'hsl(var(--color-brand-accent) / 0.12)'
                            : 'hsl(var(--color-info) / 0.12)',
                          color: isInternal
                            ? 'hsl(var(--color-brand-accent))'
                            : 'hsl(var(--color-info))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 'var(--space-2)',
                            marginBottom: 'var(--space-1)',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 'var(--font-size-sm)',
                              color: 'hsl(var(--text-primary))',
                            }}
                          >
                            {companyName}
                          </span>
                          <Badge variant={isInternal ? 'primary' : 'outline'}>
                            {isInternal ? 'Internal' : 'Client Deployment'}
                          </Badge>
                          <Badge variant={isAssignmentActive ? 'success' : 'secondary'}>
                            {isAssignmentActive ? 'Active' : 'Past'}
                          </Badge>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--text-secondary))',
                            marginTop: 'var(--space-1)',
                          }}
                        >
                          {roleName && (
                            <span>
                              <strong>Role:</strong> {roleName}
                            </span>
                          )}
                          {departmentName && (
                            <span>
                              <strong>Dept:</strong> {departmentName}
                            </span>
                          )}
                          {siteName && (
                            <span>
                              <strong>Site:</strong> {siteName}
                            </span>
                          )}
                          {shiftName && (
                            <span>
                              <strong>Shift:</strong> {shiftName}
                            </span>
                          )}
                          {supName && (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                              }}
                            >
                              <User size={12} style={{ color: 'hsl(var(--color-brand-accent))' }} />
                              <strong>Reports to:</strong> {supName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 'var(--space-2)',
                        textAlign: 'right',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        flexShrink: 0,
                      }}
                    >
                      <div>
                        <strong>From:</strong>{' '}
                        {assignment.effectiveFrom
                          ? new Date(assignment.effectiveFrom).toLocaleDateString()
                          : '—'}
                      </div>
                      {assignment.effectiveTo && (
                        <div>
                          <strong>To:</strong>{' '}
                          {new Date(assignment.effectiveTo).toLocaleDateString()}
                        </div>
                      )}
                      {isAssignmentActive && !assignment.effectiveTo && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTerminateAssignment(assignment.id)}
                          style={{
                            fontSize: '11px',
                            height: '26px',
                            padding: '0 8px',
                            color: 'hsl(var(--color-danger))',
                            borderColor: 'hsl(var(--color-danger) / 0.3)',
                          }}
                        >
                          End Deployment
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workforce Assignment"
        description="Assign this employee to an internal operational role or deploy to a client company."
      >
        <form
          onSubmit={handleCreateAssignment}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {error && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                border: '1px solid hsl(var(--color-danger) / 0.3)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {error}
            </div>
          )}

          {/* STEP 1: Assignment Type Toggle */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: 'var(--space-2)',
              }}
            >
              Assignment Type *
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-2)',
                backgroundColor: 'hsl(var(--bg-secondary))',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
              }}
            >
              <button
                type="button"
                onClick={() => handleAssignmentTypeChange('INTERNAL')}
                style={{
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    formData.assignmentType === 'INTERNAL'
                      ? 'hsl(var(--color-brand-accent))'
                      : 'transparent',
                  color:
                    formData.assignmentType === 'INTERNAL'
                      ? 'hsl(var(--text-inverse))'
                      : 'hsl(var(--text-secondary))',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Internal Staff
              </button>
              <button
                type="button"
                onClick={() => handleAssignmentTypeChange('CLIENT_DEPLOYMENT')}
                style={{
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    formData.assignmentType === 'CLIENT_DEPLOYMENT'
                      ? 'hsl(var(--color-brand-accent))'
                      : 'transparent',
                  color:
                    formData.assignmentType === 'CLIENT_DEPLOYMENT'
                      ? 'hsl(var(--text-inverse))'
                      : 'hsl(var(--text-secondary))',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Client Deployment
              </button>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              {formData.assignmentType === 'INTERNAL'
                ? 'Assigns employee to workspace headquarters, field management, or internal divisions.'
                : 'Deploys workforce to a registered client company and geofenced work site.'}
            </div>
          </div>

          {/* CLIENT DEPLOYMENT: Client Company Selector */}
          {formData.assignmentType === 'CLIENT_DEPLOYMENT' && (
            <div>
              <label
                htmlFor="assignClientCompanyId"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Client Company *
              </label>
              <select
                id="assignClientCompanyId"
                value={formData.companyId ?? ''}
                onChange={(e) => handleClientCompanyChange(e.target.value)}
                required
                disabled={isLoadingOptions}
                style={{
                  width: '100%',
                  height: 'var(--space-10)',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">
                  {isLoadingOptions ? 'Loading client accounts...' : 'Select Client Company...'}
                </option>
                {clientCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.code ? ` (${c.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department & Job Role Cascading Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <label
                htmlFor="assignDeptId"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Department (Optional)
              </label>
              <select
                id="assignDeptId"
                value={formData.departmentId ?? ''}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={
                  isLoadingOptions ||
                  (formData.assignmentType === 'CLIENT_DEPLOYMENT' && !formData.companyId)
                }
                style={{
                  width: '100%',
                  height: 'var(--space-10)',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">All / General Department</option>
                {availableDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.code ? ` (${d.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="assignRoleId"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Job Role / Designation *
              </label>
              <select
                id="assignRoleId"
                value={formData.jobRoleId}
                onChange={(e) => setFormData((prev) => ({ ...prev, jobRoleId: e.target.value }))}
                required
                disabled={
                  isLoadingOptions ||
                  (formData.assignmentType === 'CLIENT_DEPLOYMENT' && !formData.companyId)
                }
                style={{
                  width: '100%',
                  height: 'var(--space-10)',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">
                  {isLoadingOptions
                    ? 'Loading roles...'
                    : formData.assignmentType === 'CLIENT_DEPLOYMENT' && !formData.companyId
                      ? 'Select a Client Company first...'
                      : availableJobRoles.length === 0
                        ? 'No roles available'
                        : 'Select Job Role...'}
                </option>
                {availableJobRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.code ? ` (${r.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Work Site (Only for Client Deployment) & Shift Schedule */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                formData.assignmentType === 'CLIENT_DEPLOYMENT' ? '1fr 1fr' : '1fr',
              gap: 'var(--space-3)',
            }}
          >
            {formData.assignmentType === 'CLIENT_DEPLOYMENT' && (
              <div>
                <label
                  htmlFor="assignSiteId"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Client Work Site (Optional)
                </label>
                <select
                  id="assignSiteId"
                  value={formData.siteId ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, siteId: e.target.value }))}
                  disabled={isLoadingOptions || !formData.companyId}
                  style={{
                    width: '100%',
                    height: 'var(--space-10)',
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--border-subtle))',
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <option value="">No Specific Site (Direct Client Assignment)</option>
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.address ? ` (${s.address})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="assignShiftId"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Shift Schedule (Optional)
              </label>
              <select
                id="assignShiftId"
                value={formData.shiftId ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, shiftId: e.target.value }))}
                disabled={isLoadingOptions}
                style={{
                  width: '100%',
                  height: 'var(--space-10)',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">General / Flexible Shift</option>
                {availableShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.startTime && s.endTime ? ` (${s.startTime} - ${s.endTime})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reporting Employee */}
          <div>
            <label
              htmlFor="assignSupervisorId"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Reports To / Reporting Employee (Optional)
            </label>
            <select
              id="assignSupervisorId"
              value={formData.supervisorId ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  supervisorId: e.target.value,
                  reportingToEmployeeId: e.target.value,
                }))
              }
              disabled={isLoadingOptions}
              style={{
                width: '100%',
                height: 'var(--space-10)',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <option value="">None (Independent / Top-Level Assignment)</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Effective Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label
                htmlFor="assignFrom"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Effective From *
              </label>
              <Input
                id="assignFrom"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, effectiveFrom: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label
                htmlFor="assignTo"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Effective To (Optional)
              </label>
              <Input
                id="assignTo"
                type="date"
                value={formData.effectiveTo ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, effectiveTo: e.target.value }))}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || isLoadingOptions}>
              {isSubmitting ? 'Saving Assignment...' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

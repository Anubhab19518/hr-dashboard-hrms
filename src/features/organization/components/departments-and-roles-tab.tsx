'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Modal } from '@/components/molecules/modal';
import {
  Users,
  Briefcase,
  Plus,
  Search,
  Building2,
  ChevronRight,
  Layers,
  X,
} from '@/components/atoms/icons';
import { OrganizationService } from '../services/organization.service';
import type { Department, JobRole, Company } from '../types/organization.types';
import type { CreateDepartmentInput, CreateJobRoleInput } from '../schemas/organization.schema';

export function DepartmentsAndRolesTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Company Context (Scoping departments & roles)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Selected Department Filter (null means "All Departments")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  // Search queries
  const [deptSearch, setDeptSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Department Form Data
  const [deptFormData, setDeptFormData] = useState<CreateDepartmentInput>({
    name: '',
    code: '',
    companyId: '',
  });

  // Role Form Data
  const [roleFormData, setRoleFormData] = useState<CreateJobRoleInput>({
    name: '',
    code: '',
    departmentId: '',
    level: 'L1',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptsData, rolesData, companiesData] = await Promise.all([
        OrganizationService.getDepartments(),
        OrganizationService.getJobRoles(),
        OrganizationService.getCompanies(),
      ]);
      const validDepts = Array.isArray(deptsData) ? deptsData : [];
      const validRoles = Array.isArray(rolesData) ? rolesData : [];
      const validComps = Array.isArray(companiesData) ? companiesData : [];

      const internalComp = validComps.find((c) => c.type === 'INTERNAL');
      const fallbackInternalId = internalComp?.id ?? validComps[0]?.id ?? '';

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

      // Map departments with their companyId (explicit companyId -> localStorage -> fallback internal HQ)
      const mappedDepts = validDepts.map((d) => ({
        ...d,
        companyId: d.companyId || storedDeptMap[d.id] || fallbackInternalId,
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
          storedRoleMap[role.id] ||
          (role.departmentId ? deptCompanyMap.get(role.departmentId) : undefined) ||
          fallbackInternalId,
      }));

      setDepartments(mappedDepts);
      setJobRoles(mappedRoles);
      setCompanies(validComps);

      if (validComps.length > 0) {
        setSelectedCompanyId((prev) => {
          if (prev && validComps.some((c) => c.id === prev)) return prev;
          return fallbackInternalId || null;
        });
        setDeptFormData((prev) => ({ ...prev, companyId: fallbackInternalId }));
      }
    } catch {
      setDepartments([]);
      setJobRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const internalCompanyId = useMemo(() => {
    return companies.find((c) => c.type === 'INTERNAL')?.id ?? null;
  }, [companies]);

  // Selected company entity
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) ?? null;
  }, [companies, selectedCompanyId]);

  // Switch company context without corrupting existing department state
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedDepartmentId(null);
    setDeptFormData((prev) => ({ ...prev, companyId }));
  };

  // Departments strictly scoped to the selected company
  const scopedDepartments = useMemo(() => {
    if (!selectedCompanyId) return [];
    return departments.filter((d) => {
      if (d.companyId) {
        return d.companyId === selectedCompanyId;
      }
      // Unassigned/legacy records belong to INTERNAL HQ only
      return selectedCompanyId === internalCompanyId;
    });
  }, [departments, selectedCompanyId, internalCompanyId]);

  // Job roles strictly scoped to the selected company
  const scopedJobRoles = useMemo(() => {
    if (!selectedCompanyId) return [];
    const scopedDeptIds = new Set(scopedDepartments.map((d) => d.id));
    return jobRoles.filter((role) => {
      // Explicitly tagged to this company
      if (role.companyId) {
        return role.companyId === selectedCompanyId;
      }
      // Belongs to a department owned by this company
      if (role.departmentId && scopedDeptIds.has(role.departmentId)) {
        return true;
      }
      // Unassigned roles belong to INTERNAL HQ only
      if (!role.companyId && !role.departmentId) {
        return selectedCompanyId === internalCompanyId;
      }
      return false;
    });
  }, [jobRoles, selectedCompanyId, scopedDepartments, internalCompanyId]);

  // Handle Department Creation
  const handleCreateDepartment = async (e: FormEvent) => {
    e.preventDefault();
    setDeptError(null);
    setIsSubmittingDept(true);
    try {
      const targetCompanyId =
        selectedCompanyId || deptFormData.companyId || internalCompanyId || '';
      const payload: CreateDepartmentInput = {
        ...deptFormData,
        companyId: targetCompanyId,
      };
      const created = await OrganizationService.createDepartment(payload);
      const normalizedCreated: Department = {
        ...created,
        companyId: created.companyId || targetCompanyId,
      };

      // Persist mapping
      if (typeof window !== 'undefined' && targetCompanyId) {
        try {
          const dStr = localStorage.getItem('hr_dept_company_map');
          const dMap = dStr ? JSON.parse(dStr) : {};
          dMap[normalizedCreated.id] = targetCompanyId;
          localStorage.setItem('hr_dept_company_map', JSON.stringify(dMap));
        } catch {
          // Ignore
        }
      }

      setDepartments((prev) => [...prev, normalizedCreated]);
      setSelectedDepartmentId(normalizedCreated.id);
      setIsDeptModalOpen(false);
      setDeptFormData({
        name: '',
        code: '',
        companyId: selectedCompanyId ?? companies[0]?.id ?? '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create department';
      setDeptError(message);
    } finally {
      setIsSubmittingDept(false);
    }
  };

  // Handle Job Role Creation
  const handleCreateJobRole = async (e: FormEvent) => {
    e.preventDefault();
    setRoleError(null);
    setIsSubmittingRole(true);
    try {
      const targetCompanyId = selectedCompanyId ?? internalCompanyId ?? undefined;
      const payload: CreateJobRoleInput = {
        ...roleFormData,
        companyId: targetCompanyId,
      };
      const created = await OrganizationService.createJobRole(payload);
      const normalizedCreated: JobRole = {
        ...created,
        companyId: created.companyId || targetCompanyId,
      };

      // Persist mapping
      if (typeof window !== 'undefined' && targetCompanyId) {
        try {
          const rStr = localStorage.getItem('hr_role_company_map');
          const rMap = rStr ? JSON.parse(rStr) : {};
          rMap[normalizedCreated.id] = targetCompanyId;
          localStorage.setItem('hr_role_company_map', JSON.stringify(rMap));
        } catch {
          // Ignore
        }
      }

      setJobRoles((prev) => [...prev, normalizedCreated]);
      setIsRoleModalOpen(false);
      setRoleFormData({
        name: '',
        code: '',
        departmentId: selectedDepartmentId ?? (scopedDepartments[0]?.id || ''),
        level: 'L1',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create job role';
      setRoleError(message);
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const openDeptModal = () => {
    setDeptError(null);
    setDeptFormData({
      name: '',
      code: '',
      companyId: selectedCompanyId || companies[0]?.id || '',
    });
    setIsDeptModalOpen(true);
  };

  const openRoleModalWithCurrentDept = () => {
    setRoleError(null);
    setRoleFormData((prev) => ({
      ...prev,
      departmentId: selectedDepartmentId ?? (scopedDepartments[0]?.id || ''),
    }));
    setIsRoleModalOpen(true);
  };

  // Filtered Departments (search applied to scoped departments)
  const filteredDepartments = useMemo(() => {
    if (!deptSearch.trim()) return scopedDepartments;
    const query = deptSearch.toLowerCase();
    return scopedDepartments.filter(
      (d) => d.name.toLowerCase().includes(query) || d.code.toLowerCase().includes(query),
    );
  }, [scopedDepartments, deptSearch]);

  // Role Count Map by Department ID
  const roleCountByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const role of scopedJobRoles) {
      if (role.departmentId) {
        map.set(role.departmentId, (map.get(role.departmentId) ?? 0) + 1);
      }
    }
    return map;
  }, [scopedJobRoles]);

  // Filtered Job Roles
  const filteredJobRoles = useMemo(() => {
    return scopedJobRoles.filter((role) => {
      // Match department filter
      if (selectedDepartmentId !== null && role.departmentId !== selectedDepartmentId) {
        return false;
      }
      // Match search query
      if (roleSearch.trim()) {
        const query = roleSearch.toLowerCase();
        const matchesName = role.name.toLowerCase().includes(query);
        const matchesCode = role.code.toLowerCase().includes(query);
        const matchesLevel = role.level?.toLowerCase().includes(query) ?? false;
        return matchesName || matchesCode || matchesLevel;
      }
      return true;
    });
  }, [scopedJobRoles, selectedDepartmentId, roleSearch]);

  const activeDepartment = useMemo(() => {
    return scopedDepartments.find((d) => d.id === selectedDepartmentId) ?? null;
  }, [scopedDepartments, selectedDepartmentId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. Clean Scope Header & Company Switcher */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-4) var(--space-5)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'hsl(var(--color-brand-accent) / 0.12)',
              color: 'hsl(var(--color-brand-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={18} strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Management Context
              </span>
              {selectedCompany?.type && (
                <Badge variant={selectedCompany.type === 'INTERNAL' ? 'primary' : 'outline'}>
                  {selectedCompany.type === 'INTERNAL' ? 'INTERNAL HQ' : 'CLIENT COMPANY'}
                </Badge>
              )}
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                margin: '2px 0 0 0',
              }}
            >
              Departments & Roles Scope
            </h1>
          </div>
        </div>

        {/* Company Dropdown Switcher */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}
        >
          <label
            htmlFor="company-context-select"
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
            }}
          >
            Company:
          </label>
          <select
            id="company-context-select"
            aria-label="Select Company Context"
            value={selectedCompanyId ?? ''}
            onChange={(e) => handleCompanyChange(e.target.value)}
            style={{
              minWidth: '280px',
              height: '36px',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} &nbsp;&nbsp;—&nbsp;&nbsp; (
                {c.type === 'INTERNAL' ? 'Internal HQ' : 'Client'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Main 2-Column Split View */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: 'var(--space-4)',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: DEPARTMENTS & DIVISIONS */}
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Users size={16} style={{ color: 'hsl(var(--color-brand-accent))' }} />
              <h2
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Departments & Divisions
              </h2>
              <Badge variant="secondary">{scopedDepartments.length}</Badge>
            </div>

            <Button variant="primary" size="sm" onClick={openDeptModal}>
              <Plus size={13} strokeWidth={2} style={{ marginRight: 'var(--space-1)' }} />
              Add Dept
            </Button>
          </div>

          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            Select a department to filter designations
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))',
              }}
            />
            <input
              type="text"
              placeholder="Search departments or codes..."
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 var(--space-3) 0 var(--space-8)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* "All Departments" Option */}
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={() => setSelectedDepartmentId(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                border:
                  selectedDepartmentId === null
                    ? '1px solid hsl(var(--color-brand-accent))'
                    : '1px solid hsl(var(--border-subtle))',
                backgroundColor:
                  selectedDepartmentId === null
                    ? 'hsl(var(--color-brand-accent) / 0.08)'
                    : 'hsl(var(--bg-surface))',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Layers
                  size={15}
                  style={{
                    color:
                      selectedDepartmentId === null
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--text-muted))',
                  }}
                />
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: selectedDepartmentId === null ? 700 : 500,
                    color:
                      selectedDepartmentId === null
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--text-primary))',
                  }}
                >
                  All Departments
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Badge variant={selectedDepartmentId === null ? 'primary' : 'outline'}>
                  {scopedJobRoles.length} ROLES
                </Badge>
                <ChevronRight
                  size={13}
                  style={{
                    color:
                      selectedDepartmentId === null
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--text-muted))',
                  }}
                />
              </div>
            </button>
          </div>

          {/* Department List */}
          {isLoading ? (
            <div
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              Loading departments...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  margin: '0 0 var(--space-3) 0',
                }}
              >
                {deptSearch ? 'No matching departments' : 'No departments configured yet'}
              </p>
              <Button variant="outline" size="sm" onClick={openDeptModal}>
                <Plus size={13} style={{ marginRight: 'var(--space-1)' }} />
                Create Department
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                maxHeight: '460px',
                overflowY: 'auto',
              }}
            >
              {filteredDepartments.map((dept) => {
                const isSelected = selectedDepartmentId === dept.id;
                const roleCount = roleCountByDept.get(dept.id) ?? 0;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDepartmentId(dept.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDepartmentId(dept.id);
                      }
                    }}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected
                        ? '1px solid hsl(var(--color-brand-accent))'
                        : '1px solid hsl(var(--border-subtle))',
                      backgroundColor: isSelected
                        ? 'hsl(var(--color-brand-accent) / 0.08)'
                        : 'hsl(var(--bg-surface))',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-2)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected
                              ? 'hsl(var(--color-brand-accent))'
                              : 'hsl(var(--text-primary))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {dept.name}
                        </span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'hsl(var(--bg-secondary))',
                            color: 'hsl(var(--text-muted))',
                          }}
                        >
                          {dept.code}
                        </span>
                      </div>

                      {dept.companyName && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'hsl(var(--text-muted))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {dept.companyName}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        flexShrink: 0,
                      }}
                    >
                      <Badge variant={isSelected ? 'primary' : 'outline'}>{roleCount} ROLES</Badge>
                      <ChevronRight
                        size={13}
                        style={{
                          color: isSelected
                            ? 'hsl(var(--color-brand-accent))'
                            : 'hsl(var(--text-muted))',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: JOB ROLES & DESIGNATIONS */}
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Briefcase size={16} style={{ color: 'hsl(var(--color-brand-accent))' }} />
              <h2
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Job Roles & Designations
              </h2>
              <Badge variant="secondary">{filteredJobRoles.length}</Badge>
            </div>

            <Button variant="primary" size="sm" onClick={openRoleModalWithCurrentDept}>
              <Plus size={13} strokeWidth={2} style={{ marginRight: 'var(--space-1)' }} />
              Add Role
            </Button>
          </div>

          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            {activeDepartment
              ? `Scoped to ${activeDepartment.name}`
              : 'All organizational designations'}
          </p>

          {/* Active Filter Pill (When Scoped to a Department) */}
          {activeDepartment && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2) var(--space-3)',
                marginBottom: 'var(--space-3)',
                backgroundColor: 'hsl(var(--color-brand-accent) / 0.08)',
                border: '1px solid hsl(var(--color-brand-accent) / 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Filtered by:</span>
                <strong style={{ color: 'hsl(var(--color-brand-accent))' }}>
                  {activeDepartment.name} ({activeDepartment.code})
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDepartmentId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'hsl(var(--color-brand-accent))',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                <X size={13} />
                <span>Clear filter</span>
              </button>
            </div>
          )}

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))',
              }}
            />
            <input
              type="text"
              placeholder="Search roles, designations, or levels..."
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 var(--space-3) 0 var(--space-8)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Job Roles Content */}
          {isLoading ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              Loading job roles...
            </div>
          ) : filteredJobRoles.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8) var(--space-4)',
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                <Briefcase size={20} />
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-secondary))',
                  margin: 0,
                }}
              >
                {activeDepartment
                  ? `No job roles assigned to ${activeDepartment.name} yet`
                  : 'No job roles found matching search criteria'}
              </p>
              <Button variant="outline" size="sm" onClick={openRoleModalWithCurrentDept}>
                <Plus size={13} style={{ marginRight: 'var(--space-1)' }} />
                {activeDepartment ? `Add Role to ${activeDepartment.name}` : 'Create Job Role'}
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                maxHeight: '460px',
                overflowY: 'auto',
              }}
            >
              {filteredJobRoles.map((role) => {
                const deptName =
                  role.departmentName ||
                  departments.find((d) => d.id === role.departmentId)?.name ||
                  'General / Unassigned';

                return (
                  <div
                    key={role.id}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid hsl(var(--border-subtle))',
                      backgroundColor: 'hsl(var(--bg-surface))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 700,
                            color: 'hsl(var(--text-primary))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {role.name}
                        </span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'hsl(var(--bg-secondary))',
                            color: 'hsl(var(--text-muted))',
                          }}
                        >
                          {role.code}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontSize: '11px',
                          color: 'hsl(var(--text-muted))',
                        }}
                      >
                        <span>
                          Dept: <strong>{deptName}</strong>
                        </span>
                        {role.level && (
                          <span>
                            &bull; Level: <strong>{role.level}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        flexShrink: 0,
                      }}
                    >
                      {role.isSupervisorRole && <Badge variant="warning">Supervisor</Badge>}
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE DEPARTMENT MODAL */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Create Department"
        size="md"
      >
        <form
          onSubmit={handleCreateDepartment}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {deptError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {deptError}
            </div>
          )}

          <div>
            <label
              htmlFor="dept-name"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Department Name *
            </label>
            <Input
              id="dept-name"
              placeholder="Operations & Logistics"
              value={deptFormData.name}
              onChange={(e) => setDeptFormData((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label
              htmlFor="dept-code"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Department Code *
            </label>
            <Input
              id="dept-code"
              placeholder="DEP-OPS"
              value={deptFormData.code}
              onChange={(e) =>
                setDeptFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
              }
              required
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-1)',
              }}
            >
              <label
                htmlFor="dept-company"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Assigned Company *
              </label>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Locked to top-level scope
              </span>
            </div>
            <select
              id="dept-company"
              value={selectedCompanyId || deptFormData.companyId || ''}
              disabled
              style={{
                width: '100%',
                height: '38px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-secondary))',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'not-allowed',
                opacity: 0.85,
              }}
              required
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} &nbsp;&nbsp;—&nbsp;&nbsp; (
                  {c.type === 'INTERNAL' ? 'Internal HQ' : 'Client'})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmittingDept}>
              {isSubmittingDept ? 'Creating...' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE JOB ROLE MODAL */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Create Job Role"
        size="md"
      >
        <form
          onSubmit={handleCreateJobRole}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {roleError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {roleError}
            </div>
          )}

          <div>
            <label
              htmlFor="role-name"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Role Title *
            </label>
            <Input
              id="role-name"
              placeholder="Senior Plant Engineer"
              value={roleFormData.name}
              onChange={(e) => setRoleFormData((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label
              htmlFor="role-code"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Role Code *
            </label>
            <Input
              id="role-code"
              placeholder="ENG-SR-01"
              value={roleFormData.code}
              onChange={(e) =>
                setRoleFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="role-department"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Department
            </label>
            <select
              id="role-department"
              value={roleFormData.departmentId || ''}
              onChange={(e) => setRoleFormData((p) => ({ ...p, departmentId: e.target.value }))}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
                outline: 'none',
              }}
            >
              <option value="">-- No Department (Global) --</option>
              {scopedDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="role-level"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Seniority / Grade Level
            </label>
            <select
              id="role-level"
              value={roleFormData.level || 'L1'}
              onChange={(e) => setRoleFormData((p) => ({ ...p, level: e.target.value }))}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
                outline: 'none',
              }}
            >
              <option value="L1">L1 - Entry / Operator / Guard</option>
              <option value="L2">L2 - Associate / Senior Guard</option>
              <option value="L3">L3 - Specialist / Supervisor</option>
              <option value="L4">L4 - Lead / Field Officer</option>
              <option value="Manager">Manager / Operations Lead</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmittingRole}>
              {isSubmittingRole ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

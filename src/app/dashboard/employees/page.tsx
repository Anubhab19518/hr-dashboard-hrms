'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/client/auth-store';
import {
  Plus,
  Filter,
  Upload,
  Download,
  GitBranch,
  List,
  LayoutGrid,
  ChevronDown,
} from '@/components/atoms/icons';
import {
  EmployeeService,
  EmployeeTable,
  OnboardEmployeeDialog,
  type Employee,
} from '@/features/employees';
import { OrganizationService } from '@/features/organization';

export default function EmployeesPage() {
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [companyFilter, setCompanyFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown lists
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
  const [designationsList, setDesignationsList] = useState<string[]>([]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // View switch: 'list' | 'grid' | 'hierarchy'
  const [activeView, setActiveView] = useState<'list' | 'grid' | 'hierarchy'>('list');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(248);

  // Modal
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const [response, comps, depts, roles, supervisors] = await Promise.all([
        EmployeeService.getEmployees({
          page,
          limit: pageSize,
          status: statusFilter || undefined,
          companyId: companyFilter || undefined,
        }),
        OrganizationService.getCompanies().catch(() => []),
        OrganizationService.getDepartments().catch(() => []),
        OrganizationService.getJobRoles().catch(() => []),
        EmployeeService.getSupervisorOptions().catch(() => []),
      ]);

      const validComps = Array.isArray(comps) ? comps : [];
      const validDepts = Array.isArray(depts) ? depts : [];
      const validRoles = Array.isArray(roles) ? roles : [];

      if (validComps.length > 0) {
        const uniqueComps = Array.from(
          new Map(
            validComps
              .filter((c) => Boolean(c?.name))
              .map((c) => [c.name.trim().toLowerCase(), { id: c.id, name: c.name.trim() }]),
          ).values(),
        );
        setCompaniesList(uniqueComps);
      }
      if (validDepts.length > 0) {
        const uniqueDepts = Array.from(
          new Map(
            validDepts
              .filter((d) => Boolean(d?.name))
              .map((d) => [d.name.trim().toLowerCase(), { id: d.id, name: d.name.trim() }]),
          ).values(),
        );
        setDepartmentsList(uniqueDepts);
      }
      if (validRoles.length > 0) {
        const uniqueRoles = Array.from(
          new Set(
            validRoles.map((r) => r?.name?.trim()).filter((name): name is string => Boolean(name)),
          ),
        );
        setDesignationsList(uniqueRoles);
      }

      const rawRecords =
        response && Array.isArray(response.records) && response.records.length > 0
          ? response.records
          : Array.isArray(response) && response.length > 0
            ? response
            : [];

      // Build supervisor / manager lookup map
      const supervisorMap = new Map<string, { name: string; role?: string; avatar?: string }>();
      (Array.isArray(supervisors) ? supervisors : []).forEach((s) => {
        if (s.id) supervisorMap.set(s.id, { name: s.name });
        if (s.code) supervisorMap.set(s.code, { name: s.name });
      });
      rawRecords.forEach((r) => {
        const name = `${r.firstName} ${r.lastName}`.trim();
        if (r.id) supervisorMap.set(r.id, { name, role: r.designation, avatar: r.avatarUrl });
        if (r.employeeCode)
          supervisorMap.set(r.employeeCode, { name, role: r.designation, avatar: r.avatarUrl });
      });

      // Enrich employees with active assignment info (role, department, company, reporting supervisor)
      const enrichedRecords = await Promise.all(
        rawRecords.map(async (emp) => {
          try {
            const rawEmp = emp as unknown as Record<string, unknown>;
            const assignments = await EmployeeService.getEmployeeAssignments(emp.id);
            const activeAssign = Array.isArray(assignments)
              ? assignments.find(
                  (a) =>
                    a.isActive !== false &&
                    (!a.effectiveTo || new Date(a.effectiveTo) >= new Date()),
                ) || assignments[0]
              : null;

            if (!activeAssign) {
              const directManager =
                (rawEmp.reporting_manager_name as string | undefined) ||
                (rawEmp.reporting_manager as string | undefined) ||
                (rawEmp.manager_name as string | undefined) ||
                emp.reportingManagerName;
              return {
                ...emp,
                reportingManagerName: directManager,
              };
            }

            const rawAssign = activeAssign as unknown as Record<string, unknown>;
            const comp = validComps.find((c) => c.id === activeAssign.companyId);
            const dept = validDepts.find((d) => d.id === activeAssign.departmentId);
            const role = validRoles.find((r) => r.id === activeAssign.jobRoleId);

            const resolvedCompanyName =
              activeAssign.companyName ||
              comp?.name ||
              (activeAssign.assignmentType === 'INTERNAL' ? 'Internal Headquarters' : undefined);
            const resolvedDeptName = activeAssign.departmentName || dept?.name;
            const resolvedRoleName = activeAssign.jobRoleName || role?.name;

            const supId =
              activeAssign.supervisorId ||
              activeAssign.reportingToEmployeeId ||
              (rawAssign.supervisor_id as string | undefined) ||
              (rawAssign.reporting_to_employee_id as string | undefined) ||
              (rawAssign.managerId as string | undefined) ||
              (rawAssign.manager_id as string | undefined);

            const rawSupervisorObj = rawAssign.supervisor as Record<string, unknown> | undefined;
            const rawReportingToObj = rawAssign.reportingToEmployee as
              Record<string, unknown> | undefined;
            const rawReportingToSnakeObj = rawAssign.reporting_to_employee as
              Record<string, unknown> | undefined;

            const directSupervisorName =
              activeAssign.supervisorName ||
              activeAssign.reportingToEmployeeName ||
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

            const matchedSupervisor = supId ? supervisorMap.get(supId) : undefined;
            const resolvedManagerName =
              (directSupervisorName && directSupervisorName.trim()
                ? directSupervisorName.trim()
                : undefined) ||
              matchedSupervisor?.name ||
              (rawEmp.reporting_manager_name as string | undefined) ||
              (rawEmp.reporting_manager as string | undefined) ||
              (rawEmp.manager_name as string | undefined) ||
              emp.reportingManagerName;

            const resolvedManagerRole = matchedSupervisor?.role || emp.reportingManagerRole;
            const resolvedManagerAvatar = matchedSupervisor?.avatar || emp.reportingManagerAvatar;

            return {
              ...emp,
              companyName: resolvedCompanyName || emp.companyName,
              departmentName: resolvedDeptName || emp.departmentName,
              designation: resolvedRoleName || emp.designation,
              reportingManagerName: resolvedManagerName,
              reportingManagerRole: resolvedManagerRole,
              reportingManagerAvatar: resolvedManagerAvatar,
              currentAssignment: {
                ...emp.currentAssignment,
                ...activeAssign,
                supervisorId: supId,
                supervisorName: resolvedManagerName,
                companyName: resolvedCompanyName,
                departmentName: resolvedDeptName,
                jobRoleName: resolvedRoleName,
              },
            };
          } catch {
            return emp;
          }
        }),
      );

      setEmployees(enrichedRecords);
      setTotalPages(
        response && response.pagination?.totalPages
          ? response.pagination.totalPages
          : enrichedRecords.length > 0
            ? 1
            : 0,
      );
      setTotalCount(
        response && response.pagination?.total ? response.pagination.total : enrichedRecords.length,
      );
    } catch {
      setEmployees([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, companyFilter]);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees, activeWorkspaceId]);

  const handleOnboardSuccess = (newEmployee: Employee) => {
    setEmployees((prev) => [newEmployee, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  // Filtered employees locally for interactive dropdowns
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (companyFilter) {
        const cFilter = companyFilter.toLowerCase();
        const empCompName = (
          emp.companyName ||
          emp.currentAssignment?.companyName ||
          ''
        ).toLowerCase();
        const empCompId = emp.companyId || emp.currentAssignment?.companyId || '';
        const isInternal =
          emp.currentAssignment?.assignmentType === 'INTERNAL' ||
          emp.currentAssignment?.companyType === 'INTERNAL';

        const matches =
          empCompName.includes(cFilter) ||
          empCompId === companyFilter ||
          (isInternal &&
            (cFilter.includes('internal') ||
              cFilter.includes('hq') ||
              cFilter.includes('urgent manpower')));

        if (!matches) {
          return false;
        }
      }
      if (
        departmentFilter &&
        emp.departmentName &&
        !emp.departmentName.toLowerCase().includes(departmentFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        designationFilter &&
        emp.designation &&
        !emp.designation.toLowerCase().includes(designationFilter.toLowerCase())
      ) {
        return false;
      }
      if (employmentTypeFilter) {
        const filter = employmentTypeFilter.toUpperCase();
        const rawType = String(emp.employmentType || 'FULL_TIME').toUpperCase();
        const isMatch =
          (filter === 'FULL_TIME' &&
            (rawType === 'FULL_TIME' || rawType === 'SALARIED' || rawType === 'PERMANENT')) ||
          (filter === 'PART_TIME' && (rawType === 'PART_TIME' || rawType === 'HOURLY')) ||
          (filter === 'CONTRACTOR' &&
            (rawType === 'CONTRACTOR' || rawType === 'CONTRACT' || rawType === 'CONTRACTUAL')) ||
          (filter === 'CASUAL' &&
            (rawType === 'CASUAL' ||
              rawType === 'DAILY_WAGE' ||
              rawType === 'TEMPORARY' ||
              rawType === 'TEMP')) ||
          (filter === 'INTERN' && (rawType === 'INTERN' || rawType === 'TRAINEE')) ||
          rawType === filter ||
          rawType.includes(filter) ||
          filter.includes(rawType);

        if (!isMatch) {
          return false;
        }
      }
      if (statusFilter && emp.status?.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [
    employees,
    companyFilter,
    departmentFilter,
    designationFilter,
    employmentTypeFilter,
    statusFilter,
  ]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. TOP HEADER SECTION */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Employees
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'hsl(var(--text-muted))',
              margin: '3px 0 0 0',
            }}
          >
            Manage your organization&apos;s employees and their information.
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <GitBranch size={15} style={{ color: '#2563eb' }} />
            Org Hierarchy
          </button>

          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={14} />
            Import
          </button>

          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} />
            Export
          </button>

          <button
            type="button"
            onClick={() => setIsOnboardOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 16px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#2563eb', // Clean primary blue
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} strokeWidth={2.2} />
            Add Employee
          </button>
        </div>
      </div>

      {/* 2. FILTER CONTROLS BAR (Row 1) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Company Dropdown */}
        <div style={{ position: 'relative', minWidth: '150px' }}>
          <select
            value={companyFilter}
            aria-label="Filter by Company"
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 28px 0 12px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Companies</option>
            {companiesList.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Department Dropdown */}
        <div style={{ position: 'relative', minWidth: '155px' }}>
          <select
            value={departmentFilter}
            aria-label="Filter by Department"
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 28px 0 12px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Designation Dropdown */}
        <div style={{ position: 'relative', minWidth: '155px' }}>
          <select
            value={designationFilter}
            aria-label="Filter by Designation"
            onChange={(e) => {
              setDesignationFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 28px 0 12px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Designations</option>
            {designationsList.map((desig) => (
              <option key={desig} value={desig}>
                {desig}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Employment Type Dropdown */}
        <div style={{ position: 'relative', minWidth: '175px' }}>
          <select
            value={employmentTypeFilter}
            aria-label="Filter by Employment Type"
            onChange={(e) => {
              setEmploymentTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 28px 0 12px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Employment Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="CASUAL">Casual (Daily Wage)</option>
            <option value="INTERN">Intern</option>
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div style={{ position: 'relative', minWidth: '140px' }}>
          <select
            value={statusFilter}
            aria-label="Filter by Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 28px 0 12px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
            <option value="RESIGNED">Resigned</option>
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* More Filters Button */}
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 12px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
            color: 'hsl(var(--text-secondary))',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Filter size={14} />
          More Filters
        </button>
      </div>

      {/* 3. BULK ACTIONS & VIEW SWITCHER BAR (Row 2) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: Bulk selection tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Selected Count Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              height: '34px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              aria-label="Select visible employees"
              checked={
                filteredEmployees.length > 0 &&
                filteredEmployees.every((e) => selectedIds.has(e.id))
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                accentColor: '#2563eb',
                cursor: 'pointer',
              }}
            />
            {selectedIds.size} Selected
          </div>

          {/* Bulk Actions Button */}
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              height: '34px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Bulk Actions
            <ChevronDown size={13} />
          </button>

          {/* Assign Department Button */}
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 12px',
              height: '34px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Assign Department
          </button>

          {/* Change Manager Button */}
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 12px',
              height: '34px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Change Manager
          </button>

          {/* More Button */}
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0 12px',
              height: '34px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            More
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Right: View Switcher Toggle */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border-subtle))',
            padding: '2px',
          }}
        >
          <button
            type="button"
            aria-label="List View"
            onClick={() => setActiveView('list')}
            style={{
              width: '32px',
              height: '30px',
              borderRadius: '6px',
              border: activeView === 'list' ? '1px solid #bfdbfe' : '1px solid transparent',
              backgroundColor: activeView === 'list' ? '#eff6ff' : 'transparent',
              color: activeView === 'list' ? '#2563eb' : 'hsl(var(--text-muted))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <List size={15} />
          </button>

          <button
            type="button"
            aria-label="Grid View"
            onClick={() => setActiveView('grid')}
            style={{
              width: '32px',
              height: '30px',
              borderRadius: '6px',
              border: activeView === 'grid' ? '1px solid #bfdbfe' : '1px solid transparent',
              backgroundColor: activeView === 'grid' ? '#eff6ff' : 'transparent',
              color: activeView === 'grid' ? '#2563eb' : 'hsl(var(--text-muted))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LayoutGrid size={15} />
          </button>

          <button
            type="button"
            aria-label="Hierarchy View"
            onClick={() => setActiveView('hierarchy')}
            style={{
              width: '32px',
              height: '30px',
              borderRadius: '6px',
              border: activeView === 'hierarchy' ? '1px solid #bfdbfe' : '1px solid transparent',
              backgroundColor: activeView === 'hierarchy' ? '#eff6ff' : 'transparent',
              color: activeView === 'hierarchy' ? '#2563eb' : 'hsl(var(--text-muted))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <GitBranch size={15} />
          </button>
        </div>
      </div>

      {/* 4. EMPLOYEE TABLE COMPONENT */}
      <EmployeeTable
        employees={filteredEmployees}
        isLoading={isLoading}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onToggleSelect={handleToggleSelect}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onRefresh={() => void fetchEmployees()}
      />

      {/* ONBOARD EMPLOYEE DIALOG */}
      <OnboardEmployeeDialog
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSuccess={handleOnboardSuccess}
      />
    </div>
  );
}

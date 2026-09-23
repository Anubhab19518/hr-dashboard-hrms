'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Card, CardContent } from '@/components/atoms/card';
import {
  EmployeeService,
  EmployeeProfileHeader,
  EmployeeInfoTab,
  EmployeeAssignmentsTab,
  EmployeeSecurityTab,
  EmployeeBiometricsTab,
  EmployeeAttendanceTab,
  type Employee,
  type EmployeeProfileTab,
} from '@/features/employees';
import { OrganizationService } from '@/features/organization';
import { EmployeeHolidayView } from '@/features/holidays';

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EmployeeProfileTab>('info');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEmployee = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, assignments, comps, depts, roles, supervisors] = await Promise.all([
        EmployeeService.getEmployeeById(id),
        EmployeeService.getEmployeeAssignments(id).catch(() => []),
        OrganizationService.getCompanies().catch(() => []),
        OrganizationService.getDepartments().catch(() => []),
        OrganizationService.getJobRoles().catch(() => []),
        EmployeeService.getSupervisorOptions().catch(() => []),
      ]);

      const validComps = Array.isArray(comps) ? comps : [];
      const validDepts = Array.isArray(depts) ? depts : [];
      const validRoles = Array.isArray(roles) ? roles : [];
      const validSupervisors = Array.isArray(supervisors) ? supervisors : [];

      const activeAssign = Array.isArray(assignments)
        ? assignments.find(
            (a) =>
              a.isActive !== false && (!a.effectiveTo || new Date(a.effectiveTo) >= new Date()),
          ) || assignments[0]
        : null;

      if (activeAssign && data) {
        const rawAssign = activeAssign as unknown as Record<string, unknown>;
        const rawData = data as unknown as Record<string, unknown>;

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

        const matchedSupervisor = supId
          ? validSupervisors.find((s) => s.id === supId || s.code === supId)
          : undefined;

        const resolvedManagerName =
          (directSupervisorName && directSupervisorName.trim()
            ? directSupervisorName.trim()
            : undefined) ||
          matchedSupervisor?.name ||
          (rawData.reporting_manager_name as string | undefined) ||
          (rawData.reporting_manager as string | undefined) ||
          (rawData.manager_name as string | undefined) ||
          data.reportingManagerName;

        setEmployee({
          ...data,
          employmentType: data.employmentType || 'FULL_TIME',
          status: data.status || 'ACTIVE',
          companyName: resolvedCompanyName || data.companyName,
          departmentName: resolvedDeptName || data.departmentName,
          designation: resolvedRoleName || data.designation,
          reportingManagerName: resolvedManagerName,
          currentAssignment: {
            ...data.currentAssignment,
            ...activeAssign,
            supervisorId: supId,
            supervisorName: resolvedManagerName,
            companyName: resolvedCompanyName,
            departmentName: resolvedDeptName,
            jobRoleName: resolvedRoleName,
          },
        });
      } else {
        const rawData = (data || {}) as unknown as Record<string, unknown>;
        const directManager =
          (rawData.reporting_manager_name as string | undefined) ||
          (rawData.reporting_manager as string | undefined) ||
          (rawData.manager_name as string | undefined) ||
          data?.reportingManagerName;
        setEmployee(data ? { ...data, reportingManagerName: directManager } : data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load employee details';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchEmployee();
  }, [fetchEmployee]);

  /**
   * Called by EmployeeInfoTab after a successful PATCH.
   * We optimistically apply the basic scalar fields (status, names, etc.)
   * and then re-fetch the full enriched profile to restore assignment data.
   */
  const handleEmployeeUpdate = useCallback(
    async (updated: Employee) => {
      // Optimistically merge scalar fields so UI updates instantly
      setEmployee((prev) =>
        prev
          ? {
              ...prev,
              // Merge only the fields that the edit form can change
              firstName: updated.firstName,
              lastName: updated.lastName,
              email: updated.email,
              phone: updated.phone,
              employmentType: updated.employmentType,
              status: updated.status,
              dateOfJoining: updated.dateOfJoining,
              aadhaarNumber: updated.aadhaarNumber,
              panNumber: updated.panNumber,
              uanNumber: updated.uanNumber,
              pfNumber: updated.pfNumber,
              esicIpNumber: updated.esicIpNumber,
              bankName: updated.bankName,
              bankAccountNumber: updated.bankAccountNumber,
              bankIfscCode: updated.bankIfscCode,
              bankAccountHolderName: updated.bankAccountHolderName,
              dateOfBirth: updated.dateOfBirth,
              gender: updated.gender,
              maritalStatus: updated.maritalStatus,
              bloodGroup: updated.bloodGroup,
              fatherOrSpouseName: updated.fatherOrSpouseName,
              fatherOrSpouseRelation: updated.fatherOrSpouseRelation,
              nationality: updated.nationality,
              physicallyChallenged: updated.physicallyChallenged,
              currentAddress: updated.currentAddress,
              currentCity: updated.currentCity,
              currentState: updated.currentState,
              currentPincode: updated.currentPincode,
              permanentAddress: updated.permanentAddress,
              permanentCity: updated.permanentCity,
              permanentState: updated.permanentState,
              permanentPincode: updated.permanentPincode,
              emergencyContactName: updated.emergencyContactName,
              emergencyContactPhone: updated.emergencyContactPhone,
              emergencyContactRelation: updated.emergencyContactRelation,
              policeVerificationCertNo: updated.policeVerificationCertNo,
              policeStationName: updated.policeStationName,
              policeVerificationDate: updated.policeVerificationDate,
              policeVerificationExpiryDate: updated.policeVerificationExpiryDate,
            }
          : updated,
      );
      // Then re-fetch to restore full assignment enrichment
      setIsRefreshing(true);
      try {
        await fetchEmployee();
      } finally {
        setIsRefreshing(false);
      }
    },
    [fetchEmployee],
  );

  if (isLoading) {
    return (
      <div
        style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'hsl(var(--text-muted))' }}
      >
        <div style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
          Loading employee profile...
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)' }}>Fetching records for ID: {id}</div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Link href="/dashboard/employees">
          <Button variant="outline" size="sm">
            ← Back to Employees
          </Button>
        </Link>
        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                color: 'hsl(var(--color-danger))',
                marginBottom: 'var(--space-2)',
              }}
            >
              Employee Not Found
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-4)',
              }}
            >
              {error || `Unable to locate an employee record with ID ${id}.`}
            </p>
            <Button variant="primary" onClick={() => void fetchEmployee()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Breadcrumb / Back Button */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link href="/dashboard/employees">
          <Button variant="outline" size="sm">
            ← Back to Workforce Directory
          </Button>
        </Link>
      </div>

      {/* Profile Header Card */}
      <EmployeeProfileHeader employee={employee} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Active Tab View */}
      {activeTab === 'info' && (
        <EmployeeInfoTab
          employee={employee}
          onUpdate={(updated) => {
            void handleEmployeeUpdate(updated);
          }}
          isRefreshing={isRefreshing}
        />
      )}
      {activeTab === 'assignments' && <EmployeeAssignmentsTab employeeId={employee.id} />}
      {activeTab === 'security' && (
        <EmployeeSecurityTab
          employeeId={employee.id}
          employeeCode={employee.employeeCode}
          employeeName={`${employee.firstName} ${employee.lastName}`.trim()}
        />
      )}
      {activeTab === 'biometrics' && <EmployeeBiometricsTab employeeId={employee.id} />}
      {activeTab === 'attendance' && <EmployeeAttendanceTab employeeId={employee.id} />}
      {activeTab === 'holidays' && (
        <EmployeeHolidayView
          employeeId={employee.id}
          employeeName={`${employee.firstName} ${employee.lastName}`.trim()}
          companyId={employee.currentAssignment?.companyId || employee.companyId}
        />
      )}
    </div>
  );
}

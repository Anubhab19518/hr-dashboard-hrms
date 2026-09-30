import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeService, normalizeEmployee } from '../services/employee.service';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('EmployeeService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeEmployee', () => {
    it('normalizes fallback empty object', () => {
      const res = normalizeEmployee(null);
      expect(res.id).toBe('');
      expect(res.employmentType).toBe('FULL_TIME');
      expect(res.status).toBe('ACTIVE');
    });

    it('normalizes snake_case employee payload', () => {
      const res = normalizeEmployee({
        id: 'emp-123',
        employee_code: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        mobile_number: '+1234567890',
        job_title: 'Engineer',
        company_id: 'comp-1',
        company_name: 'Acme Corp',
        department_name: 'Tech',
        employment_category: 'PART_TIME',
        employee_status: 'PROBATION',
        joining_date: '2026-01-15',
        dob: '1990-05-20',
        gender: 'MALE',
      });

      expect(res.id).toBe('emp-123');
      expect(res.employeeCode).toBe('EMP001');
      expect(res.firstName).toBe('John');
      expect(res.lastName).toBe('Doe');
      expect(res.email).toBe('john@example.com');
      expect(res.phone).toBe('+1234567890');
      expect(res.employmentType).toBe('PART_TIME');
      expect(res.status).toBe('PROBATION');
      expect(res.dateOfJoining).toBe('2026-01-15');
      expect(res.dateOfBirth).toBe('1990-05-20');
      expect(res.gender).toBe('MALE');
    });

    it('normalizes various employment types and statuses', () => {
      expect(normalizeEmployee({ type: 'CONTRACT' }).employmentType).toBe('CONTRACTOR');
      expect(normalizeEmployee({ type: 'DAILY_WAGE' }).employmentType).toBe('CASUAL');
      expect(normalizeEmployee({ type: 'INTERN' }).employmentType).toBe('INTERN');
      expect(normalizeEmployee({ state: 'SUSPENDED' }).status).toBe('SUSPENDED');
      expect(normalizeEmployee({ state: 'TERMINATED' }).status).toBe('TERMINATED');
      expect(normalizeEmployee({ state: 'RESIGNED' }).status).toBe('RESIGNED');
      expect(normalizeEmployee({ isActive: false }).status).toBe('SUSPENDED');
    });
  });

  describe('API Methods', () => {
    it('fetches employees list with pagination and search', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        records: [{ id: 'emp-1', firstName: 'Alice', lastName: 'Smith' }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const res = await EmployeeService.getEmployees({ page: 1, limit: 10, search: 'Alice' });
      expect(apiClient).toHaveBeenCalledWith(expect.stringContaining('/hr/employees'));
      expect(res.records.length).toBe(1);
      expect(res.records[0]!.firstName).toBe('Alice');
    });

    it('handles alternative list responses (records, rows, list)', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        records: [{ id: 'emp-2', first_name: 'Bob', last_name: 'Jones' }],
      });

      const res = await EmployeeService.getEmployees();
      expect(res.records.length).toBe(1);
      expect(res.records[0]!.firstName).toBe('Bob');
    });

    it('fetches single employee by ID', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        employee: { id: 'emp-1', firstName: 'Alice', lastName: 'Smith' },
      });

      const res = await EmployeeService.getEmployeeById('emp-1');
      expect(apiClient).toHaveBeenCalledWith('/hr/employees/emp-1');
      expect(res.id).toBe('emp-1');
      expect(res.firstName).toBe('Alice');
    });

    it('creates an employee', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        employee: { id: 'emp-new', firstName: 'Charlie', lastName: 'Brown' },
      });

      const res = await EmployeeService.createEmployee({
        employeeCode: 'EMP-001',
        firstName: 'Charlie',
        lastName: 'Brown',
        dateOfJoining: '2026-03-01',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        nationality: 'Indian',
        physicallyChallenged: false,
      });
      expect(apiClient).toHaveBeenCalledWith('/hr/employees', {
        method: 'POST',
        body: expect.any(String),
      });
      expect(res.id).toBe('emp-new');
    });

    it('updates an employee', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        employee: { id: 'emp-1', firstName: 'Charlie', lastName: 'Updated' },
      });

      const res = await EmployeeService.updateEmployee('emp-1', {
        lastName: 'Updated',
      });
      expect(apiClient).toHaveBeenCalledWith('/hr/employees/emp-1', {
        method: 'PATCH',
        body: expect.any(String),
      });
      expect(res.lastName).toBe('Updated');
    });

    it('deletes an employee and handles assignments', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ assignments: [{ id: 'asgn-1', employeeId: 'emp-1' }] })
        .mockResolvedValueOnce({ assignment: { id: 'asgn-new', employeeId: 'emp-1' } })
        .mockResolvedValueOnce({ assignment: { id: 'asgn-active', employeeId: 'emp-1' } })
        .mockResolvedValueOnce({ success: true });

      const delRes = await EmployeeService.deleteEmployee('emp-1');
      expect(delRes.success).toBe(true);

      const asgns = await EmployeeService.getEmployeeAssignments('emp-1');
      expect(asgns.length).toBe(1);

      const createdAsgn = await EmployeeService.createAssignment('emp-1', {
        effectiveFrom: '2026-01-01',
        assignmentType: 'INTERNAL',
        jobRoleId: 'role-1',
        companyId: 'comp-1',
        departmentId: 'dept-1',
      });
      expect(createdAsgn.id).toBe('asgn-new');

      const activeAsgn = await EmployeeService.getActiveAssignment('emp-1');
      expect(activeAsgn?.id).toBe('asgn-active');

      const termRes = await EmployeeService.terminateAssignment('emp-1', { endDate: '2026-12-31' });
      expect(termRes.success).toBe(true);
    });

    it('handles face registration lifecycle and profiles', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ registrationSessionId: 'sess-123', images: [] })
        .mockResolvedValueOnce({ isRegistered: true, faceRegisteredAt: '2026-01-01' })
        .mockResolvedValueOnce({ isRegistered: true, faceRegisteredAt: '2026-01-01' })
        .mockResolvedValueOnce({ sessions: [{ id: 'sess-1', employeeId: 'emp-1' }] });

      const start = await EmployeeService.startFaceRegistration({ employeeId: 'emp-1' });
      expect(start.registrationSessionId).toBe('sess-123');

      const complete = await EmployeeService.completeFaceRegistrationSession('emp-1', 'sess-123');
      expect(complete?.isRegistered).toBe(true);

      const profile = await EmployeeService.getFaceProfile('emp-1');
      expect(profile?.isRegistered).toBe(true);

      const sessions = await EmployeeService.getFaceSessions('emp-1');
      expect(sessions.length).toBe(1);
    });

    it('fetches dropdown options: company, department, job role, site, shift, supervisor', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ companies: [{ id: 'c1', name: 'Company 1' }] })
        .mockResolvedValueOnce({ departments: [{ id: 'd1', name: 'Dept 1' }] })
        .mockResolvedValueOnce({ roles: [{ id: 'r1', name: 'Role 1' }] })
        .mockResolvedValueOnce({ sites: [{ id: 's1', name: 'Site 1' }] })
        .mockResolvedValueOnce({ shifts: [{ id: 'sh1', name: 'Morning Shift' }] })
        .mockResolvedValueOnce({
          employees: [{ id: 'sup1', firstName: 'Super', lastName: 'Visor' }],
        });

      const companies = await EmployeeService.getCompanyOptions();
      const depts = await EmployeeService.getDepartmentOptions('c1');
      const roles = await EmployeeService.getJobRoleOptions('d1');
      const sites = await EmployeeService.getSiteOptions('c1');
      const shifts = await EmployeeService.getShiftOptions('c1');
      const supervisors = await EmployeeService.getSupervisorOptions('c1');

      expect(companies.length).toBe(1);
      expect(depts.length).toBe(1);
      expect(roles.length).toBe(1);
      expect(sites.length).toBe(1);
      expect(shifts.length).toBe(1);
      expect(supervisors.length).toBe(1);
    });

    it('fetches employee attendance log and self-service history', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({
          records: [
            {
              id: 'att-1',
              employeeId: 'emp-1',
              status: 'PRESENT',
              checkInTime: '2026-09-30T09:00:00Z',
              checkOutTime: '2026-09-30T17:00:00Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          presentDays: 20,
          halfDays: 2,
          absentDays: 1,
          totalWorkedHours: 160,
          records: [],
        });

      const attendance = await EmployeeService.getEmployeeAttendance('emp-1', {
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      });
      const history = await EmployeeService.getMyAttendanceHistory({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      });

      expect(attendance.length).toBe(1);
      expect(attendance[0]!.status).toBe('PRESENT');
      expect(history?.presentDays).toBe(20);
      expect(history?.totalWorkedHours).toBe(160);
    });
  });
});

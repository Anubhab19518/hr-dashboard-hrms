import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from '../services/organization.service';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('OrganizationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Company Operations', () => {
    it('fetches companies with optional type filter', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        companies: [{ id: 'comp-1', name: 'Acme Corp', code: 'ACME' }],
      });

      const res = await OrganizationService.getCompanies('INTERNAL');
      expect(apiClient).toHaveBeenCalledWith('/hr/companies?type=INTERNAL');
      expect(res.length).toBe(1);
      expect(res[0]!.name).toBe('Acme Corp');
    });

    it('fetches single company by ID', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        company: { id: 'comp-1', name: 'Acme Corp', code: 'ACME' },
      });

      const res = await OrganizationService.getCompany('comp-1');
      expect(apiClient).toHaveBeenCalledWith('/hr/companies/comp-1');
      expect(res.id).toBe('comp-1');
    });

    it('fetches internal company with error fallback', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        company: { id: 'comp-internal', name: 'Internal Corp' },
      });
      const internal = await OrganizationService.getInternalCompany();
      expect(internal?.id).toBe('comp-internal');

      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Not found'));
      const notFound = await OrganizationService.getInternalCompany();
      expect(notFound).toBeNull();
    });

    it('creates and updates company', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ company: { id: 'comp-new', name: 'New Corp', code: 'NEW' } })
        .mockResolvedValueOnce({ company: { id: 'comp-new', name: 'Updated Corp', code: 'NEW' } });

      const created = await OrganizationService.createCompany({
        name: 'New Corp',
        code: 'NEW',
        type: 'INTERNAL',
        status: 'ACTIVE',
      });
      expect(created.name).toBe('New Corp');

      const updated = await OrganizationService.updateCompany('comp-new', {
        name: 'Updated Corp',
      });
      expect(updated.name).toBe('Updated Corp');
    });
  });

  describe('Site Operations', () => {
    it('fetches and creates sites', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ sites: [{ id: 'site-1', name: 'HQ', code: 'HQ' }] })
        .mockResolvedValueOnce({ site: { id: 'site-2', name: 'Branch', code: 'BR' } });

      const sites = await OrganizationService.getSites('comp-1');
      expect(apiClient).toHaveBeenCalledWith('/hr/sites?companyId=comp-1');
      expect(sites.length).toBe(1);

      const created = await OrganizationService.createSite({
        companyId: 'comp-1',
        name: 'Branch',
        code: 'BR',
        geofenceRadiusMeters: 100,
      });
      expect(created.id).toBe('site-2');
    });
  });

  describe('Department Operations', () => {
    it('fetches, creates, and updates departments', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({
          departments: [
            {
              id: 'dept-1',
              name: 'Engineering',
              code: 'ENG',
              company_id: 'comp-1',
              company_name: 'Acme',
            },
          ],
        })
        .mockResolvedValueOnce({
          department: {
            id: 'dept-2',
            name: 'HR',
            code: 'HR',
          },
        })
        .mockResolvedValueOnce({
          department: {
            id: 'dept-1',
            name: 'Engineering Updated',
            code: 'ENG',
          },
        });

      const depts = await OrganizationService.getDepartments('comp-1');
      expect(depts[0]!.name).toBe('Engineering');
      expect(depts[0]!.companyId).toBe('comp-1');

      const created = await OrganizationService.createDepartment({
        companyId: 'comp-1',
        name: 'HR',
        code: 'HR',
      });
      expect(created.id).toBe('dept-2');

      const updated = await OrganizationService.updateDepartment('dept-1', {
        name: 'Engineering Updated',
      });
      expect(updated.name).toBe('Engineering Updated');
    });

    it('handles optimistic fallback when department update fails', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Network error'));
      const fallback = await OrganizationService.updateDepartment('dept-99', {
        name: 'Fallback Dept',
        code: 'FB',
      });
      expect(fallback.id).toBe('dept-99');
      expect(fallback.name).toBe('Fallback Dept');
    });
  });

  describe('Job Roles Operations', () => {
    it('fetches and creates job roles', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({
          jobRoles: [
            {
              id: 'role-1',
              name: 'Software Engineer',
              code: 'SE',
              department_id: 'dept-1',
              is_supervisor_role: false,
            },
          ],
        })
        .mockResolvedValueOnce({
          jobRole: {
            id: 'role-2',
            name: 'Engineering Lead',
            code: 'EL',
            is_supervisor_role: true,
          },
        });

      const roles = await OrganizationService.getJobRoles('dept-1');
      expect(roles[0]!.name).toBe('Software Engineer');
      expect(roles[0]!.isSupervisorRole).toBe(false);

      const created = await OrganizationService.createJobRole({
        departmentId: 'dept-1',
        name: 'Engineering Lead',
        code: 'EL',
      });
      expect(created.id).toBe('role-2');
    });
  });

  describe('Shift Operations', () => {
    it('fetches, creates, updates, and deletes shifts', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({
          shifts: [
            {
              id: 'shift-1',
              name: 'General Shift',
              code: 'GS',
              start_time: '09:00',
              end_time: '18:00',
              grace_minutes: 15,
            },
          ],
        })
        .mockResolvedValueOnce({
          shift: {
            id: 'shift-2',
            name: 'Night Shift',
            code: 'NS',
            start_time: '22:00',
            end_time: '06:00',
            is_overnight: true,
          },
        })
        .mockResolvedValueOnce({
          shift: {
            id: 'shift-1',
            name: 'General Shift Updated',
            code: 'GS',
          },
        })
        .mockResolvedValueOnce({});

      const shifts = await OrganizationService.getShifts('comp-1');
      expect(shifts[0]!.name).toBe('General Shift');
      expect(shifts[0]!.graceMinutes).toBe(15);

      const created = await OrganizationService.createShift({
        name: 'Night Shift',
        code: 'NS',
        startTime: '22:00',
        endTime: '06:00',
        gracePeriodMinutes: 10,
        isOvernight: true,
      });
      expect(created.isOvernight).toBe(true);

      const updated = await OrganizationService.updateShift('shift-1', {
        name: 'General Shift Updated',
      });
      expect(updated.name).toBe('General Shift Updated');

      await OrganizationService.deleteShift('shift-1');
      expect(apiClient).toHaveBeenCalledWith('/hr/shifts/shift-1', { method: 'DELETE' });
    });

    it('normalizes department objects with all property casing variations', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        departments: [
          { id: 'd1', workspace_id: 'ws-1', company: { id: 'c-nested', name: 'Nested Comp' } },
          { id: 'd2', workspaceId: 'ws-2', companyId: 'c-direct', companyName: 'Direct Comp' },
          null,
        ],
      });

      const depts = await OrganizationService.getDepartments();
      expect(depts.length).toBe(3);
      expect(depts[0]?.companyId).toBe('c-nested');
      expect(depts[1]?.companyId).toBe('c-direct');
    });

    it('exercises unwrapList and unwrapEntity fallback branches', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ records: [{ id: 'c1' }] })
        .mockResolvedValueOnce({ data: [{ id: 'c2' }] })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ record: { id: 'c3', name: 'Record Comp' } })
        .mockResolvedValueOnce({ data: { id: 'c4', name: 'Data Comp' } })
        .mockResolvedValueOnce({ id: 'c5', name: 'Direct Comp' });

      const r1 = await OrganizationService.getCompanies();
      expect(r1.length).toBe(1);

      const r2 = await OrganizationService.getCompanies();
      expect(r2.length).toBe(1);

      const r3 = await OrganizationService.getCompanies();
      expect(r3).toEqual([]);

      const e1 = await OrganizationService.getCompany('c3');
      expect(e1.name).toBe('Record Comp');

      const e2 = await OrganizationService.getCompany('c4');
      expect(e2.name).toBe('Data Comp');

      const e3 = await OrganizationService.getCompany('c5');
      expect(e3.name).toBe('Direct Comp');
    });
  });
});

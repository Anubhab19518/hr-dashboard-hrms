import { describe, it, expect } from 'vitest';
import { createEmployeeSchema, assignEmployeeSchema } from '../schemas/employee.schema';

describe('HR Domain Contract - Workforce & Assignments', () => {
  describe('Employee Creation (Workspace Level)', () => {
    it('successfully validates employee creation without companyId', () => {
      const validPayload = {
        employeeCode: 'EMP-001',
        firstName: 'Sourav',
        lastName: 'Mondal',
        email: 'sourav.mondal@example.com',
        phone: '+919876543210',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        dateOfJoining: '2026-09-15',
      };

      const result = createEmployeeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyId).toBeUndefined();
        expect(result.data.firstName).toBe('Sourav');
      }
    });

    it('allows optional companyId if provided during legacy flows', () => {
      const validPayload = {
        employeeCode: 'EMP-002',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyId: 'd603a115-46c5-4428-af5e-85c8e38d7a18',
        employmentType: 'CONTRACTOR',
        status: 'ACTIVE',
        dateOfJoining: '2026-09-01',
      };

      const result = createEmployeeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyId).toBe('d603a115-46c5-4428-af5e-85c8e38d7a18');
      }
    });
  });

  describe('Employee Assignment Validation', () => {
    it('validates INTERNAL assignment without requiring companyId', () => {
      const internalPayload = {
        assignmentType: 'INTERNAL',
        jobRoleId: 'role-12345',
        departmentId: 'dept-67890',
        supervisorId: 'emp-supervisor-1',
        effectiveFrom: '2026-09-15',
      };

      const result = assignEmployeeSchema.safeParse(internalPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignmentType).toBe('INTERNAL');
        expect(result.data.companyId).toBeUndefined();
        expect(result.data.jobRoleId).toBe('role-12345');
      }
    });

    it('validates CLIENT_DEPLOYMENT assignment requiring companyId', () => {
      const clientDeploymentPayload = {
        assignmentType: 'CLIENT_DEPLOYMENT',
        companyId: 'client-comp-999',
        siteId: 'site-salt-lake',
        jobRoleId: 'role-guard',
        departmentId: 'dept-security',
        effectiveFrom: '2026-09-15',
      };

      const result = assignEmployeeSchema.safeParse(clientDeploymentPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignmentType).toBe('CLIENT_DEPLOYMENT');
        expect(result.data.companyId).toBe('client-comp-999');
        expect(result.data.siteId).toBe('site-salt-lake');
      }
    });

    it('fails CLIENT_DEPLOYMENT if client companyId is missing', () => {
      const invalidClientDeployment = {
        assignmentType: 'CLIENT_DEPLOYMENT',
        jobRoleId: 'role-guard',
        effectiveFrom: '2026-09-15',
      };

      const result = assignEmployeeSchema.safeParse(invalidClientDeployment);
      expect(result.success).toBe(false);
      if (!result.success) {
        const companyIdError = result.error.issues.find((i) => i.path.includes('companyId'));
        expect(companyIdError).toBeDefined();
        expect(companyIdError?.message).toContain('Client company is required');
      }
    });
  });
});

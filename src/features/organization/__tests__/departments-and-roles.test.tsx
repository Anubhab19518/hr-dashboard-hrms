import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DepartmentsAndRolesTab } from '../components/departments-and-roles-tab';
import { OrganizationService } from '../services/organization.service';
import type { Department, JobRole, Company } from '../types/organization.types';

vi.mock('../services/organization.service', () => ({
  OrganizationService: {
    getDepartments: vi.fn(),
    getJobRoles: vi.fn(),
    getCompanies: vi.fn(),
    createDepartment: vi.fn(),
    createJobRole: vi.fn(),
  },
}));

const mockCompanies: Company[] = [
  { id: 'comp_1', name: 'Acme Global Corp', code: 'ACME', type: 'INTERNAL', status: 'ACTIVE' },
  { id: 'comp_2', name: 'XYZ Client Ltd', code: 'XYZ', type: 'CLIENT', status: 'ACTIVE' },
];

const mockDepartments: Department[] = [
  {
    id: 'dept_ops',
    name: 'Operations & Logistics',
    code: 'DEP-OPS',
    companyId: 'comp_1',
    companyName: 'Acme Global Corp',
    status: 'ACTIVE',
  },
  {
    id: 'dept_eng',
    name: 'Engineering & Tech',
    code: 'DEP-ENG',
    companyId: 'comp_1',
    companyName: 'Acme Global Corp',
    status: 'ACTIVE',
  },
  {
    id: 'dept_sec',
    name: 'Security Services',
    code: 'DEP-SEC',
    companyId: 'comp_2',
    companyName: 'XYZ Client Ltd',
    status: 'ACTIVE',
  },
];

const mockJobRoles: JobRole[] = [
  {
    id: 'role_1',
    name: 'Operations Supervisor',
    code: 'OPS-SUP-01',
    departmentId: 'dept_ops',
    departmentName: 'Operations & Logistics',
    level: 'L2',
    status: 'ACTIVE',
  },
  {
    id: 'role_2',
    name: 'Warehouse Associate',
    code: 'OPS-WH-02',
    departmentId: 'dept_ops',
    departmentName: 'Operations & Logistics',
    level: 'L1',
    status: 'ACTIVE',
  },
  {
    id: 'role_3',
    name: 'Lead Software Architect',
    code: 'ENG-LEAD-01',
    departmentId: 'dept_eng',
    departmentName: 'Engineering & Tech',
    level: 'L4',
    status: 'ACTIVE',
  },
  {
    id: 'role_4',
    name: 'Security Guard',
    code: 'SEC-GD-01',
    departmentId: 'dept_sec',
    departmentName: 'Security Services',
    level: 'L1',
    status: 'ACTIVE',
  },
];

describe('DepartmentsAndRolesTab 2-Column Split View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(OrganizationService.getDepartments).mockResolvedValue(mockDepartments);
    vi.mocked(OrganizationService.getJobRoles).mockResolvedValue(mockJobRoles);
    vi.mocked(OrganizationService.getCompanies).mockResolvedValue(mockCompanies);
  });

  it('renders both 2-column cards: Departments on left and Job Roles on right', async () => {
    render(<DepartmentsAndRolesTab />);

    // Check loading goes away and headers render
    expect(
      await screen.findByRole('heading', { name: /Departments & Divisions/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Job Roles & Designations/i })).toBeInTheDocument();

    // Check departments are rendered
    expect(screen.getAllByText('Operations & Logistics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Engineering & Tech').length).toBeGreaterThan(0);

    // Check all roles are initially visible
    expect(screen.getByText('Operations Supervisor')).toBeInTheDocument();
    expect(screen.getByText('Warehouse Associate')).toBeInTheDocument();
    expect(screen.getByText('Lead Software Architect')).toBeInTheDocument();
  });

  it('filters job roles when a department is clicked on the left column', async () => {
    render(<DepartmentsAndRolesTab />);

    await screen.findByRole('heading', { name: /Departments & Divisions/i });

    // Click on Operations & Logistics department
    const deptCards = screen.getAllByText('Operations & Logistics');
    fireEvent.click(deptCards[0]!);

    // Job roles should now be filtered to Operations & Logistics only
    await waitFor(() => {
      expect(screen.getByText('Operations Supervisor')).toBeInTheDocument();
      expect(screen.getByText('Warehouse Associate')).toBeInTheDocument();
      expect(screen.queryByText('Lead Software Architect')).not.toBeInTheDocument();
    });

    // Check banner for active filter
    expect(screen.getByText(/Filtered by:/i)).toBeInTheDocument();

    // Click "All Departments" to reset filter
    const allDeptsButton = screen.getByText('All Departments');
    fireEvent.click(allDeptsButton);

    await waitFor(() => {
      expect(screen.getByText('Lead Software Architect')).toBeInTheDocument();
    });
  });

  it('filters departments using the department search box', async () => {
    render(<DepartmentsAndRolesTab />);

    await screen.findByRole('heading', { name: /Departments & Divisions/i });

    const searchInput = screen.getByPlaceholderText('Search departments or codes...');
    fireEvent.change(searchInput, { target: { value: 'DEP-ENG' } });

    expect(screen.getAllByText('Engineering & Tech').length).toBeGreaterThan(0);
    expect(screen.queryByText('DEP-OPS')).not.toBeInTheDocument();
  });

  it('opens modal and submits new department', async () => {
    const newDept: Department = {
      id: 'dept_hr',
      name: 'Human Resources',
      code: 'DEP-HR',
      companyId: 'comp_1',
      status: 'ACTIVE',
    };
    vi.mocked(OrganizationService.createDepartment).mockResolvedValueOnce(newDept);

    render(<DepartmentsAndRolesTab />);

    await screen.findByRole('heading', { name: /Departments & Divisions/i });

    const addDeptBtn = screen.getByRole('button', { name: /Add Dept/i });
    fireEvent.click(addDeptBtn);

    expect(screen.getByRole('heading', { name: 'Create Department' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Operations & Logistics'), {
      target: { value: 'Human Resources' },
    });
    fireEvent.change(screen.getByPlaceholderText('DEP-OPS'), {
      target: { value: 'DEP-HR' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Create Department' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(OrganizationService.createDepartment).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Human Resources',
          code: 'DEP-HR',
          companyId: 'comp_1',
        }),
      );
      expect(screen.getAllByText('Human Resources').length).toBeGreaterThan(0);
    });
  });

  it('opens modal and submits new job role with pre-selected department', async () => {
    const newRole: JobRole = {
      id: 'role_new',
      name: 'DevOps Engineer',
      code: 'ENG-DEVOPS-01',
      departmentId: 'dept_eng',
      departmentName: 'Engineering & Tech',
      level: 'L3',
      status: 'ACTIVE',
    };
    vi.mocked(OrganizationService.createJobRole).mockResolvedValueOnce(newRole);

    render(<DepartmentsAndRolesTab />);

    await screen.findByRole('heading', { name: /Departments & Divisions/i });

    // Click on Engineering department first
    const engDepts = screen.getAllByText('Engineering & Tech');
    fireEvent.click(engDepts[0]!);

    // Click Add Role
    const addRoleBtn = screen.getByRole('button', { name: /Add Role/i });
    fireEvent.click(addRoleBtn);

    expect(screen.getByRole('heading', { name: 'Create Job Role' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Senior Plant Engineer'), {
      target: { value: 'DevOps Engineer' },
    });
    fireEvent.change(screen.getByPlaceholderText('ENG-SR-01'), {
      target: { value: 'ENG-DEVOPS-01' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Create Role' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(OrganizationService.createJobRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'DevOps Engineer',
          code: 'ENG-DEVOPS-01',
          departmentId: 'dept_eng',
        }),
      );
      expect(screen.getAllByText('DevOps Engineer').length).toBeGreaterThan(0);
    });
  });

  it('switches company context and scopes departments and job roles accordingly', async () => {
    render(<DepartmentsAndRolesTab />);

    await screen.findByRole('heading', { name: /Departments & Divisions/i });

    // Initially comp_1 is selected: Operations & Logistics and Engineering & Tech should be visible
    expect(screen.getAllByText('Operations & Logistics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Engineering & Tech').length).toBeGreaterThan(0);
    expect(screen.queryByText('Security Services')).not.toBeInTheDocument();
    expect(screen.queryByText('Security Guard')).not.toBeInTheDocument();

    // Switch company selector to comp_2 (XYZ Client Ltd)
    const companySelect = screen.getByLabelText('Select Company Context');
    fireEvent.change(companySelect, { target: { value: 'comp_2' } });

    // Now only Security Services and Security Guard should be visible
    await waitFor(() => {
      expect(screen.getAllByText('Security Services').length).toBeGreaterThan(0);
      expect(screen.getByText('Security Guard')).toBeInTheDocument();
      expect(screen.queryByText('Operations & Logistics')).not.toBeInTheDocument();
      expect(screen.queryByText('Engineering & Tech')).not.toBeInTheDocument();
      expect(screen.queryByText('Operations Supervisor')).not.toBeInTheDocument();
    });
  });
});

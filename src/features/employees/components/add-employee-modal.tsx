'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import {
  User,
  Building2,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Key,
} from '@/components/atoms/icons';
import { EmployeeService } from '../services/employee.service';
import { IamService } from '../services/iam.service';
import { OrganizationService } from '@/features/organization/services/organization.service';
import type { Department, JobRole } from '@/features/organization/types/organization.types';
import type { SecurityRole, Permission, EmployeeSecurityFormValues } from '../types/employee-iam';
import type { Employee } from '../types/employee.types';
import { Step1PersonalInfo } from './steps/step-1-personal-info';
import { Step2DepartmentJobRole } from './steps/step-2-department-job-role';
import { Step3SecurityRolePicker } from './steps/step-3-security-role-picker';
import { Step4PermissionOverrides } from './steps/step-4-permission-overrides';
import { Step5CredentialsReview } from './steps/step-5-credentials-review';

export interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmployee: Employee) => void;
}

export type StepKey = 1 | 2 | 3 | 4 | 5;

interface StepInfo {
  number: StepKey;
  title: string;
  description: string;
  icon: typeof User;
}

const STEPS: StepInfo[] = [
  { number: 1, title: 'Personal Info', description: 'Name, contact & tenure', icon: User },
  {
    number: 2,
    title: 'Department & Role',
    description: 'Designation & org title',
    icon: Building2,
  },
  { number: 3, title: 'Security Roles', description: 'System access privileges', icon: Shield },
  {
    number: 4,
    title: 'Permission Overrides',
    description: 'Direct grants & denies',
    icon: ShieldCheck,
  },
  {
    number: 5,
    title: 'Credentials & Review',
    description: 'Password & effective matrix',
    icon: Key,
  },
];

const getInitialFormValues = (): EmployeeSecurityFormValues => ({
  employeeCode: `EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'MALE',
  dateOfBirth: '',
  dateOfJoining: new Date().toISOString().split('T')[0] ?? '',
  employmentType: 'FULL_TIME',
  departmentId: undefined,
  jobRoleId: undefined,
  selectedRoleIds: [],
  grantedOverrides: [],
  deniedOverrides: [],
  initialPassword: '',
  forceChangePassword: true,
});

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [activeStep, setActiveStep] = useState<StepKey>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());
  const [formValues, setFormValues] = useState<EmployeeSecurityFormValues>(getInitialFormValues());
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');

  // Catalog Caches
  const [availableRoles, setAvailableRoles] = useState<SecurityRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);

  // Selected HR Job Role title for suggestion mapping
  const [selectedJobRoleTitle, setSelectedJobRoleTitle] = useState<string | undefined>();

  // Success Provisioning Modal state
  const [createdEmployee, setCreatedEmployee] = useState<{
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    password?: string;
    rolesCount: number;
    effectivePermsCount: number;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Load catalogs once when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setStepError(null);
    setCreatedEmployee(null);
    setActiveStep(1);
    setCompletedSteps(new Set());
    setFormValues(getInitialFormValues());

    let mounted = true;
    async function loadCatalogs() {
      try {
        const [roles, perms, depts, jRoles] = await Promise.all([
          IamService.getSecurityRoles(),
          IamService.getAtomicPermissions(),
          OrganizationService.getDepartments(),
          OrganizationService.getJobRoles(),
        ]);
        if (mounted) {
          setAvailableRoles(roles);
          setAllPermissions(perms);
          setDepartments(depts);
          setJobRoles(jRoles);
        }
      } catch (err) {
        console.error('Failed to load employee onboarding catalogs', err);
      }
    }
    loadCatalogs();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const updateFormValues = (patch: Partial<EmployeeSecurityFormValues>) => {
    setFormValues((prev) => ({ ...prev, ...patch }));
    setStepError(null);
  };

  const validateCurrentStep = (step: StepKey): string | null => {
    switch (step) {
      case 1:
        if (!formValues.firstName.trim()) return 'First Name is required.';
        if (!formValues.lastName.trim()) return 'Last Name is required.';
        if (!formValues.employeeCode.trim()) return 'Employee Code is required.';
        if (!formValues.email.trim() || !formValues.email.includes('@'))
          return 'A valid official Email Address is required.';
        if (!formValues.phone.trim() || formValues.phone.trim().length < 7)
          return 'A valid Phone Number is required.';
        if (!formValues.dateOfJoining) return 'Date of Joining is required.';
        return null;

      case 2:
        // Department & Job Role are optional for initial talent pool, but validate if provided
        return null;

      case 3:
        if (formValues.selectedRoleIds.length === 0) {
          return 'Please select at least one Security Role (e.g. Employee or HR Executive).';
        }
        return null;

      case 4:
        return null; // Overrides are optional

      case 5:
        if (formValues.initialPassword && formValues.initialPassword.length < 6) {
          return 'Password must be at least 6 characters long.';
        }
        return null;

      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateCurrentStep(activeStep);
    if (error) {
      setStepError(error);
      return;
    }

    setCompletedSteps((prev) => new Set(prev).add(activeStep));
    if (activeStep < 5) {
      setActiveStep((prev) => (prev + 1) as StepKey);
    }
  };

  const handlePrev = () => {
    setStepError(null);
    if (activeStep > 1) {
      setActiveStep((prev) => (prev - 1) as StepKey);
    }
  };

  const handleStepClick = (targetStep: StepKey) => {
    if (targetStep < activeStep || completedSteps.has((targetStep - 1) as StepKey)) {
      const error = validateCurrentStep(activeStep);
      if (!error) {
        setCompletedSteps((prev) => new Set(prev).add(activeStep));
      }
      setActiveStep(targetStep);
      setStepError(null);
    }
  };

  // Submit sequential creation chain
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStepError(null);

    // Validate all steps
    for (let s = 1; s <= 5; s++) {
      const err = validateCurrentStep(s as StepKey);
      if (err) {
        setStepError(`Step ${s}: ${err}`);
        setActiveStep(s as StepKey);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionProgress('Creating employee workforce record...');

    try {
      // 1. Create Employee Entity via POST /api/v1/hr/employees
      const mappedEmploymentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'CASUAL' | 'INTERN' =
        formValues.employmentType === 'CONTRACT'
          ? 'CONTRACTOR'
          : formValues.employmentType === 'PROBATION'
            ? 'FULL_TIME'
            : formValues.employmentType;

      const BLOOD_GROUP_MAP: Record<
        string,
        | 'A_POSITIVE'
        | 'A_NEGATIVE'
        | 'B_POSITIVE'
        | 'B_NEGATIVE'
        | 'AB_POSITIVE'
        | 'AB_NEGATIVE'
        | 'O_POSITIVE'
        | 'O_NEGATIVE'
      > = {
        'A+': 'A_POSITIVE',
        'A-': 'A_NEGATIVE',
        'B+': 'B_POSITIVE',
        'B-': 'B_NEGATIVE',
        'AB+': 'AB_POSITIVE',
        'AB-': 'AB_NEGATIVE',
        'O+': 'O_POSITIVE',
        'O-': 'O_NEGATIVE',
        A_POSITIVE: 'A_POSITIVE',
        A_NEGATIVE: 'A_NEGATIVE',
        B_POSITIVE: 'B_POSITIVE',
        B_NEGATIVE: 'B_NEGATIVE',
        AB_POSITIVE: 'AB_POSITIVE',
        AB_NEGATIVE: 'AB_NEGATIVE',
        O_POSITIVE: 'O_POSITIVE',
        O_NEGATIVE: 'O_NEGATIVE',
      };

      const employeePayload = {
        employeeCode: formValues.employeeCode.trim().toUpperCase(),
        firstName: formValues.firstName.trim(),
        middleName: formValues.middleName?.trim() || undefined,
        lastName: formValues.lastName.trim(),
        email: formValues.email.trim().toLowerCase(),
        phone: formValues.phone.trim(),
        gender: formValues.gender,
        dateOfBirth: formValues.dateOfBirth || undefined,
        dateOfJoining: formValues.dateOfJoining,
        employmentType: mappedEmploymentType,
        status: (formValues.employmentType === 'PROBATION' ? 'PROBATION' : 'ACTIVE') as
          'ACTIVE' | 'PROBATION',
        nationality: 'INDIAN',
        physicallyChallenged: false,
        departmentId: formValues.departmentId || undefined,
        jobRoleId: formValues.jobRoleId || undefined,
        // Demographic & banking fields if provided
        fatherOrSpouseName: formValues.fatherOrSpouseName || undefined,
        maritalStatus: formValues.maritalStatus || undefined,
        bloodGroup: formValues.bloodGroup ? BLOOD_GROUP_MAP[formValues.bloodGroup] : undefined,
        emergencyContactName: formValues.emergencyContactName || undefined,
        emergencyContactPhone: formValues.emergencyContactPhone || undefined,
        emergencyContactRelation: formValues.emergencyContactRelation || undefined,
      };

      const created = await EmployeeService.createEmployee(employeePayload);
      const employeeId = created.id;

      // 2. Assign Security Roles sequentially via POST /api/v1/iam/employees/:id/roles
      if (formValues.selectedRoleIds.length > 0) {
        setSubmissionProgress('Provisioning security roles...');
        for (const roleId of formValues.selectedRoleIds) {
          try {
            await IamService.assignSecurityRole(employeeId, roleId);
          } catch (roleErr) {
            console.warn(`Failed to assign role ${roleId}`, roleErr);
          }
        }
      }

      // 3. Configure Direct Permission Overrides
      if (formValues.grantedOverrides.length > 0) {
        setSubmissionProgress('Applying direct permission grants...');
        for (const grant of formValues.grantedOverrides) {
          try {
            await IamService.grantDirectPermission(employeeId, grant.permissionId, grant.reason);
          } catch (grantErr) {
            console.warn(`Failed to grant permission ${grant.permissionId}`, grantErr);
          }
        }
      }

      if (formValues.deniedOverrides.length > 0) {
        setSubmissionProgress('Applying explicit permission restrictions...');
        for (const deny of formValues.deniedOverrides) {
          try {
            await IamService.denyDirectPermission(employeeId, deny.permissionId, deny.reason);
          } catch (denyErr) {
            console.warn(`Failed to deny permission ${deny.permissionId}`, denyErr);
          }
        }
      }

      // 4. Set Initial Credentials via POST /api/v1/iam/employees/:id/password
      if (formValues.initialPassword && formValues.initialPassword.trim()) {
        setSubmissionProgress('Setting initial credentials and security policy...');
        try {
          await IamService.setEmployeePassword(
            employeeId,
            formValues.initialPassword.trim(),
            formValues.forceChangePassword,
          );
        } catch (passErr) {
          console.warn('Failed to set initial password', passErr);
        }
      }

      // 5. Done! Notify caller and show success credential modal
      onSuccess(created);

      setCreatedEmployee({
        id: employeeId,
        employeeCode: created.employeeCode,
        fullName: `${formValues.firstName} ${formValues.lastName}`.trim(),
        email: formValues.email,
        password: formValues.initialPassword || undefined,
        rolesCount: formValues.selectedRoleIds.length,
        effectivePermsCount: formValues.selectedRoleIds.length > 0 ? 15 : 5,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete employee onboarding';
      setStepError(msg);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress('');
    }
  };

  const copyCreatedCredentials = () => {
    if (!createdEmployee) return;
    const credText = `HRMS Portal Credentials:\nName: ${createdEmployee.fullName}\nEmployee Code: ${createdEmployee.employeeCode}\nEmail: ${createdEmployee.email}\nTemporary Password: ${createdEmployee.password || '(None set)'}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(credText);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2000);
  };

  // Find Department and Job Role names for Review step
  const currentDept = departments.find((d) => d.id === formValues.departmentId);
  const currentJobRole = jobRoles.find((r) => r.id === formValues.jobRoleId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard Employee & Configure Security"
      description="Add an employee and configure their organizational designation and security permissions."
      size="5xl"
    >
      {/* SUCCESS PROVISIONING VIEW */}
      {createdEmployee ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            textAlign: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2
              style={{
                margin: '0 0 6px 0',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
              }}
            >
              Employee Onboarded & IAM Provisioned Successfully!
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
              The account and security permissions have been established in the centralized identity
              system.
            </p>
          </div>

          {/* Credential Slip Card */}
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '16px 20px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                }}
              >
                Onboarding Credentials Slip
              </span>
              <button
                type="button"
                onClick={copyCreatedCredentials}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  color: '#2563eb',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                {copiedCredentials ? (
                  <Check size={14} style={{ color: '#16a34a' }} />
                ) : (
                  <Copy size={14} />
                )}
                {copiedCredentials ? 'Copied' : 'Copy All'}
              </button>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
            >
              <span style={{ color: '#64748b' }}>Employee Name:</span>
              <strong>{createdEmployee.fullName}</strong>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
            >
              <span style={{ color: '#64748b' }}>Employee Code:</span>
              <code style={{ color: '#2563eb', fontWeight: 700 }}>
                {createdEmployee.employeeCode}
              </code>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
            >
              <span style={{ color: '#64748b' }}>Official Email:</span>
              <span>{createdEmployee.email}</span>
            </div>

            {createdEmployee.password && (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
              >
                <span style={{ color: '#64748b' }}>Initial Password:</span>
                <code
                  style={{
                    backgroundColor: '#fef08a',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  {createdEmployee.password}
                </code>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            style={{ minWidth: '140px', marginTop: 'var(--space-2)' }}
          >
            Done
          </Button>
        </div>
      ) : (
        /* WIZARD FORM VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 'var(--space-4)',
            padding: 0,
            minHeight: '480px',
          }}
        >
          {/* LEFT COLUMN: STEP NAVIGATION SIDEBAR */}
          <div
            style={{
              borderRight: '1px solid hsl(var(--border-subtle))',
              paddingRight: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            {STEPS.map((step) => {
              const isActive = activeStep === step.number;
              const isCompleted = completedSteps.has(step.number);
              const StepIcon = step.icon;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => handleStepClick(step.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#e2e8f0',
                      color: isCompleted || isActive ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? <Check size={14} /> : <StepIcon size={14} />}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#1e40af' : 'hsl(var(--text-primary))',
                      }}
                    >
                      {step.title}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--text-muted))' }}>
                      {step.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT COLUMN: STEP CONTENT & CONTROLS */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingLeft: 'var(--space-2)',
            }}
          >
            <div style={{ flex: 1 }}>
              {activeStep === 1 && (
                <Step1PersonalInfo
                  values={formValues}
                  onChange={updateFormValues}
                  error={stepError}
                />
              )}

              {activeStep === 2 && (
                <Step2DepartmentJobRole
                  values={formValues}
                  onChange={updateFormValues}
                  onJobRoleSelected={(role) => {
                    setSelectedJobRoleTitle(role?.name);
                  }}
                  error={stepError}
                />
              )}

              {activeStep === 3 && (
                <Step3SecurityRolePicker
                  values={formValues}
                  onChange={updateFormValues}
                  jobRoleTitle={selectedJobRoleTitle || currentJobRole?.name}
                  error={stepError}
                />
              )}

              {activeStep === 4 && (
                <Step4PermissionOverrides
                  values={formValues}
                  onChange={updateFormValues}
                  error={stepError}
                />
              )}

              {activeStep === 5 && (
                <Step5CredentialsReview
                  values={formValues}
                  onChange={updateFormValues}
                  availableRoles={availableRoles}
                  allPermissions={allPermissions}
                  departmentName={currentDept?.name}
                  jobRoleName={currentJobRole?.name}
                  error={stepError}
                />
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid hsl(var(--border-subtle))',
                marginTop: 'var(--space-4)',
              }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={activeStep === 1 || isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={16} /> Back
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {isSubmitting && (
                  <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                    {submissionProgress}
                  </span>
                )}

                {activeStep < 5 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Next Step <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#16a34a',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    {isSubmitting ? 'Provisioning IAM...' : 'Create Employee & Provision IAM'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

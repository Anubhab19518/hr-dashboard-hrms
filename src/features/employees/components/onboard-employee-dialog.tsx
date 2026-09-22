'use client';

import { useState, type FormEvent, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Badge } from '@/components/atoms/badge';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Shield,
  FileSpreadsheet,
} from '@/components/atoms/icons';
import { EmployeeService } from '../services/employee.service';
import type { CreateEmployeeInput } from '../schemas/employee.schema';
import type { Employee } from '../types/employee.types';

export interface OnboardEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmployee: Employee) => void;
}

export type StepKey = 1 | 2 | 3 | 4 | 5 | 6;

interface StepInfo {
  number: StepKey;
  title: string;
  description: string;
}

const STEPS: StepInfo[] = [
  { number: 1, title: 'Basic Details', description: 'Personal info, contact & tenure' },
  { number: 2, title: 'Personal Details', description: 'Demographics, blood group & emergency' },
  { number: 3, title: 'Address Details', description: 'Current & permanent address' },
  { number: 4, title: 'Bank Details', description: 'Bank account & disbursement info' },
  { number: 5, title: 'Statutory & KYC', description: 'PAN, Aadhaar & EPFO/ESIC info' },
  { number: 6, title: 'Review & Submit', description: 'Verify details & create talent record' },
];

const BLOOD_GROUP_OPTIONS = [
  { value: 'A_POSITIVE', label: 'A+ (A Positive)' },
  { value: 'A_NEGATIVE', label: 'A- (A Negative)' },
  { value: 'B_POSITIVE', label: 'B+ (B Positive)' },
  { value: 'B_NEGATIVE', label: 'B- (B Negative)' },
  { value: 'AB_POSITIVE', label: 'AB+ (AB Positive)' },
  { value: 'AB_NEGATIVE', label: 'AB- (AB Negative)' },
  { value: 'O_POSITIVE', label: 'O+ (O Positive)' },
  { value: 'O_NEGATIVE', label: 'O- (O Negative)' },
];

const DRAFT_STORAGE_KEY = 'hr_employee_onboarding_draft_v1';

export function OnboardEmployeeDialog({ isOpen, onClose, onSuccess }: OnboardEmployeeDialogProps) {
  const [activeStep, setActiveStep] = useState<StepKey>(1);
  const [savedSteps, setSavedSteps] = useState<Set<StepKey>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  // Full name helper state
  const [fullNameInput, setFullNameInput] = useState('');
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
  const [hasPoliceVerification, setHasPoliceVerification] = useState(false);

  // Main Form Data
  const [formData, setFormData] = useState<CreateEmployeeInput>({
    employeeCode: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyId: '',
    dateOfJoining: new Date().toISOString().split('T')[0] ?? '',
    dateOfBirth: '',
    gender: 'MALE',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',

    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'SPOUSE',

    // Statutory & KYC
    aadhaarNumber: '',
    panNumber: '',
    uanNumber: '',
    pfNumber: '',
    esicIpNumber: '',

    // Bank Details
    bankName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankAccountHolderName: '',

    // Family & Personal Demographics
    fatherOrSpouseName: '',
    fatherOrSpouseRelation: 'FATHER',
    maritalStatus: 'SINGLE',
    bloodGroup: '',
    nationality: 'INDIAN',
    physicallyChallenged: false,

    // Addresses
    currentAddress: '',
    currentCity: '',
    currentState: '',
    currentPincode: '',
    permanentAddress: '',
    permanentCity: '',
    permanentState: '',
    permanentPincode: '',

    // Police Verification
    policeVerificationCertNo: '',
    policeStationName: '',
    policeVerificationDate: '',
    policeVerificationExpiryDate: '',
  });

  // Success Created Employee Result
  const [createdEmployeeResult, setCreatedEmployeeResult] = useState<{
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    phone?: string;
  } | null>(null);

  // Reset or load draft on open
  useEffect(() => {
    if (!isOpen) return;
    setActiveStep(1);
    setSavedSteps(new Set());
    setServerError(null);
    setDraftNotice(null);
    setCreatedEmployeeResult(null);
    setSameAsCurrentAddress(false);
    setHasPoliceVerification(false);
    setFullNameInput('');

    // Check for saved local draft
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          setDraftNotice('A saved draft is available. You can resume editing or clear it.');
        }
      }
    } catch {
      // Ignore local storage error
    }

    setFormData({
      employeeCode: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyId: '',
      dateOfJoining: new Date().toISOString().split('T')[0] ?? '',
      dateOfBirth: '',
      gender: 'MALE',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: 'SPOUSE',
      aadhaarNumber: '',
      panNumber: '',
      uanNumber: '',
      pfNumber: '',
      esicIpNumber: '',
      bankName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      bankAccountHolderName: '',
      fatherOrSpouseName: '',
      fatherOrSpouseRelation: 'FATHER',
      maritalStatus: 'SINGLE',
      bloodGroup: '',
      nationality: 'INDIAN',
      physicallyChallenged: false,
      currentAddress: '',
      currentCity: '',
      currentState: '',
      currentPincode: '',
      permanentAddress: '',
      permanentCity: '',
      permanentState: '',
      permanentPincode: '',
      policeVerificationCertNo: '',
      policeStationName: '',
      policeVerificationDate: '',
      policeVerificationExpiryDate: '',
    });
  }, [isOpen]);

  const loadSavedDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        const name = `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
        if (name) setFullNameInput(name);
        if (parsed.policeVerificationCertNo || parsed.policeStationName) {
          setHasPoliceVerification(true);
        }
        setDraftNotice('Draft restored successfully!');
        setTimeout(() => setDraftNotice(null), 3000);
      }
    } catch {
      setServerError('Failed to load draft from storage');
    }
  };

  const clearSavedDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraftNotice(null);
    } catch {
      // Ignore
    }
  };

  const handleFieldChange = (field: keyof CreateEmployeeInput, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Sync address if same
      if (sameAsCurrentAddress && field.startsWith('current')) {
        if (field === 'currentAddress') updated.permanentAddress = value as string;
        if (field === 'currentCity') updated.permanentCity = value as string;
        if (field === 'currentState') updated.permanentState = value as string;
        if (field === 'currentPincode') updated.permanentPincode = value as string;
      }

      // Auto-sync Bank Account Holder Name if unmodified
      if (field === 'firstName' || field === 'lastName') {
        const fName = field === 'firstName' ? (value as string) : prev.firstName;
        const lName = field === 'lastName' ? (value as string) : prev.lastName;
        const combined = `${fName} ${lName}`.trim();
        const prevCombined = `${prev.firstName} ${prev.lastName}`.trim();
        if (!prev.bankAccountHolderName || prev.bankAccountHolderName === prevCombined) {
          updated.bankAccountHolderName = combined;
        }
      }

      return updated;
    });
    setServerError(null);
  };

  const handleFullNameChange = (val: string) => {
    setFullNameInput(val);
    const parts = val.trim().split(/\s+/);
    if (parts.length === 1) {
      setFormData((prev) => {
        const prevCombined = `${prev.firstName} ${prev.lastName}`.trim();
        return {
          ...prev,
          firstName: parts[0] || '',
          lastName: prev.lastName || '',
          bankAccountHolderName:
            !prev.bankAccountHolderName || prev.bankAccountHolderName === prevCombined
              ? val.trim()
              : prev.bankAccountHolderName,
        };
      });
    } else if (parts.length >= 2) {
      setFormData((prev) => {
        const prevCombined = `${prev.firstName} ${prev.lastName}`.trim();
        return {
          ...prev,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          bankAccountHolderName:
            !prev.bankAccountHolderName || prev.bankAccountHolderName === prevCombined
              ? val.trim()
              : prev.bankAccountHolderName,
        };
      });
    }
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSameAsCurrentAddress(isChecked);
    if (isChecked) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: prev.currentAddress,
        permanentCity: prev.currentCity,
        permanentState: prev.currentState,
        permanentPincode: prev.currentPincode,
      }));
    }
  };

  // Step Validation
  const validateStep = (step: StepKey): boolean => {
    setServerError(null);
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setServerError('Please enter both First Name and Last Name.');
        return false;
      }
      if (!formData.employeeCode.trim()) {
        setServerError('Employee Code is required.');
        return false;
      }
      if (!formData.email?.trim() || !formData.email.includes('@')) {
        setServerError('A valid Official Email Address is required.');
        return false;
      }
      if (!formData.phone?.trim()) {
        setServerError('Primary Phone Number is required.');
        return false;
      }
      if (!formData.dateOfJoining) {
        setServerError('Date of Joining is required.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setSavedSteps((prev) => new Set(prev).add(activeStep));
    if (activeStep < 6) {
      setActiveStep((prev) => (prev + 1) as StepKey);
    }
  };

  const handleBack = () => {
    setServerError(null);
    if (activeStep > 1) {
      setActiveStep((prev) => (prev - 1) as StepKey);
    }
  };

  const handleStepClick = (target: StepKey) => {
    if (target < activeStep || savedSteps.has((target - 1) as StepKey)) {
      if (validateStep(activeStep)) {
        setSavedSteps((prev) => new Set(prev).add(activeStep));
      }
      setActiveStep(target);
      setServerError(null);
    }
  };

  // Save As Draft Action
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      setDraftNotice('Draft saved to browser storage! You can resume your onboarding anytime.');
      setTimeout(() => setDraftNotice(null), 4000);
    } catch {
      setServerError('Unable to save draft locally.');
    }
  };

  // Submit sequential creation chain
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate Step 1
    if (!validateStep(1)) {
      setActiveStep(1);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create Employee in Workspace Talent Pool via POST /api/v1/hr/employees
      const mappedEmploymentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'CASUAL' | 'INTERN' =
        formData.employmentType === 'CONTRACTOR'
          ? 'CONTRACTOR'
          : formData.employmentType === 'PART_TIME'
            ? 'PART_TIME'
            : formData.employmentType === 'CASUAL'
              ? 'CASUAL'
              : formData.employmentType === 'INTERN'
                ? 'INTERN'
                : 'FULL_TIME';

      const payload = {
        employeeCode: formData.employeeCode.trim().toUpperCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim().toLowerCase() || undefined,
        phone: formData.phone?.trim() || undefined,
        gender: formData.gender || 'MALE',
        dateOfBirth: formData.dateOfBirth || undefined,
        dateOfJoining: formData.dateOfJoining,
        employmentType: mappedEmploymentType,
        status: formData.status || 'ACTIVE',

        // Demographics & Emergency
        fatherOrSpouseName: formData.fatherOrSpouseName?.trim() || undefined,
        fatherOrSpouseRelation: formData.fatherOrSpouseRelation || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        nationality: formData.nationality || 'INDIAN',
        physicallyChallenged: formData.physicallyChallenged || false,
        emergencyContactName: formData.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || undefined,
        emergencyContactRelation: formData.emergencyContactRelation?.trim() || undefined,

        // Address
        currentAddress: formData.currentAddress?.trim() || undefined,
        currentCity: formData.currentCity?.trim() || undefined,
        currentState: formData.currentState?.trim() || undefined,
        currentPincode: formData.currentPincode?.trim() || undefined,
        permanentAddress: formData.permanentAddress?.trim() || undefined,
        permanentCity: formData.permanentCity?.trim() || undefined,
        permanentState: formData.permanentState?.trim() || undefined,
        permanentPincode: formData.permanentPincode?.trim() || undefined,

        // Bank (Default holder name to full name if empty)
        bankName: formData.bankName?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankIfscCode: formData.bankIfscCode?.trim() || undefined,
        bankAccountHolderName:
          formData.bankAccountHolderName?.trim() ||
          `${formData.firstName} ${formData.lastName}`.trim() ||
          undefined,

        // Statutory & KYC
        panNumber: formData.panNumber?.trim() || undefined,
        aadhaarNumber: formData.aadhaarNumber?.trim() || undefined,
        uanNumber: formData.uanNumber?.trim() || undefined,
        pfNumber: formData.pfNumber?.trim() || undefined,
        esicIpNumber: formData.esicIpNumber?.trim() || undefined,
        policeVerificationCertNo: hasPoliceVerification
          ? formData.policeVerificationCertNo?.trim() || undefined
          : undefined,
        policeStationName: hasPoliceVerification
          ? formData.policeStationName?.trim() || undefined
          : undefined,
        policeVerificationDate: hasPoliceVerification
          ? formData.policeVerificationDate || undefined
          : undefined,
        policeVerificationExpiryDate: hasPoliceVerification
          ? formData.policeVerificationExpiryDate || undefined
          : undefined,
      };

      const created = await EmployeeService.createEmployee(payload);

      // Clean up saved draft upon successful creation
      clearSavedDraft();

      setCreatedEmployeeResult({
        id: created.id,
        employeeCode: created.employeeCode,
        fullName: `${created.firstName} ${created.lastName}`,
        email: created.email || formData.email || '',
        phone: created.phone || formData.phone,
      });

      onSuccess(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create employee record';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Completion Progress Gauge
  const completionPercentage = useMemo(() => {
    let completedCount = 0;
    if (
      formData.firstName &&
      formData.lastName &&
      formData.employeeCode &&
      formData.email &&
      formData.phone
    )
      completedCount++;
    if (formData.dateOfBirth || formData.fatherOrSpouseName || formData.bloodGroup)
      completedCount++;
    if (formData.currentAddress || formData.permanentAddress) completedCount++;
    if (formData.bankAccountNumber || formData.bankIfscCode) completedCount++;
    if (formData.aadhaarNumber || formData.panNumber) completedCount++;
    return Math.round((completedCount / 5) * 100);
  }, [formData]);

  // Derived Bank Account Holder fallback
  const resolvedAccountHolder =
    formData.bankAccountHolderName || `${formData.firstName} ${formData.lastName}`.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Employee"
      description="Add a new talent record to the workspace pool with personal, banking & statutory information."
      size="5xl"
    >
      {/* SUCCESS CONFIRMATION VIEW */}
      {createdEmployeeResult ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px 16px',
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
            <CheckCircle2 size={38} />
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
              Employee Successfully Onboarded!
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
              The employee has been registered in your workspace talent pool and is ready for site
              deployment and access configuration.
            </p>
          </div>

          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '16px 20px',
              borderRadius: '10px',
              backgroundColor: 'hsl(var(--bg-secondary))',
              border: '1px solid hsl(var(--border-subtle))',
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
                borderBottom: '1px solid hsl(var(--border-subtle))',
                paddingBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                }}
              >
                Talent Pool Record
              </span>
              <Badge variant="success">Active</Badge>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
            >
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Employee Name:</span>
              <strong>{createdEmployeeResult.fullName}</strong>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
            >
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Employee Code:</span>
              <code style={{ color: 'hsl(var(--primary-color))', fontWeight: 700 }}>
                {createdEmployeeResult.employeeCode}
              </code>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
            >
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Official Email:</span>
              <span>{createdEmployeeResult.email}</span>
            </div>

            {createdEmployeeResult.phone && (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}
              >
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Primary Phone:</span>
                <span>{createdEmployeeResult.phone}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Link href={`/dashboard/employees/${createdEmployeeResult.id}`}>
              <Button
                variant="primary"
                onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Open Profile & Configure Access</span>
                <ExternalLink size={14} />
              </Button>
            </Link>
            <Button type="button" variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        /* ORIGINAL 3-COLUMN ONBOARDING WIZARD */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr 220px',
            gap: 'var(--space-4)',
            padding: 0,
          }}
        >
          {/* 1. LEFT COLUMN: STEP NAVIGATION SIDEBAR */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              borderRight: '1px solid hsl(var(--border-subtle))',
              paddingRight: 'var(--space-4)',
            }}
          >
            {STEPS.map((s) => {
              const isActive = activeStep === s.number;
              const isDone = savedSteps.has(s.number);

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => handleStepClick(s.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'hsl(var(--primary-color) / 0.1)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                      backgroundColor: isDone
                        ? '#16a34a'
                        : isActive
                          ? 'hsl(var(--primary-color))'
                          : 'hsl(var(--border-subtle))',
                      color: isDone || isActive ? '#ffffff' : 'hsl(var(--text-secondary))',
                    }}
                  >
                    {isDone ? <Check size={14} /> : s.number}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'hsl(var(--primary-color))' : 'hsl(var(--text-primary))',
                        lineHeight: 1.2,
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'hsl(var(--text-muted))',
                        marginTop: '2px',
                        lineHeight: 1.2,
                      }}
                    >
                      {s.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. MIDDLE COLUMN: ACTIVE STEP FORM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {draftNotice && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'hsl(var(--primary-color) / 0.08)',
                  border: '1px solid hsl(var(--primary-color) / 0.25)',
                  borderRadius: '6px',
                  color: 'hsl(var(--primary-color))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={16} />
                  <span>{draftNotice}</span>
                </div>
                {localStorage.getItem(DRAFT_STORAGE_KEY) && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={loadSavedDraft}
                      style={{
                        background: 'hsl(var(--primary-color))',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Resume Draft
                    </button>
                    <button
                      type="button"
                      onClick={clearSavedDraft}
                      style={{
                        background: 'transparent',
                        color: 'hsl(var(--text-secondary))',
                        border: '1px solid hsl(var(--border-subtle))',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            {serverError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                  border: '1px solid hsl(var(--color-danger) / 0.3)',
                  borderRadius: '6px',
                  color: 'hsl(var(--color-danger))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <AlertCircle size={16} />
                <span>{serverError}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              {/* ----------------------------------------------------
                  STEP 1: BASIC DETAILS (Personal & Contact)
              ---------------------------------------------------- */}
              {activeStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Photo & Employee Code */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-code"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Employee ID / Code <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <Input
                        id="emp-code"
                        placeholder="EMP-2026-001"
                        value={formData.employeeCode}
                        onChange={(e) =>
                          handleFieldChange('employeeCode', e.target.value.toUpperCase())
                        }
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-full-name"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Full Name <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <Input
                        id="emp-full-name"
                        placeholder="First and Last Name"
                        value={fullNameInput || `${formData.firstName} ${formData.lastName}`.trim()}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-email"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Official Email <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <Input
                        id="emp-email"
                        type="email"
                        placeholder="john.doe@enterprise.com"
                        value={formData.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-phone"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Primary Phone <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <Input
                        id="emp-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Joining Date, Employment Type & Status */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-doj"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Date of Joining <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <Input
                        id="emp-doj"
                        type="date"
                        value={formData.dateOfJoining}
                        onChange={(e) => handleFieldChange('dateOfJoining', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-employment-type"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Employment Type
                      </label>
                      <select
                        id="emp-employment-type"
                        value={formData.employmentType}
                        onChange={(e) => handleFieldChange('employmentType', e.target.value)}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid hsl(var(--border-subtle))',
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          color: 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="FULL_TIME">Full-Time Regular</option>
                        <option value="CONTRACTOR">Contractual / Deputed</option>
                        <option value="CASUAL">Casual / Daily Wage</option>
                        <option value="PART_TIME">Part-Time</option>
                        <option value="INTERN">Internship</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="emp-status"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Initial Status
                      </label>
                      <select
                        id="emp-status"
                        value={formData.status}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid hsl(var(--border-subtle))',
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          color: 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PROBATION">Probation</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                  STEP 2: PERSONAL DETAILS & DEMOGRAPHICS (with Blood Group Dropdown)
              ---------------------------------------------------- */}
              {activeStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Guardian details */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-guardian"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Father / Spouse Name
                      </label>
                      <Input
                        id="emp-guardian"
                        placeholder="Guardian Name"
                        value={formData.fatherOrSpouseName || ''}
                        onChange={(e) => handleFieldChange('fatherOrSpouseName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-guardian-rel"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Relationship
                      </label>
                      <select
                        id="emp-guardian-rel"
                        value={formData.fatherOrSpouseRelation || 'FATHER'}
                        onChange={(e) =>
                          handleFieldChange('fatherOrSpouseRelation', e.target.value)
                        }
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid hsl(var(--border-subtle))',
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          color: 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="FATHER">Father</option>
                        <option value="HUSBAND">Husband</option>
                        <option value="WIFE">Wife</option>
                        <option value="MOTHER">Mother</option>
                      </select>
                    </div>
                  </div>

                  {/* DOB, Gender & Marital Status */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-dob"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Date of Birth
                      </label>
                      <Input
                        id="emp-dob"
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-gender"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Gender
                      </label>
                      <select
                        id="emp-gender"
                        value={formData.gender || 'MALE'}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid hsl(var(--border-subtle))',
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          color: 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="emp-marital"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Marital Status
                      </label>
                      <select
                        id="emp-marital"
                        value={formData.maritalStatus || 'SINGLE'}
                        onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid hsl(var(--border-subtle))',
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          color: 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </select>
                    </div>
                  </div>

                  {/* Blood Group Dropdown, Nationality & Differently Abled */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-blood-group"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Blood Group
                      </label>
                      <select
                        id="emp-blood-group"
                        value={formData.bloodGroup || ''}
                        onChange={(e) => handleFieldChange('bloodGroup', e.target.value)}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid hsl(var(--border-subtle))',
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          color: 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="">-- Select Blood Group --</option>
                        {BLOOD_GROUP_OPTIONS.map((bg) => (
                          <option key={bg.value} value={bg.value}>
                            {bg.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="emp-nationality"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Nationality
                      </label>
                      <Input
                        id="emp-nationality"
                        placeholder="INDIAN"
                        value={formData.nationality || 'INDIAN'}
                        onChange={(e) => handleFieldChange('nationality', e.target.value)}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        paddingTop: '18px',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.physicallyChallenged || false}
                          onChange={(e) =>
                            handleFieldChange('physicallyChallenged', e.target.checked)
                          }
                          style={{
                            accentColor: 'hsl(var(--primary-color))',
                            width: '16px',
                            height: '16px',
                          }}
                        />
                        <span>Differently Abled (PwD)</span>
                      </label>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div
                    style={{
                      borderTop: '1px solid hsl(var(--border-subtle))',
                      paddingTop: 'var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      Emergency Contact
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div>
                        <Input
                          placeholder="Contact Person Name"
                          value={formData.emergencyContactName || ''}
                          onChange={(e) =>
                            handleFieldChange('emergencyContactName', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Input
                          type="tel"
                          placeholder="Emergency Phone Number"
                          value={formData.emergencyContactPhone || ''}
                          onChange={(e) =>
                            handleFieldChange('emergencyContactPhone', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Relationship (e.g. Spouse/Brother)"
                          value={formData.emergencyContactRelation || ''}
                          onChange={(e) =>
                            handleFieldChange('emergencyContactRelation', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                  STEP 3: ADDRESS DETAILS
              ---------------------------------------------------- */}
              {activeStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Current Address */}
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'hsl(var(--text-primary))',
                        marginBottom: '8px',
                      }}
                    >
                      Current / Present Address
                    </div>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
                    >
                      <Input
                        placeholder="Street address / House No. / Landmark"
                        value={formData.currentAddress || ''}
                        onChange={(e) => handleFieldChange('currentAddress', e.target.value)}
                      />
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <Input
                          placeholder="City"
                          value={formData.currentCity || ''}
                          onChange={(e) => handleFieldChange('currentCity', e.target.value)}
                        />
                        <Input
                          placeholder="State"
                          value={formData.currentState || ''}
                          onChange={(e) => handleFieldChange('currentState', e.target.value)}
                        />
                        <Input
                          placeholder="Pincode"
                          value={formData.currentPincode || ''}
                          onChange={(e) => handleFieldChange('currentPincode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permanent Address */}
                  <div
                    style={{
                      borderTop: '1px solid hsl(var(--border-subtle))',
                      paddingTop: 'var(--space-3)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'hsl(var(--text-primary))',
                        }}
                      >
                        Permanent Address
                      </div>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={sameAsCurrentAddress}
                          onChange={handleSameAddressToggle}
                          style={{ accentColor: 'hsl(var(--primary-color))' }}
                        />
                        <span>Same as Current Address</span>
                      </label>
                    </div>

                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
                    >
                      <Input
                        placeholder="Permanent street address"
                        value={formData.permanentAddress || ''}
                        onChange={(e) => handleFieldChange('permanentAddress', e.target.value)}
                        disabled={sameAsCurrentAddress}
                      />
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <Input
                          placeholder="City"
                          value={formData.permanentCity || ''}
                          onChange={(e) => handleFieldChange('permanentCity', e.target.value)}
                          disabled={sameAsCurrentAddress}
                        />
                        <Input
                          placeholder="State"
                          value={formData.permanentState || ''}
                          onChange={(e) => handleFieldChange('permanentState', e.target.value)}
                          disabled={sameAsCurrentAddress}
                        />
                        <Input
                          placeholder="Pincode"
                          value={formData.permanentPincode || ''}
                          onChange={(e) => handleFieldChange('permanentPincode', e.target.value)}
                          disabled={sameAsCurrentAddress}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                  STEP 4: BANK DETAILS (Auto-populating Account Holder Name)
              ---------------------------------------------------- */}
              {activeStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="bank-name"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Bank Name
                      </label>
                      <Input
                        id="bank-name"
                        placeholder="State Bank of India / HDFC Bank"
                        value={formData.bankName || ''}
                        onChange={(e) => handleFieldChange('bankName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="bank-acc"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Bank Account Number
                      </label>
                      <Input
                        id="bank-acc"
                        placeholder="301234567890"
                        value={formData.bankAccountNumber || ''}
                        onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="bank-ifsc"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        IFSC Code (11 Chars)
                      </label>
                      <Input
                        id="bank-ifsc"
                        placeholder="SBIN0001234"
                        maxLength={11}
                        value={formData.bankIfscCode || ''}
                        onChange={(e) =>
                          handleFieldChange('bankIfscCode', e.target.value.toUpperCase())
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="bank-holder"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Account Holder Name
                      </label>
                      <Input
                        id="bank-holder"
                        placeholder="Name as per Passbook"
                        value={resolvedAccountHolder}
                        onChange={(e) => handleFieldChange('bankAccountHolderName', e.target.value)}
                      />
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'hsl(var(--text-muted))',
                          marginTop: '4px',
                        }}
                      >
                        Auto-filled from Employee Name in Step 1.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                  STEP 5: STATUTORY & KYC (with Police Verification Checkbox)
              ---------------------------------------------------- */}
              {activeStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* PAN & Aadhaar */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-pan"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Permanent Account Number (PAN)
                      </label>
                      <Input
                        id="emp-pan"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        value={formData.panNumber || ''}
                        onChange={(e) =>
                          handleFieldChange('panNumber', e.target.value.toUpperCase())
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-aadhaar"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        Aadhaar Number (12 Digits)
                      </label>
                      <Input
                        id="emp-aadhaar"
                        placeholder="1234 5678 9012"
                        maxLength={14}
                        value={formData.aadhaarNumber || ''}
                        onChange={(e) => handleFieldChange('aadhaarNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* UAN, PF & ESIC */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="emp-uan"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        UAN Number
                      </label>
                      <Input
                        id="emp-uan"
                        placeholder="100123456789"
                        value={formData.uanNumber || ''}
                        onChange={(e) => handleFieldChange('uanNumber', e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-pf"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        PF Member ID
                      </label>
                      <Input
                        id="emp-pf"
                        placeholder="MH/BAN/0012345/000/1234"
                        value={formData.pfNumber || ''}
                        onChange={(e) => handleFieldChange('pfNumber', e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emp-esic"
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                          marginBottom: '6px',
                        }}
                      >
                        ESIC IP Number (17 Digits)
                      </label>
                      <Input
                        id="emp-esic"
                        placeholder="31001234560001001"
                        value={formData.esicIpNumber || ''}
                        onChange={(e) => handleFieldChange('esicIpNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Police Verification Checkbox Toggle */}
                  <div
                    style={{
                      borderTop: '1px solid hsl(var(--border-subtle))',
                      paddingTop: 'var(--space-3)',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      padding: '12px',
                      borderRadius: '8px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={hasPoliceVerification}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setHasPoliceVerification(checked);
                          if (!checked) {
                            handleFieldChange('policeVerificationCertNo', '');
                            handleFieldChange('policeStationName', '');
                            handleFieldChange('policeVerificationDate', '');
                            handleFieldChange('policeVerificationExpiryDate', '');
                          }
                        }}
                        style={{
                          accentColor: 'hsl(var(--primary-color))',
                          width: '16px',
                          height: '16px',
                        }}
                      />
                      <Shield size={16} style={{ color: 'hsl(var(--primary-color))' }} />
                      <span>Police Verification Completed / Background Checked</span>
                    </label>

                    {hasPoliceVerification && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-3)',
                          marginTop: '12px',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--space-3)',
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'hsl(var(--text-secondary))',
                                marginBottom: '4px',
                              }}
                            >
                              Certificate Number
                            </label>
                            <Input
                              placeholder="PVC-2026-987654"
                              value={formData.policeVerificationCertNo || ''}
                              onChange={(e) =>
                                handleFieldChange('policeVerificationCertNo', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'hsl(var(--text-secondary))',
                                marginBottom: '4px',
                              }}
                            >
                              Police Station & Jurisdiction
                            </label>
                            <Input
                              placeholder="Salt Lake North Police Station"
                              value={formData.policeStationName || ''}
                              onChange={(e) =>
                                handleFieldChange('policeStationName', e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--space-3)',
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'hsl(var(--text-secondary))',
                                marginBottom: '4px',
                              }}
                            >
                              Verification Date
                            </label>
                            <Input
                              type="date"
                              value={formData.policeVerificationDate || ''}
                              onChange={(e) =>
                                handleFieldChange('policeVerificationDate', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'hsl(var(--text-secondary))',
                                marginBottom: '4px',
                              }}
                            >
                              Expiry Date
                            </label>
                            <Input
                              type="date"
                              value={formData.policeVerificationExpiryDate || ''}
                              onChange={(e) =>
                                handleFieldChange('policeVerificationExpiryDate', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                  STEP 6: REVIEW & SUBMIT
              ---------------------------------------------------- */}
              {activeStep === 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      border: '1px solid hsl(var(--border-subtle))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'hsl(var(--text-primary))',
                        }}
                      >
                        Workforce Profile Summary
                      </span>
                      <Badge variant="primary">{formData.employmentType}</Badge>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Full Name: </span>
                        <strong>
                          {formData.firstName} {formData.lastName}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Employee Code: </span>
                        <code>{formData.employeeCode}</code>
                      </div>
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Email: </span>
                        <span>{formData.email}</span>
                      </div>
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Phone: </span>
                        <span>{formData.phone}</span>
                      </div>
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Joining Date: </span>
                        <span>{formData.dateOfJoining}</span>
                      </div>
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Blood Group: </span>
                        <span>
                          {BLOOD_GROUP_OPTIONS.find((b) => b.value === formData.bloodGroup)
                            ?.label ||
                            formData.bloodGroup ||
                            '—'}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid hsl(var(--border-subtle))',
                        paddingTop: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Bank Account: </span>
                      <span>
                        {formData.bankName
                          ? `${formData.bankName} (${formData.bankAccountNumber || '—'}) — Holder: ${resolvedAccountHolder}`
                          : 'Not provided'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Aadhaar / PAN: </span>
                      <span>
                        {formData.aadhaarNumber || '—'} / {formData.panNumber || '—'}
                      </span>
                    </div>

                    {hasPoliceVerification && (
                      <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Police Verification Recorded (
                        {formData.policeVerificationCertNo || 'Verified'})
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'hsl(var(--primary-color) / 0.05)',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--primary-color) / 0.15)',
                      fontSize: '11px',
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    <strong>Manpower SaaS Note:</strong> Department, Site Deployment, Shift
                    Rostering, and Security Access Roles can be configured directly from the
                    employee profile page after creation.
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS WITH "SAVE AS DRAFT" */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  paddingTop: 'var(--space-4)',
                  marginTop: 'var(--space-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    disabled={activeStep === 1 || isLoading}
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                  >
                    <span>Save as Draft</span>
                  </Button>
                </div>

                {activeStep < 6 ? (
                  <Button type="button" variant="primary" size="sm" onClick={handleNext}>
                    <span>Continue</span>
                    <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
                    <CheckCircle2 size={16} />
                    <span>{isLoading ? 'Creating Record...' : 'Create Employee Record'}</span>
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* 3. RIGHT COLUMN: ONBOARDING GUIDANCE & CIRCULAR PIE PERCENTAGE TRACKER */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              borderLeft: '1px solid hsl(var(--border-subtle))',
              paddingLeft: 'var(--space-4)',
            }}
          >
            {/* Circular Pie Percentage Tracker */}
            <div
              style={{
                padding: '16px 12px',
                borderRadius: '8px',
                backgroundColor: 'hsl(var(--bg-secondary))',
                border: '1px solid hsl(var(--border-subtle))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ position: 'relative', width: '76px', height: '76px' }}>
                <svg width="76" height="76" viewBox="0 0 76 76">
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="hsl(var(--border-subtle))"
                    strokeWidth="6"
                  />
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="hsl(var(--primary-color))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - completionPercentage / 100)}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50% 50%',
                      transition: 'stroke-dashoffset 0.4s ease',
                    }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-primary))' }}
                  >
                    {completionPercentage}%
                  </span>
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 600,
                      color: 'hsl(var(--text-muted))',
                      textTransform: 'uppercase',
                    }}
                  >
                    Profile
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                  textAlign: 'center',
                }}
              >
                {completionPercentage === 100 ? 'Profile Complete 🎉' : 'Onboarding Progress'}
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                }}
              >
                Onboarding Checklist
              </div>
              {STEPS.slice(0, 5).map((st) => {
                const isStepDone = savedSteps.has(st.number);
                return (
                  <div
                    key={st.number}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: isStepDone ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: isStepDone ? '#16a34a' : 'transparent',
                        border: `1.5px solid ${isStepDone ? '#16a34a' : 'hsl(var(--border-subtle))'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '9px',
                      }}
                    >
                      {isStepDone && <Check size={10} />}
                    </div>
                    <span>{st.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Contextual Guidance Tips */}
            <div
              style={{
                marginTop: 'auto',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                lineHeight: 1.4,
              }}
            >
              <div
                style={{ fontWeight: 600, color: 'hsl(var(--text-primary))', marginBottom: '4px' }}
              >
                Quick Tip
              </div>
              {activeStep === 1 && 'Basic details establish the official talent pool identity.'}
              {activeStep === 2 &&
                'Accurate blood group & emergency contacts are crucial for field deployment safety.'}
              {activeStep === 3 && 'Addresses ensure statutory state labor law compliance.'}
              {activeStep === 4 &&
                'IFSC & account numbers are validated for direct salary disbursement.'}
              {activeStep === 5 && 'UAN & ESIC numbers allow automated monthly compliance filing.'}
              {activeStep === 6 && 'Review all talent details before finalizing registration.'}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

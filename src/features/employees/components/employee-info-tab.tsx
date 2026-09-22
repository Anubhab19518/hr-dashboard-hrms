'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Badge } from '@/components/atoms/badge';
import {
  FileText,
  Briefcase,
  Shield,
  MapPin,
  Heart,
  CheckCircle2,
  AlertCircle,
} from '@/components/atoms/icons';
import { EmployeeService } from '../services/employee.service';
import type { Employee, EmployeeStatus, EmploymentType, BloodGroup } from '../types/employee.types';

interface EmployeeInfoTabProps {
  readonly employee: Employee;
  readonly onUpdate: (updated: Employee) => void;
  readonly isRefreshing?: boolean;
}

export function EmployeeInfoTab({
  employee,
  onUpdate,
  isRefreshing = false,
}: EmployeeInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email ?? '',
    phone: employee.phone ?? '',
    employmentType: employee.employmentType,
    status: employee.status,
    dateOfJoining: employee.dateOfJoining ? (employee.dateOfJoining.split('T')[0] ?? '') : '',

    // Statutory
    aadhaarNumber: employee.aadhaarNumber ?? '',
    panNumber: employee.panNumber ?? '',
    uanNumber: employee.uanNumber ?? '',
    pfNumber: employee.pfNumber ?? '',
    esicIpNumber: employee.esicIpNumber ?? '',

    // Bank Details
    bankName: employee.bankName ?? '',
    bankAccountNumber: employee.bankAccountNumber ?? '',
    bankIfscCode: employee.bankIfscCode ?? '',
    bankAccountHolderName: employee.bankAccountHolderName ?? '',

    // Demographics
    dateOfBirth: employee.dateOfBirth ? (employee.dateOfBirth.split('T')[0] ?? '') : '',
    gender: employee.gender ?? 'MALE',
    maritalStatus: employee.maritalStatus ?? 'SINGLE',
    bloodGroup: employee.bloodGroup ?? '',
    fatherOrSpouseName: employee.fatherOrSpouseName ?? '',
    fatherOrSpouseRelation: employee.fatherOrSpouseRelation ?? 'FATHER',
    nationality: employee.nationality ?? 'INDIAN',
    physicallyChallenged: employee.physicallyChallenged ?? false,

    // Addresses
    currentAddress: employee.currentAddress ?? '',
    currentCity: employee.currentCity ?? '',
    currentState: employee.currentState ?? '',
    currentPincode: employee.currentPincode ?? '',
    permanentAddress: employee.permanentAddress ?? '',
    permanentCity: employee.permanentCity ?? '',
    permanentState: employee.permanentState ?? '',
    permanentPincode: employee.permanentPincode ?? '',

    // Emergency & Police Verification
    emergencyContactName: employee.emergencyContactName ?? '',
    emergencyContactPhone: employee.emergencyContactPhone ?? '',
    emergencyContactRelation: employee.emergencyContactRelation ?? '',
    policeVerificationCertNo: employee.policeVerificationCertNo ?? '',
    policeStationName: employee.policeStationName ?? '',
    policeVerificationDate: employee.policeVerificationDate
      ? (employee.policeVerificationDate.split('T')[0] ?? '')
      : '',
    policeVerificationExpiryDate: employee.policeVerificationExpiryDate
      ? (employee.policeVerificationExpiryDate.split('T')[0] ?? '')
      : '',
  });

  useEffect(() => {
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      employmentType: employee.employmentType,
      status: employee.status,
      dateOfJoining: employee.dateOfJoining ? (employee.dateOfJoining.split('T')[0] ?? '') : '',

      aadhaarNumber: employee.aadhaarNumber ?? '',
      panNumber: employee.panNumber ?? '',
      uanNumber: employee.uanNumber ?? '',
      pfNumber: employee.pfNumber ?? '',
      esicIpNumber: employee.esicIpNumber ?? '',

      bankName: employee.bankName ?? '',
      bankAccountNumber: employee.bankAccountNumber ?? '',
      bankIfscCode: employee.bankIfscCode ?? '',
      bankAccountHolderName: employee.bankAccountHolderName ?? '',

      dateOfBirth: employee.dateOfBirth ? (employee.dateOfBirth.split('T')[0] ?? '') : '',
      gender: employee.gender ?? 'MALE',
      maritalStatus: employee.maritalStatus ?? 'SINGLE',
      bloodGroup: employee.bloodGroup ?? '',
      fatherOrSpouseName: employee.fatherOrSpouseName ?? '',
      fatherOrSpouseRelation: employee.fatherOrSpouseRelation ?? 'FATHER',
      nationality: employee.nationality ?? 'INDIAN',
      physicallyChallenged: employee.physicallyChallenged ?? false,

      currentAddress: employee.currentAddress ?? '',
      currentCity: employee.currentCity ?? '',
      currentState: employee.currentState ?? '',
      currentPincode: employee.currentPincode ?? '',
      permanentAddress: employee.permanentAddress ?? '',
      permanentCity: employee.permanentCity ?? '',
      permanentState: employee.permanentState ?? '',
      permanentPincode: employee.permanentPincode ?? '',

      emergencyContactName: employee.emergencyContactName ?? '',
      emergencyContactPhone: employee.emergencyContactPhone ?? '',
      emergencyContactRelation: employee.emergencyContactRelation ?? '',
      policeVerificationCertNo: employee.policeVerificationCertNo ?? '',
      policeStationName: employee.policeStationName ?? '',
      policeVerificationDate: employee.policeVerificationDate
        ? (employee.policeVerificationDate.split('T')[0] ?? '')
        : '',
      policeVerificationExpiryDate: employee.policeVerificationExpiryDate
        ? (employee.policeVerificationExpiryDate.split('T')[0] ?? '')
        : '',
    });
  }, [employee]);

  const handleCopyCurrentAddress = () => {
    setFormData((prev) => ({
      ...prev,
      permanentAddress: prev.currentAddress,
      permanentCity: prev.currentCity,
      permanentState: prev.currentState,
      permanentPincode: prev.currentPincode,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        bloodGroup: formData.bloodGroup ? (formData.bloodGroup as BloodGroup) : undefined,
      };
      const updated = await EmployeeService.updateEmployee(employee.id, payload);
      onUpdate(updated);
      setIsEditing(false);
      setSuccessMessage('Employee profile & statutory records updated successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update employee';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBloodGroup = (bg?: string) => {
    if (!bg) return '—';
    const normalized = bg.trim().toUpperCase();
    const map: Record<string, string> = {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-',
    };
    return map[normalized] || bg;
  };

  const formatEmploymentType = (type?: string) => {
    const t = String(type || 'FULL_TIME')
      .trim()
      .toUpperCase();
    if (t === 'FULL_TIME' || t === 'SALARIED' || t === 'PERMANENT') return 'Full Time (Salaried)';
    if (t === 'PART_TIME' || t === 'HOURLY') return 'Part Time (Hourly)';
    if (t === 'CONTRACTOR' || t === 'CONTRACT' || t === 'CONTRACTUAL')
      return 'Contractor (Fixed-term)';
    if (t === 'CASUAL' || t === 'TEMPORARY' || t === 'DAILY_WAGE' || t === 'TEMP')
      return 'Casual (Daily Wage)';
    if (t === 'INTERN' || t === 'TRAINEE') return 'Intern (Trainee)';
    return t || 'Full Time';
  };

  const formatStatus = (status?: string) => {
    const s = String(status || 'ACTIVE')
      .trim()
      .toUpperCase();
    if (s === 'ACTIVE') return 'Active';
    if (s === 'PROBATION') return 'Probation';
    if (s === 'SUSPENDED') return 'Suspended';
    if (s === 'TERMINATED' || s === 'EXITED') return 'Terminated';
    if (s === 'RESIGNED') return 'Resigned';
    // Legacy fallbacks for any old data
    if (s === 'INACTIVE') return 'Inactive';
    if (s === 'ON_LEAVE' || s === 'LEAVE') return 'On Leave';
    return s || 'Active';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {isRefreshing && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--primary-color) / 0.08)',
            border: '1px solid hsl(var(--primary-color) / 0.2)',
            color: 'hsl(var(--primary-color))',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: '2px solid hsl(var(--primary-color))',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Syncing profile data...
        </div>
      )}
      {successMessage && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-success) / 0.1)',
            border: '1px solid hsl(var(--color-success) / 0.3)',
            color: 'hsl(var(--color-success))',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            border: '1px solid hsl(var(--color-danger) / 0.3)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!isEditing ? (
          <Button size="sm" variant="primary" onClick={() => setIsEditing(true)}>
            Edit Details & Records
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            Cancel Editing
          </Button>
        )}
      </div>

      {!isEditing ? (
        /* READ-ONLY STRUCTURED OVERVIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* 1. General & Employment Information */}
          <Card variant="subtle">
            <CardHeader
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Briefcase size={18} style={{ color: 'hsl(var(--primary-color))' }} />
              <CardTitle>General & Employment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Employee Code
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.employeeCode}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Full Name
                  </div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                    {employee.firstName} {employee.lastName}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Work Email
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.email || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Mobile Number
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.phone || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Employment Type
                  </div>
                  <Badge variant="outline">{formatEmploymentType(employee.employmentType)}</Badge>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Status
                  </div>
                  <Badge
                    variant={(() => {
                      const s = String(employee.status || 'ACTIVE')
                        .trim()
                        .toUpperCase();
                      if (s === 'ACTIVE') return 'success';
                      if (s === 'PROBATION' || s === 'ON_LEAVE' || s === 'LEAVE') return 'warning';
                      if (s === 'SUSPENDED' || s === 'TERMINATED') return 'destructive';
                      return 'secondary';
                    })()}
                  >
                    {formatStatus(employee.status)}
                  </Badge>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Date of Joining
                  </div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                    {employee.dateOfJoining
                      ? new Date(employee.dateOfJoining).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Company Entity
                  </div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                    {employee.companyName || 'Registered Entity'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Indian Statutory & KYC Registrations */}
          <Card variant="subtle">
            <CardHeader
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <FileText size={18} style={{ color: 'hsl(var(--primary-color))' }} />
              <CardTitle>Indian Statutory & KYC Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Aadhaar Number (12 Digits)
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.aadhaarNumber ? `•••• •••• ${employee.aadhaarNumber.slice(-4)}` : '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Permanent Account Number (PAN)
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.panNumber || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Universal Account Number (UAN)
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.uanNumber || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Provident Fund (PF) Member ID
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.pfNumber || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    ESIC IP Number (17 Digits)
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.esicIpNumber || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Bank Account Details */}
          <Card variant="subtle">
            <CardHeader
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Briefcase size={18} style={{ color: 'hsl(var(--primary-color))' }} />
              <CardTitle>Bank Account & Salary Disbursement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Bank Name
                  </div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                    {employee.bankName || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Bank Account Number
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.bankAccountNumber
                      ? `••••${employee.bankAccountNumber.slice(-4)}`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    IFSC Code (11 Chars)
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.bankIfscCode || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Account Holder Name
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.bankAccountHolderName || `${employee.firstName} ${employee.lastName}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Personal Demographics & Family */}
          <Card variant="subtle">
            <CardHeader
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Heart size={18} style={{ color: 'hsl(var(--primary-color))' }} />
              <CardTitle>Personal Demographics & Family</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Date of Birth
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.dateOfBirth
                      ? new Date(employee.dateOfBirth).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Gender
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.gender || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Marital Status
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.maritalStatus || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Blood Group
                  </div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--color-brand-accent))' }}>
                    {formatBloodGroup(employee.bloodGroup)}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Father / Spouse Name ({employee.fatherOrSpouseRelation || 'FATHER'})
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.fatherOrSpouseName || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Nationality
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.nationality || 'INDIAN'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Differently Abled (PwD)
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.physicallyChallenged ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Residential Addresses */}
          <Card variant="subtle">
            <CardHeader
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <MapPin size={18} style={{ color: 'hsl(var(--primary-color))' }} />
              <CardTitle>Residential Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    Present / Current Residential Address
                  </span>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-secondary))',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    {employee.currentAddress || 'No current street specified'}
                    <br />
                    {[employee.currentCity, employee.currentState].filter(Boolean).join(', ')}{' '}
                    {employee.currentPincode && `— ${employee.currentPincode}`}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    Permanent / Domicile Address
                  </span>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-secondary))',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    {employee.permanentAddress || 'No permanent street specified'}
                    <br />
                    {[employee.permanentCity, employee.permanentState]
                      .filter(Boolean)
                      .join(', ')}{' '}
                    {employee.permanentPincode && `— ${employee.permanentPincode}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Emergency Contact & Police Verification */}
          <Card variant="subtle">
            <CardHeader
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Shield size={18} style={{ color: 'hsl(var(--primary-color))' }} />
              <CardTitle>Emergency Contact & Security Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Emergency Contact Person
                  </div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                    {employee.emergencyContactName || '—'}{' '}
                    {employee.emergencyContactRelation && `(${employee.emergencyContactRelation})`}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Emergency Phone
                  </div>
                  <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                    {employee.emergencyContactPhone || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Police Verification Certificate
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {employee.policeVerificationCertNo || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Police Station / Expiry
                  </div>
                  <div
                    style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-secondary))' }}
                  >
                    {employee.policeStationName || '—'}{' '}
                    {employee.policeVerificationExpiryDate &&
                      `(Valid till ${new Date(employee.policeVerificationExpiryDate).toLocaleDateString()})`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* FULL COMPREHENSIVE EDIT FORM */
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
        >
          {/* Section 1: General Info */}
          <Card variant="subtle">
            <CardHeader>
              <CardTitle>General & Employment Information</CardTitle>
            </CardHeader>
            <CardContent
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        employmentType: e.target.value as EmploymentType,
                      }))
                    }
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid hsl(var(--border-base))',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      color: 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="CASUAL">Casual (Daily Wage)</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, status: e.target.value as EmployeeStatus }))
                    }
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid hsl(var(--border-base))',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      color: 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PROBATION">Probation</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="TERMINATED">Terminated</option>
                    <option value="RESIGNED">Resigned</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Date of Joining *
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={(e) => setFormData((p) => ({ ...p, dateOfJoining: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Statutory & KYC */}
          <Card variant="subtle">
            <CardHeader>
              <CardTitle>Indian Statutory & KYC Registrations</CardTitle>
            </CardHeader>
            <CardContent
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Aadhaar Number (12 Digits)
                </label>
                <Input
                  placeholder="123456789012"
                  maxLength={12}
                  value={formData.aadhaarNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, aadhaarNumber: e.target.value }))}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  PAN Card Number (10 Chars)
                </label>
                <Input
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={formData.panNumber}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Universal Account Number (UAN)
                </label>
                <Input
                  placeholder="100123456789"
                  maxLength={12}
                  value={formData.uanNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, uanNumber: e.target.value }))}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Provident Fund (PF) Member ID
                </label>
                <Input
                  placeholder="KNBLR00123450000000001"
                  value={formData.pfNumber}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, pfNumber: e.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  ESIC IP Number (17 Digits)
                </label>
                <Input
                  placeholder="53000123450000001"
                  maxLength={17}
                  value={formData.esicIpNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, esicIpNumber: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Bank Details */}
          <Card variant="subtle">
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
            </CardHeader>
            <CardContent
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Bank Name
                </label>
                <Input
                  placeholder="State Bank of India / HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData((p) => ({ ...p, bankName: e.target.value }))}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Account Number
                </label>
                <Input
                  placeholder="301234567890"
                  value={formData.bankAccountNumber}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bankAccountNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  IFSC Code (11 Chars)
                </label>
                <Input
                  placeholder="SBIN0001234"
                  maxLength={11}
                  value={formData.bankIfscCode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bankIfscCode: e.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Account Holder Name
                </label>
                <Input
                  placeholder="Name as per Bank Passbook"
                  value={formData.bankAccountHolderName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bankAccountHolderName: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Personal Demographics & Family */}
          <Card variant="subtle">
            <CardHeader>
              <CardTitle>Personal Demographics & Family</CardTitle>
            </CardHeader>
            <CardContent
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
                      }))
                    }
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid hsl(var(--border-base))',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      color: 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Marital Status
                  </label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        maritalStatus: e.target.value as
                          'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED',
                      }))
                    }
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid hsl(var(--border-base))',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      color: 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData((p) => ({ ...p, bloodGroup: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid hsl(var(--border-base))',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      color: 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A_POSITIVE">A+ (A Positive)</option>
                    <option value="A_NEGATIVE">A- (A Negative)</option>
                    <option value="B_POSITIVE">B+ (B Positive)</option>
                    <option value="B_NEGATIVE">B- (B Negative)</option>
                    <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                    <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                    <option value="O_POSITIVE">O+ (O Positive)</option>
                    <option value="O_NEGATIVE">O- (O Negative)</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Father / Spouse Name
                  </label>
                  <Input
                    placeholder="Full name"
                    value={formData.fatherOrSpouseName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, fatherOrSpouseName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Relationship
                  </label>
                  <select
                    value={formData.fatherOrSpouseRelation}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        fatherOrSpouseRelation: e.target.value as
                          'FATHER' | 'HUSBAND' | 'WIFE' | 'MOTHER',
                      }))
                    }
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid hsl(var(--border-base))',
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      color: 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <option value="FATHER">Father</option>
                    <option value="HUSBAND">Husband</option>
                    <option value="WIFE">Wife</option>
                    <option value="MOTHER">Mother</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Residential Addresses */}
          <Card variant="subtle">
            <CardHeader
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <CardTitle>Residential Addresses</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={handleCopyCurrentAddress}>
                Same as Current Address
              </Button>
            </CardHeader>
            <CardContent
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              <div>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Current / Present Address
                </span>
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Input
                    placeholder="Street / Building / Flat"
                    value={formData.currentAddress}
                    onChange={(e) => setFormData((p) => ({ ...p, currentAddress: e.target.value }))}
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  <Input
                    placeholder="City"
                    value={formData.currentCity}
                    onChange={(e) => setFormData((p) => ({ ...p, currentCity: e.target.value }))}
                  />
                  <Input
                    placeholder="State"
                    value={formData.currentState}
                    onChange={(e) => setFormData((p) => ({ ...p, currentState: e.target.value }))}
                  />
                  <Input
                    placeholder="Pincode"
                    maxLength={6}
                    value={formData.currentPincode}
                    onChange={(e) => setFormData((p) => ({ ...p, currentPincode: e.target.value }))}
                  />
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Permanent / Domicile Address
                </span>
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Input
                    placeholder="Permanent Street / Village / Locality"
                    value={formData.permanentAddress}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, permanentAddress: e.target.value }))
                    }
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  <Input
                    placeholder="City / District"
                    value={formData.permanentCity}
                    onChange={(e) => setFormData((p) => ({ ...p, permanentCity: e.target.value }))}
                  />
                  <Input
                    placeholder="State"
                    value={formData.permanentState}
                    onChange={(e) => setFormData((p) => ({ ...p, permanentState: e.target.value }))}
                  />
                  <Input
                    placeholder="Pincode"
                    maxLength={6}
                    value={formData.permanentPincode}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, permanentPincode: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Emergency Contact & Police Verification */}
          <Card variant="subtle">
            <CardHeader>
              <CardTitle>Emergency Contact & Police Verification</CardTitle>
            </CardHeader>
            <CardContent
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Emergency Contact Name
                </label>
                <Input
                  placeholder="Contact person full name"
                  value={formData.emergencyContactName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, emergencyContactName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Emergency Phone Number
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={formData.emergencyContactPhone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, emergencyContactPhone: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Police Verification Certificate No.
                </label>
                <Input
                  placeholder="PV/2026/00142"
                  value={formData.policeVerificationCertNo}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, policeVerificationCertNo: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Police Station Name
                </label>
                <Input
                  placeholder="e.g. Nimta PS / Newtown PS"
                  value={formData.policeStationName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, policeStationName: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Saving Changes...' : 'Save All Employee Details'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

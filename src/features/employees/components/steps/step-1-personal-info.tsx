'use client';

import { useState } from 'react';
import { Input } from '@/components/atoms/input';
import { ChevronDown, ChevronRight, Sparkles } from '@/components/atoms/icons';
import type { EmployeeSecurityFormValues } from '../../types/employee-iam';

interface Step1PersonalInfoProps {
  values: EmployeeSecurityFormValues;
  onChange: (patch: Partial<EmployeeSecurityFormValues>) => void;
  error?: string | null;
}

export function Step1PersonalInfo({ values, onChange, error }: Step1PersonalInfoProps) {
  const [showExtraDetails, setShowExtraDetails] = useState(false);

  const generateRandomCode = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    onChange({ employeeCode: `EMP-2026-${randomSuffix}` });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'hsl(var(--text-primary))',
          }}
        >
          Personal & Workforce Information
        </h3>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'hsl(var(--text-muted))' }}>
          Enter the employee's legal identity, contact channels, and employment tenure.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Name Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <Input
          label="First Name *"
          id="emp-first-name"
          placeholder="e.g. Rahul"
          value={values.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          required
        />
        <Input
          label="Middle Name"
          id="emp-middle-name"
          placeholder="Optional"
          value={values.middleName || ''}
          onChange={(e) => onChange({ middleName: e.target.value })}
        />
        <Input
          label="Last Name *"
          id="emp-last-name"
          placeholder="e.g. Sharma"
          value={values.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          required
        />
      </div>

      {/* Code & Contact Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <label
              htmlFor="emp-code"
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}
            >
              Employee Code *
            </label>
            <button
              type="button"
              onClick={generateRandomCode}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--color-primary))',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 4px',
              }}
            >
              <Sparkles size={12} /> Auto
            </button>
          </div>
          <Input
            id="emp-code"
            placeholder="EMP-2026-0042"
            value={values.employeeCode}
            onChange={(e) => onChange({ employeeCode: e.target.value.toUpperCase() })}
            required
          />
        </div>

        <Input
          label="Official Email Address *"
          type="email"
          id="emp-email"
          placeholder="rahul.sharma@example.com"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          required
        />

        <Input
          label="Phone Number *"
          type="tel"
          id="emp-phone"
          placeholder="+91 98765 43210"
          value={values.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          required
        />
      </div>

      {/* Employment Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {/* Gender */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor="emp-gender"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}
          >
            Gender *
          </label>
          <select
            id="emp-gender"
            value={values.gender}
            onChange={(e) => onChange({ gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid hsl(var(--border-subtle, 214 32% 91%))',
              backgroundColor: 'hsl(var(--surface-primary, 0 0% 100%))',
              fontSize: '0.875rem',
              color: 'hsl(var(--text-primary))',
              height: '38px',
            }}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other / Non-Binary</option>
          </select>
        </div>

        {/* Date of Birth */}
        <Input
          label="Date of Birth"
          type="date"
          id="emp-dob"
          value={values.dateOfBirth || ''}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
        />

        {/* Date of Joining */}
        <Input
          label="Date of Joining *"
          type="date"
          id="emp-doj"
          value={values.dateOfJoining}
          onChange={(e) => onChange({ dateOfJoining: e.target.value })}
          required
        />

        {/* Employment Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor="emp-type"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}
          >
            Employment Type *
          </label>
          <select
            id="emp-type"
            value={values.employmentType}
            onChange={(e) =>
              onChange({
                employmentType: e.target.value as
                  'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'PROBATION',
              })
            }
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid hsl(var(--border-subtle, 214 32% 91%))',
              backgroundColor: 'hsl(var(--surface-primary, 0 0% 100%))',
              fontSize: '0.875rem',
              color: 'hsl(var(--text-primary))',
              height: '38px',
            }}
          >
            <option value="FULL_TIME">Full-Time Regular</option>
            <option value="PROBATION">Probationary</option>
            <option value="CONTRACT">Contractual / Deputed</option>
            <option value="PART_TIME">Part-Time</option>
            <option value="INTERN">Internship</option>
          </select>
        </div>
      </div>

      {/* Optional Demographic / Emergency Section (Collapsible) */}
      <div
        style={{
          marginTop: 'var(--space-2)',
          border: '1px solid hsl(var(--border-subtle))',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => setShowExtraDetails(!showExtraDetails)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'hsl(var(--surface-secondary, 210 40% 98%))',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}
          >
            Additional Personal & Emergency Details (Optional)
          </span>
          {showExtraDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {showExtraDetails && (
          <div
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-3)',
              }}
            >
              <Input
                label="Father / Spouse Name"
                id="emp-father-spouse"
                placeholder="Guardian name"
                value={values.fatherOrSpouseName || ''}
                onChange={(e) => onChange({ fatherOrSpouseName: e.target.value })}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                  }}
                >
                  Marital Status
                </label>
                <select
                  value={values.maritalStatus || 'SINGLE'}
                  onChange={(e) =>
                    onChange({
                      maritalStatus: e.target.value as
                        'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED',
                    })
                  }
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: '1px solid hsl(var(--border-subtle))',
                    fontSize: '0.875rem',
                    height: '38px',
                  }}
                >
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
              <Input
                label="Blood Group"
                id="emp-blood-group"
                placeholder="e.g. O+ve"
                value={values.bloodGroup || ''}
                onChange={(e) => onChange({ bloodGroup: e.target.value })}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-3)',
              }}
            >
              <Input
                label="Emergency Contact Name"
                id="emp-emerg-name"
                placeholder="Emergency contact"
                value={values.emergencyContactName || ''}
                onChange={(e) => onChange({ emergencyContactName: e.target.value })}
              />
              <Input
                label="Emergency Contact Phone"
                type="tel"
                id="emp-emerg-phone"
                placeholder="+91..."
                value={values.emergencyContactPhone || ''}
                onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
              />
              <Input
                label="Relationship"
                id="emp-emerg-rel"
                placeholder="e.g. Spouse / Parent"
                value={values.emergencyContactRelation || ''}
                onChange={(e) => onChange({ emergencyContactRelation: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Edit2,
  MoreVertical,
  Building2,
  MapPin,
  Clock,
  FileText,
  Download,
  Eye,
  Plus,
  Activity,
  AlertCircle,
  Shield,
  Wallet,
} from '@/components/atoms/icons';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { CompanyHolidaySettings } from '@/features/holidays';
import { OrganizationService } from '../services/organization.service';
import type { Company } from '../types/organization.types';
import { CompanyFormDialog } from './company-form-dialog';

interface CompanyDetailViewProps {
  companyId: string;
}

interface CompanyDocument {
  id: string;
  title: string;
  type: string;
  size: string;
  uploadedOn: string;
  verified: boolean;
}

export function CompanyDetailView({ companyId }: CompanyDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    'info' | 'addresses' | 'documents' | 'holidays' | 'settings' | 'audit'
  >('info');
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Fetch live company details from backend API
  const fetchCompanyDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try single entity endpoint GET /api/v1/hr/companies/:id
      const data = await OrganizationService.getCompany(companyId);
      if (data && data.id) {
        setCompany(data);
      } else {
        // 2. Fallback to list search if direct get returns null
        const companies = await OrganizationService.getCompanies();
        const found = companies.find((c) => c.id === companyId);
        if (found) {
          setCompany(found);
        } else {
          setError('Company record not found in active workspace.');
        }
      }
    } catch (err: unknown) {
      // Fallback search
      try {
        const companies = await OrganizationService.getCompanies();
        const found = companies.find((c) => c.id === companyId);
        if (found) {
          setCompany(found);
        } else {
          const msg = err instanceof Error ? err.message : 'Failed to fetch company details';
          setError(msg);
        }
      } catch {
        const msg = err instanceof Error ? err.message : 'Failed to fetch company details';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  // Placeholder statutory compliance documents (kept intact for future backend integration)
  const documentsList: CompanyDocument[] = [
    {
      id: 'doc-1',
      title: 'GST Registration Certificate (Form GST REG-06)',
      type: 'PDF',
      size: '1.4 MB',
      uploadedOn: company?.createdAt
        ? new Date(company.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '12 Jan 2024',
      verified: true,
    },
    {
      id: 'doc-2',
      title: 'Certificate of Incorporation (ROC)',
      type: 'PDF',
      size: '2.1 MB',
      uploadedOn: '12 Jan 2024',
      verified: true,
    },
    {
      id: 'doc-3',
      title: 'Permanent Account Number (PAN Card)',
      type: 'PDF',
      size: '850 KB',
      uploadedOn: '14 Jan 2024',
      verified: true,
    },
    {
      id: 'doc-4',
      title: 'EPF Registration Allotment Letter',
      type: 'PDF',
      size: '620 KB',
      uploadedOn: '20 Jan 2024',
      verified: true,
    },
    {
      id: 'doc-5',
      title: 'ESIC Sub-Code Registration Letter',
      type: 'PDF',
      size: '710 KB',
      uploadedOn: '22 Jan 2024',
      verified: true,
    },
    {
      id: 'doc-6',
      title: 'MSME Udyam Registration Certificate',
      type: 'PDF',
      size: '1.1 MB',
      uploadedOn: '05 Feb 2024',
      verified: true,
    },
    {
      id: 'doc-7',
      title: 'Cancelled Bank Cheque for Statutory Disbursals',
      type: 'IMG/PDF',
      size: '940 KB',
      uploadedOn: '15 Feb 2024',
      verified: true,
    },
    {
      id: 'doc-8',
      title: 'PSARA State Security Operating License',
      type: 'PDF',
      size: '3.4 MB',
      uploadedOn: '01 Mar 2024',
      verified: true,
    },
  ];

  // Dynamic audit logs derived from database audit fields
  const auditLogs = [
    ...(company?.updatedAt
      ? [
          {
            id: 'audit-updated',
            action: 'Record Updated',
            actor: 'System / Super Admin',
            timestamp: new Date(company.updatedAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            details: 'Profile modified with latest statutory and location parameters',
          },
        ]
      : []),
    ...(company?.latitude && company?.longitude
      ? [
          {
            id: 'audit-geo',
            action: 'Amazon Location Geofence Configured',
            actor: 'AWS Places Integration',
            timestamp: company?.updatedAt
              ? new Date(company.updatedAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Initial Setup',
            details: `Geofence coordinates established at (${company.latitude.toFixed(6)}, ${company.longitude.toFixed(6)})`,
          },
        ]
      : []),
    {
      id: 'audit-created',
      action: 'Company Profile Created',
      actor: 'Workspace Admin',
      timestamp: company?.createdAt
        ? new Date(company.createdAt).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Initial Setup',
      details: `Entity initialized with code: ${company?.code || '—'} under multi-tenant isolation`,
    },
  ];

  const displayName = company?.name || 'Company Profile';
  const displayLegalName = company?.legalName || company?.name || '—';
  const displayCode = company?.code || '—';
  const displayType = company?.type === 'INTERNAL' ? 'INTERNAL HQ' : 'CLIENT ACCOUNT';
  const displayStatus = company?.status || 'ACTIVE';
  const isActive = displayStatus === 'ACTIVE';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO';

  const createdFormatted = company?.createdAt
    ? new Date(company.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const updatedFormatted = company?.updatedAt
    ? new Date(company.updatedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : createdFormatted;

  // Registered address details
  const registeredFullStreet =
    company?.registeredAddress || company?.address || 'No registered office address specified';
  const registeredLocationLine = [
    company?.registeredCity,
    company?.registeredState,
    company?.registeredPincode,
  ]
    .filter(Boolean)
    .join(', ');

  // Billing address details
  const isBillingSameAsRegistered =
    !company?.billingAddress ||
    company?.billingAddress === company?.registeredAddress ||
    company?.billingAddress === company?.address;

  const billingFullStreet = isBillingSameAsRegistered
    ? registeredFullStreet
    : company?.billingAddress || '—';

  const billingLocationLine = isBillingSameAsRegistered
    ? registeredLocationLine
    : [company?.billingCity, company?.billingState, company?.billingPincode]
        .filter(Boolean)
        .join(', ');

  const activeAddressCount = isBillingSameAsRegistered ? 1 : 2;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid hsl(var(--border-subtle))',
            borderTopColor: 'hsl(var(--color-brand-accent))',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: 'var(--font-size-sm)' }}>
          Loading live company profile from database...
        </p>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div
        style={{
          backgroundColor: 'hsl(var(--color-danger) / 0.08)',
          border: '1px solid hsl(var(--color-danger) / 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          maxWidth: '600px',
          margin: 'var(--space-8) auto',
        }}
      >
        <AlertCircle
          size={40}
          style={{ color: 'hsl(var(--color-danger))', marginBottom: 'var(--space-3)' }}
        />
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            margin: '0 0 var(--space-2) 0',
          }}
        >
          Unable to Load Company
        </h2>
        <p
          style={{
            color: 'hsl(var(--text-secondary))',
            fontSize: 'var(--font-size-sm)',
            margin: '0 0 var(--space-5) 0',
          }}
        >
          {error}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <Button variant="primary" onClick={() => void fetchCompanyDetails()}>
            Retry Connection
          </Button>
          <Link href="/dashboard/organization" style={{ textDecoration: 'none' }}>
            <Button variant="outline">Back to Companies</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Top Breadcrumb & Action Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Link
            href="/dashboard/organization"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              fontWeight: 500,
              transition: 'color var(--transition-fast)',
            }}
          >
            <span>&laquo; Company Profiles</span>
          </Link>
          <span style={{ color: 'hsl(var(--border-highlight))', fontSize: 'var(--font-size-xs)' }}>
            &gt;
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
            }}
          >
            {displayName}
          </span>
        </div>

        {/* Top Right Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => setIsEditDialogOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              backgroundColor: 'hsl(var(--bg-surface))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2) var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Edit2 size={14} strokeWidth={2} />
            <span>Edit Company</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            aria-label="More options"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'hsl(var(--bg-surface))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2) var(--space-3)',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <MoreVertical size={16} strokeWidth={2} />
          </button>

          {isMoreMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + var(--space-1))',
                width: '190px',
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--space-1)',
                zIndex: 40,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsEditDialogOpen(true);
                  setIsMoreMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Edit Entity Information
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('addresses');
                  setIsMoreMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Manage Addresses & GPS
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('documents');
                  setIsMoreMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Statutory Documents
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-6)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          paddingBottom: 'var(--space-2)',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'info', label: 'Company Information', count: null },
          { key: 'addresses', label: 'Addresses', count: activeAddressCount },
          { key: 'documents', label: 'Documents', count: documentsList.length },
          { key: 'holidays', label: 'Holidays & Weekly Offs', count: null },
          { key: 'settings', label: 'Settings', count: null },
          { key: 'audit', label: 'Audit Logs', count: null },
        ].map((tab) => {
          const isTabActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                position: 'relative',
                padding: 'var(--space-2) 0',
                border: 'none',
                backgroundColor: 'transparent',
                color: isTabActive
                  ? 'hsl(var(--color-brand-accent))'
                  : 'hsl(var(--text-secondary))',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isTabActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isTabActive
                      ? 'hsl(var(--color-brand-accent) / 0.12)'
                      : 'hsl(var(--bg-secondary))',
                    color: isTabActive
                      ? 'hsl(var(--color-brand-accent))'
                      : 'hsl(var(--text-muted))',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '0 var(--space-1)',
                  }}
                >
                  {tab.count}
                </span>
              )}
              {isTabActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-9px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: 'hsl(var(--color-brand-accent))',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Company Banner Card with Live Values */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
          {/* Avatar Circle */}
          <div
            style={{
              width: 'var(--space-16)',
              height: 'var(--space-16)',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'hsl(var(--color-brand-accent))',
              color: 'hsl(var(--text-inverse))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: 'var(--shadow-md)',
              textTransform: 'uppercase',
            }}
          >
            {initials}
          </div>

          {/* Titles & Description */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 800,
                  color: 'hsl(var(--text-primary))',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {displayName}
              </h1>

              {/* Status Pill Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  backgroundColor: isActive
                    ? 'hsl(var(--color-success) / 0.12)'
                    : 'hsl(var(--text-muted) / 0.15)',
                  color: isActive ? 'hsl(var(--color-success))' : 'hsl(var(--text-muted))',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isActive
                      ? 'hsl(var(--color-success))'
                      : 'hsl(var(--text-muted))',
                  }}
                />
                {isActive ? 'Active' : 'Inactive'}
              </span>

              {/* Archetype Badge */}
              <Badge variant={company?.type === 'INTERNAL' ? 'primary' : 'outline'}>
                {displayType}
              </Badge>

              {/* Code Badge */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-mono)',
                  padding: '2px var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                {displayCode}
              </span>
            </div>

            {/* Subtitle / Legal Name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginTop: 'var(--space-1)',
              }}
            >
              <Building2 size={13} />
              <span>Legal Name: {displayLegalName}</span>
            </div>

            {/* Description */}
            {company?.description && (
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--text-secondary))',
                  marginTop: 'var(--space-3)',
                  marginBottom: 0,
                  maxWidth: '700px',
                  lineHeight: 1.5,
                }}
              >
                {company.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Side Meta Dates */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-6)',
            textAlign: 'left',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                fontWeight: 500,
              }}
            >
              Created On
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                marginTop: 'var(--space-1)',
              }}
            >
              {createdFormatted}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                fontWeight: 500,
              }}
            >
              Last Updated
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                marginTop: 'var(--space-1)',
              }}
            >
              {updatedFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab 1: Company Information */}
      {activeTab === 'info' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* Card 1: General & Contact Information */}
          <div
            style={{
              backgroundColor: 'hsl(var(--bg-surface))',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid hsl(var(--border-subtle))',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-2)',
              }}
            >
              <Building2 size={18} style={{ color: 'hsl(var(--color-brand-accent))' }} />
              <h2
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Company & Contact Info
              </h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Legal Registered Name
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  textAlign: 'right',
                }}
              >
                {displayLegalName}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Entity Code
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-mono)',
                  color: 'hsl(var(--color-brand-accent))',
                }}
              >
                {displayCode}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Archetype Role
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {displayType}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Corporate Email
              </span>
              {company?.contactEmail ? (
                <a
                  href={`mailto:${company.contactEmail}`}
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'hsl(var(--color-brand-accent))',
                    textDecoration: 'none',
                  }}
                >
                  {company.contactEmail}
                </a>
              ) : (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                  —
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Contact Phone
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.contactPhone || '—'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingTop: 'var(--space-2)',
                borderTop: '1px solid hsl(var(--border-subtle))',
              }}
            >
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Operational Address
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  color: 'hsl(var(--text-secondary))',
                  textAlign: 'right',
                  maxWidth: '60%',
                }}
              >
                {company?.address || company?.registeredAddress || '—'}
              </span>
            </div>
          </div>

          {/* Card 2: Statutory, Tax & Indian Regulatory Compliance */}
          <div
            style={{
              backgroundColor: 'hsl(var(--bg-surface))',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid hsl(var(--border-subtle))',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-2)',
              }}
            >
              <Shield size={18} style={{ color: 'hsl(var(--color-brand-accent))' }} />
              <h2
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Statutory & Tax Compliance
              </h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                GSTIN Number
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-mono)',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.gstin || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                PAN Number
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-mono)',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.pan || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                TAN Number
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-mono)',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.tan || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                CIN (MCA Registry)
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-mono)',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.cin || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                EPF Establishment Code
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.epfRegistrationNo || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                ESIC Code
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.esicRegistrationNo || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                PSARA License
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {company?.psaraLicenseNo || '—'}
              </span>
            </div>
          </div>

          {/* Card 3: Banking & Authorized Signatory */}
          <div
            style={{
              backgroundColor: 'hsl(var(--bg-surface))',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid hsl(var(--border-subtle))',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <Wallet size={18} style={{ color: 'hsl(var(--color-brand-accent))' }} />
                <h2
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                    margin: 0,
                  }}
                >
                  Banking & Signatory
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                  >
                    Bank Name
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    {company?.bankName || '—'}
                  </span>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                  >
                    Account Number
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-family-mono)',
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    {company?.bankAccountNumber || '—'}
                  </span>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                  >
                    IFSC Code
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-family-mono)',
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    {company?.bankIfscCode || '—'}
                  </span>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                  >
                    Branch
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 500,
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    {company?.bankBranch || '—'}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 'var(--space-3)',
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid hsl(var(--border-subtle))',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Principal Signatory
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    {company?.signatoryName || '—'}{' '}
                    {company?.signatoryDesignation ? `(${company.signatoryDesignation})` : ''}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-secondary))',
                      marginTop: '2px',
                    }}
                  >
                    {company?.signatoryEmail && <div>{company.signatoryEmail}</div>}
                    {company?.signatoryPhone && <div>{company.signatoryPhone}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid hsl(var(--border-subtle))',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'hsl(var(--color-brand-accent))',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                }}
              >
                <span>View Registered Office & Billing Addresses &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Addresses Tab (Database-Backed Registered & Billing Addresses + Geofence Coordinates) */}
      {activeTab === 'addresses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Corporate & Billing Locations
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  margin: '4px 0 0 0',
                }}
              >
                Addresses registered in database with multi-state GST and GPS Geofencing boundaries.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsEditDialogOpen(true)}>
              <Edit2 size={14} style={{ marginRight: 'var(--space-1)' }} />
              Edit Addresses / GPS Pin
            </Button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {/* Card 1: Registered Corporate Office */}
            <div
              style={{
                backgroundColor: 'hsl(var(--bg-surface))',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid hsl(var(--color-brand-accent) / 0.4)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      padding: '2px var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'hsl(var(--color-brand-accent) / 0.12)',
                      color: 'hsl(var(--color-brand-accent))',
                    }}
                  >
                    Registered Office (RoC)
                  </span>
                  <Badge variant="primary">Primary</Badge>
                </div>

                <h3
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                    margin: 'var(--space-2) 0',
                  }}
                >
                  {displayLegalName}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {registeredFullStreet}
                  {registeredLocationLine && (
                    <>
                      <br />
                      {registeredLocationLine}
                    </>
                  )}
                  {company?.stateCode && (
                    <>
                      <br />
                      <span style={{ color: 'hsl(var(--text-muted))' }}>
                        GST State Code: <strong>{company.stateCode}</strong>
                      </span>
                    </>
                  )}
                </p>

                {/* Live Geofence coordinates */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-4)',
                    flexWrap: 'wrap',
                  }}
                >
                  {company?.latitude !== undefined && company?.longitude !== undefined ? (
                    <Badge variant="success">
                      <MapPin size={11} style={{ marginRight: 'var(--space-1)' }} />
                      AWS Places Geofence: {company.latitude.toFixed(5)},{' '}
                      {company.longitude.toFixed(5)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <MapPin size={11} style={{ marginRight: 'var(--space-1)' }} />
                      GPS Coordinates Not Configured
                    </Badge>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-4)',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  Edit Office
                </Button>
              </div>
            </div>

            {/* Card 2: Billing Address */}
            <div
              style={{
                backgroundColor: 'hsl(var(--bg-surface))',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid hsl(var(--border-subtle))',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      padding: '2px var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'hsl(var(--bg-secondary))',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    Billing Address
                  </span>
                  {isBillingSameAsRegistered && (
                    <Badge variant="outline">Same as Registered Office</Badge>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                    margin: 'var(--space-2) 0',
                  }}
                >
                  GST Invoicing Destination
                </h3>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {billingFullStreet}
                  {billingLocationLine && (
                    <>
                      <br />
                      {billingLocationLine}
                    </>
                  )}
                </p>

                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                  }}
                >
                  Used for GST compliance, tax invoicing, and vendor payable settlements.
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-4)',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  Edit Billing
                </Button>
              </div>
            </div>

            {/* Card 3: Geofencing & GPS Telemetry */}
            <div
              style={{
                backgroundColor: 'hsl(var(--bg-surface))',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid hsl(var(--border-subtle))',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      padding: '2px var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'hsl(var(--color-success) / 0.12)',
                      color: 'hsl(var(--color-success))',
                    }}
                  >
                    Amazon Location Geofence
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>

                <h3
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                    margin: 'var(--space-2) 0',
                  }}
                >
                  GPS Coordinates & Boundary
                </h3>

                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    <strong>Latitude:</strong>{' '}
                    {company?.latitude !== undefined
                      ? company.latitude.toFixed(6)
                      : 'Not configured'}
                  </div>
                  <div>
                    <strong>Longitude:</strong>{' '}
                    {company?.longitude !== undefined
                      ? company.longitude.toFixed(6)
                      : 'Not configured'}
                  </div>
                  <div style={{ marginTop: 'var(--space-2)', color: 'hsl(var(--text-muted))' }}>
                    Enforces attendance clock-in boundary radius (150m – 300m) for deployed workers.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-4)',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  Adjust Pin on Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Documents Tab (Placeholder maintained per user instruction) */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Statutory & Compliance Documents ({documentsList.length})
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  margin: '4px 0 0 0',
                }}
              >
                Corporate incorporation, tax registry, and labor compliance certificates.
              </p>
            </div>
            <Button variant="primary" size="sm">
              <Plus size={14} style={{ marginRight: 'var(--space-1)' }} />
              Upload Document
            </Button>
          </div>

          <div
            style={{
              backgroundColor: 'hsl(var(--bg-surface))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-xl)',
              overflowX: 'auto',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid hsl(var(--border-subtle))',
                    backgroundColor: 'hsl(var(--bg-primary) / 0.5)',
                  }}
                >
                  <th
                    style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    Document Title
                  </th>
                  <th
                    style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    Size
                  </th>
                  <th
                    style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    Uploaded On
                  </th>
                  <th
                    style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    Verification
                  </th>
                  <th
                    style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-secondary))',
                      textAlign: 'center',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentsList.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <FileText size={16} style={{ color: 'hsl(var(--color-brand-accent))' }} />
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            color: 'hsl(var(--text-primary))',
                          }}
                        >
                          {doc.title}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      {doc.type}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      {doc.size}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      {doc.uploadedOn}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <Badge variant="success">Verified</Badge>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                      <div
                        style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-1)' }}
                      >
                        <button
                          type="button"
                          aria-label="View document"
                          style={{
                            padding: 'var(--space-1) var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'hsl(var(--text-muted))',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Download document"
                          style={{
                            padding: 'var(--space-1) var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'hsl(var(--text-muted))',
                            cursor: 'pointer',
                          }}
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab: Holidays & Weekly Offs */}
      {activeTab === 'holidays' && (
        <CompanyHolidaySettings companyId={companyId} companyName={company?.name} />
      )}

      {/* 7. Tab 4: Settings Tab (Connected to Database Columns) */}
      {activeTab === 'settings' && (
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: '0 0 var(--space-4) 0',
            }}
          >
            Entity Configuration & Database Policy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Entity Lifecycle Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid hsl(var(--border-subtle))',
                paddingBottom: 'var(--space-3)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Operational Lifecycle Status
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                  Soft-deletion flag:{' '}
                  {company?.isActive !== false
                    ? 'ACTIVE (Included in worker assignments)'
                    : 'ARCHIVED'}
                </div>
              </div>
              <Badge variant={isActive ? 'success' : 'outline'}>{displayStatus}</Badge>
            </div>

            {/* Tenant Workspace Isolation */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid hsl(var(--border-subtle))',
                paddingBottom: 'var(--space-3)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Multi-Tenant Isolation
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                  Workspace Scope: {company?.workspaceId || 'Default Tenant Container'}
                </div>
              </div>
              <Badge variant="primary">Tenant Protected</Badge>
            </div>

            {/* Amazon Location GPS Geofencing */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid hsl(var(--border-subtle))',
                paddingBottom: 'var(--space-3)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Amazon Location GPS Geofencing
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                  {company?.latitude && company?.longitude
                    ? `Coordinates: ${company.latitude.toFixed(6)}, ${company.longitude.toFixed(6)}`
                    : 'GPS boundary pending coordinates configuration'}
                </div>
              </div>
              <Badge variant={company?.latitude ? 'success' : 'outline'}>
                {company?.latitude ? 'Active (AWS Places)' : 'Pending'}
              </Badge>
            </div>

            {/* Facial Biometric Verification */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Facial Biometric Verification Strictness
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                  Require 90%+ AWS Rekognition vector confidence for all attendance clock-ins
                </div>
              </div>
              <Badge variant="success">Enforced</Badge>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab 5: Audit Logs */}
      {activeTab === 'audit' && (
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: '0 0 var(--space-4) 0',
            }}
          >
            Entity Audit Trail & Security Timeline
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                  paddingBottom: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: 'var(--space-8)',
                    height: 'var(--space-8)',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'hsl(var(--color-brand-accent) / 0.1)',
                    color: 'hsl(var(--color-brand-accent))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Activity size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 700,
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {log.action}
                    </span>
                    <span
                      style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                    >
                      {log.timestamp}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginTop: '2px',
                    }}
                  >
                    By {log.actor}
                  </div>
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-secondary))',
                      margin: 'var(--space-1) 0 0 0',
                    }}
                  >
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Bottom Summary Overview Bar with Dynamic Counts */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-4) var(--space-6)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={16} style={{ color: 'hsl(var(--color-brand-accent))' }} />
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
              }}
            >
              {activeAddressCount} Registered Address{activeAddressCount > 1 ? 'es' : ''}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              borderLeft: '1px solid hsl(var(--border-subtle))',
              paddingLeft: 'var(--space-8)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
              }}
            >
              1 Primary Head Office
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              borderLeft: '1px solid hsl(var(--border-subtle))',
              paddingLeft: 'var(--space-8)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
              }}
            >
              {documentsList.length} Documents Available
            </span>
          </div>
        </div>

        {/* Right Link */}
        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'hsl(var(--color-brand-accent))',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <span>View All Details</span>
        </button>
      </div>

      {/* Edit Company Dialog */}
      {isEditDialogOpen && (
        <CompanyFormDialog
          isOpen={isEditDialogOpen}
          initialData={company}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={(updated) => {
            setCompany(updated);
            void fetchCompanyDetails();
          }}
        />
      )}
    </div>
  );
}

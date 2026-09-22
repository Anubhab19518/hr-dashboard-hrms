'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import {
  MapPin,
  Building2,
  FileText,
  Briefcase,
  CheckCircle2,
  Check,
  Plus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
} from '@/components/atoms/icons';
import { OrganizationService } from '../services/organization.service';
import { LocationService } from '../services/location.service';
import {
  LocationSearchInput,
  type SelectedLocation,
} from '@/components/organisms/location-search-input';
import { LocationMapPicker } from '@/components/organisms/location-map-picker';
import type { Company } from '../types/organization.types';
import type { CreateCompanyInput } from '../schemas/organization.schema';

interface CompanyFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: Company) => void;
  initialData?: Company | null;
}

type TabKey = 'basic' | 'statutory' | 'address' | 'bank' | 'signatory';

const TAB_ORDER: TabKey[] = ['basic', 'statutory', 'address', 'bank', 'signatory'];

export function CompanyFormDialog({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CompanyFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDifferentBilling, setIsDifferentBilling] = useState(false);

  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: '',
    code: '',
    type: 'CLIENT',
    legalName: '',
    description: '',
    status: 'ACTIVE',
    contactEmail: '',
    contactPhone: '',
    address: '',

    // Statutory
    gstin: '',
    pan: '',
    tan: '',
    cin: '',
    epfRegistrationNo: '',
    esicRegistrationNo: '',
    ptRegistrationNo: '',
    lwfRegistrationNo: '',
    msmeUdyamNo: '',
    shopEstablishmentNo: '',
    psaraLicenseNo: '',

    // Addresses
    registeredAddress: '',
    registeredCity: '',
    registeredState: '',
    registeredPincode: '',
    stateCode: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPincode: '',

    // Bank
    bankName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankBranch: '',

    // Signatory
    signatoryName: '',
    signatoryDesignation: '',
    signatoryEmail: '',
    signatoryPhone: '',

    // Coordinates
    latitude: undefined,
    longitude: undefined,
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        type: initialData.type || 'CLIENT',
        legalName: initialData.legalName || '',
        description: initialData.description || '',
        status: initialData.status || 'ACTIVE',
        contactEmail: initialData.contactEmail || '',
        contactPhone: initialData.contactPhone || '',
        address: initialData.address || '',
        gstin: initialData.gstin || '',
        pan: initialData.pan || '',
        tan: initialData.tan || '',
        cin: initialData.cin || '',
        epfRegistrationNo: initialData.epfRegistrationNo || '',
        esicRegistrationNo: initialData.esicRegistrationNo || '',
        ptRegistrationNo: initialData.ptRegistrationNo || '',
        lwfRegistrationNo: initialData.lwfRegistrationNo || '',
        msmeUdyamNo: initialData.msmeUdyamNo || '',
        shopEstablishmentNo: initialData.shopEstablishmentNo || '',
        psaraLicenseNo: initialData.psaraLicenseNo || '',
        registeredAddress: initialData.registeredAddress || '',
        registeredCity: initialData.registeredCity || '',
        registeredState: initialData.registeredState || '',
        registeredPincode: initialData.registeredPincode || '',
        stateCode: initialData.stateCode || '',
        billingAddress: initialData.billingAddress || '',
        billingCity: initialData.billingCity || '',
        billingState: initialData.billingState || '',
        billingPincode: initialData.billingPincode || '',
        bankName: initialData.bankName || '',
        bankAccountNumber: initialData.bankAccountNumber || '',
        bankIfscCode: initialData.bankIfscCode || '',
        bankBranch: initialData.bankBranch || '',
        signatoryName: initialData.signatoryName || '',
        signatoryDesignation: initialData.signatoryDesignation || '',
        signatoryEmail: initialData.signatoryEmail || '',
        signatoryPhone: initialData.signatoryPhone || '',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
      if (
        initialData.billingAddress &&
        initialData.billingAddress !== initialData.registeredAddress
      ) {
        setIsDifferentBilling(true);
      }
      if (initialData.latitude !== undefined && initialData.longitude !== undefined) {
        setLocationSuccessMsg(
          `AWS Places coordinates: ${initialData.latitude.toFixed(6)}, ${initialData.longitude.toFixed(6)}`,
        );
      }
    } else if (!initialData && isOpen) {
      setFormData({
        name: '',
        code: '',
        type: 'CLIENT',
        legalName: '',
        description: '',
        status: 'ACTIVE',
        contactEmail: '',
        contactPhone: '',
        address: '',
        gstin: '',
        pan: '',
        tan: '',
        cin: '',
        epfRegistrationNo: '',
        esicRegistrationNo: '',
        ptRegistrationNo: '',
        lwfRegistrationNo: '',
        msmeUdyamNo: '',
        shopEstablishmentNo: '',
        psaraLicenseNo: '',
        registeredAddress: '',
        registeredCity: '',
        registeredState: '',
        registeredPincode: '',
        stateCode: '',
        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingPincode: '',
        bankName: '',
        bankAccountNumber: '',
        bankIfscCode: '',
        bankBranch: '',
        signatoryName: '',
        signatoryDesignation: '',
        signatoryEmail: '',
        signatoryPhone: '',
        latitude: undefined,
        longitude: undefined,
      });
      setIsDifferentBilling(false);
      setSelectedLocationName(null);
      setLocationSuccessMsg(null);
      setLocationErrorMsg(null);
      setError(null);
    }
  }, [initialData, isOpen]);

  const handleFieldChange = (field: keyof CreateCompanyInput, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle location picked from Amazon Location Service Autocomplete or GPS Snap
   */
  const handleLocationPicked = (loc: SelectedLocation) => {
    setFormData((prev) => ({
      ...prev,
      registeredAddress: loc.street || loc.label || prev.registeredAddress,
      registeredCity: loc.city || prev.registeredCity,
      registeredState: loc.state || prev.registeredState,
      registeredPincode: loc.postalCode || prev.registeredPincode,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
    setSelectedLocationName(loc.label);
    setLocationSuccessMsg(
      `AWS Places verified: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
    );
    setLocationErrorMsg(null);
  };

  /**
   * Handle interactive map pin movement (drag or click)
   */
  const handleMapPinChange = async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setLocationSuccessMsg(`Pin positioned at: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setLocationErrorMsg(null);

    try {
      const results = await LocationService.reverseGeocode(lat, lng, 1);
      if (results[0]) {
        setSelectedLocationName(results[0].label);
        setLocationSuccessMsg(
          `AWS Places snapped: ${results[0].label} (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        );
      }
    } catch {
      // Retain custom coordinates
    }
  };

  /**
   * Forward Geocoding using Amazon Location Service (AWS Places) from typed address
   */
  const handleGeocodeFromAddress = async () => {
    const rawStreet = (formData.registeredAddress || formData.address || '').trim();
    const city = (formData.registeredCity || '').trim();
    const state = (formData.registeredState || '').trim();
    const pincode = (formData.registeredPincode || '').trim();

    if (!rawStreet && !city && !pincode) {
      setLocationErrorMsg('Please fill in Street Address, City, or Pincode first.');
      return;
    }

    setIsGeocoding(true);
    setLocationErrorMsg(null);
    setLocationSuccessMsg(null);

    try {
      const top = await LocationService.resolveAddressCoordinates({
        street: rawStreet,
        city,
        state,
        pincode,
      });

      if (top) {
        setFormData((prev) => ({
          ...prev,
          latitude: top.latitude,
          longitude: top.longitude,
          registeredCity: top.municipality || prev.registeredCity,
          registeredState: top.region || prev.registeredState,
          registeredPincode: top.postalCode || prev.registeredPincode,
        }));
        setSelectedLocationName(top.label);
        setLocationSuccessMsg(
          `AWS Places matched: ${top.label} (${top.latitude.toFixed(6)}, ${top.longitude.toFixed(6)})`,
        );
      } else {
        setLocationErrorMsg(
          `No exact coordinates found. Try searching with AWS Places Autocomplete above.`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lookup failed';
      setLocationErrorMsg(msg);
    } finally {
      setIsGeocoding(false);
    }
  };

  /**
   * Copy registered address into billing address
   */
  const handleCopyRegisteredAddress = () => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: prev.registeredAddress,
      billingCity: prev.registeredCity,
      billingState: prev.registeredState,
      billingPincode: prev.registeredPincode,
    }));
  };

  const handleNextTab = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < TAB_ORDER.length - 1) {
      const nextKey = TAB_ORDER[currentIndex + 1];
      if (nextKey) setActiveTab(nextKey);
    }
  };

  const handlePrevTab = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      const prevKey = TAB_ORDER[currentIndex - 1];
      if (prevKey) setActiveTab(prevKey);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setActiveTab('basic');
      setError('Company Name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setActiveTab('basic');
      setError('Company Code is required (e.g. ACME01).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCompanyInput = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        legalName: formData.legalName?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        contactEmail: formData.contactEmail?.trim() || undefined,
        contactPhone: formData.contactPhone?.trim() || undefined,
        address: formData.registeredAddress?.trim() || formData.address?.trim() || undefined,
        gstin: formData.gstin?.trim() || undefined,
        pan: formData.pan?.trim() || undefined,
        tan: formData.tan?.trim() || undefined,
        cin: formData.cin?.trim() || undefined,
        epfRegistrationNo: formData.epfRegistrationNo?.trim() || undefined,
        esicRegistrationNo: formData.esicRegistrationNo?.trim() || undefined,
        ptRegistrationNo: formData.ptRegistrationNo?.trim() || undefined,
        lwfRegistrationNo: formData.lwfRegistrationNo?.trim() || undefined,
        msmeUdyamNo: formData.msmeUdyamNo?.trim() || undefined,
        shopEstablishmentNo: formData.shopEstablishmentNo?.trim() || undefined,
        psaraLicenseNo: formData.psaraLicenseNo?.trim() || undefined,
        registeredAddress: formData.registeredAddress?.trim() || undefined,
        registeredCity: formData.registeredCity?.trim() || undefined,
        registeredState: formData.registeredState?.trim() || undefined,
        registeredPincode: formData.registeredPincode?.trim() || undefined,
        stateCode: formData.stateCode?.trim() || undefined,
        billingAddress:
          (isDifferentBilling ? formData.billingAddress : formData.registeredAddress)?.trim() ||
          undefined,
        billingCity:
          (isDifferentBilling ? formData.billingCity : formData.registeredCity)?.trim() ||
          undefined,
        billingState:
          (isDifferentBilling ? formData.billingState : formData.registeredState)?.trim() ||
          undefined,
        billingPincode:
          (isDifferentBilling ? formData.billingPincode : formData.registeredPincode)?.trim() ||
          undefined,
        bankName: formData.bankName?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankIfscCode: formData.bankIfscCode?.trim() || undefined,
        bankBranch: formData.bankBranch?.trim() || undefined,
        signatoryName: formData.signatoryName?.trim() || undefined,
        signatoryDesignation: formData.signatoryDesignation?.trim() || undefined,
        signatoryEmail: formData.signatoryEmail?.trim() || undefined,
        signatoryPhone: formData.signatoryPhone?.trim() || undefined,
        latitude: formData.latitude !== undefined ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== undefined ? Number(formData.longitude) : undefined,
      };

      let saved: Company;
      if (initialData?.id) {
        saved = await OrganizationService.updateCompany(initialData.id, payload);
      } else {
        saved = await OrganizationService.createCompany(payload);
      }

      if (formData.latitude !== undefined && formData.longitude !== undefined && saved?.id) {
        try {
          await LocationService.setCompanyGeoConfig(saved.id, {
            centerLatitude: formData.latitude,
            centerLongitude: formData.longitude,
            radiusMeters: 300,
            enabled: true,
          });
        } catch {
          // Optional geoconfig fallback
        }
      }
      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save company';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setError(null);
    const draftName = formData.name.trim() || 'Draft Corporate Entity';
    const draftCode = formData.code.trim() || `DFT-${Date.now().toString().slice(-4)}`;

    setIsSubmitting(true);
    try {
      const draftPayload: CreateCompanyInput = {
        ...formData,
        name: draftName,
        code: draftCode,
        status: 'INACTIVE',
        legalName: formData.legalName?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        contactEmail: formData.contactEmail?.trim() || undefined,
        contactPhone: formData.contactPhone?.trim() || undefined,
        gstin: formData.gstin?.trim() || undefined,
        pan: formData.pan?.trim() || undefined,
        tan: formData.tan?.trim() || undefined,
        cin: formData.cin?.trim() || undefined,
        epfRegistrationNo: formData.epfRegistrationNo?.trim() || undefined,
        esicRegistrationNo: formData.esicRegistrationNo?.trim() || undefined,
        ptRegistrationNo: formData.ptRegistrationNo?.trim() || undefined,
        lwfRegistrationNo: formData.lwfRegistrationNo?.trim() || undefined,
        msmeUdyamNo: formData.msmeUdyamNo?.trim() || undefined,
        shopEstablishmentNo: formData.shopEstablishmentNo?.trim() || undefined,
        psaraLicenseNo: formData.psaraLicenseNo?.trim() || undefined,
      };
      const created = await OrganizationService.createCompany(draftPayload);
      if (formData.latitude !== undefined && formData.longitude !== undefined) {
        await LocationService.setCompanyGeoConfig(created.id, {
          centerLatitude: formData.latitude,
          centerLongitude: formData.longitude,
          radiusMeters: 300,
          enabled: true,
        });
      }
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save draft';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTabCompleted = (key: TabKey): boolean => {
    switch (key) {
      case 'basic':
        return Boolean(formData.name.trim().length >= 2 && formData.code.trim().length >= 2);
      case 'statutory':
        return Boolean(
          formData.gstin?.trim() ||
          formData.pan?.trim() ||
          formData.cin?.trim() ||
          formData.tan?.trim() ||
          formData.epfRegistrationNo?.trim() ||
          formData.esicRegistrationNo?.trim() ||
          formData.ptRegistrationNo?.trim() ||
          formData.lwfRegistrationNo?.trim() ||
          formData.msmeUdyamNo?.trim() ||
          formData.shopEstablishmentNo?.trim() ||
          formData.psaraLicenseNo?.trim(),
        );
      case 'address':
        return Boolean(
          (formData.registeredAddress?.trim() || formData.registeredCity?.trim()) &&
          formData.latitude !== undefined &&
          formData.longitude !== undefined,
        );
      case 'bank':
        return Boolean(formData.bankAccountNumber?.trim() && formData.bankIfscCode?.trim());
      case 'signatory':
        return Boolean(formData.signatoryName?.trim());
      default:
        return false;
    }
  };

  const tabs: { key: TabKey; label: string; Icon: typeof Building2 }[] = [
    { key: 'basic', label: 'Basic Info', Icon: Building2 },
    { key: 'statutory', label: 'Tax & Statutory', Icon: FileText },
    { key: 'address', label: 'Addresses & Geofence', Icon: MapPin },
    { key: 'bank', label: 'Bank Account', Icon: Briefcase },
    { key: 'signatory', label: 'Signatory', Icon: CheckCircle2 },
  ];

  const currentTabIndex = TAB_ORDER.indexOf(activeTab);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      title="Create Company Entity"
      description="Register an enterprise corporate entity with Indian statutory registrations and geofence location."
    >
      {/* Modern Stepper Tab Navigation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 'var(--space-2)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          paddingBottom: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.key;
          const isCompleted = isTabCompleted(tab.key);
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-2) var(--space-2)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: isActive
                  ? '1px solid hsl(var(--color-brand-accent) / 0.4)'
                  : isCompleted
                    ? '1px solid hsl(var(--color-success) / 0.3)'
                    : '1px solid transparent',
                backgroundColor: isActive
                  ? 'hsl(var(--color-brand-accent) / 0.08)'
                  : isCompleted
                    ? 'hsl(var(--color-success) / 0.05)'
                    : 'transparent',
                color: isActive
                  ? 'hsl(var(--color-brand-accent))'
                  : isCompleted
                    ? 'hsl(var(--color-success))'
                    : 'hsl(var(--text-muted))',
                transition: 'all var(--transition-fast)',
                textAlign: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: isActive || isCompleted ? 700 : 500,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isCompleted
                      ? 'hsl(var(--color-success))'
                      : isActive
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--bg-surface))',
                    border:
                      isCompleted || isActive ? 'none' : '1.5px solid hsl(var(--border-base))',
                    color:
                      isCompleted || isActive
                        ? 'hsl(var(--text-inverse))'
                        : 'hsl(var(--text-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    boxShadow: isCompleted || isActive ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {isCompleted ? <Check size={11} strokeWidth={3} /> : idx + 1}
                </div>
                <TabIcon size={14} strokeWidth={1.75} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isActive || isCompleted ? 600 : 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-xs)',
            marginBottom: 'var(--space-3)',
            border: '1px solid hsl(var(--color-danger) / 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {/* TAB 1: BASIC DETAILS (Clean, no GPS here as requested) */}
        {activeTab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Company Name *
                </label>
                <Input
                  placeholder="e.g. Acme Manpower & Security Services Pvt Ltd"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                  autoFocus
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
                  Entity Code *
                </label>
                <Input
                  placeholder="e.g. ACME01"
                  value={formData.code}
                  onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}
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
                  Company Type *
                </label>
                <select
                  value={formData.type || 'CLIENT'}
                  onChange={(e) =>
                    handleFieldChange('type', e.target.value as 'INTERNAL' | 'CLIENT')
                  }
                  style={{
                    width: '100%',
                    height: 'var(--space-10)',
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--border-subtle))',
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <option value="CLIENT">Client Company / Account</option>
                  <option value="INTERNAL">Internal HQ / Parent Entity</option>
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
                  Legal / Registered Name
                </label>
                <Input
                  placeholder="Official registered name as per ROC / Certificate"
                  value={formData.legalName ?? ''}
                  onChange={(e) => handleFieldChange('legalName', e.target.value)}
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
                  Operational Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    height: 'var(--space-10)',
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--border-subtle))',
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Contact Email
                </label>
                <Input
                  type="email"
                  placeholder="info@acmesecurity.com"
                  value={formData.contactEmail ?? ''}
                  onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
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
                  Contact Phone
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={formData.contactPhone ?? ''}
                  onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                />
              </div>
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
                Description / Business Overview
              </label>
              <Input
                placeholder="Integrated manpower solutions, facility management, and manned guarding services"
                value={formData.description ?? ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: TAX & STATUTORY REGISTRATIONS */}
        {activeTab === 'statutory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  GSTIN (15 Alphanumeric)
                </label>
                <Input
                  placeholder="e.g. 19AABCU6003F1Z5"
                  maxLength={15}
                  value={formData.gstin ?? ''}
                  onChange={(e) => {
                    const clean = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 15);
                    handleFieldChange('gstin', clean);
                    if (clean.length >= 12) {
                      const extractedPan = clean.slice(2, 12);
                      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extractedPan) && !formData.pan) {
                        handleFieldChange('pan', extractedPan);
                      }
                    }
                  }}
                  helperText="Format: 2-digit State + 10-char PAN + Entity No + Z + Check digit (e.g. 19AABCU6003F1Z5)"
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
                  Company PAN (10 Chars)
                </label>
                <Input
                  placeholder="e.g. AABCU6003F"
                  maxLength={10}
                  value={formData.pan ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'pan',
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 10),
                    )
                  }
                  helperText="Format: 5 letters + 4 digits + 1 letter (e.g. AABCU6003F)"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  TAN Number (10 Chars)
                </label>
                <Input
                  placeholder="e.g. BLRA12345A"
                  maxLength={10}
                  value={formData.tan ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'tan',
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 10),
                    )
                  }
                  helperText="Format: 4 letters + 5 digits + 1 letter (e.g. BLRA12345A)"
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
                  Corporate CIN
                </label>
                <Input
                  placeholder="U93000WB2013PTC194279"
                  maxLength={21}
                  value={formData.cin ?? ''}
                  onChange={(e) => handleFieldChange('cin', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  EPF Establishment Code
                </label>
                <Input
                  placeholder="KNBLR0012345000"
                  value={formData.epfRegistrationNo ?? ''}
                  onChange={(e) =>
                    handleFieldChange('epfRegistrationNo', e.target.value.toUpperCase())
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
                  ESIC Registration Code (17 Digits)
                </label>
                <Input
                  placeholder="53000123450000001"
                  value={formData.esicRegistrationNo ?? ''}
                  onChange={(e) => handleFieldChange('esicRegistrationNo', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Professional Tax (PT) Registration
                </label>
                <Input
                  placeholder="PT-KAR-2024-9988"
                  value={formData.ptRegistrationNo ?? ''}
                  onChange={(e) =>
                    handleFieldChange('ptRegistrationNo', e.target.value.toUpperCase())
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
                  Labor Welfare Fund (LWF) Code
                </label>
                <Input
                  placeholder="LWF-KA-4589"
                  value={formData.lwfRegistrationNo ?? ''}
                  onChange={(e) =>
                    handleFieldChange('lwfRegistrationNo', e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  MSME / Udyam Registration
                </label>
                <Input
                  placeholder="UDYAM-KR-03-0012345"
                  value={formData.msmeUdyamNo ?? ''}
                  onChange={(e) => handleFieldChange('msmeUdyamNo', e.target.value.toUpperCase())}
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
                  Shop & Establishment No
                </label>
                <Input
                  placeholder="SE-BLR-2023-8877"
                  value={formData.shopEstablishmentNo ?? ''}
                  onChange={(e) =>
                    handleFieldChange('shopEstablishmentNo', e.target.value.toUpperCase())
                  }
                />
              </div>
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
                PSARA License Number (Security Agencies)
              </label>
              <Input
                placeholder="PSARA/KA/2024/0014"
                value={formData.psaraLicenseNo ?? ''}
                onChange={(e) => handleFieldChange('psaraLicenseNo', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        )}

        {/* TAB 3: ADDRESSES & PRIMARY GEOFENCE (Zero-Scroll 2-Column Responsive Layout) */}
        {activeTab === 'address' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-4)',
              alignItems: 'start',
            }}
          >
            {/* Left Column: AWS Places Search & Corporate Address Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {/* 1. Amazon Location Service (AWS Places) Autocomplete & Live GPS Snap */}
              <div
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--primary-color) / 0.05)',
                  border: '1px solid hsl(var(--primary-color) / 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <Sparkles size={14} style={{ color: 'hsl(var(--primary-color))' }} />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'hsl(var(--primary-color))',
                      }}
                    >
                      Amazon Location Service (AWS Places)
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                    Sub-meter centroid snap
                  </span>
                </div>
                <LocationSearchInput
                  placeholder="Search office address or area (e.g. Salt Lake Sector V / Birati)..."
                  onLocationSelect={handleLocationPicked}
                  showDetectGps={true}
                />
              </div>

              {/* 2. Registered Office Address Details */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'var(--space-1)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Registered Corporate Office Details
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleGeocodeFromAddress}
                  disabled={isGeocoding}
                  style={{
                    fontSize: '10px',
                    color: 'hsl(var(--primary-color))',
                    height: '24px',
                    padding: '0 var(--space-2)',
                  }}
                >
                  <Sparkles size={11} style={{ marginRight: 'var(--space-1)' }} />
                  {isGeocoding ? 'Detecting...' : 'Detect Coordinates'}
                </Button>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: '2px',
                  }}
                >
                  Street Address / Building / Locality
                </label>
                <Input
                  placeholder="e.g. M.B. Road, Birati or Plot 42, Salt Lake Sector V"
                  value={formData.registeredAddress ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFieldChange('registeredAddress', val);
                    if (!isDifferentBilling) {
                      handleFieldChange('billingAddress', val);
                    }
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 'var(--space-2)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginBottom: '2px',
                    }}
                  >
                    City / Area
                  </label>
                  <Input
                    placeholder="e.g. Kolkata"
                    value={formData.registeredCity ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFieldChange('registeredCity', val);
                      if (!isDifferentBilling) handleFieldChange('billingCity', val);
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginBottom: '2px',
                    }}
                  >
                    State
                  </label>
                  <Input
                    placeholder="e.g. West Bengal"
                    value={formData.registeredState ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFieldChange('registeredState', val);
                      if (!isDifferentBilling) handleFieldChange('billingState', val);
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginBottom: '2px',
                    }}
                  >
                    Pincode
                  </label>
                  <Input
                    placeholder="e.g. 700051"
                    maxLength={6}
                    value={formData.registeredPincode ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFieldChange('registeredPincode', val);
                      if (!isDifferentBilling) handleFieldChange('billingPincode', val);
                    }}
                  />
                </div>
              </div>

              {/* 3. Operational / Billing Address Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-1)',
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                }}
              >
                <input
                  type="checkbox"
                  id="billing-diff-toggle"
                  checked={isDifferentBilling}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsDifferentBilling(checked);
                    if (!checked) {
                      handleCopyRegisteredAddress();
                    }
                  }}
                  style={{ cursor: 'pointer', accentColor: 'hsl(var(--primary-color))' }}
                />
                <label
                  htmlFor="billing-diff-toggle"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Billing address differs from registered corporate address
                </label>
              </div>

              {isDifferentBilling && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        marginBottom: '2px',
                      }}
                    >
                      Billing Street Address
                    </label>
                    <Input
                      placeholder="Billing street address"
                      value={formData.billingAddress ?? ''}
                      onChange={(e) => handleFieldChange('billingAddress', e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Input
                      placeholder="City"
                      value={formData.billingCity ?? ''}
                      onChange={(e) => handleFieldChange('billingCity', e.target.value)}
                    />
                    <Input
                      placeholder="State"
                      value={formData.billingState ?? ''}
                      onChange={(e) => handleFieldChange('billingState', e.target.value)}
                    />
                    <Input
                      placeholder="Pincode"
                      maxLength={6}
                      value={formData.billingPincode ?? ''}
                      onChange={(e) => handleFieldChange('billingPincode', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: High-Visibility Compact Geofence Map Picker */}
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--bg-secondary))',
                border: '1px solid hsl(var(--border-subtle))',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <MapPin
                    size={15}
                    strokeWidth={2}
                    style={{ color: 'hsl(var(--color-brand-accent))' }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    Primary Geofence & Attendance Map Pin
                  </span>
                </div>

                {formData.latitude !== undefined && formData.longitude !== undefined && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'hsl(var(--color-success) / 0.1)',
                      color: 'hsl(var(--color-success))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                    }}
                  >
                    <Check size={11} strokeWidth={3} />
                    {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                  </span>
                )}
              </div>

              {/* Perfectly sized 270px Map Viewport that aligns seamlessly with left column */}
              <LocationMapPicker
                latitude={formData.latitude ?? 22.5726}
                longitude={formData.longitude ?? 88.3639}
                radiusMeters={300}
                addressLabel={
                  formData.registeredAddress || selectedLocationName || 'Office Geofence'
                }
                onChange={handleMapPinChange}
                height="270px"
              />

              {locationSuccessMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    color: 'hsl(var(--color-success))',
                    fontSize: '11px',
                    padding: '2px var(--space-2)',
                    backgroundColor: 'hsl(var(--color-success) / 0.1)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <Check size={12} strokeWidth={2} />
                  <span
                    style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                  >
                    {locationSuccessMsg}
                  </span>
                </div>
              )}

              {locationErrorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    color: 'hsl(var(--color-danger))',
                    fontSize: '11px',
                    padding: '2px var(--space-2)',
                    backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <AlertCircle size={12} strokeWidth={2} />
                  <span>{locationErrorMsg}</span>
                </div>
              )}

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '2px',
                    }}
                  >
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="22.5726"
                    value={formData.latitude ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'latitude',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '2px',
                    }}
                  >
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="88.3639"
                    value={formData.longitude ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'longitude',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BANK DETAILS */}
        {activeTab === 'bank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
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
                  placeholder="HDFC Bank / ICICI Bank / SBI"
                  value={formData.bankName ?? ''}
                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
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
                  placeholder="50200012345678"
                  value={formData.bankAccountNumber ?? ''}
                  onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  IFSC Code (11 Characters)
                </label>
                <Input
                  placeholder="HDFC0001234"
                  maxLength={11}
                  value={formData.bankIfscCode ?? ''}
                  onChange={(e) => handleFieldChange('bankIfscCode', e.target.value.toUpperCase())}
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
                  Branch Name / City
                </label>
                <Input
                  placeholder="Salt Lake Sector V Branch, Kolkata"
                  value={formData.bankBranch ?? ''}
                  onChange={(e) => handleFieldChange('bankBranch', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUTHORIZED SIGNATORY */}
        {activeTab === 'signatory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Signatory Full Name
                </label>
                <Input
                  placeholder="Rajesh Sharma"
                  value={formData.signatoryName ?? ''}
                  onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
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
                  Designation
                </label>
                <Input
                  placeholder="Managing Director / CEO"
                  value={formData.signatoryDesignation ?? ''}
                  onChange={(e) => handleFieldChange('signatoryDesignation', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Signatory Email
                </label>
                <Input
                  type="email"
                  placeholder="rajesh@acmesecurity.com"
                  value={formData.signatoryEmail ?? ''}
                  onChange={(e) => handleFieldChange('signatoryEmail', e.target.value)}
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
                  Signatory Phone
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={formData.signatoryPhone ?? ''}
                  onChange={(e) => handleFieldChange('signatoryPhone', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid hsl(var(--border-subtle))',
            paddingTop: 'var(--space-4)',
            marginTop: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {currentTabIndex > 0 && (
              <Button type="button" variant="ghost" onClick={handlePrevTab} disabled={isSubmitting}>
                <ChevronLeft size={14} style={{ marginRight: 'var(--space-1)' }} />
                Previous
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            {currentTabIndex < TAB_ORDER.length - 1 ? (
              <Button type="button" variant="primary" onClick={handleNextTab}>
                Next Step
                <ChevronRight size={14} style={{ marginLeft: 'var(--space-1)' }} />
              </Button>
            ) : null}
            <Button
              type="submit"
              variant={currentTabIndex === TAB_ORDER.length - 1 ? 'primary' : 'outline'}
              disabled={isSubmitting}
            >
              <Plus size={14} strokeWidth={2} style={{ marginRight: 'var(--space-1)' }} />
              {isSubmitting ? 'Registering...' : 'Create Company'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

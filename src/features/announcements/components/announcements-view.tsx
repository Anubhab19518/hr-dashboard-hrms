'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Building2,
  Clock,
  CheckCircle2,
  Eye,
} from '@/components/atoms/icons';
import { AnnouncementsService } from '../services/announcements.service';
import { OrganizationService } from '@/features/organization';
import { toast } from '@/lib/client/toast';
import { AnnouncementFormModal } from './announcement-form-modal';
import { AnnouncementDeleteModal } from './announcement-delete-modal';
import { Modal } from '@/components/molecules/modal';
import type {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  CreateAnnouncementInput,
} from '../types/announcements.types';
import type { CompanyOption } from '@/features/employees';

export function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyMap, setCompanyMap] = useState<Map<string, string>>(new Map());

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View / Read Announcement Modal
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

  // Fetch Companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const comps = await OrganizationService.getCompanies();
        if (Array.isArray(comps)) {
          const mapped: CompanyOption[] = comps.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            type: c.type,
          }));
          setCompanies(mapped);

          const cMap = new Map<string, string>();
          for (const c of comps) {
            if (c.id) cMap.set(c.id, c.name);
          }
          setCompanyMap(cMap);
        }
      } catch {
        // Retain empty company list gracefully
      }
    }
    void loadCompanies();
  }, []);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AnnouncementsService.getAnnouncements({
        companyId: selectedCompanyId === 'ALL' ? undefined : selectedCompanyId,
        search: searchQuery.trim() || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        page,
        limit,
      });

      setAnnouncements(res.announcements);
      setTotal(res.pagination.total);
    } catch {
      setAnnouncements([]);
      setTotal(0);
      toast.error('Failed to load announcements. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, searchQuery, typeFilter, priorityFilter, page, limit]);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Handle Create / Edit Submission
  const handleFormSubmit = async (data: CreateAnnouncementInput) => {
    setIsSubmittingForm(true);
    try {
      if (editingAnnouncement) {
        await AnnouncementsService.updateAnnouncement(editingAnnouncement.id, data);
        toast.success('Announcement updated successfully');
      } else {
        await AnnouncementsService.createAnnouncement(data);
        toast.success('Announcement published successfully');
      }
      setIsFormModalOpen(false);
      setEditingAnnouncement(null);
      void fetchAnnouncements();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Operation failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingAnnouncement) return;
    setIsDeleting(true);
    try {
      await AnnouncementsService.deleteAnnouncement(deletingAnnouncement.id);
      toast.success('Announcement deleted successfully');
      setDeletingAnnouncement(null);
      void fetchAnnouncements();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete announcement.';
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (type: AnnouncementType) => {
    switch (type) {
      case 'URGENT':
      case 'EMERGENCY':
        return <Badge variant="destructive">{type.replace('_', ' ')}</Badge>;
      case 'HOLIDAY':
      case 'EVENT':
        return <Badge variant="info">{type.replace('_', ' ')}</Badge>;
      case 'POLICY_UPDATE':
      case 'POLICY':
        return <Badge variant="secondary">{type.replace('_', ' ')}</Badge>;
      case 'PAYROLL':
        return <Badge variant="success">PAYROLL</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="warning">MAINTENANCE</Badge>;
      default:
        return <Badge variant="outline">GENERAL</Badge>;
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span
            style={{
              backgroundColor: 'hsl(var(--color-danger))',
              color: 'hsl(var(--text-inverse))',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.05em',
            }}
          >
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span
            style={{
              backgroundColor: 'hsl(var(--color-warning))',
              color: 'hsl(var(--text-inverse))',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            HIGH
          </span>
        );
      case 'NORMAL':
        return (
          <span
            style={{
              backgroundColor: 'hsl(var(--bg-secondary))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            NORMAL
          </span>
        );
      case 'LOW':
        return (
          <span
            style={{
              backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
              color: 'hsl(var(--text-muted))',
              fontSize: '10px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            LOW
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    try {
      return new Date(expiresAt).getTime() < new Date().getTime();
    } catch {
      return false;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 'var(--space-10)',
              height: 'var(--space-10)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'hsl(var(--color-brand-accent) / 0.12)',
              color: 'hsl(var(--color-brand-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Megaphone size={22} strokeWidth={2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Announcements & Bulletins
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
                margin: 0,
              }}
            >
              Publish organizational updates, policy changes, and urgent broadcasts across all
              companies
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button
            variant="outline"
            size="md"
            onClick={() => void fetchAnnouncements()}
            disabled={isLoading}
            leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingAnnouncement(null);
              setIsFormModalOpen(true);
            }}
            leftIcon={<Plus size={16} strokeWidth={2.5} />}
          >
            Create Announcement
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-4) var(--space-5)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          alignItems: 'flex-end',
        }}
      >
        {/* Company Dropdown Filter */}
        <div style={{ flex: '1 1 240px', minWidth: '200px', maxWidth: '320px' }}>
          <label
            htmlFor="filter-company"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Target Company
          </label>
          <select
            id="filter-company"
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '42px',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-base))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            <option value="ALL">All Companies (Workspace-wide)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category / Type Filter */}
        <div style={{ flex: '1 1 180px', minWidth: '160px', maxWidth: '240px' }}>
          <label
            htmlFor="filter-type"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Category
          </label>
          <select
            id="filter-type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as AnnouncementType | 'ALL');
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '42px',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-base))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL">General</option>
            <option value="URGENT">Urgent Alert</option>
            <option value="HOLIDAY">Holiday & Offs</option>
            <option value="POLICY_UPDATE">Policy Update</option>
            <option value="POLICY">Company Policy</option>
            <option value="EVENT">Company Event</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="PAYROLL">Payroll & Comp</option>
            <option value="EMERGENCY">Emergency Notice</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ flex: '1 1 160px', minWidth: '140px', maxWidth: '200px' }}>
          <label
            htmlFor="filter-priority"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Priority
          </label>
          <select
            id="filter-priority"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as AnnouncementPriority | 'ALL');
              setPage(1);
            }}
            style={{
              width: '100%',
              height: '42px',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-base))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Search Box */}
        <div style={{ flex: '2 1 240px', minWidth: '220px' }}>
          <label
            htmlFor="filter-search"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Search
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))',
                pointerEvents: 'none',
              }}
            />
            <input
              id="filter-search"
              type="text"
              placeholder="Search title, message..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px 0 38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-base))',
                backgroundColor: 'hsl(var(--bg-surface))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Announcements Table */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
                  color: 'hsl(var(--text-secondary))',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '11px',
                }}
              >
                <th style={{ padding: 'var(--space-3) var(--space-4)', minWidth: '260px' }}>
                  Announcement
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Target Audience</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Category</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Priority</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Published / Expiry</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <RefreshCw
                        size={24}
                        className="animate-spin"
                        style={{ color: 'hsl(var(--color-brand-accent))' }}
                      />
                      <span
                        style={{
                          color: 'hsl(var(--text-muted))',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        Loading announcements...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <Megaphone
                        size={32}
                        style={{ color: 'hsl(var(--text-muted))', opacity: 0.6 }}
                      />
                      <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        No Announcements Found
                      </div>
                      <span
                        style={{
                          color: 'hsl(var(--text-muted))',
                          fontSize: 'var(--font-size-xs)',
                          maxWidth: '360px',
                        }}
                      >
                        {selectedCompanyId !== 'ALL' ||
                        typeFilter !== 'ALL' ||
                        priorityFilter !== 'ALL' ||
                        searchQuery
                          ? 'No announcements match your filter criteria. Try clearing filters.'
                          : 'Publish your first announcement to broadcast updates across your workforce.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                announcements.map((item) => {
                  const compName =
                    item.companyName ||
                    (item.companyId ? companyMap.get(item.companyId) : undefined);
                  const expired = isExpired(item.expiresAt);

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border-subtle))',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      {/* Announcement Title & Message Preview */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ maxWidth: '380px' }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: 'hsl(var(--text-primary))',
                              fontSize: '13px',
                              lineHeight: 1.3,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              color: 'hsl(var(--text-muted))',
                              fontSize: '11px',
                              marginTop: 'var(--space-1)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.message}
                          </div>
                        </div>
                      </td>

                      {/* Target Audience */}
                      <td
                        style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}
                      >
                        {item.companyId && compName ? (
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                          >
                            <Building2 size={13} style={{ color: 'hsl(var(--text-muted))' }} />
                            <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                              {compName}
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{
                              backgroundColor: 'hsl(var(--color-brand-accent) / 0.1)',
                              color: 'hsl(var(--color-brand-accent))',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                            }}
                          >
                            🌐 All Companies
                          </span>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td
                        style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}
                      >
                        {getTypeBadge(item.type)}
                      </td>

                      {/* Priority */}
                      <td
                        style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}
                      >
                        {getPriorityBadge(item.priority)}
                      </td>

                      {/* Published / Expiry Date */}
                      <td
                        style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>
                            {formatDate(item.publishedAt)}
                          </span>
                          {item.expiresAt && (
                            <span
                              style={{
                                color: expired
                                  ? 'hsl(var(--color-danger))'
                                  : 'hsl(var(--text-muted))',
                                fontSize: '10px',
                              }}
                            >
                              Exp: {formatDate(item.expiresAt)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td
                        style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}
                      >
                        {expired ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'hsl(var(--text-muted))',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            <Clock size={12} />
                            Expired
                          </span>
                        ) : item.isPublished ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'hsl(var(--color-success))',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'hsl(var(--text-muted))',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 'var(--space-1)',
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Read Full Announcement"
                            onClick={() => setViewingAnnouncement(item)}
                            style={{ padding: 'var(--space-1) var(--space-2)' }}
                          >
                            <Eye size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Announcement"
                            onClick={() => {
                              setEditingAnnouncement(item);
                              setIsFormModalOpen(true);
                            }}
                            style={{ padding: 'var(--space-1) var(--space-2)' }}
                          >
                            <Edit2 size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Announcement"
                            onClick={() => setDeletingAnnouncement(item)}
                            style={{
                              padding: 'var(--space-1) var(--space-2)',
                              color: 'hsl(var(--color-danger))',
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && total > limit && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderTop: '1px solid hsl(var(--border-subtle))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
            }}
          >
            <div>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
              announcements
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modals */}
      {isFormModalOpen && (
        <AnnouncementFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingAnnouncement(null);
          }}
          onSubmit={handleFormSubmit}
          announcement={editingAnnouncement}
          companies={companies}
          isSubmitting={isSubmittingForm}
        />
      )}

      {deletingAnnouncement && (
        <AnnouncementDeleteModal
          isOpen={Boolean(deletingAnnouncement)}
          onClose={() => setDeletingAnnouncement(null)}
          onConfirm={handleDeleteConfirm}
          announcement={deletingAnnouncement}
          isDeleting={isDeleting}
        />
      )}

      {/* Read Notice Modal */}
      {viewingAnnouncement && (
        <Modal
          isOpen={Boolean(viewingAnnouncement)}
          onClose={() => setViewingAnnouncement(null)}
          title={viewingAnnouncement.title}
          description={`Published on ${formatDate(viewingAnnouncement.publishedAt)}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'var(--space-2)',
                borderBottom: '1px solid hsl(var(--border-subtle))',
                paddingBottom: 'var(--space-3)',
              }}
            >
              {getTypeBadge(viewingAnnouncement.type)}
              {getPriorityBadge(viewingAnnouncement.priority)}
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Audience:{' '}
                {viewingAnnouncement.companyName ||
                  (viewingAnnouncement.companyId
                    ? companyMap.get(viewingAnnouncement.companyId)
                    : '🌐 All Companies (Broadcast)')}
              </span>
            </div>

            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-primary))',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                padding: 'var(--space-2) 0',
              }}
            >
              {viewingAnnouncement.message}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid hsl(var(--border-subtle))',
                paddingTop: 'var(--space-3)',
              }}
            >
              <Button variant="outline" onClick={() => setViewingAnnouncement(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

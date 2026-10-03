'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { AlertCircle, Clock, Megaphone, Check } from '@/components/atoms/icons';
import type {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  CreateAnnouncementInput,
} from '../types/announcements.types';
import type { CompanyOption } from '@/features/employees';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAnnouncementInput) => Promise<void>;
  announcement?: Announcement | null;
  companies: CompanyOption[];
  isSubmitting?: boolean;
}

const ANNOUNCEMENT_TYPES: Array<{ value: AnnouncementType; label: string }> = [
  { value: 'GENERAL', label: 'General Announcement' },
  { value: 'URGENT', label: 'Urgent Alert' },
  { value: 'HOLIDAY', label: 'Holiday & Offs' },
  { value: 'POLICY_UPDATE', label: 'Policy Update' },
  { value: 'POLICY', label: 'Company Policy' },
  { value: 'EVENT', label: 'Company Event' },
  { value: 'MAINTENANCE', label: 'System Maintenance' },
  { value: 'PAYROLL', label: 'Payroll & Compensation' },
  { value: 'EMERGENCY', label: 'Emergency Notice' },
];

const ANNOUNCEMENT_PRIORITIES: Array<{ value: AnnouncementPriority; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export function AnnouncementFormModal({
  isOpen,
  onClose,
  onSubmit,
  announcement,
  companies,
  isSubmitting = false,
}: AnnouncementFormModalProps) {
  const isEditing = Boolean(announcement);

  const [companyId, setCompanyId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('GENERAL');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [publishedAt, setPublishedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        setCompanyId(announcement.companyId || '');
        setTitle(announcement.title || '');
        setMessage(announcement.message || '');
        setType(announcement.type || 'GENERAL');
        setPriority(announcement.priority || 'NORMAL');
        setPublishedAt(announcement.publishedAt ? announcement.publishedAt.slice(0, 10) : '');
        setExpiresAt(announcement.expiresAt ? announcement.expiresAt.slice(0, 10) : '');
      } else {
        setCompanyId('');
        setTitle('');
        setMessage('');
        setType('GENERAL');
        setPriority('NORMAL');
        setPublishedAt(new Date().toISOString().slice(0, 10));
        setExpiresAt('');
      }
      setErrors({});
    }
  }, [isOpen, announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must be 255 characters or fewer';
    }

    if (!message.trim()) {
      newErrors.message = 'Message body is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit({
      companyId: companyId ? companyId : null,
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      isPublished: true,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString() : null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Announcement' : 'Create New Announcement'}
      description={
        isEditing
          ? 'Update announcement content, target audience, and priority'
          : 'Broadcast a notice across all companies or target a specific client workforce'
      }
      size="md"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {/* Target Company Selector */}
        <div>
          <label
            htmlFor="announcement-company"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
              marginBottom: '6px',
            }}
          >
            Target Audience / Company
          </label>
          <select
            id="announcement-company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            disabled={isSubmitting}
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
            <option value="">All Companies (Broadcast to Everyone)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.code ? `(${c.code})` : ''}
              </option>
            ))}
          </select>
          <p
            style={{
              fontSize: '11px',
              color: 'hsl(var(--text-muted))',
              marginTop: '4px',
              margin: 0,
            }}
          >
            Leave as &quot;All Companies&quot; to publish across the entire workspace.
          </p>
        </div>

        {/* Title Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label
              htmlFor="announcement-title"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Announcement Heading <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <span
              style={{
                fontSize: '11px',
                color: title.length > 240 ? 'hsl(var(--color-danger))' : 'hsl(var(--text-muted))',
              }}
            >
              {title.length}/255
            </span>
          </div>
          <Input
            id="announcement-title"
            placeholder="e.g., Mandatory Safety Protocol Update & Site Briefing"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            disabled={isSubmitting}
            maxLength={255}
          />
          {errors.title && (
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--color-danger))',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                margin: 0,
              }}
            >
              <AlertCircle size={12} />
              {errors.title}
            </p>
          )}
        </div>

        {/* Message Body Textarea */}
        <div>
          <label
            htmlFor="announcement-message"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
              marginBottom: '6px',
            }}
          >
            Message Body <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
          </label>
          <textarea
            id="announcement-message"
            rows={5}
            placeholder="Type your announcement content, instructions, links, or policy details here..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
            }}
            disabled={isSubmitting}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: errors.message
                ? '1px solid hsl(var(--color-danger))'
                : '1px solid hsl(var(--border-base))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              transition: 'border-color var(--transition-fast)',
            }}
          />
          {errors.message && (
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--color-danger))',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                margin: 0,
              }}
            >
              <AlertCircle size={12} />
              {errors.message}
            </p>
          )}
        </div>

        {/* Type & Priority Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* Type */}
          <div>
            <label
              htmlFor="announcement-type"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Category / Type
            </label>
            <select
              id="announcement-type"
              value={type}
              onChange={(e) => setType(e.target.value as AnnouncementType)}
              disabled={isSubmitting}
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
              {ANNOUNCEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="announcement-priority"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Priority Level
            </label>
            <select
              id="announcement-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              disabled={isSubmitting}
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
              {ANNOUNCEMENT_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Publish Date & Expiry Date Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* Publish Date */}
          <div>
            <label
              htmlFor="announcement-publish-date"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Publish Date
            </label>
            <Input
              id="announcement-publish-date"
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label
              htmlFor="announcement-expiry-date"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Expiry Date (Optional)
            </label>
            <Input
              id="announcement-expiry-date"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-3)',
            borderTop: '1px solid hsl(var(--border-subtle))',
            paddingTop: 'var(--space-4)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Clock size={16} className="animate-spin" />
              ) : isEditing ? (
                <Check size={16} />
              ) : (
                <Megaphone size={16} />
              )
            }
          >
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Publishing...'
              : isEditing
                ? 'Save Changes'
                : 'Publish Announcement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Trash2, Clock, AlertTriangle } from '@/components/atoms/icons';
import type { Announcement } from '../types/announcements.types';

interface AnnouncementDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  announcement: Announcement | null;
  isDeleting?: boolean;
}

export function AnnouncementDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  announcement,
  isDeleting = false,
}: AnnouncementDeleteModalProps) {
  if (!announcement) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Announcement"
      description="This action permanently deletes this notice from the workspace."
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--color-danger) / 0.08)',
            border: '1px solid hsl(var(--color-danger) / 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle
            size={20}
            style={{ color: 'hsl(var(--color-danger))', flexShrink: 0, marginTop: '2px' }}
          />
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'hsl(var(--color-danger))',
              }}
            >
              Are you sure you want to delete this announcement?
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-secondary))',
                margin: 'var(--space-1) 0 0 0',
                lineHeight: 1.4,
              }}
            >
              &ldquo;{announcement.title}&rdquo; will be immediately removed for all targeted
              workforce members.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            leftIcon={
              isDeleting ? <Clock size={16} className="animate-spin" /> : <Trash2 size={16} />
            }
          >
            {isDeleting ? 'Deleting...' : 'Delete Announcement'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

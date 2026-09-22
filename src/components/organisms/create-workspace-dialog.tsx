'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { useAuthStore } from '@/lib/client/auth-store';
import { apiClient } from '@/lib/client/api-client';

interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (workspace: WorkspaceResponse) => void;
}

export function CreateWorkspaceDialog({ isOpen, onClose, onSuccess }: CreateWorkspaceDialogProps) {
  const addWorkspace = useAuthStore((s) => s.addWorkspace);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugCustomized) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Workspace name must be at least 2 characters');
      return;
    }
    if (slug.trim().length < 2) {
      setError('Workspace slug must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient<WorkspaceResponse | { workspace: WorkspaceResponse }>(
        '/workspaces',
        {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
        },
      );

      const raw: unknown = res;
      const rawObj = raw as Record<string, unknown> | null;
      const wsData =
        rawObj && typeof rawObj === 'object' && 'workspace' in rawObj && rawObj.workspace
          ? (rawObj.workspace as Record<string, unknown>)
          : rawObj && typeof rawObj === 'object' && 'data' in rawObj && rawObj.data
            ? (rawObj.data as Record<string, unknown>)
            : rawObj;

      const wsId =
        (wsData?.id as string) ||
        (wsData?._id as string) ||
        (wsData?.workspaceId as string) ||
        `ws-${Date.now()}`;
      const wsName = (wsData?.name as string) || name.trim();
      const wsSlug = (wsData?.slug as string) || slug.trim();
      const wsRole = (wsData?.role as string) || 'ADMIN';

      const finalWorkspace: WorkspaceResponse = {
        id: wsId,
        name: wsName,
        slug: wsSlug,
        role: wsRole,
      };

      addWorkspace(finalWorkspace);
      useAuthStore.getState().setActiveWorkspace(wsId);

      setName('');
      setSlug('');
      setIsSlugCustomized(false);
      onClose();
      onSuccess?.(finalWorkspace);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Workspace"
      description="Workspaces isolate company entities, sites, staff rosters, and security data."
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {error && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-danger) / 0.1)',
              color: 'hsl(var(--color-danger))',
              fontSize: 'var(--font-size-xs)',
              border: '1px solid hsl(var(--color-danger) / 0.2)',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Workspace Name *
          </label>
          <Input
            placeholder="e.g. Apex Security Enterprise"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
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
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Workspace Slug (URL Identifier) *
          </label>
          <Input
            placeholder="e.g. apex-security-enterprise"
            value={slug}
            onChange={(e) => {
              setIsSlugCustomized(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
            }}
            required
            helperText="Lowercase letters, numbers, and hyphens only."
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-3)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

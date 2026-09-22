'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/client/auth-store';
import { Building2, ChevronDown, Check, Plus, Lock } from '@/components/atoms/icons';
import { CreateWorkspaceDialog } from './create-workspace-dialog';

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useAuthStore((s) => s.setActiveWorkspace);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ??
    workspaces[0] ?? {
      id: 'default',
      name: 'Default Workspace',
      slug: 'default',
      role: 'ADMIN',
    };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspace(id);
    setIsOpen(false);
    window.location.reload();
  };

  if (collapsed) {
    return (
      <>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title={`Active Workspace: ${activeWorkspace.name}`}
            style={{
              width: 'var(--space-9)',
              height: 'var(--space-9)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--bg-secondary))',
              border: '1px solid hsl(var(--border-subtle))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--color-brand-accent))',
              cursor: 'pointer',
              marginInline: 'auto',
            }}
          >
            <Building2 size={18} strokeWidth={1.75} />
          </button>

          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 'var(--space-12)',
                width: '240px',
                backgroundColor: 'hsl(var(--bg-surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid hsl(var(--border-subtle))',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                padding: 'var(--space-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  padding: 'var(--space-2) var(--space-2) var(--space-1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Workspaces
              </div>

              {workspaces.map((ws, idx) => {
                const wsId = ws.id || (ws as unknown as { _id?: string })._id || `ws-c-${idx}`;
                const isSelected = wsId === activeWorkspaceId;
                return (
                  <button
                    key={wsId}
                    type="button"
                    onClick={() => handleSelectWorkspace(wsId)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected
                        ? 'hsl(var(--color-brand-accent) / 0.08)'
                        : 'transparent',
                      color: isSelected
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: isSelected ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ws.name}
                    </span>
                    {isSelected && <Check size={14} strokeWidth={2} />}
                  </button>
                );
              })}

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'hsl(var(--border-subtle))',
                  marginBlock: 'var(--space-1)',
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateOpen(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--color-brand-accent))',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Plus size={14} strokeWidth={2} />
                <span>Create Workspace</span>
              </button>
            </div>
          )}
        </div>

        <CreateWorkspaceDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isOpen ? 'hsl(var(--bg-secondary))' : 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}
          >
            <div
              style={{
                width: 'var(--space-6)',
                height: 'var(--space-6)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'hsl(var(--color-brand-accent) / 0.12)',
                color: 'hsl(var(--color-brand-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={13} strokeWidth={1.75} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeWorkspace.name}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                }}
              >
                <Lock size={9} strokeWidth={1.5} />
                Workspace
              </div>
            </div>
          </div>
          <ChevronDown
            size={14}
            strokeWidth={1.75}
            style={{
              color: 'hsl(var(--text-muted))',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--transition-fast)',
              flexShrink: 0,
            }}
          />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: 'hsl(var(--bg-surface))',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid hsl(var(--border-subtle))',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              padding: 'var(--space-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'hsl(var(--text-muted))',
                padding: 'var(--space-1) var(--space-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Your Workspaces
            </div>

            {workspaces.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-2)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                No workspaces found
              </div>
            ) : (
              workspaces.map((ws, idx) => {
                const wsId = ws.id || (ws as unknown as { _id?: string })._id || `ws-e-${idx}`;
                const isSelected = wsId === activeWorkspaceId;
                return (
                  <button
                    key={wsId}
                    type="button"
                    onClick={() => handleSelectWorkspace(wsId)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected
                        ? 'hsl(var(--color-brand-accent) / 0.08)'
                        : 'transparent',
                      color: isSelected
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: isSelected ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ws.name}
                    </span>
                    {isSelected && <Check size={14} strokeWidth={2} />}
                  </button>
                );
              })
            )}

            <div
              style={{
                height: '1px',
                backgroundColor: 'hsl(var(--border-subtle))',
                marginBlock: 'var(--space-1)',
              }}
            />

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreateOpen(true);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'hsl(var(--color-brand-accent))',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Plus size={14} strokeWidth={2} />
              <span>Create Workspace</span>
            </button>
          </div>
        )}
      </div>

      <CreateWorkspaceDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}

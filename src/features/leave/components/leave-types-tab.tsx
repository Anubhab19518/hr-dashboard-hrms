'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Plus, Edit2, Trash2, Search, FileText, CheckCircle2 } from '@/components/atoms/icons';
import { LeaveGender, type LeaveType } from '../types/leave.types';
import { CreateEditLeaveTypeModal } from './create-edit-leave-type-modal';
import { LeaveService } from '../services/leave.service';

interface LeaveTypesTabProps {
  leaveTypes: LeaveType[];
  isLoading: boolean;
  onRefresh: () => void;
  canManage?: boolean;
}

export function LeaveTypesTab({
  leaveTypes,
  isLoading,
  onRefresh,
  canManage = true,
}: LeaveTypesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeForEdit, setSelectedTypeForEdit] = useState<LeaveType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return leaveTypes;
    const q = searchQuery.toLowerCase();
    return leaveTypes.filter(
      (lt) =>
        lt.name.toLowerCase().includes(q) ||
        lt.code.toLowerCase().includes(q) ||
        (lt.description && lt.description.toLowerCase().includes(q)),
    );
  }, [leaveTypes, searchQuery]);

  const handleDelete = async (lt: LeaveType) => {
    if (!confirm(`Are you sure you want to deactivate "${lt.name}" (${lt.code})?`)) return;
    setDeletingId(lt.id);
    try {
      await LeaveService.deleteLeaveType(lt.id);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate leave type';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReactivate = async (lt: LeaveType) => {
    setReactivatingId(lt.id);
    try {
      await LeaveService.updateLeaveType(lt.id, { isActive: true });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reactivate leave type';
      alert(msg);
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--bg-surface))',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid hsl(var(--border-subtle))',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* 1. Top Header & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: 0,
            }}
          >
            Leave Types & Configurations
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              margin: '2px 0 0 0',
            }}
          >
            Configure paid/unpaid status, carry-forward rules, document requirements, and gender
            rules
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedTypeForEdit(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={14} style={{ marginRight: '6px' }} />
            Create Leave Type
          </Button>
        )}
      </div>

      {/* 2. Search Toolbar */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--text-muted))',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search categories by name, code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            height: '34px',
            paddingLeft: '32px',
            paddingRight: 'var(--space-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-secondary))',
            fontSize: 'var(--font-size-xs)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 3. Types Table */}
      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Loading leave categories...
        </div>
      ) : filteredTypes.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <FileText size={28} style={{ color: 'hsl(var(--text-muted))' }} />
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            No leave categories configured yet.
          </div>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedTypeForEdit(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={13} style={{ marginRight: '4px' }} />
              Create Category
            </Button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                  textAlign: 'left',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Category Name
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Code</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Pay Status
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Carry Forward
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Rules & Compliance
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Gender
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Status
                </th>
                {canManage && (
                  <th
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((lt) => (
                <tr
                  key={lt.id}
                  style={{
                    borderBottom: '1px solid hsl(var(--border-subtle))',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                      {lt.name}
                    </div>
                    {lt.description && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'hsl(var(--text-muted))',
                          marginTop: '2px',
                        }}
                      >
                        {lt.description}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: 'hsl(var(--primary-color))',
                      }}
                    >
                      {lt.code}
                    </span>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge variant={lt.isPaid ? 'success' : 'warning'}>
                      {lt.isPaid ? 'Paid Leave' : 'Unpaid (LOP)'}
                    </Badge>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {lt.isCarryForward ? (
                      <span style={{ color: 'hsl(var(--color-success))', fontWeight: 600 }}>
                        Yes{' '}
                        {lt.maxCarryForwardDays
                          ? `(Max ${lt.maxCarryForwardDays}d)`
                          : '(Unlimited)'}
                      </span>
                    ) : (
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Lapses Yearly</span>
                    )}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {lt.requiresDocument && <Badge variant="secondary">Requires Proof</Badge>}
                      {lt.isEncashable && <Badge variant="primary">Encashable</Badge>}
                      {lt.minDaysNotice > 0 && (
                        <Badge variant="outline">{lt.minDaysNotice}d Notice</Badge>
                      )}
                      {lt.maxConsecutiveDays && (
                        <Badge variant="outline">Max {lt.maxConsecutiveDays}d in a row</Badge>
                      )}
                    </div>
                  </td>

                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    {lt.applicableGender === LeaveGender.ALL ? 'All' : lt.applicableGender}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge variant={lt.isActive !== false ? 'success' : 'secondary'}>
                      {lt.isActive !== false ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>

                  {canManage && (
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTypeForEdit(lt);
                            setIsModalOpen(true);
                          }}
                          title="Edit leave type"
                        >
                          <Edit2 size={13} />
                        </Button>
                        {lt.isActive !== false ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deletingId === lt.id}
                            onClick={() => void handleDelete(lt)}
                            title="Deactivate leave type"
                          >
                            <Trash2 size={13} />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reactivatingId === lt.id}
                            onClick={() => void handleReactivate(lt)}
                            title="Reactivate leave type"
                            style={{
                              borderColor: 'hsl(var(--color-success) / 0.5)',
                              color: 'hsl(var(--color-success))',
                            }}
                          >
                            <CheckCircle2 size={13} style={{ marginRight: '4px' }} />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <CreateEditLeaveTypeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTypeForEdit(null);
          }}
          leaveTypeToEdit={selectedTypeForEdit}
          onSaved={() => onRefresh()}
        />
      )}
    </div>
  );
}

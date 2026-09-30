'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Search, Wallet, SlidersHorizontal } from '@/components/atoms/icons';
import type { LeaveBalance, LeaveType } from '../types/leave.types';
import { AdjustBalanceModal } from './adjust-balance-modal';

interface LeaveBalancesTabProps {
  balances: LeaveBalance[];
  leaveTypes: LeaveType[];
  employees: Array<{
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
  }>;
  isLoading: boolean;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onRefresh: () => void;
  canManage?: boolean;
}

export function LeaveBalancesTab({
  balances,
  leaveTypes,
  employees,
  isLoading,
  selectedYear,
  onYearChange,
  onRefresh,
  canManage = true,
}: LeaveBalancesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedBalanceForAdjust, setSelectedBalanceForAdjust] = useState<LeaveBalance | null>(
    null,
  );

  const filteredBalances = useMemo(() => {
    return balances.filter((b) => {
      if (leaveTypeFilter !== 'ALL' && b.leaveTypeId !== leaveTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmp =
          (b.employeeName && b.employeeName.toLowerCase().includes(q)) ||
          (b.employeeCode && b.employeeCode.toLowerCase().includes(q));
        const matchType =
          (b.leaveTypeName && b.leaveTypeName.toLowerCase().includes(q)) ||
          (b.leaveTypeCode && b.leaveTypeCode.toLowerCase().includes(q));
        return matchEmp || matchType;
      }
      return true;
    });
  }, [balances, leaveTypeFilter, searchQuery]);

  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

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
      {/* 1. Top Header & Adjust Action */}
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
            Employee Leave Balances & Adjustments ({selectedYear})
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              margin: '2px 0 0 0',
            }}
          >
            Inspect opening balances, accrued quotas, used leaves, LOP deductions, and execute
            manual HR adjustments
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedBalanceForAdjust(null);
                setIsAdjustModalOpen(true);
              }}
            >
              <SlidersHorizontal size={13} style={{ marginRight: '6px' }} />
              Manual Adjustment
            </Button>
          )}
        </div>
      </div>

      {/* 2. Controls Toolbar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border-subtle))',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
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
            placeholder="Search employee or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '34px',
              paddingLeft: '32px',
              paddingRight: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              fontSize: 'var(--font-size-xs)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Leave Type Selector */}
        <select
          value={leaveTypeFilter}
          onChange={(e) => setLeaveTypeFilter(e.target.value)}
          style={{
            height: '34px',
            padding: '0 var(--space-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Categories ({leaveTypes.length})</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code})
            </option>
          ))}
        </select>

        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          style={{
            height: '34px',
            padding: '0 var(--space-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Balances Table */}
      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Loading employee leave balances...
        </div>
      ) : filteredBalances.length === 0 ? (
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
          <Wallet size={28} style={{ color: 'hsl(var(--text-muted))' }} />
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            No leave balances found for year {selectedYear}.
          </div>
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
                  Employee
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Leave Category
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Opening
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Accrued
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Used
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Adjusted
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  LOP
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Closing Balance
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
              {filteredBalances.map((b) => {
                const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
                return (
                  <tr
                    key={b.id || `${b.employeeId}-${b.leaveTypeId}`}
                    style={{
                      borderBottom: '1px solid hsl(var(--border-subtle))',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        {b.employeeName || 'Employee'}
                      </div>
                      {b.employeeCode && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'hsl(var(--text-muted))',
                            marginTop: '2px',
                          }}
                        >
                          Code: {b.employeeCode}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {b.leaveTypeName || lt?.name || 'Leave'}
                      </span>{' '}
                      <Badge variant="primary">{b.leaveTypeCode || lt?.code || 'CL'}</Badge>
                    </td>

                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'center',
                        color: 'hsl(var(--text-secondary))',
                      }}
                    >
                      {b.openingBalance}
                    </td>

                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'center',
                        color: 'hsl(var(--color-success))',
                        fontWeight: 600,
                      }}
                    >
                      +{b.accrued}
                    </td>

                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'center',
                        color: 'hsl(var(--color-danger))',
                        fontWeight: 600,
                      }}
                    >
                      -{b.used}
                    </td>

                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'center',
                        color: 'hsl(var(--text-secondary))',
                      }}
                    >
                      {b.adjusted > 0 ? `+${b.adjusted}` : b.adjusted}
                    </td>

                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'center',
                        color: 'hsl(var(--color-warning))',
                        fontWeight: 600,
                      }}
                    >
                      {b.lopDays}
                    </td>

                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: 'var(--font-size-sm)',
                        color: 'hsl(var(--primary-color))',
                      }}
                    >
                      {b.closingBalance} Days
                    </td>

                    {canManage && (
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBalanceForAdjust(b);
                            setIsAdjustModalOpen(true);
                          }}
                          title="Manual Balance Adjustment"
                        >
                          <SlidersHorizontal size={13} style={{ marginRight: '4px' }} />
                          Adjust
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Balance Adjustment Modal */}
      {isAdjustModalOpen && (
        <AdjustBalanceModal
          isOpen={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setSelectedBalanceForAdjust(null);
          }}
          leaveTypes={leaveTypes}
          employees={employees}
          preselectedEmployeeId={selectedBalanceForAdjust?.employeeId}
          preselectedLeaveTypeId={selectedBalanceForAdjust?.leaveTypeId}
          onAdjusted={() => {
            onRefresh();
            alert('Balance adjustment applied successfully!');
          }}
        />
      )}
    </div>
  );
}

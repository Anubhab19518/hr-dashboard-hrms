'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/atoms/badge';
import { Card, CardContent } from '@/components/atoms/card';
import { AlertCircle } from '@/components/atoms/icons';
import type { PayrollLopSummary } from '../types/leave.types';
import { LeaveService } from '../services/leave.service';

interface PayrollLopTabProps {
  employees: Array<{
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
  }>;
}

export function PayrollLopTab({ employees }: PayrollLopTabProps) {
  const currentDate = new Date();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [summary, setSummary] = useState<PayrollLopSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrollLop = useCallback(async () => {
    if (!selectedEmployeeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await LeaveService.getPayrollLop(selectedEmployeeId, month, year);
      setSummary(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch payroll LOP details';
      setError(msg);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmployeeId, month, year]);

  useEffect(() => {
    if (selectedEmployeeId) {
      void fetchPayrollLop();
    }
  }, [selectedEmployeeId, month, year, fetchPayrollLop]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

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
        gap: 'var(--space-5)',
      }}
    >
      {/* 1. Top Header */}
      <div>
        <h2
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 700,
            color: 'hsl(var(--text-primary))',
            margin: 0,
          }}
        >
          Payroll Loss of Pay (LOP) & Paid Leaves Analyzer
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'hsl(var(--text-secondary))',
            margin: '2px 0 0 0',
          }}
        >
          Inspect monthly leave breakdowns and loss-of-pay deductions for accurate salary
          calculation
        </p>
      </div>

      {/* 2. Employee & Period Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border-subtle))',
          alignItems: 'center',
        }}
      >
        {/* Employee Picker */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'hsl(var(--text-muted))',
              marginBottom: '4px',
            }}
          >
            Select Employee
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
            }}
          >
            {employees.map((emp) => {
              const name =
                emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
              const code = emp.employeeCode ? ` (${emp.employeeCode})` : '';
              return (
                <option key={emp.id} value={emp.id}>
                  {name}
                  {code}
                </option>
              );
            })}
          </select>
        </div>

        {/* Month Picker */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'hsl(var(--text-muted))',
              marginBottom: '4px',
            }}
          >
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
            }}
          >
            {monthNames.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name} ({idx + 1})
              </option>
            ))}
          </select>
        </div>

        {/* Year Picker */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'hsl(var(--text-muted))',
              marginBottom: '4px',
            }}
          >
            Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
            }}
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Output Card & Breakdown */}
      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Computing payroll LOP breakdown...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : summary ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Summary Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            <Card variant="subtle">
              <CardContent style={{ padding: 'var(--space-4)' }}>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))',
                    fontWeight: 600,
                  }}
                >
                  Total LOP (Unpaid) Days
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 800,
                    color: 'hsl(var(--color-danger))',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  {summary.totalLopDays} {summary.totalLopDays === 1 ? 'Day' : 'Days'}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-secondary))',
                    marginTop: '2px',
                  }}
                >
                  Salary deduction applies
                </div>
              </CardContent>
            </Card>

            <Card variant="subtle">
              <CardContent style={{ padding: 'var(--space-4)' }}>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))',
                    fontWeight: 600,
                  }}
                >
                  Total Approved Paid Leaves
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 800,
                    color: 'hsl(var(--color-success))',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  {summary.totalPaidLeaveDays} {summary.totalPaidLeaveDays === 1 ? 'Day' : 'Days'}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-secondary))',
                    marginTop: '2px',
                  }}
                >
                  Full pay without salary deduction
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave Types Breakdown Table */}
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid hsl(var(--border-subtle))',
              overflow: 'hidden',
            }}
          >
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
                    textAlign: 'left',
                    borderBottom: '1px solid hsl(var(--border-subtle))',
                  }}
                >
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                    Leave Category
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                    Code
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                    Pay Status
                  </th>
                  <th
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      fontWeight: 700,
                      textAlign: 'right',
                    }}
                  >
                    Approved Days Taken
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.leaveBreakdown && summary.leaveBreakdown.length > 0 ? (
                  summary.leaveBreakdown.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          fontWeight: 600,
                          color: 'hsl(var(--text-primary))',
                        }}
                      >
                        {item.leaveTypeName}
                      </td>
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.leaveTypeCode}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Badge variant={item.isPaid ? 'success' : 'warning'}>
                          {item.isPaid ? 'Paid' : 'Unpaid (LOP)'}
                        </Badge>
                      </td>
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: item.isPaid
                            ? 'hsl(var(--color-success))'
                            : 'hsl(var(--color-danger))',
                        }}
                      >
                        {item.approvedDays} {item.approvedDays === 1 ? 'Day' : 'Days'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: 'var(--space-4)',
                        textAlign: 'center',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      No leaves recorded in {monthNames[month - 1]} {year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Select an employee to view the payroll leave breakdown.
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MoreVertical, Eye, Edit2 } from '@/components/atoms/icons';
import { EmptyState } from '@/components/molecules/empty-state';
import type { Employee } from '../types/employee.types';

export interface EmployeeTableProps {
  employees: readonly Employee[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh?: () => void;
}

export function EmployeeTable({
  employees,
  isLoading,
  currentPage,
  totalPages,
  totalCount,
  pageSize = 10,
  selectedIds,
  onSelectAll,
  onToggleSelect,
  onPageChange,
  onPageSizeChange,
}: EmployeeTableProps) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openActionId) return;

    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionId]);

  const isAllSelected = employees.length > 0 && employees.every((e) => selectedIds.has(e.id));
  const isSomeSelected = employees.some((e) => selectedIds.has(e.id)) && !isAllSelected;

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || 'ACTIVE';
    if (s === 'ACTIVE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#16a34a',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              display: 'inline-block',
            }}
          />
          Active
        </span>
      );
    }
    if (s === 'PROBATION') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#d97706',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#d97706',
              display: 'inline-block',
            }}
          />
          Probation
        </span>
      );
    }
    if (s === 'SUSPENDED' || s === 'TERMINATED' || s === 'INACTIVE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#dc2626',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              display: 'inline-block',
            }}
          />
          {s === 'SUSPENDED' ? 'Suspended' : s === 'TERMINATED' ? 'Terminated' : 'Inactive'}
        </span>
      );
    }
    if (s === 'RESIGNED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748b',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#64748b',
              display: 'inline-block',
            }}
          />
          Resigned
        </span>
      );
    }
    // Fallback for any legacy / unrecognised values
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#64748b',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#64748b',
            display: 'inline-block',
          }}
        />
        {status}
      </span>
    );
  };

  const getEmploymentTypePill = (type?: string) => {
    const t = type?.toUpperCase() || 'FULL_TIME';
    if (t === 'FULL_TIME' || t === 'SALARIED' || t === 'PERMANENT') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          Full Time
        </span>
      );
    }
    if (t === 'PART_TIME' || t === 'HOURLY') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: '#f0f9ff',
            color: '#0284c7',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          Part Time
        </span>
      );
    }
    if (t === 'CONTRACTOR' || t === 'CONTRACT' || t === 'CONTRACTUAL') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: '#faf5ff',
            color: '#a855f7',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          Contractor
        </span>
      );
    }
    if (t === 'CASUAL' || t === 'DAILY_WAGE' || t === 'TEMPORARY' || t === 'TEMP') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          Casual
        </span>
      );
    }
    if (t === 'INTERN' || t === 'TRAINEE') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          Intern
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '6px',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        {type || 'Full Time'}
      </span>
    );
  };

  const getAvatarInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'EM';
  };

  // Pagination calculation
  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalCount);
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  if (employees.length === 0 && !isLoading) {
    return (
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-12)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <EmptyState
          title="No employees found"
          description="No employee records match the selected filter criteria."
        />
      </div>
    );
  }

  // Generate page numbers to display
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxDisplayed = 5;
    const total = Math.max(totalPages, 1);

    if (total <= maxDisplayed) {
      for (let i = 1; i <= total; i++) {
        buttons.push(i);
      }
    } else {
      if (currentPage <= 3) {
        buttons.push(1, 2, 3, 4, '...', total);
      } else if (currentPage >= total - 2) {
        buttons.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        buttons.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total);
      }
    }

    return buttons.map((btn, index) => {
      if (btn === '...') {
        return (
          <span
            key={`dots-${index}`}
            style={{
              padding: '0 6px',
              color: 'hsl(var(--text-muted))',
              fontSize: '13px',
              userSelect: 'none',
            }}
          >
            ...
          </span>
        );
      }

      const pageNum = Number(btn);
      const isActive = pageNum === currentPage;

      return (
        <button
          key={pageNum}
          type="button"
          onClick={() => onPageChange(pageNum)}
          style={{
            minWidth: '32px',
            height: '32px',
            padding: '0 8px',
            borderRadius: '6px',
            border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
            backgroundColor: isActive ? '#eff6ff' : 'transparent',
            color: isActive ? '#2563eb' : 'hsl(var(--text-secondary))',
            fontSize: '13px',
            fontWeight: isActive ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {pageNum}
        </button>
      );
    });
  };

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--bg-surface))',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid hsl(var(--border-subtle))',
        boxShadow: 'var(--shadow-sm)',
        width: '100%',
        overflow: 'visible',
      }}
    >
      <div style={{ width: '100%', overflow: 'visible' }}>
        <table
          style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13px',
            overflow: 'visible',
          }}
        >
          <colgroup>
            <col style={{ width: '40px' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '48px' }} />
          </colgroup>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-surface))',
              }}
            >
              {/* Checkbox */}
              <th
                style={{
                  padding: '12px 4px 12px 12px',
                  textAlign: 'center',
                }}
              >
                <input
                  type="checkbox"
                  aria-label="Select all employees"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    accentColor: '#2563eb',
                  }}
                />
              </th>

              {/* Employee */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Employee
              </th>

              {/* Employee ID */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Employee ID
              </th>

              {/* Designation */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Designation
              </th>

              {/* Department */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Department
              </th>

              {/* Reporting Manager */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Reporting Manager
              </th>

              {/* Company */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Company
              </th>

              {/* Employment Type */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Employment Type
              </th>

              {/* Status */}
              <th
                style={{
                  padding: '12px 8px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Status
              </th>

              {/* Actions */}
              <th
                style={{
                  padding: '12px 10px 12px 6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: 'hsl(var(--text-secondary))',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => {
              const isSelected = selectedIds.has(emp.id);
              const fullName = `${emp.firstName} ${emp.lastName}`.trim();
              const designation = emp.designation || emp.currentAssignment?.jobRoleName || '—';
              const department = emp.departmentName || emp.currentAssignment?.departmentName || '—';
              const company =
                emp.companyName ||
                emp.currentAssignment?.companyName ||
                (emp.currentAssignment?.assignmentType === 'INTERNAL' ? 'Internal HQ' : '—');
              const managerName =
                emp.reportingManagerName ||
                emp.currentAssignment?.supervisorName ||
                emp.currentAssignment?.reportingToEmployeeName;
              const managerRole = emp.reportingManagerRole;

              const isActionOpen = openActionId === emp.id;

              return (
                <tr
                  key={emp.id}
                  style={{
                    borderBottom: '1px solid hsl(var(--border-subtle) / 0.6)',
                    backgroundColor: isSelected
                      ? 'hsl(var(--color-brand-accent) / 0.04)'
                      : 'transparent',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--bg-secondary) / 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Checkbox */}
                  <td
                    style={{
                      padding: '10px 4px 10px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${fullName}`}
                      checked={isSelected}
                      onChange={() => onToggleSelect(emp.id)}
                      style={{
                        width: '15px',
                        height: '15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        accentColor: '#2563eb',
                      }}
                    />
                  </td>

                  {/* Employee: Avatar + Name + Email */}
                  <td style={{ padding: '10px 8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={fullName}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid hsl(var(--border-subtle))',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'hsl(var(--color-brand-accent) / 0.15)',
                            color: 'hsl(var(--color-brand-accent))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {getAvatarInitials(emp.firstName, emp.lastName)}
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <Link
                          href={`/dashboard/employees/${emp.id}`}
                          title={fullName}
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'hsl(var(--text-primary))',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {fullName}
                        </Link>
                        <span
                          title={emp.email}
                          style={{
                            fontSize: '11px',
                            color: 'hsl(var(--text-muted))',
                            marginTop: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {emp.email || '—'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Employee ID */}
                  <td
                    style={{
                      padding: '10px 8px',
                      fontSize: '12px',
                      color: 'hsl(var(--text-secondary))',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {emp.employeeCode}
                  </td>

                  {/* Designation */}
                  <td
                    title={designation}
                    style={{
                      padding: '10px 8px',
                      fontSize: '12px',
                      color: 'hsl(var(--text-primary))',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {designation}
                  </td>

                  {/* Department */}
                  <td
                    title={department}
                    style={{
                      padding: '10px 8px',
                      fontSize: '12px',
                      color: 'hsl(var(--text-secondary))',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {department}
                  </td>

                  {/* Reporting Manager: Avatar + Name + Title */}
                  <td style={{ padding: '10px 8px', overflow: 'hidden' }}>
                    {managerName ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        {emp.reportingManagerAvatar ? (
                          <img
                            src={emp.reportingManagerAvatar}
                            alt={managerName}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: '#e2e8f0',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {managerName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            title={managerName}
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'hsl(var(--text-primary))',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {managerName}
                          </span>
                          {managerRole && (
                            <span
                              title={managerRole}
                              style={{
                                fontSize: '10px',
                                color: 'hsl(var(--text-muted))',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {managerRole}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'hsl(var(--text-muted))', fontSize: '12px' }}>—</span>
                    )}
                  </td>

                  {/* Company */}
                  <td
                    title={company}
                    style={{
                      padding: '10px 8px',
                      fontSize: '12px',
                      color: 'hsl(var(--text-secondary))',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {company}
                  </td>

                  {/* Employment Type Pill Badge */}
                  <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {getEmploymentTypePill(emp.employmentType)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {getStatusBadge(emp.status)}
                  </td>

                  {/* Actions vertical dots */}
                  <td
                    style={{
                      padding: '10px 10px 10px 6px',
                      textAlign: 'center',
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Employee Actions"
                      onClick={() => setOpenActionId(isActionOpen ? null : emp.id)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid transparent',
                        backgroundColor: isActionOpen ? 'hsl(var(--bg-secondary))' : 'transparent',
                        color: 'hsl(var(--text-muted))',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Action Dropdown Menu */}
                    {isActionOpen && (
                      <div
                        ref={actionMenuRef}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '38px',
                          zIndex: 1000,
                          width: '150px',
                          backgroundColor: 'hsl(var(--bg-surface))',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid hsl(var(--border-subtle))',
                          boxShadow:
                            '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          padding: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <Link
                          href={`/dashboard/employees/${emp.id}`}
                          onClick={() => setOpenActionId(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'hsl(var(--text-primary))',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            transition: 'background-color 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--bg-secondary))';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Eye size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                          View Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionId(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'hsl(var(--text-primary))',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'background-color 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--bg-secondary))';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Edit2 size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                          Edit Details
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINATION BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          padding: '14px 20px',
          borderTop: '1px solid hsl(var(--border-subtle))',
          backgroundColor: 'hsl(var(--bg-surface))',
          fontSize: '12px',
          color: 'hsl(var(--text-muted))',
        }}
      >
        {/* Left: Showing range */}
        <div>
          Showing <strong style={{ color: 'hsl(var(--text-primary))' }}>{startRecord}</strong> to{' '}
          <strong style={{ color: 'hsl(var(--text-primary))' }}>{endRecord}</strong> of{' '}
          <strong style={{ color: 'hsl(var(--text-primary))' }}>{totalCount}</strong> employees
        </div>

        {/* Center: Numbered Page Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {renderPaginationButtons()}
        </div>

        {/* Right: Page Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={pageSize}
            aria-label="Employees per page"
            onChange={(e) => {
              if (onPageSizeChange) {
                onPageSizeChange(Number(e.target.value));
              }
            }}
            style={{
              height: '32px',
              padding: '0 8px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary))',
              color: 'hsl(var(--text-primary))',
              fontSize: '12px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

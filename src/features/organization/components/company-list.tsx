'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/client/auth-store';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  Plus,
  Search,
  ChevronDown,
  SlidersHorizontal,
  List,
  LayoutGrid,
  Edit2,
  MoreVertical,
  ChevronRight,
  Building2,
  Check,
  Layers,
} from '@/components/atoms/icons';
import { OrganizationService } from '../services/organization.service';
import { EmployeeService } from '@/features/employees/services/employee.service';
import type { Company } from '../types/organization.types';
import { CompanyFormDialog } from './company-form-dialog';

export interface DisplayCompany {
  id: string;
  name: string;
  code: string;
  domain: string;
  industry: string;
  employeesCount: number;
  gstin: string;
  pan: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdOn: string;
  avatarType: 'letter' | 'icon' | 'mountain';
  avatarText?: string;
  avatarBg: string;
  avatarColor: string;
  type?: 'INTERNAL' | 'CLIENT';
  rawCompany?: Company;
}

export function CompanyList() {
  const [companies, setCompanies] = useState<DisplayCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [industryFilter, setIndustryFilter] = useState<string>('ALL');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INTERNAL' | 'CLIENT'>('ALL');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState(false);

  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);

  // Fetch real backend data and calculate active employee assignments per company
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const [companiesData, employeesResponse] = await Promise.all([
        OrganizationService.getCompanies(),
        EmployeeService.getEmployees({ limit: 1000 }).catch(() => ({ records: [] })),
      ]);

      const employees = employeesResponse?.records || [];
      const internalCompany = Array.isArray(companiesData)
        ? companiesData.find((c) => c.type === 'INTERNAL')
        : null;

      // Count active assignments per company
      const companyAssignmentsCount = new Map<string, number>();

      if (employees.length > 0) {
        const assignmentResults = await Promise.allSettled(
          employees.map(async (emp) => {
            try {
              const assignments = await EmployeeService.getEmployeeAssignments(emp.id);
              const active = Array.isArray(assignments)
                ? assignments.find(
                    (a) =>
                      a.isActive !== false &&
                      (!a.effectiveTo || new Date(a.effectiveTo) >= new Date()),
                  ) || assignments[0]
                : null;
              return { emp, active };
            } catch {
              return { emp, active: null };
            }
          }),
        );

        assignmentResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { emp, active } = result.value;
            let targetCompanyId: string | undefined = undefined;

            if (active) {
              const rawActive = active as unknown as Record<string, unknown>;
              if (
                active.assignmentType === 'INTERNAL' ||
                rawActive.companyType === 'INTERNAL' ||
                rawActive.company_type === 'INTERNAL'
              ) {
                targetCompanyId = internalCompany?.id || active.companyId;
              } else if (active.companyId) {
                targetCompanyId = active.companyId;
              } else if (active.companyName && Array.isArray(companiesData)) {
                const matched = companiesData.find(
                  (c) => c.name.toLowerCase() === active.companyName?.toLowerCase(),
                );
                targetCompanyId = matched?.id;
              }
            }

            // Fallback to emp.companyId if present
            if (!targetCompanyId && emp.companyId) {
              targetCompanyId = emp.companyId;
            }

            if (targetCompanyId) {
              companyAssignmentsCount.set(
                targetCompanyId,
                (companyAssignmentsCount.get(targetCompanyId) || 0) + 1,
              );
            }
          }
        });
      }

      if (Array.isArray(companiesData)) {
        const mappedBackendCompanies: DisplayCompany[] = companiesData.map((c, idx) => {
          const initials = c.name
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          const colors = [
            { bg: 'hsl(var(--color-brand-accent) / 0.12)', fg: 'hsl(var(--color-brand-accent))' },
            { bg: 'hsl(217 91% 95%)', fg: 'hsl(217 91% 50%)' },
            { bg: 'hsl(30 100% 95%)', fg: 'hsl(30 90% 45%)' },
            { bg: 'hsl(142 70% 95%)', fg: 'hsl(142 71% 36%)' },
            { bg: 'hsl(280 80% 95%)', fg: 'hsl(280 70% 50%)' },
          ];
          const colorPair = colors[idx % colors.length]!;

          const rawC = c as unknown as Record<string, unknown>;
          const backendAssignedCount = Number(
            rawC.employeesCount ??
              rawC.employees_count ??
              rawC.employeeCount ??
              rawC.employee_count ??
              rawC.activeAssignmentsCount ??
              rawC.active_assignments_count ??
              rawC.totalEmployees ??
              rawC.total_employees ??
              -1,
          );

          const computedCount = companyAssignmentsCount.get(c.id) || 0;
          const finalCount =
            backendAssignedCount >= 0
              ? Math.max(backendAssignedCount, computedCount)
              : computedCount;

          return {
            id: c.id,
            name: c.name,
            code: c.code,
            domain:
              c.contactEmail?.split('@')[1] ||
              `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            industry:
              c.description || (c.type === 'INTERNAL' ? 'Internal HQ' : 'Client Operations'),
            employeesCount: finalCount,
            gstin: c.gstin || '—',
            pan: c.pan || '—',
            status: c.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            createdOn: c.createdAt
              ? new Date(c.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—',
            avatarType: 'letter',
            avatarText: initials || 'C',
            avatarBg: colorPair.bg,
            avatarColor: colorPair.fg,
            type: c.type || 'CLIENT',
            rawCompany: c,
          };
        });

        setCompanies(mappedBackendCompanies);
      } else {
        setCompanies([]);
      }
    } catch {
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies, activeWorkspaceId]);

  const handleCompanyCreated = () => {
    void fetchCompanies();
    setIsModalOpen(false);
  };

  // Extract distinct industries
  const availableIndustries = useMemo(() => {
    const set = new Set(companies.map((c) => c.industry));
    return ['ALL', ...Array.from(set)];
  }, [companies]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q) ||
          c.gstin.toLowerCase().includes(q) ||
          c.pan.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }

      // Industry
      if (industryFilter !== 'ALL' && c.industry !== industryFilter) {
        return false;
      }

      // Type
      if (typeFilter !== 'ALL' && c.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [companies, searchQuery, statusFilter, industryFilter, typeFilter]);

  // Pagination calculation
  const totalItems = filteredCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Toggle selection
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCompanies.map((c) => c.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const renderAvatar = (company: DisplayCompany) => {
    if (company.avatarType === 'icon') {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: company.avatarBg,
            color: company.avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Building2 size={16} strokeWidth={2.2} />
        </div>
      );
    }

    if (company.avatarType === 'mountain') {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: company.avatarBg,
            color: company.avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Layers size={16} strokeWidth={2.2} />
        </div>
      );
    }

    return (
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: company.avatarBg,
          color: company.avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '12px',
          flexShrink: 0,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {company.avatarText || company.name[0]}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* 1. Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          width: '100%',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 800,
              color: 'hsl(var(--text-primary))',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Company Profiles
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              marginTop: '2px',
              margin: 0,
            }}
          >
            Manage and oversee all company profiles in the system.
          </p>
        </div>

        {/* Top Right Create Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            backgroundColor: 'hsl(var(--color-brand-accent))',
            color: 'hsl(var(--text-inverse))',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all var(--transition-fast)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>+ Create New Company</span>
        </button>
      </div>

      {/* 2. Filter & Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          width: '100%',
        }}
      >
        {/* Left Filter Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            flex: 1,
          }}
        >
          {/* Search Input Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              backgroundColor: 'hsl(var(--bg-surface))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              width: '220px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Search size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-primary))',
                width: '100%',
              }}
            />
          </div>

          {/* Simple Entity Type Filter */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'hsl(var(--bg-secondary))',
              padding: '2px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
            }}
          >
            {(['ALL', 'INTERNAL', 'CLIENT'] as const).map((t) => {
              const isSelected = typeFilter === t;
              const label = t === 'ALL' ? 'All' : t === 'INTERNAL' ? 'Internal' : 'Clients';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTypeFilter(t);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'hsl(var(--bg-surface))' : 'transparent',
                    color: isSelected
                      ? 'hsl(var(--color-brand-accent))'
                      : 'hsl(var(--text-secondary))',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                setIsIndustryDropdownOpen(false);
                setIsMoreFiltersOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span>
                {statusFilter === 'ALL'
                  ? 'All Status'
                  : statusFilter === 'ACTIVE'
                    ? 'Active'
                    : 'Inactive'}
              </span>
              <ChevronDown size={13} style={{ color: 'hsl(var(--text-muted))' }} />
            </button>

            {isStatusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + var(--space-1))',
                  left: 0,
                  width: '150px',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  border: '1px solid hsl(var(--border-subtle))',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 'var(--space-1)',
                  zIndex: 40,
                }}
              >
                {[
                  { key: 'ALL', label: 'All Status' },
                  { key: 'ACTIVE', label: 'Active' },
                  { key: 'INACTIVE', label: 'Inactive' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(item.key as 'ALL' | 'ACTIVE' | 'INACTIVE');
                      setIsStatusDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      border: 'none',
                      backgroundColor:
                        statusFilter === item.key
                          ? 'hsl(var(--color-brand-accent) / 0.08)'
                          : 'transparent',
                      color:
                        statusFilter === item.key
                          ? 'hsl(var(--color-brand-accent))'
                          : 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.label}</span>
                    {statusFilter === item.key && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Industry Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setIsIndustryDropdownOpen(!isIndustryDropdownOpen);
                setIsStatusDropdownOpen(false);
                setIsMoreFiltersOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span>{industryFilter === 'ALL' ? 'All Industry' : industryFilter}</span>
              <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            </button>

            {isIndustryDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + var(--space-1))',
                  left: 0,
                  width: '180px',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  border: '1px solid hsl(var(--border-subtle))',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 'var(--space-1)',
                  zIndex: 40,
                }}
              >
                {availableIndustries.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => {
                      setIndustryFilter(ind);
                      setIsIndustryDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      border: 'none',
                      backgroundColor:
                        industryFilter === ind
                          ? 'hsl(var(--color-brand-accent) / 0.08)'
                          : 'transparent',
                      color:
                        industryFilter === ind
                          ? 'hsl(var(--color-brand-accent))'
                          : 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{ind === 'ALL' ? 'All Industry' : ind}</span>
                    {industryFilter === ind && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* More Filters Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setIsMoreFiltersOpen(!isMoreFiltersOpen);
                setIsStatusDropdownOpen(false);
                setIsIndustryDropdownOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <SlidersHorizontal size={14} style={{ color: 'hsl(var(--text-muted))' }} />
              <span>More Filters</span>
            </button>

            {isMoreFiltersOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + var(--space-1))',
                  left: 0,
                  width: '220px',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  border: '1px solid hsl(var(--border-subtle))',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 'var(--space-3)',
                  zIndex: 40,
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Entity Type
                </div>
                {[
                  { key: 'ALL', label: 'All Entities' },
                  { key: 'INTERNAL', label: 'Internal HQ' },
                  { key: 'CLIENT', label: 'Client Accounts' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setTypeFilter(item.key as 'ALL' | 'INTERNAL' | 'CLIENT');
                      setIsMoreFiltersOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      border: 'none',
                      backgroundColor:
                        typeFilter === item.key
                          ? 'hsl(var(--color-brand-accent) / 0.08)'
                          : 'transparent',
                      color:
                        typeFilter === item.key
                          ? 'hsl(var(--color-brand-accent))'
                          : 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.label}</span>
                    {typeFilter === item.key && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right View Toggle (List / Grid) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-1)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List View"
            style={{
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'hsl(var(--bg-secondary))' : 'transparent',
              color: viewMode === 'list' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <List size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid View"
            style={{
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: viewMode === 'grid' ? 'hsl(var(--bg-secondary))' : 'transparent',
              color: viewMode === 'grid' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LayoutGrid size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 3. Main Data Container (Table View / Grid View) */}
      {viewMode === 'list' ? (
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-xl)',
            overflowX: 'auto',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              tableLayout: 'auto',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary) / 0.6)',
                }}
              >
                <th style={{ width: '36px', padding: '8px 12px' }}>
                  <input
                    type="checkbox"
                    checked={
                      paginatedCompanies.length > 0 &&
                      selectedIds.length === paginatedCompanies.length
                    }
                    onChange={handleSelectAll}
                    style={{
                      width: '15px',
                      height: '15px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      accentColor: 'hsl(var(--color-brand-accent))',
                    }}
                  />
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: '170px',
                  }}
                >
                  Company
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: '110px',
                    maxWidth: '160px',
                  }}
                >
                  Industry
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: '65px',
                  }}
                >
                  Employees
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: '120px',
                  }}
                >
                  GST Number
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: '90px',
                  }}
                >
                  PAN Number
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: '75px',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: '85px',
                  }}
                >
                  Created On
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-secondary))',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    width: '60px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 'var(--space-12)',
                      textAlign: 'center',
                      color: 'hsl(var(--text-muted))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Loading companies from database...
                  </td>
                </tr>
              ) : paginatedCompanies.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 'var(--space-12)',
                      textAlign: 'center',
                      color: 'hsl(var(--text-muted))',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    No companies found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((comp) => {
                  const isSelected = selectedIds.includes(comp.id);
                  const isMenuOpen = activeMenuId === comp.id;

                  return (
                    <tr
                      key={comp.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border-subtle))',
                        backgroundColor: isSelected
                          ? 'hsl(var(--color-brand-accent) / 0.04)'
                          : 'transparent',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(comp.id)}
                          style={{
                            width: '15px',
                            height: '15px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            accentColor: 'hsl(var(--color-brand-accent))',
                          }}
                        />
                      </td>

                      {/* Company Info */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <Link
                          href={`/dashboard/organization/companies/${comp.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          {renderAvatar(comp)}
                          <div>
                            <div
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: 700,
                                color: 'hsl(var(--text-primary))',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ transition: 'color var(--transition-fast)' }}>
                                {comp.name}
                              </span>
                              <Badge variant={comp.type === 'INTERNAL' ? 'primary' : 'outline'}>
                                {comp.type === 'INTERNAL' ? 'INTERNAL' : 'CLIENT'}
                              </Badge>
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'hsl(var(--text-muted))',
                                marginTop: '1px',
                              }}
                            >
                              {comp.domain}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Industry */}
                      <td
                        style={{
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: 'hsl(var(--text-secondary))',
                          fontWeight: 500,
                          maxWidth: '160px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={comp.industry}
                      >
                        {comp.industry}
                      </td>

                      {/* Employees */}
                      <td
                        style={{
                          padding: '8px 12px',
                          fontSize: 'var(--font-size-xs)',
                          color: 'hsl(var(--text-primary))',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.employeesCount}
                      </td>

                      {/* GST Number */}
                      <td
                        style={{
                          padding: '8px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.gstin && comp.gstin !== '—' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                              fontSize: '11px',
                              fontWeight: 500,
                              letterSpacing: '0.04em',
                              color: 'hsl(var(--text-primary))',
                              backgroundColor: 'hsl(var(--bg-secondary))',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid hsl(var(--border-subtle))',
                            }}
                          >
                            {comp.gstin}
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px' }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* PAN Number */}
                      <td
                        style={{
                          padding: '8px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.pan && comp.pan !== '—' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                              fontSize: '11px',
                              fontWeight: 500,
                              letterSpacing: '0.04em',
                              color: 'hsl(var(--text-primary))',
                              backgroundColor: 'hsl(var(--bg-secondary))',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid hsl(var(--border-subtle))',
                            }}
                          >
                            {comp.pan}
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px' }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor:
                              comp.status === 'ACTIVE'
                                ? 'hsl(var(--color-success) / 0.12)'
                                : 'hsl(var(--bg-secondary))',
                            color:
                              comp.status === 'ACTIVE'
                                ? 'hsl(var(--color-success))'
                                : 'hsl(var(--text-muted))',
                            border:
                              comp.status === 'ACTIVE'
                                ? '1px solid hsl(var(--color-success) / 0.25)'
                                : '1px solid hsl(var(--border-subtle))',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor:
                                comp.status === 'ACTIVE'
                                  ? 'hsl(var(--color-success))'
                                  : 'hsl(var(--text-muted))',
                            }}
                          />
                          {comp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Created On */}
                      <td
                        style={{
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: 'hsl(var(--text-secondary))',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.createdOn}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: '8px 12px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-1)',
                            position: 'relative',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            aria-label={`Edit ${comp.name}`}
                            style={{
                              padding: 'var(--space-2)',
                              borderRadius: 'var(--radius-md)',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: 'hsl(var(--text-muted))',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color var(--transition-fast)',
                            }}
                          >
                            <Edit2 size={15} strokeWidth={1.75} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : comp.id)}
                            aria-label={`More actions for ${comp.name}`}
                            style={{
                              padding: 'var(--space-2)',
                              borderRadius: 'var(--radius-md)',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: 'hsl(var(--text-muted))',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color var(--transition-fast)',
                            }}
                          >
                            <MoreVertical size={15} strokeWidth={1.75} />
                          </button>

                          {isMenuOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                width: '160px',
                                backgroundColor: 'hsl(var(--bg-surface))',
                                border: '1px solid hsl(var(--border-subtle))',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow-lg)',
                                padding: 'var(--space-1)',
                                zIndex: 40,
                                textAlign: 'left',
                              }}
                            >
                              <Link
                                href={`/dashboard/organization/companies/${comp.id}`}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: 'var(--space-2) var(--space-3)',
                                  color: 'hsl(var(--color-brand-accent))',
                                  textDecoration: 'none',
                                  fontSize: 'var(--font-size-xs)',
                                  fontWeight: 700,
                                  borderRadius: 'var(--radius-md)',
                                  textAlign: 'left',
                                }}
                              >
                                View Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsModalOpen(true);
                                  setActiveMenuId(null);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: 'var(--space-2) var(--space-3)',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: 'hsl(var(--text-primary))',
                                  fontSize: 'var(--font-size-xs)',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-md)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                Edit Profile
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompanies((prev) =>
                                    prev.map((item) =>
                                      item.id === comp.id
                                        ? {
                                            ...item,
                                            status:
                                              item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                          }
                                        : item,
                                    ),
                                  );
                                  setActiveMenuId(null);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: 'var(--space-2) var(--space-3)',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: 'hsl(var(--text-primary))',
                                  fontSize: 'var(--font-size-xs)',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-md)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                {comp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* 4. Grid View Mode */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {paginatedCompanies.map((comp) => (
            <div
              key={comp.id}
              style={{
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <Link
                    href={`/dashboard/organization/companies/${comp.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {renderAvatar(comp)}
                    <div>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 700,
                          color: 'hsl(var(--text-primary))',
                          margin: 0,
                        }}
                      >
                        {comp.name}
                      </h3>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'hsl(var(--text-muted))',
                        }}
                      >
                        {comp.domain}
                      </span>
                    </div>
                  </Link>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px var(--space-2)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor:
                        comp.status === 'ACTIVE'
                          ? 'hsl(var(--color-success) / 0.12)'
                          : 'hsl(var(--bg-secondary))',
                      color:
                        comp.status === 'ACTIVE'
                          ? 'hsl(var(--color-success))'
                          : 'hsl(var(--text-muted))',
                    }}
                  >
                    {comp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <Badge variant="outline">Industry: {comp.industry}</Badge>
                  <Badge variant="secondary">{comp.employeesCount} Employees</Badge>
                </div>

                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                    borderTop: '1px solid hsl(var(--border-subtle))',
                    paddingTop: 'var(--space-3)',
                  }}
                >
                  <div>
                    <strong>GSTIN:</strong> {comp.gstin}
                  </div>
                  <div>
                    <strong>PAN:</strong> {comp.pan}
                  </div>
                  <div>
                    <strong>Created:</strong> {comp.createdOn}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-4)',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <Link
                  href={`/dashboard/organization/companies/${comp.id}`}
                  style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--border-subtle))',
                    backgroundColor: 'hsl(var(--bg-surface))',
                    color: 'hsl(var(--color-brand-accent))',
                    textDecoration: 'none',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  View Profile
                </Link>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                  <Edit2 size={13} style={{ marginRight: 'var(--space-1)' }} />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Pagination Bar Matching Attached Photo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          paddingTop: 'var(--space-2)',
        }}
      >
        {/* Showing X to Y of Z companies */}
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'hsl(var(--text-muted))',
            fontWeight: 500,
          }}
        >
          Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} companies
        </div>

        {/* Numbered Pagination Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isActive = validCurrentPage === pageNum;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  minWidth: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: isActive
                    ? '1px solid hsl(var(--color-brand-accent))'
                    : '1px solid transparent',
                  backgroundColor: isActive
                    ? 'hsl(var(--color-brand-accent) / 0.08)'
                    : 'transparent',
                  color: isActive ? 'hsl(var(--color-brand-accent))' : 'hsl(var(--text-secondary))',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {pageNum}
              </button>
            );
          })}

          {validCurrentPage < totalPages && (
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              aria-label="Next page"
              style={{
                minWidth: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                color: 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          )}

          {/* Page Size Selector */}
          <div style={{ position: 'relative', marginLeft: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={() => setIsPageSizeDropdownOpen(!isPageSizeDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-2) var(--space-3)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span>{pageSize} / page</span>
              <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            </button>

            {isPageSizeDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + var(--space-1))',
                  right: 0,
                  width: '110px',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  border: '1px solid hsl(var(--border-subtle))',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 'var(--space-1)',
                  zIndex: 40,
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setIsPageSizeDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      border: 'none',
                      backgroundColor:
                        pageSize === size ? 'hsl(var(--color-brand-accent) / 0.08)' : 'transparent',
                      color:
                        pageSize === size
                          ? 'hsl(var(--color-brand-accent))'
                          : 'hsl(var(--text-primary))',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{size} / page</span>
                    {pageSize === size && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Tab Company Creation Dialog */}
      <CompanyFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCompanyCreated}
      />
    </div>
  );
}

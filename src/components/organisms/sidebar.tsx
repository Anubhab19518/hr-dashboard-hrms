'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, getUserDisplayRole } from '@/lib/client/auth-store';
import {
  Home,
  Building2,
  Users,
  ClipboardCheck,
  ShieldAlert,
  FileText,
  HelpCircle,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from '@/components/atoms/icons';

interface NavItem {
  title: string;
  href: string;
  icon: typeof Home;
  hasChevron?: boolean;
}

const MAIN_MENU_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home, hasChevron: false },
  { title: 'Company Profiles', href: '/dashboard/organization', icon: Building2, hasChevron: true },
  { title: 'Employee Management', href: '/dashboard/employees', icon: Users, hasChevron: true },
  {
    title: 'Attendance & Tracking',
    href: '/dashboard/attendance',
    icon: ClipboardCheck,
    hasChevron: true,
  },
  { title: 'Worker Safety & GIS', href: '/dashboard/safety', icon: ShieldAlert, hasChevron: true },
  { title: 'Reports', href: '/dashboard/attendance', icon: FileText, hasChevron: true },
];

const OTHER_MENU_ITEMS: NavItem[] = [
  { title: 'Support', href: '/dashboard/safety', icon: HelpCircle, hasChevron: false },
  { title: 'Audit Logs', href: '/dashboard/attendance', icon: FileSpreadsheet, hasChevron: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = user?.name || 'Admin / Staff';
  const displayRole = getUserDisplayRole(user);

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        backgroundColor: 'hsl(var(--bg-surface))',
        borderRight: '1px solid hsl(var(--border-subtle))',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 30,
        transition: 'width var(--transition-base)',
        overflowX: 'hidden',
        userSelect: 'none',
      }}
      aria-label="Dashboard Navigation"
    >
      {/* 1. Header with Logo & Brand (Matching Photo 2) */}
      <div
        style={{
          padding: collapsed ? 'var(--space-5) var(--space-3)' : 'var(--space-5) var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          minHeight: 'var(--space-16)',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            textDecoration: 'none',
          }}
        >
          {/* Logo Hexagon / Circle Icon */}
          <div
            style={{
              width: 'var(--space-9)',
              height: 'var(--space-9)',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'hsl(var(--text-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'hsl(var(--bg-surface))',
                transform: 'rotate(45deg)',
                opacity: 0.9,
              }}
            />
          </div>

          {!collapsed && (
            <div style={{ lineHeight: 1.15 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 800,
                  color: 'hsl(var(--text-primary))',
                  letterSpacing: '-0.02em',
                }}
              >
                HRMS
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'hsl(var(--text-muted))',
                  marginTop: 'var(--space-1)',
                }}
              >
                Admin Portal
              </div>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            style={{
              color: 'hsl(var(--text-muted))',
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* 2. Navigation Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? 'var(--space-4) var(--space-2)' : 'var(--space-4) var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        {/* MAIN MENU Section */}
        <div>
          {!collapsed && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'hsl(var(--text-muted))',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0 var(--space-2)',
                marginBottom: 'var(--space-2)',
              }}
            >
              MAIN MENU
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {MAIN_MENU_ITEMS.map((item) => {
              const isExactDashboard = item.href === '/dashboard' && pathname === '/dashboard';
              const isOtherActive = item.href !== '/dashboard' && pathname.startsWith(item.href);
              const isActive = isExactDashboard || isOtherActive;
              const IconComp = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  title={collapsed ? item.title : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? 'var(--space-2) 0' : 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    backgroundColor: isActive ? 'hsl(var(--color-brand-accent))' : 'transparent',
                    color: isActive ? 'hsl(var(--text-inverse))' : 'hsl(var(--text-secondary))',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <IconComp
                      size={18}
                      strokeWidth={isActive ? 2 : 1.75}
                      style={{
                        color: isActive ? 'hsl(var(--text-inverse))' : 'hsl(var(--text-muted))',
                      }}
                    />
                    {!collapsed && <span>{item.title}</span>}
                  </div>

                  {!collapsed && item.hasChevron && !isActive && (
                    <ChevronRight size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* OTHER Section */}
        <div>
          {!collapsed && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'hsl(var(--text-muted))',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0 var(--space-2)',
                marginBottom: 'var(--space-2)',
              }}
            >
              OTHER
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {OTHER_MENU_ITEMS.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  title={collapsed ? item.title : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 'var(--space-3)',
                    padding: collapsed ? 'var(--space-2) 0' : 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: 'hsl(var(--text-secondary))',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <IconComp
                    size={18}
                    strokeWidth={1.75}
                    style={{ color: 'hsl(var(--text-muted))' }}
                  />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom User Profile Card & Expand/Collapse Toggle (Matching Photo 2) */}
      <div
        style={{
          padding: collapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-3) var(--space-3)',
          borderTop: '1px solid hsl(var(--border-subtle))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {/* User Card Container */}
        {!collapsed ? (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
            }}
          >
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  minWidth: 0,
                }}
              >
                {/* Photo Avatar */}
                <div
                  style={{
                    width: 'var(--space-9)',
                    height: 'var(--space-9)',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'hsl(var(--color-brand-accent))',
                    color: 'hsl(var(--text-inverse))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div style={{ minWidth: 0, lineHeight: 1.2 }}>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'hsl(var(--text-primary))',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'hsl(var(--text-muted))',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayRole}
                  </div>
                </div>
              </div>

              <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
            </div>

            {userDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'var(--space-14)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'hsl(var(--bg-surface))',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid hsl(var(--border-subtle))',
                  padding: 'var(--space-1)',
                  zIndex: 50,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    width: '100%',
                    padding: 'var(--space-2) var(--space-2)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--color-danger))',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            style={{
              width: '100%',
              height: 'var(--space-10)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
          </button>
        )}

        {/* Bottom Expand/Collapse Button (Matching Photo 2 << button) */}
        <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

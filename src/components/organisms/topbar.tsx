'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore, getUserDisplayRole } from '@/lib/client/auth-store';
import {
  Search,
  Star,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Plus,
} from '@/components/atoms/icons';

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notificationCount] = useState(8);

  const displayName = user?.name || 'Admin / Staff';
  const displayRole = getUserDisplayRole(user);

  return (
    <header
      style={{
        height: 'var(--space-16)',
        backgroundColor: 'hsl(var(--bg-surface))',
        borderBottom: '1px solid hsl(var(--border-subtle))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        position: 'sticky',
        top: 0,
        zIndex: 25,
      }}
    >
      {/* Left Search Bar */}
      <div style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: 'var(--space-3)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--text-muted))',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <Search size={16} strokeWidth={2} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search employees, companies, departments..."
          style={{
            width: '100%',
            height: 'var(--space-10)',
            paddingLeft: 'var(--space-10)',
            paddingRight: 'var(--space-12)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-primary))',
            fontSize: 'var(--font-size-xs)',
            color: 'hsl(var(--text-primary))',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 'var(--space-3)',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'hsl(var(--text-muted))',
            backgroundColor: 'hsl(var(--bg-secondary))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-sm)',
            padding: '2px var(--space-1)',
            letterSpacing: '0.04em',
            pointerEvents: 'none',
          }}
        >
          ⌘K
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* Quick Actions Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              height: 'var(--space-9)',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-secondary))',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Star size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            <span>Quick Actions</span>
            <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))' }} />
          </button>

          {isQuickActionsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--space-11)',
                right: 0,
                width: '210px',
                backgroundColor: 'hsl(var(--bg-surface))',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid hsl(var(--border-subtle))',
                padding: 'var(--space-1)',
                zIndex: 50,
              }}
            >
              <Link
                href="/dashboard/employees"
                onClick={() => setIsQuickActionsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-primary))',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 500,
                }}
              >
                <Plus size={15} style={{ color: 'hsl(var(--color-brand-accent))' }} />
                <span>Onboard Employee</span>
              </Link>
              <Link
                href="/dashboard/organization"
                onClick={() => setIsQuickActionsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-primary))',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 500,
                }}
              >
                <Plus size={15} style={{ color: 'hsl(var(--color-success))' }} />
                <span>Add Client Company</span>
              </Link>
              <Link
                href="/dashboard/attendance"
                onClick={() => setIsQuickActionsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-primary))',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 500,
                }}
              >
                <Plus size={15} style={{ color: 'hsl(var(--color-warning))' }} />
                <span>Log Manual Attendance</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notification Bell with Red Badge */}
        <button
          type="button"
          aria-label="Notifications"
          style={{
            position: 'relative',
            width: 'var(--space-9)',
            height: 'var(--space-9)',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'hsl(var(--bg-primary))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--text-secondary))',
            cursor: 'pointer',
            transition: 'background-color var(--transition-fast)',
          }}
        >
          <Bell size={17} strokeWidth={1.75} />
          {notificationCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: 'hsl(var(--color-danger))',
                color: 'hsl(var(--text-inverse))',
                fontSize: '10px',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid hsl(var(--bg-surface))',
              }}
            >
              {notificationCount}
            </span>
          )}
        </button>

        {/* Help Circle Icon */}
        <button
          type="button"
          aria-label="Help & Documentation"
          style={{
            width: 'var(--space-9)',
            height: 'var(--space-9)',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'hsl(var(--bg-primary))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--text-secondary))',
            cursor: 'pointer',
            transition: 'background-color var(--transition-fast)',
          }}
        >
          <HelpCircle size={18} strokeWidth={1.75} />
        </button>

        {/* User Profile Pill */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: 'transparent',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            {/* User Avatar Circle */}
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

            {/* Name & Role */}
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
                {displayRole}
              </div>
            </div>

            <ChevronDown
              size={14}
              style={{ color: 'hsl(var(--text-muted))', marginLeft: 'var(--space-1)' }}
            />
          </button>

          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--space-12)',
                right: 0,
                width: '220px',
                backgroundColor: 'hsl(var(--bg-surface))',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid hsl(var(--border-subtle))',
                padding: 'var(--space-1)',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                    margin: 0,
                  }}
                >
                  {displayName}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-muted))',
                    margin: 'var(--space-1) 0 0 0',
                  }}
                >
                  {user?.email || 'admin@manpower.com'}
                </p>
              </div>
              <Link
                href="/dashboard/employees"
                onClick={() => setIsUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-primary))',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: 'var(--space-1)',
                }}
              >
                <User size={15} />
                <span>My Profile</span>
              </Link>
              <Link
                href="/dashboard/organization"
                onClick={() => setIsUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-primary))',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--color-danger))',
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  marginTop: 'var(--space-1)',
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

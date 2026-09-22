'use client';

import { useState, type ComponentType } from 'react';
import { Building2, MapPin, Users, Clock } from '@/components/atoms/icons';
import { CompanyList } from './company-list';
import { SiteList } from './site-list';
import { DepartmentsAndRolesTab } from './departments-and-roles-tab';
import { ShiftList } from './shift-list';

type OrgTab = 'companies' | 'departments' | 'shifts' | 'sites';

export function OrganizationTabs() {
  const [activeTab, setActiveTab] = useState<OrgTab>('companies');

  const tabs: {
    id: OrgTab;
    label: string;
    Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  }[] = [
    { id: 'companies', label: 'Companies', Icon: Building2 },
    { id: 'departments', label: 'Departments & Roles', Icon: Users },
    { id: 'shifts', label: 'Shifts & Rosters', Icon: Clock },
    { id: 'sites', label: 'Sites', Icon: MapPin },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          paddingBottom: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                backgroundColor: isActive
                  ? 'hsl(var(--color-brand-accent))'
                  : 'hsl(var(--bg-secondary))',
                color: isActive ? 'hsl(var(--text-inverse))' : 'hsl(var(--text-secondary))',
              }}
            >
              <TabIcon size={16} strokeWidth={1.75} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab View */}
      {activeTab === 'companies' && <CompanyList />}
      {activeTab === 'departments' && <DepartmentsAndRolesTab />}
      {activeTab === 'shifts' && <ShiftList />}
      {activeTab === 'sites' && <SiteList />}
    </div>
  );
}

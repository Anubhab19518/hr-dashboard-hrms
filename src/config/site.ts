export interface NavItem {
  readonly title: string;
  readonly href: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

export interface NavSection {
  readonly label: string;
  readonly items: readonly NavItem[];
}

export const siteConfig = {
  name: 'HR Dashboard',
  shortName: 'HR',
  description:
    'Dedicated HR Management Dashboard — Guard & staff onboarding, attendance tracking, geofencing, and field safety.',
  url: 'http://localhost:3000',
  ogImage: '/og.png',

  /** Top-level navigation for the marketing/public header */
  mainNav: [
    { title: 'Home', href: '/' },
    { title: 'Login', href: '/login' },
  ] as const satisfies readonly NavItem[],

  /** Dashboard sidebar navigation sections */
  dashboardNav: [
    {
      label: 'Overview',
      items: [{ title: 'Dashboard', href: '/dashboard', icon: 'dashboard' }],
    },
    {
      label: 'People',
      items: [
        { title: 'Employees', href: '/dashboard/employees', icon: 'employees' },
        { title: 'Organization', href: '/dashboard/organization', icon: 'organization' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { title: 'Attendance', href: '/dashboard/attendance', icon: 'attendance' },
        { title: 'Safety & Alerts', href: '/dashboard/safety', icon: 'safety' },
      ],
    },
  ] as const satisfies readonly NavSection[],

  links: {
    docs: '/docs',
  },
} as const;

export type SiteConfig = typeof siteConfig;

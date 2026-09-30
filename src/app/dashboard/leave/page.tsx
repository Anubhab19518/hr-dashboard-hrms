import type { Metadata } from 'next';
import { LeaveDashboard } from '@/features/leave';

export const metadata: Metadata = {
  title: 'Leave Management | HRMS',
  description:
    'Manage workforce leave applications, approvals, quotas, policies, and payroll loss of pay.',
};

export default function LeaveManagementPage() {
  return <LeaveDashboard />;
}

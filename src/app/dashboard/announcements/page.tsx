import type { Metadata } from 'next';
import { AnnouncementsView } from '@/features/announcements';

export const metadata: Metadata = {
  title: 'Announcements | HRMS',
  description:
    'Publish and manage workspace and company announcements, notices, policies, and urgent broadcasts.',
};

export default function AnnouncementsPage() {
  return <AnnouncementsView />;
}

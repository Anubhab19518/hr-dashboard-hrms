'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HolidayCalendarList } from '@/features/holidays';
import DashboardLayout from '@/app/dashboard/layout';

export default function SettingsHolidaysRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings/holidays');
  }, [router]);

  return (
    <DashboardLayout>
      <HolidayCalendarList />
    </DashboardLayout>
  );
}

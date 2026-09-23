'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyHolidaySettings } from '@/features/holidays';
import DashboardLayout from '@/app/dashboard/layout';

interface DirectCompanyHolidaysPageProps {
  params: Promise<{ companyId: string }>;
}

export default function DirectCompanyHolidaysPage({ params }: DirectCompanyHolidaysPageProps) {
  const { companyId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/organization/companies/${companyId}/holidays`);
  }, [router, companyId]);

  return (
    <DashboardLayout>
      <CompanyHolidaySettings companyId={companyId} />
    </DashboardLayout>
  );
}

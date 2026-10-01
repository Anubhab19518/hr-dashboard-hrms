'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CompanyHolidaySettings } from '@/features/holidays';
import DashboardLayout from '@/app/dashboard/layout';

export default function DirectCompanyHolidaysPage() {
  const params = useParams<{ companyId: string }>();
  const companyId =
    typeof params?.companyId === 'string'
      ? params.companyId
      : Array.isArray(params?.companyId)
        ? params.companyId[0]
        : '';
  const router = useRouter();

  useEffect(() => {
    if (companyId) {
      router.replace(`/dashboard/organization/companies/${companyId}/holidays`);
    }
  }, [router, companyId]);

  return (
    <DashboardLayout>
      <CompanyHolidaySettings companyId={companyId || ''} />
    </DashboardLayout>
  );
}

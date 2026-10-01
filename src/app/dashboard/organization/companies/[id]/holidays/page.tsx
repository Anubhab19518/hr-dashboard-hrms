'use client';

import { useParams } from 'next/navigation';
import { CompanyHolidaySettings } from '@/features/holidays';

export default function CompanyHolidaysPage() {
  const params = useParams<{ id: string }>();
  const id =
    typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <CompanyHolidaySettings companyId={id || ''} />;
}

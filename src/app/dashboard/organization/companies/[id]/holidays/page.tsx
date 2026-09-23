'use client';

import { use } from 'react';
import { CompanyHolidaySettings } from '@/features/holidays';

interface CompanyHolidaysPageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyHolidaysPage({ params }: CompanyHolidaysPageProps) {
  const { id } = use(params);

  return <CompanyHolidaySettings companyId={id} />;
}

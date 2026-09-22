'use client';

import { use } from 'react';
import { CompanyDetailView } from '@/features/organization';

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = use(params);

  return <CompanyDetailView companyId={id} />;
}

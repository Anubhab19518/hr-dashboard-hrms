'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateOrderDialog } from '@/features/orders';

export function DashboardActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
        + New Order
      </Button>
      <CreateOrderDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </>
  );
}

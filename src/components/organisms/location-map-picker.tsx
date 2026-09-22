'use client';

import dynamic from 'next/dynamic';
import type { LocationMapPickerProps } from './location-map-picker-inner';

export type { LocationMapPickerProps };

const DynamicMapPickerInner = dynamic(() => import('./location-map-picker-inner'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '240px',
        width: '100%',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'hsl(var(--bg-secondary))',
        border: '1px solid hsl(var(--border-subtle))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        color: 'hsl(var(--text-muted))',
        fontSize: 'var(--font-size-xs)',
      }}
    >
      <span style={{ fontWeight: 600 }}>Loading interactive location map...</span>
      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
        Initializing GIS coordinate renderer
      </span>
    </div>
  ),
});

export function LocationMapPicker(props: LocationMapPickerProps) {
  return <DynamicMapPickerInner {...props} />;
}

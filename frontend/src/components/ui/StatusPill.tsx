import React from 'react';
import { cn } from './Button';

export function StatusPill({ status }: { status: string }) {
  let bg = 'bg-status-trip/20';
  let text = 'text-status-trip';
  let dot = 'bg-status-trip';

  const s = status.toUpperCase();
  if (['AVAILABLE', 'COMPLETED'].includes(s)) {
    bg = 'bg-status-available/20'; text = 'text-status-available'; dot = 'bg-status-available';
  } else if (['IN_SHOP', 'OFF_DUTY', 'IN SHOP', 'OFF DUTY', 'DRAFT'].includes(s)) {
    bg = 'bg-status-shop/20'; text = 'text-status-shop'; dot = 'bg-status-shop';
  } else if (['RETIRED', 'SUSPENDED', 'CANCELLED'].includes(s)) {
    bg = 'bg-status-retired/20'; text = 'text-status-retired'; dot = 'bg-status-retired';
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", bg, text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)}></span>
      {status}
    </span>
  );
}

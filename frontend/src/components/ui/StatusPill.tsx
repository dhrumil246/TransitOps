import React from 'react';
import { cn } from './Button';

/** Maps a status string to the correct .pill-* CSS class from style.css */
const STATUS_CLASS: Record<string, string> = {
  AVAILABLE:  'pill-available',
  COMPLETED:  'pill-completed',
  ON_TRIP:    'pill-ontrip',
  DISPATCHED: 'pill-dispatched',
  PENDING:    'pill-pending',
  IN_SHOP:    'pill-inshop',
  OFF_DUTY:   'pill-inshop',
  DRAFT:      'pill-draft',
  RETIRED:    'pill-retired',
  SUSPENDED:  'pill-retired',
  CANCELLED:  'pill-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE:  'Available',
  COMPLETED:  'Completed',
  ON_TRIP:    'On Trip',
  DISPATCHED: 'Dispatched',
  PENDING:    'Pending',
  IN_SHOP:    'In Shop',
  OFF_DUTY:   'Off Duty',
  DRAFT:      'Draft',
  RETIRED:    'Retired',
  SUSPENDED:  'Suspended',
  CANCELLED:  'Cancelled',
};

export function StatusPill({ status }: { status: string }) {
  const key = status?.toUpperCase().replace(/\s+/g, '_');
  const pillClass = STATUS_CLASS[key] || 'pill-draft';
  const label = STATUS_LABEL[key] || status;

  return (
    <span className={cn('pill', pillClass)}>
      {label}
    </span>
  );
}

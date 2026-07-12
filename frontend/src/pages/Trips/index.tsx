import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';

export default function Trips() {
  const { data: trips, isLoading } = useQuery({ queryKey: ['trips'], queryFn: () => api('/trips') });

  if (isLoading || !trips) return <div className="p-8 text-primary">Loading Trips...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Live Trip Board</h2>
        <Button>+ New Trip</Button>
      </div>
      
      <div className="border border-border rounded-xl bg-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(trips as any[]).map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono font-bold">{t.id}</TableCell>
                <TableCell>{t.source} → {t.destination}</TableCell>
                <TableCell>{t.vehicleRegNo || '—'}</TableCell>
                <TableCell>{t.driver || '—'}</TableCell>
                <TableCell className="font-mono">{t.cargoWeightKg} kg</TableCell>
                <TableCell><StatusPill status={t.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

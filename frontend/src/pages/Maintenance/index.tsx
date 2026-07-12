import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';

export default function Maintenance() {
  const { data: logs, isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: () => api('/maintenance') });

  if (isLoading || !logs) return <div className="p-8 text-primary">Loading Maintenance...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Service Log</h2>
        <Button>+ Save Record</Button>
      </div>
      
      <div className="border border-border rounded-xl bg-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs as any[]).map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-semibold">{l.vehicleRegNo}</TableCell>
                <TableCell>{l.type}</TableCell>
                <TableCell className="font-mono">₹{l.cost}</TableCell>
                <TableCell className="font-mono">{l.date}</TableCell>
                <TableCell><StatusPill status={l.status === 'OPEN' ? 'IN_SHOP' : 'AVAILABLE'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

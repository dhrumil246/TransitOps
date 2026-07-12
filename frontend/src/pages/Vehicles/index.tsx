import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';

export default function Vehicles() {
  const { data: vehicles, isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => api('/vehicles') });

  if (isLoading || !vehicles) return <div className="p-8 text-primary">Loading Vehicles...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Fleet Registry</h2>
        <Button>+ Add Vehicle</Button>
      </div>
      
      <div className="border border-border rounded-xl bg-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registration</TableHead>
              <TableHead>Vehicle Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Max Load</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(vehicles as any[]).map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-mono font-semibold">{v.regNo}</TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.type}</TableCell>
                <TableCell className="font-mono">{v.maxLoadKg} kg</TableCell>
                <TableCell><StatusPill status={v.status} /></TableCell>
                <TableCell><Button variant="ghost" size="sm">Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

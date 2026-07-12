import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';

export default function Drivers() {
  const { data: drivers, isLoading } = useQuery({ queryKey: ['drivers'], queryFn: () => api('/drivers') });

  if (isLoading || !drivers) return <div className="p-8 text-primary">Loading Drivers...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Driver Management</h2>
        <Button>+ Add Driver</Button>
      </div>
      
      <div className="border border-border rounded-xl bg-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License No.</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(drivers as any[]).map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-semibold">{d.name}</TableCell>
                <TableCell className="font-mono">{d.licenseNo}</TableCell>
                <TableCell>{d.licenseCategory}</TableCell>
                <TableCell className="font-mono">{d.licenseExpiry}</TableCell>
                <TableCell className="font-mono text-status-available font-bold">{d.safetyScore}%</TableCell>
                <TableCell><StatusPill status={d.status} /></TableCell>
                <TableCell><Button variant="ghost" size="sm">Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

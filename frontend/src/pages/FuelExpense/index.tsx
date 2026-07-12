import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';

export default function FuelExpense() {
  const { data: fuel, isLoading: l1 } = useQuery({ queryKey: ['fuelLogs'], queryFn: () => api('/fuel') });
  const { data: exp, isLoading: l2 } = useQuery({ queryKey: ['expenses'], queryFn: () => api('/expenses') });

  if (l1 || l2 || !fuel || !exp) return <div className="p-8 text-primary">Loading Fuel & Expenses...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Fuel Logs & Expenses</h2>
        <div className="flex gap-2">
          <Button variant="outline">Log Fuel</Button>
          <Button variant="outline">Add Expense</Button>
        </div>
      </div>
      <div className="border border-border rounded-xl bg-panel overflow-hidden">
        <div className="p-6">Table placeholders</div>
      </div>
    </div>
  );
}

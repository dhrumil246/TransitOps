import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatusPill } from '../../components/ui/StatusPill';

export default function Dashboard() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api('/dashboard/kpis')
  });

  if (isLoading || !kpis) return <div className="p-8 text-primary">Loading KPIs...</div>;

  return (
    <div className="p-8 space-y-6">
      {/* Alert Banner */}
      <div className="bg-amber-900/20 border border-amber-500/30 text-amber-500 p-4 rounded-lg flex items-center gap-3">
        <span className="font-bold">3 driver licenses expire within 7 days.</span>
        <span className="text-sm">Review compliance before next dispatch.</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted">Fleet Utilization</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-mono font-bold">{kpis.fleetUtilizationPct}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted">Active Vehicles</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-mono font-bold">{kpis.activeVehicles}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted">Pending Trips</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-mono font-bold">{kpis.pendingTrips}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted">In Maintenance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-mono font-bold text-status-shop">{kpis.inMaintenance}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}

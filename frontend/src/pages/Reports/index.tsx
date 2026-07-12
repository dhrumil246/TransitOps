import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function Reports() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-lg font-bold text-white">Analytics & Reports</h2>
      <div className="grid grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted">Fleet Utilization</CardTitle></CardHeader><CardContent><div className="text-2xl font-mono font-bold">87%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted">Avg Fuel Efficiency</CardTitle></CardHeader><CardContent><div className="text-2xl font-mono font-bold">8.4 km/L</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted">Operational Cost</CardTitle></CardHeader><CardContent><div className="text-2xl font-mono font-bold">₹34,090</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted">Total Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-mono font-bold text-brand">₹12,000</div></CardContent></Card>
      </div>
    </div>
  );
}

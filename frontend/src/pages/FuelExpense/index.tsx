import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function FuelExpense() {
  const queryClient = useQueryClient();

  // Fuel form state
  const [fVehicle, setFVehicle] = useState('');
  const [fLiters, setFLiters] = useState('');
  const [fCost, setFCost] = useState('');

  // Expense form state
  const [eVehicle, setEVehicle] = useState('');
  const [eType, setEType] = useState('MISC');
  const [eAmount, setEAmount] = useState('');
  const [eDesc, setEDesc] = useState('');

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => api<any[]>('/vehicles') });
  const { data: fuelLogs = [], isLoading: fLoading } = useQuery({ queryKey: ['fuel'], queryFn: () => api<any[]>('/fuel') });
  const { data: expenses = [], isLoading: eLoading } = useQuery({ queryKey: ['expenses'], queryFn: () => api<any[]>('/expenses') });
  const { data: costSummary } = useQuery({ queryKey: ['cost-summary'], queryFn: () => api<any>('/operations/cost-summary') });

  const fuelMut = useMutation({
    mutationFn: (data: any) => api('/fuel', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['fuel']}); queryClient.invalidateQueries({queryKey:['cost-summary']}); setFVehicle(''); setFLiters(''); setFCost(''); },
    onError: (err:any) => alert(err.error || 'Failed to log fuel')
  });

  const expMut = useMutation({
    mutationFn: (data: any) => api('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['expenses']}); queryClient.invalidateQueries({queryKey:['cost-summary']}); setEVehicle(''); setEAmount(''); setEDesc(''); },
    onError: (err:any) => alert(err.error || 'Failed to add expense')
  });

  const handleFuel = (e: React.FormEvent) => {
    e.preventDefault();
    fuelMut.mutate({ vehicleId: fVehicle, liters: Number(fLiters), cost: Number(fCost) });
  };

  const handleExp = (e: React.FormEvent) => {
    e.preventDefault();
    expMut.mutate({ vehicleId: eVehicle, type: eType, amount: Number(eAmount), description: eDesc });
  };

  const totalFuel = fuelLogs.reduce((s:number,e:any)=>s+Number(e.cost),0);
  const totalOther = expenses.reduce((s:number,e:any)=>s+Number(e.amount),0);

  // total operational cost sum across all vehicles from summary
  const totalOpCost = costSummary?.vehicles?.reduce((sum:number, v:any) => sum + v.totalCost, 0) || (totalFuel + totalOther);

  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <form className="card" style={{padding:20}} onSubmit={handleFuel}>
          <div className="card-title" style={{marginBottom:14}}>Log Fuel</div>
          <div className="form-group" style={{marginBottom:10}}><label className="form-label">Vehicle</label><select className="form-select" value={fVehicle} onChange={e=>setFVehicle(e.target.value)} required><option value="">Select vehicle...</option>{vehicles.map((v:any)=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
          <div style={{display:'flex',gap:10}}>
            <div className="form-group" style={{flex:1}}><label className="form-label">Liters</label><input className="form-input" type="number" min="0.1" step="0.1" value={fLiters} onChange={e=>setFLiters(e.target.value)} required /></div>
            <div className="form-group" style={{flex:1}}><label className="form-label">Cost (₹)</label><input className="form-input" type="number" min="1" value={fCost} onChange={e=>setFCost(e.target.value)} required /></div>
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop:8}}>Log Fuel</button>
        </form>
        <form className="card" style={{padding:20}} onSubmit={handleExp}>
          <div className="card-title" style={{marginBottom:14}}>Add Expense</div>
          <div style={{display:'flex',gap:10}}>
            <div className="form-group" style={{flex:1,marginBottom:10}}><label className="form-label">Vehicle</label><select className="form-select" value={eVehicle} onChange={e=>setEVehicle(e.target.value)} required><option value="">Select vehicle...</option>{vehicles.map((v:any)=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            <div className="form-group" style={{flex:1,marginBottom:10}}><label className="form-label">Type</label><select className="form-select" value={eType} onChange={e=>setEType(e.target.value)} required><option value="TOLLS">Tolls</option><option value="MAINTENANCE">Maintenance</option><option value="MISC">Misc</option></select></div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <div className="form-group" style={{flex:1}}><label className="form-label">Amount (₹)</label><input className="form-input" type="number" min="1" value={eAmount} onChange={e=>setEAmount(e.target.value)} required /></div>
            <div className="form-group" style={{flex:1}}><label className="form-label">Description</label><input className="form-input" type="text" value={eDesc} onChange={e=>setEDesc(e.target.value)} required /></div>
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop:8}}>Add Expense</button>
        </form>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div className="card">
          <div className="card-header"><div className="card-title">Fuel Logs</div></div>
          <table className="data-table">
            <thead><tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost</th></tr></thead>
            <tbody>
              {fLoading ? <tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>Loading...</td></tr> : fuelLogs.length ? fuelLogs.map((e:any) => (
                <tr key={e.id}>
                  <td style={{fontWeight:600,color:'#0f172a'}}>{e.vehicle?.regNo || e.vehicleId}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'11.5px',color:'#94a3b8'}}>{new Date(e.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td>{e.liters || '—'} L</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:'#dc2626'}}>₹{Number(e.cost).toLocaleString('en-IN')}</td>
                </tr>
              )) : <tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>No fuel records</td></tr>}
            </tbody>
          </table>
          <div style={{padding:'12px 20px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:'#94a3b8'}}>{fuelLogs.length} entries</span>
            <span style={{fontSize:12,fontWeight:700,color:'#0f172a',fontFamily:"'JetBrains Mono',monospace"}}>₹{totalFuel.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Other Expenses</div></div>
          <table className="data-table">
            <thead><tr><th>Type</th><th>Vehicle</th><th>Amount</th></tr></thead>
            <tbody>
              {eLoading ? <tr><td colSpan={3} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>Loading...</td></tr> : expenses.length ? expenses.map((e:any) => (
                <tr key={e.id}>
                  <td><span className="mono-id">{e.type||'—'}</span></td>
                  <td style={{fontWeight:600,color:'#0f172a'}}>{e.vehicle?.regNo || e.vehicleId}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:'#dc2626'}}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                </tr>
              )) : <tr><td colSpan={3} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>No expense records</td></tr>}
            </tbody>
          </table>
          <div style={{padding:'12px 20px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:'#94a3b8'}}>{expenses.length} entries</span>
            <span style={{fontSize:12,fontWeight:700,color:'#0f172a',fontFamily:"'JetBrains Mono',monospace"}}>₹{totalOther.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      <div className="kpi-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><div className="kpi-label">Total Operational Cost</div></div>
        <div className="kpi-value" style={{color:'#dc2626'}}>₹{totalOpCost.toLocaleString('en-IN')}</div>
      </div>
    </>
  );
}

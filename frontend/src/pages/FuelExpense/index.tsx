import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function FuelExpense() {
  const queryClient = useQueryClient();

  const [fVehicle, setFVehicle] = useState('');
  const [fLiters, setFLiters]   = useState('');
  const [fCost, setFCost]       = useState('');

  const [eVehicle, setEVehicle] = useState('');
  const [eType, setEType]       = useState('MISC');
  const [eAmount, setEAmount]   = useState('');
  const [eDesc, setEDesc]       = useState('');

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'],     queryFn: () => api<any[]>('/vehicles') });
  const { data: fuelLogs = [], isLoading: fLoading } = useQuery({ queryKey: ['fuel'],     queryFn: () => api<any[]>('/fuel') });
  const { data: expenses  = [], isLoading: eLoading } = useQuery({ queryKey: ['expenses'], queryFn: () => api<any[]>('/expenses') });
  const { data: costSummary } = useQuery({ queryKey: ['cost-summary'], queryFn: () => api<any>('/operations/cost-summary') });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['fuel'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['cost-summary'] });
  };

  const fuelMut = useMutation({
    mutationFn: (data: any) => api('/fuel', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); setFVehicle(''); setFLiters(''); setFCost(''); },
    onError: (err: any) => alert(err.error || 'Failed to log fuel'),
  });

  const expMut = useMutation({
    mutationFn: (data: any) => api('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); setEVehicle(''); setEAmount(''); setEDesc(''); },
    onError: (err: any) => alert(err.error || 'Failed to add expense'),
  });

  const totalFuel  = fuelLogs.reduce((s: number, e: any) => s + Number(e.cost), 0);
  const totalOther = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalOpCost = costSummary?.vehicles?.reduce((sum: number, v: any) => sum + v.totalCost, 0) || (totalFuel + totalOther);

  return (
    <>
      {/* Input Forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Fuel Log Form */}
        <form className="card" onSubmit={e => { e.preventDefault(); fuelMut.mutate({ vehicleId: fVehicle, liters: Number(fLiters), cost: Number(fCost) }); }}>
          <div className="card-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
              <path d="M3 22V9a2 2 0 0 1 2-2h4V3l5 4v4h3v11H3z"/>
            </svg>
            <span className="card-title">Log Fuel</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Vehicle <span className="required">*</span></label>
              <select className="form-select" value={fVehicle} onChange={e => setFVehicle(e.target.value)} required>
                <option value="">Select vehicle…</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Liters <span className="required">*</span></label>
                <input className="form-input" type="number" min="0.1" step="0.1" value={fLiters} onChange={e => setFLiters(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Cost (₹) <span className="required">*</span></label>
                <input className="form-input" type="number" min="1" value={fCost} onChange={e => setFCost(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={fuelMut.isPending}>
              {fuelMut.isPending ? 'Saving…' : 'Log Fuel'}
            </button>
          </div>
        </form>

        {/* Expense Form */}
        <form className="card" onSubmit={e => { e.preventDefault(); expMut.mutate({ vehicleId: eVehicle, type: eType, amount: Number(eAmount), description: eDesc }); }}>
          <div className="card-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span className="card-title">Add Expense</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Vehicle <span className="required">*</span></label>
                <select className="form-select" value={eVehicle} onChange={e => setEVehicle(e.target.value)} required>
                  <option value="">Select…</option>
                  {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Type <span className="required">*</span></label>
                <select className="form-select" value={eType} onChange={e => setEType(e.target.value)} required>
                  <option value="TOLLS">Tolls</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="MISC">Misc</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Amount (₹) <span className="required">*</span></label>
                <input className="form-input" type="number" min="1" value={eAmount} onChange={e => setEAmount(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Description <span className="required">*</span></label>
                <input className="form-input" type="text" value={eDesc} onChange={e => setEDesc(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={expMut.isPending}>
              {expMut.isPending ? 'Saving…' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Fuel Logs */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header"><span className="card-title">Fuel Logs</span></div>
          <table className="data-table">
            <thead>
              <tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost</th></tr>
            </thead>
            <tbody>
              {fLoading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}><span style={{ color: 'var(--tx-muted)', fontSize: 12 }}>Loading…</span></td></tr>
              ) : fuelLogs.length > 0 ? fuelLogs.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600, color: 'var(--tx-primary)' }}>{e.vehicle?.regNo || e.vehicleId}</td>
                  <td><span className="mono-id" style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{e.liters || '—'} L</td>
                  <td><span className="mono-id" style={{ fontSize: 12, color: 'var(--status-red)' }}>₹{Number(e.cost).toLocaleString('en-IN')}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={4}><div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-state-body">No fuel records yet.</div></div></td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{fuelLogs.length} entries</span>
            <span className="mono-id" style={{ fontSize: 12, color: 'var(--tx-primary)' }}>₹{totalFuel.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Other Expenses */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header"><span className="card-title">Other Expenses</span></div>
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Vehicle</th><th>Description</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {eLoading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}><span style={{ color: 'var(--tx-muted)', fontSize: 12 }}>Loading…</span></td></tr>
              ) : expenses.length > 0 ? expenses.map((e: any) => (
                <tr key={e.id}>
                  <td><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--panel)', color: 'var(--tx-secondary)', border: '1px solid var(--border)' }}>{e.type || '—'}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--tx-primary)', fontSize: 12 }}>{e.vehicle?.regNo || e.vehicleId}</td>
                  <td style={{ fontSize: 12, color: 'var(--tx-muted)' }}>{e.description || '—'}</td>
                  <td><span className="mono-id" style={{ fontSize: 12, color: 'var(--status-red)' }}>₹{Number(e.amount).toLocaleString('en-IN')}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={4}><div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-state-body">No expense records yet.</div></div></td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{expenses.length} entries</span>
            <span className="mono-id" style={{ fontSize: 12, color: 'var(--tx-primary)' }}>₹{totalOther.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Total Cost Banner */}
      <div className="kpi-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="kpi-label">Total Operational Cost</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 3 }}>Fuel + Maintenance + Misc</div>
        </div>
        <div className="kpi-value" style={{ color: 'var(--status-red)', fontSize: 24, marginBottom: 0 }}>
          ₹{totalOpCost.toLocaleString('en-IN')}
        </div>
      </div>
    </>
  );
}

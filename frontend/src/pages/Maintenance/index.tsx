import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

const SERVICE_TYPES = ['Oil Change', 'Brake Inspection', 'Tyre Replace', 'Engine Repair', 'Full Service'];

export default function Maintenance() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const queryClient = useQueryClient();

  const [vehicle, setVehicle] = useState('');
  const [service, setService] = useState('Oil Change');
  const [cost, setCost]       = useState<number>(3500);

  const { data: records = [], isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: () => api<any[]>('/maintenance') });
  const { data: vehicles = [] }           = useQuery({ queryKey: ['vehicles'],    queryFn: () => api<any[]>('/vehicles') });

  const filtered = records.filter((r: any) => {
    if (!searchQuery) return true;
    return r.vehicleRegNo?.toLowerCase().includes(searchQuery.toLowerCase())
        || r.type?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const total = filtered.reduce((s: number, r: any) => s + Number(r.cost), 0);

  const createMutation = useMutation({
    mutationFn: (data: any) => api('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setVehicle(''); setService('Oil Change'); setCost(3500);
    },
    onError: (err: any) => alert(err.error || 'Failed to create record'),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api(`/maintenance/${id}/close`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: any) => alert(err.error || 'Failed to close record'),
  });

  return (
    <>
      <div className="maint-grid">
        {/* Form */}
        <form className="maint-form-card" onSubmit={e => { e.preventDefault(); createMutation.mutate({ vehicleId: vehicle, type: service, cost: Number(cost) }); }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx-primary)', marginBottom: 18, letterSpacing: '-0.02em' }}>Log Service Record</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Vehicle <span className="required">*</span></label>
              <select className="form-select" value={vehicle} onChange={e => setVehicle(e.target.value)} required>
                <option value="">Select vehicle…</option>
                {vehicles.filter((v: any) => v.status !== 'RETIRED').map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.status.replace(/_/g, ' ')})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Service Type <span className="required">*</span></label>
              <select className="form-select" value={service} onChange={e => setService(e.target.value)} required>
                {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cost (₹) <span className="required">*</span></label>
              <input className="form-input" type="number" min="0" value={cost || ''} onChange={e => setCost(Number(e.target.value))} placeholder="3500" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {createMutation.isPending ? 'Saving…' : 'Save Record'}
            </button>
          </div>

          {/* Status Flow */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 20 }}>
            <div className="form-section-title">Status Transitions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="pill pill-available">Available</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>creating record</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <span className="pill pill-inshop">In Shop</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="pill pill-inshop">In Shop</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>closing record</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <span className="pill pill-available">Available</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--status-amber)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              In Shop vehicles are removed from the dispatch pool.
            </div>
          </div>
        </form>

        {/* Service Log Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <span className="card-title">Service Log</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" aria-label="Filter records">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 6h18M7 12h10M10 18h4"/>
                </svg>
                Filter
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Vehicle</th><th>Service Type</th><th>Cost</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                  <span style={{ color: 'var(--tx-muted)', fontSize: 12 }}>Loading records…</span>
                </td></tr>
              ) : filtered.map((r: any) => (
                <tr key={r.id}>
                  <td><span className="mono-id">{r.vehicleRegNo}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--tx-secondary)' }}>{r.type}</td>
                  <td><span className="mono-id" style={{ fontSize: 12, color: 'var(--status-red)' }}>₹{Number(r.cost).toLocaleString('en-IN')}</span></td>
                  <td>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--tx-muted)' }}>
                      {new Date(r.openedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`pill ${r.status === 'OPEN' ? 'pill-inshop' : 'pill-completed'}`}>
                        {r.status === 'OPEN' ? 'In Shop' : 'Completed'}
                      </span>
                      {r.status === 'OPEN' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => closeMutation.mutate(r.id)}
                          disabled={closeMutation.isPending}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-title">No service records</div>
                    <div className="empty-state-body">Log a service using the form on the left.</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-primary)' }}>
              Total: <span className="mono-id" style={{ color: 'var(--status-red)' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

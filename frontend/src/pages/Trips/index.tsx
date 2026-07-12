import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

const STATUS_PILL: Record<string, string> = {
  DRAFT:      'pill-draft',
  DISPATCHED: 'pill-ontrip',
  COMPLETED:  'pill-completed',
  CANCELLED:  'pill-cancelled',
};

const STATUS_ACCENT: Record<string, string> = {
  DISPATCHED: 'var(--status-amber)',
  COMPLETED:  'var(--status-green)',
  CANCELLED:  'var(--status-red)',
  DRAFT:      'var(--border-mid)',
};

export default function Trips() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const queryClient = useQueryClient();

  const [filter, setFilter]           = useState('');
  const [source, setSource]           = useState('');
  const [dest, setDest]               = useState('');
  const [vehicle, setVehicle]         = useState('');
  const [driver, setDriver]           = useState('');
  const [cargo, setCargo]             = useState<number>(0);
  const [distance, setDistance]       = useState<number>(0);
  const [errorMsg, setErrorMsg]       = useState('');
  const [submitAction, setSubmitAction] = useState<'dispatch' | 'draft'>('dispatch');

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => api<any[]>('/trips'),
  });
  const { data: dispatchOptions } = useQuery({
    queryKey: ['dispatch-options'],
    queryFn: () => api<any>('/trips/dispatch-options'),
  });

  const vehicles = dispatchOptions?.vehicles || [];
  const drivers  = dispatchOptions?.drivers  || [];

  const filtered = trips.filter(t => {
    if (filter && t.status !== filter.toUpperCase()) return false;
    if (searchQuery && !t.id.toLowerCase().includes(searchQuery.toLowerCase()) && !t.destination.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const vData = vehicles.find((v: any) => v.id === vehicle);
  const capacity     = vData?.maxLoadKg || 0;
  const isOverCap    = cargo > capacity && capacity > 0;
  const isOkCap      = cargo > 0 && cargo <= capacity;

  const invalidateTrips = () => {
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    queryClient.invalidateQueries({ queryKey: ['dispatch-options'] });
  };

  const createMutation = useMutation({
    mutationFn: (t: any) => api('/trips', { method: 'POST', body: JSON.stringify(t) }),
    onSuccess: () => { invalidateTrips(); setSource(''); setDest(''); setVehicle(''); setDriver(''); setCargo(0); setDistance(0); setErrorMsg(''); },
    onError: (err: any) => setErrorMsg(err.message || err.error || 'Failed to create trip'),
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api(`/trips/${id}/dispatch`, { method: 'POST' }),
    onSuccess: invalidateTrips,
    onError: (err: any) => setErrorMsg(err.message || err.error || 'Failed to dispatch trip'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api(`/trips/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidateTrips,
    onError: (err: any) => alert(err.message || err.error || 'Failed to complete trip'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api(`/trips/${id}/cancel`, { method: 'POST' }),
    onSuccess: invalidateTrips,
    onError: (err: any) => alert(err.message || err.error || 'Failed to cancel trip'),
  });

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = { source, destination: dest, vehicleId: vehicle, driverId: driver, cargoWeightKg: cargo, plannedDistance: distance };
    if (submitAction === 'dispatch') {
      createMutation.mutate(t, { onSuccess: (data: any) => dispatchMutation.mutate(data.id) });
    } else {
      createMutation.mutate(t);
    }
  }

  function doComplete(id: string) {
    const odo  = prompt('Final Odometer reading?', '50000'); if (!odo) return;
    const fuel = prompt('Fuel consumed (L)?', '15');          if (!fuel) return;
    const cost = prompt('Fuel Cost (₹)?', '1500');            if (!cost) return;
    const rev  = prompt('Revenue (₹)?', '10000');             if (!rev) return;
    completeMutation.mutate({ id, data: { finalOdometer: Number(odo), fuelConsumedL: Number(fuel), fuelCost: Number(cost), revenue: Number(rev) } });
  }

  const lcSteps = [
    { key: 'DRAFT',     label: 'Draft',      count: trips.filter(t => t.status === 'DRAFT').length },
    { key: 'DISPATCHED', label: 'Dispatched', count: trips.filter(t => t.status === 'DISPATCHED').length },
    { key: 'COMPLETED', label: 'Completed',  count: trips.filter(t => t.status === 'COMPLETED').length },
    { key: 'CANCELLED', label: 'Cancelled',  count: trips.filter(t => t.status === 'CANCELLED').length },
  ];

  return (
    <>
      {/* Lifecycle Stepper */}
      <div className="lifecycle" aria-label="Trip lifecycle filter">
        {lcSteps.map((step, i) => {
          const isActive = filter === step.key;
          const hasDone  = step.count > 0 && !isActive;
          const isCancelled = step.key === 'CANCELLED';
          return (
            <div
              key={step.key}
              className={`lc-step${isActive ? ' active' : ''}${hasDone && !isCancelled ? ' done' : ''}${isCancelled && step.count > 0 ? ' cancelled' : ''}`}
              onClick={() => setFilter(filter === step.key ? '' : step.key)}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
            >
              <div className="lc-dot">{step.count > 0 ? step.count : i + 1}</div>
              <div className="lc-label">{step.label}</div>
            </div>
          );
        })}
      </div>

      <div className="dispatch-grid">
        {/* Create Form */}
        <div>
          <form className="create-form" onSubmit={handleFormSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx-primary)', letterSpacing: '-0.02em' }}>Create Trip</div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Source <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="Origin city / depot" value={source} onChange={e => setSource(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Destination <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="Destination" value={dest} onChange={e => setDest(e.target.value)} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">
                Vehicle <span style={{ color: 'var(--tx-muted)', fontWeight: 400 }}>(available only)</span> <span className="required">*</span>
              </label>
              <select className="form-select" value={vehicle} onChange={e => setVehicle(e.target.value)} required>
                <option value="">Select vehicle…</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name} — {v.maxLoadKg}kg</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">
                Driver <span style={{ color: 'var(--tx-muted)', fontWeight: 400 }}>(available only)</span> <span className="required">*</span>
              </label>
              <select className="form-select" value={driver} onChange={e => setDriver(e.target.value)} required>
                <option value="">Select driver…</option>
                {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.licenseNo}</option>)}
              </select>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Cargo Weight (kg) <span className="required">*</span></label>
                <input type="number" min="1" className={`form-input${isOverCap ? ' error' : ''}`} value={cargo || ''} onChange={e => setCargo(Number(e.target.value))} required />
                {isOverCap && <span className="form-error">Exceeds vehicle capacity of {capacity}kg</span>}
                {isOkCap   && <span style={{ fontSize: 11.5, color: 'var(--status-green)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  Capacity OK
                </span>}
              </div>
              <div className="form-group">
                <label className="form-label">Planned Distance (km) <span className="required">*</span></label>
                <input type="number" min="1" className="form-input" value={distance || ''} onChange={e => setDistance(Number(e.target.value))} required />
              </div>
            </div>

            {errorMsg && (
              <div className="alert-banner alert-red" style={{ marginTop: 12, marginBottom: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="submit"
                disabled={isOverCap}
                onClick={() => setSubmitAction('dispatch')}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Dispatch Trip
              </button>
              <button
                type="submit"
                onClick={() => setSubmitAction('draft')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Save Draft
              </button>
            </div>
          </form>

          {/* Business Rules */}
          <div className="biz-rules">
            <div className="biz-title">Business Rules</div>
            <div className="biz-rule">On dispatch: Vehicle &amp; Driver → <span className="status-highlight on-trip">On Trip</span></div>
            <div className="biz-rule">On complete: Odometer &amp; fuel recorded — status → <span className="status-highlight avail">Available</span></div>
            <div className="biz-rule">On cancel: Vehicle &amp; Driver restored to <span className="status-highlight avail">Available</span></div>
            <div className="biz-rule">Cargo exceeding vehicle capacity blocks dispatch</div>
          </div>
        </div>

        {/* Live Board */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx-primary)', letterSpacing: '-0.02em' }}>Live Board</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>
                {filter ? `Showing: ${filter}` : 'All trips'} · Click a lifecycle step to filter
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={invalidateTrips}
              aria-label="Refresh trips"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
          </div>

          <div className="live-board">
            {tripsLoading ? (
              <div className="empty-state"><div className="empty-state-body">Loading trips…</div></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No trips{filter ? ` with status ${filter}` : ''}</div>
                <div className="empty-state-body">Create a trip using the form on the left.</div>
              </div>
            ) : filtered.map(t => (
              <div
                key={t.id}
                className={`lb-card${t.status === 'DISPATCHED' ? ' selected' : ''}`}
                style={{ borderLeft: `3px solid ${STATUS_ACCENT[t.status] || 'var(--border)'}`, opacity: t.status === 'CANCELLED' ? 0.65 : 1 }}
              >
                <div className="lb-card-header">
                  <div className="lb-trip-id">{t.id}</div>
                  <span className={`pill ${STATUS_PILL[t.status] || 'pill-draft'}`}>
                    {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="lb-route">{t.source} → {t.destination}</div>
                <div className="lb-meta">
                  <div>
                    <div className="lb-vehicle">{t.vehicle?.name || t.vehicleId}</div>
                    {t.driver && (
                      <div className="lb-driver">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        {t.driver?.name || t.driverId}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {t.status === 'DISPATCHED' && <div className="lb-eta">In Transit</div>}
                    {t.status === 'DISPATCHED' && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--status-green)' }} onClick={() => doComplete(t.id)}>Complete</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--status-red)' }} onClick={() => cancelMutation.mutate(t.id)}>Cancel</button>
                      </div>
                    )}
                    {t.status === 'DRAFT' && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => dispatchMutation.mutate(t.id)}>Dispatch</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--status-red)' }} onClick={() => cancelMutation.mutate(t.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

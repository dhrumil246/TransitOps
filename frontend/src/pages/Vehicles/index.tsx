import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

// ── Formatters ──
const FMT_COST = (n: number) => '₹' + Number(n).toLocaleString('en-IN');
const FMT_ODO  = (n: number) => Number(n).toLocaleString('en-IN') + ' km';
const FMT_CAP  = (n: number) => n >= 1000 ? (n / 1000) + ' Ton' : n + ' kg';
const FMT_STATUS = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const FMT_TYPE = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

// ── Status pill class ──
const STATUS_PILL: Record<string, string> = {
  AVAILABLE: 'pill-available',
  ON_TRIP:   'pill-ontrip',
  IN_SHOP:   'pill-inshop',
  RETIRED:   'pill-retired',
};

// ── Modal overlay wrapper ──
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 520, width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.2)' }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx-primary)', letterSpacing: '-0.02em' }}>{title}</h2>
      <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
    </div>
  );
}

export default function Vehicles() {
  const context = useOutletContext<{ searchQuery: string }>();
  const searchQuery = context?.searchQuery || '';
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api<any[]>('/vehicles'),
  });

  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isAddOpen, setIsAddOpen]     = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Add form fields
  const [mReg, setMReg]         = useState('');
  const [mName, setMName]       = useState('');
  const [mModel, setMModel]     = useState('');
  const [mType, setMType]       = useState('Van');
  const [mSubtype, setMSubtype] = useState('');
  const [mCapacity, setMCapacity] = useState('');
  const [mCost, setMCost]       = useState('');
  const [mOdo, setMOdo]         = useState('');

  // Status edit
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [newStatus, setNewStatus]   = useState<string | null>(null);

  const filtered = vehicles.filter(v => {
    const q = search || searchQuery;
    if (q && !v.name.toLowerCase().includes(q.toLowerCase()) && !v.regNo.toLowerCase().includes(q.toLowerCase())) return false;
    if (filterType   && v.type   !== filterType.toUpperCase()) return false;
    if (filterStatus && v.status !== filterStatus.toUpperCase().replace(' ', '_')) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (v: any) => api('/vehicles', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsAddOpen(false);
      setMReg(''); setMName(''); setMModel(''); setMSubtype(''); setMCapacity(''); setMCost(''); setMOdo('');
    },
    onError: (err: any) => alert(err.error || 'Failed to create vehicle'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); setIsStatusOpen(false); },
    onError: (err: any) => alert(err.error || 'Failed to update vehicle'),
  });

  function saveVehicle(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ regNo: mReg, name: mName, type: mType.toUpperCase(), maxLoadKg: Number(mCapacity), acquisitionCost: Number(mCost), odometer: Number(mOdo) || 0, status: 'AVAILABLE' });
  }

  function applyStatusChange() {
    if (!editingId || !newStatus) return;
    updateMutation.mutate({ id: editingId, data: { status: newStatus.toUpperCase().replace(' ', '_') } });
  }

  function exportCSV() {
    const csv = [
      ['RegNo', 'Name', 'Type', 'Capacity', 'Cost', 'Odo', 'Status'].join(','),
      ...filtered.map(v => [v.regNo, v.name, v.type, v.maxLoadKg, v.acquisitionCost, v.odometer, v.status].join(',')),
    ].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'vehicles.csv';
    a.click();
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="filter-chip"
          aria-label="Filter by type"
          style={{ appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
        >
          <option value="">Type: All</option>
          <option>Van</option><option>Truck</option><option>Mini</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="filter-chip"
          aria-label="Filter by status"
          style={{ appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
        >
          <option value="">Status: All</option>
          <option>Available</option><option>On Trip</option><option>In Shop</option><option>Retired</option>
        </select>
        <input
          type="text"
          placeholder="Search by name or reg. no."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="filter-chip"
          style={{ width: 200, cursor: 'text' }}
          aria-label="Search vehicles"
        />
        <div className="filter-spacer" />
        <span style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 500 }}>
          {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Reg. No.</th>
              <th>Name &amp; Model</th>
              <th>Type</th>
              <th>Sub-Type</th>
              <th>Capacity</th>
              <th>Acq. Cost</th>
              <th>Odometer</th>
              <th>Status</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48 }}><span style={{ color: 'var(--tx-muted)', fontSize: 13 }}>Loading fleet data…</span></td></tr>
            ) : filtered.map(v => (
              <tr key={v.id}>
                <td><span className="mono-id">{v.regNo}</span></td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--tx-primary)', fontSize: 13 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 1 }}>{v.model}</div>
                </td>
                <td style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-secondary)' }}>{FMT_TYPE(v.type)}</td>
                <td style={{ fontSize: 12, color: 'var(--tx-muted)' }}>{v.subtype || '—'}</td>
                <td><span className="mono-id" style={{ fontSize: 12 }}>{FMT_CAP(v.maxLoadKg)}</span></td>
                <td><span className="mono-id" style={{ fontSize: 12 }}>{FMT_COST(v.acquisitionCost)}</span></td>
                <td><span className="mono-id" style={{ fontSize: 12 }}>{FMT_ODO(v.odometer)}</span></td>
                <td><span className={`pill ${STATUS_PILL[v.status] || 'pill-draft'}`}>{FMT_STATUS(v.status)}</span></td>
                <td>
                  <button
                    onClick={() => { setEditingId(v.id); setNewStatus(FMT_STATUS(v.status)); setIsStatusOpen(true); }}
                    aria-label={`Edit status for ${v.name}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-muted)')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <div className="empty-state-title">No vehicles found</div>
                  <div className="empty-state-body">Try adjusting your filters or add a new vehicle.</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>
            Reg. No. must be unique. Retired / In Shop vehicles are excluded from Trip Dispatcher.
          </span>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isAddOpen && (
        <Modal onClose={() => setIsAddOpen(false)}>
          <ModalHeader title="Add Vehicle" onClose={() => setIsAddOpen(false)} />
          <form onSubmit={saveVehicle}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Registration No. <span className="required">*</span></label>
                <input className="form-input" value={mReg} onChange={e => setMReg(e.target.value)} placeholder="e.g. GJ01AB1234" required />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Name <span className="required">*</span></label>
                <input className="form-input" value={mName} onChange={e => setMName(e.target.value)} placeholder="e.g. Van-06" required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Make &amp; Model <span className="required">*</span></label>
              <input className="form-input" value={mModel} onChange={e => setMModel(e.target.value)} placeholder="e.g. Tata Prima" required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Type <span className="required">*</span></label>
                <select className="form-select" value={mType} onChange={e => setMType(e.target.value)} required>
                  <option>Van</option><option>Truck</option><option>Mini</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-Type</label>
                <input className="form-input" value={mSubtype} onChange={e => setMSubtype(e.target.value)} placeholder="e.g. Standard" />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Capacity (kg) <span className="required">*</span></label>
                <input className="form-input" type="number" min="1" value={mCapacity} onChange={e => setMCapacity(e.target.value)} placeholder="500" required />
              </div>
              <div className="form-group">
                <label className="form-label">Acq. Cost (₹) <span className="required">*</span></label>
                <input className="form-input" type="number" min="0" value={mCost} onChange={e => setMCost(e.target.value)} placeholder="430000" required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Odometer (km)</label>
              <input className="form-input" type="number" min="0" value={mOdo} onChange={e => setMOdo(e.target.value)} placeholder="0" />
              <span className="form-hint">Leave blank for new vehicles</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsAddOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Change Modal */}
      {isStatusOpen && (
        <Modal onClose={() => setIsStatusOpen(false)}>
          <ModalHeader title="Change Vehicle Status" onClose={() => setIsStatusOpen(false)} />
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: 'var(--tx-muted)', fontFamily: 'var(--mono)' }}>{editingId}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {['Available', 'On Trip', 'In Shop', 'Retired'].map(st => (
              <button
                key={st}
                onClick={() => setNewStatus(st)}
                style={{
                  padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: '1px solid', cursor: 'pointer',
                  background: newStatus === st ? 'var(--brand)' : 'var(--surface)',
                  color: newStatus === st ? '#fff' : 'var(--tx-secondary)',
                  borderColor: newStatus === st ? 'var(--brand)' : 'var(--border)',
                  transition: 'all 0.12s',
                }}
              >{st}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setIsStatusOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={applyStatusChange} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Applying…' : 'Apply Change'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

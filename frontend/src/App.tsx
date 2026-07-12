import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Settings from './pages/Settings';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpense from './pages/FuelExpense';
import Reports from './pages/Reports';
import { Sidebar } from './components/layout/Sidebar';
import { initMockData } from './utils/mockData';

const queryClient = new QueryClient();

function getSession() {
  try { return JSON.parse(localStorage.getItem('to_session') || 'null'); } catch { return null; }
}

const PAGE_TITLES: Record<string, { title: string; breadcrumb: string }> = {
  '/dashboard': { title: 'Dashboard', breadcrumb: 'Command' },
  '/vehicles': { title: 'Vehicle Registry', breadcrumb: 'Fleet Management' },
  '/drivers': { title: 'Drivers & Safety', breadcrumb: 'Fleet Management' },
  '/trips': { title: 'Trip Dispatcher', breadcrumb: 'Operations' },
  '/maintenance': { title: 'Maintenance', breadcrumb: 'Operations' },
  '/fuel-expenses': { title: 'Fuel & Expenses', breadcrumb: 'Operations' },
  '/analytics': { title: 'Analytics & Reports', breadcrumb: 'Intelligence' },
  '/settings': { title: 'Settings', breadcrumb: 'System' },
};

function Topbar({ search, setSearch }: { search: string; setSearch: (v:string)=>void }) {
  const location = useLocation();
  const info = PAGE_TITLES[location.pathname] || { title: 'TransitOps', breadcrumb: '' };
  const now = new Date();
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="breadcrumb">{info.breadcrumb}</div>
        <div className="page-title">{info.title}</div>
      </div>
      <div className="topbar-right">
        <div className="search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Search fleet, drivers, trips..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="topbar-date">
          <span style={{fontWeight:700,color:'#475569'}}>{now.toLocaleDateString('en-IN',{weekday:'short',day:'numeric'})}</span>
          <span>{now.toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</span>
        </div>
        <div style={{position:'relative',cursor:'pointer'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <div style={{position:'absolute',top:-2,right:-2,width:8,height:8,background:'#dc2626',borderRadius:'50%',border:'2px solid #f0efea'}}></div>
        </div>
      </div>
    </div>
  );
}

function Layout() {
  const [searchQuery, setSearchQuery] = React.useState('');
  return (
    <div style={{display:'flex',minHeight:'100vh',width:'100%'}}>
      <Sidebar />
      <div className="main-content" style={{flex:1, minWidth:0}}>
        <Topbar search={searchQuery} setSearch={setSearchQuery} />
        <div className="page-body">
          <Outlet context={{ searchQuery }} />
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  initMockData();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/fuel-expenses" element={<FuelExpense />} />
            <Route path="/analytics" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

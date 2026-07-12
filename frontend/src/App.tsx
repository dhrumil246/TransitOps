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
  '/dashboard':    { title: 'Dashboard',          breadcrumb: 'Command' },
  '/vehicles':     { title: 'Vehicle Registry',   breadcrumb: 'Fleet Management' },
  '/drivers':      { title: 'Drivers & Safety',   breadcrumb: 'Fleet Management' },
  '/trips':        { title: 'Trip Dispatcher',    breadcrumb: 'Operations' },
  '/maintenance':  { title: 'Maintenance',        breadcrumb: 'Operations' },
  '/fuel-expenses':{ title: 'Fuel & Expenses',    breadcrumb: 'Operations' },
  '/analytics':    { title: 'Analytics & Reports', breadcrumb: 'Intelligence' },
  '/settings':     { title: 'Settings',           breadcrumb: 'System' },
};

function Topbar({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const location = useLocation();
  const info = PAGE_TITLES[location.pathname] || { title: 'TransitOps', breadcrumb: '' };
  const now = new Date();

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <div className="breadcrumb">{info.breadcrumb}</div>
        <h1 className="page-title">{info.title}</h1>
      </div>
      <div className="topbar-right">
        <label className="search-bar" htmlFor="global-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="global-search"
            type="text"
            placeholder="Search fleet, drivers, trips…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search fleet, drivers and trips"
          />
        </label>
        <div className="topbar-date" aria-label="Current date">
          <span className="date-day">{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}</span>
          <span>{now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
        </div>
        <button className="topbar-icon-btn" aria-label="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span className="notif-dot" aria-hidden="true"></span>
        </button>
      </div>
    </header>
  );
}

function Layout() {
  const [searchQuery, setSearchQuery] = React.useState('');
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <div className="main-content">
        <Topbar search={searchQuery} setSearch={setSearchQuery} />
        <main className="page-body">
          <Outlet context={{ searchQuery }} />
        </main>
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
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/vehicles"     element={<Vehicles />} />
            <Route path="/drivers"      element={<Drivers />} />
            <Route path="/trips"        element={<Trips />} />
            <Route path="/maintenance"  element={<Maintenance />} />
            <Route path="/fuel-expenses" element={<FuelExpense />} />
            <Route path="/analytics"    element={<Reports />} />
            <Route path="/settings"     element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

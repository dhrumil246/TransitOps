import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

export default function Login() {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: pass })
      });
      localStorage.setItem('to_token', res.token);
      localStorage.setItem('to_session', JSON.stringify({
        initials: res.user.name.substring(0, 2).toUpperCase(),
        name: res.user.name,
        role: res.user.role
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setErr(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen bg-canvas">
      <div className="flex-1 flex flex-col justify-center px-16 lg:px-32 relative overflow-hidden">
        <div className="z-10 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-orange-600 text-white flex items-center justify-center font-bold text-xl">T</div>
            <div className="text-2xl font-bold text-white tracking-tight">TransitOps</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-muted">Enter your credentials to access the command center.</p>
        </div>

        <form onSubmit={handleLogin} className="z-10 w-full max-w-sm space-y-5">
          {err && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm font-medium">
              {err}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted mb-2">Password</label>
            <input 
              type="password" 
              value={pass} 
              onChange={e => setPass(e.target.value)}
              placeholder="demo1234"
              className="w-full h-11 px-4 rounded-lg bg-panel border border-border text-sm text-primary focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">Sign In</Button>
        </form>
      </div>
      <div className="hidden lg:block lg:flex-1 bg-panel border-l border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 border border-border/50 rounded-full flex items-center justify-center">
            <div className="w-64 h-64 border border-border/50 rounded-full flex items-center justify-center">
              <div className="w-32 h-32 bg-brand/20 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

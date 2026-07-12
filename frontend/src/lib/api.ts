const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
import { mockResolve } from './mocks';

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (USE_MOCKS) return mockResolve<T>(path, opts);
  
  const token = localStorage.getItem('to_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { ...headers, ...opts.headers },
  });
  
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw errorBody;
  }
  return res.json();
}

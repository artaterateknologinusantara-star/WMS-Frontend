'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ username, password });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f172a' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-5">
            <AppLogo size={52} />
            <div className="text-left">
              <p className="text-white font-bold text-xl tracking-tight">SYNTERA WMS</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Warehouse Management System</p>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-7" style={{ background: '#1e293b', borderColor: '#334155' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#94a3b8' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white transition-colors outline-none"
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#f1f5f9',
                }}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#334155')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#94a3b8' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm transition-colors outline-none"
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f1f5f9',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.target.style.borderColor = '#334155')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm px-4 py-2.5 rounded-lg" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-colors flex items-center justify-center gap-2 mt-1"
              style={{ background: submitting ? '#1d4ed8' : '#3b82f6', opacity: submitting ? 0.8 : 1 }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider + hint */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid #334155' }}>
            <p className="text-center text-xs" style={{ color: '#64748b' }}>
              Default credentials:&nbsp;
              <span style={{ color: '#94a3b8' }}>admin</span>
              &nbsp;/&nbsp;
              <span style={{ color: '#94a3b8' }}>Admin@123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#475569' }}>
          © 2026 Artatera · Syntera WMS Enterprise
        </p>
      </div>
    </div>
  );
}

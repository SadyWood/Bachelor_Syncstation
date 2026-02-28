import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import { useAuth } from '../state/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login({ email, password });
      nav('/start', { replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ws-page-bg)] px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-4">
          <img src="/hoolsy_logo.png" alt="Hoolsy" className="h-12 w-auto mb-2 object-contain" />
          <h1 className="text-lg font-semibold" style={{ color: 'var(--ws-text)' }}>
            Hoolsy Workstation
          </h1>
        </div>

        {/* Card (uten header) */}
        <form className="ws-card" onSubmit={onSubmit}>
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-semibold">Sign in</h2>

            <div className="space-y-1">
              <label className="text-xs ws-muted">Email</label>
              <input
                className="ws-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs ws-muted">Password</label>
              <input
                className="ws-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs ws-muted">
                <input type="checkbox" className="rounded border-[var(--ws-border-light)]" />
                Remember me
              </label>
              <a className="text-xs ws-muted hover:underline" href="#">
                Forgot?
              </a>
            </div>

            {err && <div className="ws-alert ws-alert-error text-sm">{err}</div>}
            <div className="pt-2">
              <Button appearance="solid" size="md" className="w-full" loading={busy}>
                Login
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

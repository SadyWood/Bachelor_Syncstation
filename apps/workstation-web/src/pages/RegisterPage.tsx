import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import * as api from '../lib/auth-client';
import { useAuth } from '../state/AuthContext';

const RegisterPage: React.FC = () => {
  const [params] = useSearchParams();
  // Prefer ?invite=..., but keep ?token=... as a fallback for older links
  const token = params.get('invite') ?? params.get('token') ?? '';
  const { register } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<{
    email: string;
    platform?: string;
    isAvailable?: boolean;
    state?: 'available' | 'expired' | 'consumed' | 'revoked';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);

  const orgLabel = useMemo(() => invite?.platform ?? 'Hoolsy', [invite]);

  useEffect(() => {
    (async () => {
      if (!token || token.length < 16) {
        setError('Missing or invalid invite code.');
        setLoading(false);
        return;
      }
      try {
        const info = await api.invitePreview(token);
        setInvite({
          email: info.email,
          platform: info.platform,
          isAvailable: info.isAvailable,
          state: info.state as 'available' | 'expired' | 'consumed' | 'revoked',
        });
        if (info.isAvailable === false) {
          const errorMessages: Record<string, string> = {
            expired: 'Invite code has expired.',
            consumed: 'Invite code has already been used.',
            revoked: 'Invite code has been revoked.',
          };
          setError(errorMessages[info.state] || 'Invite not available.');
        }
      } catch {
        setError('Invite not found or expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!invite) return;
    if (!agree) {
      setError('Please accept the terms.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ') || ' ';
    try {
      await register({
        token,
        email: invite.email,
        firstName: firstName || 'User',
        lastName,
        displayName: fullName.trim() || undefined,
        password,
      });
      navigate('/start', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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

        {/* Card */}
        <form className="ws-card" onSubmit={onSubmit}>
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-semibold">Create account</h2>

            {loading && <div className="ws-alert ws-alert-info text-xs">Validating invite…</div>}
            {error && <div className="ws-alert ws-alert-error text-xs">{error}</div>}
            {invite && invite.isAvailable !== false && (
              <div className="ws-alert ws-alert-success">
                <div className="text-xs">
                  Invited to <strong>{orgLabel}</strong>
                </div>
              </div>
            )}
            {invite && invite.isAvailable === false && (
              <div className="ws-alert ws-alert-error text-xs">
                {error ?? 'Invite not available.'}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs ws-muted">Full name</label>
              <input
                className="ws-input"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Låst e-postfelt */}
            <div className="space-y-1">
              <label className="text-xs ws-muted">Email (locked)</label>
              <input
                className="ws-input opacity-75 cursor-not-allowed"
                type="email"
                value={invite?.email ?? ''}
                readOnly
                disabled
              />
              <p className="text-[11px] ws-muted">Invite-only: e-post kan ikke endres.</p>
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

            <div className="space-y-1">
              <label className="text-xs ws-muted">Confirm password</label>
              <input
                className="ws-input"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-xs ws-muted pt-1">
              <input
                type="checkbox"
                className="rounded border-[var(--ws-border-light)]"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              I agree to the Terms & Privacy
            </label>

            <div className="pt-2">
              <Button
                appearance="solid"
                size="md"
                className="w-full"
                disabled={!invite || loading || invite.isAvailable === false}
              >
                Create account
              </Button>
            </div>

            <p className="text-center text-xs ws-muted">
              Already have an account?{' '}
              <a href="/login" className="hover:underline">
                Login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

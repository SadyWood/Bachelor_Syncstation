// src/components/Permissions/PermissionGate.tsx
import React from 'react';
import MissingPermissionNotice from './MissingPermissionNotice';
import { httpJson } from '../../lib/http';
import { useAuth } from '../../state/AuthContext';

/**
 * Client-side permission gate:
 * - Calls /auth/can?perm=... (uses current tenant header automatically)
 * - Renders children if allowed, otherwise a consistent missing-permission notice.
 */
type Props = {
  perm: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function PermissionGate({ perm, children, fallback }: Props) {
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  const { accessLoaded, currentTenantId } = useAuth();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Don't check permissions before we know which tenant is active (otherwise: false "deny")
        if (!accessLoaded || !currentTenantId) {
          setAllowed(null);
          return;
        }
        const { ok, data } = await httpJson<{ ok: true; allowed: boolean; perm: string }>(
          `/auth/can?perm=${encodeURIComponent(perm)}`,
          { method: 'GET' },
        );
        if (!ok) throw new Error('Permission probe failed');
        if (alive) setAllowed(Boolean(data?.allowed));
      } catch {
        if (alive) {
          setAllowed(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [perm, accessLoaded, currentTenantId]);

  if (allowed === null) {
    return (
      <div className="ws-alert ws-alert-info">
        <div className="text-sm">Checking permissions…</div>
      </div>
    );
  }
  if (!allowed) {
    if (fallback) return fallback;
    return <MissingPermissionNotice perm={perm} />;
  }
  return children;
}

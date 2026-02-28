// src/state/AuthContext.tsx
import { createLogger } from '@hoolsy/logger';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../lib/auth-client';
import { setCurrentTenantId as setHttpTenantId } from '../lib/http';
import { canFromEffective, type EffectivePerms } from '../utils/permissions';
import type { PublicUser, LoginBody, RegisterBody } from '@hk26/schema';

const logger = createLogger('AuthContext');

type Membership = { tenantId?: string; nodeId?: string | null; role?: string };

type AuthState = {
  user: PublicUser | null;
  currentTenantInfo?: { id: string; code: string; name: string } | null;
  currentTenantId?: string | null;
  memberships?: Membership[];
  /** Effective permissions for the active tenant (allow/deny patterns) */
  effectivePerms?: EffectivePerms;

  /** True when the first /me has finished (regardless of auth) */
  accessLoaded: boolean;
  /** True when we have a valid session */
  isAuthed: boolean;

  // Helpers
  can: (perm: string) => boolean;

  // Actions
  login: (payload: LoginBody) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterBody) => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [currentTenantInfo, setCurrentTenantInfo] = useState<AuthState['currentTenantInfo']>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[] | undefined>(undefined);
  const [effectivePerms, setEffectivePerms] = useState<EffectivePerms | undefined>(undefined);

  async function loadMe() {
    const me = await api.me();
    setUser(me.user);

    // Prefer explicit currentTenantInfo.id (server provides it when x-ws-tenant resolves)
    const tenantId = me.currentTenantInfo?.id ?? me.currentTenant ?? null;
    setCurrentTenantId(tenantId);
    setCurrentTenantInfo(me.currentTenantInfo ?? null);
    setMemberships(me.memberships ?? undefined);

    // Ensure x-ws-tenant is sent on subsequent requests
    setHttpTenantId(tenantId);

    // Server can include an "effectivePermissions" snapshot when x-ws-tenant is set
    const eff = me.effectivePermissions as { allow?: string[]; deny?: string[] } | undefined;
    if (eff && (Array.isArray(eff.allow) || Array.isArray(eff.deny))) {
      setEffectivePerms({ allow: eff.allow || [], deny: eff.deny || [] });
    } else {
      setEffectivePerms(undefined);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        // Try to refresh access token from httpOnly cookie first
        // This handles the case where we have a valid refresh token but no access token (e.g., after page refresh)
        try {
          await api.refresh();
        } catch {
          // If refresh fails, that's ok - we'll try /me anyway
          // /me will attempt another refresh if needed
        }

        await loadMe();
      } catch (err) {
        // Only log out if we actually got an error (not just unauthenticated)
        logger.debug(
          'Auth initialization failed:',
          err instanceof Error ? err.message : 'Unknown error',
        );
        setUser(null);
        setHttpTenantId(null);
        setCurrentTenantId(null);
      } finally {
        setAccessLoaded(true);
      }
    })();
  }, []);

  // can(): deny > allow via EffectivePerms if available; fallback: Admin role grants all
  const can = useMemo(
    () => (perm: string) => {
      if (effectivePerms) return canFromEffective(effectivePerms, perm);
      if (memberships?.some((m) => m.role === 'Admin')) return true;
      return false;
    },
    [effectivePerms, memberships],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      currentTenantInfo,
      currentTenantId,
      memberships,
      effectivePerms,
      accessLoaded,
      isAuthed: !!user,
      can,

      login: async (payload) => {
        await api.login(payload);
        await loadMe();
      },

      logout: async () => {
        await api.logout();
        setUser(null);
        setCurrentTenantInfo(null);
        setMemberships(undefined);
        setEffectivePerms(undefined);
        setCurrentTenantId(null);
        setHttpTenantId(null);
      },

      register: async (payload) => {
        await api.register(payload);
        await loadMe();
      },
    }),
    [user, currentTenantInfo, currentTenantId, memberships, effectivePerms, accessLoaded, can],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

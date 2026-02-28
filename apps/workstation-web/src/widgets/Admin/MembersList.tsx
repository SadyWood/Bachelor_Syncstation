import { Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { listMembers, type WsMember } from '../../lib/ws-client';
import { useAuth } from '../../state/AuthContext';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

type SortKey = 'firstName' | 'lastName' | 'email' | 'since' | 'status';

function statusBadge(s: WsMember['status']): string {
  const badges: Record<WsMember['status'], string> = {
    active: 'ws-badge ws-badge-success',
    pending: 'ws-badge ws-badge-warning',
    disabled: 'ws-badge ws-badge-error',
    removed: 'ws-badge ws-badge-error',
  };
  return badges[s] || 'ws-badge ws-badge-error';
}

export default function MembersWidget({ title, onClose, ...props }: WidgetProps) {
  const { currentTenantInfo } = useAuth();
  const tenantId = currentTenantInfo?.id ?? '';

  // Fetch members with useSWR - automatic caching and revalidation
  const {
    data: rows = [],
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<WsMember[]>(
    tenantId ? `/api/tenants/${tenantId}/members` : null,
    () => listMembers(tenantId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Dedupe requests within 30s
    },
  );

  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('firstName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Convert SWR error to string for display
  let err: string | null = null;
  if (swrError) {
    err = swrError instanceof Error ? swrError.message : 'Failed to load members';
  }

  // Listen for refresh events
  useEffect(() => {
    const h = () => mutate();
    window.addEventListener('admin:refreshMembers', h);
    return () => window.removeEventListener('admin:refreshMembers', h);
  }, [mutate]);

  function select(r: WsMember) {
    setSelectedId(r.userId);
    window.dispatchEvent(new CustomEvent('admin:selectMember', { detail: r }));
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filteredSorted = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const filtered = qq
      ? rows.filter(
        (r) =>
          r.firstName.toLowerCase().includes(qq) ||
            r.lastName.toLowerCase().includes(qq) ||
            r.email.toLowerCase().includes(qq),
      )
      : rows.slice();

    const cmp = (a: string | null | undefined, b: string | null | undefined) =>
      (a ?? '').localeCompare(b ?? '');

    filtered.sort((a, b) => {
      let v = 0;
      switch (sortKey) {
        case 'since':
          v = cmp(a.since ?? '', b.since ?? '');
          break;
        case 'firstName':
          v = cmp(a.firstName, b.firstName);
          break;
        case 'lastName':
          v = cmp(a.lastName, b.lastName);
          break;
        case 'email':
          v = cmp(a.email, b.email);
          break;
        case 'status':
          v = cmp(a.status, b.status);
          break;
        default:
          v = 0;
          break;
      }
      return sortDir === 'asc' ? v : -v;
    });

    return filtered;
  }, [rows, q, sortKey, sortDir]);

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={Users} {...props}>
      <div className="p-3 h-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            className="ws-input"
            placeholder="Search members…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="ws-btn ws-btn-sm ws-btn-outline" onClick={() => mutate()}>
            Refresh
          </button>
        </div>

        {err && <div className="ws-alert ws-alert-error text-xs">{err}</div>}
        {isLoading && <div className="ws-alert ws-alert-info text-xs">Loading members…</div>}

        <div className="ws-table-wrap" style={{ overflow: 'auto' }}>
          <table className="ws-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ width: 80 }} />
                <th>
                  <button
                    className="underline-offset-2 hover:underline"
                    onClick={() => toggleSort('firstName')}
                  >
                    First name {sortKey === 'firstName' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>
                  <button
                    className="underline-offset-2 hover:underline"
                    onClick={() => toggleSort('lastName')}
                  >
                    Last name {sortKey === 'lastName' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>
                  <button
                    className="underline-offset-2 hover:underline"
                    onClick={() => toggleSort('email')}
                  >
                    Email {sortKey === 'email' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>
                  <button
                    className="underline-offset-2 hover:underline"
                    onClick={() => toggleSort('since')}
                  >
                    Member since {sortKey === 'since' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>
                  <button
                    className="underline-offset-2 hover:underline"
                    onClick={() => toggleSort('status')}
                  >
                    Status {sortKey === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>Role(s)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => {
                const isSel = r.userId === selectedId;
                return (
                  <tr
                    key={r.userId}
                    onClick={() => select(r)}
                    className={`cursor-pointer ${isSel ? 'ws-row-active' : ''}`}
                    title="Click to view details"
                  >
                    <td>
                      <img
                        src="/no_profile_picture.png"
                        alt=""
                        className="ws-avatar"
                        width={32}
                        height={32}
                        loading="lazy"
                      />
                    </td>
                    <td className="text-sm">{r.firstName}</td>
                    <td className="text-sm">{r.lastName}</td>
                    <td className="text-sm ws-muted">{r.email}</td>
                    <td className="text-sm ws-muted">{r.since?.slice(0, 10) ?? '—'}</td>
                    <td>
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </td>
                    <td className="text-sm">
                      <div className="flex flex-wrap gap-1">
                        {r.roles.map((role) => (
                          <span key={role} className="ws-chip ws-chip-primary">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filteredSorted.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="ws-empty">No members</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ws-alert ws-alert-info text-xs">
          Tip: click a row to update the Member details widget.
        </div>
      </div>
    </BaseWidget>
  );
}

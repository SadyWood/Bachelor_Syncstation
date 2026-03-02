// apps/workstation-web/src/widgets/AdminWidgets/RolesList.tsx
import {
  ShieldPlus,
  Trash2,
  RefreshCw,
  Plus,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Shield,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { listRoles, createRole, deleteRole, type Role } from '../../lib/ws-client';
import { useAuth } from '../../state/AuthContext';
import type { WidgetProps, SortDir } from '../../types';

// --- Types ---
type RoleRow = Role; // Use the same type from ws-client
type SortKey = 'name' | 'scope' | 'memberCount'; // Specific sort keys for this widget

// --- Component ---
export default function RolesListWidget({ title, onClose, ...props }: WidgetProps) {
  const { currentTenantInfo } = useAuth();
  const tenantId = currentTenantInfo?.id ?? '';

  // Fetch roles with useSWR
  const {
    data: rows = [],
    error: swrError,
    isLoading: loading,
    mutate,
  } = useSWR<RoleRow[]>(
    tenantId ? `/api/tenants/${tenantId}/roles` : null,
    () => listRoles(tenantId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  let err: string | null = null;
  if (swrError) {
    err = swrError instanceof Error ? swrError.message : 'Failed to load roles';
  }

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Listen for role changes from other widgets
  useEffect(() => {
    const onRolesChanged = () => mutate();
    window.addEventListener('ws:roles:changed', onRolesChanged);
    return () => window.removeEventListener('ws:roles:changed', onRolesChanged);
  }, [mutate]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.scope.toLowerCase().includes(q))
      : rows.slice();

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'memberCount') {
        cmp = (a.memberCount ?? 0) - (b.memberCount ?? 0);
      } else {
        cmp = (a[sortKey] ?? '').localeCompare(b[sortKey] ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [rows, search, sortKey, sortDir]);

  function selectRole(role: RoleRow) {
    setSelectedRoleId(role.roleId);
    window.dispatchEvent(new CustomEvent('ws:select-role', { detail: role }));
  }

  async function onCreate(ev: React.FormEvent) {
    ev.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setActionError(null);
    try {
      await mutate(
        async () => {
          const created = await createRole(tenantId, { name, allow: [], deny: [] });
          return [{ ...created, memberCount: 0 }, ...rows];
        },
        {
          revalidate: false,
        },
      );
      setNewName('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(role: RoleRow, ev: React.MouseEvent) {
    ev.stopPropagation();
    if (role.scope === 'global') return;
    // eslint-disable-next-line no-alert -- User confirmation required for destructive action
    if (!confirm(`Delete role "${role.name}"?`)) return;
    setActionError(null);
    try {
      await mutate(
        async () => {
          await deleteRole(tenantId, role.roleId);
          return rows.filter((r) => r.roleId !== role.roleId);
        },
        {
          optimisticData: rows.filter((r) => r.roleId !== role.roleId),
          rollbackOnError: true,
          revalidate: false,
        },
      );
      if (selectedRoleId === role.roleId) setSelectedRoleId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Delete failed');
    }
  }

  function renderSortIcon(column: SortKey) {
    if (sortKey !== column) return null;
    return sortDir === 'asc' ? (
      <ChevronUp size={14} className="inline-block ml-1" />
    ) : (
      <ChevronDown size={14} className="inline-block ml-1" />
    );
  }

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={Shield} {...props}>
      <div className="p-3 h-full flex flex-col gap-3">
        {/* Search + Create */}
        <div className="flex items-center gap-2">
          <div className="relative" style={{ width: 200 }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="ws-input pl-9 pr-8"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={onCreate} className="flex items-center gap-2 flex-1">
            <input
              className="ws-input"
              style={{ maxWidth: 200 }}
              placeholder="New role name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="submit"
              className="ws-btn ws-btn-sm ws-btn-solid"
              disabled={!newName.trim() || creating}
            >
              <Plus size={14} />
              <span>Create</span>
            </button>
          </form>

          <button
            className="ws-btn ws-btn-sm ws-btn-outline ml-auto"
            onClick={() => mutate()}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {err && <div className="ws-alert ws-alert-error text-xs">{err}</div>}
        {actionError && <div className="ws-alert ws-alert-error text-xs">{actionError}</div>}

        {/* Table */}
        <div className="ws-table-wrap flex-1 ws-scroll-y">
          <table className="ws-table">
            <thead>
              <tr>
                <th>
                  <button onClick={() => toggleSort('name')}>
                    Role Name {renderSortIcon('name')}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort('scope')}>
                    Scope {renderSortIcon('scope')}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort('memberCount')}>
                    Members {renderSortIcon('memberCount')}
                  </button>
                </th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4}>
                    <div className="w-full h-10 ws-skeleton rounded" />
                  </td>
                </tr>
              )}
              {!loading && filteredSorted.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="text-center ws-muted text-sm py-4">No roles found</div>
                  </td>
                </tr>
              )}
              {!loading &&
                filteredSorted.length > 0 &&
                filteredSorted.map((r) => {
                  const isSel = r.roleId === selectedRoleId;
                  return (
                    <tr
                      key={r.roleId}
                      className={`cursor-pointer group ${isSel ? 'ws-row-active' : ''}`}
                      onClick={() => selectRole(r)}
                      title="Click to view permissions"
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <ShieldPlus size={16} className="text-gray-400" />
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`ws-chip ${r.scope === 'global' ? 'ws-chip-primary' : ''}`}
                        >
                          {r.scope}
                        </span>
                      </td>
                      <td>
                        <span className="ws-badge ws-badge-neutral">{r.memberCount ?? 0}</span>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          {r.scope === 'tenant' && (
                            <button
                              className="ws-btn ws-btn-sm ws-btn-icon ws-btn-soft ws-danger"
                              onClick={(ev) => onDelete(r, ev)}
                              title="Delete role"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!alertDismissed && (
          <div className="ws-alert ws-alert-info ws-alert-dismissible text-xs">
            Tip: Click a role to view and edit its permissions
            <button
              onClick={() => setAlertDismissed(true)}
              className="ws-alert-dismiss"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

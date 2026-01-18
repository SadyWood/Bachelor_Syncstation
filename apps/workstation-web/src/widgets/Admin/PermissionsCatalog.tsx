// apps/workstation-web/src/widgets/Admin/PermissionsCatalog.tsx
import { BookOpen, X, Search, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { httpJson } from '../../lib/http';
import type { WidgetProps, SortDir, CatalogItem } from '../../types';

type SortKey = 'permissionCode' | 'description'; // Specific sort keys for this widget

// Real API function
async function listPermissionCatalog(): Promise<CatalogItem[]> {
  const { ok, data, res } = await httpJson<{ ok: true; items: CatalogItem[] }>(
    '/ws/permissions/catalog',
    { method: 'GET' },
  );
  if (!ok) throw new Error(`Failed to fetch permissions catalog (${res.status})`);
  return data?.items ?? [];
}

export default function PermissionsCatalogWidget({ title, onClose, ...props }: WidgetProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('permissionCode');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const rows = await listPermissionCatalog();
      setItems(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filteredSorted = useMemo(() => {
    const s = q.trim().toLowerCase();
    let filtered = items;

    if (s) {
      filtered = items.filter(
        i =>
          i.permissionCode.toLowerCase().includes(s) ||
          (i.description ?? '').toLowerCase().includes(s),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aVal = sortKey === 'permissionCode' ? a.permissionCode : a.description ?? '';
      const bVal = sortKey === 'permissionCode' ? b.permissionCode : b.description ?? '';
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return sorted;
  }, [items, q, sortKey, sortDir]);

  function renderSortIcon(column: SortKey) {
    if (sortKey !== column) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="inline-block ml-1" />
      : <ChevronDown size={14} className="inline-block ml-1" />;
  }

  function copyPermission(code: string) {
    navigator.clipboard.writeText(code);
  }

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={BookOpen} {...props}>
      <div className="p-3 h-full flex flex-col gap-3">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              className="ws-input pl-9"
              placeholder="Search permissions…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className="ws-btn ws-btn-sm ws-btn-outline" onClick={load}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {err && <div className="ws-alert ws-alert-error text-xs">{err}</div>}

        {/* Table */}
        <div className="ws-table-wrap flex-1 ws-scroll-y">
          <table className="ws-table">
            <thead>
              <tr>
                <th>
                  <button onClick={() => toggleSort('permissionCode')}>
                    Permission Code
                    {renderSortIcon('permissionCode')}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort('description')}>
                    Description
                    {renderSortIcon('description')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={2}>
                    <div className="w-full h-10 ws-skeleton rounded" />
                  </td>
                </tr>
              )}
              {!loading && filteredSorted.length === 0 && (
                <tr>
                  <td colSpan={2}>
                    <div className="ws-empty">No permissions found</div>
                  </td>
                </tr>
              )}
              {!loading && filteredSorted.length > 0 && filteredSorted.map(r => (
                <tr
                  key={r.permissionCode}
                  className="cursor-pointer"
                  onClick={() => copyPermission(r.permissionCode)}
                  title="Click to copy permission code"
                >
                  <td>
                    <code className="text-sm font-medium" style={{ color: 'var(--ws-brand)' }}>
                      {r.permissionCode}
                    </code>
                  </td>
                  <td className="ws-muted">{r.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info about total permissions */}
        <div className="flex items-center justify-between text-xs ws-muted">
          <span>Showing {filteredSorted.length} of {items.length} permissions</span>
          {!alertDismissed && (
            <button onClick={() => setAlertDismissed(true)} className="text-xs hover:underline">
              Dismiss tip
            </button>
          )}
        </div>

        {/* Dismissible tip */}
        {!alertDismissed && (
          <div className="ws-alert ws-alert-info ws-alert-dismissible text-xs">
            Tip: Click any permission code to copy it to clipboard
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

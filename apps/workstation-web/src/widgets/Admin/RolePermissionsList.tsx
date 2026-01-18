// apps/workstation-web/src/widgets/AdminWidgets/RolePermissionsList.tsx
import { KeySquare, X, Plus, Shield, Lock, Unlock, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { httpJson } from '../../lib/http';
import { getRole, updateRole, type Role } from '../../lib/ws-client';
import { useAuth } from '../../state/AuthContext';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

// Get permissions catalog for dropdown
async function getPermissionsCatalog(): Promise<string[]> {
  const { ok, data, res } = await httpJson<{ ok: true; items: { permissionCode: string }[] }>(
    '/ws/permissions/catalog',
    { method: 'GET' },
  );
  if (!ok) throw new Error(`Failed to fetch permissions catalog (${res.status})`);
  return (data?.items ?? []).map((item) => item.permissionCode);
}

export default function RolePermissionsWidget({ title, onClose, ...props }: WidgetProps) {
  const { currentTenantInfo } = useAuth();
  const tenantId = currentTenantInfo?.id ?? '';
  const [active, setActive] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [allow, setAllow] = useState<string[]>([]);
  const [deny, setDeny] = useState<string[]>([]);
  const [name, setName] = useState<string>('');

  const [showAllowDropdown, setShowAllowDropdown] = useState(false);
  const [showDenyDropdown, setShowDenyDropdown] = useState(false);

  // Fetch permissions catalog with useSWR
  const { data: availablePermissions = [] } = useSWR<string[]>(
    '/ws/permissions/catalog',
    getPermissionsCatalog,
    {
      fallbackData: [
        'member.list.view', 'member.invite.send', 'member.access.revoke', 'member.roles.assign',
        'role.list.view', 'role.create', 'role.delete', 'role.perms.view', 'role.perms.update',
        'content.read', 'content.manage', 'task.read', 'task.manage', '**',
      ],
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes - permissions don't change often
    },
  );

  // Fetch role details with useSWR
  const { data: roleData, error: roleError } = useSWR(
    active && tenantId ? `/api/tenants/${tenantId}/roles/${active.roleId}` : null,
    active && tenantId ? () => getRole(tenantId, active.roleId) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  // Convert SWR error to string for display
  let err: string | null = null;
  if (roleError) {
    err = roleError instanceof Error ? roleError.message : 'Load failed';
  }

  // Listen for role selection
  useEffect(() => {
    function handler(ev: Event) {
      const r: Role = (ev as CustomEvent).detail;
      setActive(r);
      setSuccessMsg(null);
    }
    window.addEventListener('ws:select-role', handler);
    return () => window.removeEventListener('ws:select-role', handler);
  }, []);

  // Update local state when role data loads
  useEffect(() => {
    if (roleData) {
      setName(roleData.name);
      setAllow(roleData.defaultPerms?.allow ?? []);
      setDeny(roleData.defaultPerms?.deny ?? []);
    }
  }, [roleData]);

  function addAllowPerm(perm: string) {
    if (!allow.includes(perm)) {
      setAllow([...allow, perm]);
      setDeny(deny.filter(p => p !== perm));
    }
    setShowAllowDropdown(false);
  }

  function addDenyPerm(perm: string) {
    if (!deny.includes(perm)) {
      setDeny([...deny, perm]);
      setAllow(allow.filter(p => p !== perm));
    }
    setShowDenyDropdown(false);
  }

  function removeAllowPerm(perm: string) {
    setAllow(allow.filter(p => p !== perm));
  }

  function removeDenyPerm(perm: string) {
    setDeny(deny.filter(p => p !== perm));
  }

  async function saveChanges() {
    if (!active || !tenantId) return;
    setSaving(true);
    setSaveError(null);
    setSuccessMsg(null);
    try {
      await updateRole(tenantId, active.roleId, { name, allow, deny });
      setSuccessMsg('Permissions updated successfully!');
      // Trigger role updated event for other widgets to refresh
      window.dispatchEvent(new CustomEvent('ws:roles:changed', {
        detail: { action: 'updated', role: { ...active, name, defaultPerms: { allow, deny } } },
      }));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const availableForAllow = availablePermissions.filter(p => !allow.includes(p) && !deny.includes(p));
  const availableForDeny = availablePermissions.filter(p => !deny.includes(p) && !allow.includes(p));
  const isGlobalRole = active?.scope === 'global';

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={KeySquare} {...props}>
      <div className="p-4 h-full ws-scroll-y">
        {!active ? (
          <div className="ws-empty" style={{ minHeight: 200 }}>
            <Shield size={24} className="opacity-60" />
            <div className="text-sm font-medium">No role selected</div>
            <div className="text-xs ws-muted">Select a role from the Roles widget</div>
          </div>
        ) : (
          <div className="space-y-4">
            {err && <div className="ws-alert ws-alert-error text-xs">{err}</div>}
            {saveError && <div className="ws-alert ws-alert-error text-xs">{saveError}</div>}
            {successMsg && <div className="ws-alert ws-alert-success text-xs">{successMsg}</div>}

            {/* Role header */}
            <div className="ws-block p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-gray-500" />
                    <span className="text-base font-semibold">{name}</span>
                    <span className={`ws-chip ${active.scope === 'global' ? 'ws-chip-primary' : ''}`}>
                      {active.scope}
                    </span>
                  </div>
                  {isGlobalRole && <div className="text-xs ws-muted mt-1">Global roles cannot be edited</div>}
                </div>
                {!isGlobalRole && (
                  <button className="ws-btn ws-btn-sm ws-btn-solid" onClick={saveChanges} disabled={saving}>
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>

            {/* Allow permissions */}
            <div className="ws-block p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Unlock size={16} className="text-green-600" />
                  <span className="text-sm font-semibold">Allow Permissions</span>
                </div>
                {!isGlobalRole && (
                  <div className="relative">
                    <button
                      className="ws-btn ws-btn-sm ws-btn-outline"
                      onClick={() => setShowAllowDropdown(!showAllowDropdown)}
                      disabled={availableForAllow.length === 0}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    {showAllowDropdown && (
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-64 overflow-y-auto">
                        {availableForAllow.map(perm => (
                          <button
                            key={perm}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg font-mono"
                            onClick={() => addAllowPerm(perm)}
                          >
                            {perm}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allow.length === 0 ? (
                  <span className="text-sm ws-muted">No allow permissions</span>
                ) : (
                  allow.map(perm => (
                    <div
                      key={perm}
                      className="ws-tag"
                      style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'rgb(21, 128, 61)' }}
                    >
                      <code className="text-xs">{perm}</code>
                      {!isGlobalRole && (
                        <button onClick={() => removeAllowPerm(perm)} title="Remove">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Deny permissions */}
            <div className="ws-block p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-red-600" />
                  <span className="text-sm font-semibold">Deny Permissions</span>
                </div>
                {!isGlobalRole && (
                  <div className="relative">
                    <button
                      className="ws-btn ws-btn-sm ws-btn-outline"
                      onClick={() => setShowDenyDropdown(!showDenyDropdown)}
                      disabled={availableForDeny.length === 0}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    {showDenyDropdown && (
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-64 overflow-y-auto">
                        {availableForDeny.map(perm => (
                          <button
                            key={perm}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg font-mono"
                            onClick={() => addDenyPerm(perm)}
                          >
                            {perm}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {deny.length === 0 ? (
                  <span className="text-sm ws-muted">No deny permissions</span>
                ) : (
                  deny.map(perm => (
                    <div
                      key={perm}
                      className="ws-tag"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(185, 28, 28)' }}
                    >
                      <code className="text-xs">{perm}</code>
                      {!isGlobalRole && (
                        <button onClick={() => removeDenyPerm(perm)} title="Remove">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Help text */}
            <div className="ws-alert ws-alert-info text-xs">
              <div>
                <strong>Permission patterns:</strong>
                <br />
                • Use <code>**</code> to match all permissions
                <br />
                • Use <code>*</code> to match one segment
                <br />
                • Deny permissions override allow permissions
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

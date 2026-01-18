// apps/workstation-web/src/widgets/AdminWidgets/Member.tsx
import { createLogger } from '@hoolsy/logger';
import { UserCircle2, X, Plus, Mail, Calendar, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import {
  deactivateMember,
  listRoles,
  listUserRoles,
  addRoleToUser,
  removeRoleFromUser,
  type WsMember,
  type Role,
} from '../../lib/ws-client';
import { useAuth } from '../../state/AuthContext';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

const logger = createLogger('MemberWidget');

function getAlertClass(type: 'success' | 'error' | 'info'): string {
  const classes: Record<'success' | 'error' | 'info', string> = {
    success: 'ws-alert-success',
    error: 'ws-alert-error',
    info: 'ws-alert-info',
  };
  return classes[type];
}

function getStatusBadgeClass(status: WsMember['status']): string {
  const classes: Record<WsMember['status'], string> = {
    active: 'ws-badge-success',
    pending: 'ws-badge-warning',
    disabled: 'ws-badge-error',
    removed: 'ws-badge-error',
  };
  return classes[status] || 'ws-badge-error';
}

export default function MemberWidget({ title, onClose, ...props }: WidgetProps) {
  const { currentTenantInfo } = useAuth();
  const tenantId = currentTenantInfo?.id ?? '';
  const [selected, setSelected] = useState<WsMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Fetch available roles with useSWR
  const { data: availableRoles = [], mutate: mutateRoles } = useSWR<Role[]>(
    tenantId ? `/api/tenants/${tenantId}/roles` : null,
    () => listRoles(tenantId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  // Fetch member roles with useSWR
  const { data: memberRoles = [], mutate: mutateMemberRoles } = useSWR<{ roleId: string; name: string }[]>(
    tenantId && selected ? `/api/tenants/${tenantId}/users/${selected.userId}/roles` : null,
    tenantId && selected ? () => listUserRoles(tenantId, selected.userId) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  // Listen for role changes to refresh available roles list
  useEffect(() => {
    const onRolesChanged = () => mutateRoles();
    window.addEventListener('ws:roles:changed', onRolesChanged);
    return () => window.removeEventListener('ws:roles:changed', onRolesChanged);
  }, [mutateRoles]);

  // Listen for membership changes to refresh current user's roles
  useEffect(() => {
    const onMembershipsChanged = (e: Event) => {
      const { detail } = (e as CustomEvent);
      if (selected && detail?.userId === selected.userId) {
        mutateMemberRoles();
      }
    };
    window.addEventListener('ws:memberships:changed', onMembershipsChanged);
    return () => window.removeEventListener('ws:memberships:changed', onMembershipsChanged);
  }, [selected, mutateMemberRoles]);

  // Listen for member selection
  useEffect(() => {
    function handle(e: Event) {
      const { detail } = (e as CustomEvent<WsMember>);
      setSelected(detail);
      setMsg(null);
      // useSWR will automatically fetch member roles when selected changes
    }
    window.addEventListener('admin:selectMember', handle);
    return () => window.removeEventListener('admin:selectMember', handle);
  }, []);

  async function onDeactivate() {
    if (!selected || !tenantId) return;
    setBusy(true);
    setMsg(null);
    try {
      await deactivateMember(tenantId, selected.userId);
      setMsg({ type: 'success', text: 'Member deactivated successfully' });
      setSelected({ ...selected, status: 'disabled' });
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin:refreshMembers'));
      }, 500);
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to deactivate' });
    } finally {
      setBusy(false);
    }
  }

  async function addRole(role: Role) {
    if (!selected || !tenantId) return;
    const alreadyHas = memberRoles.some(r => r.roleId === role.roleId);
    if (alreadyHas) return;

    try {
      logger.debug('Adding role to user', { tenantId, userId: selected.userId, roleId: role.roleId });

      // Optimistic update
      await mutateMemberRoles(
        async () => {
          await addRoleToUser(tenantId, selected.userId, role.roleId);
          return [...memberRoles, { roleId: role.roleId, name: role.name }];
        },
        {
          optimisticData: [...memberRoles, { roleId: role.roleId, name: role.name }],
          rollbackOnError: true,
          revalidate: false,
        },
      );

      setMsg({ type: 'success', text: `Added role: ${role.name}` });
    } catch (e) {
      logger.error('Failed to add role', e);
      const errorMsg = e instanceof Error ? e.message : 'Failed to add role';
      setMsg({ type: 'error', text: errorMsg });
    }
    setShowRoleDropdown(false);
  }

  async function removeRole(role: { roleId: string; name: string }) {
    if (!selected || !tenantId) return;

    try {
      // Optimistic update
      await mutateMemberRoles(
        async () => {
          await removeRoleFromUser(tenantId, selected.userId, role.roleId);
          return memberRoles.filter(r => r.roleId !== role.roleId);
        },
        {
          optimisticData: memberRoles.filter(r => r.roleId !== role.roleId),
          rollbackOnError: true,
          revalidate: false,
        },
      );

      setMsg({ type: 'success', text: `Removed role: ${role.name}` });
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to remove role' });
    }
  }

  const availableToAdd = availableRoles.filter(r => !memberRoles.some(mr => mr.roleId === r.roleId));

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={UserCircle2} {...props}>
      <div className="p-4 h-full ws-scroll-y">
        {!selected ? (
          <div className="ws-empty" style={{ minHeight: 200 }}>
            <UserCircle2 size={24} className="opacity-60" />
            <div className="text-sm font-medium">No member selected</div>
            <div className="text-xs ws-muted">Click a member in the list to view details</div>
          </div>
        ) : (
          <div className="space-y-4">
            {msg && (
              <div className={`ws-alert text-xs ${getAlertClass(msg.type)}`}>
                {msg.text}
              </div>
            )}

            {/* Member info card */}
            <div className="ws-block p-4">
              <div className="flex items-start gap-4">
                <img src="/no_profile_picture.png" alt="" className="ws-avatar ws-avatar-lg" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold">
                        {selected.firstName} {selected.lastName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm ws-muted mt-1">
                        <Mail size={14} />
                        {selected.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm ws-muted mt-1">
                        <Calendar size={14} />
                        Member since {selected.since?.slice(0, 10) ?? '—'}
                      </div>
                    </div>
                    <span className={`ws-badge ${getStatusBadgeClass(selected.status)}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles section */}
            <div className="ws-block p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gray-500" />
                  <span className="text-sm font-semibold">Assigned Roles</span>
                </div>
                <div className="relative">
                  <button
                    className="ws-btn ws-btn-sm ws-btn-outline"
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    disabled={availableToAdd.length === 0}
                  >
                    <Plus size={14} />
                    Add Role
                  </button>
                  {showRoleDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      {availableToAdd.map(role => (
                        <button
                          key={role.roleId}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          onClick={() => addRole(role)}
                        >
                          {role.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {memberRoles.length === 0 ? (
                  <span className="text-sm ws-muted">No roles assigned</span>
                ) : (
                  memberRoles.map(role => (
                    <div key={role.roleId} className="ws-tag">
                      <span>{role.name}</span>
                      <button onClick={() => removeRole(role)} title="Remove role">
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                className="ws-btn ws-btn-sm ws-btn-outline ws-danger"
                disabled={busy || selected.status === 'disabled'}
                onClick={onDeactivate}
              >
                {busy ? 'Working…' : 'Deactivate Member'}
              </button>
              <button
                className="ws-btn ws-btn-sm ws-btn-solid"
                onClick={() => setMsg({ type: 'info', text: 'Edit feature coming soon' })}
              >
                Edit Details
              </button>
            </div>

            {/* Additional info */}
            <div className="ws-alert ws-alert-info text-xs">
              <div>
                <strong>Member ID:</strong> {selected.memberId}
                <br />
                <strong>User ID:</strong> {selected.userId}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

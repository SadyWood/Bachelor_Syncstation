// src/widgets/AdminWidgets/Invite.tsx
import { MailPlus } from 'lucide-react';
import React, { useState } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { inviteMember } from '../../lib/ws-client';
import { useAuth } from '../../state/AuthContext';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

function getAlertClass(tone: 'success' | 'error' | 'info'): string {
  const classes: Record<'success' | 'error' | 'info', string> = {
    success: 'ws-alert-success',
    error: 'ws-alert-error',
    info: 'ws-alert-info',
  };
  return classes[tone];
}

export default function InviteWidget({ title, onClose, ...props }: WidgetProps) {
  const { currentTenantInfo } = useAuth();
  const tenantId = currentTenantInfo?.id ?? '';
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);

  async function onInvite(ev: React.FormEvent) {
    ev.preventDefault();
    setMsg(null);
    if (!/.+@.+\..+/.test(email)) {
      setMsg({ tone: 'error', text: 'Enter a valid email.' });
      return;
    }
    setBusy(true);
    try {
      await inviteMember(tenantId, email);
      setMsg({ tone: 'success', text: `Invite sent to ${email}` });
      setEmail('');
      setTimeout(() => window.dispatchEvent(new CustomEvent('admin:refreshMembers')), 50);
    } catch (error) {
      setMsg({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to send invite.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={MailPlus} {...props}>
      <form className="p-3 space-y-2" onSubmit={onInvite}>
        {msg && <div className={`ws-alert text-xs ${getAlertClass(msg.tone)}`}>{msg.text}</div>}

        <div className="flex items-center gap-2">
          <input
            className="ws-input flex-1"
            type="email"
            placeholder="user@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="ws-btn ws-btn-sm ws-btn-solid"
            disabled={busy || !tenantId}
          >
            {busy ? 'Sending…' : 'Invite'}
          </button>
        </div>
      </form>
    </BaseWidget>
  );
}

import { Activity } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export default function GlobalTimeline({ title, onClose, ...props }: WidgetProps) {
  const rows = [
    { time: '09:00', label: 'Ingestion job', state: 'ok' },
    { time: '11:15', label: 'Auto-tagging', state: 'warn' },
    { time: '13:40', label: 'Export bundle', state: 'ok' },
  ];
  function getStateBadge(s: string): string {
    const badges: Record<string, string> = {
      ok: 'ws-badge ws-badge-success',
      warn: 'ws-badge ws-badge-warning',
    };
    return badges[s] || 'ws-badge ws-badge-error';
  }

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={Activity} {...props}>
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <span className="ws-badge ws-badge-success">OK</span>
          <span className="ws-badge ws-badge-warning">Warning</span>
          <span className="ws-badge ws-badge-error">Error</span>
        </div>

        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={`${r.time}-${r.label}`} className="ws-block p-2 flex items-center gap-3">
              <div className="text-xs ws-muted w-16">{r.time}</div>
              <div className="flex-1 text-sm">{r.label}</div>
              <span className={getStateBadge(r.state)}>{r.state}</span>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
}

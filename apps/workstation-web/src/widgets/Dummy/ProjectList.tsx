import { ListChecks } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

const rows = Array.from({ length: 10 }).map((_, i) => ({
  name: ['Working Out', 'Product Placement', 'Core Team'][i % 3] + (i > 2 ? ` #${i}` : ''),
  id: ['A8#b//7K', '', 'E4@X9Q', 'T1Z8W'][i % 4],
  pct: [20, 40, 85, 65, 5, 92][i % 6],
  status: ['active', 'paused', 'blocked'][i % 3] as 'active' | 'paused' | 'blocked',
}));

function getBadge(s: 'active' | 'paused' | 'blocked'): string {
  const badges: Record<typeof s, string> = {
    active: 'ws-badge ws-badge-success',
    paused: 'ws-badge ws-badge-warning',
    blocked: 'ws-badge ws-badge-error',
  };
  return badges[s];
}

export default function ProjectList({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={ListChecks} {...props}>
      <div className="p-3 space-y-2">
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Content ID</th>
                <th style={{ width: '35%' }}>Completion</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>
                    <div className="text-sm font-medium">{r.name}</div>
                  </td>
                  <td className="ws-muted text-xs">{r.id || '—'}</td>
                  <td>
                    <div className="ws-progress">
                      <div className="ws-progress-bar" style={{ width: `${r.pct}%` }} />
                    </div>
                    <div className="text-xs ws-muted mt-1">{r.pct}%</div>
                  </td>
                  <td>
                    <span className={getBadge(r.status)}>{r.status}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="ws-pill ws-outline ws-success">Open</button>
                      <button className="ws-pill ws-outline">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ws-alert ws-alert-warning">
          <div className="text-sm">2 prosjekter er på vent – mangler ressursallokering.</div>
        </div>
      </div>
    </BaseWidget>
  );
}

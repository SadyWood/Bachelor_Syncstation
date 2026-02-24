import { BarChart3 } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export const AnalyticsDashboard: React.FC<WidgetProps> = ({ title, onClose, ...props }) => {
  const data = [
    { label: 'Kelly M.', value: 87 },
    { label: 'Georgia O.', value: 92 },
    { label: 'Busta M.', value: 78 },
    { label: 'Wonder S.', value: 95 },
  ];
  const max = Math.max(...data.map((d) => d.value));

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={BarChart3} {...props}>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {data.map((row) => {
            const pct = Math.round((row.value / max) * 100);
            return (
              <div key={row.label} className="ws-block p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">{row.label}</span>
                  <span className="text-xs ws-muted">{row.value}%</span>
                </div>
                <div className="ws-progress">
                  <div className="ws-progress-bar" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="ws-alert ws-alert-info">
          <div className="text-sm">Numbers are normalized against top performer.</div>
        </div>
      </div>
    </BaseWidget>
  );
};

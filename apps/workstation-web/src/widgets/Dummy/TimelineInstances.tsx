import { ListTree } from 'lucide-react';
import React from 'react';
import Button from '../../components/UI/Button';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

const items = Array.from({ length: 8 }).map((_, i) => ({
  name: `Timeline ${i + 1}`,
  status: ['Draft', 'Active', 'Archived'][i % 3],
}));

function getBadge(s: string): string {
  const badges: Record<string, string> = {
    Active: 'ws-badge ws-badge-success',
    Draft: 'ws-badge ws-badge-neutral',
  };
  return badges[s] || 'ws-badge ws-badge-warning';
}

export default function TimelineInstances({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={ListTree} {...props}>
      <div className="p-3 space-y-2">
        <div className="ws-block p-2 text-xs ws-muted grid grid-cols-3 gap-2">
          <div>Name</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="space-y-2 overflow-auto" style={{ maxHeight: 'calc(100% - 56px)' }}>
          {items.map((it) => (
            <div
              key={it.name}
              className="ws-block p-2 grid grid-cols-3 gap-2 items-center ws-block-interactive"
            >
              <div className="text-sm font-medium">{it.name}</div>
              <div>
                <span className={getBadge(it.status)}>{it.status}</span>
              </div>
              <div className="text-right">
                <Button size="xs" appearance="outline" tone="info">
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
}

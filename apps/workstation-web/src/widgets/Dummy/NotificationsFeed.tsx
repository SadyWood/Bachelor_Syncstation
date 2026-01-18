import { Bell } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

const feed = Array.from({ length: 10 }).map((_, i) => ({
  time: `12:1${  i % 10}`,
  text: `Caren Cliff mentioned @Denise in Project ${1 + (i % 3)}`,
}));

export default function NotificationsFeed({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={Bell} {...props}>
      <div className="p-3 space-y-2">
        <div className="ws-pills">
          <button className="ws-pill" aria-selected="true">All</button>
          <button className="ws-pill">Mentions</button>
          <button className="ws-pill">System</button>
        </div>

        <div className="space-y-1 overflow-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
          {feed.map((m) => (
            <div key={`${m.time}-${m.text}`} className="ws-block p-2 flex gap-3 items-center ws-block-interactive">
              <div className="w-8 h-8 rounded-full ws-skeleton" />
              <div className="flex-1">
                <div className="text-sm">{m.text}</div>
                <div className="text-xs ws-muted">{m.time} · inbox</div>
              </div>
              <span className="ws-badge ws-badge-neutral">new</span>
            </div>
          ))}
        </div>

        <div className="ws-alert ws-alert-info"><div className="text-sm">Tips: trykk og dra for å omorganisere widgets.</div></div>
      </div>
    </BaseWidget>
  );
}

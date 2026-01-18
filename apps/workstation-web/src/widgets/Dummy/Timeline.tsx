import { Clock, CheckCircle } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export const Timeline: React.FC<WidgetProps> = ({ title, onClose, ...props }) => {
  const items = [
    { id: 1, time: '09:00', title: 'Team Meeting', description: 'Weekly sync with development team', status: 'completed' },
    { id: 2, time: '11:30', title: 'Content Review', description: 'Review new course materials', status: 'current' },
    { id: 3, time: '14:00', title: 'Student Presentation', description: 'Final project presentations', status: 'upcoming' },
  ];

  function getStatusText(s: string): string {
    if (s === 'completed') return 'completed';
    if (s === 'current') return 'current';
    return 'upcoming';
  }

  return (
    <BaseWidget title={title} onClose={onClose} showClose titleIcon={Clock} {...props}>
      <div className="p-4 h-full" style={{ color: 'var(--ws-text)' }}>
        <div className="space-y-3 overflow-y-auto pr-1">
          {items.map((it, i) => (
            <div key={it.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full flex items-center justify-center bg-[color:var(--ws-text)]/15">
                  {it.status === 'completed'
                    ? <CheckCircle size={10} style={{ color: 'var(--ws-text)' }} />
                    : <Clock size={10} style={{ color: 'var(--ws-text)' }} />}
                </div>
                {i < items.length - 1 && <div className="w-px h-8 bg-[color:var(--ws-text)]/15 mt-1" />}
              </div>

              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs ws-muted">{it.time}</span>
                  <span className="ws-chip">{getStatusText(it.status)}</span>
                </div>
                <div className="ws-block p-3">
                  <h4 className="text-sm font-medium mb-1">{it.title}</h4>
                  <p className="text-xs ws-muted">{it.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
};

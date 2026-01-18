import { FileText } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export default function SubjectInfoPanel({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={FileText} {...props}>
      <div className="p-3 space-y-2">
        <div className="ws-block p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg ws-skeleton" />
          <div>
            <div className="text-sm font-medium">Kelly Maid</div>
            <div className="text-xs ws-muted">DOB: 1985 · Los Angeles, CA</div>
          </div>
          <span className="ws-badge ws-badge-primary ml-auto">verified</span>
        </div>

        <div className="ws-block p-3 text-sm" style={{ height: 140, overflow: 'auto' }}>
          Favorite among her followers… (lorem ipsum dummy bio)… <span className="ws-muted">Read more</span>
        </div>

        <div className="flex gap-2">
          {/* Gi eksplisitt appearance */}
          <button className="ws-btn ws-btn-sm ws-btn-solid">Save</button>
          <button className="ws-btn ws-btn-sm ws-btn-outline">Edit</button>
        </div>
      </div>
    </BaseWidget>
  );
}

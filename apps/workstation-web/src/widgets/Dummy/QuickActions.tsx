import { Plus, FileText, Users, Download, Zap } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export const QuickActions: React.FC<WidgetProps> = ({ title, onClose, ...props }) => {
  const actions = [
    { icon: Plus, label: 'New Project' },
    { icon: FileText, label: 'Generate Report' },
    { icon: Users, label: 'Invite Users' },
    { icon: Download, label: 'Export Data' },
  ];

  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={Zap} {...props}>
      {/* Padding på hele widget-kroppen */}
      <div className="p-3 space-y-3">
        {/* Demo av knappvarianter (for å vise styles fra ui.css) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className="ws-btn ws-btn-sm ws-btn-solid">Primary</button>
          <button className="ws-btn ws-btn-sm ws-btn-outline">Outline</button>
          <button className="ws-btn ws-btn-sm ws-btn-soft ws-info">Info</button>
          <button className="ws-btn ws-btn-sm ws-btn-outline ws-success">Success</button>
          <button className="ws-btn ws-btn-sm ws-btn-outline ws-warning">Warning</button>
          <button className="ws-btn ws-btn-sm ws-btn-solid ws-danger">Danger</button>
          <button className="ws-pill ws-soft">Pill</button>
          <button className="ws-pill ws-outline ws-success">Pill Success</button>
        </div>

        {/* Eksempel-tiles for faktiske actions */}
        <div className="grid grid-cols-2 gap-2">
          {actions.map(({ icon: Icon, label }) => (
            <button key={label} className="ws-tile">
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Eksempel-varsler */}
        <div className="space-y-2">
          <div className="ws-alert ws-alert-success">
            <div>
              <div className="font-medium">Import complete</div>
              <div className="text-sm">All files were processed.</div>
            </div>
          </div>
          <div className="ws-alert ws-alert-warning">
            <div>
              <div className="font-medium">Quota nearing limit</div>
              <div className="text-sm">Consider archiving old projects.</div>
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

import { Upload, FileUp, Images, Video } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

const items = [
  { icon: FileUp, label: 'Import Project', hint: 'CSV / JSON' },
  { icon: FileUp, label: 'Import Subject Info', hint: 'CSV / JSON' },
  { icon: Images, label: 'Import Subject Images', hint: 'JPG / PNG / WEBP' },
  { icon: Video, label: 'Import Video', hint: 'MP4 / MOV' },
];

export default function ImportPanel({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={Upload} {...props}>
      <div className="p-3 space-y-3">
        <div className="ws-alert ws-alert-info">
          <span className="ws-badge ws-badge-primary">New</span>
          <div className="text-sm">Bulk-import støttes – dropp flere filer samtidig.</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {items.map(({ icon: Icon, label, hint }) => (
            <div key={label} className="ws-block ws-block-interactive p-3 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--ws-brand-light)' }}>
                <Icon size={18} style={{ color: 'var(--ws-brand)' }} />
              </div>
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs ws-muted">{hint}</div>
              <div className="flex gap-2 mt-1">
                <button className="ws-btn ws-btn-sm ws-btn-solid">Choose</button>
                <button className="ws-btn ws-btn-sm ws-btn-outline">Browse</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
}

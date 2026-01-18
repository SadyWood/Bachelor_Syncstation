import { Image as ImageIcon } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export default function MediaPreview({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={ImageIcon} {...props}>
      <div className="p-3 grid gap-2">
        <div className="ws-block p-2 text-sm">Selected Media</div>
        <div className="ws-empty" style={{ height: 220 }}>
          <ImageIcon size={18} className="opacity-60" />
          <div className="text-sm">No media selected</div>
          <button className="ws-btn ws-btn-sm ws-btn-solid">Upload</button>
        </div>
      </div>
    </BaseWidget>
  );
}

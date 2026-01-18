import { Send } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export default function MessageComposer({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} titleIcon={Send} {...props}>
      <div className="p-3 space-y-2">
        <input className="ws-input" placeholder="To: team@company.com" />
        <input className="ws-input" placeholder="Subject: Sprint Update" />
        <div className="ws-toolbar">
          <button className="ws-btn ws-btn-xs ws-btn-outline">Bold</button>
          <button className="ws-btn ws-btn-xs ws-btn-outline">Italic</button>
          <button className="ws-btn ws-btn-xs ws-btn-outline">Link</button>
          <span className="ws-badge ws-badge-neutral ml-auto">Markdown</span>
        </div>
        <textarea className="ws-input" placeholder="Write your message…" rows={6} />
        <div className="flex justify-end gap-2">
          <button className="ws-btn ws-btn-sm ws-btn-outline">Save Draft</button>
          <button className="ws-btn ws-btn-sm ws-btn-solid">Send</button>
        </div>
      </div>
    </BaseWidget>
  );
}

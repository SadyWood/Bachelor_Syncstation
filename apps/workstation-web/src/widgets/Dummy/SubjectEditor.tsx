import { Plus, Edit3, BookOpen } from 'lucide-react';
import React from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export const SubjectEditor: React.FC<WidgetProps> = ({ title, onClose, ...props }) => {
  const subjects = [
    { id: 1, name: 'Mathematics', students: 24, status: 'active' },
    { id: 2, name: 'Physics', students: 18, status: 'active' },
    { id: 3, name: 'Chemistry', students: 22, status: 'draft' },
  ];

  return (
    <BaseWidget title={title} onClose={onClose} showClose titleIcon={BookOpen} {...props}>
      <div className="p-4 h-full" style={{ color: 'var(--ws-text)' }}>
        <div className="flex justify-end mb-3">
          {/* Viktig: gi appearance så den blir “brand solid” med padding */}
          <button className="ws-btn ws-btn-sm ws-btn-solid">
            <Plus size={14} />
            <span>Add Subject</span>
          </button>
        </div>

        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="ws-block p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="ws-chip">{s.status}</span>
                <span className="ws-muted text-xs">{s.students} students</span>
              </div>
              <button className="ws-btn ws-btn-sm ws-btn-outline">
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
};

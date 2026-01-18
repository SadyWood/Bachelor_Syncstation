// apps/workstation-web/src/widgets/ContentDashboard/SubjectEditor.tsx
import { SUGGESTED_SUBJECT_TYPES } from '@hk26/schema';
import { Edit3, Save, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { useTimelineState } from '../../lib/timeline-state';
import { getTrackLabel } from '../../utils/timeline-helpers';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';
import type { Subject, SubjectType } from '@hk26/schema';

export default function SubjectEditor({ title, onClose }: Omit<WidgetProps, 'id'>) {
  const { subjects, updateSubject, selectedSubjectId } = useTimelineState();
  // Track which subject we're currently editing (to detect selection changes)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedSubject, setEditedSubject] = useState<Subject | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Get the source subject from context
  const sourceSubject = useMemo(() => {
    if (!selectedSubjectId || selectedSubjectId === 'MULTIPLE') return null;
    return subjects.find(s => s.subjectId === selectedSubjectId) ?? null;
  }, [selectedSubjectId, subjects]);

  // Reset edit state when selection changes (state-based pattern)
  // This is safe because React batches setState calls during render
  if (editingId !== selectedSubjectId) {
    setEditingId(selectedSubjectId);
    if (sourceSubject) {
      setEditedSubject({ ...sourceSubject });
      setHasChanges(false);
    } else {
      setEditedSubject(null);
      setHasChanges(false);
    }
  }

  const handleSave = () => {
    if (!editedSubject || !hasChanges) return;

    // Update subject metadata using context function (affects all appearances)
    updateSubject(editedSubject.subjectId, {
      label: editedSubject.label,
      description: editedSubject.description,
      color: editedSubject.color,
      subjectType: editedSubject.subjectType,
    });

    setHasChanges(false);
  };

  const handleCancel = () => {
    if (sourceSubject) {
      setEditedSubject({ ...sourceSubject });
      setHasChanges(false);
    }
  };

  const updateField = <K extends keyof Subject>(field: K, value: Subject[K]) => {
    if (!editedSubject) return;
    setEditedSubject(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  if (!editedSubject) {
    return (
      <BaseWidget title={title || 'Subject Editor'} titleIcon={Edit3} onClose={onClose}>
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Edit3 size={48} className="mx-auto mb-4 opacity-50" />
            {selectedSubjectId === 'MULTIPLE' ? (
              <>
                <p className="text-sm">Multiple subjects selected</p>
                <p className="text-xs mt-1 opacity-75">Select only one subject to edit</p>
              </>
            ) : (
              <>
                <p className="text-sm">No subject selected</p>
                <p className="text-xs mt-1 opacity-75">Select a subject from the timeline</p>
              </>
            )}
          </div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget title={title || 'Subject Editor'} titleIcon={Edit3} onClose={onClose}>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Compact header with save/cancel */}
        {hasChanges && (
          <div className="flex gap-2 p-2 bg-blue-50 border-b border-blue-200">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors border border-gray-300"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        )}

        {/* Compact form */}
        <div className="p-3 space-y-3">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={editedSubject.label}
              onChange={(e) => updateField('label', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Subject name"
            />
          </div>

          {/* Type and Color in row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={editedSubject.subjectType}
                onChange={(e) => updateField('subjectType', e.target.value as SubjectType)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {SUGGESTED_SUBJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getTrackLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={editedSubject.color}
                  onChange={(e) => updateField('color', e.target.value)}
                  className="h-8 w-12 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={editedSubject.color}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      updateField('color', value);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="#000000"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editedSubject.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Add description, notes, wiki info..."
              rows={6}
            />
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This editor updates subject metadata (name, description, color, type).
              Changes apply to all appearances of this subject on the timeline.
              To edit timing, use the timeline directly.
            </p>
          </div>

          {/* Metadata (collapsible/optional) */}
          {editedSubject.metadata && Object.keys(editedSubject.metadata).length > 0 && (
            <details className="border border-gray-200 rounded">
              <summary className="px-2 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                Metadata
              </summary>
              <div className="p-2 border-t border-gray-200">
                <textarea
                  value={JSON.stringify(editedSubject.metadata, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      updateField('metadata', parsed);
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-none"
                  rows={4}
                  placeholder="{}"
                />
              </div>
            </details>
          )}

          {/* Compact IDs section */}
          <details className="border-t border-gray-200 pt-2">
            <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
              Technical Info
            </summary>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Subject ID:</span>
                <code className="text-gray-600 text-xs">{editedSubject.subjectId.slice(0, 8)}...</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Node ID:</span>
                <code className="text-gray-600 text-xs">{editedSubject.nodeId.slice(0, 8)}...</code>
              </div>
              {editedSubject.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-600">{new Date(editedSubject.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {editedSubject.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated:</span>
                  <span className="text-gray-600">{new Date(editedSubject.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </BaseWidget>
  );
}

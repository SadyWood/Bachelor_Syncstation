// apps/workstation-web/src/widgets/ContentDashboard/SubjectList.tsx
import { List, Search, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { useTimelineState } from '../../lib/timeline-state';
import { msToTime, getTrackLabel } from '../../utils/timeline-helpers';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';
import type { Subject, SubjectAppearance } from '@hk26/schema';

interface SubjectGroup {
  subject: Subject;
  appearances: Array<{ appearance: SubjectAppearance; appearanceNumber: number }>;
}

export default function SubjectList({ title, onClose }: Omit<WidgetProps, 'id'>) {
  const { subjects, appearances, selectedAppearanceId, setSelectedAppearanceId } = useTimelineState();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  // Track the last processed selection for auto-expand
  const [lastExpandedForId, setLastExpandedForId] = useState<string | null>(null);
  const appearanceRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Group appearances by subject and add numbering
  const groupedSubjects = useMemo(() => {
    // Filter subjects first (before expensive operations)
    const query = searchQuery.trim().toLowerCase();
    const filteredSubjects = query
      ? subjects.filter(subject =>
        subject.label.toLowerCase().includes(query) ||
          getTrackLabel(subject.subjectType).toLowerCase().includes(query) ||
          subject.subjectId.toLowerCase().includes(query) ||
          subject.description?.toLowerCase().includes(query),
      )
      : subjects;

    // Now map only the filtered subjects
    const groups: SubjectGroup[] = [];

    filteredSubjects.forEach(subject => {
      // Find all appearances for this subject, sorted by start time
      const subjectAppearances = appearances
        .filter(a => a.subjectId === subject.subjectId)
        .sort((a, b) => a.startMs - b.startMs)
        .map((appearance, index) => ({
          appearance,
          appearanceNumber: index + 1,
        }));

      if (subjectAppearances.length > 0) {
        groups.push({
          subject,
          appearances: subjectAppearances,
        });
      }
    });

    return groups;
  }, [subjects, appearances, searchQuery]);

  // Auto-expand subject when selection changes (state-based pattern)
  const selectedAppearance = selectedAppearanceId && selectedAppearanceId !== 'MULTIPLE'
    ? appearances.find(a => a.appearanceId === selectedAppearanceId)
    : null;

  // Derive selected subject ID from selected appearance
  const selectedSubjectId = selectedAppearance?.subjectId ?? null;

  // Check if we need to auto-expand for this selection
  if (lastExpandedForId !== selectedAppearanceId && selectedAppearance) {
    setLastExpandedForId(selectedAppearanceId);
    // Auto-expand the subject if not already expanded
    if (!expandedSubjects.has(selectedAppearance.subjectId)) {
      const next = new Set(expandedSubjects);
      next.add(selectedAppearance.subjectId);
      setExpandedSubjects(next);
    }
  }

  // Scroll to selected appearance after render
  useEffect(() => {
    if (!selectedAppearanceId || selectedAppearanceId === 'MULTIPLE') return;

    // Use requestAnimationFrame to wait for DOM update after expansion
    const rafId = requestAnimationFrame(() => {
      const element = appearanceRefs.current.get(selectedAppearanceId);
      if (element && listContainerRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [selectedAppearanceId]);

  // Handle row click to select appearance
  const handleAppearanceClick = (appearanceId: string) => {
    if (selectedAppearanceId === appearanceId) {
      setSelectedAppearanceId(null);
    } else {
      setSelectedAppearanceId(appearanceId);
    }
  };

  // Toggle subject expansion (only from chevron click)
  const toggleSubject = (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // Handle subject header click (select first appearance without toggling collapse)
  const handleSubjectClick = (subjectId: string) => {
    // Find first appearance of this subject
    const firstAppearance = appearances
      .filter(a => a.subjectId === subjectId)
      .sort((a, b) => a.startMs - b.startMs)[0];

    if (firstAppearance) {
      setSelectedAppearanceId(firstAppearance.appearanceId);
    }
  };

  return (
    <BaseWidget title={title || 'Subject List'} titleIcon={List} onClose={onClose}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Search bar */}
        <div className="p-2 border-b border-gray-200">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {appearances.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <List size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No appearances available</p>
            </div>
          </div>
        )}
        {appearances.length > 0 && groupedSubjects.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No subjects match your search</p>
            </div>
          </div>
        )}
        {appearances.length > 0 && groupedSubjects.length > 0 && (
          <div ref={listContainerRef} className="overflow-auto">
            {groupedSubjects.map((group) => {
              const isExpanded = expandedSubjects.has(group.subject.subjectId);
              const isSubjectSelected = selectedSubjectId === group.subject.subjectId;

              return (
                <div key={group.subject.subjectId}>
                  {/* Subject header - click to select, chevron to expand/collapse */}
                  <div
                    onClick={() => handleSubjectClick(group.subject.subjectId)}
                    className={`flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 ${
                      isSubjectSelected ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        onClick={(e) => toggleSubject(group.subject.subjectId, e)}
                        className="cursor-pointer p-0.5 hover:bg-gray-200 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: group.subject.color }}
                      />
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {group.subject.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({group.appearances.length})
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {getTrackLabel(group.subject.subjectType)}
                    </span>
                  </div>

                  {/* Appearances list */}
                  {isExpanded && (
                    <div className="bg-white">
                      {group.appearances.map(({ appearance, appearanceNumber }) => {
                        const isAppearanceSelected = selectedAppearanceId === appearance.appearanceId;

                        return (
                          <div
                            key={appearance.appearanceId}
                            ref={(el) => {
                              if (el) {
                                appearanceRefs.current.set(appearance.appearanceId, el);
                              } else {
                                appearanceRefs.current.delete(appearance.appearanceId);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppearanceClick(appearance.appearanceId);
                            }}
                            className={`flex items-center gap-3 px-2 py-1.5 pl-8 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                              isAppearanceSelected ? 'bg-blue-100 hover:bg-blue-100' : ''
                            }`}
                          >
                            {/* Appearance number */}
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs font-medium flex-shrink-0">
                              {appearanceNumber}
                            </div>

                            {/* Time range */}
                            <div className="flex flex-col text-xs font-mono text-gray-600 min-w-[60px]">
                              <span>{msToTime(appearance.startMs)}</span>
                              <span className="text-gray-400">{msToTime(appearance.endMs)}</span>
                            </div>

                            {/* Duration */}
                            <span className="text-xs text-gray-500">
                              {Math.floor((appearance.endMs - appearance.startMs) / 1000)}s
                            </span>

                            {/* Appearance ID (hover to see full) */}
                            <code
                              className="text-xs text-gray-400 ml-auto cursor-help"
                              title={`Appearance ID: ${appearance.appearanceId}`}
                            >
                              {appearance.appearanceId.slice(0, 8)}...
                            </code>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

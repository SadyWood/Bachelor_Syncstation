// apps/workstation-web/src/widgets/ContentDashboard/Timeline.tsx
import { createLogger } from '@hoolsy/logger';
import { Timeline, Toolbox, assignSubTracks } from '@hoolsy/timeline';
import { appearanceToTimelineItem, DEFAULT_TIMELINE_TRACKS } from '@hk26/schema';
import { Clock } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { dispatchTimelineSeek } from '../../lib/events';
import { SHOW_SCENE_CUT_MARKERS, sceneCutMarkers } from '../../lib/mocks/content-dashboard.mock';
import { useTimelineState } from '../../lib/timeline-state';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';
import type { TimelineItem as HoolsyTimelineItem, ToolType } from '@hoolsy/timeline';
import type { Subject, SubjectAppearance } from '@hk26/schema';
import '@hoolsy/timeline/dist/styles/theme.css';
import '@hoolsy/timeline/dist/Timeline.css';
import '@hoolsy/timeline/dist/components/Toolbox.css';

const logger = createLogger('TimelineWidget');

/**
 * Timeline widget using @hoolsy/timeline for professional video subject tracking
 * Synchronized with MediaPreview via CustomEvents
 */


export function TimelineWidget({ title, onClose }: Omit<WidgetProps, 'id'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(300);
  const [containerWidth, setContainerWidth] = useState(800);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [temporarySnapOverride, setTemporarySnapOverride] = useState<boolean | null>(null);

  // Get state from context
  const {
    currentTime,
    duration,
    subjects,
    appearances,
    setSubjects,
    setAppearances,
    setIsDragging,
    selectedAppearanceId,
    setSelectedAppearanceId,
    tracks,
    setTracks,
    markers,
    setMarkers,
  } = useTimelineState();

  // Merge scene cut markers with custom markers if toggle is on
  const allMarkers = React.useMemo(() => SHOW_SCENE_CUT_MARKERS ? [...markers, ...sceneCutMarkers] : markers, [markers]);

  // Convert appearances + subjects to timeline items with appearance numbers
  const timelineItems: HoolsyTimelineItem[] = React.useMemo(() => {
    // First, group appearances by subject and add numbering
    const appearancesBySubject = new Map<string, typeof appearances>();
    appearances.forEach(appearance => {
      const existing = appearancesBySubject.get(appearance.subjectId) || [];
      appearancesBySubject.set(appearance.subjectId, [...existing, appearance]);
    });

    // Sort each subject's appearances by start time
    appearancesBySubject.forEach((subjectAppearances, subjectId) => {
      appearancesBySubject.set(
        subjectId,
        subjectAppearances.sort((a, b) => a.startMs - b.startMs),
      );
    });

    // Convert to timeline items with appearance numbers
    // Using flatMap to safely filter out null values (when subject not found)
    const items = appearances.flatMap(appearance => {
      const subject = subjects.find(s => s.subjectId === appearance.subjectId);
      if (!subject) return [];

      // Find the appearance number
      const subjectAppearances = appearancesBySubject.get(appearance.subjectId) || [];
      const appearanceNumber = subjectAppearances.findIndex(a => a.appearanceId === appearance.appearanceId) + 1;

      const item = appearanceToTimelineItem(appearance, subject);

      // Add appearance number to label if there are multiple appearances
      if (subjectAppearances.length > 1) {
        item.label = `${subject.label} #${appearanceNumber}`;
      }

      return [item];
    });

    return assignSubTracks(items);
  }, [appearances, subjects]);

  // Initialize tracks - only show tracks that have appearances
  React.useEffect(() => {
    // Find unique subject types from current appearances
    const usedSubjectTypes = new Set(
      appearances.map(appearance => {
        const subject = subjects.find(s => s.subjectId === appearance.subjectId);
        return subject?.subjectType;
      }).filter(Boolean),
    );

    // If tracks are empty (first load), initialize them
    if (tracks.length === 0) {
      const activeTracks = DEFAULT_TIMELINE_TRACKS
        .filter(track => usedSubjectTypes.has(track.id))
        .map((t) => ({
          id: t.id,
          label: t.label,
        }));
      setTracks(activeTracks);
      return;
    }

    // Otherwise, preserve track order and only add/remove as needed
    const currentTrackIds = new Set(tracks.map(t => t.id));
    const tracksToAdd = DEFAULT_TIMELINE_TRACKS.filter(
      track => usedSubjectTypes.has(track.id) && !currentTrackIds.has(track.id),
    );
    const tracksToRemove = new Set(
      [...currentTrackIds].filter(id => !usedSubjectTypes.has(id)),
    );

    if (tracksToAdd.length > 0 || tracksToRemove.size > 0) {
      const updatedTracks = [
        ...tracks.filter(t => !tracksToRemove.has(t.id)),
        ...tracksToAdd.map(t => ({ id: t.id, label: t.label })),
      ];
      setTracks(updatedTracks);
    }
  }, [appearances, subjects, tracks, setTracks]);

  // Measure container dimensions on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(Math.max(200, rect.height));
        setContainerWidth(Math.max(400, rect.width));
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle timeline seek
  const handleTimeClick = useCallback((timeMs: number) => {
    // Dispatch event to video player (convert ms to seconds)
    dispatchTimelineSeek({ time: timeMs / 1000 });
  }, []);

  // Handle selection changes
  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    // Update context with new selection (now using appearanceId)
    if (selectedIds.length === 1) {
      setSelectedAppearanceId(selectedIds[0]);
    } else if (selectedIds.length > 1) {
      setSelectedAppearanceId('MULTIPLE');
    } else {
      setSelectedAppearanceId(null);
    }
  }, [setSelectedAppearanceId]);

  // Convert selectedAppearanceId to array for Timeline component
  const selectedItemIds = React.useMemo(() => {
    if (!selectedAppearanceId || selectedAppearanceId === 'MULTIPLE') {
      return undefined; // Let timeline manage its own selection
    }
    return [selectedAppearanceId];
  }, [selectedAppearanceId]);


  // Handle items change from timeline (including splice, copy/paste, and delete)
  const handleItemsChange = useCallback((updatedItems: HoolsyTimelineItem[]) => {
    logger.warn('[TIMELINE DEMO MODE] Timeline items modified. Changes are NOT saved to the server.');

    setIsDragging(true);

    const newAppearances: SubjectAppearance[] = [];
    const newSubjects: Subject[] = [...subjects];

    updatedItems.forEach(item => {
      const existingAppearance = appearances.find(a => a.appearanceId === item.id);

      if (existingAppearance) {
        // Update existing appearance
        newAppearances.push({
          ...existingAppearance,
          startMs: item.startMs,
          endMs: item.endMs,
        });
      } else {
        // New appearance from copy/paste or splice
        // Try to find the original item this was copied from by matching label and color
        const originalItem = timelineItems.find(
          ti => ti.label === item.label && ti.color === item.color && ti.id !== item.id,
        );

        let subjectId: string;

        if (originalItem) {
          // This is a copy - use the same subject as the original
          const originalAppearance = appearances.find(a => a.appearanceId === originalItem.id);
          subjectId = originalAppearance?.subjectId || '';
        } else {
          // This is a new item (splice) - find or create subject
          const existingSubject = subjects.find(s => s.subjectType === item.trackId);
          if (existingSubject) {
            ({ subjectId } = existingSubject);
          } else {
            // Create a new subject for this track
            const newSubjectId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            newSubjects.push({
              subjectId: newSubjectId,
              nodeId: subjects[0]?.nodeId || '00000000-0000-0000-0000-000000000001', // Use existing nodeId or default
              subjectType: item.trackId,
              label: item.label || 'New Subject',
              color: item.color || '#808080',
              description: '',
            });
            subjectId = newSubjectId;
          }
        }

        newAppearances.push({
          appearanceId: item.id,
          subjectId,
          startMs: item.startMs,
          endMs: item.endMs,
        });
      }
    });

    // Update both subjects and appearances
    if (newSubjects.length > subjects.length) {
      setSubjects(newSubjects);
    }
    setAppearances(newAppearances);

    // Reset dragging state after a short delay
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  }, [appearances, subjects, timelineItems, setAppearances, setSubjects, setIsDragging]);

  // Set light theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <BaseWidget title={title || 'Timeline'} titleIcon={Clock} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Demo mode warning banner */}
        <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            DEMO MODE
          </span>
          <span className="text-xs text-yellow-700">
            Timeline changes are not saved to the server
          </span>
        </div>

        {/* Timeline content - takes remaining space */}
        <div className="flex flex-1 min-h-0" style={{ margin: 0, padding: 0 }}>
          {/* Toolbox on the left */}
          <div className="flex-shrink-0">
            <Toolbox
              selectedTool={activeTool}
              onToolChange={setActiveTool}
              snapEnabled={snapEnabled}
              temporarySnapOverride={temporarySnapOverride}
              onSnapToggle={setSnapEnabled}
            />
          </div>

          {/* Timeline on the right */}
          <div ref={containerRef} className="flex-1 min-w-0">
            <Timeline
              items={timelineItems}
              tracks={tracks}
              durationMs={duration}
              currentTimeMs={currentTime}
              width={containerWidth}
              height={containerHeight}
              activeTool={activeTool}
              selectedItemIds={selectedItemIds}
              onItemsChange={handleItemsChange}
              onTimeChange={handleTimeClick}
              onSelectionChange={handleSelectionChange}
              onPreviewTimeChange={() => {
                // Preview frame when resizing (optional)
              }}
              onTracksChange={setTracks}
              onTemporaryToolChange={() => {
                // Handle temporary tool changes like middle-click pan
              }}
              onTemporarySnapChange={setTemporarySnapOverride}
              enableHistory
              maxHistorySize={50}
              frameRate={30}
              markers={allMarkers}
              onMarkersChange={setMarkers}
              enableMarkers
              snapEnabled={snapEnabled}
              onSnapToggle={setSnapEnabled}
            />
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}

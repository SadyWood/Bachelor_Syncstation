// apps/workstation-web/src/lib/timeline-state.tsx
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { Subject, SubjectAppearance } from '@hk26/schema';
import type { TimelineTrack, Marker } from '@hoolsy/timeline';

interface TimelineState {
  currentTime: number;
  duration: number;
  subjects: Subject[];
  appearances: SubjectAppearance[];
  isDragging: boolean;
  selectedAppearanceId: string | null; // Changed from selectedSubjectId
  selectedSubjectId: string | null; // The parent subject of selected appearance
  tracks: TimelineTrack[];
  markers: Marker[];
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setSubjects: (subjects: Subject[]) => void;
  setAppearances: (appearances: SubjectAppearance[]) => void;
  updateSubject: (subjectId: string, updates: Partial<Subject>) => void;
  updateAppearance: (appearanceId: string, startMs: number, endMs: number) => void;
  setIsDragging: (dragging: boolean) => void;
  setSelectedAppearanceId: (id: string | null) => void;
  setTracks: (tracks: TimelineTrack[]) => void;
  setMarkers: (markers: Marker[]) => void;
}

const TimelineContext = createContext<TimelineState | null>(null);

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const [duration, setDuration] = useState(300000); // 5 minutes default
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [appearances, setAppearances] = useState<SubjectAppearance[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAppearanceIdInternal, setSelectedAppearanceIdInternal] = useState<string | null>(
    null,
  );
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);

  // Use ref for currentTime to avoid re-renders
  const currentTimeRef = useRef(0);
  const [currentTimeInternal, setCurrentTimeInternal] = useState(0);

  // Update currentTime without causing re-renders during drag
  const setCurrentTime = useCallback(
    (time: number) => {
      currentTimeRef.current = time;
      if (!isDragging) {
        setCurrentTimeInternal(time);
      }
    },
    [isDragging],
  );

  // Calculate selectedSubjectId from selectedAppearanceId
  const selectedSubjectId = React.useMemo(() => {
    if (!selectedAppearanceIdInternal || selectedAppearanceIdInternal === 'MULTIPLE') { return selectedAppearanceIdInternal; }
    const appearance = appearances.find((a) => a.appearanceId === selectedAppearanceIdInternal);
    return appearance?.subjectId ?? null;
  }, [selectedAppearanceIdInternal, appearances]);

  // Wrapper to update selectedAppearanceId
  const setSelectedAppearanceId = useCallback((id: string | null) => {
    setSelectedAppearanceIdInternal(id);
  }, []);

  // Update subject metadata (affects all appearances)
  const updateSubject = useCallback((subjectId: string, updates: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.subjectId === subjectId ? { ...subject, ...updates } : subject,
      ),
    );
  }, []);

  // Update appearance timing
  const updateAppearance = useCallback((appearanceId: string, startMs: number, endMs: number) => {
    setAppearances((prev) =>
      prev.map((appearance) =>
        appearance.appearanceId === appearanceId ? { ...appearance, startMs, endMs } : appearance,
      ),
    );
  }, []);

  // Sync currentTime when dragging ends
  useEffect(() => {
    if (!isDragging) {
      setCurrentTimeInternal(currentTimeRef.current);
    }
  }, [isDragging]);

  const value: TimelineState = useMemo(
    () => ({
      currentTime: currentTimeInternal,
      duration,
      subjects,
      appearances,
      isDragging,
      selectedAppearanceId: selectedAppearanceIdInternal,
      selectedSubjectId,
      tracks,
      markers,
      setCurrentTime,
      setDuration,
      setSubjects,
      setAppearances,
      updateSubject,
      updateAppearance,
      setIsDragging,
      setSelectedAppearanceId,
      setTracks,
      setMarkers,
    }),
    [
      currentTimeInternal,
      duration,
      subjects,
      appearances,
      isDragging,
      selectedAppearanceIdInternal,
      selectedSubjectId,
      tracks,
      markers,
      setCurrentTime,
      updateSubject,
      updateAppearance,
      setSelectedAppearanceId,
    ],
  );

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useTimelineState() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimelineState must be used within TimelineProvider');
  }
  return context;
}

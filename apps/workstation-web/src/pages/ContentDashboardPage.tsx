import { createLogger } from '@hoolsy/logger';
import { FolderTree, Image as ImageIcon, Clock, Edit3, List } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/Layout/PageShell';
import SideNav from '../components/Layout/SideNav';
import { WidgetGrid } from '../components/WidgetBase/WidgetGrid';
import {
  EVENT_NAMES,
  addTypedEventListener,
  dispatchSelectNodeById,
  type VideoTimeUpdateEvent,
  type NodeSelectedEvent,
} from '../lib/events';
import { mockSubjects, mockAppearances, mockMarkers } from '../lib/mocks/content-dashboard.mock';
import { TimelineProvider, useTimelineState } from '../lib/timeline-state';
import MediaPreview from '../widgets/ContentDashboard/MediaPreview';
import ProjectBrowser from '../widgets/ContentDashboard/ProjectBrowser';
import SubjectEditor from '../widgets/ContentDashboard/SubjectEditor';
import SubjectList from '../widgets/ContentDashboard/SubjectList';
import { TimelineWidget } from '../widgets/ContentDashboard/Timeline';
import type { GridItemMeta, WidgetRegistry } from '../types';

const logger = createLogger('ContentDashboardPage');

// Context for sharing selected node state with MediaPreview
interface SelectedNodeContextValue {
  nodeId: string | null;
  nodeTitle: string | null;
}

const SelectedNodeContext = createContext<SelectedNodeContextValue>({
  nodeId: null,
  nodeTitle: null,
});

const items: GridItemMeta[] = [
  { i: 'browser', x: 0, y: 0, w: 2, h: 7, minW: 2, minH: 4, widget: 'ProjectBrowser', title: 'Content Browser', icon: FolderTree },
  { i: 'list', x: 2, y: 0, w: 3, h: 7, minW: 2, minH: 4, widget: 'SubjectList', title: 'Subject List', icon: List },
  { i: 'editor', x: 5, y: 0, w: 3, h: 7, minW: 2, minH: 4, widget: 'SubjectEditor', title: 'Subject Editor', icon: Edit3 },
  { i: 'preview', x: 8, y: 0, w: 4, h: 7, minW: 4, minH: 4, widget: 'MediaPreview', title: 'Media Preview', icon: ImageIcon },
  { i: 'timeline', x: 0, y: 7, w: 12, h: 6, minW: 6, minH: 2, widget: 'Timeline', title: 'Timeline', icon: Clock },
];

// Wrapper component that consumes context to inject selected node into MediaPreview
// This avoids nested component definition anti-pattern
function MediaPreviewWrapper(props: { title: string; onClose?: () => void }) {
  const { nodeId } = useContext(SelectedNodeContext);
  return <MediaPreview {...props} nodeId={nodeId} />;
}

function ContentDashboardInner() {
  const { nodeId: urlNodeId } = useParams<{ nodeId?: string }>();
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeTitle, setSelectedNodeTitle] = useState<string | null>(null);
  // Use ref to track mount status without triggering re-renders
  const isMountedRef = useRef(false);
  const { setCurrentTime, setDuration, setSubjects, setAppearances, setMarkers } = useTimelineState();

  // Initialize subjects, appearances, and markers on mount
  useEffect(() => {
    setSubjects(mockSubjects);
    setAppearances(mockAppearances);
    setMarkers(mockMarkers);
    // Mark as mounted after data initialization (ref doesn't trigger re-render)
    isMountedRef.current = true;
  }, [setSubjects, setAppearances, setMarkers]);

  // Listen for video time updates
  useEffect(() => addTypedEventListener<VideoTimeUpdateEvent>(
    EVENT_NAMES.VIDEO_TIME_UPDATE,
    (e) => {
      if (e.detail.currentTime !== undefined) {
        setCurrentTime(e.detail.currentTime * 1000); // Convert to ms
      }
      if (e.detail.duration !== undefined) {
        setDuration(e.detail.duration * 1000); // Convert to ms
      }
    },
  ), [setCurrentTime, setDuration]);

  // Listen for node selection and update URL
  useEffect(() => addTypedEventListener<NodeSelectedEvent>(
    EVENT_NAMES.NODE_SELECTED,
    (e) => {
      const { nodeId } = e.detail;
      const { title } = e.detail;

      logger.debug('NODE_SELECTED event received', {
        nodeId,
        title,
        currentSelectedNodeId: selectedNodeId,
      });

      setSelectedNodeId(nodeId);
      setSelectedNodeTitle(title);

      // Update URL when node is selected
      if (nodeId) {
        logger.debug(`Navigating to: /content/${nodeId}`);
        navigate(`/content/${nodeId}`, { replace: true });
      } else {
        navigate('/content', { replace: true });
      }
    },
  ), [navigate, selectedNodeId]);

  // Load node from URL after mount is complete
  // Only triggers on urlNodeId changes to avoid race condition
  // Add delay to allow ProjectBrowser to load projects first
  useEffect(() => {
    if (isMountedRef.current && urlNodeId) {
      logger.debug('URL changed, will dispatch SELECT_NODE_BY_ID after delay', { urlNodeId });
      // Wait 500ms for ProjectBrowser to load projects, then dispatch
      const timeout = setTimeout(() => {
        logger.debug('Dispatching SELECT_NODE_BY_ID', { urlNodeId });
        dispatchSelectNodeById({ nodeId: urlNodeId });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [urlNodeId]);

  // Create STABLE widget registry
  // MediaPreview gets selectedNode state from context, not props
  const registry = useMemo<WidgetRegistry>(() => ({
    ProjectBrowser,
    SubjectList,
    SubjectEditor,
    MediaPreview: MediaPreviewWrapper,
    Timeline: TimelineWidget,
  }), []);

  // Memoize context value to prevent unnecessary re-renders
  const selectedNodeContextValue = useMemo(
    () => ({ nodeId: selectedNodeId, nodeTitle: selectedNodeTitle }),
    [selectedNodeId, selectedNodeTitle],
  );

  return (
    <SelectedNodeContext.Provider value={selectedNodeContextValue}>
      <div className="h-screen flex bg-[var(--ws-page-bg)]">
        <SideNav />
        <PageShell>
          <WidgetGrid className="h-full w-full" items={items} registry={registry} persistKey="content-dashboard-v1" />
        </PageShell>
      </div>
    </SelectedNodeContext.Provider>
  );
}

export default function ContentDashboardPage() {
  return (
    <TimelineProvider>
      <ContentDashboardInner />
    </TimelineProvider>
  );
}

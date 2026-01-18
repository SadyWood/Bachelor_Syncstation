// apps/workstation-web/src/lib/mocks/content-dashboard.mock.ts
/**
 * Mock data for ContentDashboard development and testing.
 * Breaking Bad S01E01 scene data.
 */

import type { Subject, SubjectAppearance } from '@hk26/schema';
import type { Marker } from '@hoolsy/timeline';

// ============================================================================
// MOCK SUBJECTS - Metadata only
// ============================================================================

export const mockSubjects: Subject[] = [
  // SCENES
  {
    subjectId: 's1',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'scene',
    label: 'Arrival & Prep',
    color: '#f1ff70ff',
    description: 'Walt and Jesse arrive at the desert location',
  },
  {
    subjectId: 's2',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'scene',
    label: 'Camcorder Sequence',
    color: '#8fec43ff',
    description: 'Jesse films Walt with camcorder',
  },
  {
    subjectId: 's3',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'scene',
    label: 'Cooking Montage',
    color: '#dcfb3fff',
    description: 'Chemical cooking process montage',
  },
  {
    subjectId: 's4',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'scene',
    label: 'The Product',
    color: '#66dbffff',
    description: 'Inspecting the blue crystals',
  },

  // CHARACTERS
  {
    subjectId: 'c1',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'character',
    label: 'Walter White',
    color: '#06D6A0',
    description: 'Chemistry teacher turned cook',
  },
  {
    subjectId: 'c2',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'character',
    label: 'Jesse Pinkman',
    color: '#118AB2',
    description: 'Former student, partner',
  },

  // LOCATIONS
  {
    subjectId: 'l1',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'location',
    label: 'Albuquerque Desert',
    color: '#F4A261',
    description: 'Desert location with RV',
  },
  {
    subjectId: 'l2',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'location',
    label: 'RV Interior (Lab)',
    color: '#E9C46A',
    description: 'Mobile meth lab inside RV',
  },

  // PHYSICAL ARTIFACTS (Props)
  {
    subjectId: 'p1',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'White Underpants',
    color: '#ff9ab2ff',
    description: 'Iconic Walter White underpants',
  },
  {
    subjectId: 'p2',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'Yellow Hazmat Suit',
    color: '#fff09eff',
    description: 'DuPont Tyvek chemical suit',
  },
  {
    subjectId: 'p3',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'Gas Mask',
    color: '#90e3ffff',
    description: '3M Full Facepiece Respirator',
  },
  {
    subjectId: 'p4',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'Camcorder',
    color: '#ffb0c3ff',
    description: 'Sony Handycam for recording',
  },
  {
    subjectId: 'p5',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'Round-bottom Flask',
    color: '#adebffff',
    description: '5000ml glass chemistry flask',
  },
  {
    subjectId: 'p6',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'Blue Meth Crystals',
    color: '#acabffff',
    description: 'The final product - Blue Sky',
  },
  {
    subjectId: 'p7',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'Pistol',
    color: '#ffa4a4ff',
    description: 'Smith & Wesson 4506',
  },
  {
    subjectId: 'p8',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'physical_artifact',
    label: 'RV Vehicle',
    color: '#ffb987ff',
    description: 'Fleetwood Bounder mobile lab',
  },

  // CONCEPTS (Music/Audio)
  {
    subjectId: 'a1',
    nodeId: '00000000-0000-0000-0000-000000000001',
    subjectType: 'music',
    label: 'Dead Fingers Talking',
    color: '#e1bdffff',
    description: 'Song by Working for a Nuclear Free City during cooking montage',
  },
];

// ============================================================================
// MOCK APPEARANCES - Timeline instances (~4.5 min)
// ============================================================================

export const mockAppearances: SubjectAppearance[] = [
  // SCENE FLOW - Updated to match marker positions
  { appearanceId: 'app-s1', subjectId: 's1', startMs: 0, endMs: 90200 },
  { appearanceId: 'app-s2', subjectId: 's2', startMs: 90200, endMs: 110500 },
  { appearanceId: 'app-s3', subjectId: 's3', startMs: 110500, endMs: 171967 },
  { appearanceId: 'app-s4', subjectId: 's4', startMs: 171967, endMs: 244333 },

  // CHARACTER PRESENCE
  { appearanceId: 'app-c1-1', subjectId: 'c1', startMs: 0, endMs: 85000 },
  { appearanceId: 'app-c1-2', subjectId: 'c1', startMs: 90000, endMs: 234000 },
  { appearanceId: 'app-c2-1', subjectId: 'c2', startMs: 82000, endMs: 234000 },

  // LOCATIONS
  { appearanceId: 'app-l1', subjectId: 'l1', startMs: 0, endMs: 45000 },
  { appearanceId: 'app-l2', subjectId: 'l2', startMs: 45000, endMs: 234000 },

  // PROPS & CLOTHING DETAILS
  { appearanceId: 'app-p1', subjectId: 'p1', startMs: 0, endMs: 45000 },
  { appearanceId: 'app-p2-w', subjectId: 'p2', startMs: 90000, endMs: 150000 },
  { appearanceId: 'app-p2-j', subjectId: 'p2', startMs: 90000, endMs: 150000 },
  { appearanceId: 'app-p3-w', subjectId: 'p3', startMs: 95000, endMs: 145000 },
  { appearanceId: 'app-p3-j', subjectId: 'p3', startMs: 95000, endMs: 145000 },
  { appearanceId: 'app-p4', subjectId: 'p4', startMs: 60000, endMs: 85000 },
  { appearanceId: 'app-p5', subjectId: 'p5', startMs: 90000, endMs: 150000 },
  { appearanceId: 'app-p6', subjectId: 'p6', startMs: 155000, endMs: 234000 },
  { appearanceId: 'app-p7', subjectId: 'p7', startMs: 27000, endMs: 35000 },
  { appearanceId: 'app-p8', subjectId: 'p8', startMs: 0, endMs: 234000 },

  // AUDIO/MUSIC
  { appearanceId: 'app-a1', subjectId: 'a1', startMs: 110333, endMs: 178900 },
];

// ============================================================================
// MOCK MARKERS - Scene transitions at specified timecodes (30fps)
// ============================================================================

export const mockMarkers: Marker[] = [
  {
    markerId: 'm1',
    timeMs: 90200, // 00:01:30:06
    label: 'Scene 1: Arrival & Prep',
    color: '#FFD166',
    comment: 'Walt and Jesse arrive at the desert location',
  },
  {
    markerId: 'm2',
    timeMs: 110500, // 00:01:50:15
    label: 'Scene 2: Camcorder',
    color: '#06D6A0',
    comment: 'Jesse films Walt with camcorder',
  },
  {
    markerId: 'm3',
    timeMs: 171967, // 00:02:51:29
    label: 'Scene 3: Cooking Montage',
    color: '#118AB2',
    comment: 'Chemical cooking process montage',
  },
  {
    markerId: 'm4',
    timeMs: 244333, // 00:04:04:10
    label: 'Scene 4: The Product',
    color: '#073B4C',
    comment: 'Inspecting the blue crystals',
  },
  {
    markerId: 'm5',
    timeMs: 270000, // 00:04:30:00
    label: 'End: Commercial Break',
    color: '#EF476F',
    comment: 'Breaking Bad promo and commercial break',
  },
];

// ============================================================================
// SCENE CUT MARKERS - AI-detected scene cuts (HH:MM:SS.mmm format)
// ============================================================================

// Toggle this to show/hide scene cut markers in the timeline
export const SHOW_SCENE_CUT_MARKERS = false;

// Scene cut timestamps from AI detection
const sceneCutTimestamps = [
  '00:00:00.751', '00:00:03.212', '00:00:05.547', '00:00:15.224', '00:00:27.819', '00:00:30.656',
  '00:00:33.992', '00:00:45.003', '00:00:47.005', '00:00:50.550', '00:00:54.304', '00:00:58.517',
  '00:01:07.234', '00:01:10.112', '00:01:12.990', '00:01:20.038', '00:01:22.416', '00:01:23.834',
  '00:01:30.173', '00:01:52.029', '00:01:52.779', '00:01:54.489', '00:01:56.116', '00:01:56.825',
  '00:01:57.534', '00:01:58.243', '00:01:58.744', '00:01:59.328', '00:02:00.120', '00:02:02.080',
  '00:02:03.290', '00:02:03.790', '00:02:04.374', '00:02:06.001', '00:02:06.626', '00:02:07.252',
  '00:02:07.753', '00:02:08.462', '00:02:09.004', '00:02:10.464', '00:02:11.840', '00:02:12.591',
  '00:02:13.717', '00:02:14.468', '00:02:15.218', '00:02:16.636', '00:02:17.262', '00:02:17.804',
  '00:02:18.597', '00:02:19.222', '00:02:20.724', '00:02:21.475', '00:02:22.100', '00:02:22.642',
  '00:02:23.852', '00:02:24.353', '00:02:24.853', '00:02:25.479', '00:02:26.521', '00:02:27.814',
  '00:02:29.316', '00:02:29.858', '00:02:30.400', '00:02:31.068', '00:02:31.735', '00:02:32.903',
  '00:02:33.653', '00:02:35.489', '00:02:36.823', '00:02:37.741', '00:02:38.408', '00:02:39.451',
  '00:02:40.369', '00:02:41.828', '00:02:43.205', '00:02:44.581', '00:02:48.001', '00:02:49.127',
  '00:02:50.295', '00:02:51.963', '00:03:07.187', '00:03:11.441', '00:03:14.444', '00:03:19.991',
  '00:03:22.911', '00:03:25.872', '00:03:26.623', '00:03:32.254', '00:03:35.257', '00:03:38.176',
  '00:03:39.845', '00:03:42.931', '00:03:49.855', '00:03:51.565', '00:03:52.941', '00:03:54.317',
  '00:04:04.327', '00:04:12.085',
];

// Convert HH:MM:SS.mmm timecode to milliseconds
export function timecodeToMs(timecode: string): number {
  const parts = timecode.split(':');
  if (parts.length !== 3) return 0;

  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const secondsParts = parts[2].split('.');
  const seconds = parseInt(secondsParts[0]) || 0;
  const milliseconds = parseInt(secondsParts[1]) || 0;

  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
}

// Generated markers from AI scene cuts (soft blue color)
export const sceneCutMarkers: Marker[] = sceneCutTimestamps.map((timestamp, index) => ({
  markerId: `scene-cut-${index + 1}`,
  timeMs: timecodeToMs(timestamp),
  label: `Scene cut #${index + 1}`,
  color: '#60A5FA',
}));

import { create } from 'zustand';
import type { Project } from '@/screens/SelectContextScreen/SelectContextScreen.types';

interface ContentState {
  activeProjectId: string | null;
  activeSceneId: string | null;
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  setActiveSceneId: (sceneId: string) => void;
  clearContext: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  activeProjectId: null,
  activeSceneId: null,
  activeProject: null,

  setActiveProject: (project: Project) =>
    set({
      activeProjectId: project.id,
      activeProject: project,
      activeSceneId: null,
    }),

  setActiveSceneId: (sceneId: string) =>
    set({
      activeSceneId: sceneId,
    }),

  clearContext: () =>
    set({
      activeProjectId: null,
      activeSceneId: null,
      activeProject: null,
    }),
}));

import { create } from 'zustand';
import type { Project } from '@/screens/SelectContextScreen/types/SelectContextScreen.types';
import type { Scene } from '@/screens/SelectSceneScreen/types/SelectSceneScreen.types';

interface ContentState {
  activeProjectId: string | null;
  activeSceneId: string | null;
  activeProject: Project | null;
  activeScene: Scene | null;
  setActiveProject: (project: Project) => void;
  setActiveScene: (scene: Scene) => void;
  clearContext: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  activeProjectId: null,
  activeSceneId: null,
  activeProject: null,
  activeScene: null,

  setActiveProject: (project: Project) =>
    set({
      activeProjectId: project.id,
      activeProject: project,
      activeSceneId: null,
      activeScene: null,
    }),

  setActiveScene: (scene: Scene) =>
    set({
      activeSceneId: scene.id,
      activeScene: scene,
    }),

  clearContext: () =>
    set({
      activeProjectId: null,
      activeSceneId: null,
      activeProject: null,
      activeScene: null,
    }),
}));

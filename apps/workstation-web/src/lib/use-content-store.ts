// apps/workstation-web/src/lib/use-content-store.ts

import { create } from 'zustand';
import {
  listProjects,
  createProject as createProjectApi,
  getProject,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  applyTemplate as applyTemplateApi,
  getProjectTree,
  createNode as createNodeApi,
  updateNode as updateNodeApi,
  deleteNode as deleteNodeApi,
  moveNode as moveNodeApi,
  reorderSiblings as reorderSiblingsApi,
} from './content-client';
import type {
  ProjectSummary,
  ContentNodeSchema,
  ContentNodeNested,
  TemplateTypeT,
} from '@hk26/schema';
import type { z } from 'zod';

// Infer types from Zod schemas
type ProjectSummaryType = z.infer<typeof ProjectSummary>;
type ContentNodeSchemaType = z.infer<typeof ContentNodeSchema>;
type ContentNodeNestedType = z.infer<typeof ContentNodeNested>;

interface ContentStoreState {
  // ──────────────────────────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────────────────────────
  projects: ProjectSummaryType[];
  currentProject: ContentNodeSchemaType | null;
  currentTree: ContentNodeNestedType[];
  isLoading: boolean;
  error: string | null;

  // ──────────────────────────────────────────────────────────────────────────
  // Project Actions
  // ──────────────────────────────────────────────────────────────────────────
  loadProjects: () => Promise<void>;
  createProject: (title: string, synopsis?: string, slug?: string, templateId?: TemplateTypeT) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updates: { title?: string; synopsis?: string; slug?: string }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  applyTemplate: (projectId: string, templateId: TemplateTypeT) => Promise<void>;

  // ──────────────────────────────────────────────────────────────────────────
  // Tree Actions
  // ──────────────────────────────────────────────────────────────────────────
  loadProjectTree: (projectId: string) => Promise<void>;
  createNode: (
    parentId: string,
    nodeType: 'group' | 'content' | 'bonus_content',
    title: string,
    mediaClass?: 'video' | 'audio' | 'image',
    mediaKind?: string,
    position?: number,
  ) => Promise<void>;
  updateNode: (
    nodeId: string,
    updates: {
      title?: string;
      synopsis?: string;
      mediaClass?: 'video' | 'audio' | 'image';
      mediaKind?: string;
    },
  ) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  moveNode: (nodeId: string, newParentId: string) => Promise<void>;
  reorderSiblings: (parentId: string, orderedNodeIds: string[]) => Promise<void>;

  // ──────────────────────────────────────────────────────────────────────────
  // Utility
  // ──────────────────────────────────────────────────────────────────────────
  clearError: () => void;
}

export const useContentStore = create<ContentStoreState>((set, get) => ({
  // ──────────────────────────────────────────────────────────────────────────
  // Initial State
  // ──────────────────────────────────────────────────────────────────────────
  projects: [],
  currentProject: null,
  currentTree: [],
  isLoading: false,
  error: null,

  // ──────────────────────────────────────────────────────────────────────────
  // Project Actions Implementation
  // ──────────────────────────────────────────────────────────────────────────
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await listProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      set({ error: message, isLoading: false });
    }
  },

  createProject: async (title: string, synopsis?: string, slug?: string, templateId?: TemplateTypeT) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await createProjectApi({
        body: {
          title,
          slug: slug || '',
          synopsis,
          template: templateId,
        },
      });
      // Reload projects list to get updated child counts
      await get().loadProjects();
      set({ currentProject: newProject, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      set({ error: message, isLoading: false });
    }
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await getProject(projectId);
      set({ currentProject: project, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load project';
      set({ error: message, isLoading: false });
    }
  },

  updateProject: async (projectId: string, updates: { title?: string; synopsis?: string; slug?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateProjectApi(projectId, { body: updates });
      set({ currentProject: updated, isLoading: false });
      // Refresh projects list to reflect changes
      await get().loadProjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      set({ error: message, isLoading: false });
    }
  },

  deleteProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProjectApi(projectId);
      // Remove from local state
      set((state: ContentStoreState) => ({
        projects: state.projects.filter((p) => p.nodeId !== projectId),
        currentProject: state.currentProject?.nodeId === projectId ? null : state.currentProject,
        currentTree: state.currentProject?.nodeId === projectId ? [] : state.currentTree,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      set({ error: message, isLoading: false });
    }
  },

  applyTemplate: async (projectId: string, templateId: TemplateTypeT) => {
    set({ isLoading: true, error: null });
    try {
      await applyTemplateApi(projectId, templateId);
      // Reload the tree to reflect template application
      await get().loadProjectTree(projectId);
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply template';
      set({ error: message, isLoading: false });
      throw err; // Re-throw so ProjectTemplates can catch it
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Tree Actions Implementation
  // ──────────────────────────────────────────────────────────────────────────
  loadProjectTree: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tree = await getProjectTree(projectId);
      set({ currentTree: tree, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load project tree';
      set({ error: message, isLoading: false });
    }
  },

  createNode: async (
    parentId: string,
    nodeType: 'group' | 'content' | 'bonus_content',
    title: string,
    mediaClass?: 'video' | 'audio' | 'image',
    mediaKind?: string,
    position?: number,
  ) => {
    set({ isLoading: true, error: null });
    try {
      await createNodeApi({
        body: {
          parentId,
          nodeType,
          title,
          mediaKindCode: mediaKind,
          position,
        },
      });
      // Reload the tree to reflect the new node
      const currentProjectId = get().currentProject?.nodeId;
      if (currentProjectId) {
        await get().loadProjectTree(currentProjectId);
      }
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create node';
      set({ error: message, isLoading: false });
    }
  },

  updateNode: async (
    nodeId: string,
    updates: {
      title?: string;
      synopsis?: string;
      mediaClass?: 'video' | 'audio' | 'image';
      mediaKind?: string;
    },
  ) => {
    set({ isLoading: true, error: null });
    try {
      await updateNodeApi(nodeId, {
        body: {
          title: updates.title,
          synopsis: updates.synopsis,
          mediaKindCode: updates.mediaKind,
        },
      });
      // Reload the tree to reflect changes
      const currentProjectId = get().currentProject?.nodeId;
      if (currentProjectId) {
        await get().loadProjectTree(currentProjectId);
      }
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update node';
      set({ error: message, isLoading: false });
    }
  },

  deleteNode: async (nodeId: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteNodeApi(nodeId);
      // Reload the tree to reflect deletion
      const currentProjectId = get().currentProject?.nodeId;
      if (currentProjectId) {
        await get().loadProjectTree(currentProjectId);
      }
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete node';
      set({ error: message, isLoading: false });
    }
  },

  moveNode: async (nodeId: string, newParentId: string) => {
    set({ isLoading: true, error: null });
    try {
      await moveNodeApi(nodeId, { body: { newParentId } });
      // Reload the tree to reflect the move
      const currentProjectId = get().currentProject?.nodeId;
      if (currentProjectId) {
        await get().loadProjectTree(currentProjectId);
      }
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move node';
      set({ error: message, isLoading: false });
    }
  },

  reorderSiblings: async (parentId: string, orderedNodeIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      // Build the reorder request with positions
      const items = orderedNodeIds.map((nodeId, index) => ({
        nodeId,
        position: index,
      }));
      await reorderSiblingsApi({ body: { parentId, items } });
      // Reload the tree to reflect new order
      const currentProjectId = get().currentProject?.nodeId;
      if (currentProjectId) {
        await get().loadProjectTree(currentProjectId);
      }
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder nodes';
      set({ error: message, isLoading: false });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Utility
  // ──────────────────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));

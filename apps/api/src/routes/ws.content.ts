// apps/api/src/routes/ws.content.ts
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateNodeRequest,
  UpdateNodeRequest,
  MoveNodeRequest,
  ReorderSiblingsRequest,
  ProjectsListResponse,
  ProjectResponse,
  ProjectTreeFlatResponse,
  NodeResponse,
} from '@hk26/schema';
import { z } from 'zod';
import * as contentRepo from '../repos/content.repo.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { requireTenant } from '../utils/tenant.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

/* ========================================
   ROUTE PARAM SCHEMAS (internal only)
   ======================================== */

const ProjectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const NodeIdParamsSchema = z.object({
  nodeId: z.string().uuid(),
});

export const wsContentRoutes: FastifyPluginAsyncZod = async (app) => {
  /* ========================================
     PROJECTS
     ======================================== */

  app.addHook('preHandler', app.authenticate);

  // GET /ws/projects - List all projects
  app.get(
    '/ws/projects',
    {
      preHandler: app.needsPerm('content.project.list'),
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      try {
        const items = await contentRepo.listProjects(tenantId);
        return reply.send(ProjectsListResponse.parse({ ok: true, items }));
      } catch (error) {
        app.log.error(error, 'Failed to list projects');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to list projects' });
      }
    },
  );

  // POST /ws/projects - Create new project
  app.post(
    '/ws/projects',
    {
      preHandler: app.needsPerm('content.project.create'),
      schema: {
        body: CreateProjectRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const body = CreateProjectRequest.shape.body.parse(req.body);

      try {
        const slug = body.slug?.trim() || generateUniqueSlug(body.title);

        const project = await contentRepo.createProject({
          tenantId,
          title: body.title,
          synopsis: body.synopsis,
          slug,
        });

        // Apply template if requested
        if (body.template && body.template !== 'empty') {
          // TODO: Implement template application logic
          app.log.info({ template: body.template }, 'Template requested but not yet implemented');
        }

        return reply.code(201).send(ProjectResponse.parse({ ok: true, project }));
      } catch (error) {
        app.log.error(error, 'Failed to create project');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to create project' });
      }
    },
  );

  // GET /ws/projects/:projectId - Get single project
  app.get(
    '/ws/projects/:projectId',
    {
      preHandler: app.needsPerm('content.project.view'),
      schema: {
        params: ProjectIdParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { projectId } = ProjectIdParamsSchema.parse(req.params);

      try {
        const project = await contentRepo.getProjectById(tenantId, projectId);
        if (!project) {
          return reply.code(404).send({ ok: false, code: 'PROJECT_NOT_FOUND' });
        }
        return reply.send(ProjectResponse.parse({ ok: true, project }));
      } catch (error) {
        app.log.error(error, 'Failed to get project');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to get project' });
      }
    },
  );

  // PATCH /ws/projects/:projectId - Update project
  app.patch(
    '/ws/projects/:projectId',
    {
      preHandler: app.needsPerm('content.project.update'),
      schema: {
        params: ProjectIdParamsSchema,
        body: UpdateProjectRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { projectId } = ProjectIdParamsSchema.parse(req.params);
      const body = UpdateProjectRequest.shape.body.parse(req.body);

      try {
        const project = await contentRepo.updateProject(tenantId, projectId, body);
        if (!project) {
          return reply.code(404).send({ ok: false, code: 'PROJECT_NOT_FOUND' });
        }
        return reply.send(ProjectResponse.parse({ ok: true, project }));
      } catch (error) {
        app.log.error(error, 'Failed to update project');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to update project' });
      }
    },
  );

  // DELETE /ws/projects/:projectId - Delete project
  app.delete(
    '/ws/projects/:projectId',
    {
      preHandler: app.needsPerm('content.project.delete'),
      schema: {
        params: ProjectIdParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { projectId } = ProjectIdParamsSchema.parse(req.params);

      try {
        const deleted = await contentRepo.deleteProject(tenantId, projectId);
        if (!deleted) {
          return reply.code(404).send({ ok: false, code: 'PROJECT_NOT_FOUND' });
        }
        return reply.send({ ok: true });
      } catch (error) {
        app.log.error(error, 'Failed to delete project');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to delete project' });
      }
    },
  );

  // GET /ws/projects/:projectId/tree - Get project tree (flat)
  app.get(
    '/ws/projects/:projectId/tree',
    {
      preHandler: app.needsPerm('content.project.view'),
      schema: {
        params: ProjectIdParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { projectId } = ProjectIdParamsSchema.parse(req.params);

      try {
        const items = await contentRepo.getProjectTreeFlat(tenantId, projectId);
        return reply.send(ProjectTreeFlatResponse.parse({ ok: true, items }));
      } catch (error) {
        app.log.error(error, 'Failed to get project tree');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to get project tree' });
      }
    },
  );

  /* ========================================
     NODES
     ======================================== */

  // POST /ws/nodes - Create new node
  app.post(
    '/ws/nodes',
    {
      preHandler: app.needsPerm('content.node.create'),
      schema: {
        body: CreateNodeRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const body = CreateNodeRequest.shape.body.parse(req.body);

      try {
        // Validate: Only groups can have children (content/bonus_content cannot)
        const parent = await contentRepo.getNodeById(tenantId, body.parentId);
        if (!parent) {
          return reply.code(404).send({ ok: false, code: 'PARENT_NOT_FOUND', message: 'Parent node not found' });
        }

        if (parent.nodeType !== 'group') {
          return reply.code(400).send({
            ok: false,
            code: 'INVALID_PARENT',
            message: `Cannot add children to node of type "${parent.nodeType}". Only groups can have children.`,
          });
        }

        const node = await contentRepo.createNode({
          tenantId,
          ...body,
        });
        return reply.code(201).send(NodeResponse.parse({ ok: true, node }));
      } catch (error) {
        app.log.error(error, 'Failed to create node');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to create node' });
      }
    },
  );

  // PATCH /ws/nodes/:nodeId - Update node
  app.patch(
    '/ws/nodes/:nodeId',
    {
      preHandler: app.needsPerm('content.node.update'),
      schema: {
        params: NodeIdParamsSchema,
        body: UpdateNodeRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { nodeId } = NodeIdParamsSchema.parse(req.params);
      const body = UpdateNodeRequest.shape.body.parse(req.body);

      try {
        const node = await contentRepo.updateNode(tenantId, nodeId, body);
        if (!node) {
          return reply.code(404).send({ ok: false, code: 'NODE_NOT_FOUND' });
        }
        return reply.send(NodeResponse.parse({ ok: true, node }));
      } catch (error) {
        app.log.error(error, 'Failed to update node');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to update node' });
      }
    },
  );

  // DELETE /ws/nodes/:nodeId - Delete node
  app.delete(
    '/ws/nodes/:nodeId',
    {
      preHandler: app.needsPerm('content.node.delete'),
      schema: {
        params: NodeIdParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { nodeId } = NodeIdParamsSchema.parse(req.params);

      try {
        const deleted = await contentRepo.deleteNode(tenantId, nodeId);
        if (!deleted) {
          return reply.code(404).send({ ok: false, code: 'NODE_NOT_FOUND' });
        }
        return reply.send({ ok: true });
      } catch (error) {
        app.log.error(error, 'Failed to delete node');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to delete node' });
      }
    },
  );

  // POST /ws/nodes/:nodeId/move - Move node to new parent
  app.post(
    '/ws/nodes/:nodeId/move',
    {
      preHandler: app.needsPerm('content.node.move'),
      schema: {
        params: NodeIdParamsSchema,
        body: MoveNodeRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { nodeId } = NodeIdParamsSchema.parse(req.params);
      const body = MoveNodeRequest.shape.body.parse(req.body);

      try {
        await contentRepo.moveNode(tenantId, nodeId, body.newParentId, body.position);
        const node = await contentRepo.getNodeById(tenantId, nodeId);
        return reply.send(NodeResponse.parse({ ok: true, node }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (message === 'NODE_NOT_FOUND') {
          return reply.code(404).send({ ok: false, code: 'NODE_NOT_FOUND', message: 'Node not found' });
        }
        if (message === 'TARGET_NOT_FOUND') {
          return reply.code(404).send({ ok: false, code: 'TARGET_NOT_FOUND', message: 'Target parent not found' });
        }
        if (message === 'INVALID_PARENT') {
          return reply.code(400).send({ ok: false, code: 'INVALID_PARENT', message: 'Target must be a group' });
        }
        if (message === 'CYCLE_FORBIDDEN') {
          return reply.code(400).send({ ok: false, code: 'CYCLE_FORBIDDEN', message: 'Cannot move node into its own subtree' });
        }
        if (message === 'CROSS_TENANT_FORBIDDEN' || message === 'TENANT_MISMATCH') {
          return reply.code(403).send({ ok: false, code: 'CROSS_TENANT_FORBIDDEN', message: 'Cross-tenant moves not allowed' });
        }

        app.log.error(error, 'Failed to move node');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to move node' });
      }
    },
  );

  // POST /ws/nodes/reorder - Reorder siblings
  app.post(
    '/ws/nodes/reorder',
    {
      preHandler: app.needsPerm('content.node.reorder'),
      schema: {
        body: ReorderSiblingsRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const body = ReorderSiblingsRequest.shape.body.parse(req.body);

      try {
        await contentRepo.reorderSiblings(tenantId, body.parentId, body.items);
        return reply.send({ ok: true });
      } catch (error) {
        app.log.error(error, 'Failed to reorder nodes');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to reorder nodes' });
      }
    },
  );

  // NOTE: Template logic moved to frontend.
  // Templates will build node structure client-side and use POST /ws/nodes for each node.
  // Keeping this endpoint as a no-op for backward compatibility, but it does nothing.

  /*
  // POST /ws/projects/:projectId/apply-template - Apply template to project (DEPRECATED)
  app.post(
    '/ws/projects/:projectId/apply-template',
    {
      preHandler: app.needsPerm('content.project.update'),
      schema: {
        params: ProjectIdParamsSchema,
        body: ApplyTemplateRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { projectId } = ProjectIdParamsSchema.parse(req.params);
      const body = ApplyTemplateRequest.shape.body.parse(req.body);

      try {
        // Templates are now handled in frontend
        app.log.info({ projectId, template: body.template }, 'Apply template called (no-op, handled in frontend)');
        return reply.send({ ok: true });
      } catch (error) {
        app.log.error(error, 'Failed to apply template');
        return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to apply template' });
      }
    }
  );
  */
};

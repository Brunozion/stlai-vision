import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectContextSchema,
} from "./projects.schemas";
import {
  createProject,
  getProjectById,
  getProjectContext,
  listProjects,
  upsertProjectContext,
} from "./projects.service";

export async function registerProjectRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects", async () => {
    return {
      items: await listProjects(),
    };
  });

  app.post("/api/v1/projects", async (request, reply) => {
    const body = createProjectSchema.parse(request.body);
    const project = await createProject(body);

    return reply.code(201).send(project);
  });

  app.get("/api/v1/projects/:projectId", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const project = await getProjectById(projectId);

    if (!project) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado.",
        },
      });
    }

    return project;
  });

  app.put("/api/v1/projects/:projectId/context", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const body = updateProjectContextSchema.parse(request.body);
    const context = await upsertProjectContext(projectId, body);

    if (!context) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado para salvar contexto.",
        },
      });
    }

    return context;
  });

  app.get("/api/v1/projects/:projectId/context", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const context = await getProjectContext(projectId);

    if (!context) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_CONTEXT_NOT_FOUND",
          message: "Contexto do projeto nao encontrado.",
        },
      });
    }

    return context;
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Os dados enviados sao invalidos.",
          details: error.flatten(),
        },
      });
    }

    throw error;
  });
}

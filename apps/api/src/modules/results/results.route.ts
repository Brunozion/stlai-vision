import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { projectIdParamsSchema } from "../projects/projects.schemas";
import {
  approveCurrentTextResult,
  approveTextResult,
  getCurrentTextResult,
  getProjectSummary,
  listCurrentImageResults,
} from "./results.service";

const approveParamsSchema = z.object({
  projectId: z.string().uuid(),
  textResultId: z.string().uuid(),
});

export async function registerResultRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects/:projectId/text-result", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const result = await getCurrentTextResult(projectId);

    if (!result) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado.",
        },
      });
    }

    if (!result.textResult) {
      return reply.code(404).send({
        error: {
          code: "TEXT_RESULT_NOT_FOUND",
          message: "Nenhum texto atual encontrado para este projeto.",
        },
      });
    }

    return result.textResult;
  });

  app.post("/api/v1/projects/:projectId/text-result/approve", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const approved = await approveCurrentTextResult(projectId);

    if (!approved) {
      return reply.code(404).send({
        error: {
          code: "TEXT_RESULT_NOT_FOUND",
          message: "Resultado de texto atual nao encontrado para aprovacao.",
        },
      });
    }

    return approved;
  });

  app.post("/api/v1/projects/:projectId/text-result/:textResultId/approve", async (request, reply) => {
    const { projectId, textResultId } = approveParamsSchema.parse(request.params);
    const approved = await approveTextResult(projectId, textResultId);

    if (!approved) {
      return reply.code(404).send({
        error: {
          code: "TEXT_RESULT_NOT_FOUND",
          message: "Resultado de texto nao encontrado para aprovacao.",
        },
      });
    }

    return approved;
  });

  app.get("/api/v1/projects/:projectId/image-results", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const result = await listCurrentImageResults(projectId);

    if (!result) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado.",
        },
      });
    }

    return {
      items: result.items,
    };
  });

  app.get("/api/v1/projects/:projectId/summary", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const summary = await getProjectSummary(projectId);

    if (!summary) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado.",
        },
      });
    }

    return summary;
  });
}

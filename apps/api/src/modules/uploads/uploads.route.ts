import type { FastifyInstance } from "fastify";
import { projectIdParamsSchema } from "../projects/projects.schemas";
import { createAssetsSchema } from "./uploads.schemas";
import { createAssets, listAssets } from "./uploads.service";

export async function registerUploadRoutes(app: FastifyInstance) {
  app.post("/api/v1/projects/:projectId/assets", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const body = createAssetsSchema.parse(request.body);
    const assets = await createAssets(projectId, body);

    if (!assets) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado para salvar assets.",
        },
      });
    }

    return reply.code(201).send({
      items: assets,
    });
  });

  app.get("/api/v1/projects/:projectId/assets", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const assets = await listAssets(projectId);

    if (!assets) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado para listar assets.",
        },
      });
    }

    return {
      items: assets,
    };
  });
}

import type { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { generationFailureSchema, generationSuccessSchema } from "./webhooks.schemas";
import { handleGenerationFailure, handleGenerationSuccess } from "./webhooks.service";

function isAuthorizedInternalRequest(token: unknown) {
  return typeof token === "string" && token === env.N8N_INTERNAL_TOKEN;
}

export async function registerWebhookRoutes(app: FastifyInstance) {
  app.post("/api/v1/internal/generation-callbacks/success", async (request, reply) => {
    if (!isAuthorizedInternalRequest(request.headers["x-internal-token"])) {
      return reply.code(401).send({
        error: {
          code: "UNAUTHORIZED_INTERNAL_REQUEST",
          message: "Token interno invalido.",
        },
      });
    }

    const body = generationSuccessSchema.parse(request.body);
    const result = await handleGenerationSuccess(body);

    if (!result) {
      return reply.code(404).send({
        error: {
          code: "JOB_NOT_FOUND",
          message: "Job nao encontrado para callback de sucesso.",
        },
      });
    }

    return result;
  });

  app.post("/api/v1/internal/generation-callbacks/failure", async (request, reply) => {
    if (!isAuthorizedInternalRequest(request.headers["x-internal-token"])) {
      return reply.code(401).send({
        error: {
          code: "UNAUTHORIZED_INTERNAL_REQUEST",
          message: "Token interno invalido.",
        },
      });
    }

    const body = generationFailureSchema.parse(request.body);
    const result = await handleGenerationFailure(body);

    if (!result) {
      return reply.code(404).send({
        error: {
          code: "JOB_NOT_FOUND",
          message: "Job nao encontrado para callback de erro.",
        },
      });
    }

    return result;
  });
}

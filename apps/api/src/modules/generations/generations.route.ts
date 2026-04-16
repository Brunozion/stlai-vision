import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { projectIdParamsSchema } from "../projects/projects.schemas";
import {
  createImageGenerationSchema,
  createTextGenerationSchema,
} from "./generations.schemas";
import {
  createImageGeneration,
  createTextGeneration,
  getJobById,
  listProjectJobs,
} from "./generations.service";

const jobIdParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export async function registerGenerationRoutes(app: FastifyInstance) {
  app.post("/api/v1/projects/:projectId/generations/text", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const body = createTextGenerationSchema.parse(request.body);
    const job = await createTextGeneration(projectId, body);

    if (!job) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado para gerar texto.",
        },
      });
    }

    return reply.code(201).send(job);
  });

  app.post("/api/v1/projects/:projectId/generations/images", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const body = createImageGenerationSchema.parse(request.body);
    const job = await createImageGeneration(projectId, body);

    if (!job) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado para gerar imagens.",
        },
      });
    }

    return reply.code(201).send(job);
  });

  app.get("/api/v1/projects/:projectId/jobs", async (request, reply) => {
    const { projectId } = projectIdParamsSchema.parse(request.params);
    const jobs = await listProjectJobs(projectId);

    if (!jobs) {
      return reply.code(404).send({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Projeto nao encontrado para listar jobs.",
        },
      });
    }

    return {
      items: jobs,
    };
  });

  app.get("/api/v1/jobs/:jobId", async (request, reply) => {
    const { jobId } = jobIdParamsSchema.parse(request.params);
    const job = await getJobById(jobId);

    if (!job) {
      return reply.code(404).send({
        error: {
          code: "JOB_NOT_FOUND",
          message: "Job nao encontrado.",
        },
      });
    }

    return job;
  });
}

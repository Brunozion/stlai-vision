import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerGenerationRoutes } from "../modules/generations/generations.route";
import { registerHealthRoute } from "../modules/health/health.route";
import { registerProjectRoutes } from "../modules/projects/projects.route";
import { registerResultRoutes } from "../modules/results/results.route";
import { registerUploadRoutes } from "../modules/uploads/uploads.route";
import { registerWebhookRoutes } from "../modules/webhooks/webhooks.route";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: "info",
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.x-internal-token",
          "config.headers.Authorization",
          "config.headers.x-internal-token",
        ],
        censor: "[REDACTED]",
      },
    },
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await registerHealthRoute(app);
  await registerProjectRoutes(app);
  await registerResultRoutes(app);
  await registerUploadRoutes(app);
  await registerGenerationRoutes(app);
  await registerWebhookRoutes(app);

  return app;
}

import cors from "@fastify/cors";
import Fastify from "fastify";
import { corsOrigins } from "../config/env";
import { registerGenerationRoutes } from "../modules/generations/generations.route";
import { registerHealthRoute } from "../modules/health/health.route";
import { registerProjectRoutes } from "../modules/projects/projects.route";
import { registerResultRoutes } from "../modules/results/results.route";
import { registerUploadRoutes } from "../modules/uploads/uploads.route";
import { registerWebhookRoutes } from "../modules/webhooks/webhooks.route";

function isAllowedOrigin(origin: string) {
  if (corsOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);

    if (protocol !== "https:") {
      return false;
    }

    // Permite o dominio principal e previews da Vercel para o frontend do STLAI Vision.
    return hostname === "stlai-vision-web.vercel.app" || hostname.endsWith("-brunozions-projects.vercel.app");
  } catch {
    return false;
  }
}

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
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin nao permitida pelo CORS"), false);
    },
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

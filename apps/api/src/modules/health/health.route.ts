import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "@stlai/shared";
import { env } from "../../config/env";
import { checkDatabaseConnection } from "../../lib/db";

export async function registerHealthRoute(app: FastifyInstance) {
  app.get("/api/v1/health", async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      service: "api",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api/v1/health/db", async () => {
    const db = await checkDatabaseConnection();

    return {
      status: "ok",
      service: "api",
      database: db.ok ? "connected" : "disconnected",
      environment: env.NODE_ENV,
      serverTime: db.serverTime,
      timestamp: new Date().toISOString(),
    };
  });
}

import { buildApp } from "./app/build-app";
import { env } from "./config/env";
import { closeDatabase } from "./lib/db";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.PORT,
    });

    const shutdown = async () => {
      await app.close();
      await closeDatabase();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();

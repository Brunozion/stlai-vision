import pg from "pg";
import { env } from "../../config/env";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
}

export async function checkDatabaseConnection() {
  const client = await getDb().connect();

  try {
    const result = await client.query<{ now: string }>("select now()::text as now");
    return {
      ok: true,
      serverTime: result.rows[0]?.now ?? null,
    };
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

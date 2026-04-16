import { env } from "../../config/env";
import { getDb } from "../../lib/db";

interface DevUserRecord {
  id: string;
  email: string;
  name: string | null;
}

export async function getOrCreateDevUser(): Promise<DevUserRecord> {
  const db = getDb();

  const existingUser = await db.query<DevUserRecord>(
    `
      select id, email, name
      from users
      where email = $1
      limit 1
    `,
    [env.DEV_USER_EMAIL],
  );

  if (existingUser.rowCount) {
    return existingUser.rows[0];
  }

  const createdUser = await db.query<DevUserRecord>(
    `
      insert into users (email, name)
      values ($1, $2)
      returning id, email, name
    `,
    [env.DEV_USER_EMAIL, env.DEV_USER_NAME],
  );

  return createdUser.rows[0];
}

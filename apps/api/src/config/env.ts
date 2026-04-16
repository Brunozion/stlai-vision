import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_BASE_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter ao menos 16 caracteres"),
  INTERNAL_API_TOKEN: z.string().min(16, "INTERNAL_API_TOKEN deve ter ao menos 16 caracteres"),
  N8N_BASE_URL: z.string().url(),
  N8N_INTERNAL_TOKEN: z.string().min(16, "N8N_INTERNAL_TOKEN deve ter ao menos 16 caracteres"),
  N8N_ENABLED: z.coerce.boolean().default(false),
  N8N_TEXT_WEBHOOK_PATH: z.string().min(1),
  N8N_IMAGE_WEBHOOK_PATH: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  DEV_USER_EMAIL: z.string().email().default("dev@stlai.local"),
  DEV_USER_NAME: z.string().min(1).default("STLAI Dev User"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Falha ao validar variaveis de ambiente.");
  console.error(parsedEnv.error.flatten().fieldErrors);
  throw new Error("Configuracao de ambiente invalida.");
}

export const env = parsedEnv.data;

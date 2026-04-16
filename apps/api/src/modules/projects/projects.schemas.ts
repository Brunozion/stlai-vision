import { z } from "zod";
import { PLAN_TYPES, PROJECT_STATUSES } from "../../shared/constants/project";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(150),
  language: z.string().trim().min(2).max(10).default("pt-BR"),
  planType: z.enum(PLAN_TYPES).default("basic"),
});

export const projectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export const updateProjectContextSchema = z.object({
  productName: z.string().trim().min(1).max(200),
  category: z.string().trim().max(120).nullish(),
  shortContext: z.string().trim().max(5000).nullish(),
  dimensionsXcm: z.number().nonnegative().nullish(),
  dimensionsYcm: z.number().nonnegative().nullish(),
  dimensionsZcm: z.number().nonnegative().nullish(),
  weightGrams: z.number().nonnegative().nullish(),
  voltage: z.string().trim().max(20).nullish(),
  color: z.string().trim().max(80).nullish(),
  material: z.string().trim().max(120).nullish(),
  targetMarketplaces: z.array(z.string().trim().min(1)).nullish(),
  extraAttributes: z.record(z.string(), z.unknown()).nullish(),
});

export const projectStatusSchema = z.enum(PROJECT_STATUSES);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
export type UpdateProjectContextInput = z.infer<typeof updateProjectContextSchema>;

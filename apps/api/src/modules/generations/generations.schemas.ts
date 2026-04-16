import { z } from "zod";

export const createTextGenerationSchema = z.object({
  mode: z.string().trim().min(1).default("default"),
});

export const createImageGenerationSchema = z.object({
  preset: z.string().trim().min(1).default("default_8_pack"),
  aspectRatio: z.string().trim().min(1).default("1:1"),
  sizes: z.array(z.number().int().positive()).default([1000]),
});

export type CreateTextGenerationInput = z.infer<typeof createTextGenerationSchema>;
export type CreateImageGenerationInput = z.infer<typeof createImageGenerationSchema>;

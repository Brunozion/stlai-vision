import { z } from "zod";

const imageItemSchema = z.object({
  imageKind: z.string().trim().min(1),
  title: z.string().trim().min(1).optional(),
  fileUrl: z.string().url(),
  storageKey: z.string().trim().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  variationIndex: z.number().int().nonnegative().optional(),
  promptUsed: z.string().optional(),
});

export const generationSuccessSchema = z.object({
  jobId: z.string().uuid(),
  jobType: z.enum(["text_generation", "image_generation"]),
  provider: z.string().trim().min(1),
  result: z.object({
    titles: z.array(z.string()).optional(),
    description: z.string().optional(),
    bullets: z.array(z.string()).optional(),
    seoKeywords: z.array(z.string()).optional(),
    images: z.array(imageItemSchema).optional(),
  }),
  // Fallback para fluxos n8n que enviam imagens fora de result.
  images: z.array(imageItemSchema).optional(),
});

export const generationFailureSchema = z.object({
  jobId: z.string().uuid(),
  jobType: z.enum(["text_generation", "image_generation"]),
  provider: z.string().trim().min(1),
  errorCode: z.string().trim().min(1),
  errorMessage: z.string().trim().min(1),
});

export type GenerationSuccessInput = z.infer<typeof generationSuccessSchema>;
export type GenerationFailureInput = z.infer<typeof generationFailureSchema>;

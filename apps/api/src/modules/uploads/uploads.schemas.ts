import { z } from "zod";

export const createAssetsSchema = z.object({
  assets: z.array(
    z.object({
      storageKey: z.string().trim().min(1),
      fileUrl: z.string().trim().min(1),
      mimeType: z.string().trim().min(1).max(100),
      width: z.number().int().positive().nullish(),
      height: z.number().int().positive().nullish(),
      sizeBytes: z.number().int().nonnegative().nullish(),
      sortOrder: z.number().int().nonnegative().default(0),
      assetRole: z.enum(["source", "reference"]).default("source"),
    }),
  ).min(1).max(5),
});

export type CreateAssetsInput = z.infer<typeof createAssetsSchema>;

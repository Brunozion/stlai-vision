export const PROJECT_STATUSES = [
  "draft",
  "context_completed",
  "text_generating",
  "text_review",
  "image_generating",
  "completed",
  "failed",
] as const;

export const GENERATION_JOB_TYPES = [
  "text_generation",
  "image_generation",
  "image_regeneration",
  "video_generation",
] as const;

export const GENERATION_JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export const PLAN_TYPES = ["basic", "premium"] as const;

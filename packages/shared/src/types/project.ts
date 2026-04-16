import {
  GENERATION_JOB_STATUSES,
  GENERATION_JOB_TYPES,
  PLAN_TYPES,
  PROJECT_STATUSES,
} from "../constants/project";

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type GenerationJobType = (typeof GENERATION_JOB_TYPES)[number];
export type GenerationJobStatus = (typeof GENERATION_JOB_STATUSES)[number];
export type PlanType = (typeof PLAN_TYPES)[number];

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  language: string;
  planType: PlanType;
  coverImageUrl?: string;
  createdAt: string;
}

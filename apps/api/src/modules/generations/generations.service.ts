import { getDb } from "../../lib/db";
import { triggerN8nWorkflow } from "../../lib/n8n";
import { env } from "../../config/env";
import { getProjectById, getProjectContext } from "../projects/projects.service";
import { listAssets } from "../uploads/uploads.service";
import type {
  CreateImageGenerationInput,
  CreateTextGenerationInput,
} from "./generations.schemas";

interface GenerationJobRow {
  id: string;
  project_id: string;
  job_type: string;
  status: string;
  provider: string | null;
  prompt_version: string | null;
  credits_reserved: number;
  credits_spent: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

function mapJob(row: GenerationJobRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    jobType: row.job_type,
    status: row.status,
    provider: row.provider,
    promptVersion: row.prompt_version,
    creditsReserved: row.credits_reserved,
    creditsSpent: row.credits_spent,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

async function insertGenerationJob(params: {
  projectId: string;
  jobType: "text_generation" | "image_generation";
  provider: string;
  promptVersion: string;
  creditsReserved: number;
  inputPayload: unknown;
}) {
  const db = getDb();
  const result = await db.query<GenerationJobRow>(
    `
      insert into generation_jobs (
        project_id,
        job_type,
        status,
        provider,
        prompt_version,
        credits_reserved,
        input_payload
      )
      values ($1, $2, 'queued', $3, $4, $5, $6::jsonb)
      returning
        id,
        project_id,
        job_type,
        status,
        provider,
        prompt_version,
        credits_reserved,
        credits_spent,
        started_at,
        completed_at,
        error_message,
        created_at
    `,
    [
      params.projectId,
      params.jobType,
      params.provider,
      params.promptVersion,
      params.creditsReserved,
      JSON.stringify(params.inputPayload),
    ],
  );

  return mapJob(result.rows[0]);
}

async function markJobProcessing(jobId: string) {
  await getDb().query(
    `
      update generation_jobs
      set status = 'processing', started_at = now()
      where id = $1 and status = 'queued'
    `,
    [jobId],
  );
}

async function markJobFailed(jobId: string, message: string) {
  await getDb().query(
    `
      update generation_jobs
      set status = 'failed', error_message = $2
      where id = $1
    `,
    [jobId, message],
  );
}

function buildCallbackUrl(kind: "success" | "failure") {
  return new URL(`/api/v1/internal/generation-callbacks/${kind}`, env.APP_BASE_URL).toString();
}

export async function createTextGeneration(projectId: string, input: CreateTextGenerationInput) {
  const project = await getProjectById(projectId);
  if (!project) return null;
  const [context, assets] = await Promise.all([getProjectContext(projectId), listAssets(projectId)]);

  const db = getDb();
  await db.query(
    `
      update projects
      set status = 'text_generating', updated_at = now()
      where id = $1
    `,
    [projectId],
  );

  const job = await insertGenerationJob({
    projectId,
    jobType: "text_generation",
    provider: "openai",
    promptVersion: "text_v1",
    creditsReserved: 5,
    inputPayload: input,
  });

  try {
    await triggerN8nWorkflow({
      jobId: job.id,
      projectId,
      workflow: "text",
      payload: {
        jobType: "text_generation",
        language: project.language,
        mode: input.mode,
        promptVersion: job.promptVersion,
        project,
        productContext: context,
        sourceImages: assets?.map((asset) => ({
          id: asset.id,
          fileUrl: asset.fileUrl,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
          assetRole: asset.assetRole,
        })) ?? [],
        callbacks: {
          successUrl: buildCallbackUrl("success"),
          failureUrl: buildCallbackUrl("failure"),
          token: env.N8N_INTERNAL_TOKEN,
        },
      },
    });
    await markJobProcessing(job.id);
  } catch (error) {
    await markJobFailed(job.id, error instanceof Error ? error.message : "Falha ao disparar workflow de texto.");
    throw error;
  }

  return {
    ...job,
    status: env.N8N_ENABLED ? "processing" : job.status,
  };
}

export async function createImageGeneration(projectId: string, input: CreateImageGenerationInput) {
  const project = await getProjectById(projectId);
  if (!project) return null;
  const [context, assets] = await Promise.all([getProjectContext(projectId), listAssets(projectId)]);

  const db = getDb();
  await db.query(
    `
      update projects
      set status = 'image_generating', updated_at = now()
      where id = $1
    `,
    [projectId],
  );

  const job = await insertGenerationJob({
    projectId,
    jobType: "image_generation",
    provider: "nano-banana-2",
    promptVersion: "img_v1",
    creditsReserved: 20,
    inputPayload: input,
  });

  try {
    await triggerN8nWorkflow({
      jobId: job.id,
      projectId,
      workflow: "image",
      payload: {
        jobType: "image_generation",
        language: project.language,
        preset: input.preset,
        aspectRatio: input.aspectRatio,
        sizes: input.sizes,
        promptVersion: job.promptVersion,
        project,
        productContext: context,
        sourceImages: assets?.map((asset) => ({
          id: asset.id,
          fileUrl: asset.fileUrl,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
          assetRole: asset.assetRole,
        })) ?? [],
        callbacks: {
          successUrl: buildCallbackUrl("success"),
          failureUrl: buildCallbackUrl("failure"),
          token: env.N8N_INTERNAL_TOKEN,
        },
      },
    });
    await markJobProcessing(job.id);
  } catch (error) {
    await markJobFailed(job.id, error instanceof Error ? error.message : "Falha ao disparar workflow de imagem.");
    throw error;
  }

  return {
    ...job,
    status: env.N8N_ENABLED ? "processing" : job.status,
  };
}

export async function listProjectJobs(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const db = getDb();
  const result = await db.query<GenerationJobRow>(
    `
      select
        id,
        project_id,
        job_type,
        status,
        provider,
        prompt_version,
        credits_reserved,
        credits_spent,
        started_at,
        completed_at,
        error_message,
        created_at
      from generation_jobs
      where project_id = $1
      order by created_at desc
    `,
    [projectId],
  );

  return result.rows.map(mapJob);
}

export async function getJobById(jobId: string) {
  const result = await getDb().query<GenerationJobRow>(
    `
      select
        id,
        project_id,
        job_type,
        status,
        provider,
        prompt_version,
        credits_reserved,
        credits_spent,
        started_at,
        completed_at,
        error_message,
        created_at
      from generation_jobs
      where id = $1
      limit 1
    `,
    [jobId],
  );

  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

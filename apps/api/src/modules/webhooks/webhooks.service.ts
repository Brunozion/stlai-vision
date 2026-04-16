import { getDb } from "../../lib/db";
import type { GenerationFailureInput, GenerationSuccessInput } from "./webhooks.schemas";

export async function handleGenerationSuccess(input: GenerationSuccessInput) {
  const db = getDb();

  const jobResult = await db.query<{ id: string; project_id: string; job_type: string; credits_reserved: number }>(
    `
      select id, project_id, job_type, credits_reserved
      from generation_jobs
      where id = $1
      limit 1
    `,
    [input.jobId],
  );

  if (!jobResult.rowCount) {
    return null;
  }

  const job = jobResult.rows[0];

  await db.query(
    `
      update generation_jobs
      set
        status = 'completed',
        provider = $2,
        output_payload = $3::jsonb,
        completed_at = now(),
        error_code = null,
        error_message = null
      where id = $1
    `,
    [input.jobId, input.provider, JSON.stringify(input.result)],
  );

  if (input.jobType === "text_generation" && input.result.titles && input.result.description) {
    await db.query(`update text_results set is_current = false where project_id = $1`, [job.project_id]);

    await db.query(
      `
        insert into text_results (
          project_id,
          generation_job_id,
          titles,
          description,
          bullets,
          seo_keywords,
          language,
          is_current,
          approved_by_user
        )
        values ($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb, 'pt-BR', true, false)
      `,
      [
        job.project_id,
        input.jobId,
        JSON.stringify(input.result.titles),
        input.result.description,
        JSON.stringify(input.result.bullets ?? []),
        JSON.stringify(input.result.seoKeywords ?? []),
      ],
    );

    await db.query(`update projects set status = 'text_review', updated_at = now() where id = $1`, [job.project_id]);
  }

  if (input.jobType === "image_generation" && input.result.images?.length) {
    await db.query(`update image_results set is_current = false where project_id = $1`, [job.project_id]);

    for (const image of input.result.images) {
      await db.query(
        `
          insert into image_results (
            project_id,
            generation_job_id,
            storage_key,
            file_url,
            image_kind,
            title,
            prompt_used,
            provider,
            width,
            height,
            variation_index,
            is_current
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        `,
        [
          job.project_id,
          input.jobId,
          image.storageKey ?? image.fileUrl,
          image.fileUrl,
          image.imageKind,
          image.title ?? null,
          image.promptUsed ?? null,
          input.provider,
          image.width ?? null,
          image.height ?? null,
          image.variationIndex ?? null,
        ],
      );
    }

    await db.query(`update projects set status = 'completed', updated_at = now() where id = $1`, [job.project_id]);
  }

  if (job.credits_reserved > 0) {
    await db.query(
      `
        insert into credit_transactions (
          user_id,
          project_id,
          generation_job_id,
          transaction_type,
          amount,
          metadata
        )
        select
          p.user_id,
          p.id,
          $1,
          'consume',
          $2,
          $3::jsonb
        from projects p
        where p.id = $4
          and not exists (
            select 1
            from credit_transactions ct
            where ct.generation_job_id = $1
              and ct.transaction_type = 'consume'
          )
      `,
      [input.jobId, job.credits_reserved, JSON.stringify({ provider: input.provider, jobType: input.jobType }), job.project_id],
    );
  }

  return {
    ok: true,
    jobId: input.jobId,
  };
}

export async function handleGenerationFailure(input: GenerationFailureInput) {
  const db = getDb();

  const jobResult = await db.query<{ id: string; project_id: string; credits_reserved: number }>(
    `
      select id, project_id, credits_reserved
      from generation_jobs
      where id = $1
      limit 1
    `,
    [input.jobId],
  );

  if (!jobResult.rowCount) {
    return null;
  }

  await db.query(
    `
      update generation_jobs
      set
        status = 'failed',
        provider = $2,
        error_code = $3,
        error_message = $4
      where id = $1
    `,
    [input.jobId, input.provider, input.errorCode, input.errorMessage],
  );

  await db.query(`update projects set status = 'failed', updated_at = now() where id = $1`, [
    jobResult.rows[0].project_id,
  ]);

  if (jobResult.rows[0].credits_reserved > 0) {
    await db.query(
      `
        insert into credit_transactions (
          user_id,
          project_id,
          generation_job_id,
          transaction_type,
          amount,
          metadata
        )
        select
          p.user_id,
          p.id,
          $1,
          'refund',
          $2,
          $3::jsonb
        from projects p
        where p.id = $4
          and not exists (
            select 1
            from credit_transactions ct
            where ct.generation_job_id = $1
              and ct.transaction_type = 'refund'
          )
      `,
      [
        input.jobId,
        jobResult.rows[0].credits_reserved,
        JSON.stringify({ provider: input.provider, jobType: input.jobType, errorCode: input.errorCode }),
        jobResult.rows[0].project_id,
      ],
    );
  }

  return {
    ok: true,
    jobId: input.jobId,
  };
}

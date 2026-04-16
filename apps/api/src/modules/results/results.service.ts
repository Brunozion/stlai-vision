import { getDb } from "../../lib/db";
import { getProjectById } from "../projects/projects.service";

interface TextResultRow {
  id: string;
  project_id: string;
  titles: unknown;
  description: string;
  bullets: unknown;
  seo_keywords: unknown;
  language: string;
  approved_by_user: boolean;
  approved_at: string | null;
  created_at: string;
}

interface ImageResultRow {
  id: string;
  project_id: string;
  storage_key: string;
  file_url: string;
  image_kind: string;
  title: string | null;
  prompt_used: string | null;
  provider: string | null;
  width: number | null;
  height: number | null;
  variation_index: number | null;
  created_at: string;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function getCurrentTextResult(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const db = getDb();
  const result = await db.query<TextResultRow>(
    `
      select
        id,
        project_id,
        titles,
        description,
        bullets,
        seo_keywords,
        language,
        approved_by_user,
        approved_at,
        created_at
      from text_results
      where project_id = $1 and is_current = true
      order by created_at desc
      limit 1
    `,
    [projectId],
  );

  const row = result.rows[0];
  if (!row) return { project, textResult: null };

  return {
    project,
    textResult: {
      id: row.id,
      projectId: row.project_id,
      titles: asStringArray(row.titles),
      description: row.description,
      bullets: asStringArray(row.bullets),
      seoKeywords: asStringArray(row.seo_keywords),
      language: row.language,
      approvedByUser: row.approved_by_user,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
    },
  };
}

export async function approveTextResult(projectId: string, textResultId: string) {
  const current = await getCurrentTextResult(projectId);
  if (!current?.textResult || current.textResult.id !== textResultId) {
    return null;
  }

  const db = getDb();
  await db.query(
    `
      update text_results
      set approved_by_user = true, approved_at = now()
      where id = $1 and project_id = $2
    `,
    [textResultId, projectId],
  );

  const refreshed = await getCurrentTextResult(projectId);
  return refreshed?.textResult ?? null;
}

export async function listCurrentImageResults(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const db = getDb();
  const result = await db.query<ImageResultRow>(
    `
      select
        id,
        project_id,
        storage_key,
        file_url,
        image_kind,
        title,
        prompt_used,
        provider,
        width,
        height,
        variation_index,
        created_at
      from image_results
      where project_id = $1 and is_current = true
      order by variation_index asc nulls last, created_at asc
    `,
    [projectId],
  );

  return {
    project,
    items: result.rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      storageKey: row.storage_key,
      fileUrl: row.file_url,
      imageKind: row.image_kind,
      title: row.title,
      promptUsed: row.prompt_used,
      provider: row.provider,
      width: row.width,
      height: row.height,
      variationIndex: row.variation_index,
      createdAt: row.created_at,
    })),
  };
}

export async function getProjectSummary(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const [textResult, imageResults, credits] = await Promise.all([
    getCurrentTextResult(projectId),
    listCurrentImageResults(projectId),
    getDb().query<{ total_spent: string | null }>(
      `
        select coalesce(sum(case when amount > 0 then amount else 0 end), 0)::text as total_spent
        from credit_transactions
        where project_id = $1 and transaction_type = 'consume'
      `,
      [projectId],
    ),
  ]);

  return {
    project,
    text: textResult?.textResult
      ? {
          titles: textResult.textResult.titles,
          description: textResult.textResult.description,
          bullets: textResult.textResult.bullets,
          approvedByUser: textResult.textResult.approvedByUser,
        }
      : null,
    images: {
      count: imageResults?.items.length ?? 0,
      items: imageResults?.items ?? [],
    },
    videos: {
      count: 0,
      status: "not_enabled",
    },
    credits: {
      totalSpent: Number(credits.rows[0]?.total_spent ?? "0"),
    },
  };
}

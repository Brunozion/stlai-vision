import type { ProjectSummary } from "@stlai/shared";
import { getDb } from "../../lib/db";
import { getOrCreateDevUser } from "../users/dev-user";
import type { CreateProjectInput, UpdateProjectContextInput } from "./projects.schemas";

interface ProjectRow {
  id: string;
  name: string | null;
  status: ProjectSummary["status"];
  language: string;
  plan_type: ProjectSummary["planType"];
  cover_image_url: string | null;
  created_at: string;
}

interface ProductContextRow {
  id: string;
  project_id: string;
  product_name: string;
  category: string | null;
  short_context: string | null;
  dimensions_x_cm: string | null;
  dimensions_y_cm: string | null;
  dimensions_z_cm: string | null;
  weight_grams: string | null;
  voltage: string | null;
  color: string | null;
  material: string | null;
  target_marketplaces: unknown;
  extra_attributes: unknown;
  created_at: string;
  updated_at: string;
}

function mapProjectContext(row: ProductContextRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    productName: row.product_name,
    category: row.category,
    shortContext: row.short_context,
    dimensionsXcm: row.dimensions_x_cm ? Number(row.dimensions_x_cm) : null,
    dimensionsYcm: row.dimensions_y_cm ? Number(row.dimensions_y_cm) : null,
    dimensionsZcm: row.dimensions_z_cm ? Number(row.dimensions_z_cm) : null,
    weightGrams: row.weight_grams ? Number(row.weight_grams) : null,
    voltage: row.voltage,
    color: row.color,
    material: row.material,
    targetMarketplaces: Array.isArray(row.target_marketplaces) ? row.target_marketplaces : [],
    extraAttributes:
      row.extra_attributes && !Array.isArray(row.extra_attributes) ? row.extra_attributes : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProject(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name ?? "Sem nome",
    status: row.status,
    language: row.language,
    planType: row.plan_type,
    coverImageUrl: row.cover_image_url ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listProjects() {
  const user = await getOrCreateDevUser();
  const db = getDb();

  const result = await db.query<ProjectRow>(
    `
      select id, name, status, language, plan_type, cover_image_url, created_at
      from projects
      where user_id = $1
      order by created_at desc
    `,
    [user.id],
  );

  return result.rows.map(mapProject);
}

export async function createProject(input: CreateProjectInput) {
  const user = await getOrCreateDevUser();
  const db = getDb();

  const result = await db.query<ProjectRow>(
    `
      insert into projects (user_id, name, language, plan_type, status)
      values ($1, $2, $3, $4, 'draft')
      returning id, name, status, language, plan_type, cover_image_url, created_at
    `,
    [user.id, input.name, input.language, input.planType],
  );

  return mapProject(result.rows[0]);
}

export async function getProjectById(projectId: string) {
  const user = await getOrCreateDevUser();
  const db = getDb();

  const result = await db.query<ProjectRow>(
    `
      select id, name, status, language, plan_type, cover_image_url, created_at
      from projects
      where id = $1 and user_id = $2
      limit 1
    `,
    [projectId, user.id],
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function upsertProjectContext(projectId: string, input: UpdateProjectContextInput) {
  const user = await getOrCreateDevUser();
  const db = getDb();

  const projectResult = await db.query<{ id: string }>(
    `
      select id
      from projects
      where id = $1 and user_id = $2
      limit 1
    `,
    [projectId, user.id],
  );

  if (!projectResult.rowCount) {
    return null;
  }

  const contextResult = await db.query<ProductContextRow>(
    `
      insert into product_contexts (
        project_id,
        product_name,
        category,
        short_context,
        dimensions_x_cm,
        dimensions_y_cm,
        dimensions_z_cm,
        weight_grams,
        voltage,
        color,
        material,
        target_marketplaces,
        extra_attributes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb)
      on conflict (project_id)
      do update set
        product_name = excluded.product_name,
        category = excluded.category,
        short_context = excluded.short_context,
        dimensions_x_cm = excluded.dimensions_x_cm,
        dimensions_y_cm = excluded.dimensions_y_cm,
        dimensions_z_cm = excluded.dimensions_z_cm,
        weight_grams = excluded.weight_grams,
        voltage = excluded.voltage,
        color = excluded.color,
        material = excluded.material,
        target_marketplaces = excluded.target_marketplaces,
        extra_attributes = excluded.extra_attributes,
        updated_at = now()
      returning
        id,
        project_id,
        product_name,
        category,
        short_context,
        dimensions_x_cm,
        dimensions_y_cm,
        dimensions_z_cm,
        weight_grams,
        voltage,
        color,
        material,
        target_marketplaces,
        extra_attributes,
        created_at,
        updated_at
    `,
    [
      projectId,
      input.productName,
      input.category ?? null,
      input.shortContext ?? null,
      input.dimensionsXcm ?? null,
      input.dimensionsYcm ?? null,
      input.dimensionsZcm ?? null,
      input.weightGrams ?? null,
      input.voltage ?? null,
      input.color ?? null,
      input.material ?? null,
      JSON.stringify(input.targetMarketplaces ?? []),
      JSON.stringify(input.extraAttributes ?? {}),
    ],
  );

  await db.query(
    `
      update projects
      set status = 'context_completed', updated_at = now()
      where id = $1
    `,
    [projectId],
  );

  return mapProjectContext(contextResult.rows[0]);
}

export async function getProjectContext(projectId: string) {
  const user = await getOrCreateDevUser();
  const db = getDb();

  const result = await db.query<ProductContextRow>(
    `
      select
        pc.id,
        pc.project_id,
        pc.product_name,
        pc.category,
        pc.short_context,
        pc.dimensions_x_cm,
        pc.dimensions_y_cm,
        pc.dimensions_z_cm,
        pc.weight_grams,
        pc.voltage,
        pc.color,
        pc.material,
        pc.target_marketplaces,
        pc.extra_attributes,
        pc.created_at,
        pc.updated_at
      from product_contexts pc
      inner join projects p on p.id = pc.project_id
      where pc.project_id = $1 and p.user_id = $2
      limit 1
    `,
    [projectId, user.id],
  );

  return result.rows[0] ? mapProjectContext(result.rows[0]) : null;
}

import { getDb } from "../../lib/db";
import { getProjectById } from "../projects/projects.service";
import type { CreateAssetsInput } from "./uploads.schemas";

interface UploadedAssetRow {
  id: string;
  project_id: string;
  storage_key: string;
  file_url: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  asset_role: string;
  sort_order: number;
  created_at: string;
}

function mapAsset(row: UploadedAssetRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    storageKey: row.storage_key,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    sizeBytes: row.size_bytes ? Number(row.size_bytes) : null,
    assetRole: row.asset_role,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function createAssets(projectId: string, input: CreateAssetsInput) {
  const project = await getProjectById(projectId);

  if (!project) {
    return null;
  }

  const db = getDb();
  const items = [];

  for (const asset of input.assets) {
    const result = await db.query<UploadedAssetRow>(
      `
        insert into uploaded_assets (
          project_id,
          storage_key,
          file_url,
          mime_type,
          width,
          height,
          size_bytes,
          asset_role,
          sort_order
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning
          id,
          project_id,
          storage_key,
          file_url,
          mime_type,
          width,
          height,
          size_bytes,
          asset_role,
          sort_order,
          created_at
      `,
      [
        projectId,
        asset.storageKey,
        asset.fileUrl,
        asset.mimeType,
        asset.width ?? null,
        asset.height ?? null,
        asset.sizeBytes ?? null,
        asset.assetRole,
        asset.sortOrder,
      ],
    );

    items.push(mapAsset(result.rows[0]));
  }

  await db.query(
    `
      update projects
      set cover_image_url = coalesce(cover_image_url, $2), updated_at = now()
      where id = $1
    `,
    [projectId, items[0]?.fileUrl ?? null],
  );

  return items;
}

export async function listAssets(projectId: string) {
  const project = await getProjectById(projectId);

  if (!project) {
    return null;
  }

  const db = getDb();
  const result = await db.query<UploadedAssetRow>(
    `
      select
        id,
        project_id,
        storage_key,
        file_url,
        mime_type,
        width,
        height,
        size_bytes,
        asset_role,
        sort_order,
        created_at
      from uploaded_assets
      where project_id = $1
      order by sort_order asc, created_at asc
    `,
    [projectId],
  );

  return result.rows.map(mapAsset);
}

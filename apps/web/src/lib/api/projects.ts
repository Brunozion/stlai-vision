import { getApiBaseUrl } from "./config";

export interface ProjectListItem {
  id: string;
  name: string;
  status: string;
  language: string;
  planType: string;
  coverImageUrl?: string;
  createdAt: string;
}

export interface ProjectContext {
  id: string;
  projectId: string;
  productName: string;
  category: string | null;
  shortContext: string | null;
  dimensionsXcm: number | null;
  dimensionsYcm: number | null;
  dimensionsZcm: number | null;
  weightGrams: number | null;
  voltage: string | null;
  color: string | null;
  material: string | null;
  targetMarketplaces: string[];
  extraAttributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedAsset {
  id: string;
  projectId: string;
  storageKey: string;
  fileUrl: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  assetRole: string;
  sortOrder: number;
  createdAt: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  jobType: string;
  status: string;
  provider: string | null;
  promptVersion: string | null;
  creditsReserved: number;
  creditsSpent: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface TextResult {
  id: string;
  projectId: string;
  titles: string[];
  description: string;
  bullets: string[];
  seoKeywords: string[];
  language: string;
  approvedByUser: boolean;
  approvedAt: string | null;
  createdAt: string;
}

export interface ImageResult {
  id: string;
  projectId: string;
  storageKey: string;
  fileUrl: string;
  imageKind: string;
  title: string | null;
  promptUsed: string | null;
  provider: string | null;
  width: number | null;
  height: number | null;
  variationIndex: number | null;
  createdAt: string;
}

export interface ProjectSummaryResponse {
  project: ProjectListItem;
  text: {
    titles: string[];
    description: string;
    bullets: string[];
    approvedByUser: boolean;
  } | null;
  images: {
    count: number;
    items: ImageResult[];
  };
  videos: {
    count: number;
    status: string;
  };
  credits: {
    totalSpent: number;
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Falha ao consultar API.");
  }

  return response.json() as Promise<T>;
}

export async function listProjects() {
  return apiFetch<{ items: ProjectListItem[] }>("/api/v1/projects");
}

export async function getProject(projectId: string) {
  return apiFetch<ProjectListItem>(`/api/v1/projects/${projectId}`);
}

export async function getProjectContext(projectId: string) {
  try {
    return await apiFetch<ProjectContext>(`/api/v1/projects/${projectId}/context`);
  } catch {
    return null;
  }
}

export async function listAssets(projectId: string) {
  try {
    return await apiFetch<{ items: UploadedAsset[] }>(`/api/v1/projects/${projectId}/assets`);
  } catch {
    return { items: [] };
  }
}

export async function listJobs(projectId: string) {
  try {
    return await apiFetch<{ items: GenerationJob[] }>(`/api/v1/projects/${projectId}/jobs`);
  } catch {
    return { items: [] };
  }
}

export async function getTextResult(projectId: string) {
  try {
    return await apiFetch<TextResult>(`/api/v1/projects/${projectId}/text-result`);
  } catch {
    return null;
  }
}

export async function getImageResults(projectId: string) {
  try {
    return await apiFetch<{ items: ImageResult[] }>(`/api/v1/projects/${projectId}/image-results`);
  } catch {
    return { items: [] };
  }
}

export async function getProjectSummary(projectId: string) {
  try {
    return await apiFetch<ProjectSummaryResponse>(`/api/v1/projects/${projectId}/summary`);
  } catch {
    return null;
  }
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AssetForm } from "@/components/projects/asset-form";
import { ContextForm } from "@/components/projects/context-form";
import { GenerationPanel } from "@/components/projects/generation-panel";
import { ImageResultsPanel } from "@/components/projects/image-results-panel";
import { SummaryPanel } from "@/components/projects/summary-panel";
import { TextResultPanel } from "@/components/projects/text-result-panel";
import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  getProject,
  getProjectContext,
  getProjectSummary,
  getTextResult,
  getImageResults,
  listAssets,
  listJobs,
  type GenerationJob,
  type ImageResult,
  type TextResult,
  type UploadedAsset,
} from "@/lib/api/projects";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project;
  try {
    project = await getProject(projectId);
  } catch {
    notFound();
  }

  const [context, assets, jobs, textResult, imageResults, summary] = await Promise.all([
    getProjectContext(projectId),
    listAssets(projectId),
    listJobs(projectId),
    getTextResult(projectId),
    getImageResults(projectId),
    getProjectSummary(projectId),
  ]);

  return (
    <AppShell
      eyebrow="Operacao do projeto"
      title={project.name}
      actions={
        <div className="button-row">
          <Link className="ghost-link" href="/">
            Voltar
          </Link>
          <StatusPill value={project.status} />
        </div>
      }
    >
      <section className="project-meta-grid">
        <div className="meta-card">
          <span>Idioma</span>
          <strong>{project.language}</strong>
        </div>
        <div className="meta-card">
          <span>Plano</span>
          <strong>{project.planType}</strong>
        </div>
        <div className="meta-card">
          <span>Projeto</span>
          <strong>{project.id}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <SectionCard title="1. Assets de referencia" description="Por enquanto a tela recebe URL de imagem para agilizar o MVP.">
          <AssetForm projectId={projectId} />
          <div className="stack top-gap">
            {assets.items.map((asset: UploadedAsset) => (
              <div className="list-row" key={asset.id}>
                <div>
                  <strong>{asset.assetRole}</strong>
                  <p>{asset.fileUrl}</p>
                </div>
                <span>{asset.width}x{asset.height}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="2. Contexto do produto" description="Esses dados alimentam texto, imagem e o futuro fluxo de video.">
          <ContextForm initialContext={context} projectId={projectId} />
        </SectionCard>
      </section>

      <section className="dashboard-grid">
        <SectionCard title="3. Geracao" description="Disparo real de jobs no backend. O n8n pode ser ligado depois por env.">
          <GenerationPanel projectId={projectId} />
        </SectionCard>

        <SectionCard title="4. Jobs criados" description="Fila atual do projeto no backend.">
          <div className="stack">
            {jobs.items.length === 0 ? (
              <p className="muted-text">Nenhum job criado ainda.</p>
            ) : (
              jobs.items.map((job: GenerationJob) => (
                <div className="list-row" key={job.id}>
                  <div>
                    <strong>{job.jobType}</strong>
                    <p>{job.provider ?? "sem provider"}</p>
                  </div>
                  <StatusPill value={job.status} />
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </section>

      <section className="dashboard-grid">
        <SectionCard title="5. Textos gerados" description="Titulos e descricao retornados pelo pipeline de texto.">
          {textResult ? (
            <TextResultPanel projectId={projectId} textResult={textResult as TextResult} />
          ) : (
            <p className="muted-text">Ainda nao existe texto gerado para este projeto.</p>
          )}
        </SectionCard>

        <SectionCard title="6. Resumo do projeto" description="Visao consolidada do material produzido.">
          <SummaryPanel summary={summary} />
        </SectionCard>
      </section>

      <section className="dashboard-grid">
        <SectionCard title="7. Imagens geradas" description="Grid de resultados prontos para revisao e download.">
          <ImageResultsPanel items={imageResults.items as ImageResult[]} />
        </SectionCard>
      </section>
    </AppShell>
  );
}

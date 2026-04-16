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
  getImageResults,
  getProject,
  getProjectContext,
  getProjectSummary,
  getTextResult,
  listAssets,
  listJobs,
  type GenerationJob,
  type ImageResult,
  type TextResult,
  type UploadedAsset,
} from "@/lib/api/projects";

export const dynamic = "force-dynamic";

function getActiveStep({
  assetsCount,
  hasContext,
  hasText,
  hasImages,
  hasSummary,
  processingJob,
}: {
  assetsCount: number;
  hasContext: boolean;
  hasText: boolean;
  hasImages: boolean;
  hasSummary: boolean;
  processingJob?: GenerationJob;
}) {
  if (assetsCount === 0) {
    return "upload" as const;
  }

  if (!hasContext) {
    return "context" as const;
  }

  if (processingJob?.jobType === "image_generation") {
    return "image" as const;
  }

  if (processingJob?.jobType === "text_generation") {
    return "text" as const;
  }

  if (!hasText) {
    return "text" as const;
  }

  if (!hasImages) {
    return "image" as const;
  }

  if (hasSummary) {
    return "summary" as const;
  }

  return "video" as const;
}

function getCompletedSteps({
  assetsCount,
  hasContext,
  hasText,
  hasImages,
  hasSummary,
}: {
  assetsCount: number;
  hasContext: boolean;
  hasText: boolean;
  hasImages: boolean;
  hasSummary: boolean;
}) {
  const completed: Array<"upload" | "context" | "text" | "image" | "video" | "summary"> = [];

  if (assetsCount > 0) completed.push("upload");
  if (hasContext) completed.push("context");
  if (hasText) completed.push("text");
  if (hasImages) completed.push("image");
  if (hasSummary) completed.push("summary");

  return completed;
}

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

  const processingJob = jobs.items.find((job) => job.status === "processing" || job.status === "pending");
  const hasContext = Boolean(context?.productName);
  const hasText = Boolean(textResult);
  const hasImages = imageResults.items.length > 0;
  const hasSummary = Boolean(summary);
  const activeStep = getActiveStep({
    assetsCount: assets.items.length,
    hasContext,
    hasText,
    hasImages,
    hasSummary,
    processingJob,
  });
  const completedSteps = getCompletedSteps({
    assetsCount: assets.items.length,
    hasContext,
    hasText,
    hasImages,
    hasSummary,
  });

  return (
    <AppShell
      activeNav="new"
      activeStep={activeStep}
      completedSteps={completedSteps}
      eyebrow="Pipeline do anuncio"
      title={project.name}
      actions={<StatusPill value={project.status} />}
    >
      <div className="workflow-page">
        <section className="workflow-header">
          <div className="workflow-header__copy">
            <h1>{project.name}</h1>
            <p>
              Organize as referencias do produto, complete o contexto e acompanhe a geracao de textos, imagens e o
              resumo final do anuncio.
            </p>
          </div>

          <div className="button-row">
            <Link className="ghost-link" href="/">
              Voltar para workspace
            </Link>
          </div>
        </section>

        <section className="meta-grid">
          <div className="meta-card">
            <span>Plano</span>
            <strong>{project.planType}</strong>
          </div>
          <div className="meta-card">
            <span>Idioma</span>
            <strong>{project.language}</strong>
          </div>
          <div className="meta-card">
            <span>Projeto</span>
            <strong>{project.id}</strong>
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section__label">
            <span className="workflow-section__dot" />
            Etapa 1
          </div>
          <SectionCard
            description="No MVP atual, usamos URL da imagem para alimentar a API rapidamente. A interface ja segue a ideia do upload real."
            eyebrow="Upload"
            title="Envie as imagens de referencia"
          >
            <AssetForm projectId={projectId} />

            <div className="stack top-gap">
              {assets.items.length === 0 ? (
                <div className="empty-state">Nenhuma imagem enviada ainda. Adicione pelo menos uma referencia para seguir.</div>
              ) : (
                assets.items.map((asset: UploadedAsset) => (
                  <div className="asset-card" key={asset.id}>
                    <strong>{asset.assetRole}</strong>
                    <p className="asset-card__url">{asset.fileUrl}</p>
                    <p className="muted-text">
                      {asset.width} x {asset.height} • {asset.mimeType}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </section>

        <section className="workflow-section">
          <div className="workflow-section__label">
            <span className="workflow-section__dot" />
            Etapa 2
          </div>
          <SectionCard
            description="Preencha os detalhes para a IA gerar o melhor anuncio possivel com contexto, medidas e atributos principais."
            eyebrow="Contexto"
            title="Contexto do produto"
          >
            <div className="context-card">
              <ContextForm
                initialContext={context}
                planType={project.planType}
                projectId={projectId}
                projectLanguage={project.language}
              />
            </div>
          </SectionCard>
        </section>

        {processingJob ? (
          <section className="workflow-section">
            <SectionCard
              description="Nossa IA esta processando os materiais com base nas fotos e no contexto enviado."
              eyebrow="Processamento"
              title="Gerando magia"
            >
              <div className="magic-state">
                <div className="magic-state__spinner" />
                <h2>Gerando Magica...</h2>
                <p>
                  A etapa atual esta em andamento no backend. Assim que o job terminar, os resultados vao aparecer logo
                  abaixo nesta mesma jornada.
                </p>
                <div className="progress-bar" style={{ ["--progress" as string]: "35%" }}>
                  <span />
                </div>
                <div className="progress-caption">
                  {processingJob.jobType.replaceAll("_", " ")} • {processingJob.status}
                </div>
              </div>
            </SectionCard>
          </section>
        ) : null}

        <section className="dashboard-grid">
          <SectionCard
            dark
            description="Dispare os jobs reais para texto e imagem. O fluxo de videos fica preparado para a proxima fase."
            eyebrow="Geracao"
            title="Criar materiais do anuncio"
          >
            <GenerationPanel projectId={projectId} />
          </SectionCard>

          <SectionCard
            description="Acompanhe a fila atual do projeto e veja em que ponto cada geracao esta."
            eyebrow="Jobs"
            title="Fila de processamento"
          >
            <div className="stack">
              {jobs.items.length === 0 ? (
                <div className="empty-state">Nenhum job criado ainda.</div>
              ) : (
                jobs.items.map((job: GenerationJob) => (
                  <div className="job-card" key={job.id}>
                    <strong>{job.jobType.replaceAll("_", " ")}</strong>
                    <p>{job.provider ?? "Provider ainda nao definido"}</p>
                    <div className="button-row top-gap">
                      <StatusPill value={job.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </section>

        <section className="workflow-section">
          <div className="workflow-section__label">
            <span className="workflow-section__dot" />
            Etapa 3
          </div>
          <SectionCard
            description="Revise os titulos e a descricao gerados antes de avancar para a consolidacao do anuncio."
            eyebrow="Textos"
            title="Textos gerados"
          >
            {textResult ? (
              <TextResultPanel projectId={projectId} textResult={textResult as TextResult} />
            ) : (
              <div className="empty-state">Ainda nao existe texto gerado para este projeto.</div>
            )}
          </SectionCard>
        </section>

        <section className="workflow-section">
          <div className="workflow-section__label">
            <span className="workflow-section__dot" />
            Etapa 4
          </div>
          <SectionCard
            description="As imagens do produto aparecem aqui para revisao, download e regeneracao futura."
            eyebrow="Imagens"
            title="Galeria de imagens do anuncio"
          >
            <ImageResultsPanel items={imageResults.items as ImageResult[]} />
          </SectionCard>
        </section>

        <section className="dashboard-grid">
          <SectionCard
            description="O fluxo de videos entra depois que a API escolhida estiver fechada. O shell do MVP ja reserva esse espaco."
            eyebrow="Videos"
            title="Etapa preparada para video"
          >
            <div className="empty-state">
              O modulo de video esta separado para a proxima fase. Aqui vao entrar video do produto, avatar e roteiro
              automatizado.
            </div>
          </SectionCard>

          <SectionCard
            description="Veja o consolidado de textos, imagens e creditos usados ao longo do processo."
            eyebrow="Resumo"
            title="Resumo do projeto"
          >
            <SummaryPanel summary={summary} />
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

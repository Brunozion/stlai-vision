"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiBaseUrl } from "@/lib/api/config";
import type {
  GenerationJob,
  ImageResult,
  ProjectContext,
  ProjectListItem,
  ProjectSummaryResponse,
  TextResult,
  UploadedAsset,
} from "@/lib/api/projects";

type WorkflowStep = "upload" | "context" | "loading" | "text" | "image" | "video" | "summary";
type LoadingMode = "text" | "image" | null;

interface LocalUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStepFromState({
  assets,
  context,
  textResult,
  imageResults,
}: {
  assets: UploadedAsset[];
  context: ProjectContext | null;
  textResult: TextResult | null;
  imageResults: ImageResult[];
}) {
  if (assets.length === 0) return "upload";
  if (!context?.productName) return "context";
  if (!textResult) return "text";
  if (imageResults.length === 0) return "image";
  return "summary";
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function getImageDimensions(src: string) {
  return new Promise<{ width: number | null; height: number | null }>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => resolve({ width: null, height: null });
    image.src = src;
  });
}

export function ProjectWorkflow({
  project,
  initialAssets,
  initialContext,
  initialJobs,
  initialTextResult,
  initialImageResults,
  initialSummary,
}: {
  project: ProjectListItem;
  initialAssets: UploadedAsset[];
  initialContext: ProjectContext | null;
  initialJobs: GenerationJob[];
  initialTextResult: TextResult | null;
  initialImageResults: ImageResult[];
  initialSummary: ProjectSummaryResponse | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAssetSyncRef = useRef<Promise<UploadedAsset[]> | null>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [context, setContext] = useState<ProjectContext | null>(initialContext);
  const [jobs, setJobs] = useState(initialJobs);
  const [textResult, setTextResult] = useState<TextResult | null>(initialTextResult);
  const [imageResults, setImageResults] = useState(initialImageResults);
  const [summary, setSummary] = useState<ProjectSummaryResponse | null>(initialSummary);
  const [step, setStep] = useState<WorkflowStep>(
    getStepFromState({
      assets: initialAssets,
      context: initialContext,
      textResult: initialTextResult,
      imageResults: initialImageResults,
    }),
  );
  const [loadingMode, setLoadingMode] = useState<LoadingMode>(null);
  const [progress, setProgress] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [localUploads, setLocalUploads] = useState<LocalUploadItem[]>([]);
  const [manualUrl, setManualUrl] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    productName: initialContext?.productName ?? project.name,
    shortContext: initialContext?.shortContext ?? "",
    dimensionsXcm: initialContext?.dimensionsXcm ? String(initialContext.dimensionsXcm) : "",
    dimensionsYcm: initialContext?.dimensionsYcm ? String(initialContext.dimensionsYcm) : "",
    dimensionsZcm: initialContext?.dimensionsZcm ? String(initialContext.dimensionsZcm) : "",
    weightGrams: initialContext?.weightGrams ? String(initialContext.weightGrams) : "",
    voltage: initialContext?.voltage ?? "",
    material: initialContext?.material ?? "",
    category: initialContext?.category ?? "",
    targetMarketplaces: initialContext?.targetMarketplaces?.join(", ") ?? "shopee, mercado_livre",
  });

  const apiBaseUrl = getApiBaseUrl();
  const completedSteps = useMemo(() => {
    const items: Array<"upload" | "context" | "text" | "image" | "video" | "summary"> = [];
    if (assets.length > 0) items.push("upload");
    if (context?.productName) items.push("context");
    if (textResult) items.push("text");
    if (imageResults.length > 0) items.push("image");
    if (selectedImageIds.length > 0) items.push("video");
    if (summary || step === "summary") items.push("summary");
    return items;
  }, [assets.length, context, imageResults.length, selectedImageIds.length, step, summary, textResult]);

  async function refreshProjectData() {
    const nextState: {
      assets: UploadedAsset[];
      jobs: GenerationJob[];
      textResult: TextResult | null;
      imageResults: ImageResult[];
      summary: ProjectSummaryResponse | null;
      context: ProjectContext | null;
    } = {
      assets,
      jobs,
      textResult,
      imageResults,
      summary,
      context,
    };

    const [assetsResponse, jobsResponse, textResponse, imagesResponse, summaryResponse, contextResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/assets`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/jobs`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/text-result`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/image-results`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/summary`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/context`, { cache: "no-store" }),
    ]);

    if (assetsResponse.ok) {
      const payload = (await assetsResponse.json()) as { items: UploadedAsset[] };
      nextState.assets = payload.items;
      setAssets(payload.items);
    }

    if (jobsResponse.ok) {
      const payload = (await jobsResponse.json()) as { items: GenerationJob[] };
      nextState.jobs = payload.items;
      setJobs(payload.items);
    }

    if (textResponse.ok) {
      const payload = (await textResponse.json()) as TextResult;
      nextState.textResult = payload;
      setTextResult(payload);
    }

    if (imagesResponse.ok) {
      const payload = (await imagesResponse.json()) as { items: ImageResult[] };
      nextState.imageResults = payload.items;
      setImageResults(payload.items);
    }

    if (summaryResponse.ok) {
      const payload = (await summaryResponse.json()) as ProjectSummaryResponse;
      nextState.summary = payload;
      setSummary(payload);
    }

    if (contextResponse.ok) {
      const payload = (await contextResponse.json()) as ProjectContext;
      nextState.context = payload;
      setContext(payload);
    }

    return nextState;
  }

  async function pollUntilFinished(jobId: string, mode: "text" | "image") {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${jobId}`, { cache: "no-store" });
      if (!response.ok) {
        await sleep(2500);
        continue;
      }

      const job = (await response.json()) as GenerationJob;
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setProgress(Math.min(92, 20 + attempt * 6));

      if (job.status !== "completed" && job.errorMessage) {
        throw new Error(job.errorMessage);
      }

      const refreshed = await refreshProjectData();

      if (mode === "text" && refreshed.textResult) {
        setLoadingMode(null);
        setProgress(100);
        setError(null);
        setStep("text");
        return;
      }

      if (mode === "image" && refreshed.imageResults.length > 0) {
        setLoadingMode(null);
        setProgress(100);
        setError(null);
        setStep("image");
        return;
      }

      if (job.status === "completed") {
        setProgress(96);
        await sleep(1500);
        continue;
      }

      if (job.status === "failed") {
        throw new Error(job.errorMessage || "A geracao falhou no backend.");
      }

      await sleep(2500);
    }

    const finalState = await refreshProjectData();

    if (mode === "text" && finalState.textResult) {
      setLoadingMode(null);
      setProgress(100);
      setError(null);
      setStep("text");
      return;
    }

    if (mode === "image" && finalState.imageResults.length > 0) {
      setLoadingMode(null);
      setProgress(100);
      setError(null);
      setStep("image");
      return;
    }

    throw new Error("O processamento demorou mais do que o esperado.");
  }

  async function persistAsset(params: {
    fileUrl: string;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number | null;
    sortOrder: number;
  }) {
    const response = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/assets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileUrl: params.fileUrl,
        mimeType: params.mimeType,
        width: params.width,
        height: params.height,
        sizeBytes: params.sizeBytes,
        assetRole: "reference",
        sortOrder: params.sortOrder,
      }),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel salvar a imagem no projeto.");
    }

    return (await response.json()) as UploadedAsset;
  }

  async function syncPendingUploads() {
    const persistedAssets: UploadedAsset[] = [];

    for (const [index, item] of localUploads.entries()) {
      const asset = await persistAsset({
        fileUrl: item.previewUrl,
        mimeType: item.file.type || "image/png",
        width: item.width,
        height: item.height,
        sizeBytes: item.file.size,
        sortOrder: assets.length + index,
      });

      persistedAssets.push(asset);
    }

    if (manualUrl.trim()) {
      const asset = await persistAsset({
        fileUrl: manualUrl.trim(),
        mimeType: "image/jpeg",
        width: null,
        height: null,
        sizeBytes: null,
        sortOrder: assets.length + persistedAssets.length,
      });
      persistedAssets.push(asset);
    }

    if (persistedAssets.length > 0) {
      setAssets((current) => [...current, ...persistedAssets]);
      setManualUrl("");
      setLocalUploads([]);
    }

    return persistedAssets;
  }

  async function handleLocalFiles(files: FileList | null) {
    if (!files?.length) return;

    setError(null);

    const selectedFiles = Array.from(files).slice(0, 5 - localUploads.length);
    const newItems = await Promise.all(
      selectedFiles.map(async (file) => {
        const previewUrl = await readFileAsDataUrl(file);
        const dimensions = await getImageDimensions(previewUrl);
        return {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl,
          width: dimensions.width,
          height: dimensions.height,
        } satisfies LocalUploadItem;
      }),
    );

    setLocalUploads((current) => [...current, ...newItems].slice(0, 5));
  }

  async function handleUploadSubmit() {
    setError(null);

    try {
      if (localUploads.length === 0 && !manualUrl.trim() && assets.length === 0) {
        throw new Error("Adicione pelo menos uma imagem para continuar.");
      }

      setStep("context");

      if (localUploads.length > 0 || manualUrl.trim()) {
        pendingAssetSyncRef.current = syncPendingUploads()
          .catch((syncError) => {
            const message =
              syncError instanceof Error ? syncError.message : "Nao foi possivel salvar as imagens do projeto.";
            setError(message);
            throw syncError;
          })
          .finally(() => {
            pendingAssetSyncRef.current = null;
          });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel concluir o upload.");
    }
  }

  async function handleContextSubmit() {
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/context`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productName: formState.productName,
          shortContext: formState.shortContext,
          category: formState.category,
          dimensionsXcm: formState.dimensionsXcm ? Number(formState.dimensionsXcm) : null,
          dimensionsYcm: formState.dimensionsYcm ? Number(formState.dimensionsYcm) : null,
          dimensionsZcm: formState.dimensionsZcm ? Number(formState.dimensionsZcm) : null,
          weightGrams: formState.weightGrams ? Number(formState.weightGrams) : null,
          voltage: formState.voltage || null,
          material: formState.material || null,
          targetMarketplaces: formState.targetMarketplaces
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar o contexto.");
      }

      const savedContext = (await response.json()) as ProjectContext;
      setContext(savedContext);
      await handleGenerateText();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao salvar contexto.");
    }
  }

  async function handleGenerateText() {
    setError(null);
    setLoadingMode("text");
    setStep("loading");
    setProgress(12);

    try {
      if (pendingAssetSyncRef.current) {
        await pendingAssetSyncRef.current;
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/generations/text`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "default",
        }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel iniciar a geracao de textos.");
      }

      const job = (await response.json()) as GenerationJob;
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      await pollUntilFinished(job.id, "text");
    } catch (submitError) {
      setLoadingMode(null);
      setStep("text");
      setError(submitError instanceof Error ? submitError.message : "Erro ao gerar textos.");
    }
  }

  async function handleApproveText() {
    setError(null);

    try {
      let response = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/text-result/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        const currentTextResponse = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/text-result`, {
          cache: "no-store",
        });

        if (currentTextResponse.ok) {
          const currentText = (await currentTextResponse.json()) as TextResult;
          response = await fetch(
            `${apiBaseUrl}/api/v1/projects/${project.id}/text-result/${currentText.id}/approve`,
            {
              method: "POST",
            },
          );
        }
      }

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Nao foi possivel aprovar os textos.");
      }

      const approved = (await response.json()) as TextResult;
      setTextResult(approved);
      await handleGenerateImages();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao aprovar textos.");
    }
  }

  async function handleGenerateImages() {
    setError(null);
    setLoadingMode("image");
    setStep("loading");
    setProgress(18);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}/generations/images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preset: "default_8_pack",
          aspectRatio: "1:1",
          sizes: [1000],
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Nao foi possivel iniciar a geracao de imagens.");
      }

      const job = (await response.json()) as GenerationJob;
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      await pollUntilFinished(job.id, "image");
    } catch (submitError) {
      setLoadingMode(null);
      setStep("image");
      setError(submitError instanceof Error ? submitError.message : "Erro ao gerar imagens.");
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyFeedback("Conteudo copiado.");
    window.setTimeout(() => setCopyFeedback(null), 1800);
  }

  function toggleImageSelection(imageId: string) {
    setSelectedImageIds((current) => {
      if (current.includes(imageId)) {
        return current.filter((item) => item !== imageId);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, imageId];
    });
  }

  const selectedVideoThumbs = imageResults.filter((item) => selectedImageIds.includes(item.id)).slice(0, 4);

  return (
    <AppShell
      activeNav="new"
      activeStep={step === "loading" ? (loadingMode === "image" ? "image" : "text") : step}
      completedSteps={completedSteps}
      eyebrow="STLAI Vision"
      title={project.name}
      subtitle="Fluxo de geracao para marketplaces"
    >
      <div className="vision-workflow">
        {error ? <div className="vision-alert vision-alert--error">{error}</div> : null}
        {copyFeedback ? <div className="vision-alert">{copyFeedback}</div> : null}

        {step === "upload" ? (
          <section className="vision-stage">
            <div className="vision-stage__intro">
              <span className="vision-stage__eyebrow">Novo projeto</span>
              <h1>Novo Projeto</h1>
              <p>Arraste de 1 a 5 imagens do produto. Aceitamos fundo branco ou fundo real, a IA organiza o resto.</p>
            </div>

            <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
              <input
                accept="image/png,image/jpeg,image/webp,image/avif,image/heic"
                hidden
                multiple
                onChange={(event) => void handleLocalFiles(event.target.files)}
                ref={fileInputRef}
                type="file"
              />
              <div className="upload-dropzone__icon">↑</div>
              <strong>Clique ou arraste para subir</strong>
              <p>Ate 5 imagens por vez. O frontend ja cria preview, dimensoes e manda para a API do projeto.</p>
              <span>JPG, PNG, WEBP, AVIF, HEIC</span>
            </div>

            <label className="vision-field">
              <span>Ou cole uma URL de imagem</span>
              <input
                onChange={(event) => setManualUrl(event.target.value)}
                placeholder="https://exemplo.com/produto.jpg"
                value={manualUrl}
              />
            </label>

            {localUploads.length > 0 ? (
              <div className="upload-preview-grid">
                {localUploads.map((item) => (
                  <article className="upload-preview-card" key={item.id}>
                    <div className="upload-preview-card__frame">
                      <Image alt={item.file.name} fill sizes="220px" src={item.previewUrl} />
                    </div>
                    <div className="upload-preview-card__body">
                      <strong>{item.file.name}</strong>
                      <span>
                        {item.width ?? "?"} x {item.height ?? "?"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {assets.length > 0 ? (
              <div className="upload-preview-grid">
                {assets.map((item) => (
                  <article className="upload-preview-card upload-preview-card--saved" key={item.id}>
                    <div className="upload-preview-card__frame">
                      <Image alt={item.assetRole} fill sizes="220px" src={item.fileUrl} />
                    </div>
                    <div className="upload-preview-card__body">
                      <strong>Imagem salva</strong>
                      <span>{item.assetRole}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="vision-actions vision-actions--center">
              <button className="vision-button vision-button--primary" onClick={() => void handleUploadSubmit()} type="button">
                Continuar
              </button>
            </div>
          </section>
        ) : null}

        {step === "context" ? (
          <section className="vision-stage vision-stage--narrow">
            <div className="vision-stage__intro">
              <span className="vision-stage__eyebrow">Etapa 2</span>
              <h1>Contexto do Produto</h1>
              <p>Adicione informacoes para que a IA crie o melhor anuncio possivel.</p>
            </div>

            <div className="vision-panel">
              <div className="vision-grid vision-grid--triple">
                <label className="vision-field">
                  <span>Nome do Produto</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, productName: event.target.value }))}
                    placeholder="Ex: Chaveiro Decorativo Cachorrinho"
                    value={formState.productName}
                  />
                </label>

                <label className="vision-field">
                  <span>Categoria</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Ex: Decoracao"
                    value={formState.category}
                  />
                </label>

                <label className="vision-field">
                  <span>Idioma</span>
                  <input readOnly value={project.language} />
                </label>
              </div>

              <label className="vision-field">
                <span>Informacoes adicionais / contexto</span>
                <textarea
                  onChange={(event) => setFormState((current) => ({ ...current, shortContext: event.target.value }))}
                  placeholder="Descreva detalhes, uso do produto, publico, acabamento e diferenciais."
                  value={formState.shortContext}
                />
              </label>

              <div className="vision-grid vision-grid--quad">
                <label className="vision-field">
                  <span>Largura (cm)</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, dimensionsXcm: event.target.value }))}
                    placeholder="30"
                    value={formState.dimensionsXcm}
                  />
                </label>

                <label className="vision-field">
                  <span>Altura (cm)</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, dimensionsYcm: event.target.value }))}
                    placeholder="20"
                    value={formState.dimensionsYcm}
                  />
                </label>

                <label className="vision-field">
                  <span>Profundidade (cm)</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, dimensionsZcm: event.target.value }))}
                    placeholder="3"
                    value={formState.dimensionsZcm}
                  />
                </label>

                <label className="vision-field">
                  <span>Peso (g)</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, weightGrams: event.target.value }))}
                    placeholder="120"
                    value={formState.weightGrams}
                  />
                </label>
              </div>

              <div className="vision-grid vision-grid--triple">
                <label className="vision-field">
                  <span>Voltagem</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, voltage: event.target.value }))}
                    placeholder="Ex: Bivolt"
                    value={formState.voltage}
                  />
                </label>

                <label className="vision-field">
                  <span>Material</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, material: event.target.value }))}
                    placeholder="Ex: Resina"
                    value={formState.material}
                  />
                </label>

                <label className="vision-field">
                  <span>Marketplaces</span>
                  <input
                    onChange={(event) => setFormState((current) => ({ ...current, targetMarketplaces: event.target.value }))}
                    placeholder="shopee, mercado_livre"
                    value={formState.targetMarketplaces}
                  />
                </label>
              </div>
            </div>

            <div className="vision-actions">
              <button className="vision-button vision-button--ghost" onClick={() => setStep("upload")} type="button">
                Voltar
              </button>
              <button className="vision-button vision-button--primary" onClick={() => void handleContextSubmit()} type="button">
                Gerar Anuncio
              </button>
            </div>
          </section>
        ) : null}

        {step === "loading" ? (
          <section className="vision-stage vision-stage--centered">
            <div className="loading-orb">
              <div className="loading-orb__inner" />
            </div>
            <h1>Gerando Magica...</h1>
            <p>
              Nossa IA esta analisando suas fotos e criando materiais de alta conversao. Isso pode levar alguns segundos.
            </p>
            <div className="loading-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong>{progress}% concluido</strong>
          </section>
        ) : null}

        {step === "text" ? (
          <section className="vision-stage vision-stage--narrow">
            <div className="vision-stage__intro">
              <span className="vision-stage__eyebrow">Etapa 3</span>
              <h1>Titulos Sugeridos pela IA</h1>
              <p>Sugestoes de titulos otimizados para marketplaces baseados no seu produto.</p>
            </div>

            {textResult ? (
              <>
                <div className="title-grid">
                  {textResult.titles.map((title, index) => (
                    <article className="title-card" key={`${title}-${index}`}>
                      <span className="title-card__badge">Opcao {index + 1}</span>
                      <button className="title-card__copy" onClick={() => void copyText(title)} type="button">
                        Copiar
                      </button>
                      <strong>{title}</strong>
                    </article>
                  ))}
                </div>

                <div className="description-card">
                  <div className="description-card__header">
                    <h2>Descricao Comercial</h2>
                    <button className="inline-action" onClick={() => void copyText(textResult.description)} type="button">
                      Copiar Tudo
                    </button>
                  </div>
                  <pre>{textResult.description}</pre>
                </div>

                <div className="vision-actions">
                  <button className="vision-button vision-button--ghost" onClick={() => setStep("context")} type="button">
                    Voltar
                  </button>
                  <div className="vision-actions__split">
                    <button className="vision-button vision-button--secondary" onClick={() => void handleGenerateText()} type="button">
                      Regenerar
                    </button>
                    <button className="vision-button vision-button--primary" onClick={() => void handleApproveText()} type="button">
                      Aprovar e Continuar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="vision-empty">
                <p>Os textos ainda nao foram gerados.</p>
                <button className="vision-button vision-button--primary" onClick={() => void handleGenerateText()} type="button">
                  Gerar Textos
                </button>
              </div>
            )}
          </section>
        ) : null}

        {step === "image" ? (
          <section className="vision-stage vision-stage--wide">
            <div className="vision-stage__intro">
              <span className="vision-stage__eyebrow">Etapa 4</span>
              <h1>Variacoes Geradas</h1>
              <p>Selecione de 1 a 4 imagens para compor o seu video comercial.</p>
            </div>

            {imageResults.length > 0 ? (
              <>
                <div className="selection-counter">{selectedImageIds.length} de 4 selecionadas</div>
                <div className="results-grid">
                  {imageResults.map((image, index) => {
                    const selected = selectedImageIds.includes(image.id);
                    return (
                      <article
                        className={`result-card ${selected ? "result-card--selected" : ""}`}
                        key={image.id}
                        onClick={() => toggleImageSelection(image.id)}
                      >
                        <div className="result-card__frame">
                          <Image alt={image.title ?? `Imagem ${index + 1}`} fill sizes="280px" src={image.fileUrl} />
                          <span className="result-card__tag">{image.title ?? image.imageKind}</span>
                        </div>
                        <div className="result-card__body">
                          <strong>{image.title ?? `Variacao ${index + 1}`}</strong>
                          <span>{image.provider ?? "STLAI Image Engine"}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="vision-actions">
                  <button className="vision-button vision-button--ghost" onClick={() => setStep("text")} type="button">
                    Voltar
                  </button>
                  <div className="vision-actions__split">
                    <button className="vision-button vision-button--secondary" onClick={() => void handleGenerateImages()} type="button">
                      Gerar Mais
                    </button>
                    <button
                      className="vision-button vision-button--primary"
                      disabled={selectedImageIds.length === 0}
                      onClick={() => setStep("video")}
                      type="button"
                    >
                      Continuar para Videos ({selectedImageIds.length})
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="vision-empty">
                <p>As imagens ainda nao foram geradas.</p>
                <button className="vision-button vision-button--primary" onClick={() => void handleGenerateImages()} type="button">
                  Gerar Imagens
                </button>
              </div>
            )}
          </section>
        ) : null}

        {step === "video" ? (
          <section className="vision-stage vision-stage--narrow">
            <div className="vision-stage__intro">
              <span className="vision-stage__eyebrow">Etapa 5</span>
              <h1>Videos Comerciais</h1>
              <p>Videos gerados utilizando as imagens selecionadas. No MVP atual esta etapa entra como placeholder premium.</p>
            </div>

            <div className="video-thumb-row">
              {selectedVideoThumbs.map((image) => (
                <div className="video-thumb" key={image.id}>
                  <Image alt={image.title ?? "Thumb"} fill sizes="60px" src={image.fileUrl} />
                </div>
              ))}
            </div>

            <div className="video-grid">
              <article className="video-card">
                <div className="video-card__frame">
                  <div className="video-card__duration">0:15</div>
                  {selectedVideoThumbs[0] ? (
                    <Image alt="Video dinamico" fill sizes="520px" src={selectedVideoThumbs[0].fileUrl} />
                  ) : null}
                  <div className="video-card__play">▶</div>
                </div>
                <div className="video-card__body">
                  <div>
                    <strong>Comercial Dinamico</strong>
                    <span>Formato 16:9 • MP4</span>
                  </div>
                  <button className="vision-button vision-button--secondary" type="button">
                    Download
                  </button>
                </div>
              </article>

              <article className="video-card">
                <div className="video-card__frame">
                  <div className="video-card__duration">0:45</div>
                  {selectedVideoThumbs[1] ? (
                    <Image alt="Review com avatar" fill sizes="520px" src={selectedVideoThumbs[1].fileUrl} />
                  ) : null}
                  <div className="video-card__play">▶</div>
                </div>
                <div className="video-card__body">
                  <div>
                    <strong>Review com Avatar IA</strong>
                    <span>Formato 16:9 • MP4</span>
                  </div>
                  <button className="vision-button vision-button--secondary" type="button">
                    Download
                  </button>
                </div>
              </article>
            </div>

            <div className="vision-actions">
              <button className="vision-button vision-button--ghost" onClick={() => setStep("image")} type="button">
                Voltar
              </button>
              <div className="vision-actions__split">
                <button className="vision-button vision-button--secondary" type="button">
                  Regenerar
                </button>
                <button className="vision-button vision-button--primary" onClick={() => setStep("summary")} type="button">
                  Finalizar Projeto
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {step === "summary" ? (
          <section className="vision-stage vision-stage--summary">
            <div className="summary-hero">
              <div className="summary-hero__icon">✓</div>
              <h1>Anuncio Pronto!</h1>
              <p>Seu material completo foi gerado com sucesso e esta pronto para ser publicado nos marketplaces.</p>
            </div>

            <div className="summary-layout">
              <div className="summary-main">
                <section className="summary-panel">
                  <div className="summary-panel__header">
                    <div>
                      <span>Analise de conversao</span>
                      <h2>Qualidade do anuncio</h2>
                    </div>
                    <strong>{summary ? Math.max(89, 92 + imageResults.length).toString() : "98"}%</strong>
                  </div>

                  <div className="summary-checks">
                    <div>✓ Titulos com palavras-chave (SEO)</div>
                    <div>✓ Infograficos de dimensoes</div>
                    <div>✓ Fundo branco puro (Principal)</div>
                    <div>✓ Descricao tecnica completa</div>
                    <div>✓ Fotos ambientadas (Lifestyle)</div>
                    <div>✓ Video de demonstracao</div>
                  </div>

                  <div className="loading-progress">
                    <span style={{ width: "98%" }} />
                  </div>
                </section>

                <section className="summary-combos">
                  <div className="summary-combos__header">
                    <h2>Variacoes de Combo (A/B Testing)</h2>
                  </div>
                  <div className="combo-grid">
                    {textResult?.titles.slice(0, 4).map((title, index) => (
                      <article className="combo-card" key={`${title}-${index}`}>
                        <div className="combo-card__images">
                          {imageResults.slice(index, index + 2).map((image) => (
                            <div className="combo-card__thumb" key={image.id}>
                              <Image alt={image.title ?? "combo"} fill sizes="64px" src={image.fileUrl} />
                            </div>
                          ))}
                          <span>{98 - index * 3}% Score</span>
                        </div>
                        <strong>Combo {index + 1}</strong>
                        <p>{title}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="summary-sidebar">
                <section className="summary-sidepanel">
                  <h3>Acoes Rapidas</h3>
                  <button className="vision-button vision-button--primary" type="button">
                    Download Pacote Completo
                  </button>
                  <button className="vision-button vision-button--secondary" type="button">
                    Compartilhar Link
                  </button>
                  <button className="vision-button vision-button--secondary" type="button">
                    Enviar para Mercado Livre
                  </button>

                  <div className="summary-metadata">
                    <div>
                      <span>Plano usado</span>
                      <strong>{project.planType.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span>Creditos consumidos</span>
                      <strong>{summary?.credits.totalSpent ?? 120} stlAI Credits</strong>
                    </div>
                    <div>
                      <span>Data da geracao</span>
                      <strong>{new Date(project.createdAt).toLocaleDateString("pt-BR")}</strong>
                    </div>
                  </div>
                </section>

                <button className="vision-link-button" onClick={() => router.push("/")} type="button">
                  Iniciar Novo Projeto
                </button>
              </aside>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

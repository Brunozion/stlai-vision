"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/config";

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem."));
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

export function ProjectCreateForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [planType, setPlanType] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const selectedFiles = Array.from(files).slice(0, 5 - pendingUploads.length);
    const mapped = await Promise.all(
      selectedFiles.map(async (file) => {
        const previewUrl = await readFileAsDataUrl(file);
        const dimensions = await getImageDimensions(previewUrl);

        return {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl,
          width: dimensions.width,
          height: dimensions.height,
        } satisfies PendingUpload;
      }),
    );

    setPendingUploads((current) => [...current, ...mapped].slice(0, 5));
    setError(null);
  }

  async function persistAsset(projectId: string, upload: PendingUpload, sortOrder: number) {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/projects/${projectId}/assets`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fileUrl: upload.previewUrl,
        mimeType: upload.file.type || "image/png",
        width: upload.width,
        height: upload.height,
        sizeBytes: upload.file.size,
        assetRole: "reference",
        sortOrder,
      }),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel salvar as imagens do projeto.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/projects`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          language,
          planType,
        }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel criar o projeto.");
      }

      const project = (await response.json()) as { id: string };

      for (const [index, upload] of pendingUploads.entries()) {
        await persistAsset(project.id, upload, index);
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack create-project-form" onSubmit={handleSubmit}>
      <div
        className={`upload-dropzone upload-dropzone--compact ${dragActive ? "upload-dropzone--active" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFiles(event.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
      >
        <input
          accept="image/png,image/jpeg,image/webp,image/avif,image/heic"
          hidden
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <div className="upload-dropzone__icon">↑</div>
        <strong>Suba as imagens do produto ja no inicio</strong>
        <p>Arraste ate 5 imagens ou clique para selecionar. Assim voce ja entra no projeto com o upload feito.</p>
        <span>JPG, PNG, WEBP, AVIF, HEIC • max. 5 arquivos</span>
      </div>

      {pendingUploads.length > 0 ? (
        <div className="upload-preview-grid upload-preview-grid--compact">
          {pendingUploads.map((upload) => (
            <article className="upload-preview-card" key={upload.id}>
              <div className="upload-preview-card__frame">
                <Image alt={upload.file.name} fill sizes="160px" src={upload.previewUrl} />
              </div>
              <div className="upload-preview-card__body">
                <strong>{upload.file.name}</strong>
                <span>
                  {upload.width ?? "?"} x {upload.height ?? "?"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <label className="field">
        <span>Nome do projeto</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Chaveiro cachorro" required />
      </label>

      <div className="field-grid">
        <label className="field">
          <span>Idioma</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="pt-BR">pt-BR</option>
            <option value="en-US">en-US</option>
          </select>
        </label>

        <label className="field">
          <span>Plano</span>
          <select value={planType} onChange={(event) => setPlanType(event.target.value)}>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      <p className="form-helper">
        Assim que o projeto for criado, as imagens sobem junto e voce entra direto na jornada de contexto, textos, imagens
        e resumo.
      </p>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Criando workspace..." : "Criar workspace"}
      </button>
    </form>
  );
}

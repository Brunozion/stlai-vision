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
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const acceptedMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/heic", "image/heif"];
    const incomingFiles = Array.from(files);
    const invalidFile = incomingFiles.find((file) => !acceptedMimeTypes.includes(file.type));
    if (invalidFile) {
      setError("Formato invalido. Use JPG, PNG, WEBP, AVIF ou HEIC.");
      return;
    }

    if (pendingUploads.length + incomingFiles.length > 5) {
      setError("Voce pode subir no maximo 5 imagens.");
    }

    const selectedFiles = incomingFiles.slice(0, Math.max(0, 5 - pendingUploads.length));
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
    if (pendingUploads.length === 0) {
      setError("Envie pelo menos 1 imagem para continuar.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const generatedName = `Projeto ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      const response = await fetch(`${getApiBaseUrl()}/api/v1/projects`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: generatedName,
          language: "pt-BR",
          planType: "basic",
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

  function removeUpload(uploadId: string) {
    setPendingUploads((current) => current.filter((item) => item.id !== uploadId));
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
        <strong>Suba as imagens do produto</strong>
        <p>Arraste ou clique para selecionar ate 5 imagens de referencia para a geracao.</p>
        <span>JPG, PNG, WEBP, AVIF, HEIC • minimo 1 imagem</span>

        {pendingUploads.length > 0 ? (
          <div className="upload-preview-grid upload-preview-grid--inline">
            {pendingUploads.map((upload) => (
              <article className="upload-preview-card upload-preview-card--mini" key={upload.id} onClick={(event) => event.stopPropagation()}>
                <div className="upload-preview-card__frame upload-preview-card__frame--mini">
                  <Image alt={upload.file.name} fill sizes="120px" src={upload.previewUrl} />
                </div>
                <div className="upload-preview-card__body">
                  <strong>{upload.file.name}</strong>
                  <span>
                    {upload.width ?? "?"} x {upload.height ?? "?"}
                  </span>
                </div>
                <button
                  className="upload-preview-card__remove"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeUpload(upload.id);
                  }}
                  type="button"
                >
                  Remover
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <p className="form-helper">
        As imagens enviadas serao usadas como base de referencia para os textos e visuais gerados pela IA.
      </p>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="primary-button" disabled={loading || pendingUploads.length === 0} type="submit">
        {loading ? "Criando workspace..." : "Continuar"}
      </button>
    </form>
  );
}

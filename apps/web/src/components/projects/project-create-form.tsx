"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/config";

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  uploadUrl: string;
  uploadMimeType: string;
  uploadSizeBytes: number;
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

async function compressImageForUpload(file: File) {
  const sourceUrl = await readFileAsDataUrl(file);

  return new Promise<{
    dataUrl: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
  }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const maxDimension = 1280;
      const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const targetWidth = Math.max(1, Math.round(image.width * ratio));
      const targetHeight = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Nao foi possivel preparar a imagem para upload."));
        return;
      }

      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Nao foi possivel compactar a imagem."));
            return;
          }

          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem compactada."));
          reader.onload = () =>
            resolve({
              dataUrl: String(reader.result),
              mimeType: blob.type || "image/jpeg",
              sizeBytes: blob.size,
              width: targetWidth,
              height: targetHeight,
            });
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.82,
      );
    };
    image.onerror = () => reject(new Error("Nao foi possivel processar a imagem enviada."));
    image.src = sourceUrl;
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
        const compressed = await compressImageForUpload(file);
        const dimensions = await getImageDimensions(previewUrl);

        return {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl,
          uploadUrl: compressed.dataUrl,
          uploadMimeType: compressed.mimeType,
          uploadSizeBytes: compressed.sizeBytes,
          width: compressed.width ?? dimensions.width,
          height: compressed.height ?? dimensions.height,
        } satisfies PendingUpload;
      }),
    );

    setPendingUploads((current) => [...current, ...mapped].slice(0, 5));
    setError(null);
  }

  async function persistAssets(projectId: string, uploads: PendingUpload[]) {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/projects/${projectId}/assets`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        assets: uploads.map((upload, sortOrder) => ({
          storageKey: `projects/${projectId}/reference-${sortOrder + 1}-${upload.id}.jpg`,
          fileUrl: upload.uploadUrl,
          mimeType: upload.uploadMimeType,
          width: upload.width,
          height: upload.height,
          sizeBytes: upload.uploadSizeBytes,
          assetRole: "reference",
          sortOrder,
        })),
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

      await persistAssets(project.id, pendingUploads);

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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AssetForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [width, setWidth] = useState("1000");
  const [height, setHeight] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/projects/${projectId}/assets`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            assets: [
              {
                storageKey: `projects/${projectId}/source/${Date.now()}.jpg`,
                fileUrl,
                mimeType,
                width: Number(width),
                height: Number(height),
                sortOrder: 0,
                assetRole: "source",
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar o asset.");
      }

      setFileUrl("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="upload-stage">
        <div className="upload-stage__header">
          <h3>Novo Projeto</h3>
          <p>Arraste uma ou mais imagens ou cole a URL da foto de referencia para alimentar o pipeline do MVP.</p>
        </div>

        <div className="upload-stage__dropzone">
          <div>
            <span className="upload-stage__icon">↥</span>
            <strong>Cole a URL ou use a referencia existente</strong>
            <p>
              A interface ja simula a etapa de upload. Neste MVP, a imagem entra por URL para acelerar a integracao com
              a API e o n8n.
            </p>
            <div className="upload-stage__footnote">Ate 5 imagens por vez • JPG, PNG, WEBP, AVIF, HEIC</div>
          </div>
        </div>
      </div>

      <label className="field">
        <span>URL da imagem de referencia</span>
        <input
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          placeholder="https://cdn.exemplo.com/produto.jpg"
          required
        />
      </label>

      <div className="field-grid field-grid--triple">
        <label className="field">
          <span>MIME type</span>
          <input value={mimeType} onChange={(event) => setMimeType(event.target.value)} />
        </label>
        <label className="field">
          <span>Largura</span>
          <input value={width} onChange={(event) => setWidth(event.target.value)} inputMode="numeric" />
        </label>
        <label className="field">
          <span>Altura</span>
          <input value={height} onChange={(event) => setHeight(event.target.value)} inputMode="numeric" />
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="button-row">
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Salvando..." : "Adicionar imagem"}
        </button>
      </div>
    </form>
  );
}

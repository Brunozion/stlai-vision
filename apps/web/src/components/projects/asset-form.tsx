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

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Salvando..." : "Adicionar imagem"}
      </button>
    </form>
  );
}

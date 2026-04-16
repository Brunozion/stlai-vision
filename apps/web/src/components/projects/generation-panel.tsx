"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerationPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"text" | "image" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runGeneration(type: "text" | "image") {
    setLoadingAction(type);
    setError(null);

    try {
      const endpoint =
        type === "text"
          ? `/api/v1/projects/${projectId}/generations/text`
          : `/api/v1/projects/${projectId}/generations/images`;

      const payload =
        type === "text"
          ? { mode: "default" }
          : {
              preset: "default_8_pack",
              aspectRatio: "1:1",
              sizes: [1000],
            };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}${endpoint}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Nao foi possivel criar o job de ${type}.`);
      }

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="stack">
      <p className="form-helper">
        Primeiro gere os textos para aprovar a base do anuncio. Depois dispare as imagens para montar a galeria visual.
      </p>
      <div className="button-row">
        <button className="primary-button" disabled={loadingAction !== null} onClick={() => runGeneration("text")} type="button">
          {loadingAction === "text" ? "Gerando texto..." : "Gerar textos"}
        </button>
        <button className="secondary-button" disabled={loadingAction !== null} onClick={() => runGeneration("image")} type="button">
          {loadingAction === "image" ? "Gerando imagens..." : "Gerar imagens"}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}

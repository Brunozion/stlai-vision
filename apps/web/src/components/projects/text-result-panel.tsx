"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TextResult } from "@/lib/api/projects";

export function TextResultPanel({ projectId, textResult }: { projectId: string; textResult: TextResult }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approveText() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/projects/${projectId}/text-result/${textResult.id}/approve`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Nao foi possivel aprovar o texto.");
      }

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="stack compact-stack">
        {textResult.titles.map((title) => (
          <div className="list-row" key={title}>
            <div>
              <strong>{title}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="result-block">
        <strong>Descricao</strong>
        <p>{textResult.description}</p>
      </div>

      {textResult.bullets.length > 0 ? (
        <div className="result-block">
          <strong>Bullets</strong>
          <ul className="simple-list">
            {textResult.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="button-row">
        <button className="primary-button" disabled={loading || textResult.approvedByUser} onClick={approveText} type="button">
          {textResult.approvedByUser ? "Texto aprovado" : loading ? "Aprovando..." : "Aprovar texto"}
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}

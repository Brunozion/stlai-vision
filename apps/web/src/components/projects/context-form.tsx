"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectContext } from "@/lib/api/projects";

export function ContextForm({
  projectId,
  initialContext,
}: {
  projectId: string;
  initialContext: ProjectContext | null;
}) {
  const router = useRouter();
  const [productName, setProductName] = useState(initialContext?.productName ?? "");
  const [category, setCategory] = useState(initialContext?.category ?? "");
  const [shortContext, setShortContext] = useState(initialContext?.shortContext ?? "");
  const [dimensionsXcm, setDimensionsXcm] = useState(String(initialContext?.dimensionsXcm ?? ""));
  const [dimensionsYcm, setDimensionsYcm] = useState(String(initialContext?.dimensionsYcm ?? ""));
  const [dimensionsZcm, setDimensionsZcm] = useState(String(initialContext?.dimensionsZcm ?? ""));
  const [weightGrams, setWeightGrams] = useState(String(initialContext?.weightGrams ?? ""));
  const [color, setColor] = useState(initialContext?.color ?? "");
  const [material, setMaterial] = useState(initialContext?.material ?? "");
  const [targetMarketplaces, setTargetMarketplaces] = useState(
    initialContext?.targetMarketplaces.join(", ") ?? "shopee, mercado_livre",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/projects/${projectId}/context`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            productName,
            category: category || null,
            shortContext: shortContext || null,
            dimensionsXcm: dimensionsXcm ? Number(dimensionsXcm) : null,
            dimensionsYcm: dimensionsYcm ? Number(dimensionsYcm) : null,
            dimensionsZcm: dimensionsZcm ? Number(dimensionsZcm) : null,
            weightGrams: weightGrams ? Number(weightGrams) : null,
            color: color || null,
            material: material || null,
            targetMarketplaces: targetMarketplaces
              .split(",")
              .map((item: string) => item.trim())
              .filter(Boolean),
            extraAttributes: {
              source: "frontend_manual_form",
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar o contexto.");
      }

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label className="field">
          <span>Nome do produto</span>
          <input value={productName} onChange={(event) => setProductName(event.target.value)} required />
        </label>
        <label className="field">
          <span>Categoria</span>
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>Contexto do produto</span>
        <textarea value={shortContext} onChange={(event) => setShortContext(event.target.value)} rows={4} />
      </label>

      <div className="field-grid field-grid--quad">
        <label className="field">
          <span>X cm</span>
          <input value={dimensionsXcm} onChange={(event) => setDimensionsXcm(event.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          <span>Y cm</span>
          <input value={dimensionsYcm} onChange={(event) => setDimensionsYcm(event.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          <span>Z cm</span>
          <input value={dimensionsZcm} onChange={(event) => setDimensionsZcm(event.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          <span>Peso gramas</span>
          <input value={weightGrams} onChange={(event) => setWeightGrams(event.target.value)} inputMode="decimal" />
        </label>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Cor</span>
          <input value={color} onChange={(event) => setColor(event.target.value)} />
        </label>
        <label className="field">
          <span>Material</span>
          <input value={material} onChange={(event) => setMaterial(event.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>Marketplaces</span>
        <input value={targetMarketplaces} onChange={(event) => setTargetMarketplaces(event.target.value)} />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Salvando..." : "Salvar contexto"}
      </button>
    </form>
  );
}

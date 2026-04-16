"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProjectCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [planType, setPlanType] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/projects`, {
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
      router.push(`/projects/${project.id}`);
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
        Assim que o projeto for criado, voce entra direto na jornada de upload, contexto, textos, imagens e resumo.
      </p>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Criando..." : "Criar workspace"}
      </button>
    </form>
  );
}

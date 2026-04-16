import type { ProjectSummaryResponse } from "@/lib/api/projects";

export function SummaryPanel({ summary }: { summary: ProjectSummaryResponse | null }) {
  if (!summary) {
    return <p className="muted-text">Resumo ainda indisponivel para este projeto.</p>;
  }

  return (
    <div className="summary-grid">
      <div className="meta-card">
        <span>Titulos</span>
        <strong>{summary.text?.titles.length ?? 0}</strong>
      </div>
      <div className="meta-card">
        <span>Imagens</span>
        <strong>{summary.images.count}</strong>
      </div>
      <div className="meta-card">
        <span>Videos</span>
        <strong>{summary.videos.status}</strong>
      </div>
      <div className="meta-card">
        <span>Creditos gastos</span>
        <strong>{summary.credits.totalSpent}</strong>
      </div>
    </div>
  );
}

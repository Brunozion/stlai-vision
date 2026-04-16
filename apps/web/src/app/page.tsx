import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";
import { listProjects, type ProjectListItem } from "@/lib/api/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { items } = await listProjects();

  return (
    <AppShell
      activeNav="workspace"
      eyebrow="Workspace"
      subtitle="Envie as imagens do produto, complete o contexto e gere anuncios prontos para marketplace em minutos."
      title="STLAI Vision"
    >
      <div className="workspace-stack">
        <section className="workspace-hero">
          <div className="workspace-hero__content">
            <span className="workspace-hero__eyebrow">MVP STLAI Vision</span>
            <h1>Seus produtos prontos para vender com visual premium.</h1>
            <p className="workspace-subtitle">
              Gere imagens, titulos e descricoes com a identidade da STLAI em um fluxo simples para Shopee, Mercado
              Livre, Amazon e TikTok Shop.
            </p>

            <div className="workspace-hero__metrics">
              <div className="metric-chip">
                <div>
                  <strong>1 a 5 imagens</strong>
                  <span>Entrada rapida do produto</span>
                </div>
              </div>
              <div className="metric-chip">
                <div>
                  <strong>Texto + imagem</strong>
                  <span>Pipeline do MVP</span>
                </div>
              </div>
              <div className="metric-chip">
                <div>
                  <strong>Regeneracao</strong>
                  <span>Mais opcoes visuais</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <SectionCard
            dark
            description="Crie um projeto novo para entrar direto no fluxo de upload, contexto e geracao."
            eyebrow="Novo projeto"
            title="Comece um anuncio do zero"
          >
            <ProjectCreateForm />
          </SectionCard>

          <SectionCard
            description="Acompanhe os projetos ja iniciados e reabra a operacao de cada item."
            eyebrow="Projetos"
            title="Ultimos projetos"
          >
            <div className="project-list">
              {items.length === 0 ? (
                <div className="empty-state">Nenhum projeto criado ainda. Abra um novo projeto para iniciar o MVP.</div>
              ) : (
                items.map((project: ProjectListItem) => (
                  <Link className="project-row" href={`/projects/${project.id}`} key={project.id}>
                    <div>
                      <strong>{project.name}</strong>
                      <p>{new Date(project.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    <StatusPill value={project.status} />
                  </Link>
                ))
              )}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

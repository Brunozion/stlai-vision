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
    <AppShell eyebrow="Workspace" title="Projetos do MVP de anuncios com IA">
      <section className="dashboard-grid">
        <SectionCard title="Novo projeto" description="Crie um fluxo novo para upload, contexto e geracao.">
          <ProjectCreateForm />
        </SectionCard>

        <SectionCard title="Projetos recentes" description="Lista alimentada pela API real do backend.">
          <div className="stack">
            {items.length === 0 ? (
              <p className="muted-text">Ainda nao existe projeto criado neste ambiente.</p>
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
    </AppShell>
  );
}

import { notFound } from "next/navigation";
import { ProjectWorkflow } from "@/components/projects/project-workflow";
import {
  getImageResults,
  getProject,
  getProjectContext,
  getProjectSummary,
  getTextResult,
  listAssets,
  listJobs,
} from "@/lib/api/projects";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project;
  try {
    project = await getProject(projectId);
  } catch {
    notFound();
  }

  const [context, assets, jobs, textResult, imageResults, summary] = await Promise.all([
    getProjectContext(projectId),
    listAssets(projectId),
    listJobs(projectId),
    getTextResult(projectId),
    getImageResults(projectId),
    getProjectSummary(projectId),
  ]);

  return (
    <ProjectWorkflow
      initialAssets={assets.items}
      initialContext={context}
      initialImageResults={imageResults.items}
      initialJobs={jobs.items}
      initialSummary={summary}
      initialTextResult={textResult}
      project={project}
    />
  );
}

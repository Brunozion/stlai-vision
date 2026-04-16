import { env } from "../../config/env";

interface TriggerWorkflowInput {
  jobId: string;
  projectId: string;
  workflow: "text" | "image";
  payload: Record<string, unknown>;
}

function buildWebhookUrl(workflow: "text" | "image") {
  const path = workflow === "text" ? env.N8N_TEXT_WEBHOOK_PATH : env.N8N_IMAGE_WEBHOOK_PATH;
  return new URL(path, env.N8N_BASE_URL).toString();
}

export async function triggerN8nWorkflow(input: TriggerWorkflowInput) {
  if (!env.N8N_ENABLED) {
    return {
      triggered: false,
      reason: "N8N_DISABLED",
    };
  }

  const response = await fetch(buildWebhookUrl(input.workflow), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-token": env.N8N_INTERNAL_TOKEN,
    },
    body: JSON.stringify({
      jobId: input.jobId,
      projectId: input.projectId,
      ...input.payload,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao disparar workflow do n8n: ${response.status} ${body}`);
  }

  return {
    triggered: true,
  };
}

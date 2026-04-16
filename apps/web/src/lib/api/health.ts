interface HealthResponse {
  status: "ok";
  service: "api";
  environment: string;
  timestamp: string;
}

export async function fetchApiHealth(apiBaseUrl: string): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Falha ao consultar healthcheck da API.");
  }

  return response.json() as Promise<HealthResponse>;
}

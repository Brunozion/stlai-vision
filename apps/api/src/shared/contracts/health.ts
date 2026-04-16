export interface HealthResponse {
  status: "ok";
  service: "api";
  environment: string;
  timestamp: string;
}

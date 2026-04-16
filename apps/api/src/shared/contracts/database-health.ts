export interface DatabaseHealthResponse {
  status: "ok";
  service: "api";
  database: "connected" | "disconnected";
  environment: string;
  serverTime: string | null;
  timestamp: string;
}

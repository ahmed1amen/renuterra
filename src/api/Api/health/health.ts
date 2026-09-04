import { api } from "@/lib/api";

export type HealthResponse = {
  status: "ok" | "degraded" | "down";
};

export function getHealth() {
  return api.get<HealthResponse>("/health");
}

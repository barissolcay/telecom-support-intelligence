import type { Dashboard, Document, Ticket } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? `Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  tickets: () => request<Ticket[]>("/api/v1/tickets"),
  analyze: (id: string) => request<Record<string, unknown>>(`/api/v1/tickets/${id}/analyze`, { method: "POST" }),
  cases: (id: string) => request<Record<string, unknown>[]>(`/api/v1/tickets/${id}/similar-cases`),
  copilot: (ticketId: string, question: string) => request<Record<string, any>>("/api/v1/copilot/query", { method: "POST", body: JSON.stringify({ ticket_id: ticketId, question }) }),
  feedback: (payload: Record<string, string>) => request("/api/v1/feedback", { method: "POST", body: JSON.stringify(payload) }),
  documents: () => request<Document[]>("/api/v1/knowledge/documents"),
  dashboard: () => request<Dashboard>("/api/v1/analytics/dashboard"),
  ready: () => request<Record<string, unknown>>("/ready"),
};

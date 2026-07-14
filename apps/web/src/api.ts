import type { Dashboard, Document, Ticket } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? `Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  tickets: () => request<Ticket[]>("/api/v1/tickets"),
  createTicket: (payload: { title?: string; message: string; region: string; language: "tr" | "en" }) =>
    request<Ticket>("/api/v1/tickets", { method: "POST", body: JSON.stringify({ channel: "chat", ...payload }) }),
  updateTicket: (id: string, payload: { assigned_to?: string | null; status?: Ticket["status"] }) =>
    request<Ticket>(`/api/v1/tickets/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  addMessage: (id: string, body: string) =>
    request<Ticket>(`/api/v1/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ author: "agent", body }) }),
  analyze: (id: string) => request<Record<string, unknown>>(`/api/v1/tickets/${id}/analyze`, { method: "POST" }),
  cases: (id: string) => request<Record<string, unknown>[]>(`/api/v1/tickets/${id}/similar-cases`),
  copilot: (ticketId: string, question: string) => request<Record<string, any>>("/api/v1/copilot/query", { method: "POST", body: JSON.stringify({ ticket_id: ticketId, question }) }),
  feedback: (payload: Record<string, string>) => request("/api/v1/feedback", { method: "POST", body: JSON.stringify(payload) }),
  resolve: (id: string) => request<Ticket>(`/api/v1/tickets/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      root_cause: "validated_support_resolution",
      actions_taken: ["agent_review_completed", "customer_informed"],
      resolution: "resolved",
      customer_informed: true,
      follow_up_required: false,
      final_summary: "Agent completed the recommended checks and informed the customer.",
    }),
  }),
  documents: () => request<Document[]>("/api/v1/knowledge/documents"),
  dashboard: () => request<Dashboard>("/api/v1/analytics/dashboard"),
  ready: () => request<Record<string, unknown>>("/ready"),
};

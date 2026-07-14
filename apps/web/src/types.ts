export type Ticket = {
  id: string;
  customer_id: string;
  title: string;
  channel: "chat" | "email" | "call" | "mobile_app";
  language: "tr" | "en";
  region: string;
  status: "new" | "in_progress" | "waiting" | "resolved";
  assigned_to: string | null;
  created_at: string;
  category: string;
  subcategory: string;
  priority: "low" | "medium" | "high" | "critical";
  confidence: number;
  summary: string;
  redacted_text: string;
  entities: Record<string, string>;
  decision_signals: string[];
  messages: { author: "customer" | "agent" | "system"; body: string; created_at: string }[];
  ai_reviewed: boolean;
  resolution: Record<string, unknown> | null;
};

export type Document = {
  id: string;
  title: string;
  section: string;
  page: number;
  product: string;
  language: string;
  version: string;
  status: string;
  effective_date: string;
  content: string;
  chunk_count: number;
  usage_count: number;
  index_status: string;
  similarity?: number;
};

export type Dashboard = {
  metrics: Record<string, number>;
  categories: { name: string; count: number; share: number }[];
  trend: Record<string, number | string>[];
  incident: { category: string; region: string; observed: number; baseline: string; confidence: string; increase: number };
  regions: { name: string; tickets: number; severity: string }[];
};

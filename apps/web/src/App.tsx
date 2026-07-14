import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Filter,
  HelpCircle,
  Inbox,
  Info,
  Layers3,
  LifeBuoy,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "./api";
import type { Dashboard, Document, Ticket } from "./types";

type Page = "inbox" | "dashboard" | "knowledge" | "models";
type Role = "agent" | "lead";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const percent = (value: number) => `${Math.round(value * 100)}%`;

const fallbackTickets: Ticket[] = [
  {
    id: "TK-1042",
    customer_id: "CUST-0194",
    title: "Evening internet slowdown",
    channel: "chat",
    language: "tr",
    region: "İstanbul Anadolu",
    status: "new",
    assigned_to: null,
    created_at: "18 min ago",
    category: "fixed_internet",
    subcategory: "speed_degradation",
    priority: "medium",
    confidence: 0.94,
    summary:
      "Customer reports recurring evening speed degradation for three days.",
    redacted_text:
      "Son üç gündür özellikle akşam 20.00'den sonra internet hızım çok düşüyor. Modemi yeniden başlattım ama değişiklik olmadı.",
    entities: {
      service_type: "fixed_internet",
      time_pattern: "evening",
      duration: "3 days",
      customer_action: "modem_restarted",
    },
    decision_signals: [
      "Recurring issue",
      "Three-day duration",
      "No full service outage",
      "Single subscriber affected",
    ],
    messages: [
      {
        author: "customer",
        body: "Merhaba, son üç gündür özellikle akşam 20.00'den sonra internet hızım çok düşüyor.",
        created_at: "18 min ago",
      },
      {
        author: "agent",
        body: "Bağlantınızı kontrol edebilmem için modemi yeniden başlatmayı denediniz mi?",
        created_at: "14 min ago",
      },
      {
        author: "customer",
        body: "Evet, yeniden başlattım ama değişiklik olmadı. Telefon: [PHONE_1], e-posta: [EMAIL_1]",
        created_at: "11 min ago",
      },
    ],
    ai_reviewed: true,
    resolution: null,
  },
  {
    id: "TK-1041",
    customer_id: "CUST-1041",
    title: "Mobile data unavailable",
    channel: "mobile_app",
    language: "tr",
    region: "İstanbul Anadolu",
    status: "in_progress",
    assigned_to: "Deniz A.",
    created_at: "24 min ago",
    category: "mobile",
    subcategory: "mobile_data",
    priority: "high",
    confidence: 0.88,
    summary: "5G unavailable in Kadıköy since morning.",
    redacted_text:
      "Kadıköy bölgesinde sabahtan beri 5G bağlantısı kurulamıyor.",
    entities: {},
    decision_signals: [],
    messages: [],
    ai_reviewed: true,
    resolution: null,
  },
  {
    id: "TK-1039",
    customer_id: "CUST-1039",
    title: "Unknown card transaction",
    channel: "email",
    language: "tr",
    region: "Ankara",
    status: "new",
    assigned_to: "Ece K.",
    created_at: "31 min ago",
    category: "billing",
    subcategory: "incorrect_charge",
    priority: "critical",
    confidence: 0.96,
    summary: "Unrecognized mobile payment on invoice.",
    redacted_text:
      "Faturamda bana ait olmayan bir mobil ödeme işlemi görüyorum.",
    entities: {},
    decision_signals: [],
    messages: [],
    ai_reviewed: true,
    resolution: null,
  },
  {
    id: "TK-1038",
    customer_id: "CUST-1038",
    title: "Intermittent DSL",
    channel: "call",
    language: "tr",
    region: "Bursa",
    status: "waiting",
    assigned_to: "Mert S.",
    created_at: "42 min ago",
    category: "fixed_internet",
    subcategory: "intermittent_connection",
    priority: "high",
    confidence: 0.91,
    summary: "Repeated DSL disconnections.",
    redacted_text: "DSL bağlantım gün içinde sürekli kopuyor.",
    entities: {},
    decision_signals: [],
    messages: [],
    ai_reviewed: true,
    resolution: null,
  },
  {
    id: "TK-1035",
    customer_id: "CUST-1035",
    title: "Roaming activation",
    channel: "chat",
    language: "tr",
    region: "İzmir",
    status: "new",
    assigned_to: null,
    created_at: "1 hr ago",
    category: "mobile",
    subcategory: "roaming",
    priority: "medium",
    confidence: 0.82,
    summary: "Mobile data unavailable while roaming.",
    redacted_text: "Almanya'da roaming çalışmıyor.",
    entities: {},
    decision_signals: [],
    messages: [],
    ai_reviewed: true,
    resolution: null,
  },
  {
    id: "TK-1025",
    customer_id: "CUST-1025",
    title: "Unclear connection issue",
    channel: "chat",
    language: "tr",
    region: "Unknown",
    status: "new",
    assigned_to: null,
    created_at: "4 hr ago",
    category: "other",
    subcategory: "unclassified",
    priority: "low",
    confidence: 0.48,
    summary: "Unclear connection behavior.",
    redacted_text: "Bağlantı bazen garip davranıyor.",
    entities: {},
    decision_signals: [],
    messages: [],
    ai_reviewed: false,
    resolution: null,
  },
];

const fallbackDocuments: Document[] = [
  {
    id: "DOC-014",
    title: "DSL Troubleshooting Guide",
    section: "Periodic Speed Degradation",
    page: 18,
    product: "fixed_internet",
    language: "tr",
    version: "2.1",
    status: "active",
    effective_date: "2026-01-01",
    content:
      "Yoğun saatlerde tekrarlayan hız düşüşünde önce Wi-Fi ve Ethernet sonuçlarını karşılaştırın. Hat SNR ve bölgesel kapasite alarmlarını kontrol edin.",
    chunk_count: 24,
    usage_count: 83,
    index_status: "indexed",
    similarity: 0.91,
  },
  {
    id: "DOC-021",
    title: "Wi-Fi Diagnostic Playbook",
    section: "Isolating local interference",
    page: 7,
    product: "fixed_internet",
    language: "tr",
    version: "1.8",
    status: "active",
    effective_date: "2025-11-12",
    content:
      "Sorunun yerel kablosuz ağdan kaynaklanıp kaynaklanmadığını anlamak için aynı cihazda Ethernet testi yapın.",
    chunk_count: 18,
    usage_count: 64,
    index_status: "indexed",
    similarity: 0.84,
  },
  {
    id: "DOC-031",
    title: "SIM Loss & Security Procedure",
    section: "Immediate safeguards",
    page: 3,
    product: "mobile",
    language: "tr",
    version: "3.0",
    status: "active",
    effective_date: "2026-03-01",
    content:
      "Kayıp veya çalıntı SIM bildirimleri en az yüksek öncelikle işlenir.",
    chunk_count: 14,
    usage_count: 41,
    index_status: "indexed",
  },
  {
    id: "DOC-044",
    title: "Mobile Data Troubleshooting",
    section: "Connection loss",
    page: 12,
    product: "mobile",
    language: "tr",
    version: "2.4",
    status: "active",
    effective_date: "2026-02-15",
    content:
      "Mobil veri bağlantı kaybında APN ve bölgesel alarmlar kontrol edilir.",
    chunk_count: 22,
    usage_count: 57,
    index_status: "indexed",
  },
  {
    id: "DOC-008",
    title: "Legacy DSL Handbook",
    section: "Speed checks",
    page: 11,
    product: "fixed_internet",
    language: "tr",
    version: "0.9",
    status: "deprecated",
    effective_date: "2023-06-01",
    content: "Eski prosedür.",
    chunk_count: 9,
    usage_count: 0,
    index_status: "indexed",
  },
];

const fallbackDashboard: Dashboard = {
  metrics: {
    opened_today: 184,
    resolved_today: 142,
    critical_open: 7,
    avg_resolution_hours: 4.6,
    classification_approval: 0.87,
    suggestion_acceptance: 0.68,
    rag_no_answer_rate: 0.09,
    low_confidence_rate: 0.12,
  },
  categories: [
    { name: "fixed_internet", count: 70, share: 0.38 },
    { name: "billing", count: 39, share: 0.21 },
    { name: "mobile", count: 31, share: 0.17 },
    { name: "modem", count: 20, share: 0.11 },
    { name: "other", count: 24, share: 0.13 },
  ],
  trend: [
    { time: "08:00", fixed_internet: 8, mobile: 5, billing: 3 },
    { time: "10:00", fixed_internet: 11, mobile: 7, billing: 5 },
    { time: "12:00", fixed_internet: 14, mobile: 8, billing: 4 },
    { time: "14:00", fixed_internet: 19, mobile: 12, billing: 7 },
    { time: "16:00", fixed_internet: 24, mobile: 18, billing: 6 },
    { time: "18:00", fixed_internet: 31, mobile: 42, billing: 8 },
  ],
  incident: {
    category: "Mobile Data / Connection Loss",
    region: "İstanbul Anadolu",
    observed: 42,
    baseline: "8–14",
    confidence: "high",
    increase: 240,
  },
  regions: [
    { name: "İstanbul Anadolu", tickets: 42, severity: "critical" },
    { name: "İstanbul Avrupa", tickets: 23, severity: "medium" },
    { name: "Ankara", tickets: 17, severity: "low" },
    { name: "İzmir", tickets: 14, severity: "low" },
    { name: "Bursa", tickets: 11, severity: "low" },
  ],
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-wrap">
      <div className="logo-mark">
        <span />
        <span />
        <span />
      </div>
      {!compact && (
        <div>
          <strong>TelcoAssist</strong>
          <small>SUPPORT INTELLIGENCE</small>
        </div>
      )}
    </div>
  );
}

function Landing({ onContinue }: { onContinue: (role: Role) => void }) {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Logo />
        <div className="system-pill">
          <span className="pulse" /> All systems operational
        </div>
      </nav>
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} /> Grounded. Explainable. Human-led.
          </div>
          <h1>
            Every support decision,
            <br />
            <em>better informed.</em>
          </h1>
          <p>
            TelcoAssist turns complex telecom tickets into clear,
            evidence-backed next actions — while your team stays in control.
          </p>
          <div className="role-actions">
            <button
              className="role-button primary"
              onClick={() => onContinue("agent")}
            >
              <span>
                <UserRound size={20} />
                <b>Continue as Support Agent</b>
                <small>Open inbox and resolve tickets</small>
              </span>
              <ArrowRight size={19} />
            </button>
            <button className="role-button" onClick={() => onContinue("lead")}>
              <span>
                <BarChart3 size={20} />
                <b>Continue as Team Lead</b>
                <small>View operations intelligence</small>
              </span>
              <ArrowRight size={19} />
            </button>
          </div>
          <div className="trust-row">
            <span>
              <ShieldCheck size={16} /> PII protected
            </span>
            <span>
              <BookOpen size={16} /> Citation grounded
            </span>
            <span>
              <Users size={16} /> Human approved
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="signal-orbit orbit-one" />
          <div className="signal-orbit orbit-two" />
          <div className="mini-card ticket-mini">
            <div className="mini-head">
              <span className="avatar">C</span>
              <div>
                <b>Customer ticket</b>
                <small>Just now · Chat</small>
              </div>
              <span className="status new">NEW</span>
            </div>
            <p>“Akşamları internetim çok yavaşlıyor...”</p>
          </div>
          <div className="flow-line">
            <span />
          </div>
          <div className="mini-card ai-mini">
            <div className="mini-head">
              <span className="ai-icon">
                <WandSparkles size={17} />
              </span>
              <div>
                <b>Analysis complete</b>
                <small>1.2s · Baseline v1.0</small>
              </div>
              <CheckCircle2 size={18} className="green" />
            </div>
            <div className="prediction">
              <span>Fixed Internet · Speed</span>
              <b>94%</b>
            </div>
            <div className="progress">
              <i style={{ width: "94%" }} />
            </div>
            <div className="mini-source">
              <FileText size={15} />
              <span>3 grounded sources found</span>
              <ChevronRight size={15} />
            </div>
          </div>
          <div className="float-chip chip-one">
            <Zap size={15} /> Review-ready workflow
          </div>
          <div className="float-chip chip-two">
            <ShieldCheck size={15} /> Evidence checked
          </div>
        </div>
      </section>
      <footer className="landing-footer">
        <div>
          <span>MODEL</span>
          <b>TF-IDF Linear · v1.0</b>
        </div>
        <div>
          <span>KNOWLEDGE BASE</span>
          <b>5 active documents</b>
        </div>
        <div>
          <span>ENVIRONMENT</span>
          <b>Synthetic demo data</b>
        </div>
        <p>No real customer data is used in this environment.</p>
      </footer>
    </main>
  );
}

function Shell({
  page,
  setPage,
  role,
  children,
}: {
  page: Page;
  setPage: (p: Page) => void;
  role: Role;
  children: React.ReactNode;
}) {
  const nav = [
    { id: "inbox" as Page, icon: Inbox, label: "Agent inbox", badge: "8" },
    { id: "dashboard" as Page, icon: BarChart3, label: "Operations" },
    { id: "knowledge" as Page, icon: BookOpen, label: "Knowledge base" },
    { id: "models" as Page, icon: CircleGauge, label: "Model health" },
  ];
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="side-logo">
          <Logo />
          <button>
            <Menu size={18} />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-icon">TN</span>
          <div>
            <small>WORKSPACE</small>
            <b>Telco Network Ops</b>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav>
          {nav.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge && <i>{badge}</i>}
            </button>
          ))}
        </nav>
        <div className="side-section">
          <span>MANAGE</span>
          <button>
            <Users size={18} /> Team members
          </button>
          <button>
            <Settings size={18} /> Settings
          </button>
        </div>
        <div className="side-spacer" />
        <div className="privacy-box">
          <ShieldCheck size={20} />
          <div>
            <b>Privacy protected</b>
            <small>PII redaction is active</small>
          </div>
        </div>
        <div className="profile">
          <span>BA</span>
          <div>
            <b>Barış A.</b>
            <small>{role === "lead" ? "Team Lead" : "Support Agent"}</small>
          </div>
          <MoreHorizontal size={18} />
        </div>
      </aside>
      <section className="main-column">{children}</section>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <div className="global-search">
          <Search size={17} />
          <span>Search anything</span>
          <kbd>⌘ K</kbd>
        </div>
        <button className="icon-button">
          <HelpCircle size={18} />
        </button>
        <button className="icon-button notification">
          <Bell size={18} />
          <i />
        </button>
      </div>
    </header>
  );
}

function Priority({ value }: { value: string }) {
  return (
    <span className={`priority ${value}`}>
      <i />
      {titleCase(value)}
    </span>
  );
}
function Status({ value }: { value: string }) {
  return <span className={`ticket-status ${value}`}>{titleCase(value)}</span>;
}

function InboxPage({
  tickets,
  onSelect,
}: {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
}) {
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const visible = tickets.filter(
    (t) =>
      `${t.id} ${t.title} ${t.redacted_text}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (priorityFilter === "all" || t.priority === priorityFilter),
  );
  return (
    <>
      <Header
        title="Agent inbox"
        subtitle="Review, prioritize, and resolve customer requests."
      />
      <div className="page inbox-page">
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-icon mint">
              <Inbox size={18} />
            </span>
            <div>
              <small>OPEN TICKETS</small>
              <b>{tickets.length}</b>
              <p>
                <em>+12%</em> from yesterday
              </p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon coral">
              <AlertTriangle size={18} />
            </span>
            <div>
              <small>CRITICAL</small>
              <b>{tickets.filter((t) => t.priority === "critical").length}</b>
              <p>Requires attention</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon blue">
              <UserRound size={18} />
            </span>
            <div>
              <small>ASSIGNED TO ME</small>
              <b>{tickets.filter((t) => t.assigned_to).length}</b>
              <p>4 due soon</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon amber">
              <Clock3 size={18} />
            </span>
            <div>
              <small>AVG. FIRST RESPONSE</small>
              <b>4m 12s</b>
              <p>
                <em>−8%</em> this week
              </p>
            </div>
          </div>
        </div>
        <div className="inbox-layout">
          <aside className="filters">
            <div className="filter-title">
              <span>
                <Filter size={16} /> Filters
              </span>
              <button>Clear all</button>
            </div>
            <FilterGroup
              label="STATUS"
              items={["New", "In progress", "Waiting", "Resolved"]}
              counts={[3, 2, 1, 2]}
            />
            <FilterGroup
              label="PRIORITY"
              items={["Critical", "High", "Medium", "Low"]}
              counts={[1, 2, 2, 3]}
              selected={priorityFilter}
              onSelect={(v) =>
                setPriorityFilter(v === priorityFilter ? "all" : v)
              }
            />
            <FilterGroup
              label="CATEGORY"
              items={["Fixed internet", "Mobile", "Billing", "Account"]}
              counts={[3, 2, 2, 1]}
            />
            <FilterGroup
              label="CHANNEL"
              items={["Chat", "E-mail", "Call", "Mobile app"]}
              counts={[4, 2, 1, 1]}
            />
            <div className="confidence-filter">
              <div>
                <span>MODEL CONFIDENCE</span>
                <b>All scores</b>
              </div>
              <input type="range" min="0" max="100" defaultValue="0" />
              <label>
                <input type="checkbox" /> Needs AI review only
              </label>
            </div>
          </aside>
          <section className="ticket-panel">
            <div className="ticket-tools">
              <div className="search-input">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ticket, customer, or keyword..."
                />
              </div>
              <button className="outline-button">
                <RefreshCw size={16} /> Refresh
              </button>
              <button className="primary-button">
                <Plus size={17} /> New ticket
              </button>
            </div>
            <div className="list-meta">
              <span>
                <b>{visible.length}</b> tickets
              </span>
              <span>
                Last updated just now ·{" "}
                <button>
                  Sort: Priority <ChevronDown size={14} />
                </button>
              </span>
            </div>
            <div className="ticket-table">
              <div className="table-head">
                <span className="check-cell">
                  <input type="checkbox" />
                </span>
                <span>TICKET</span>
                <span>CATEGORY</span>
                <span>PRIORITY</span>
                <span>AI CONFIDENCE</span>
                <span>ASSIGNEE</span>
                <span>STATUS</span>
                <span />
              </div>
              {visible.map((ticket) => (
                <button
                  className="ticket-row"
                  key={ticket.id}
                  onClick={() => onSelect(ticket)}
                >
                  <span
                    className="check-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input type="checkbox" />
                  </span>
                  <span className="ticket-main">
                    <b>
                      {ticket.id} <small>· {ticket.created_at}</small>
                    </b>
                    <strong>{ticket.title}</strong>
                    <p>{ticket.redacted_text}</p>
                  </span>
                  <span className="category-cell">
                    <i className={`category-icon ${ticket.category}`}>
                      <Wifi size={15} />
                    </i>
                    <span>
                      {titleCase(ticket.category)}
                      <small>{titleCase(ticket.subcategory)}</small>
                    </span>
                  </span>
                  <Priority value={ticket.priority} />
                  <span
                    className={`confidence ${ticket.confidence < 0.6 ? "review" : ""}`}
                  >
                    <b>{percent(ticket.confidence)}</b>
                    <i>
                      <em style={{ width: percent(ticket.confidence) }} />
                    </i>
                    {ticket.confidence < 0.6 && (
                      <small>
                        <AlertTriangle size={12} /> Review required
                      </small>
                    )}
                  </span>
                  <span className="assignee">
                    {ticket.assigned_to ? (
                      <>
                        <i>
                          {ticket.assigned_to
                            .split(" ")
                            .map((s) => s[0])
                            .join("")}
                        </i>
                        {ticket.assigned_to}
                      </>
                    ) : (
                      <em>Unassigned</em>
                    )}
                  </span>
                  <Status value={ticket.status} />
                  <ChevronRight size={17} className="row-arrow" />
                </button>
              ))}
            </div>
            <div className="pagination">
              <span>
                Showing 1–{visible.length} of {visible.length}
              </span>
              <div>
                <button disabled>
                  <ChevronRight size={16} />
                </button>
                <button className="current">1</button>
                <button>2</button>
                <button>3</button>
                <button>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function FilterGroup({
  label,
  items,
  counts,
  selected,
  onSelect,
}: {
  label: string;
  items: string[];
  counts: number[];
  selected?: string;
  onSelect?: (v: string) => void;
}) {
  return (
    <div className="filter-group">
      <span>{label}</span>
      {items.map((item, i) => (
        <label key={item}>
          <input
            type="checkbox"
            checked={selected === item.toLowerCase()}
            onChange={() => onSelect?.(item.toLowerCase())}
          />
          <em>{item}</em>
          <small>{counts[i]}</small>
        </label>
      ))}
    </div>
  );
}

type DetailTab = "sources" | "cases" | "copilot";
function TicketDetail({
  ticket,
  documents,
  onBack,
}: {
  ticket: Ticket;
  documents: Document[];
  onBack: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("sources");
  const [question, setQuestion] = useState(
    "Bu problemi doğrulamak için hangi kontrolleri yapmalıyım?",
  );
  const [answer, setAnswer] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const sources = documents
    .filter(
      (d) =>
        d.status === "active" &&
        (d.product === ticket.category || ticket.category === "other"),
    )
    .slice(0, 3);
  const ask = async () => {
    setLoading(true);
    try {
      setAnswer(await api.copilot(ticket.id, question));
    } catch {
      setAnswer({
        answer:
          "Mevcut ticket bağlamına göre önce Wi-Fi ve Ethernet sonuçlarını karşılaştırın.",
        confidence: "high",
        recommended_steps: [
          {
            step: "Wi-Fi ve Ethernet hız testlerini karşılaştırın.",
            source_ids: ["DOC-014"],
          },
          {
            step: "Hat SNR ve senkronizasyon geçmişini inceleyin.",
            source_ids: ["DOC-014"],
          },
          {
            step: "Bölgesel kapasite alarmlarını kontrol edin.",
            source_ids: ["DOC-021"],
          },
        ],
        sources,
      });
    } finally {
      setLoading(false);
    }
  };
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };
  return (
    <div className="detail-page">
      <div className="detail-top">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="detail-title">
            <h2>{ticket.id}</h2>
            <Status value={ticket.status} />
            <Priority value={ticket.priority} />
          </div>
          <p>{ticket.title}</p>
        </div>
        <div className="detail-actions">
          <button className="outline-button">
            <UserRound size={16} /> {ticket.assigned_to ?? "Assign to me"}
          </button>
          <button className="outline-button">
            <MoreHorizontal size={18} />
          </button>
          <button
            className="resolve-button"
            onClick={() => notify("Resolution draft opened")}
          >
            <ClipboardCheck size={17} /> Resolve ticket
          </button>
        </div>
      </div>
      <div className="detail-columns">
        <section className="conversation-column">
          <div className="column-heading">
            <div>
              <span>CUSTOMER CONTEXT</span>
              <b>{ticket.customer_id}</b>
            </div>
            <button>
              <MoreHorizontal size={17} />
            </button>
          </div>
          <div className="customer-card">
            <div className="customer-head">
              <span>C</span>
              <div>
                <b>{ticket.customer_id}</b>
                <small>Residential · Fiber 100 Mbps</small>
              </div>
              <span className="verified">
                <Check size={12} /> Verified
              </span>
            </div>
            <div className="customer-meta">
              <span>
                <small>REGION</small>
                {ticket.region}
              </span>
              <span>
                <small>CUSTOMER SINCE</small>Oct 2022
              </span>
            </div>
            <button>
              View customer history <ChevronRight size={15} />
            </button>
          </div>
          <div className="timeline-label">
            <span>Today</span>
          </div>
          <div className="messages">
            {ticket.messages.length ? (
              ticket.messages.map((message, index) => (
                <div className={`message ${message.author}`} key={index}>
                  <div className="message-meta">
                    <b>
                      {message.author === "customer"
                        ? ticket.customer_id
                        : "You"}
                    </b>
                    <small>{message.created_at}</small>
                  </div>
                  <p>{message.body}</p>
                  {message.body.includes("[") && (
                    <span className="redacted-note">
                      <ShieldCheck size={13} /> Personal data redacted
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="message customer">
                <p>{ticket.redacted_text}</p>
              </div>
            )}
          </div>
          <div className="reply-box">
            <textarea placeholder="Write a response..." />
            <div>
              <span>
                <button>
                  <Paperclip size={17} />
                </button>
                <button onClick={() => notify("Grounded draft generated")}>
                  <WandSparkles size={17} /> Generate draft
                </button>
              </span>
              <button className="send-button" disabled>
                <Send size={16} /> Send
              </button>
            </div>
            <small>
              <Info size={12} /> AI drafts require your review before sending.
            </small>
          </div>
        </section>
        <section className="analysis-column">
          <div className="column-heading">
            <div>
              <span>AI ANALYSIS</span>
              <b>Ticket intelligence</b>
            </div>
            <span className="model-badge">
              <Sparkles size={13} /> Baseline v1.0
            </span>
          </div>
          <AnalysisCard icon={<FileText size={17} />} title="Ticket summary">
            <p>{ticket.summary || ticket.redacted_text}</p>
            <button className="text-action">
              <Copy size={14} /> Copy
            </button>
          </AnalysisCard>
          <AnalysisCard
            icon={<Layers3 size={17} />}
            title="Predicted classification"
            side={
              <span className="confidence-number">
                {percent(ticket.confidence)}
              </span>
            }
          >
            <div className="classification-value">
              <span>
                <small>CATEGORY</small>
                {titleCase(ticket.category)}
              </span>
              <ChevronRight size={17} />
              <span>
                <small>SUBCATEGORY</small>
                {titleCase(ticket.subcategory)}
              </span>
            </div>
            <div className="review-actions">
              <button
                className="confirmed"
                onClick={() => notify("Classification confirmed")}
              >
                <Check size={15} /> Confirm
              </button>
              <button>Change</button>
              <button>
                <X size={15} /> Incorrect
              </button>
            </div>
          </AnalysisCard>
          <AnalysisCard
            icon={<AlertTriangle size={17} />}
            title="Suggested priority"
            side={<Priority value={ticket.priority} />}
          >
            <p className="muted-copy">Decision signals</p>
            <ul className="signal-list">
              {(ticket.decision_signals.length
                ? ticket.decision_signals
                : [
                    "Recurring issue",
                    "Single subscriber affected",
                    "No full service outage",
                  ]
              ).map((signal) => (
                <li key={signal}>
                  <CheckCircle2 size={14} />
                  {signal}
                </li>
              ))}
            </ul>
            <div className="confidence-footer">
              <span>Confidence</span>
              <div>
                <i>
                  <em style={{ width: "78%" }} />
                </i>
                <b>78%</b>
              </div>
            </div>
          </AnalysisCard>
          <AnalysisCard
            icon={<Database size={17} />}
            title="Extracted entities"
          >
            <div className="entity-grid">
              {Object.entries(
                Object.keys(ticket.entities).length
                  ? ticket.entities
                  : {
                      service: "Fixed Internet",
                      pattern: "Evening",
                      duration: "3 days",
                      location: "Unknown",
                      modem_model: "Unknown",
                      customer_action: "Restarted modem",
                    },
              ).map(([key, value]) => (
                <span key={key}>
                  <small>{titleCase(key)}</small>
                  <b className={value === "Unknown" ? "unknown" : ""}>
                    {titleCase(String(value))}
                  </b>
                </span>
              ))}
            </div>
            <div className="follow-up">
              <Sparkles size={16} />
              <div>
                <small>SUGGESTED FOLLOW-UP</small>
                <p>
                  “Is the speed degradation observed on both Wi-Fi and
                  Ethernet?”
                </p>
              </div>
              <button onClick={() => notify("Question inserted into response")}>
                <Plus size={14} />
              </button>
            </div>
          </AnalysisCard>
          <AnalysisCard
            icon={<ClipboardCheck size={17} />}
            title="Recommended next actions"
          >
            <ol className="next-actions">
              <li>
                <span>1</span>
                <p>
                  Compare Wi-Fi and Ethernet performance.
                  <small>DSL Guide · 91% confidence</small>
                </p>
                <input type="checkbox" />
              </li>
              <li>
                <span>2</span>
                <p>
                  Retrieve line quality history.
                  <small>DSL Guide · 88% confidence</small>
                </p>
                <input type="checkbox" />
              </li>
              <li>
                <span>3</span>
                <p>
                  Check regional congestion alarms.
                  <small>Incident Policy · 84% confidence</small>
                </p>
                <input type="checkbox" />
              </li>
            </ol>
          </AnalysisCard>
        </section>
        <aside className="evidence-column">
          <div className="tabs">
            <button
              className={tab === "sources" ? "active" : ""}
              onClick={() => setTab("sources")}
            >
              Sources <i>{sources.length}</i>
            </button>
            <button
              className={tab === "cases" ? "active" : ""}
              onClick={() => setTab("cases")}
            >
              Similar cases <i>3</i>
            </button>
            <button
              className={tab === "copilot" ? "active" : ""}
              onClick={() => setTab("copilot")}
            >
              <Sparkles size={14} /> Copilot
            </button>
          </div>
          {tab === "sources" && <SourcesTab sources={sources} />}
          {tab === "cases" && <CasesTab />}
          {tab === "copilot" && (
            <CopilotTab
              question={question}
              setQuestion={setQuestion}
              answer={answer}
              loading={loading}
              ask={ask}
              notify={notify}
            />
          )}
        </aside>
      </div>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({
  icon,
  title,
  side,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  side?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="analysis-card">
      <header>
        <span className="card-icon">{icon}</span>
        <b>{title}</b>
        {side && <div className="card-side">{side}</div>}
      </header>
      <div className="analysis-body">{children}</div>
    </article>
  );
}

function SourcesTab({ sources }: { sources: Document[] }) {
  const [open, setOpen] = useState<string | null>(sources[0]?.id ?? null);
  return (
    <div className="evidence-scroll">
      <div className="evidence-intro">
        <BookOpen size={18} />
        <div>
          <b>Grounded in active sources</b>
          <p>Recommendations only use approved knowledge.</p>
        </div>
      </div>
      {sources.map((source) => (
        <article
          className={`source-card ${open === source.id ? "open" : ""}`}
          key={source.id}
          onClick={() => setOpen(open === source.id ? null : source.id)}
        >
          <header>
            <span className="doc-icon">
              <FileText size={17} />
            </span>
            <div>
              <b>{source.title}</b>
              <small>v{source.version} · Active</small>
            </div>
            <ChevronDown size={16} />
          </header>
          <p>{source.section}</p>
          <div className="source-meta">
            <span>Page {source.page}</span>
            <span>
              Relevance <b>{percent(source.similarity ?? 0.86)}</b>
            </span>
          </div>
          {open === source.id && (
            <div className="source-excerpt">
              <span>USED PASSAGE</span>
              <p>{source.content}</p>
              <button>
                Open document <ExternalLink size={13} />
              </button>
            </div>
          )}
        </article>
      ))}
      <div className="retrieval-note">
        <ShieldCheck size={16} />
        <p>
          <b>Evidence threshold applied</b>
          <small>Deprecated sources are excluded by default.</small>
        </p>
      </div>
    </div>
  );
}

function CasesTab() {
  const cases = [
    {
      id: "CASE-2031",
      score: 89,
      title: "Peak-hour throughput degradation",
      resolution:
        "Regional congestion confirmed. Capacity expansion request opened.",
      time: "2d 4h",
      region: "İstanbul Anadolu",
    },
    {
      id: "CASE-1998",
      score: 82,
      title: "Local Wi-Fi interference",
      resolution: "Wi-Fi channel changed and modem relocated.",
      time: "38m",
      region: "Ankara",
    },
    {
      id: "CASE-1884",
      score: 74,
      title: "DSL line quality regression",
      resolution: "Outside line fault repaired after escalation.",
      time: "1d 6h",
      region: "Bursa",
    },
  ];
  return (
    <div className="evidence-scroll">
      <div className="evidence-intro">
        <Layers3 size={18} />
        <div>
          <b>Resolved case matches</b>
          <p>Hybrid search · filtered to last 12 months.</p>
        </div>
      </div>
      {cases.map((item) => (
        <article className="case-card" key={item.id}>
          <header>
            <b>{item.id}</b>
            <span>{item.score}% match</span>
          </header>
          <h4>{item.title}</h4>
          <small>RESOLUTION</small>
          <p>{item.resolution}</p>
          <footer>
            <span>
              <CheckCircle2 size={13} /> Resolved
            </span>
            <span>
              <Clock3 size={13} /> {item.time}
            </span>
            <span>{item.region}</span>
          </footer>
        </article>
      ))}
    </div>
  );
}

function CopilotTab({
  question,
  setQuestion,
  answer,
  loading,
  ask,
  notify,
}: {
  question: string;
  setQuestion: (v: string) => void;
  answer: Record<string, any> | null;
  loading: boolean;
  ask: () => void;
  notify: (v: string) => void;
}) {
  return (
    <div className="copilot-tab">
      <div className="copilot-head">
        <span>
          <Sparkles size={19} />
        </span>
        <div>
          <b>Ticket copilot</b>
          <p>Answers use this ticket and approved knowledge.</p>
        </div>
      </div>
      <div className="suggestions">
        <button
          onClick={() => setQuestion("Bu müşteriye hangi soruları sormalıyım?")}
        >
          What should I ask next?
        </button>
        <button
          onClick={() =>
            setQuestion("Benzer vakalarda en sık kullanılan çözüm nedir?")
          }
        >
          Common resolutions
        </button>
        <button
          onClick={() =>
            setQuestion("Müşteriye kısa bir cevap taslağı hazırla.")
          }
        >
          Draft a response
        </button>
      </div>
      <div className="copilot-input">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button onClick={ask} disabled={loading}>
          {loading ? (
            <RefreshCw className="spin" size={17} />
          ) : (
            <ArrowRight size={17} />
          )}
        </button>
      </div>
      {answer && (
        <div className="copilot-answer">
          <div className="answer-label">
            <span>ANSWER</span>
            <b className={answer.confidence}>{titleCase(answer.confidence)}</b>
          </div>
          <p>{answer.answer}</p>
          {answer.recommended_steps?.length > 0 && (
            <ol>
              {answer.recommended_steps.map((step: any, i: number) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  <p>
                    {step.step}
                    <small>{step.source_ids.join(" · ")}</small>
                  </p>
                </li>
              ))}
            </ol>
          )}
          <div className="answer-evidence">
            <ShieldCheck size={14} />{" "}
            {answer.insufficient_context
              ? "No sufficiently relevant evidence"
              : `${answer.sources?.length ?? 2} evidence sources · Every step cited`}
          </div>
          <div className="answer-actions">
            <span>
              <button onClick={() => notify("Feedback recorded")}>
                <ThumbsUp size={15} />
              </button>
              <button onClick={() => notify("Feedback recorded")}>
                <ThumbsDown size={15} />
              </button>
              <button>
                <AlertTriangle size={15} />
              </button>
            </span>
            <button onClick={() => notify("Answer copied")}>
              <Copy size={14} /> Copy
            </button>
            <button onClick={() => notify("Inserted into response")}>
              <Plus size={14} /> Insert
            </button>
          </div>
        </div>
      )}
      <div className="copilot-disclaimer">
        <Info size={14} /> Copilot never sends messages or performs customer
        actions.
      </div>
    </div>
  );
}

function DashboardPage({ data }: { data: Dashboard }) {
  const metrics = [
    {
      label: "Tickets opened",
      value: data.metrics.opened_today,
      delta: "+12%",
      icon: Inbox,
      color: "mint",
    },
    {
      label: "Resolved today",
      value: data.metrics.resolved_today,
      delta: "+8%",
      icon: CheckCircle2,
      color: "blue",
    },
    {
      label: "Critical open",
      value: data.metrics.critical_open,
      delta: "2 new",
      icon: AlertTriangle,
      color: "coral",
    },
    {
      label: "Avg. resolution",
      value: `${data.metrics.avg_resolution_hours}h`,
      delta: "−11%",
      icon: Clock3,
      color: "amber",
    },
  ];
  return (
    <>
      <Header
        title="Operations intelligence"
        subtitle="Live support health, AI adoption, and emerging incident signals."
      />
      <div className="page dashboard-page">
        <div className="dashboard-bar">
          <div>
            <button className="active">Today</button>
            <button>7 days</button>
            <button>30 days</button>
          </div>
          <span>
            <span className="pulse" /> Live · updated 1 min ago
          </span>
        </div>
        <section className="incident-card">
          <div className="incident-icon">
            <TrendingUp size={22} />
          </div>
          <div className="incident-copy">
            <span>POTENTIAL INCIDENT DETECTED</span>
            <h3>{data.incident.category}</h3>
            <p>
              <b>{data.incident.region}</b> · {data.incident.observed} tickets
              in the last 60 minutes
            </p>
          </div>
          <div className="incident-number">
            <small>ABOVE BASELINE</small>
            <b>+{data.incident.increase}%</b>
            <span>Expected {data.incident.baseline}</span>
          </div>
          <button>
            Investigate <ArrowRight size={16} />
          </button>
        </section>
        <div className="metric-grid">
          {metrics.map(({ label, value, delta, icon: Icon, color }) => (
            <article className="metric-card" key={label}>
              <span className={`stat-icon ${color}`}>
                <Icon size={18} />
              </span>
              <div>
                <small>{label}</small>
                <b>{value}</b>
                <p>
                  <em>{delta}</em> vs. previous period
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="dashboard-grid">
          <article className="chart-card trend-chart">
            <header>
              <div>
                <h3>Ticket volume by category</h3>
                <p>Hourly intake across active queues</p>
              </div>
              <button>
                All categories <ChevronDown size={15} />
              </button>
            </header>
            <div className="chart-legend">
              <span>
                <i className="line-mint" /> Fixed internet
              </span>
              <span>
                <i className="line-coral" /> Mobile
              </span>
              <span>
                <i className="line-blue" /> Billing
              </span>
            </div>
            <ResponsiveContainer width="100%" height={275}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="mintFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#36c693" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#36c693" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e8ecea"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#76827e", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#76827e", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #dfe6e3",
                    boxShadow: "0 8px 28px #153b2e18",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="fixed_internet"
                  stroke="#20a978"
                  strokeWidth={2.5}
                  fill="url(#mintFill)"
                />
                <Area
                  type="monotone"
                  dataKey="mobile"
                  stroke="#ef765f"
                  strokeWidth={2.5}
                  fill="none"
                />
                <Area
                  type="monotone"
                  dataKey="billing"
                  stroke="#5b85d6"
                  strokeWidth={2.5}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </article>
          <article className="chart-card category-chart">
            <header>
              <div>
                <h3>Category distribution</h3>
                <p>Share of today's volume</p>
              </div>
              <button>
                <MoreHorizontal size={18} />
              </button>
            </header>
            <div className="donut-wrap">
              <div
                className="donut"
                style={{
                  background:
                    "conic-gradient(#25b984 0 38%, #527bd0 38% 59%, #ef765f 59% 76%, #e5ad4c 76% 87%, #aab5b1 87%)",
                }}
              >
                <div>
                  <b>{data.metrics.opened_today}</b>
                  <span>TOTAL</span>
                </div>
              </div>
            </div>
            <div className="category-list">
              {data.categories.map((item, i) => (
                <div key={item.name}>
                  <span>
                    <i
                      style={{
                        background: [
                          "#25b984",
                          "#527bd0",
                          "#ef765f",
                          "#e5ad4c",
                          "#aab5b1",
                        ][i],
                      }}
                    />
                    {titleCase(item.name)}
                  </span>
                  <b>{percent(item.share)}</b>
                </div>
              ))}
            </div>
          </article>
          <article className="chart-card region-table">
            <header>
              <div>
                <h3>Regional pressure</h3>
                <p>Open tickets and anomaly severity</p>
              </div>
              <button>
                View all <ArrowRight size={14} />
              </button>
            </header>
            {data.regions.map((region) => (
              <div className="region-row" key={region.name}>
                <span>{region.name}</span>
                <div>
                  <i>
                    <em
                      style={{ width: `${Math.min(100, region.tickets * 2)}%` }}
                    />
                  </i>
                  <b>{region.tickets}</b>
                </div>
                <span className={`severity ${region.severity}`}>
                  {titleCase(region.severity)}
                </span>
              </div>
            ))}
          </article>
          <article className="chart-card adoption-card">
            <header>
              <div>
                <h3>AI quality & adoption</h3>
                <p>Human feedback from this period</p>
              </div>
            </header>
            <div className="adoption-metrics">
              <ProgressMetric
                label="Classification approval"
                value={data.metrics.classification_approval}
                color="#25b984"
              />
              <ProgressMetric
                label="Suggestion acceptance"
                value={data.metrics.suggestion_acceptance}
                color="#527bd0"
              />
              <ProgressMetric
                label="Low-confidence predictions"
                value={data.metrics.low_confidence_rate}
                color="#e5ad4c"
              />
              <ProgressMetric
                label="RAG no-answer rate"
                value={data.metrics.rag_no_answer_rate}
                color="#ef765f"
              />
            </div>
            <div className="quality-note">
              <ShieldCheck size={18} />
              <p>
                <b>Quality guardrails healthy</b>
                <small>No critical PII leakage detected in evaluation.</small>
              </p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

function ProgressMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <span>
        <small>{label}</small>
        <b>{percent(value)}</b>
      </span>
      <i>
        <em style={{ width: percent(value), background: color }} />
      </i>
    </div>
  );
}

function KnowledgePage({ documents }: { documents: Document[] }) {
  const [query, setQuery] = useState("");
  const visible = documents.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Header
        title="Knowledge base"
        subtitle="Manage the approved evidence behind every recommendation."
      />
      <div className="page knowledge-page">
        <div className="kb-banner">
          <div>
            <span>
              <BookOpen size={24} />
            </span>
            <div>
              <h3>Knowledge health</h3>
              <p>
                {documents.filter((d) => d.status === "active").length} active
                documents · {documents.reduce((a, d) => a + d.chunk_count, 0)}{" "}
                indexed chunks · Last sync 9 minutes ago
              </p>
            </div>
          </div>
          <div>
            <b>98.4%</b>
            <span>INDEX COVERAGE</span>
          </div>
        </div>
        <div className="kb-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, products, or tags..."
            />
          </div>
          <button className="outline-button">
            <Filter size={16} /> Filters
          </button>
          <button className="primary-button">
            <Upload size={16} /> Upload document
          </button>
        </div>
        <div className="document-table">
          <div className="doc-head">
            <span>DOCUMENT</span>
            <span>PRODUCT</span>
            <span>VERSION</span>
            <span>STATUS</span>
            <span>CHUNKS</span>
            <span>USED IN ANSWERS</span>
            <span>UPDATED</span>
            <span />
          </div>
          {visible.map((doc) => (
            <div className="doc-row" key={doc.id}>
              <span className="doc-name">
                <i>
                  <FileText size={18} />
                </i>
                <span>
                  <b>{doc.title}</b>
                  <small>
                    {doc.id} · {doc.language.toUpperCase()}
                  </small>
                </span>
              </span>
              <span>{titleCase(doc.product)}</span>
              <span>v{doc.version}</span>
              <span>
                <i className={`lifecycle ${doc.status}`}>
                  {titleCase(doc.status)}
                </i>
              </span>
              <span>{doc.chunk_count}</span>
              <span>{doc.usage_count}</span>
              <span>{doc.effective_date}</span>
              <button>
                <MoreHorizontal size={17} />
              </button>
            </div>
          ))}
        </div>
        <div className="kb-bottom-grid">
          <article>
            <header>
              <h3>Indexing pipeline</h3>
              <span className="status-dot">Healthy</span>
            </header>
            <div className="pipeline">
              <span className="done">
                <Check size={14} /> Upload
              </span>
              <i />
              <span className="done">
                <Check size={14} /> Parse
              </span>
              <i />
              <span className="done">
                <Check size={14} /> Chunk
              </span>
              <i />
              <span className="done">
                <Check size={14} /> Embed
              </span>
              <i />
              <span className="done">
                <Check size={14} /> Index
              </span>
            </div>
            <p>
              Average indexing time: <b>18 seconds</b>
            </p>
          </article>
          <article>
            <header>
              <h3>Unanswered questions</h3>
              <span>Last 7 days</span>
            </header>
            <div className="unanswered">
              <b>17</b>
              <p>
                questions lacked sufficient evidence
                <small>Top gap: “IPv6 prefix delegation”</small>
              </p>
              <button>
                Review gaps <ArrowRight size={14} />
              </button>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

function ModelsPage() {
  return (
    <>
      <Header
        title="Model health"
        subtitle="Production model performance, evaluation gates, and drift signals."
      />
      <div className="page models-page">
        <div className="model-hero">
          <div>
            <span className="model-live">
              <span className="pulse" /> PRODUCTION
            </span>
            <h3>TF-IDF + Logistic Regression</h3>
            <p>Default CPU-optimized hierarchical classifier</p>
            <div>
              <span>
                Version <b>1.0.0</b>
              </span>
              <span>
                Published <b>09 Jul 2026</b>
              </span>
              <span>
                Mean latency <b>0.22 ms</b>
              </span>
            </div>
          </div>
          <div className="model-score">
            <CircleGauge size={25} />
            <b>1.00</b>
            <span>MACRO F1</span>
          </div>
        </div>
        <div className="gate-grid">
          <MetricGate
            label="Classification Macro F1"
            actual="1.00"
            target="≥ 0.85"
            pass
          />
          <MetricGate
            label="Critical ticket recall"
            actual="0.96"
            target="≥ 0.90"
            pass
          />
          <MetricGate
            label="PII detection recall"
            actual="0.98"
            target="≥ 0.95"
            pass
          />
          <MetricGate
            label="Retrieval Recall@5"
            actual="0.89"
            target="≥ 0.85"
            pass
          />
          <MetricGate
            label="Retrieval MRR"
            actual="0.81"
            target="≥ 0.75"
            pass
          />
          <MetricGate
            label="Unsupported claim rate"
            actual="0.03"
            target="≤ 0.05"
            pass
          />
        </div>
        <div className="model-grid">
          <article className="chart-card">
            <header>
              <div>
                <h3>Language performance</h3>
                <p>Evaluation dataset v1.3 · group split</p>
              </div>
            </header>
            <div className="language-bars">
              <ProgressMetric
                label="Turkish · Macro F1"
                value={1}
                color="#25b984"
              />
              <ProgressMetric
                label="English · Macro F1"
                value={1}
                color="#527bd0"
              />
              <ProgressMetric
                label="Low-frequency class recall"
                value={1}
                color="#e5ad4c"
              />
            </div>
          </article>
          <article className="chart-card">
            <header>
              <div>
                <h3>Deployment safeguards</h3>
                <p>Readiness checks for the active version</p>
              </div>
            </header>
            <ul className="safeguard-list">
              <li>
                <CheckCircle2 size={16} /> Model artifact checksum verified
              </li>
              <li>
                <CheckCircle2 size={16} /> Calibration drift within threshold
              </li>
              <li>
                <CheckCircle2 size={16} /> PII evaluation gate passed
              </li>
              <li>
                <CheckCircle2 size={16} /> Rollback artifact available
              </li>
            </ul>
          </article>
        </div>
        <p className="metrics-disclaimer">
          <Info size={14} /> Metrics shown are measured on the repository's
          synthetic evaluation set and must not be interpreted as real-world
          operator performance.
        </p>
      </div>
    </>
  );
}

function MetricGate({
  label,
  actual,
  target,
  pass,
}: {
  label: string;
  actual: string;
  target: string;
  pass: boolean;
}) {
  return (
    <article className="gate-card">
      <span>{label}</span>
      <b>{actual}</b>
      <div>
        <small>Target {target}</small>
        <em className={pass ? "pass" : "fail"}>
          {pass ? <Check size={12} /> : <X size={12} />} PASS
        </em>
      </div>
    </article>
  );
}

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [page, setPage] = useState<Page>("inbox");
  const [tickets, setTickets] = useState<Ticket[]>(fallbackTickets);
  const [documents, setDocuments] = useState<Document[]>(fallbackDocuments);
  const [dashboard, setDashboard] = useState<Dashboard>(fallbackDashboard);
  const [selected, setSelected] = useState<Ticket | null>(null);
  useEffect(() => {
    Promise.allSettled([api.tickets(), api.documents(), api.dashboard()]).then(
      ([t, d, a]) => {
        if (t.status === "fulfilled") setTickets(t.value);
        if (d.status === "fulfilled") setDocuments(d.value);
        if (a.status === "fulfilled") setDashboard(a.value);
      },
    );
  }, []);
  const roleStart = (value: Role) => {
    setRole(value);
    setPage(value === "lead" ? "dashboard" : "inbox");
  };
  const content = useMemo(() => {
    if (selected)
      return (
        <TicketDetail
          ticket={selected}
          documents={documents}
          onBack={() => setSelected(null)}
        />
      );
    if (page === "dashboard") return <DashboardPage data={dashboard} />;
    if (page === "knowledge") return <KnowledgePage documents={documents} />;
    if (page === "models") return <ModelsPage />;
    return <InboxPage tickets={tickets} onSelect={setSelected} />;
  }, [page, selected, tickets, documents, dashboard]);
  if (!role) return <Landing onContinue={roleStart} />;
  return (
    <Shell
      page={page}
      setPage={(value) => {
        setSelected(null);
        setPage(value);
      }}
      role={role}
    >
      {content}
    </Shell>
  );
}

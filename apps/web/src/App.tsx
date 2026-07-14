import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
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
  Menu,
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
const isStaticShowcase = import.meta.env.MODE === "pages";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const percent = (value: number) => `${Math.round(value * 100)}%`;
const formatTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const minutes = Math.max(0, Math.round((Date.now() - parsed.getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

type ShellPanel =
  | "search"
  | "workspace"
  | "team"
  | "settings"
  | "profile"
  | "help"
  | "notifications";

const ShellActionContext = createContext<(panel: ShellPanel) => void>(() => {});

function Dialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-label={title}
        aria-modal="true"
        className="dialog-card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button aria-label={`Close ${title}`} onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        {children && <div className="dialog-body">{children}</div>}
      </section>
    </div>
  );
}

function ToastMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={17} />
      {message}
    </div>
  );
}

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
          <b>Deterministic baseline · v1.0</b>
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
  const [collapsed, setCollapsed] = useState(false);
  const [panel, setPanel] = useState<ShellPanel | null>(null);
  const [workspace, setWorkspace] = useState("Telco Network Ops");
  const [compactDensity, setCompactDensity] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const nav = [
    { id: "inbox" as Page, icon: Inbox, label: "Agent inbox", badge: "8" },
    { id: "dashboard" as Page, icon: BarChart3, label: "Operations" },
    { id: "knowledge" as Page, icon: BookOpen, label: "Knowledge base" },
    { id: "models" as Page, icon: CircleGauge, label: "Model health" },
  ];
  return (
    <ShellActionContext.Provider value={setPanel}>
    <div className={`shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="side-logo">
          <Logo />
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            <Menu size={18} />
          </button>
        </div>
        <button
          aria-label="Switch workspace"
          className="workspace"
          onClick={() => setPanel("workspace")}
        >
          <span className="workspace-icon">TN</span>
          <div>
            <small>WORKSPACE</small>
            <b>{workspace}</b>
          </div>
          <ChevronDown size={15} />
        </button>
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
          <button onClick={() => setPanel("team")}>
            <Users size={18} /> <span>Team members</span>
          </button>
          <button onClick={() => setPanel("settings")}>
            <Settings size={18} /> <span>Settings</span>
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
        <button
          aria-label="Open profile menu"
          className="profile"
          onClick={() => setPanel("profile")}
        >
          <span>BA</span>
          <div>
            <b>Barış A.</b>
            <small>{role === "lead" ? "Team Lead" : "Support Agent"}</small>
          </div>
          <MoreHorizontal size={18} />
        </button>
      </aside>
      <section className="main-column">{children}</section>
      {panel === "workspace" && (
        <Dialog
          title="Switch workspace"
          description="Choose the synthetic support operation you want to explore."
          onClose={() => setPanel(null)}
        >
          <div className="choice-list">
            {["Telco Network Ops", "Mobile Care Sandbox"].map((item) => (
              <button
                className={workspace === item ? "selected" : ""}
                key={item}
                onClick={() => {
                  setWorkspace(item);
                  setPanel(null);
                }}
              >
                <span>{item === "Telco Network Ops" ? "TN" : "MC"}</span>
                <b>{item}</b>
                {workspace === item && <Check size={16} />}
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {panel === "search" && (
        <Dialog
          title="Search workspace"
          description="Jump to a product area in the interactive showcase."
          onClose={() => setPanel(null)}
        >
          <div className="workspace-search">
            <label>
              <Search size={16} />
              <input
                autoFocus
                placeholder="Search pages..."
                value={globalQuery}
                onChange={(event) => setGlobalQuery(event.target.value)}
              />
            </label>
            <div>
              {nav
                .filter((item) => item.label.toLowerCase().includes(globalQuery.toLowerCase()))
                .map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setPage(id);
                      setGlobalQuery("");
                      setPanel(null);
                    }}
                  >
                    <Icon size={16} /><span>{label}</span><ArrowRight size={14}/>
                  </button>
                ))}
            </div>
          </div>
        </Dialog>
      )}
      {panel === "team" && (
        <Dialog
          title="Team members"
          description="Synthetic staffing view for the portfolio environment."
          onClose={() => setPanel(null)}
        >
          <div className="member-list">
            {["Barış A. · Support Agent", "Deniz A. · Network Specialist", "Ece K. · Billing Specialist"].map((member) => (
              <div key={member}><UserRound size={16} /><span>{member}</span><i>Online</i></div>
            ))}
          </div>
        </Dialog>
      )}
      {panel === "settings" && (
        <Dialog
          title="Workspace settings"
          description="Preferences apply only to this browser session."
          onClose={() => setPanel(null)}
        >
          <label className="setting-row">
            <span><b>Compact density</b><small>Fit more tickets on screen.</small></span>
            <input
              checked={compactDensity}
              onChange={(event) => setCompactDensity(event.target.checked)}
              type="checkbox"
            />
          </label>
          <label className="setting-row">
            <span><b>PII redaction</b><small>Required in the showcase environment.</small></span>
            <input checked disabled type="checkbox" />
          </label>
        </Dialog>
      )}
      {panel === "profile" && (
        <Dialog
          title="Barış A."
          description={role === "lead" ? "Team Lead" : "Support Agent"}
          onClose={() => setPanel(null)}
        >
          <div className="profile-summary">
            <span>BA</span><div><b>Demo profile</b><small>No personal account data is stored.</small></div>
          </div>
        </Dialog>
      )}
      {panel === "help" && (
        <Dialog
          title="Showcase guide"
          description="A quick path through the strongest product flows."
          onClose={() => setPanel(null)}
        >
          <ol className="guide-list">
            <li>Open a ticket and review its AI classification.</li>
            <li>Inspect grounded sources and similar resolved cases.</li>
            <li>Ask Copilot a question and review cited steps.</li>
            <li>Switch to Operations to inspect incident signals.</li>
          </ol>
        </Dialog>
      )}
      {panel === "notifications" && (
        <Dialog
          title="Notifications"
          description="Two synthetic operational updates."
          onClose={() => setPanel(null)}
        >
          <div className="notification-list">
            <div><AlertTriangle size={16}/><span><b>Capacity signal detected</b><small>İstanbul Anadolu · 2 min ago</small></span></div>
            <div><CheckCircle2 size={16}/><span><b>Knowledge sync completed</b><small>5 documents active · 9 min ago</small></span></div>
          </div>
        </Dialog>
      )}
    </div>
    </ShellActionContext.Provider>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const openPanel = useContext(ShellActionContext);
  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <button
          aria-label="Search workspace"
          className="global-search"
          onClick={() => openPanel("search")}
        >
          <Search size={17} />
          <span>Search anything</span>
          <kbd>⌘ K</kbd>
        </button>
        <button
          aria-label="Open showcase guide"
          className="icon-button"
          onClick={() => openPanel("help")}
        >
          <HelpCircle size={18} />
        </button>
        <button
          aria-label="Open notifications"
          className="icon-button notification"
          onClick={() => openPanel("notifications")}
        >
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
  onCreate,
}: {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
  onCreate: (title: string, text: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [channelFilters, setChannelFilters] = useState<string[]>([]);
  const [minimumConfidence, setMinimumConfidence] = useState(0);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"priority" | "confidence" | "newest">("priority");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState("just now");
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  const matches = (filters: string[], value: string) =>
    filters.length === 0 || filters.includes(value);
  const toggleFilter = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const visible = tickets
    .filter(
      (ticket) =>
        `${ticket.id} ${ticket.title} ${ticket.redacted_text}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        matches(statusFilters, ticket.status) &&
        matches(priorityFilters, ticket.priority) &&
        matches(categoryFilters, ticket.category) &&
        matches(channelFilters, ticket.channel) &&
        ticket.confidence * 100 >= minimumConfidence &&
        (!reviewOnly || ticket.confidence < 0.6),
    )
    .sort((a, b) => {
      if (sortMode === "confidence") return b.confidence - a.confidence;
      if (sortMode === "newest") return Number(b.id.split("-")[1]) - Number(a.id.split("-")[1]);
      return priorityRank[b.priority] - priorityRank[a.priority];
    });
  const notify = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  };
  const clearFilters = () => {
    setQuery("");
    setStatusFilters([]);
    setPriorityFilters([]);
    setCategoryFilters([]);
    setChannelFilters([]);
    setMinimumConfidence(0);
    setReviewOnly(false);
    setSelectedTickets([]);
    notify("Filters cleared");
  };
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated("a few seconds ago");
      notify("Ticket list refreshed");
    }, 450);
  };
  const sortLabels = { priority: "Priority", confidence: "AI confidence", newest: "Newest" };
  const cycleSort = () => setSortMode((current) => current === "priority" ? "confidence" : current === "confidence" ? "newest" : "priority");
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
              <button onClick={clearFilters}>Clear all</button>
            </div>
            <FilterGroup
              label="STATUS"
              items={["New", "In progress", "Waiting", "Resolved"]}
              values={["new", "in_progress", "waiting", "resolved"]}
              counts={[3, 2, 1, 2]}
              selected={statusFilters}
              onSelect={(value) => toggleFilter(value, setStatusFilters)}
            />
            <FilterGroup
              label="PRIORITY"
              items={["Critical", "High", "Medium", "Low"]}
              counts={[1, 2, 2, 3]}
              selected={priorityFilters}
              onSelect={(value) => toggleFilter(value, setPriorityFilters)}
            />
            <FilterGroup
              label="CATEGORY"
              items={["Fixed internet", "Mobile", "Billing", "Account"]}
              values={["fixed_internet", "mobile", "billing", "account"]}
              counts={[3, 2, 2, 1]}
              selected={categoryFilters}
              onSelect={(value) => toggleFilter(value, setCategoryFilters)}
            />
            <FilterGroup
              label="CHANNEL"
              items={["Chat", "E-mail", "Call", "Mobile app"]}
              values={["chat", "email", "call", "mobile_app"]}
              counts={[4, 2, 1, 1]}
              selected={channelFilters}
              onSelect={(value) => toggleFilter(value, setChannelFilters)}
            />
            <div className="confidence-filter">
              <div>
                <span>MODEL CONFIDENCE</span>
                <b>{minimumConfidence === 0 ? "All scores" : `${minimumConfidence}%+`}</b>
              </div>
              <input
                aria-label="Minimum model confidence"
                type="range"
                min="0"
                max="100"
                step="10"
                value={minimumConfidence}
                onChange={(event) => setMinimumConfidence(Number(event.target.value))}
              />
              <label>
                <input
                  checked={reviewOnly}
                  onChange={(event) => setReviewOnly(event.target.checked)}
                  type="checkbox"
                /> Needs AI review only
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
              <button className="outline-button" onClick={refresh} disabled={refreshing}>
                <RefreshCw className={refreshing ? "spin" : ""} size={16} /> Refresh
              </button>
              <button className="primary-button" onClick={() => setShowNewTicket(true)}>
                <Plus size={17} /> New ticket
              </button>
            </div>
            <div className="list-meta">
              <span>
                <b>{visible.length}</b> tickets
              </span>
              <span>
                Last updated {lastUpdated} ·{" "}
                <button aria-label="Change ticket sort" onClick={cycleSort}>
                  Sort: {sortLabels[sortMode]} <ChevronDown size={14} />
                </button>
              </span>
            </div>
            <div className="ticket-table">
              <div className="table-head">
                <span className="check-cell">
                  <input
                    aria-label="Select all visible tickets"
                    checked={visible.length > 0 && visible.every((ticket) => selectedTickets.includes(ticket.id))}
                    onChange={(event) => setSelectedTickets(event.target.checked ? visible.map((ticket) => ticket.id) : [])}
                    type="checkbox"
                  />
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
                    <input
                      aria-label={`Select ${ticket.id}`}
                      checked={selectedTickets.includes(ticket.id)}
                      onChange={(event) => setSelectedTickets((current) => event.target.checked ? [...current, ticket.id] : current.filter((id) => id !== ticket.id))}
                      type="checkbox"
                    />
                  </span>
                  <span className="ticket-main">
                    <b>
                      {ticket.id} <small>· {formatTimestamp(ticket.created_at)}</small>
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
                <button className="current" onClick={() => notify("You are on page 1")}>1</button>
                <button disabled>2</button>
                <button disabled>3</button>
                <button disabled>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      {showNewTicket && (
        <Dialog
          title="Create synthetic ticket"
          description="Adds a temporary ticket to this browser session."
          onClose={() => setShowNewTicket(false)}
        >
          <form
            className="dialog-form"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await onCreate(newTitle.trim(), newText.trim());
                setNewTitle("");
                setNewText("");
                setShowNewTicket(false);
                notify("Synthetic ticket created");
              } catch {
                notify("Ticket could not be created");
              }
            }}
          >
            <label>Title<input required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} /></label>
            <label>Customer message<textarea required value={newText} onChange={(event) => setNewText(event.target.value)} /></label>
            <button className="primary-button" type="submit"><Plus size={16}/> Create ticket</button>
          </form>
        </Dialog>
      )}
      <ToastMessage message={notice} />
    </>
  );
}

function FilterGroup({
  label,
  items,
  values,
  counts,
  selected = [],
  onSelect,
}: {
  label: string;
  items: string[];
  values?: string[];
  counts: number[];
  selected?: string[];
  onSelect?: (v: string) => void;
}) {
  return (
    <div className="filter-group">
      <span>{label}</span>
      {items.map((item, i) => {
        const value = values?.[i] ?? item.toLowerCase();
        return (
        <label key={item}>
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => onSelect?.(value)}
          />
          <em>{item}</em>
          <small>{counts[i]}</small>
        </label>
        );
      })}
    </div>
  );
}

type DetailTab = "sources" | "cases" | "copilot";
function TicketDetail({
  ticket,
  documents,
  onBack,
  onUpdate,
}: {
  ticket: Ticket;
  documents: Document[];
  onBack: () => void;
  onUpdate: (ticket: Ticket) => void;
}) {
  const [tab, setTab] = useState<DetailTab>("sources");
  const [question, setQuestion] = useState(
    "Bu problemi doğrulamak için hangi kontrolleri yapmalıyım?",
  );
  const [answer, setAnswer] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [reply, setReply] = useState("");
  const [conversation, setConversation] = useState(ticket.messages);
  const [assignee, setAssignee] = useState(ticket.assigned_to);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const sources = documents
    .filter(
      (d) =>
        d.status === "active" &&
        (d.product === ticket.category || ticket.category === "other"),
    )
    .slice(0, 3);
  const fallbackAnswer = {
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
  };
  const ask = async () => {
    setLoading(true);
    try {
      setAnswer(
        isStaticShowcase
          ? fallbackAnswer
          : await api.copilot(ticket.id, question),
      );
    } catch {
      setAnswer(fallbackAnswer);
    } finally {
      setLoading(false);
    }
  };
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };
  const assignToMe = async () => {
    try {
      const updated = isStaticShowcase
        ? { ...ticket, assigned_to: "Barış A." }
        : await api.updateTicket(ticket.id, { assigned_to: "Barış A." });
      setAssignee(updated.assigned_to);
      onUpdate(updated);
      notify("Ticket assigned to you");
    } catch {
      notify("Ticket assignment failed");
    }
  };
  const sendReply = async () => {
    const body = reply.trim();
    if (!body) return;
    try {
      if (isStaticShowcase) {
        const messages = [
          ...conversation,
          { author: "agent" as const, body, created_at: new Date().toISOString() },
        ];
        const updated = { ...ticket, messages, status: "in_progress" as const };
        setConversation(messages);
        setTicketStatus(updated.status);
        onUpdate(updated);
      } else {
        const updated = await api.addMessage(ticket.id, body);
        setConversation(updated.messages);
        setTicketStatus(updated.status);
        onUpdate(updated);
      }
      setReply("");
      notify("Reply saved to the conversation");
    } catch {
      notify("Reply could not be saved");
    }
  };
  const submitFeedback = async (rating: "accepted" | "edited" | "rejected") => {
    try {
      if (!isStaticShowcase) {
        await api.feedback({ target_type: "classification", target_id: ticket.id, rating });
      }
      notify(rating === "accepted" ? "Classification confirmed" : "Classification feedback saved");
    } catch {
      notify("Feedback could not be saved");
    }
  };
  const resolveTicket = async () => {
    try {
      const updated = isStaticShowcase
        ? { ...ticket, status: "resolved" as const, resolution: { resolution: "resolved" } }
        : await api.resolve(ticket.id);
      setTicketStatus("resolved");
      setResolveOpen(false);
      onUpdate(updated);
      notify("Ticket marked as resolved");
    } catch {
      notify("Ticket could not be resolved");
    }
  };
  return (
    <div className="detail-page">
      <div className="detail-top">
        <button aria-label="Back to inbox" className="back-button" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="detail-title">
            <h2>{ticket.id}</h2>
            <Status value={ticketStatus} />
            <Priority value={ticket.priority} />
          </div>
          <p>{ticket.title}</p>
        </div>
        <div className="detail-actions">
          <button
            className="outline-button"
            onClick={assignToMe}
          >
            <UserRound size={16} /> {assignee ?? "Assign to me"}
          </button>
          <button
            aria-label="More ticket actions"
            className="outline-button"
            onClick={() => notify("Ticket actions are ready")}
          >
            <MoreHorizontal size={18} />
          </button>
          <button
            className="resolve-button"
            onClick={() => setResolveOpen(true)}
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
            <button
              aria-label="Customer context actions"
              onClick={() => notify("Customer context copied")}
            >
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
            <button onClick={() => setHistoryOpen(true)}>
              View customer history <ChevronRight size={15} />
            </button>
          </div>
          <div className="timeline-label">
            <span>Today</span>
          </div>
          <div className="messages">
            {conversation.length ? (
              conversation.map((message, index) => (
                <div className={`message ${message.author}`} key={index}>
                  <div className="message-meta">
                    <b>
                      {message.author === "customer"
                        ? ticket.customer_id
                        : "You"}
                    </b>
                    <small>{formatTimestamp(message.created_at)}</small>
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
            <textarea
              placeholder="Write a response..."
              value={reply}
              onChange={(event) => setReply(event.target.value)}
            />
            <div>
              <span>
                <button
                  aria-label="Attach file"
                  onClick={() => notify("Attachment picker opened in demo mode")}
                >
                  <Paperclip size={17} />
                </button>
                <button
                  onClick={() => {
                    setReply(
                      "Merhaba, bağlantı kalitesini doğrulamak için Wi-Fi ve Ethernet hız sonuçlarını karşılaştıracağız. Ardından hat ve bölgesel kapasite kontrollerini tamamlayıp sizi bilgilendireceğiz.",
                    );
                    notify("Grounded draft generated");
                  }}
                >
                  <WandSparkles size={17} /> Generate draft
                </button>
              </span>
              <button
                className="send-button"
                disabled={!reply.trim()}
                onClick={sendReply}
              >
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
            <button
              className="text-action"
              onClick={() => notify("Summary copied")}
            >
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
                onClick={() => submitFeedback("accepted")}
              >
                <Check size={15} /> Confirm
              </button>
              <button onClick={() => submitFeedback("edited")}>
                Change
              </button>
              <button
                onClick={() => submitFeedback("rejected")}
              >
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
              <button aria-label="Insert suggested follow-up" onClick={() => notify("Question inserted into response")}>
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
      {historyOpen && (
        <Dialog
          title="Customer history"
          description={`${ticket.customer_id} · Synthetic account timeline`}
          onClose={() => setHistoryOpen(false)}
        >
          <div className="history-list">
            <div><b>12 Jun 2026</b><span>Wi-Fi coverage guidance · Resolved</span></div>
            <div><b>03 Mar 2026</b><span>Billing address update · Resolved</span></div>
            <div><b>18 Nov 2025</b><span>Fiber installation follow-up · Resolved</span></div>
          </div>
        </Dialog>
      )}
      {resolveOpen && (
        <Dialog
          title="Resolve ticket"
          description="Confirm the synthetic resolution outcome."
          onClose={() => setResolveOpen(false)}
        >
          <div className="resolution-confirm">
            <p>All recommended checks are complete and the customer has been informed.</p>
            <button
              className="resolve-button"
              onClick={resolveTicket}
            >
              <CheckCircle2 size={16} /> Confirm resolution
            </button>
          </div>
        </Dialog>
      )}
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
  const [selectedSource, setSelectedSource] = useState<Document | null>(null);
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
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedSource(source);
                }}
              >
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
      {selectedSource && (
        <Dialog
          title={selectedSource.title}
          description={`${selectedSource.id} · v${selectedSource.version} · Page ${selectedSource.page}`}
          onClose={() => setSelectedSource(null)}
        >
          <div className="document-preview">
            <span>{selectedSource.section}</span>
            <p>{selectedSource.content}</p>
            <small>Synthetic approved knowledge document</small>
          </div>
        </Dialog>
      )}
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
          <p>Lexical relevance · filtered to last 12 months.</p>
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
              <button
                aria-label="Report answer"
                onClick={() => notify("Answer reported for review")}
              >
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
  const [period, setPeriod] = useState<"Today" | "7 days" | "30 days">("Today");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [chartCategory, setChartCategory] = useState<"all" | "fixed_internet" | "mobile" | "billing">("all");
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const notify = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  };
  const categoryLabels = {
    all: "All categories",
    fixed_internet: "Fixed internet",
    mobile: "Mobile",
    billing: "Billing",
  };
  const cycleCategory = () => setChartCategory((current) => current === "all" ? "fixed_internet" : current === "fixed_internet" ? "mobile" : current === "mobile" ? "billing" : "all");
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
            {(["Today", "7 days", "30 days"] as const).map((item) => (
              <button
                className={period === item ? "active" : ""}
                key={item}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
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
          <button onClick={() => setIncidentOpen((value) => !value)}>
            {incidentOpen ? "Close details" : "Investigate"} <ArrowRight size={16} />
          </button>
        </section>
        {incidentOpen && (
          <section className="incident-detail-panel">
            <div><b>Signal confidence</b><span>{titleCase(data.incident.confidence)}</span></div>
            <div><b>Recommended owner</b><span>Network Operations</span></div>
            <div><b>Next action</b><span>Compare regional alarms with ticket intake.</span></div>
            <button className="primary-button" onClick={() => notify("Incident review assigned to Network Operations")}>Assign investigation</button>
          </section>
        )}
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
              <button onClick={cycleCategory}>
                {categoryLabels[chartCategory]} <ChevronDown size={15} />
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
                {(chartCategory === "all" || chartCategory === "fixed_internet") && <Area
                  type="monotone"
                  dataKey="fixed_internet"
                  stroke="#20a978"
                  strokeWidth={2.5}
                  fill="url(#mintFill)"
                />}
                {(chartCategory === "all" || chartCategory === "mobile") && <Area
                  type="monotone"
                  dataKey="mobile"
                  stroke="#ef765f"
                  strokeWidth={2.5}
                  fill="none"
                />}
                {(chartCategory === "all" || chartCategory === "billing") && <Area
                  type="monotone"
                  dataKey="billing"
                  stroke="#5b85d6"
                  strokeWidth={2.5}
                  fill="none"
                />}
              </AreaChart>
            </ResponsiveContainer>
          </article>
          <article className="chart-card category-chart">
            <header>
              <div>
                <h3>Category distribution</h3>
                <p>Share of today's volume</p>
              </div>
              <button aria-label="Category chart options" onClick={() => notify("Category chart exported for review") }>
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
              <button onClick={() => setRegionsOpen(true)}>
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
        {regionsOpen && (
          <Dialog
            title="Regional pressure"
            description={`Full synthetic region list · ${period}`}
            onClose={() => setRegionsOpen(false)}
          >
            <div className="region-dialog-list">
              {data.regions.map((region) => (
                <div key={region.name}><b>{region.name}</b><span>{region.tickets} open tickets</span><i className={`severity ${region.severity}`}>{titleCase(region.severity)}</i></div>
              ))}
            </div>
          </Dialog>
        )}
        <ToastMessage message={notice} />
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

function KnowledgePage({
  documents,
  onUpload,
}: {
  documents: Document[];
  onUpload: (title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [gapsOpen, setGapsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const notify = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  };
  const visible = documents.filter(
    (document) =>
      document.title.toLowerCase().includes(query.toLowerCase()) &&
      (statusFilter === "all" || document.status === statusFilter),
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
          <button
            className="outline-button"
            onClick={() => setStatusFilter((current) => current === "all" ? "active" : "all")}
          >
            <Filter size={16} /> {statusFilter === "all" ? "All documents" : "Active only"}
          </button>
          <button className="primary-button" onClick={() => setUploadOpen(true)}>
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
              <button
                aria-label={`Open actions for ${doc.title}`}
                onClick={() => setSelectedDocument(doc)}
              >
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
              <button onClick={() => setGapsOpen(true)}>
                Review gaps <ArrowRight size={14} />
              </button>
            </div>
          </article>
        </div>
        {uploadOpen && (
          <Dialog
            title="Upload synthetic document"
            description="Creates an indexed demo document for this browser session."
            onClose={() => setUploadOpen(false)}
          >
            <form
              className="dialog-form"
              onSubmit={(event) => {
                event.preventDefault();
                onUpload(uploadTitle.trim());
                setUploadTitle("");
                setUploadOpen(false);
                notify("Synthetic document indexed");
              }}
            >
              <label>Document title<input required value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} /></label>
              <label>Product<select defaultValue="fixed_internet"><option value="fixed_internet">Fixed internet</option><option value="mobile">Mobile</option><option value="billing">Billing</option></select></label>
              <button className="primary-button" type="submit"><Upload size={16}/> Upload and index</button>
            </form>
          </Dialog>
        )}
        {selectedDocument && (
          <Dialog
            title={selectedDocument.title}
            description={`${selectedDocument.id} · v${selectedDocument.version}`}
            onClose={() => setSelectedDocument(null)}
          >
            <div className="document-preview"><span>{selectedDocument.section}</span><p>{selectedDocument.content}</p><small>{selectedDocument.chunk_count} indexed chunks · {selectedDocument.usage_count} answer uses</small></div>
          </Dialog>
        )}
        {gapsOpen && (
          <Dialog
            title="Unanswered knowledge gaps"
            description="Synthetic low-evidence questions from the last 7 days."
            onClose={() => setGapsOpen(false)}
          >
            <div className="history-list"><div><b>7 requests</b><span>IPv6 prefix delegation</span></div><div><b>5 requests</b><span>eSIM transfer between devices</span></div><div><b>3 requests</b><span>CGNAT opt-out eligibility</span></div></div>
          </Dialog>
        )}
        <ToastMessage message={notice} />
      </div>
    </>
  );
}

function ModelsPage() {
  return (
    <>
      <Header
        title="Model health"
        subtitle="Offline candidate metrics and synthetic regression gates."
      />
      <div className="page models-page">
        <div className="model-hero">
          <div>
            <span className="model-live">
              <span className="pulse" /> OFFLINE CANDIDATE
            </span>
            <h3>TF-IDF + Logistic Regression</h3>
            <p>CPU-oriented classifier evaluated separately from the demo runtime</p>
            <div>
              <span>
                Version <b>1.0.0</b>
              </span>
              <span>
                Dataset <b>v1.0.0</b>
              </span>
              <span>
                Mean latency <b>0.21 ms</b>
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
            actual="1.00"
            target="≥ 0.90"
            pass
          />
          <MetricGate
            label="PII detection recall"
            actual="1.00"
            target="≥ 0.95"
            pass
          />
          <MetricGate
            label="Retrieval Recall@5"
            actual="1.00"
            target="≥ 0.85"
            pass
          />
          <MetricGate
            label="Retrieval MRR"
            actual="1.00"
            target="≥ 0.75"
            pass
          />
          <MetricGate
            label="Unsupported claim rate"
            actual="0.00"
            target="≤ 0.05"
            pass
          />
        </div>
        <div className="model-grid">
          <article className="chart-card">
            <header>
              <div>
                <h3>Language performance</h3>
                <p>Evaluation dataset v1.0 · 600 held-out records · group split</p>
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
                <CheckCircle2 size={16} /> Scenario-template groups kept across split boundaries
              </li>
              <li>
                <CheckCircle2 size={16} /> Dataset and evaluation reports are versioned
              </li>
              <li>
                <CheckCircle2 size={16} /> PII regression gate passed on labeled fixtures
              </li>
              <li>
                <Info size={16} /> Demo API uses the deterministic taxonomy baseline
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
    if (isStaticShowcase) return;
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
  const createTicket = async (title: string, text: string) => {
    if (!isStaticShowcase) {
      const ticket = await api.createTicket({ title, message: text, region: "İstanbul Anadolu", language: "tr" });
      setTickets((current) => [ticket, ...current]);
      return;
    }
    const nextId = Math.max(...tickets.map((ticket) => Number(ticket.id.split("-")[1]))) + 1;
    const ticket: Ticket = {
        id: `TK-${nextId}`,
        customer_id: `CUST-${nextId}`,
        title,
        channel: "chat",
        language: "tr",
        region: "İstanbul Anadolu",
        status: "new",
        assigned_to: null,
        created_at: new Date().toISOString(),
        category: "other",
        subcategory: "unclassified",
        priority: "medium",
        confidence: 0.52,
        summary: text,
        redacted_text: text,
        entities: {},
        decision_signals: ["New synthetic request", "Human review required"],
        messages: [{ author: "customer", body: text, created_at: "Just now" }],
        ai_reviewed: false,
        resolution: null,
      };
    setTickets((current) => [ticket, ...current]);
  };
  const updateTicket = (updated: Ticket) => {
    setTickets((current) => current.map((ticket) => ticket.id === updated.id ? updated : ticket));
    setSelected(updated);
  };
  const uploadDocument = (title: string) => {
    setDocuments((current) => [
      {
        id: `DOC-${String(current.length + 1).padStart(3, "0")}`,
        title,
        section: "Synthetic uploaded guidance",
        page: 1,
        product: "fixed_internet",
        language: "en",
        version: "1.0",
        status: "active",
        effective_date: "15 Jul 2026",
        content: "Synthetic guidance added during the interactive portfolio session.",
        chunk_count: 1,
        usage_count: 0,
        index_status: "indexed",
      },
      ...current,
    ]);
  };
  const content = (() => {
    if (selected)
      return (
        <TicketDetail
          ticket={selected}
          documents={documents}
          onBack={() => setSelected(null)}
          onUpdate={updateTicket}
        />
      );
    if (page === "dashboard") return <DashboardPage data={dashboard} />;
    if (page === "knowledge") return <KnowledgePage documents={documents} onUpload={uploadDocument} />;
    if (page === "models") return <ModelsPage />;
    return <InboxPage tickets={tickets} onSelect={setSelected} onCreate={createTicket} />;
  })();
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

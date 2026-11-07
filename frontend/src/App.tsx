import { useEffect, useRef, useState } from "react";

type Route =
  | "landing"
  | "login"
  | "cases"
  | "new-case"
  | "home"
  | "guide"
  | "task"
  | "match"
  | "vendors"
  | "request"
  | "requests"
  | "quotes"
  | "progress"
  | "docs"
  | "ai";

type Doc = {
  id: number;
  incidentId: string;
  name: string;
  type: string;
  size: string;
  linked: string;
  source: string;
  date: string;
  error?: string;
};

type Incident = {
  id: string;
  name: string;
  business: string;
  date: string;
  address: string;
  status: string;
  updated: string;
  operating: string;
};

/** 새 사건 작성 폼 — localStorage 에 자동 임시저장된다 */
type CaseDraft = {
  step: 1 | 2;
  name: string;
  business: string;
  industry: string;
  address: string;
  date: string;
  time: string;
  operating: string;
  damageTypes: string[];
  insurance: string;
  note: string;
  /** 사용자가 한 번이라도 수정했는지 (임시저장 여부) */
  dirty: boolean;
};

const emptyCaseDraft: CaseDraft = {
  step: 1,
  name: "성곡동 제조공장 화재",
  business: "예시 제조 사업장",
  industry: "금속 가공 제조업",
  address: "경기도 안산시 단원구 (예시 주소)",
  date: "2026-06-07",
  time: "04:20",
  operating: "전면 중단",
  damageTypes: ["건물", "생산설비", "원자재"],
  insurance: "가입",
  note: "생산동 일부와 설비에 그을음 및 열 손상이 확인되었습니다.",
  dirty: false,
};

type Task = {
  id: string;
  step: string;
  title: string;
  description: string;
  due: string;
  docs: string;
};

const tasks: Task[] = [
  {
    id: "first",
    step: "1 · 화재 직후 조치",
    title: "현장 안전과 피해 기록",
    description: "현장 출입을 통제하고 피해 범위를 사진과 문서로 남겨요.",
    due: "오늘 먼저 확인",
    docs: "현장 사진, 화재증명서",
  },
  {
    id: "staff",
    step: "2 · 후속 처리",
    title: "직원 관련 처리",
    description: "부상 및 휴업 여부에 따라 필요한 절차를 확인해요.",
    due: "조건에 따라 확인",
    docs: "휴업 자료, 근로자 증빙",
  },
  {
    id: "restore",
    step: "2 · 후속 처리",
    title: "피해 복구",
    description: "잔해 처리와 설비 복구 범위를 정하고 견적을 받아요.",
    due: "진행 중",
    docs: "피해 사진, 설비 목록, 견적서",
  },
  {
    id: "insurance",
    step: "2 · 후속 처리",
    title: "보험 및 행정 처리",
    description: "보험사 통지와 지원사업 신청 조건을 함께 확인해요.",
    due: "기한 확인 필요",
    docs: "보험증권, 화재증명서",
  },
  {
    id: "restart",
    step: "3 · 재가동 확인",
    title: "공장 재가동 확인",
    description: "설비와 작업장 안전, 필요한 인허가 여부를 점검해요.",
    due: "복구 후 확인",
    docs: "안전 점검 결과",
  },
];

const initialDocs: Doc[] = [
  {
    id: 1,
    incidentId: "case-1",
    name: "화재현장_사진_01.jpg",
    type: "피해 사진",
    size: "2.4 MB · JPG",
    linked: "현장 안전과 피해 기록",
    source: "사건 등록",
    date: "6월 7일",
  },
  {
    id: 2,
    incidentId: "case-1",
    name: "화재증명서_예시.pdf",
    type: "소방·행정",
    size: "846 KB · PDF",
    linked: "현장 안전과 피해 기록",
    source: "업무 안내",
    date: "6월 8일",
  },
  {
    id: 3,
    incidentId: "case-1",
    name: "설비피해_목록.xlsx",
    type: "복구 자료",
    size: "126 KB · XLSX",
    linked: "피해 복구",
    source: "서류함",
    date: "6월 8일",
  },
];

const initialIncidents: Incident[] = [
  {
    id: "case-1",
    name: "성곡동 제조공장 화재",
    business: "예시 제조 사업장",
    date: "2026. 06. 07",
    address: "경기도 안산시 단원구",
    status: "복구 진행 중",
    updated: "오늘",
    operating: "전면 중단",
  },
  {
    id: "case-2",
    name: "원시동 자재창고 화재",
    business: "예시 산업 자재창고",
    date: "2025. 11. 18",
    address: "경기도 안산시 단원구",
    status: "재가동 확인 중",
    updated: "3일 전",
    operating: "일부 가동",
  },
];

const vendors = [
  {
    name: "가온 복구 파트너스",
    category: "화재 청소",
    area: "화재 청소 · 안산/시흥",
    desc: "공장 내부 그을음 세척과 설비 주변 정리",
    available: "6월 12일부터",
  },
  {
    name: "새봄 산업 클린",
    category: "잔해 처리",
    area: "잔해 처리 · 경기 서남부",
    desc: "산업 폐기물 분류와 작업장 정리",
    available: "일정 협의",
  },
  {
    name: "온유 설비 복원",
    category: "설비 복구",
    area: "생산설비 점검 · 수도권",
    desc: "전기·생산설비 상태 점검 및 복원 범위 산정",
    available: "6월 14일부터",
  },
  {
    name: "바른 철거 지원",
    category: "건축물 철거",
    area: "건축물 철거 · 안산/시흥",
    desc: "손상 구역 확인과 철거 범위 산정 상담",
    available: "현장 확인 후",
  },
  {
    name: "함께 노무 상담소",
    category: "노무 상담",
    area: "노무 상담 · 비대면",
    desc: "휴업과 근로자 관련 절차를 확인하는 예시 상담",
    available: "6월 11일부터",
  },
  {
    name: "이음 법률 상담",
    category: "법률 상담",
    area: "법률 상담 · 경기",
    desc: "보험 및 계약 쟁점을 확인하는 예시 전문가 상담",
    available: "예약 가능",
  },
];

/** 데모 기준 '1주 이내' 시작 가능 한도 (6월 14일) */
const WEEK_LIMIT_DAY = 614;

/** "6월 12일부터" → 612, "예약 가능" → 0(바로 가능), 날짜 없는 협의 항목 → Infinity */
function availableDay(available: string) {
  if (available.includes("예약 가능")) return 0;
  const match = available.match(/(\d+)월\s*(\d+)일/);
  return match ? Number(match[1]) * 100 + Number(match[2]) : Number.POSITIVE_INFINITY;
}

/** 업체 활동 지역이 필터 지역에 해당하는지. 비대면 상담은 모든 지역에 포함한다. */
function vendorInRegion(area: string, region: string) {
  if (area.includes("비대면")) return true;
  if (region === "안산시") return area.includes("안산");
  if (region === "시흥시") return area.includes("시흥");
  if (region === "경기 서남부") return /안산|시흥|경기/.test(area);
  return false;
}

const navRoutes:{ route: Route; label: string; icon: string }[] = [
  { route: "cases", label: "사건 목록", icon: "cases" },
  { route: "docs", label: "서류함", icon: "folder" },
  { route: "home", label: "홈", icon: "home" },
  { route: "guide", label: "복구 안내", icon: "check" },
  { route: "match", label: "업체 찾기", icon: "search" },
];

function Icon({
  name,
  size = 22,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    check: (
      <>
        <path d="M5 3h14v18H5z" />
        <path d="m8 8 1.5 1.5L12 7M14 8h3M8 14l1.5 1.5L12 13M14 14h3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    folder: <path d="M3 6h7l2 2h9v11H3z" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h5" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m4 17 5-5 4 4 2-2 5 4" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M8 8l4-4 4 4" />
        <path d="M4 15v5h16v-5" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    flame: (
      <path d="M13 2s1 4-2 7c-2-2-3-3-3-5-4 4-5 8-3 12a8 8 0 0 0 14-1c1-5-2-9-6-13Zm-1 11c2 2 2 4 0 6-3-1-4-4-2-7l2 1Z" />
    ),
    tool: (
      <>
        <path d="M14 6a4 4 0 0 0-5-4l2 3-3 3-3-2a4 4 0 0 0 5 5l8 8 3-3-8-8a4 4 0 0 0 1-2Z" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 5c3 0 4 2 4 4s-1 3-3 3M17 14c3 0 4 2 4 5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7h16v14H4zM3 3h18v4H3z" />
        <path d="M9 11h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    camera: (
      <>
        <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    compare: (
      <>
        <path d="M8 3v18M16 3v18M4 7l4-4 4 4M12 17l4 4 4-4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2 21h20L12 3Z" />
        <path d="M12 9v5M12 18h.01" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    cases: (
      <>
        <path d="M5 5h14v5H5zM5 14h14v5H5z" />
        <path d="M8 7.5h.01M8 16.5h.01M11 7.5h5M11 16.5h5" />
      </>
    ),
    down: <path d="m6 9 6 6 6-6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.info}
    </svg>
  );
}

function StatusBar() {
  return (
    <div className="status-bar">
      <time>9:41</time>
      <div className="status-icons">
        <svg className="cellular-icon" viewBox="0 0 18 12" aria-hidden="true">
          <rect x="1" y="8" width="3" height="3" rx="1" />
          <rect x="5.5" y="6" width="3" height="5" rx="1" />
          <rect x="10" y="3.5" width="3" height="7.5" rx="1" />
          <rect x="14.5" y="1" width="3" height="10" rx="1" />
        </svg>
        <svg className="wifi-icon" viewBox="0 0 18 13" aria-hidden="true">
          <path d="M1.5 4.2C5.7.7 12.3.7 16.5 4.2" />
          <path d="M4.2 7c2.7-2.2 6.9-2.2 9.6 0" />
          <path d="M7 9.7c1.1-.9 2.9-.9 4 0" />
          <circle cx="9" cy="11.2" r=".9" fill="currentColor" stroke="none" />
        </svg>
        <span className="battery" aria-label="배터리 82%">
          <i />
        </span>
      </div>
    </div>
  );
}

function AppHeader({
  caseName,
  onCases,
  onNotify,
}: {
  caseName: string;
  onCases: () => void;
  onNotify: () => void;
}) {
  return (
    <header className="app-header">
      <button className="case-chip" onClick={onCases}>
        <span>{caseName}</span> <Icon name="down" size={14} />
      </button>
      <div className="header-actions">
        <button className="icon-button notification" aria-label="알림" onClick={onNotify}>
          <Icon name="bell" size={21} />
          <span>2</span>
        </button>
        <button className="icon-button" aria-label="메뉴" onClick={onCases}>
          <Icon name="menu" size={22} />
        </button>
      </div>
    </header>
  );
}

function DetailHeader({
  title,
  back,
  action,
}: {
  title: string;
  back: () => void;
  action?: React.ReactNode;
}) {
  return (
    <header className="detail-header">
      <button className="icon-button" aria-label="뒤로" onClick={back}>
        <Icon name="back" />
      </button>
      <strong>{title}</strong>
      <div className="header-slot">{action}</div>
    </header>
  );
}

function BottomNav({ route, go }: { route: Route; go: (route: Route) => void }) {
  return (
    <nav className="bottom-nav">
      {navRoutes.map((item) => (
        <button
          key={item.route}
          className={
            route === item.route || (route === "new-case" && item.route === "cases")
              ? "active"
              : ""
          }
          onClick={() => go(item.route)}
        >
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "gray" | "danger";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function FileCard({
  doc,
  selected,
  onSelect,
  onRemove,
}: {
  doc: Doc;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}) {
  return (
    <button
      className={`file-card ${doc.error ? "has-error" : ""} ${selected ? "selected" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span className="file-icon">
        <Icon name={doc.type.includes("사진") ? "image" : "file"} size={20} />
      </span>
      <span className="file-copy">
        <strong>{doc.name}</strong>
        <small>{doc.size}</small>
        {doc.error && (
          <em>
            <Icon name="alert" size={12} /> {doc.error}
          </em>
        )}
      </span>
      {onRemove ? (
        <span
          className="file-remove"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Icon name="close" size={17} />
        </span>
      ) : selected ? (
        <span className="selected-check">✓</span>
      ) : (
        <span className="file-status">저장됨</span>
      )}
    </button>
  );
}

function App() {
  const [route, setRoute] = useState<Route>("landing");
  const [history, setHistory] = useState<Route[]>([]);
  const [taskId, setTaskId] = useState("first");
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const saved = localStorage.getItem("restart-incidents");
      return saved ? JSON.parse(saved) : initialIncidents;
    } catch {
      return initialIncidents;
    }
  });
  const [selectedIncidentId, setSelectedIncidentId] = useState(() => {
    return localStorage.getItem("restart-selected-incident") || "case-1";
  });
  const [docs, setDocs] = useState<Doc[]>(() => {
    try {
      const saved = localStorage.getItem("restart-docs");
      const parsed = saved ? JSON.parse(saved) : initialDocs;
      return parsed.map((doc: Doc) => ({ ...doc, incidentId: doc.incidentId || "case-1" }));
    } catch {
      return initialDocs;
    }
  });
  const [completedByIncident, setCompletedByIncident] = useState<Record<string, string[]>>(() => {
    try {
      const savedByIncident = localStorage.getItem("restart-completed-by-incident");
      if (savedByIncident) return JSON.parse(savedByIncident);
      const legacy = JSON.parse(localStorage.getItem("restart-completed") || '["staff"]');
      return { "case-1": legacy, "case-2": ["first", "staff", "insurance"] };
    } catch {
      return { "case-1": ["staff"], "case-2": ["first", "staff", "insurance"] };
    }
  });
  const [quoteCounts, setQuoteCounts] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("restart-quotes-by-incident") || '{"case-1":2,"case-2":1}',
      );
    } catch {
      return { "case-1": 2, "case-2": 1 };
    }
  });
  const [sheet, setSheet] = useState<"cases" | "upload" | "reuse" | "filter" | null>(null);
  const [pendingIncidentId, setPendingIncidentId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [guideFilter, setGuideFilter] = useState("전체");
  const [docFilter, setDocFilter] = useState("전체");
  const [docsIncidentView, setDocsIncidentView] = useState(false);
  const [query, setQuery] = useState("");
  const [vendorQuery, setVendorQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("화재 청소");
  const [vendorEntry, setVendorEntry] = useState<"list" | "search" | "category">("list");
  const [matchAction, setMatchAction] = useState<"list" | "request" | "status">("list");
  const [selectedVendor, setSelectedVendor] = useState(vendors[0].name);
  const [requestDocs, setRequestDocs] = useState<number[]>([1]);
  const [quoteChoice, setQuoteChoice] = useState("");
  const [caseDraft, setCaseDraft] = useState<CaseDraft>(() => {
    try {
      const saved = localStorage.getItem("restart-case-draft");
      return saved ? { ...emptyCaseDraft, ...JSON.parse(saved) } : emptyCaseDraft;
    } catch {
      return emptyCaseDraft;
    }
  });
  const updateDraft = (patch: Partial<CaseDraft>) =>
    setCaseDraft((previous) => ({ ...previous, ...patch, dirty: true }));
  // 업체 목록 필터 — 아무것도 선택하지 않으면 전체를 보여준다
  const [filterRegions, setFilterRegions] = useState<string[]>([]);
  const [filterTiming, setFilterTiming] = useState("");
  const [sortFast, setSortFast] = useState(false);
  const [categoryOnly, setCategoryOnly] = useState(true);
  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedIncident =
    incidents.find((incident) => incident.id === selectedIncidentId) || incidents[0];
  const currentIncidentId = selectedIncident?.id || "";
  const currentCaseName = selectedIncident?.name || "등록된 사건 없음";
  const completed = completedByIncident[currentIncidentId] || [];
  const currentDocs = docs.filter((doc) => doc.incidentId === currentIncidentId);
  const setCompleted = (updater: (previous: string[]) => string[]) => {
    if (!currentIncidentId) return;
    setCompletedByIncident((previous) => ({
      ...previous,
      [currentIncidentId]: updater(previous[currentIncidentId] || []),
    }));
  };

  useEffect(() => {
    localStorage.setItem("restart-docs", JSON.stringify(docs));
  }, [docs]);
  useEffect(() => {
    localStorage.setItem("restart-incidents", JSON.stringify(incidents));
  }, [incidents]);
  useEffect(() => {
    localStorage.setItem("restart-completed-by-incident", JSON.stringify(completedByIncident));
  }, [completedByIncident]);
  useEffect(() => {
    localStorage.setItem("restart-quotes-by-incident", JSON.stringify(quoteCounts));
  }, [quoteCounts]);
  // 새 사건 작성 내용은 입력할 때마다 자동 임시저장한다
  useEffect(() => {
    if (caseDraft.dirty) {
      localStorage.setItem("restart-case-draft", JSON.stringify(caseDraft));
    } else {
      localStorage.removeItem("restart-case-draft");
    }
  }, [caseDraft]);
  useEffect(() => {
    if (currentIncidentId) {
      localStorage.setItem("restart-selected-incident", currentIncidentId);
    }
    setRequestDocs([]);
    setQuoteChoice("");
  }, [currentIncidentId]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  /** 새 사건 작성 중에 다른 화면으로 나가면 임시저장됐다고 알려준다 */
  const leavingDraft = (next: Route) =>
    route === "new-case" && next !== "new-case" && caseDraft.dirty;
  const go = (next: Route) => {
    if (next === "docs") {
      setDocsIncidentView(false);
      setQuery("");
      setDocFilter("전체");
    }
    if (leavingDraft(next)) {
      notify("작성 중인 사건을 임시저장했어요");
    } else if (next === "new-case" && route !== "new-case" && caseDraft.dirty) {
      notify("임시저장된 내용을 불러왔어요");
    }
    setHistory((prev) => [...prev.slice(-9), route]);
    setRoute(next);
    setSheet(null);
    window.scrollTo(0, 0);
  };
  const back = () => {
    const previous = history.at(-1) || "home";
    if (leavingDraft(previous)) notify("작성 중인 사건을 임시저장했어요");
    setHistory((prev) => prev.slice(0, -1));
    setRoute(previous);
    setSheet(null);
  };
  const applyIncident = (incidentId: string) => {
    const savedDraft = leavingDraft("home");
    setSelectedIncidentId(incidentId);
    setSheet(null);
    setPendingIncidentId(null);
    setRoute("home");
    setHistory((previous) => [...previous.slice(-9), route]);
    window.scrollTo(0, 0);
    const nextIncident = incidents.find((incident) => incident.id === incidentId);
    notify(
      `${nextIncident?.name || "사건"}으로 전환했어요${savedDraft ? " · 작성 중인 내용은 임시저장됨" : ""}`,
    );
  };
  const switchIncident = (incidentId: string) => {
    if (incidentId === currentIncidentId) {
      setSheet(null);
      if (route === "cases") go("home");
      return;
    }
    if (route === "request") {
      setPendingIncidentId(incidentId);
      return;
    }
    applyIncident(incidentId);
  };
  const navigateFromNav = (next: Route) => {
    if (!selectedIncident && !["home", "cases"].includes(next)) {
      notify("먼저 화재 사건을 등록해 주세요");
      go("home");
      return;
    }
    go(next);
  };
  const selectTask = (id: string) => {
    setTaskId(id);
    go("task");
  };
  const activeTask = tasks.find((task) => task.id === taskId) || tasks[0];
  const completion = completed.length;

  const addDoc = (name: string, error?: string) => {
    const extension = name.split(".").pop()?.toUpperCase() || "PDF";
    const newDoc: Doc = {
      id: Date.now(),
      incidentId: route === "new-case" ? "draft" : currentIncidentId,
      name,
      type: extension === "JPG" || extension === "PNG" ? "피해 사진" : "소방·행정",
      size: error ? "3.1 MB · PDF" : `1.${Math.floor(Math.random() * 8) + 1} MB · ${extension}`,
      linked: route === "task" ? activeTask.title : "연결된 업무 없음",
      source: route === "docs" ? "서류함" : "업무 안내",
      date: "오늘",
      error,
    };
    setDocs((prev) => [newDoc, ...prev]);
    setSheet(null);
    notify(error ? "파일을 확인해 주세요" : "사건 서류함에도 함께 저장했어요");
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const valid = /\.(pdf|jpg|jpeg|png|xlsx)$/i.test(file.name);
    addDoc(
      file.name,
      valid ? undefined : "지원하지 않는 형식이에요. PDF 또는 이미지를 올려주세요.",
    );
    event.target.value = "";
  };

  const toggleComplete = () => {
    setCompleted((prev) =>
      prev.includes(activeTask.id)
        ? prev.filter((id) => id !== activeTask.id)
        : [...prev, activeTask.id],
    );
    notify(
      completed.includes(activeTask.id) ? "진행 중으로 변경했어요" : "완료한 업무에 반영했어요",
    );
  };

  const filteredDocs = currentDocs.filter((doc) => {
    const category =
      docFilter === "전체" || doc.type.includes(docFilter.replace("소방·행정 서류", "소방·행정"));
    const search = doc.name.toLowerCase().includes(query.toLowerCase());
    return category && search;
  });
  const ansanSiheung = ["안산시", "시흥시"];
  const ansanSiheungOn = ansanSiheung.every((region) => filterRegions.includes(region));
  const filtersActive = filterRegions.length > 0 || filterTiming !== "";
  const vendorResults = vendors
    .filter((vendor) => {
      const matchesQuery =
        !vendorQuery ||
        vendor.name.includes(vendorQuery) ||
        vendor.area.includes(vendorQuery) ||
        vendor.category.includes(vendorQuery);
      const matchesCategory =
        vendorEntry !== "category" || !categoryOnly || vendor.category === selectedCategory;
      const matchesRegion =
        filterRegions.length === 0 ||
        filterRegions.some((region) => vendorInRegion(vendor.area, region));
      const day = availableDay(vendor.available);
      const matchesTiming =
        filterTiming === "" ||
        (filterTiming === "1주 이내" ? day <= WEEK_LIMIT_DAY : !Number.isFinite(day) || day > WEEK_LIMIT_DAY);
      return matchesQuery && matchesCategory && matchesRegion && matchesTiming;
    })
    .sort((a, b) => (sortFast ? availableDay(a.available) - availableDay(b.available) : 0));

  const publicRoutes: Route[] = ["landing", "login"];
  const detailRoutes: Route[] = [
    "task",
    "vendors",
    "request",
    "requests",
    "quotes",
    "progress",
    "ai",
  ];
  const showNav = !publicRoutes.includes(route) && !detailRoutes.includes(route);

  return (
    <main className="app-stage">
      <section className="phone-shell">
        <StatusBar />
        <input
          ref={fileInput}
          className="hidden-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.xlsx"
          onChange={onFile}
        />

        {route === "landing" && (
          <div className="landing screen">
            <div className="landing-top">
              <img className="landing-brand-logo" src="/restart-logo-stacked.png" alt="다시가동" />
              <p>
                공장 화재 이후 해야 할 일과
                <br />
                복구 과정을 한곳에서 관리하세요.
              </p>
            </div>
            <div className="landing-art" aria-hidden="true">
              <div className="sun" />
              <div className="factory">
                <span />
                <span />
                <span />
              </div>
              <div className="ground-line" />
            </div>
            <div className="landing-features">
              <span>단계별 복구 안내</span>
              <i />
              <span>업체 견적 비교</span>
              <i />
              <span>사건별 서류 관리</span>
            </div>
            <div className="landing-actions">
              <button className="primary-button" onClick={() => go("login")}>
                시작하기 <Icon name="arrow" size={18} />
              </button>
              <button className="text-button" onClick={() => go("home")}>
                서비스 둘러보기
              </button>
            </div>
          </div>
        )}

        {route === "login" && (
          <div className="screen auth-screen">
            <DetailHeader title="" back={back} />
            <div className="auth-copy">
              <img className="auth-brand-logo" src="/restart-logo-horizontal.png" alt="다시가동" />
              <h1>
                다시, 움직일 준비를
                <br />
                함께 시작해요.
              </h1>
              <p>사건별로 복구 업무와 서류를 안전하게 정리해 보세요.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go("home");
              }}
            >
              <label>
                이메일
                <input
                  type="email"
                  placeholder="name@company.co.kr"
                  defaultValue="demo@restart.kr"
                />
              </label>
              <label>
                비밀번호
                <input type="password" placeholder="비밀번호 입력" defaultValue="demopassword" />
              </label>
              <button className="primary-button" type="submit">
                로그인
              </button>
              <button className="secondary-button" type="button" onClick={() => go("home")}>
                데모 계정으로 들어가기
              </button>
            </form>
            <p className="demo-note">데모에 입력한 정보는 실제 기관이나 업체에 전송되지 않아요.</p>
          </div>
        )}

        {route === "cases" && (
          <div className="screen cases-screen">
            <DetailHeader title="내 화재 사건" back={back} />
            <div className="page-heading split-heading">
              <div>
                <small>사건을 선택해 이어서 관리하세요</small>
                <h1>복구 중인 사건</h1>
              </div>
              <button className="small-add" onClick={() => go("new-case")}>
                <Icon name="plus" size={18} /> 새 사건
              </button>
            </div>
            <div className="incident-list">
              {incidents.map((incident) => {
                const incidentCompletion = completedByIncident[incident.id]?.length || 0;
                const isCurrent = incident.id === currentIncidentId;
                return (
                  <button
                    className={`incident-card ${isCurrent ? "current" : ""}`}
                    onClick={() => switchIncident(incident.id)}
                    key={incident.id}
                  >
                    <div className="incident-card-head">
                      <span className="incident-symbol">
                        <Icon name="flame" />
                      </span>
                      <span className="incident-badges">
                        {isCurrent && <Badge>현재 관리 중</Badge>}
                        <Badge tone="gray">{incident.status}</Badge>
                      </span>
                    </div>
                    <h2>{incident.name}</h2>
                    <p>{incident.business}</p>
                    <div className="case-meta">
                      <span>
                        <Icon name="calendar" size={15} /> {incident.date}
                      </span>
                      <span>{incidentCompletion}/5 완료</span>
                    </div>
                    <div className="progress">
                      <i style={{ width: `${incidentCompletion * 20}%` }} />
                    </div>
                    <div className="card-link">
                      마지막 업데이트 {incident.updated} <Icon name="chevron" size={17} />
                    </div>
                  </button>
                );
              })}
              {incidents.length === 0 && (
                <div className="empty-state">
                  <Icon name="cases" size={34} />
                  <h2>등록된 사건이 없어요</h2>
                  <p>새 화재 사건을 등록하고 복구 관리를 시작해 보세요.</p>
                  <button className="secondary-button" onClick={() => go("new-case")}>
                    새 사건 등록
                  </button>
                </div>
              )}
            </div>
            <div className="privacy-card">
              <Icon name="shield" size={20} />
              <div>
                <strong>이 화면은 가상 데모예요</strong>
                <p>표시된 사업장과 연락처는 실제 정보가 아닙니다.</p>
              </div>
            </div>
          </div>
        )}

        {route === "new-case" && (
          <div className="screen form-screen">
            <DetailHeader
              title="새 화재 사건"
              back={back}
              action={
                <button
                  className="icon-button"
                  aria-label="다른 사건 선택"
                  onClick={() => setSheet("cases")}
                >
                  <Icon name="cases" size={20} />
                </button>
              }
            />
            <div className="form-progress">
              <span className="active">1</span>
              <i className={caseDraft.step === 2 ? "active" : ""} />
              <span className={caseDraft.step === 2 ? "active" : ""}>2</span>
              <div>
                <b>기본 정보</b>
                <b>피해 상황</b>
              </div>
            </div>
            {caseDraft.dirty && <p className="draft-note">입력한 내용은 자동으로 임시저장돼요</p>}
            {caseDraft.step === 1 ? (
              <>
                <div className="page-heading">
                  <small>한 번 입력하면 다른 화면에서 다시 쓸 수 있어요</small>
                  <h1>어떤 사건인가요?</h1>
                </div>
                <div className="form-stack">
                  <label>
                    사건명 *
                    <input
                      value={caseDraft.name}
                      onChange={(e) => updateDraft({ name: e.target.value })}
                    />
                  </label>
                  <label>
                    사업장명 *
                    <input
                      value={caseDraft.business}
                      onChange={(e) => updateDraft({ business: e.target.value })}
                    />
                  </label>
                  <label>
                    업종
                    <select
                      value={caseDraft.industry}
                      onChange={(e) => updateDraft({ industry: e.target.value })}
                    >
                      <option>금속 가공 제조업</option>
                      <option>전자 부품 제조업</option>
                      <option>기타 제조업</option>
                    </select>
                  </label>
                  <label>
                    사업장 주소 *
                    <input
                      value={caseDraft.address}
                      onChange={(e) => updateDraft({ address: e.target.value })}
                    />
                  </label>
                  <div className="two-fields">
                    <label>
                      발생일 *
                      <input
                        type="date"
                        value={caseDraft.date}
                        onChange={(e) => updateDraft({ date: e.target.value })}
                      />
                    </label>
                    <label>
                      시간
                      <input
                        type="time"
                        value={caseDraft.time}
                        onChange={(e) => updateDraft({ time: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
                <div className="sticky-action">
                  <button className="primary-button" onClick={() => updateDraft({ step: 2 })}>
                    피해 상황 입력하기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="page-heading">
                  <small>모르는 항목은 나중에 수정할 수 있어요</small>
                  <h1>피해 상황을 알려주세요</h1>
                </div>
                <div className="form-stack">
                  <fieldset>
                    <legend>공장 가동 상태 *</legend>
                    <div className="choice-row">
                      {["전면 중단", "일부 가동", "정상"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={caseDraft.operating === option}
                          className={`choice ${caseDraft.operating === option ? "active" : ""}`}
                          onClick={() => updateDraft({ operating: option })}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>피해 유형 · 복수 선택</legend>
                    <div className="choice-grid">
                      {["건물", "생산설비", "원자재", "완제품"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={caseDraft.damageTypes.includes(option)}
                          className={`choice ${caseDraft.damageTypes.includes(option) ? "active" : ""}`}
                          onClick={() =>
                            updateDraft({ damageTypes: toggleIn(caseDraft.damageTypes, option) })
                          }
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>화재보험 가입 여부</legend>
                    <div className="choice-row">
                      {["가입", "미가입", "확인 중"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={caseDraft.insurance === option}
                          className={`choice ${caseDraft.insurance === option ? "active" : ""}`}
                          onClick={() => updateDraft({ insurance: option })}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label>
                    피해 내용
                    <textarea
                      value={caseDraft.note}
                      onChange={(e) => updateDraft({ note: e.target.value })}
                    />
                  </label>
                  <button className="upload-field" onClick={() => setSheet("upload")}>
                    <Icon name="camera" />
                    <span>
                      <strong>피해 사진 추가</strong>
                      <small>사진은 사건 서류함에도 저장돼요</small>
                    </span>
                  </button>
                </div>
                <div className="sticky-action">
                  <button
                    className="primary-button"
                    onClick={() => {
                      const newIncident: Incident = {
                        id: `case-${Date.now()}`,
                        name: caseDraft.name.trim() || "새 화재 사건",
                        business: caseDraft.business.trim() || "사업장명 미입력",
                        date: caseDraft.date ? caseDraft.date.replaceAll("-", ". ") : "날짜 미입력",
                        address: caseDraft.address.trim() || "주소 미입력",
                        status: "복구 시작",
                        updated: "방금",
                        operating: caseDraft.operating,
                      };
                      setIncidents((previous) => [...previous, newIncident]);
                      setDocs((previous) =>
                        previous.map((doc) =>
                          doc.incidentId === "draft" ? { ...doc, incidentId: newIncident.id } : doc,
                        ),
                      );
                      setSelectedIncidentId(newIncident.id);
                      setCompletedByIncident((previous) => ({
                        ...previous,
                        [newIncident.id]: [],
                      }));
                      // 생성이 끝나면 임시저장을 비우고, 새 사건의 복구 안내로 바로 이동한다.
                      // 뒤로 가기로 빈 작성 폼에 돌아오지 않도록 history 에 new-case 를 남기지 않는다.
                      setCaseDraft(emptyCaseDraft);
                      setGuideFilter("전체");
                      setSheet(null);
                      setRoute("guide");
                      window.scrollTo(0, 0);
                      notify("새 사건을 만들었어요. 복구 순서를 확인해 보세요");
                    }}
                  >
                    사건 생성
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {route === "home" && (
          <div className="screen app-screen home-screen">
            <AppHeader
              caseName={currentCaseName}
              onCases={() => setSheet("cases")}
              onNotify={() => notify("새 알림 2건: 서류 확인, 견적 도착")}
            />
            <div className="hero-copy">
              <p>{selectedIncident ? "현재 관리 중인 화재 사건" : "복구 관리 시작하기"}</p>
              <h1>
                사장님, 공장 복구는
                <br />
                어디까지 진행됐나요?
              </h1>
              <div className="case-line">
                <button className="case-line-selector" onClick={() => setSheet("cases")}>
                  <span>{currentCaseName}</span>
                  <Icon name="down" size={15} />
                </button>
                <button
                  onClick={() =>
                    selectedIncident
                      ? notify("사건 정보 수정은 데모에서 준비 중이에요")
                      : go("new-case")
                  }
                >
                  {selectedIncident ? "정보 수정" : "사건 등록"}
                </button>
              </div>
            </div>
            {!selectedIncident && (
              <section className="no-incident-card">
                <span className="incident-symbol">
                  <Icon name="flame" />
                </span>
                <h2>아직 등록된 화재 사건이 없어요.</h2>
                <p>화재 사건을 등록하면 필요한 복구 업무와 진행 상황을 확인할 수 있어요.</p>
                <button className="primary-button" onClick={() => go("new-case")}>
                  새 사건 등록하기
                </button>
              </section>
            )}
            {selectedIncident && (
              <>
                <button className="priority-card" onClick={() => selectTask("first")}>
                  <span className="priority-eyebrow">오늘 확인할 일</span>
                  <strong>
                    놓치면 안 되는
                    <br />
                    업무가 3건 있어요
                  </strong>
                  <span className="priority-link">
                    가장 먼저 확인하기 <Icon name="arrow" size={18} />
                  </span>
                  <span className="priority-art">
                    <i />
                    <i />
                    <Icon name="flame" size={32} />
                  </span>
                </button>
                <section className="section">
                  <div className="section-title">
                    <h2>복구 현황</h2>
                    <button onClick={() => go("guide")}>전체 보기</button>
                  </div>
                  <div className="metric-grid">
                    <button onClick={() => go("guide")}>
                      <b>
                        {completion}
                        <small>/5</small>
                      </b>
                      <span>완료한 업무</span>
                      <i style={{ width: `${completion * 20}%` }} />
                    </button>
                    <button onClick={() => go("quotes")}>
                      <b>
                        {quoteCounts[currentIncidentId] || 0}
                        <small>건</small>
                      </b>
                      <span>받은 견적</span>
                      <Icon name="compare" />
                    </button>
                    <button onClick={() => go("docs")}>
                      <b>
                        {currentDocs.length}
                        <small>개</small>
                      </b>
                      <span>보관 서류</span>
                      <Icon name="archive" />
                    </button>
                    <button onClick={() => selectTask("insurance")}>
                      <b>
                        1<small>건</small>
                      </b>
                      <span>기한 확인</span>
                      <Icon name="clock" />
                    </button>
                  </div>
                </section>
                <section className="section">
                  <div className="section-title">
                    <h2>지금 확인할 업무</h2>
                  </div>
                  <div className="task-list compact">
                    {tasks.slice(0, 3).map((task) => (
                      <button key={task.id} onClick={() => selectTask(task.id)}>
                        <span className="task-dot" />
                        <span>
                          <strong>{task.title}</strong>
                          <small>{task.due}</small>
                        </span>
                        <Icon name="chevron" size={18} />
                      </button>
                    ))}
                  </div>
                </section>
                <section className="section quick-section">
                  <div className="section-title">
                    <h2>필요한 곳으로 바로가기</h2>
                  </div>
                  <div className="quick-grid">
                    <button onClick={() => go("guide")}>
                      <span>
                        <b>복구 안내</b>
                        <small>단계별 할 일</small>
                      </span>
                      <Icon name="check" />
                    </button>
                    <button onClick={() => go("match")}>
                      <span>
                        <b>업체 찾기</b>
                        <small>견적 비교</small>
                      </span>
                      <Icon name="tool" />
                    </button>
                    <button className="wide" onClick={() => go("docs")}>
                      <span>
                        <b>사건별 서류함</b>
                        <small>흩어진 파일을 한곳에</small>
                      </span>
                      <Icon name="archive" />
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {route === "guide" && (
          <div className="screen app-screen guide-screen">
            <AppHeader
              caseName={currentCaseName}
              onCases={() => setSheet("cases")}
              onNotify={() => notify("기한 확인이 필요한 업무가 있어요")}
            />
            <div className="page-heading guide-heading">
              <small>현재 사건에 맞춘 순서예요</small>
              <h1>복구 안내</h1>
              <div className="completion-row">
                <span>
                  <b>{completion}/5</b>개 완료
                </span>
                <div className="progress">
                  <i style={{ width: `${completion * 20}%` }} />
                </div>
              </div>
            </div>
            <div className="scroll-tabs">
              {["전체", "지금 해야 할 일", "서류 준비 필요", "완료"].map((filter) => (
                <button
                  className={guideFilter === filter ? "active" : ""}
                  onClick={() => setGuideFilter(filter)}
                  key={filter}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="timeline">
              <div className="timeline-step">
                <span className="step-number">1</span>
                <div>
                  <p className="step-label">화재 직후 조치</p>
                  {tasks.slice(0, 1).map((task) => (
                    <GuideCard
                      key={task.id}
                      task={task}
                      done={completed.includes(task.id)}
                      featured
                      onClick={() => selectTask(task.id)}
                    />
                  ))}
                </div>
              </div>
              <div className="timeline-step">
                <span className="step-number">2</span>
                <div>
                  <p className="step-label">
                    후속 처리 <small>세 업무는 함께 진행할 수 있어요</small>
                  </p>
                  {tasks
                    .slice(1, 4)
                    .filter((task) => guideFilter !== "완료" || completed.includes(task.id))
                    .map((task) => (
                      <GuideCard
                        key={task.id}
                        task={task}
                        done={completed.includes(task.id)}
                        onClick={() => selectTask(task.id)}
                      />
                    ))}
                </div>
              </div>
              <div className="timeline-step last">
                <span className="step-number">3</span>
                <div>
                  <p className="step-label">재가동 전 확인</p>
                  <GuideCard
                    task={tasks[4]}
                    done={completed.includes("restart")}
                    onClick={() => selectTask("restart")}
                  />
                  <p className="legal-note">
                    <Icon name="info" size={15} /> 재가동 가능 여부는 설비 안전과 별도 인허가 조건을
                    직접 확인해야 해요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {route === "task" && (
          <div className="screen detail-screen task-screen">
            <DetailHeader
              title="업무 안내"
              back={back}
              action={
                <button className="icon-button" onClick={() => notify("업무 링크를 복사했어요")}>
                  <Icon name="upload" size={20} />
                </button>
              }
            />
            <div className="task-title">
              <span>{activeTask.step}</span>
              <h1>{activeTask.title}</h1>
              <div>
                <Badge tone={activeTask.due.includes("필요") ? "gray" : "brand"}>
                  {activeTask.due}
                </Badge>
                <Badge tone="gray">{completed.includes(activeTask.id) ? "완료" : "진행 중"}</Badge>
              </div>
            </div>
            <section className="deadline-card">
              <Icon name="clock" size={24} />
              <div>
                <small>언제까지 확인해야 하나요?</small>
                <h2>
                  {activeTask.id === "first"
                    ? "가능한 한 빨리 기록해 두세요"
                    : "사건 조건에 따라 확인이 필요해요"}
                </h2>
                <p>정확한 기한은 피해와 신고 조건에 따라 달라질 수 있어요.</p>
              </div>
            </section>
            <section className="content-card">
              <h2>왜 필요한가요?</h2>
              <p>
                {activeTask.description} 이 기록은 보험 접수나 업체 견적을 받을 때 다시 활용할 수
                있습니다.
              </p>
              <div className="rule" />
              <h2>이 순서로 진행하세요</h2>
              <ol className="action-list">
                <li>
                  <span>1</span>현장 안전과 적용 조건을 먼저 확인해요.
                </li>
                <li>
                  <span>2</span>관련 기관의 공식 안내를 열어 최신 내용을 확인해요.
                </li>
                <li>
                  <span>3</span>증빙을 서류함에 저장하고 완료 여부를 직접 기록해요.
                </li>
              </ol>
              <button
                className="inline-link"
                onClick={() => notify("외부 공식 신청처 연결은 데모에서 준비 중이에요")}
              >
                공식 안내 확인 <Icon name="arrow" size={16} />
              </button>
            </section>
            {activeTask.id === "insurance" && (
              <button className="ai-banner" onClick={() => go("ai")}>
                <span>
                  <small>선택 유료 기능 · 데모</small>
                  <strong>유사 사례와 쟁점 찾아보기</strong>
                </span>
                <Icon name="chevron" />
              </button>
            )}
            <section className="content-card upload-card">
              <div className="section-title">
                <div>
                  <h2>필요 서류</h2>
                  <p>{activeTask.docs}</p>
                </div>
                <Badge tone="gray">
                  {currentDocs.filter((doc) => doc.linked === activeTask.title).length}개 연결
                </Badge>
              </div>
              <button className="outline-upload" onClick={() => setSheet("upload")}>
                <Icon name="plus" size={18} /> 새 서류 추가하기
              </button>
              <button className="soft-button" onClick={() => setSheet("reuse")}>
                <Icon name="archive" size={18} /> 서류함에서 가져오기
              </button>
              <div className="attached-files">
                {currentDocs
                  .filter((doc) => doc.linked === activeTask.title)
                  .map((doc) => (
                    <FileCard
                      key={doc.id}
                      doc={doc}
                      onRemove={() => setDocs((prev) => prev.filter((item) => item.id !== doc.id))}
                    />
                  ))}
                {!currentDocs.some((doc) => doc.linked === activeTask.title) && (
                  <p className="empty-inline">아직 연결된 서류가 없어요.</p>
                )}
              </div>
              <button
                className="error-demo"
                onClick={() =>
                  addDoc(
                    "보험금_청구서_수정필요.pdf",
                    "신청인 이름을 확인할 수 없어요. 파일을 수정해 다시 올려주세요.",
                  )
                }
              >
                첨부 파일 오류 상태 보기
              </button>
            </section>
            {activeTask.id === "restore" && (
              <button className="secondary-button find-vendor" onClick={() => go("match")}>
                <Icon name="tool" size={19} /> 복구업체 찾아보기
              </button>
            )}
            <section className="disclaimer">
              <Icon name="info" size={17} />
              <p>
                완료 표시는 직접 관리하는 기록이며 정부 기관 신고나 보험 접수가 자동으로 완료되는
                것은 아닙니다.
              </p>
            </section>
            <div className="sticky-action task-actions">
              <button className="status-sub" onClick={() => notify("해당 없음으로 기록했어요")}>
                해당 없음
              </button>
              <button className="primary-button" onClick={toggleComplete}>
                {completed.includes(activeTask.id) ? "진행 중으로 되돌리기" : "이 업무 완료로 표시"}
              </button>
            </div>
          </div>
        )}

        {route === "match" && (
          <div className="screen app-screen match-screen">
            <AppHeader
              caseName={currentCaseName}
              onCases={() => setSheet("cases")}
              onNotify={() => notify("새 견적이 도착했어요")}
            />
            <div className="page-heading">
              <small>
                {selectedIncident
                  ? `${selectedIncident.address} 주변 · 예시 정보`
                  : "사건 등록 후 맞춤 검색 가능"}
              </small>
              <h1>
                어떤 복구 작업이
                <br />
                필요하신가요?
              </h1>
            </div>
            <form
              className="match-search"
              onSubmit={(event) => {
                event.preventDefault();
                setVendorEntry("search");
                go("vendors");
              }}
            >
              <Icon name="search" />
              <input
                value={vendorQuery}
                onChange={(event) => setVendorQuery(event.target.value)}
                placeholder="업체명, 작업명 또는 전문가 검색"
              />
              <button type="submit" aria-label="검색">
                <Icon name="arrow" size={17} />
              </button>
            </form>
            <section className="match-primary">
              <div className="section-title">
                <div>
                  <h2>무엇을 하실까요?</h2>
                  <p>목적에 맞는 화면으로 바로 이동해요</p>
                </div>
              </div>
              <div className="match-primary-grid">
                <button
                  className={matchAction === "list" ? "selected" : ""}
                  onClick={() => {
                    setMatchAction("list");
                    setVendorEntry("list");
                    setVendorQuery("");
                    go("vendors");
                  }}
                >
                  <Icon name="search" size={23} />
                  <span>
                    <b>복구업체 리스트</b>
                    <small>전체 업체 탐색</small>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
                <button
                  className={matchAction === "request" ? "selected" : ""}
                  onClick={() => {
                    setMatchAction("request");
                    setSelectedVendor("업체 미지정 · 조건에 맞는 업체");
                    go("request");
                  }}
                >
                  <Icon name="file" size={23} />
                  <span>
                    <b>견적 요청하기</b>
                    <small>사건 자료로 요청서 작성</small>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
                <button
                  className={matchAction === "status" ? "selected" : ""}
                  onClick={() => {
                    setMatchAction("status");
                    go("requests");
                  }}
                >
                  <Icon name="compare" size={23} />
                  <span>
                    <b>내 견적 요청 현황</b>
                    <small>받은 견적 {quoteCounts[currentIncidentId] || 0}건</small>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              </div>
            </section>
            <div className="section-title category-title">
              <div>
                <h2>작업 분야로 찾기</h2>
                <p>분야를 선택하면 관련 업체만 모아 보여드려요</p>
              </div>
            </div>
            <div className="category-grid">
              {[
                ["화재 청소", "flame"],
                ["잔해 처리", "archive"],
                ["건축물 철거", "tool"],
                ["설비 복구", "shield"],
                ["노무 상담", "users"],
                ["법률 상담", "file"],
              ].map(([label, icon], index) => (
                <button
                  className={selectedCategory === label ? "selected" : ""}
                  key={label}
                  onClick={() => setSelectedCategory(label)}
                >
                  <span>
                    <b>{label}</b>
                    <small>{index < 4 ? "복구 업체" : "전문가 상담"}</small>
                  </span>
                  <Icon name={icon} size={27} />
                </button>
              ))}
            </div>
            <button
              className="category-cta"
              onClick={() => {
                setVendorEntry("category");
                setCategoryOnly(true);
                setVendorQuery("");
                go("vendors");
              }}
            >
              <span>
                <small>선택한 분야</small>
                <b>{selectedCategory} 업체 보기</b>
              </span>
              <Icon name="arrow" size={19} />
            </button>
          </div>
        )}

        {route === "vendors" && (
          <div className="screen detail-screen vendor-screen">
            <DetailHeader
              title={
                vendorEntry === "category"
                  ? `${selectedCategory} 찾기`
                  : vendorEntry === "search"
                    ? "검색 결과"
                    : "복구업체 리스트"
              }
              back={back}
              action={
                <button className="icon-button" onClick={() => setSheet("filter")}>
                  <Icon name="menu" size={20} />
                </button>
              }
            />
            <div className="search-input">
              <Icon name="search" />
              <input
                value={vendorQuery}
                onChange={(e) => setVendorQuery(e.target.value)}
                placeholder={
                  vendorEntry === "category"
                    ? `${selectedCategory} 내에서 검색`
                    : "업체명 또는 작업 분야 검색"
                }
              />
            </div>
            <div className={`vendor-context ${vendorEntry}`}>
              <span>
                <Icon
                  name={
                    vendorEntry === "category"
                      ? "check"
                      : vendorEntry === "search"
                        ? "search"
                        : "cases"
                  }
                  size={18}
                />
              </span>
              <div>
                <strong>
                  {vendorEntry === "category"
                    ? `${selectedCategory} 전문 목록`
                    : vendorEntry === "search"
                      ? vendorQuery
                        ? `‘${vendorQuery}’ 검색 결과`
                        : "원하는 업체를 검색해 보세요"
                      : "등록된 예시 업체 전체 보기"}
                </strong>
                <small>
                  {vendorEntry === "category"
                    ? "선택한 작업 분야에 해당하는 업체만 보여드려요."
                    : vendorEntry === "search"
                      ? "업체명과 작업 분야를 기준으로 찾고 있어요."
                      : "분야를 제한하지 않고 비교할 후보를 둘러보세요."}
                </small>
              </div>
            </div>
            <div className="scroll-tabs filters">
              {vendorEntry === "category" ? (
                <button
                  type="button"
                  aria-pressed={categoryOnly}
                  className={categoryOnly ? "active" : ""}
                  onClick={() => setCategoryOnly((value) => !value)}
                >
                  {categoryOnly ? selectedCategory : "전체 분야"}
                </button>
              ) : (
                <button
                  type="button"
                  aria-pressed={!filtersActive && !sortFast}
                  className={!filtersActive && !sortFast ? "active" : ""}
                  onClick={() => {
                    setFilterRegions([]);
                    setFilterTiming("");
                    setSortFast(false);
                  }}
                >
                  전체 분야
                </button>
              )}
              <button
                type="button"
                aria-pressed={ansanSiheungOn}
                className={ansanSiheungOn ? "active" : ""}
                onClick={() =>
                  setFilterRegions((previous) =>
                    ansanSiheungOn
                      ? previous.filter((region) => !ansanSiheung.includes(region))
                      : [...new Set([...previous, ...ansanSiheung])],
                  )
                }
              >
                안산·시흥
              </button>
              <button
                type="button"
                aria-pressed={sortFast}
                className={sortFast ? "active" : ""}
                onClick={() => setSortFast((value) => !value)}
              >
                일정 빠른 순
              </button>
              <button
                type="button"
                className={filtersActive ? "active" : ""}
                onClick={() => setSheet("filter")}
              >
                필터{filtersActive ? ` ${filterRegions.length + (filterTiming ? 1 : 0)}` : ""}
              </button>
            </div>
            <div className="result-title">
              <span>
                <b>{vendorResults.length}</b>
                개의 예시 업체
              </span>
              <small>실제 자격·평점은 확인되지 않았어요</small>
            </div>
            <div className="vendor-list">
              {vendorResults.map((vendor) => (
                <article className="vendor-card" key={vendor.name}>
                  <div className="vendor-top">
                    <span className="vendor-avatar">{vendor.name.slice(0, 1)}</span>
                    <Badge tone={Number.isFinite(availableDay(vendor.available)) ? "brand" : "gray"}>
                      {vendor.available}
                    </Badge>
                  </div>
                  <h2>
                    {vendor.name} <small>가상 업체</small>
                  </h2>
                  <p className="vendor-area">{vendor.area}</p>
                  <p>{vendor.desc}</p>
                  <div className="vendor-buttons">
                    <button onClick={() => notify("업체 상세 정보는 예시 화면이에요")}>
                      상세 보기
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor.name);
                        go("request");
                      }}
                    >
                      견적 요청
                    </button>
                  </div>
                </article>
              ))}
              {vendorResults.length === 0 && (
                <div className="empty-state">
                  <Icon name="search" size={30} />
                  <h2>검색 결과가 없어요</h2>
                  <p>지역이나 작업 조건을 넓혀 보세요.</p>
                  <button className="secondary-button" onClick={() => setVendorQuery("")}>
                    검색 초기화
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {route === "request" && (
          <div className="screen detail-screen request-screen">
            <DetailHeader
              title="견적 요청"
              back={back}
              action={
                <button
                  className="icon-button"
                  aria-label="다른 사건 선택"
                  onClick={() => setSheet("cases")}
                >
                  <Icon name="cases" size={20} />
                </button>
              }
            />
            <div className="stepper compact-stepper">
              <span className="active">1</span>
              <i />
              <span className="active">2</span>
              <i />
              <span>3</span>
              <div>
                <b>요청 정보</b>
                <b>자료 첨부</b>
                <b>최종 확인</b>
              </div>
            </div>
            <div className="page-heading">
              <small>사건 정보에서 자동으로 불러왔어요</small>
              <h1>
                요청 내용을
                <br />
                확인해 주세요
              </h1>
            </div>
            <div className="form-stack">
              <label>
                선택 업체
                <input value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} />
              </label>
              <label>
                작업 종류
                <select defaultValue="화재 청소 및 그을음 제거">
                  <option>화재 청소 및 그을음 제거</option>
                  <option>잔해 처리</option>
                  <option>설비 복구</option>
                </select>
              </label>
              <label>
                작업 장소
                <input defaultValue={selectedIncident?.address || "사건을 먼저 선택해 주세요"} />
              </label>
              <label>
                작업 범위
                <textarea defaultValue="생산동 일부의 그을음 제거와 설비 주변 정리가 필요합니다." />
              </label>
            </div>
            <section className="content-card request-files">
              <div className="section-title">
                <div>
                  <h2>공유할 자료</h2>
                  <p>선택한 파일만 업체에 공유됩니다.</p>
                </div>
                <Badge>{requestDocs.length}개</Badge>
              </div>
              {currentDocs.slice(0, 4).map((doc) => (
                <FileCard
                  key={doc.id}
                  doc={doc}
                  selected={requestDocs.includes(doc.id)}
                  onSelect={() =>
                    setRequestDocs((prev) =>
                      prev.includes(doc.id)
                        ? prev.filter((id) => id !== doc.id)
                        : [...prev, doc.id],
                    )
                  }
                />
              ))}
              <button className="outline-upload" onClick={() => setSheet("upload")}>
                <Icon name="plus" size={18} /> 새 파일 업로드
              </button>
            </section>
            <section className="disclaimer">
              <Icon name="shield" size={17} />
              <p>이 요청은 데모입니다. 실제 외부 업체에는 전송되지 않아요.</p>
            </section>
            <div className="sticky-action">
              <button
                className="primary-button"
                onClick={() => {
                  setQuoteCounts((previous) => ({
                    ...previous,
                    [currentIncidentId]: Math.max(previous[currentIncidentId] || 0, 1),
                  }));
                  notify("가상 견적 요청을 만들었어요");
                  go("requests");
                }}
              >
                견적 요청 보내기
              </button>
            </div>
          </div>
        )}

        {route === "requests" && (
          <div className="screen detail-screen requests-screen">
            <DetailHeader title="견적 요청 현황" back={back} />
            <div className="page-heading">
              <small>{currentCaseName}</small>
              <h1>
                보낸 요청과 도착한
                <br />
                견적을 확인하세요
              </h1>
            </div>
            <section className="request-status-summary">
              <div>
                <small>진행 중인 요청</small>
                <b>2</b>
              </div>
              <div>
                <small>도착한 견적</small>
                <b>{quoteCounts[currentIncidentId] || 0}</b>
              </div>
              <div>
                <small>선정 완료</small>
                <b>{currentDocs.some((doc) => doc.type === "견적·계약") ? 1 : 0}</b>
              </div>
            </section>
            <div className="request-status-list">
              <article className="request-status-card">
                <div>
                  <Badge>견적 도착</Badge>
                  <small>오늘 업데이트</small>
                </div>
                <h2>화재 청소 및 그을음 제거</h2>
                <p>{selectedIncident?.address} · 업체 미지정 공개 요청</p>
                <dl>
                  <div>
                    <dt>첨부 자료</dt>
                    <dd>{requestDocs.length || 1}개</dd>
                  </div>
                  <div>
                    <dt>받은 견적</dt>
                    <dd>{quoteCounts[currentIncidentId] || 0}건</dd>
                  </div>
                </dl>
                <button onClick={() => go("quotes")}>
                  도착한 견적 비교하기 <Icon name="arrow" size={17} />
                </button>
              </article>
              <article className="request-status-card quiet">
                <div>
                  <Badge tone="gray">요청 완료</Badge>
                  <small>6월 8일</small>
                </div>
                <h2>생산설비 상태 점검</h2>
                <p>온유 설비 복원 · 답변 대기 중</p>
                <div className="waiting-note">
                  <Icon name="clock" size={16} /> 아직 도착한 견적이 없어요
                </div>
              </article>
            </div>
            <button
              className="secondary-button new-request-button"
              onClick={() => {
                setSelectedVendor("업체 미지정 · 조건에 맞는 업체");
                go("request");
              }}
            >
              <Icon name="plus" size={18} /> 새 견적 요청 작성
            </button>
          </div>
        )}

        {route === "quotes" && (
          <div className="screen detail-screen quote-screen">
            <DetailHeader title="견적 비교" back={back} />
            <div className="page-heading">
              <small>화재 청소 요청 · 예시 견적</small>
              <h1>
                가격만 말고
                <br />
                작업 범위도 비교하세요
              </h1>
            </div>
            <div className="quote-summary">
              <span>견적 요청</span>
              <b>{quoteCounts[currentIncidentId] || 0}건 도착</b>
              <div className="progress">
                <i style={{ width: "68%" }} />
              </div>
              <small>선택한 견적의 세부 조건을 꼭 확인하세요.</small>
            </div>
            <div className="quote-list">
              {[
                {
                  name: "가온 복구 파트너스",
                  price: "8,400,000원",
                  term: "약 6일",
                  start: "6월 12일",
                  include: "그을음 세척 · 폐기물 분류",
                  exclude: "설비 분해·수리",
                },
                {
                  name: "새봄 산업 클린",
                  price: "7,900,000원",
                  term: "약 8일",
                  start: "6월 13일",
                  include: "그을음 세척 · 잔해 반출",
                  exclude: "고소 작업 · 설비 수리",
                },
              ]
                .slice(0, quoteCounts[currentIncidentId] || 0)
                .map((quote) => (
                  <button
                    className={`quote-card ${quoteChoice === quote.name ? "selected" : ""}`}
                    key={quote.name}
                    onClick={() => setQuoteChoice(quote.name)}
                  >
                    <div className="quote-head">
                      <span className="radio" />
                      <div>
                        <strong>{quote.name}</strong>
                        <small>가상 견적 · 부가세 별도</small>
                      </div>
                    </div>
                    <b className="quote-price">{quote.price}</b>
                    <dl>
                      <div>
                        <dt>예상 기간</dt>
                        <dd>{quote.term}</dd>
                      </div>
                      <div>
                        <dt>시작 가능</dt>
                        <dd>{quote.start}</dd>
                      </div>
                      <div>
                        <dt>포함</dt>
                        <dd>{quote.include}</dd>
                      </div>
                      <div>
                        <dt>제외</dt>
                        <dd>{quote.exclude}</dd>
                      </div>
                    </dl>
                  </button>
                ))}
            </div>
            <div className="sticky-action">
              <button
                className="primary-button"
                disabled={!quoteChoice}
                onClick={() => {
                  const newDoc: Doc = {
                    id: Date.now(),
                    incidentId: currentIncidentId,
                    name: "선택업체_견적서_예시.pdf",
                    type: "견적·계약",
                    size: "640 KB · PDF",
                    linked: "피해 복구",
                    source: "견적 비교",
                    date: "오늘",
                  };
                  setDocs((prev) =>
                    prev.some(
                      (doc) => doc.name === newDoc.name && doc.incidentId === currentIncidentId,
                    )
                      ? prev
                      : [newDoc, ...prev],
                  );
                  notify("업체를 선택하고 견적서를 보관했어요");
                  go("progress");
                }}
              >
                선택한 업체 확인하기
              </button>
            </div>
          </div>
        )}

        {route === "progress" && (
          <div className="screen detail-screen progress-screen">
            <DetailHeader title="작업 진행" back={back} />
            <div className="progress-hero">
              <small>선정 업체 · 가상</small>
              <h1>{quoteChoice || "가온 복구 파트너스"}</h1>
              <p>계약과 지급은 이 앱에서 처리되지 않아요.</p>
              <div className="live-progress">
                <span>
                  <b>작업 준비 중</b>
                  <em>40%</em>
                </span>
                <div className="progress">
                  <i style={{ width: "40%" }} />
                </div>
              </div>
            </div>
            <div className="work-steps">
              {["견적 요청", "견적 수신", "업체 선정", "작업 예정", "작업 중", "작업 완료"].map(
                (label, index) => (
                  <div className={index < 3 ? "done" : index === 3 ? "active" : ""} key={label}>
                    <span>{index < 3 ? "✓" : index + 1}</span>
                    <div>
                      <b>{label}</b>
                      <small>
                        {index < 3 ? "완료" : index === 3 ? "6월 12일 예정" : "아직 시작 전"}
                      </small>
                    </div>
                  </div>
                ),
              )}
            </div>
            <section className="content-card">
              <div className="section-title">
                <h2>진행 기록</h2>
                <button onClick={() => setSheet("upload")}>자료 추가</button>
              </div>
              <div className="activity">
                <i />
                <div>
                  <b>업체 선택 완료</b>
                  <small>오늘 14:20 · 직접 기록</small>
                  <p>견적서를 사건 서류함에 보관했어요.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {route === "docs" && (
          <div className="screen app-screen docs-screen">
            <AppHeader
              caseName={currentCaseName}
              onCases={() => setSheet("cases")}
              onNotify={() => notify("새 서류 알림은 없어요")}
            />
            {!docsIncidentView ? (
              <>
                <div className="page-heading docs-heading">
                  <small>사건별로 분리해 안전하게 보관해요</small>
                  <h1>
                    어느 사건의 서류를
                    <br />
                    확인할까요?
                  </h1>
                </div>
                <div className="archive-incident-list">
                  {incidents.map((incident) => {
                    const incidentDocs = docs.filter((doc) => doc.incidentId === incident.id);
                    const isCurrent = incident.id === currentIncidentId;
                    return (
                      <button
                        className={`archive-incident-card ${isCurrent ? "current" : ""}`}
                        key={incident.id}
                        onClick={() => {
                          setSelectedIncidentId(incident.id);
                          setDocsIncidentView(true);
                          setQuery("");
                          setDocFilter("전체");
                        }}
                      >
                        <span className="archive-folder">
                          <Icon name="folder" size={23} />
                        </span>
                        <span className="archive-incident-copy">
                          <span className="archive-card-title">
                            <strong>{incident.name}</strong>
                            {isCurrent && <Badge>현재 관리 중</Badge>}
                          </span>
                          <small>
                            {incident.business} · {incident.date}
                          </small>
                          <span>
                            보관 서류 <b>{incidentDocs.length}</b>개 · 최근 수정 {incident.updated}
                          </span>
                        </span>
                        <Icon name="chevron" size={18} />
                      </button>
                    );
                  })}
                  {incidents.length === 0 && (
                    <div className="empty-state">
                      <Icon name="folder" size={34} />
                      <h2>등록된 사건이 없어요</h2>
                      <p>사건을 등록하면 관련 서류를 한곳에서 관리할 수 있어요.</p>
                      <button className="secondary-button" onClick={() => go("new-case")}>
                        새 사건 등록
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  className="archive-back"
                  onClick={() => {
                    setDocsIncidentView(false);
                    setQuery("");
                    setDocFilter("전체");
                  }}
                >
                  <Icon name="back" size={17} /> 사건 목록
                </button>
                <div className="page-heading docs-heading archive-detail-heading">
                  <small>{currentCaseName}</small>
                  <div className="title-action">
                    <h1>사건별 서류함</h1>
                    <button onClick={() => setSheet("upload")}>
                      <Icon name="plus" size={17} /> 업로드
                    </button>
                  </div>
                </div>
                <div className="search-input">
                  <Icon name="search" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="파일명으로 검색"
                  />
                </div>
                <div className="scroll-tabs doc-tabs">
                  {["전체", "피해 사진", "소방·행정 서류", "보험", "견적·계약"].map((filter) => (
                    <button
                      key={filter}
                      className={docFilter === filter ? "active" : ""}
                      onClick={() => setDocFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="doc-summary">
                  <span>
                    전체 <b>{filteredDocs.length}</b>개
                  </span>
                  <small>한 파일을 여러 업무에 다시 쓸 수 있어요</small>
                </div>
                <div className="doc-list">
                  {filteredDocs.map((doc) => (
                    <article
                      className={`document-card ${doc.error ? "has-error" : ""}`}
                      key={doc.id}
                    >
                      <div className="document-main">
                        <span className="doc-preview">
                          <Icon name={doc.type.includes("사진") ? "image" : "file"} />
                        </span>
                        <div>
                          <strong>{doc.name}</strong>
                          <small>
                            {doc.type} · {doc.size}
                          </small>
                        </div>
                        <button onClick={() => notify("파일 메뉴: 미리보기, 이름 변경, 삭제")}>
                          <Icon name="menu" size={18} />
                        </button>
                      </div>
                      {doc.error ? (
                        <p className="doc-error">
                          <Icon name="alert" size={13} /> {doc.error}
                        </p>
                      ) : (
                        <div className="document-meta">
                          <span>{doc.linked}</span>
                          <span>
                            {doc.date} · {doc.source}
                          </span>
                        </div>
                      )}
                      <button
                        className="reuse-link"
                        onClick={() => notify("다른 업무나 견적 요청에서 선택할 수 있어요")}
                      >
                        연결 및 재사용 <Icon name="chevron" size={15} />
                      </button>
                    </article>
                  ))}
                  {filteredDocs.length === 0 && (
                    <div className="empty-state">
                      <Icon name="folder" size={34} />
                      <h2>찾는 서류가 없어요</h2>
                      <p>검색어나 필터를 바꾸거나 새 서류를 업로드해 보세요.</p>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setQuery("");
                          setDocFilter("전체");
                        }}
                      >
                        검색 초기화
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {route === "ai" && (
          <div className="screen detail-screen ai-screen">
            <DetailHeader title="유사 사례 찾기" back={back} />
            <div className="page-heading">
              <small>유료 선택 기능 · 결제 시뮬레이션</small>
              <h1>
                우리 사건과 비슷한
                <br />
                쟁점을 찾아볼까요?
              </h1>
              <p>검증된 판례 API가 연결되지 않은 데모 결과입니다.</p>
            </div>
            <div className="form-stack">
              <label>
                사건 요약
                <textarea defaultValue="공장 화재로 생산설비 일부가 손상되고 가동이 중단된 상황" />
              </label>
              <label>
                확인할 쟁점
                <select>
                  <option>화재보험 보상 범위</option>
                  <option>임대인·임차인 책임</option>
                  <option>근로자 휴업 관련</option>
                </select>
              </label>
            </div>
            <section className="demo-result">
              <div>
                <Badge>데모 결과</Badge>
                <small>출처 확인 전</small>
              </div>
              <h2>보험 약관의 면책 범위와 손해 입증 자료 확인</h2>
              <p>
                계약별 약관과 사고 원인에 따라 판단이 달라질 수 있습니다. 피해 사진, 설비 목록,
                손해액 자료를 준비하고 전문가에게 검토를 요청하세요.
              </p>
              <button onClick={() => go("match")}>
                법률 전문가 찾아보기 <Icon name="arrow" size={17} />
              </button>
            </section>
            <div className="sticky-action">
              <button
                className="primary-button"
                onClick={() => notify("데모에서는 실제 결제가 진행되지 않아요")}
              >
                검색 이용권 구매 · 데모
              </button>
            </div>
          </div>
        )}

        {showNav && <BottomNav route={route} go={navigateFromNav} />}
        {toast && (
          <div className="toast">
            <span>✓</span>
            {toast}
          </div>
        )}
        {sheet && (
          <>
            <button className="sheet-backdrop" aria-label="닫기" onClick={() => setSheet(null)} />
            <section className="bottom-sheet">
              <div className="sheet-handle" />
              {sheet === "cases" && (
                <>
                  <div className="sheet-title">
                    <div>
                      <small>현재 선택</small>
                      <h2>화재 사건 전환</h2>
                    </div>
                    <button onClick={() => setSheet(null)}>
                      <Icon name="close" />
                    </button>
                  </div>
                  <div className="sheet-case-list">
                    {incidents.map((incident) => {
                      const isCurrent = incident.id === currentIncidentId;
                      return (
                        <button
                          className={`sheet-case ${isCurrent ? "active" : ""}`}
                          onClick={() => switchIncident(incident.id)}
                          key={incident.id}
                        >
                          <span className="incident-symbol">
                            <Icon name="flame" size={19} />
                          </span>
                          <span>
                            <b>{incident.name}</b>
                            <small>
                              {incident.status} · 최근 수정 {incident.updated}
                            </small>
                          </span>
                          {isCurrent ? <em>✓</em> : <Icon name="chevron" size={16} />}
                        </button>
                      );
                    })}
                    {incidents.length === 0 && (
                      <p className="sheet-help">아직 등록된 사건이 없어요.</p>
                    )}
                  </div>
                  <button className="sheet-action" onClick={() => go("new-case")}>
                    <Icon name="plus" /> 새 화재 사건 등록
                  </button>
                  <button className="text-button" onClick={() => go("cases")}>
                    전체 사건 목록 보기
                  </button>
                </>
              )}
              {sheet === "upload" && (
                <>
                  <div className="sheet-title">
                    <div>
                      <small>현재 사건에 자동 저장돼요</small>
                      <h2>서류 추가하기</h2>
                    </div>
                    <button onClick={() => setSheet(null)}>
                      <Icon name="close" />
                    </button>
                  </div>
                  <button
                    className="upload-option"
                    onClick={() => {
                      setSheet(null);
                      notify("카메라 기능은 데모에서 준비 중이에요");
                    }}
                  >
                    <span>
                      <Icon name="camera" />
                    </span>
                    <div>
                      <b>사진 촬영</b>
                      <small>현장 상황을 바로 기록해요</small>
                    </div>
                    <Icon name="chevron" />
                  </button>
                  <button className="upload-option" onClick={() => fileInput.current?.click()}>
                    <span>
                      <Icon name="image" />
                    </span>
                    <div>
                      <b>사진 또는 파일 선택</b>
                      <small>PDF, JPG, PNG, XLSX</small>
                    </div>
                    <Icon name="chevron" />
                  </button>
                  <button className="upload-option" onClick={() => addDoc("화재증명서_새파일.pdf")}>
                    <span>
                      <Icon name="file" />
                    </span>
                    <div>
                      <b>예시 파일로 체험</b>
                      <small>업로드 완료 상태를 확인해요</small>
                    </div>
                    <Icon name="chevron" />
                  </button>
                </>
              )}
              {sheet === "reuse" && (
                <>
                  <div className="sheet-title">
                    <div>
                      <small>{currentCaseName}</small>
                      <h2>저장된 서류에서 선택</h2>
                    </div>
                    <button onClick={() => setSheet(null)}>
                      <Icon name="close" />
                    </button>
                  </div>
                  <p className="sheet-help">같은 파일을 다시 올리지 않고 현재 업무에 연결합니다.</p>
                  <div className="reuse-list">
                    {currentDocs
                      .filter((doc) => !doc.error)
                      .slice(0, 4)
                      .map((doc) => (
                        <FileCard
                          key={doc.id}
                          doc={doc}
                          onSelect={() => {
                            setDocs((prev) =>
                              prev.map((item) =>
                                item.id === doc.id ? { ...item, linked: activeTask.title } : item,
                              ),
                            );
                            setSheet(null);
                            notify(`${doc.name}을 현재 업무에 연결했어요`);
                          }}
                        />
                      ))}
                  </div>
                </>
              )}
              {sheet === "filter" && (
                <>
                  <div className="sheet-title">
                    <div>
                      <small>검색 조건</small>
                      <h2>업체 필터</h2>
                    </div>
                    <button onClick={() => setSheet(null)}>
                      <Icon name="close" />
                    </button>
                  </div>
                  <fieldset>
                    <legend>지역</legend>
                    <div className="choice-grid">
                      {["안산시", "시흥시", "경기 서남부"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={filterRegions.includes(option)}
                          className={`choice ${filterRegions.includes(option) ? "active" : ""}`}
                          onClick={() => setFilterRegions((previous) => toggleIn(previous, option))}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>가능 시점</legend>
                    <div className="choice-row">
                      {["1주 이내", "협의 가능"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={filterTiming === option}
                          className={`choice ${filterTiming === option ? "active" : ""}`}
                          onClick={() =>
                            setFilterTiming((previous) => (previous === option ? "" : option))
                          }
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setSheet(null);
                      notify(`필터를 적용했어요 · 예시 업체 ${vendorResults.length}곳`);
                    }}
                  >
                    결과 보기
                  </button>
                </>
              )}
            </section>
          </>
        )}
        {pendingIncidentId && (
          <>
            <button
              className="sheet-backdrop"
              aria-label="사건 변경 취소"
              onClick={() => setPendingIncidentId(null)}
            />
            <section className="confirm-dialog" role="dialog" aria-modal="true">
              <span className="confirm-icon">
                <Icon name="alert" size={21} />
              </span>
              <h2>작성 중인 내용을 확인해 주세요</h2>
              <p>
                사건을 변경하면 현재 작성 중인 내용이 사라질 수 있어요. 저장한 뒤 변경하거나 취소해
                주세요.
              </p>
              <div>
                <button className="secondary-button" onClick={() => setPendingIncidentId(null)}>
                  취소
                </button>
                <button className="primary-button" onClick={() => applyIncident(pendingIncidentId)}>
                  저장하고 변경
                </button>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function GuideCard({
  task,
  done,
  featured,
  onClick,
}: {
  task: Task;
  done: boolean;
  featured?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`guide-card ${featured ? "featured" : ""}`} onClick={onClick}>
      <div className="guide-card-top">
        <Badge tone={done ? "brand" : "gray"}>{done ? "완료" : task.due}</Badge>
        <Icon name="chevron" size={18} />
      </div>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
      <div className="guide-card-bottom">
        <span>
          <Icon name="file" size={15} /> 관련 서류 {task.id === "first" ? 2 : 0}개
        </span>
        <span>{done ? "완료 기록됨" : "상세 보기"}</span>
      </div>
    </button>
  );
}

export default App;

/* 브라우저(localStorage)에 저장된 데모 데이터를 정리한다.
   정리 단계마다 버전 번호가 있고, 브라우저마다 아직 실행하지 않은 단계만 한 번씩 실행된다.
   새 정리가 필요하면 CLEANUP_STEPS 에 다음 버전을 추가한다. */

const VERSION_KEY = "restart-storage-version";

/** 기본 사건 (App.tsx 의 initialIncidents) — 어떤 정리에서도 지우지 않는다 */
const DEFAULT_INCIDENT_IDS = ["case-1", "case-2"];

type StoredIncident = { id: string; name?: string };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** 조건에 맞는 사건과, 그 사건에 딸린 서류·완료 기록·견적 수를 함께 지운다 */
function removeIncidents(shouldRemove: (incident: StoredIncident) => boolean) {
  const incidents = readJson<StoredIncident[]>("restart-incidents", []);
  const removedIds = incidents
    .filter((incident) => !DEFAULT_INCIDENT_IDS.includes(incident.id) && shouldRemove(incident))
    .map((incident) => incident.id);
  if (removedIds.length === 0) return;

  const kept = incidents.filter((incident) => !removedIds.includes(incident.id));
  if (kept.length > 0) {
    localStorage.setItem("restart-incidents", JSON.stringify(kept));
  } else {
    // 남은 사건이 없으면 저장값을 지워 App 의 기본 사건 2개로 다시 시작한다
    localStorage.removeItem("restart-incidents");
  }

  const docs = readJson<{ incidentId?: string }[]>("restart-docs", []);
  localStorage.setItem(
    "restart-docs",
    JSON.stringify(docs.filter((doc) => !doc.incidentId || !removedIds.includes(doc.incidentId))),
  );

  for (const key of ["restart-completed-by-incident", "restart-quotes-by-incident"]) {
    if (!localStorage.getItem(key)) continue;
    const record = readJson<Record<string, unknown>>(key, {});
    localStorage.setItem(
      key,
      JSON.stringify(Object.fromEntries(Object.entries(record).filter(([id]) => !removedIds.includes(id)))),
    );
  }

  const selected = localStorage.getItem("restart-selected-incident");
  if (selected && removedIds.includes(selected)) {
    localStorage.setItem("restart-selected-incident", DEFAULT_INCIDENT_IDS[0]);
  }
}

const CLEANUP_STEPS: { version: number; run: () => void }[] = [
  // v2: 기본 사건 2개만 남긴다 (한양대 에리카 기숙사 화재, 한양대 폭파 사건 등 정리)
  { version: 2, run: () => removeIncidents(() => true) },
  // v3: 다시 만들어진 '한양대 폭파' 사건만 지운다. 직접 만든 다른 사건은 남긴다.
  {
    version: 3,
    run: () =>
      removeIncidents(({ name = "" }) => name.includes("한양대") && name.includes("폭파")),
  },
];

export function cleanUpStoredIncidents() {
  try {
    const done = Number(localStorage.getItem(VERSION_KEY)) || 0;
    for (const step of CLEANUP_STEPS) {
      if (step.version > done) {
        step.run();
        localStorage.setItem(VERSION_KEY, String(step.version));
      }
    }
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 건너뛴다
  }
}

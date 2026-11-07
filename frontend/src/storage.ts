/* 브라우저(localStorage)에 저장된 데모 데이터를 정리한다.
   STORAGE_VERSION 을 올리면 다음 실행 때 한 번만 정리가 실행된다. */

const STORAGE_VERSION = "2";
const VERSION_KEY = "restart-storage-version";

/** 남겨 둘 기본 사건 (App.tsx 의 initialIncidents) */
const KEEP_INCIDENT_IDS = ["case-1", "case-2"];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function pickKeys<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([id]) => KEEP_INCIDENT_IDS.includes(id)),
  );
}

/** 기본 사건 2개만 남기고, 직접 만든 사건과 그 사건의 서류·기록을 지운다 */
export function cleanUpStoredIncidents() {
  try {
    if (localStorage.getItem(VERSION_KEY) === STORAGE_VERSION) return;

    const incidents = readJson<{ id: string }[]>("restart-incidents", []);
    const kept = incidents.filter((incident) => KEEP_INCIDENT_IDS.includes(incident.id));
    if (kept.length > 0) {
      localStorage.setItem("restart-incidents", JSON.stringify(kept));
    } else {
      // 남길 사건이 하나도 없으면 저장값을 지워 App 의 기본 사건 2개로 다시 시작한다
      localStorage.removeItem("restart-incidents");
    }

    const docs = readJson<{ incidentId?: string }[]>("restart-docs", []);
    localStorage.setItem(
      "restart-docs",
      JSON.stringify(
        docs.filter((doc) => !doc.incidentId || KEEP_INCIDENT_IDS.includes(doc.incidentId)),
      ),
    );

    for (const key of ["restart-completed-by-incident", "restart-quotes-by-incident"]) {
      const saved = localStorage.getItem(key);
      if (saved) localStorage.setItem(key, JSON.stringify(pickKeys(readJson(key, {}))));
    }

    const selected = localStorage.getItem("restart-selected-incident");
    if (selected && !KEEP_INCIDENT_IDS.includes(selected)) {
      localStorage.setItem("restart-selected-incident", KEEP_INCIDENT_IDS[0]);
    }

    localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 건너뛴다
  }
}

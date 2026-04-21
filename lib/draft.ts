export const DRAFT_KEY = "laneta-survey-draft-v1";
const SCHEMA_VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type DraftPayload = {
  version: number;
  timestamp: number;
  answers: Record<string, unknown>;
  route: string;
};

export function saveDraft({ answers, route }: { answers: Record<string, unknown>; route: string }): void {
  try {
    const payload: DraftPayload = { version: SCHEMA_VERSION, timestamp: Date.now(), answers, route };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be disabled or full — silently no-op
  }
}

export function loadDraft(): { answers: Record<string, unknown>; route: string } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed.version !== SCHEMA_VERSION) return null;
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) return null;
    return { answers: parsed.answers, route: parsed.route };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY); } catch {
    // ignore
  }
}

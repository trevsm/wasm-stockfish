import type { ActiveGame, GameRecord, PuzzleProgress } from "@/types";

const STORAGE_KEY = "text-chess-games";
const ACTIVE_KEY = "text-chess-active";
const PUZZLE_PROGRESS_KEY = "text-chess-puzzle-progress";
const PUZZLE_LIST_PREFS_KEY = "text-chess-puzzle-list-prefs";
const PUZZLE_LIST_SCROLL_KEY = "text-chess-puzzle-list-scroll";

export function getGameRecords(): GameRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveGameRecord(record: GameRecord): void {
  const records = getGameRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteGameRecord(id: string): void {
  const records = getGameRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getGameRecordById(id: string): GameRecord | null {
  return getGameRecords().find((r) => r.id === id) ?? null;
}

function getActiveGames(): Record<string, ActiveGame> {
  try {
    const data = localStorage.getItem(ACTIVE_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function getActiveGame(id: string): ActiveGame | null {
  return getActiveGames()[id] ?? null;
}

export function saveActiveGame(game: ActiveGame): void {
  const all = getActiveGames();
  all[game.id] = game;
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(all));
}

export function deleteActiveGame(id: string): void {
  const all = getActiveGames();
  delete all[id];
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(all));
}

function getPuzzleProgressRaw(): { solvedIds: string[]; lastSolvedAt: Record<string, string> } {
  try {
    const data = localStorage.getItem(PUZZLE_PROGRESS_KEY);
    if (!data) return { solvedIds: [], lastSolvedAt: {} };
    const parsed = JSON.parse(data);
    return {
      solvedIds: Array.isArray(parsed.solvedIds) ? parsed.solvedIds : [],
      lastSolvedAt: parsed.lastSolvedAt && typeof parsed.lastSolvedAt === "object" ? parsed.lastSolvedAt : {},
    };
  } catch {
    return { solvedIds: [], lastSolvedAt: {} };
  }
}

export function getPuzzleProgress(): PuzzleProgress {
  return getPuzzleProgressRaw();
}

export function savePuzzleProgress(progress: PuzzleProgress): void {
  localStorage.setItem(
    PUZZLE_PROGRESS_KEY,
    JSON.stringify({
      solvedIds: progress.solvedIds,
      lastSolvedAt: progress.lastSolvedAt,
    })
  );
}

export function markPuzzleSolved(puzzleId: string): void {
  const { solvedIds, lastSolvedAt } = getPuzzleProgressRaw();
  if (!solvedIds.includes(puzzleId)) {
    solvedIds.push(puzzleId);
  }
  lastSolvedAt[puzzleId] = new Date().toISOString();
  localStorage.setItem(
    PUZZLE_PROGRESS_KEY,
    JSON.stringify({ solvedIds, lastSolvedAt })
  );
}

export function isPuzzleSolved(puzzleId: string): boolean {
  return getPuzzleProgressRaw().solvedIds.includes(puzzleId);
}

export function unmarkPuzzleSolved(puzzleId: string): void {
  const { solvedIds, lastSolvedAt } = getPuzzleProgressRaw();
  const filtered = solvedIds.filter((id) => id !== puzzleId);
  delete lastSolvedAt[puzzleId];
  localStorage.setItem(
    PUZZLE_PROGRESS_KEY,
    JSON.stringify({ solvedIds: filtered, lastSolvedAt })
  );
}

export function clearPuzzleProgress(): void {
  localStorage.setItem(
    PUZZLE_PROGRESS_KEY,
    JSON.stringify({ solvedIds: [], lastSolvedAt: {} })
  );
}

export interface PuzzleListState {
  themeFilter: string;
  sort: string;
  scrollTop: number;
}

function getPuzzleListPrefsRaw(): Partial<PuzzleListState> {
  try {
    const data = localStorage.getItem(PUZZLE_LIST_PREFS_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function getPuzzleListScrollRaw(): number | undefined {
  try {
    const data = sessionStorage.getItem(PUZZLE_LIST_SCROLL_KEY);
    if (!data) return undefined;
    const n = Number(JSON.parse(data));
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

export function getPuzzleListState(): Partial<PuzzleListState> {
  return {
    ...getPuzzleListPrefsRaw(),
    scrollTop: getPuzzleListScrollRaw(),
  };
}

export function savePuzzleListState(updates: Partial<PuzzleListState>): void {
  if ("themeFilter" in updates || "sort" in updates) {
    const prefs = getPuzzleListPrefsRaw();
    localStorage.setItem(
      PUZZLE_LIST_PREFS_KEY,
      JSON.stringify({ ...prefs, ...updates })
    );
  }
  if ("scrollTop" in updates) {
    sessionStorage.setItem(
      PUZZLE_LIST_SCROLL_KEY,
      JSON.stringify(updates.scrollTop ?? 0)
    );
  }
}

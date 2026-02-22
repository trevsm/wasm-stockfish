import type { ActiveGame, GameRecord } from "@/types";

const STORAGE_KEY = "text-chess-games";
const ACTIVE_KEY = "text-chess-active";

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

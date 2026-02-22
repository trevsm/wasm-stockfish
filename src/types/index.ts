export type GameResult = "win" | "loss" | "draw" | "resigned";

export type PlayerColor = "white" | "black";

export interface GameRecord {
  id: string;
  date: string;
  difficulty: string;
  result: GameResult;
  moves: string[];
  playerColor: PlayerColor;
}

export interface ActiveGame {
  id: string;
  date: string;
  difficulty: string;
  playerColor: PlayerColor;
  moves: Array<{ san: string; by: "player" | "engine" }>;
}

export type DifficultyLevel = "Novice" | "Beginner" | "Easy" | "Medium" | "Hard" | "Expert";

export type DifficultySettings =
  | { type: "skill"; level: number; approxElo: number }
  | { type: "elo"; elo: number };

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultySettings> = {
  Novice: { type: "skill", level: 0, approxElo: 800 },
  Beginner: { type: "skill", level: 3, approxElo: 1000 },
  Easy: { type: "skill", level: 6, approxElo: 1200 },
  Medium: { type: "elo", elo: 1500 },
  Hard: { type: "elo", elo: 2000 },
  Expert: { type: "elo", elo: 2500 },
};

export function getApproxElo(difficulty: DifficultyLevel): number {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  return settings.type === "skill" ? settings.approxElo : settings.elo;
}

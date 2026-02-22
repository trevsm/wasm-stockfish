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

export type DifficultyLevel = "Beginner" | "Easy" | "Medium" | "Hard" | "Expert";

export const DIFFICULTY_ELO: Record<DifficultyLevel, number> = {
  Beginner: 800,
  Easy: 1200,
  Medium: 1500,
  Hard: 2000,
  Expert: 2500,
};

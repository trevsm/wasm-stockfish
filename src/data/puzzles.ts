/**
 * Chess puzzles from the Lichess database (CC0 license).
 * Puzzle data lives in puzzles.json. To refresh: npm run fetch-puzzles
 */

import type { Puzzle, PuzzleTheme } from "@/types";

import puzzlesData from "./puzzles.json";

export const PUZZLES: Puzzle[] = puzzlesData as Puzzle[];

export const PUZZLE_THEMES: { value: PuzzleTheme; label: string; color: string }[] = [
  { value: "fork", label: "Fork", color: "bg-amber-500/20 text-amber-300" },
  { value: "pin", label: "Pin", color: "bg-blue-500/20 text-blue-300" },
  { value: "skewer", label: "Skewer", color: "bg-purple-500/20 text-purple-300" },
  { value: "discoveredAttack", label: "Discovered Attack", color: "bg-orange-500/20 text-orange-300" },
  { value: "doubleCheck", label: "Double Check", color: "bg-red-500/20 text-red-300" },
  { value: "mateIn1", label: "Mate in 1", color: "bg-rose-500/20 text-rose-300" },
  { value: "mateIn2", label: "Mate in 2", color: "bg-pink-500/20 text-pink-300" },
  { value: "mateIn3", label: "Mate in 3", color: "bg-fuchsia-500/20 text-fuchsia-300" },
  { value: "sacrifice", label: "Sacrifice", color: "bg-emerald-500/20 text-emerald-300" },
  { value: "deflection", label: "Deflection", color: "bg-cyan-500/20 text-cyan-300" },
  { value: "clearance", label: "Clearance", color: "bg-teal-500/20 text-teal-300" },
  { value: "endgame", label: "Endgame", color: "bg-slate-500/20 text-slate-300" },
  { value: "pawnEndgame", label: "Pawn Endgame", color: "bg-lime-500/20 text-lime-300" },
  { value: "rookEndgame", label: "Rook Endgame", color: "bg-sky-500/20 text-sky-300" },
];

export function getPuzzlesByTheme(puzzles: Puzzle[], theme: PuzzleTheme): Puzzle[] {
  return puzzles.filter((p) => p.themes.includes(theme));
}

export function getPuzzleById(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

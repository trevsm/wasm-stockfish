/**
 * Lazy-loaded puzzle section. Bundles PuzzleList, PuzzleScreen, and puzzle data.
 */
import { useEffect } from "react";
import { PuzzleList } from "./PuzzleList";
import { PuzzleScreen } from "./PuzzleScreen";
import { getPuzzleById } from "@/data/puzzles";
import type { Puzzle } from "@/types";

interface PuzzleViewProps {
  mode: "list" | "puzzle";
  puzzle?: Puzzle | null;
  puzzleId?: string | null;
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onBack: () => void;
  onResolvePuzzle: (puzzle: Puzzle | null) => void;
}

export function PuzzleView({
  mode,
  puzzle,
  puzzleId,
  onSelectPuzzle,
  onBack,
  onResolvePuzzle,
}: PuzzleViewProps) {
  useEffect(() => {
    if (mode === "puzzle" && puzzleId && !puzzle) {
      const resolved = getPuzzleById(puzzleId);
      onResolvePuzzle(resolved ?? null);
    }
  }, [mode, puzzleId, puzzle, onResolvePuzzle]);

  if (mode === "list") {
    return <PuzzleList onSelectPuzzle={onSelectPuzzle} onBack={onBack} />;
  }

  if (puzzle) {
    return (
      <PuzzleScreen puzzle={puzzle} onBack={onBack} onSolved={() => {}} />
    );
  }

  if (puzzleId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="mt-4">Loading puzzle…</p>
      </div>
    );
  }

  return null;
}

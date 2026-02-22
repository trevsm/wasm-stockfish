import { useState, useMemo } from "react";
import { Check, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PUZZLES, PUZZLE_THEMES, getPuzzlesByTheme } from "@/data/puzzles";
import { clearPuzzleProgress, getPuzzleProgress } from "@/lib/storage";
import type { Puzzle, PuzzleTheme } from "@/types";

interface PuzzleListProps {
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onBack: () => void;
}

export function PuzzleList({ onSelectPuzzle, onBack }: PuzzleListProps) {
  const [themeFilter, setThemeFilter] = useState<PuzzleTheme | "all">("all");
  const [, forceUpdate] = useState(0);

  const progress = getPuzzleProgress();
  const handleResetProgress = () => {
    if (window.confirm("Reset all puzzle progress? You will need to solve them again.")) {
      clearPuzzleProgress();
      forceUpdate((n) => n + 1);
    }
  };
  const solvedSet = useMemo(
    () => new Set(progress.solvedIds),
    [progress.solvedIds]
  );

  const filteredPuzzles = useMemo(() => {
    if (themeFilter === "all") return PUZZLES;
    return getPuzzlesByTheme(themeFilter);
  }, [themeFilter]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2 sm:pb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onBack}
            aria-label="Back to menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl">Puzzles</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {solvedSet.size} of {PUZZLES.length} solved
            </p>
          </div>
          {solvedSet.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={handleResetProgress}
              aria-label="Reset all puzzle progress"
            >
              <RotateCcw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <label className="text-sm font-medium">Theme</label>
          <Select
            value={themeFilter}
            onValueChange={(v) => setThemeFilter(v as PuzzleTheme | "all")}
          >
            <SelectTrigger className="min-h-[44px] sm:min-h-[36px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All themes</SelectItem>
              {PUZZLE_THEMES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ul className="space-y-2 max-h-[50vh] overflow-y-auto overscroll-contain -mx-1 px-1">
          {filteredPuzzles.map((puzzle) => {
            const isSolved = solvedSet.has(puzzle.id);
            const themeLabel =
              (puzzle.themes[0] && PUZZLE_THEMES.find((pt) => pt.value === puzzle.themes[0])?.label) ??
              puzzle.themes[0] ??
              "";
            return (
              <li key={puzzle.id}>
                <button
                  type="button"
                  onClick={() => onSelectPuzzle(puzzle)}
                  className="w-full flex items-center gap-3 rounded-lg border bg-muted/30 hover:bg-muted/50 active:bg-muted/70 transition-colors px-3 py-3 sm:py-2.5 text-left min-h-[44px] sm:min-h-0"
                >
                  <span
                    className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isSolved
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isSolved ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                    <span className="font-medium truncate">
                      {themeLabel}
                      {puzzle.themes.length > 1 && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          (+{puzzle.themes.length - 1})
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Rating {puzzle.rating}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowUp, Check, ChevronLeft, Pin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVirtualList } from "@/hooks/useVirtualList";
import { PUZZLES, PUZZLE_THEMES, getPuzzlesByTheme } from "@/data/puzzles";
import {
  clearPuzzleProgress,
  getPuzzleProgress,
  getPuzzleListState,
  savePuzzleListState,
} from "@/lib/storage";
import type { Puzzle, PuzzleTheme } from "@/types";

const LIST_ITEM_HEIGHT = 56;
const LIST_GAP = 8;

interface PuzzleListProps {
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onBack: () => void;
}

type SortOption = "rating-asc" | "rating-desc" | "theme-asc" | "theme-desc";

const VALID_THEMES = new Set<string>([
  "all",
  ...PUZZLE_THEMES.map((pt) => pt.value),
]);
const VALID_SORTS: SortOption[] = [
  "rating-asc",
  "rating-desc",
  "theme-asc",
  "theme-desc",
];

export function PuzzleList({ onSelectPuzzle, onBack }: PuzzleListProps) {
  const savedState = getPuzzleListState();
  const [themeFilter, setThemeFilter] = useState<PuzzleTheme | "all">(() =>
    VALID_THEMES.has(savedState.themeFilter ?? "")
      ? (savedState.themeFilter as PuzzleTheme | "all")
      : "all"
  );
  const [sort, setSort] = useState<SortOption>(() => {
    const saved = savedState.sort as SortOption | undefined;
    return saved && VALID_SORTS.includes(saved) ? saved : "rating-asc";
  });
  const [pinSolvedToTop, setPinSolvedToTop] = useState(() =>
    savedState.pinSolvedToTop !== false
  );
  const [, forceUpdate] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRestoredRef = useRef(false);
  const prevFilterSortRef = useRef<{
    themeFilter: PuzzleTheme | "all";
    sort: SortOption;
    pinSolvedToTop: boolean;
  } | null>(null);

  const progress = getPuzzleProgress();
  const [resetPopoverOpen, setResetPopoverOpen] = useState(false);

  const handleConfirmReset = () => {
    clearPuzzleProgress();
    forceUpdate((n) => n + 1);
    setResetPopoverOpen(false);
  };
  const solvedSet = useMemo(
    () => new Set(progress.solvedIds),
    [progress.solvedIds]
  );

  const filteredPuzzles = useMemo(() => {
    if (themeFilter === "all") return PUZZLES;
    return getPuzzlesByTheme(PUZZLES, themeFilter);
  }, [themeFilter]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sortedPuzzles = useMemo(() => {
    const arr = [...filteredPuzzles];
    const getPrimaryTheme = (p: (typeof arr)[0]) =>
      themeFilter !== "all" && p.themes.includes(themeFilter)
        ? themeFilter
        : p.themes[0] ?? "";
    const getThemeLabel = (t: string) =>
      PUZZLE_THEMES.find((pt) => pt.value === t)?.label ?? t;
    arr.sort((a, b) => {
      if (pinSolvedToTop) {
        const aSolved = solvedSet.has(a.id);
        const bSolved = solvedSet.has(b.id);
        if (aSolved !== bSolved) return aSolved ? -1 : 1;
      }
      switch (sort) {
        case "rating-asc":
          return a.rating - b.rating;
        case "rating-desc":
          return b.rating - a.rating;
        case "theme-asc":
          return getThemeLabel(getPrimaryTheme(a)).localeCompare(
            getThemeLabel(getPrimaryTheme(b))
          );
        case "theme-desc":
          return getThemeLabel(getPrimaryTheme(b)).localeCompare(
            getThemeLabel(getPrimaryTheme(a))
          );
        default:
          return 0;
      }
    });
    return arr;
  }, [filteredPuzzles, sort, themeFilter, pinSolvedToTop, solvedSet]);

  const { visibleItems, totalHeight } = useVirtualList(
    sortedPuzzles,
    scrollContainerRef,
    {
      itemHeight: LIST_ITEM_HEIGHT,
      gap: LIST_GAP,
      overscan: 8,
    }
  );

  useEffect(() => {
    savePuzzleListState({ themeFilter, sort, pinSolvedToTop });
    const prev = prevFilterSortRef.current;
    prevFilterSortRef.current = { themeFilter, sort, pinSolvedToTop };
    if (
      prev &&
      (prev.themeFilter !== themeFilter || prev.sort !== sort || prev.pinSolvedToTop !== pinSolvedToTop)
    ) {
      savePuzzleListState({ scrollTop: 0 });
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = 0;
    }
  }, [themeFilter, sort, pinSolvedToTop]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    const scrollTop = getPuzzleListState().scrollTop;
    if (el && scrollTop != null && scrollTop > 0 && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      requestAnimationFrame(() => {
        if (el) el.scrollTop = scrollTop;
      });
    }
  }, [sortedPuzzles.length]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > 100);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        savePuzzleListState({ scrollTop: el.scrollTop });
      }, 150);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleScrollToTop = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    onSelectPuzzle(puzzle);
  };

  return (
    <Card className="flex w-full max-w-md max-h-[90dvh] sm:max-h-[32rem] mx-auto relative flex-col min-h-0 mb-4 sm:mb-6">
      <CardHeader className="p-4 pb-2 sm:p-4 sm:pb-3 space-y-0 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 -ml-1"
            onClick={onBack}
            aria-label="Back to menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Puzzles</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {solvedSet.size} of {PUZZLES.length} solved
              </p>
            </div>
            {solvedSet.size > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 shrink-0 ${pinSolvedToTop ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => setPinSolvedToTop((p) => !p)}
                aria-label={pinSolvedToTop ? "Unpin solved from top" : "Pin solved to top"}
              >
                <Pin className={`h-4 w-4 ${pinSolvedToTop ? "fill-current" : ""}`} />
              </Button>
            )}
          </div>
          {solvedSet.size > 0 && (
            <Popover open={resetPopoverOpen} onOpenChange={setResetPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  aria-label="Reset all puzzle progress"
                >
                  <RotateCcw className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <p className="text-sm text-muted-foreground mb-4">
                  Reset all puzzle progress? You will need to solve them again.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmReset}
                  >
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 gap-3 sm:gap-4 pt-0 overflow-hidden">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort</label>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortOption)}
            >
              <SelectTrigger className="min-h-[44px] sm:min-h-[36px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating-asc">Rating: Low to High</SelectItem>
                <SelectItem value="rating-desc">Rating: High to Low</SelectItem>
                <SelectItem value="theme-asc">Theme: A–Z</SelectItem>
                <SelectItem value="theme-desc">Theme: Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-1 px-1"
        >
          <div
            className="relative w-full"
            style={{ height: totalHeight }}
          >
            {visibleItems.map(({ item: puzzle, offsetTop }) => {
              const isSolved = solvedSet.has(puzzle.id);
              const showPinnedBadge = isSolved && pinSolvedToTop;
              return (
                <div
                  key={puzzle.id}
                  className="absolute left-0 right-0"
                  style={{
                    top: offsetTop,
                    height: LIST_ITEM_HEIGHT,
                  }}
                >
                  {showPinnedBadge && (
                    <span className="absolute top-1.5 right-2 opacity-50 pointer-events-none" aria-hidden>
                      <Pin className="h-3.5 w-3.5 rotate-[-25deg]" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectPuzzle(puzzle)}
                    className="w-full h-full flex items-center gap-3 rounded-lg border bg-muted/30 hover:bg-muted/50 active:bg-muted/70 transition-colors px-3 text-left"
                  >
                    <span
                      className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs border ${isSolved
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-muted-foreground/30"
                        }`}
                    >
                      {isSolved ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex gap-1 overflow-hidden">
                        {(themeFilter !== "all" && puzzle.themes.includes(themeFilter)
                          ? [themeFilter, ...puzzle.themes.filter((t) => t !== themeFilter)]
                          : puzzle.themes
                        )
                          .slice(0, 2)
                          .map((theme) => {
                            const themeData = PUZZLE_THEMES.find((pt) => pt.value === theme);
                            const label = themeData?.label ?? theme;
                            const color = themeData?.color ?? "bg-muted text-muted-foreground";
                            return (
                              <span
                                key={theme}
                                className={`inline-flex items-center shrink-0 rounded px-2 py-0.5 text-xs font-medium ${color}`}
                              >
                                {label}
                              </span>
                            );
                          })}
                        {puzzle.themes.length > 2 && (
                          <span className="inline-flex items-center shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            +{puzzle.themes.length - 2}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Rating {puzzle.rating} · {Math.floor(puzzle.moves.length / 2)} move{Math.floor(puzzle.moves.length / 2) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <Button
        onClick={handleScrollToTop}
        size="sm"
        className={`absolute bottom-7 left-7 shadow-lg z-10 transition-all duration-200 ${showScrollTop
          ? "opacity-80 translate-y-0 hover:opacity-100"
          : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </Card>
  );
}

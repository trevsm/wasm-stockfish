import { useRef, useEffect, useState } from "react";
import { Lightbulb, List, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePuzzleLogic } from "@/hooks/usePuzzleLogic";
import type { Puzzle } from "@/types";
import { MoveHistoryDisplay } from "./MoveHistoryDisplay";
import { NotationGuide } from "./NotationGuide";
import { ChessKeyboard } from "./ChessKeyboard";
import { PUZZLE_THEMES } from "@/data/puzzles";

export interface PuzzleScreenProps {
  puzzle: Puzzle;
  onBack: () => void;
  onSolved: () => void;
}

function formatThemes(themes: Puzzle["themes"]): string {
  return themes
    .map((t) => PUZZLE_THEMES.find((pt) => pt.value === t)?.label ?? t)
    .join(", ");
}

export function PuzzleScreen({ puzzle, onBack, onSolved }: PuzzleScreenProps) {
  const {
    chess,
    moveHistory,
    moveInput,
    setMoveInput,
    status,
    moveError,
    solved,
    isPlayerTurn,
    handleSubmitMove,
    handleShowHint,
    handleShowSolution,
    handleReset,
    handleBack,
    playerColor,
    progress,
  } = usePuzzleLogic({
    puzzle,
    onSolved,
    onBack,
  });

  const moveInputRef = useRef<HTMLInputElement>(null);
  const prevIsPlayerTurn = useRef(isPlayerTurn);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.matchMedia("(max-width: 640px)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && isPlayerTurn && !prevIsPlayerTurn.current) {
      moveInputRef.current?.focus();
    }
    prevIsPlayerTurn.current = isPlayerTurn;
  }, [isPlayerTurn, isMobile]);

  const handleChessKey = (key: string) => {
    if (isPlayerTurn && !solved) {
      setMoveInput((prev) => prev + key);
    }
  };

  const handleBackspace = () => {
    if (isPlayerTurn && !solved) {
      setMoveInput((prev) => prev.slice(0, -1));
    }
  };

  const handleKeyboardSubmit = () => {
    if (isPlayerTurn && !solved) {
      handleSubmitMove({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  if (!chess) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto relative">
      <CardHeader className="pb-2 sm:pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl">Puzzle — {formatThemes(puzzle.themes)}</CardTitle>
            <p className="text-sm text-muted-foreground">
              You play {playerColor}. {!solved && `Move ${progress}`} · Rating {puzzle.rating}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9 shrink-0">
                <List className="h-4 w-4" />
                <span className="sr-only">Puzzle actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {!solved && isPlayerTurn && (
                <DropdownMenuItem
                  className="min-h-[44px] sm:min-h-0 sm:py-1.5"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleShowHint();
                  }}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Show hint
                </DropdownMenuItem>
              )}
              {!solved && (
                <DropdownMenuItem
                  className="min-h-[44px] sm:min-h-0 sm:py-1.5"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleShowSolution();
                  }}
                >
                  Show solution
                </DropdownMenuItem>
              )}
              {(moveHistory.length > 0 || solved) && (
                <DropdownMenuItem
                  className="min-h-[44px] sm:min-h-0 sm:py-1.5"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleReset();
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset puzzle
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="min-h-[44px] sm:min-h-0 sm:py-1.5"
                onClick={handleBack}
              >
                Back to puzzles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MoveHistoryDisplay
          moveHistory={moveHistory}
          chess={chess}
          status={status}
          moveError={moveError}
          statusIsSuccess={solved}
          defaultShowBoard
        />

        {!solved && (isMobile ? (
          <div className="space-y-3">
            <div
              className={`flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background ${
                !isPlayerTurn ? "opacity-50" : ""
              }`}
            >
              <span className={moveInput ? "text-foreground" : "text-muted-foreground"}>
                {moveInput ||
                  (moveHistory.length === 0
                    ? "Your move (e.g. e4, Nf3)"
                    : "Your move")}
              </span>
            </div>
            <ChessKeyboard
              input={moveInput}
              chess={chess}
              onKey={handleChessKey}
              onBackspace={handleBackspace}
              onSubmit={handleKeyboardSubmit}
              disabled={!isPlayerTurn}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmitMove} className="flex gap-2">
            <input
              ref={moveInputRef}
              type="text"
              placeholder={
                moveHistory.length === 0
                  ? "Your move (e.g. e4, Nf3)"
                  : "Your move"
              }
              value={moveInput}
              onChange={(e) => {
                if (isPlayerTurn) setMoveInput(e.target.value);
              }}
              readOnly={!isPlayerTurn}
              autoComplete="off"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                !isPlayerTurn ? "opacity-50" : ""
              }`}
            />
            <Button
              type="submit"
              disabled={!isPlayerTurn}
              className="shrink-0"
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
            >
              Play
            </Button>
          </form>
        ))}

        {solved && (
          <Button
            onClick={handleBack}
            className="min-h-[44px] w-full sm:w-auto sm:min-h-0"
          >
            Back to puzzles
          </Button>
        )}

        <NotationGuide />
      </CardContent>
    </Card>
  );
}

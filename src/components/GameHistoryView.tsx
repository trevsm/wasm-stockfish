import { useState, useMemo } from "react";
import { Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteGameRecord } from "@/lib/storage";
import type { GameRecord } from "@/types";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function resultLabel(result: GameRecord["result"]): string {
  switch (result) {
    case "win":
      return "You won";
    case "loss":
      return "Stockfish won";
    case "draw":
      return "Draw";
    case "resigned":
      return "Resigned";
    default:
      return result;
  }
}

interface GameHistoryViewProps {
  record: GameRecord;
  onBack: () => void;
}

export function GameHistoryView({ record, onBack }: GameHistoryViewProps) {
  const [showBoard, setShowBoard] = useState(false);
  const [moveIndex, setMoveIndex] = useState(-1); // -1 = starting position, 0 = after first move, etc.

  const handleDelete = () => {
    deleteGameRecord(record.id);
    onBack();
  };
  const moves = record.moves ?? [];

  // Build a Chess instance at the current move index
  const chess = useMemo(() => {
    const c = new Chess();
    const targetIndex = moveIndex === -1 ? -1 : Math.min(moveIndex, moves.length - 1);
    for (let i = 0; i <= targetIndex && i < moves.length; i++) {
      try {
        c.move(moves[i]);
      } catch {
        break;
      }
    }
    return c;
  }, [moves, moveIndex]);

  // Pair moves: (white, black), (white, black), ...
  const movePairs: string[][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i];
    const black = moves[i + 1];
    movePairs.push(black ? [white, black] : [white]);
  }

  // When board is shown, default to final position
  const handleToggleBoard = () => {
    if (!showBoard) {
      setMoveIndex(moves.length - 1);
    }
    setShowBoard(!showBoard);
  };

  const goToStart = () => setMoveIndex(-1);
  const goToEnd = () => setMoveIndex(moves.length - 1);
  const goBack = () => setMoveIndex((i) => Math.max(-1, i - 1));
  const goForward = () => setMoveIndex((i) => Math.min(moves.length - 1, i + 1));

  // Compute status message for current position
  const statusMessage = useMemo(() => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White";
      return `Checkmate — ${winner} wins`;
    }
    if (chess.isStalemate()) {
      return "Stalemate — Draw";
    }
    if (chess.isDraw()) {
      if (chess.isThreefoldRepetition()) return "Draw by threefold repetition";
      if (chess.isInsufficientMaterial()) return "Draw by insufficient material";
      return "Draw";
    }
    if (chess.isCheck()) {
      return `${chess.turn() === "w" ? "White" : "Black"} is in check`;
    }
    return null;
  }, [chess]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-lg sm:text-xl">Game — {record.difficulty}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {resultLabel(record.result)} · You played {record.playerColor} · {formatDate(record.date)}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0"
              aria-label="Delete game"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="min-h-[44px] sm:min-h-8 flex-1 sm:flex-initial"
            >
              Back
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Move history</p>
            {moves.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] sm:min-h-7 sm:min-w-0 sm:h-7 sm:px-2 px-3 text-muted-foreground"
                onClick={handleToggleBoard}
                onMouseDown={(e) => e.preventDefault()}
              >
                {showBoard ? (
                  <EyeOff className="h-4 w-4 mr-1" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                {showBoard ? "Hide" : "Board"}
              </Button>
            )}
          </div>
          {showBoard ? (
            <div className="space-y-2">
              <pre className="rounded-md border bg-muted/50 p-3 text-xs font-mono overflow-x-auto whitespace-pre [-webkit-overflow-scrolling:touch]">
                {chess.ascii()}
              </pre>
              {statusMessage && (
                <p className="text-sm font-medium text-destructive">{statusMessage}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToStart}
                    disabled={moveIndex === -1}
                    className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-0"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goBack}
                    disabled={moveIndex === -1}
                    className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-0"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goForward}
                    disabled={moveIndex >= moves.length - 1}
                    className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-0"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToEnd}
                    disabled={moveIndex >= moves.length - 1}
                    className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-0"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {moveIndex === -1 ? "Start" : `Move ${moveIndex + 1}/${moves.length}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="min-h-[80px] rounded-md border bg-muted/50 p-3 text-sm font-mono overflow-x-auto">
              {moves.length === 0 ? (
                <span className="text-muted-foreground">No moves recorded.</span>
              ) : (
                <div className="space-y-1">
                  {movePairs.map((pair, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                      <span className="flex gap-3">
                        <span
                          className={
                            record.playerColor === "white"
                              ? "text-primary font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {pair[0]}
                        </span>
                        {pair[1] && (
                          <span
                            className={
                              record.playerColor === "black"
                                ? "text-primary font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {pair[1]}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

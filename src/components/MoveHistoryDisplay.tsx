import { Eye, EyeOff } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Chess } from "chess.js";

interface MoveHistoryDisplayProps {
  moveHistory: Array<{ san: string; by: "player" | "engine" }>;
  chess: Chess;
  thinking?: boolean;
  status?: string;
  moveError?: string;
}

export function MoveHistoryDisplay({ moveHistory, chess, thinking, status, moveError }: MoveHistoryDisplayProps) {
  const [showBoard, setShowBoard] = useState(false);

  const movePairs = (() => {
    const pairs: Array<{
      white: { san: string; by: "player" | "engine" };
      black?: { san: string; by: "player" | "engine" };
    }> = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      const white = moveHistory[i];
      const black = moveHistory[i + 1];
      pairs.push({ white, black });
    }
    return pairs;
  })();

  const statusMessage = useMemo(() => {
    if (moveError) {
      return { text: moveError, isError: true };
    }
    if (status) {
      return { text: status, isError: true };
    }
    if (thinking) {
      return { text: "Stockfish is thinking…", isError: false };
    }
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White";
      return { text: `Checkmate — ${winner} wins`, isError: true };
    }
    if (chess.isStalemate()) {
      return { text: "Stalemate — Draw", isError: true };
    }
    if (chess.isDraw()) {
      if (chess.isThreefoldRepetition()) return { text: "Draw by threefold repetition", isError: true };
      if (chess.isInsufficientMaterial()) return { text: "Draw by insufficient material", isError: true };
      return { text: "Draw", isError: true };
    }
    if (chess.isCheck()) {
      return { text: `${chess.turn() === "w" ? "White" : "Black"} is in check`, isError: true };
    }
    return null;
  }, [chess, thinking, status, moveError]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Move history</p>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] min-w-[44px] sm:min-h-7 sm:min-w-0 sm:h-7 sm:px-2 px-3 text-muted-foreground"
          onClick={() => setShowBoard(!showBoard)}
          onMouseDown={(e) => e.preventDefault()}
        >
          {showBoard ? (
            <EyeOff className="h-4 w-4 mr-1" />
          ) : (
            <Eye className="h-4 w-4 mr-1" />
          )}
          {showBoard ? "Hide" : "Board"}
        </Button>
      </div>
      {showBoard ? (
        <pre className="rounded-md border bg-muted/50 p-3 text-xs font-mono overflow-x-auto whitespace-pre [-webkit-overflow-scrolling:touch]">
          {chess.ascii()}
        </pre>
      ) : (
        <div className="min-h-[80px] rounded-md border bg-muted/50 p-3 text-sm font-mono overflow-x-auto">
          {moveHistory.length === 0 ? (
            "No moves yet."
          ) : (
            <div className="space-y-1">
              {movePairs.map((pair, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-muted-foreground w-6 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="flex gap-3">
                    <span
                      className={
                        pair.white.by === "player"
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {pair.white.san}
                    </span>
                    {pair.black && (
                      <span
                        className={
                          pair.black.by === "player"
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {pair.black.san}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <p className={`text-sm font-medium min-h-[1.25rem] ${statusMessage?.isError ? "text-destructive" : "text-muted-foreground"}`}>
        {statusMessage?.text ?? "\u00A0"}
      </p>
    </div>
  );
}

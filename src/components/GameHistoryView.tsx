import { Trash2 } from "lucide-react";
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
  const handleDelete = () => {
    deleteGameRecord(record.id);
    onBack();
  };
  const moves = record.moves ?? [];
  // Pair moves: (white, black), (white, black), ...
  const movePairs: string[][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i];
    const black = moves[i + 1];
    movePairs.push(black ? [white, black] : [white]);
  }

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
          <p className="text-sm font-medium">Move history</p>
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
        </div>
      </CardContent>
    </Card>
  );
}

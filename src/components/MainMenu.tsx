import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteGameRecord, getGameRecords } from "@/lib/storage";
import type { DifficultyLevel, GameRecord, PlayerColor } from "@/types";
import { getApproxElo } from "@/types";

const DIFFICULTIES: DifficultyLevel[] = [
  "Novice",
  "Beginner",
  "Easy",
  "Medium",
  "Hard",
  "Expert",
];

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

interface MainMenuProps {
  onStartGame: (difficulty: DifficultyLevel, playerColor: PlayerColor) => void;
  onViewGame: (record: GameRecord) => void;
}

export function MainMenu({ onStartGame, onViewGame }: MainMenuProps) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Medium");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [records, setRecords] = useState(() => getGameRecords());

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteGameRecord(id);
    setRecords(getGameRecords());
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Text Chess vs Stockfish</CardTitle>
        <p className="text-sm text-muted-foreground">
          Play chess against Stockfish. Enter your moves in algebraic notation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Difficulty</label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as DifficultyLevel)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d} (~{getApproxElo(d)} Elo)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Your color</label>
          <Select
            value={playerColor}
            onValueChange={(v) => setPlayerColor(v as PlayerColor)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="black">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => onStartGame(difficulty, playerColor)}>
          Start game
        </Button>

        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Game history</p>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No games played yet.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {records.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center gap-1 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <button
                      type="button"
                      onClick={() => onViewGame(r)}
                      className="flex-1 flex justify-between items-center px-3 py-2 text-sm text-left cursor-pointer min-w-0"
                    >
                      <div>
                        <span className="font-medium">{r.difficulty}</span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span>{resultLabel(r.result)}</span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span className="text-muted-foreground">{r.playerColor}</span>
                      </div>
                      <span className="text-muted-foreground text-xs shrink-0 ml-2">
                        {formatDate(r.date)}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, r.id)}
                      aria-label="Delete game"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

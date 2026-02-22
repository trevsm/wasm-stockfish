import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGameLogic } from "@/hooks/useGameLogic";
import type { DifficultyLevel, PlayerColor } from "@/types";
import { MoveHistoryDisplay } from "./MoveHistoryDisplay";
import { NotationGuide } from "./NotationGuide";

export interface GameScreenProps {
  gameId: string;
  difficulty: DifficultyLevel;
  playerColor: PlayerColor;
  initialMoves?: Array<{ san: string; by: "player" | "engine" }>;
  initialDate?: string;
  onResign: () => void;
  onGameEnd: () => void;
}

export function GameScreen({
  gameId,
  difficulty,
  playerColor,
  initialMoves = [],
  initialDate,
  onResign,
  onGameEnd,
}: GameScreenProps) {
  const {
    chess,
    moveHistory,
    moveInput,
    setMoveInput,
    status,
    moveError,
    thinking,
    gameOver,
    ready,
    confirmingResign,
    setConfirmingResign,
    handleSubmitMove,
    handleResign,
    handleGameEndReturn,
    isPlayerTurn,
  } = useGameLogic({
    gameId,
    difficulty,
    playerColor,
    initialMoves,
    initialDate,
    onResign,
    onGameEnd,
  });

  return (
    <Card className="w-full max-w-md mx-auto relative">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Game vs Stockfish — {difficulty}</CardTitle>
            <p className="text-sm text-muted-foreground">
              You play {playerColor}. {!ready && "Loading engine…"}
            </p>
          </div>
          {!gameOver && (
            <DropdownMenu
              onOpenChange={(open) => !open && setConfirmingResign(false)}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={thinking}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!confirmingResign ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      setConfirmingResign(true);
                    }}
                  >
                    Resign
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive font-medium"
                      onClick={handleResign}
                    >
                      Confirm resign
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setConfirmingResign(false);
                      }}
                    >
                      Cancel
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MoveHistoryDisplay moveHistory={moveHistory} chess={chess} />

        {status && (
          <p className="text-sm font-medium text-destructive">{status}</p>
        )}
        {moveError && (
          <p className="text-sm font-medium text-destructive">{moveError}</p>
        )}

        {thinking && (
          <p className="text-sm text-muted-foreground">
            Stockfish is thinking…
          </p>
        )}

        {!gameOver && (
          <form onSubmit={handleSubmitMove} className="flex gap-2">
            <Input
              placeholder={moveHistory.length === 0 ? "Your move (e.g. e4, Nf3)" : "Your move"}
              value={moveInput}
              onChange={(e) => setMoveInput(e.target.value)}
              disabled={!isPlayerTurn || thinking || !ready}
            />
            <Button type="submit" disabled={!isPlayerTurn || thinking || !ready}>
              Play
            </Button>
          </form>
        )}

        {gameOver && (
          <Button onClick={handleGameEndReturn}>Back to menu</Button>
        )}

        <NotationGuide />
      </CardContent>
    </Card>
  );
}

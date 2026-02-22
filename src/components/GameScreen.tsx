import { useRef, useEffect } from "react";
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

  const moveInputRef = useRef<HTMLInputElement>(null);
  const prevIsPlayerTurn = useRef(isPlayerTurn);

  // Keep input focused when it becomes the player's turn (e.g. after engine move)
  // so mobile users can type their next move without tapping the input again.
  useEffect(() => {
    if (isPlayerTurn && !prevIsPlayerTurn.current) {
      moveInputRef.current?.focus();
    }
    prevIsPlayerTurn.current = isPlayerTurn;
  }, [isPlayerTurn]);

  return (
    <Card className="w-full max-w-md mx-auto relative">
      <CardHeader className="pb-2 sm:pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl">Game vs Stockfish — {difficulty}</CardTitle>
            <p className="text-sm text-muted-foreground">
              You play {playerColor}. {!ready && "Loading engine…"}
            </p>
          </div>
          {!gameOver && (
            <DropdownMenu
              onOpenChange={(open) => !open && setConfirmingResign(false)}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={thinking} className="h-11 w-11 sm:h-9 sm:w-9 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                {!confirmingResign ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive min-h-[44px] sm:min-h-0 sm:py-1.5"
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
                      className="text-destructive focus:text-destructive font-medium min-h-[44px] sm:min-h-0 sm:py-1.5"
                      onClick={handleResign}
                    >
                      Confirm resign
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="min-h-[44px] sm:min-h-0 sm:py-1.5"
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
        <MoveHistoryDisplay
          moveHistory={moveHistory}
          chess={chess}
          thinking={thinking}
          status={status}
          moveError={moveError}
        />

        {!gameOver && (
          <form onSubmit={handleSubmitMove} className="flex flex-col sm:flex-row gap-2">
            <Input
              ref={moveInputRef}
              placeholder={moveHistory.length === 0 ? "Your move (e.g. e4, Nf3)" : "Your move"}
              value={moveInput}
              onChange={(e) => {
                if (isPlayerTurn && !thinking && ready) setMoveInput(e.target.value);
              }}
              disabled={!ready}
              readOnly={!isPlayerTurn || thinking}
              autoComplete="off"
              spellCheck="false"
              autoCorrect="off"
              autoCapitalize="off"
              enterKeyHint="go"
              className={`text-base ${!isPlayerTurn || thinking ? "opacity-50" : ""}`}
            />
            <Button
              type="submit"
              disabled={!isPlayerTurn || thinking || !ready}
              className="min-h-[44px] sm:min-h-0 shrink-0"
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
            >
              Play
            </Button>
          </form>
        )}

        {gameOver && (
          <Button onClick={handleGameEndReturn} className="min-h-[44px] w-full sm:w-auto sm:min-h-0">
            Back to menu
          </Button>
        )}

        <NotationGuide />
      </CardContent>
    </Card>
  );
}

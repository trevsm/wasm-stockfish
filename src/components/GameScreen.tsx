import { Chess } from "chess.js";
import { useCallback, useEffect, useState } from "react";
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
import { useStockfish } from "@/hooks/useStockfish";
import {
  deleteActiveGame,
  saveActiveGame,
  saveGameRecord,
} from "@/lib/storage";
import type { DifficultyLevel, GameResult, PlayerColor } from "@/types";
import { DIFFICULTY_SETTINGS } from "@/types";

interface GameScreenProps {
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
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const { ready, getBestMove } = useStockfish(settings);
  const [chess] = useState(() => {
    const c = new Chess();
    if (initialMoves.length > 0) {
      for (const m of initialMoves) {
        c.move(m.san);
      }
    }
    return c;
  });
  const [moveHistory, setMoveHistory] = useState<
    Array<{ san: string; by: "player" | "engine" }>
  >(initialMoves);
  const [startDate] = useState(() => initialDate ?? new Date().toISOString());
  const [moveInput, setMoveInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [moveError, setMoveError] = useState<string>("");
  const [thinking, setThinking] = useState(false);
  const [gameOver, setGameOver] = useState<GameResult | null>(null);

  const applyEngineMove = useCallback(
    async (fen: string) => {
      setThinking(true);
      try {
        const uci = await getBestMove(fen);
        const move = chess.move({
          from: uci.slice(0, 2) as `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'}`,
          to: uci.slice(2, 4) as `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'}`,
          promotion: uci.length >= 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined,
        });
        if (move) {
          setMoveHistory((h) => [...h, { san: move.san, by: "engine" }]);
        }
      } finally {
        setThinking(false);
      }
    },
    [chess, getBestMove]
  );

  useEffect(() => {
    if (gameOver) return;
    const turn = chess.turn();
    const isEngineTurn =
      (playerColor === "white" && turn === "b") ||
      (playerColor === "black" && turn === "w");
    if (ready && isEngineTurn && !thinking) {
      applyEngineMove(chess.fen());
    }
  }, [
    ready,
    chess,
    playerColor,
    thinking,
    gameOver,
    applyEngineMove,
    moveHistory.length,
  ]);

  useEffect(() => {
    saveActiveGame({
      id: gameId,
      date: startDate,
      difficulty,
      playerColor,
      moves: moveHistory,
    });
  }, [gameId, startDate, difficulty, playerColor, moveHistory]);

  useEffect(() => {
    if (gameOver) return;
    if (chess.isCheckmate()) {
      const won = chess.turn() !== playerColor[0];
      setGameOver(won ? "win" : "loss");
      setStatus(won ? "Checkmate! You won!" : "Checkmate! Stockfish wins.");
    } else if (chess.isStalemate()) {
      setGameOver("draw");
      setStatus("Stalemate. Draw.");
    } else if (chess.isDraw()) {
      setGameOver("draw");
      setStatus("Draw.");
    } else if (chess.isCheck()) {
      setStatus("Check!");
    } else {
      setStatus("");
    }
  }, [chess, gameOver, playerColor, moveHistory.length]);

  const handleSubmitMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameOver || thinking || !ready) return;
    const turn = chess.turn();
    const isPlayerTurn =
      (playerColor === "white" && turn === "w") ||
      (playerColor === "black" && turn === "b");
    if (!isPlayerTurn) return;

    const move = chess.move(moveInput.trim());
    if (move) {
      setMoveHistory((h) => [...h, { san: move.san, by: "player" }]);
      setMoveInput("");
      setMoveError("");
    } else {
      setMoveError("Invalid move. Try again.");
    }
  };

  const handleResign = () => {
    const result: GameResult = "resigned";
    saveGameRecord({
      id: gameId,
      date: startDate,
      difficulty,
      result,
      moves: moveHistory.map((m) => m.san),
      playerColor,
    });
    deleteActiveGame(gameId);
    onResign();
  };

  const handleGameEndReturn = () => {
    if (gameOver) {
      saveGameRecord({
        id: gameId,
        date: startDate,
        difficulty,
        result: gameOver,
        moves: moveHistory.map((m) => m.san),
        playerColor,
      });
      deleteActiveGame(gameId);
      onGameEnd();
    }
  };

  const turn = chess.turn();
  const isPlayerTurn =
    (playerColor === "white" && turn === "w") ||
    (playerColor === "black" && turn === "b");

  const movePairs = (() => {
    const pairs: Array<{ white: { san: string; by: "player" | "engine" }; black?: { san: string; by: "player" | "engine" } }> = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      const white = moveHistory[i];
      const black = moveHistory[i + 1];
      pairs.push({ white, black });
    }
    return pairs;
  })();

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={thinking}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleResign}
                >
                  Resign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Move history</p>
          <div className="min-h-[80px] rounded-md border bg-muted/50 p-3 text-sm font-mono">
            {moveHistory.length === 0 ? (
              "No moves yet."
            ) : (
              <div className="space-y-1">
                {movePairs.map((pair, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-muted-foreground w-6 shrink-0">{i + 1}.</span>
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
        </div>

        {status && (
          <p className="text-sm font-medium text-destructive">{status}</p>
        )}
        {moveError && (
          <p className="text-sm font-medium text-destructive">{moveError}</p>
        )}

        {thinking && <p className="text-sm text-muted-foreground">Stockfish is thinking…</p>}

        {!gameOver && (
          <form onSubmit={handleSubmitMove} className="flex gap-2">
            <Input
              placeholder="Your move (e.g. e4, Nf3)"
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
      </CardContent>
    </Card>
  );
}

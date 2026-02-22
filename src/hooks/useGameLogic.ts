import { Chess } from "chess.js";
import { useCallback, useEffect, useState } from "react";
import { useStockfish } from "@/hooks/useStockfish";
import { getMoveErrorMessage } from "@/lib/moveValidation";
import {
  deleteActiveGame,
  saveActiveGame,
  saveGameRecord,
} from "@/lib/storage";
import type { DifficultyLevel, GameResult, PlayerColor } from "@/types";
import { DIFFICULTY_SETTINGS } from "@/types";

export interface UseGameLogicParams {
  gameId: string;
  difficulty: DifficultyLevel;
  playerColor: PlayerColor;
  initialMoves?: Array<{ san: string; by: "player" | "engine" }>;
  initialDate?: string;
  onResign: () => void;
  onGameEnd: () => void;
}

export function useGameLogic({
  gameId,
  difficulty,
  playerColor,
  initialMoves = [],
  initialDate,
  onResign,
  onGameEnd,
}: UseGameLogicParams) {
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
  const [confirmingResign, setConfirmingResign] = useState(false);

  const applyEngineMove = useCallback(
    async (fen: string) => {
      setThinking(true);
      try {
        const uci = await getBestMove(fen);
        const move = chess.move({
          from: uci.slice(0, 2) as `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}`,
          to: uci.slice(2, 4) as `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}`,
          promotion:
            uci.length >= 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined,
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

  const handleSubmitMove = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (gameOver || thinking || !ready) return;
      const turn = chess.turn();
      const isPlayerTurn =
        (playerColor === "white" && turn === "w") ||
        (playerColor === "black" && turn === "b");
      if (!isPlayerTurn) return;

      const input = moveInput.trim();
      if (!input) {
        setMoveError("Please enter a move.");
        return;
      }

      try {
        const move = chess.move(input);
        if (move) {
          setMoveHistory((h) => [...h, { san: move.san, by: "player" }]);
          setMoveInput("");
          setMoveError("");
        }
      } catch (err) {
        const errorMessage = getMoveErrorMessage(input, chess);
        setMoveError(errorMessage);
      }
    },
    [
      gameOver,
      thinking,
      ready,
      chess,
      playerColor,
      moveInput,
    ]
  );

  const handleResign = useCallback(() => {
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
  }, [gameId, startDate, difficulty, playerColor, moveHistory, onResign]);

  const handleGameEndReturn = useCallback(() => {
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
  }, [
    gameOver,
    gameId,
    startDate,
    difficulty,
    moveHistory,
    playerColor,
    onGameEnd,
  ]);

  const turn = chess.turn();
  const isPlayerTurn =
    (playerColor === "white" && turn === "w") ||
    (playerColor === "black" && turn === "b");

  return {
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
  };
}

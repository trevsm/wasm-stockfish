import { Chess } from "chess.js";
import { useCallback, useEffect, useState } from "react";
import { getMoveErrorMessage } from "@/lib/moveValidation";
import { markPuzzleSolved, unmarkPuzzleSolved, isPuzzleSolved } from "@/lib/storage";
import type { Puzzle } from "@/types";

function uciFromMove(move: { from: string; to: string; promotion?: string }): string {
  return move.from + move.to + (move.promotion || "");
}

export interface UsePuzzleLogicParams {
  puzzle: Puzzle;
  onSolved: () => void;
  onBack: () => void;
}

export function usePuzzleLogic({ puzzle, onSolved, onBack }: UsePuzzleLogicParams) {
  const [chess, setChess] = useState<Chess | null>(null);
  const [moveHistory, setMoveHistory] = useState<Array<{ san: string; by: "player" | "opponent" }>>([]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [moveInput, setMoveInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [moveError, setMoveError] = useState<string>("");
  const [solved, setSolved] = useState(false);

  const { fen, moves } = puzzle;
  // In Lichess puzzles, the first move is the opponent's setup move,
  // so the player is the OPPOSITE color of who moves first in the FEN
  const playerColor = fen.includes(" w ") ? "black" : "white";

  useEffect(() => {
    const c = new Chess(fen);
    setChess(c);
    setMoveHistory([]);
    setMoveIndex(0);
    setMoveInput("");
    setMoveError("");
    setStatus("");
    setSolved(false);
    
    // If puzzle is already solved, show the solution automatically
    if (isPuzzleSolved(puzzle.id)) {
      const history: Array<{ san: string; by: "player" | "opponent" }> = [];
      const solutionChess = new Chess(fen);
      for (let i = 0; i < moves.length; i++) {
        const uci = moves[i];
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.length >= 5 ? uci[4] : undefined;
        const m = solutionChess.move({
          from,
          to,
          promotion: promotion as "q" | "r" | "b" | "n" | undefined,
        } as Parameters<Chess["move"]>[0]);
        if (m) {
          history.push({ san: m.san, by: i % 2 === 0 ? "opponent" : "player" });
        }
      }
      setChess(solutionChess);
      setMoveHistory(history);
      setMoveIndex(moves.length);
      setSolved(true);
      setStatus("Solution: " + history.map((h) => h.san).join(", "));
    }
  }, [puzzle.id, fen, moves]);

  // Player moves at odd indices (1, 3, 5...), opponent at even (0, 2, 4...)
  const isPlayerTurn = chess && moveIndex < moves.length && moveIndex % 2 === 1;
  const totalPlayerMoves = Math.floor(moves.length / 2);

  const applyOpponentMove = useCallback(() => {
    if (!chess || moveIndex >= moves.length) return;
    const uci = moves[moveIndex];
    const from = uci.slice(0, 2) as `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}`;
    const to = uci.slice(2, 4) as `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}`;
    const promotion = uci.length >= 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;
    const move = chess.move({ from, to, promotion });
    if (move) {
      setMoveHistory((h) => [...h, { san: move.san, by: "opponent" }]);
      setMoveIndex((i) => i + 1);
    }
  }, [chess, moves, moveIndex]);

  useEffect(() => {
    if (!chess || solved) return;
    if (moveIndex >= moves.length) {
      setSolved(true);
      setStatus("Puzzle solved!");
      markPuzzleSolved(puzzle.id);
      onSolved();
      return;
    }
    // Opponent moves at even indices (0, 2, 4...)
    if (moveIndex % 2 === 0) {
      applyOpponentMove();
    }
  }, [chess, moveIndex, moves.length, solved, puzzle.id, applyOpponentMove, onSolved]);

  const handleSubmitMove = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!chess || solved || !isPlayerTurn) return;

      const input = moveInput.trim();
      if (!input) {
        setMoveError("Please enter a move.");
        return;
      }

      try {
        const move = chess.move(input);
        if (!move) return;

        const uci = uciFromMove(move);
        const expectedUci = moves[moveIndex];

        if (uci !== expectedUci) {
          chess.undo();
          setMoveError("Not quite. Try again.");
          return;
        }

        setMoveHistory((h) => [...h, { san: move.san, by: "player" }]);
        setMoveInput("");
        setMoveError("");
        setMoveIndex((i) => i + 1);
      } catch {
        const errorMessage = getMoveErrorMessage(input, chess);
        setMoveError(errorMessage);
      }
    },
    [chess, solved, isPlayerTurn, moveInput, moves, moveIndex]
  );

  const handleShowHint = useCallback(() => {
    if (!chess || !isPlayerTurn || moveIndex >= moves.length) return;
    const uci = moves[moveIndex];
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length >= 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;
    const move = chess.move({
      from,
      to,
      promotion,
    } as Parameters<Chess["move"]>[0]);
    if (move) {
      setMoveHistory((h) => [...h, { san: move.san, by: "player" }]);
      setMoveInput("");
      setMoveError("");
      setMoveIndex((i) => i + 1);
      setStatus("Hint: " + move.san);
    }
  }, [chess, isPlayerTurn, moveIndex, moves]);

  const handleReset = useCallback(() => {
    unmarkPuzzleSolved(puzzle.id);
    const c = new Chess(puzzle.fen);
    setChess(c);
    setMoveHistory([]);
    setMoveIndex(0);
    setMoveInput("");
    setMoveError("");
    setStatus("");
    setSolved(false);
  }, [puzzle.id, puzzle.fen]);

  const handleShowSolution = useCallback(() => {
    if (!chess || solved) return;
    const c = new Chess(puzzle.fen);
    const history: Array<{ san: string; by: "player" | "opponent" }> = [];
    for (let i = 0; i < moves.length; i++) {
      const uci = moves[i];
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length >= 5 ? uci[4] : undefined;
      const m = c.move({
        from,
        to,
        promotion: promotion as "q" | "r" | "b" | "n" | undefined,
      } as Parameters<Chess["move"]>[0]);
      if (m) {
        // Opponent at even indices, player at odd
        history.push({ san: m.san, by: i % 2 === 0 ? "opponent" : "player" });
      }
    }
    setChess(c);
    setMoveHistory(history);
    setMoveIndex(moves.length);
    setSolved(true);
    setStatus("Solution: " + history.map((h) => h.san).join(", "));
    setMoveInput("");
    setMoveError("");
    markPuzzleSolved(puzzle.id);
    onSolved();
  }, [chess, solved, puzzle.id, puzzle.fen, moves, onSolved]);

  return {
    chess,
    moveHistory,
    moveInput,
    setMoveInput,
    status,
    moveError,
    solved,
    isPlayerTurn: !!isPlayerTurn,
    handleSubmitMove,
    handleShowHint,
    handleShowSolution,
    handleReset,
    handleBack: onBack,
    playerColor,
    progress: totalPlayerMoves > 0
      ? `${Math.floor((moveIndex + 1) / 2)} of ${totalPlayerMoves}`
      : `1 of 1`,
  };
}

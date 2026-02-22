import { useMemo } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chess } from "chess.js";

interface ChessKeyboardProps {
  input: string;
  chess: Chess;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const PIECES = ["N", "B", "R", "Q", "K"];
const SYMBOLS = ["x", "O", "-", "+", "#", "="];

function getValidKeys(input: string, _chess: Chess): Set<string> {
  const valid = new Set<string>();
  const len = input.length;

  const isFile = (c: string) => FILES.includes(c);
  const isRank = (c: string) => RANKS.includes(c);
  const isPiece = (c: string) => PIECES.includes(c);

  // Empty input: can start with piece, file, or O (castling)
  if (len === 0) {
    PIECES.forEach((p) => valid.add(p));
    FILES.forEach((f) => valid.add(f));
    valid.add("O");
    return valid;
  }

  // Castling logic: O-O or O-O-O
  if (input.startsWith("O")) {
    if (input === "O") {
      valid.add("-");
      return valid;
    }
    if (input === "O-") {
      valid.add("O");
      return valid;
    }
    if (input === "O-O") {
      valid.add("-"); // for O-O-O
      valid.add("+");
      valid.add("#");
      return valid;
    }
    if (input === "O-O-") {
      valid.add("O");
      return valid;
    }
    if (input === "O-O-O" || input === "O-O+" || input === "O-O#" || 
        input === "O-O-O+" || input === "O-O-O#") {
      // Complete castling, maybe with check - nothing more valid
      return valid;
    }
  }

  const lastChar = input[len - 1];

  // After + or #: nothing more (move is complete)
  if (lastChar === "+" || lastChar === "#") {
    return valid;
  }

  // After = (promotion): piece choice (not K)
  if (lastChar === "=") {
    ["N", "B", "R", "Q"].forEach((p) => valid.add(p));
    return valid;
  }

  // After promotion piece (input contains =): + or # only
  if (input.includes("=") && isPiece(lastChar)) {
    valid.add("+");
    valid.add("#");
    return valid;
  }

  // After x (capture): must be followed by file
  if (lastChar === "x") {
    FILES.forEach((f) => valid.add(f));
    return valid;
  }

  // After a piece at start (N, B, R, Q, K): file, rank (disambiguation), or x
  if (len === 1 && isPiece(input[0])) {
    FILES.forEach((f) => valid.add(f));
    RANKS.forEach((r) => valid.add(r)); // for disambiguation like N3e4
    valid.add("x");
    return valid;
  }

  // Check if we have a complete destination square at the end
  const endsWithSquare = input.match(/[a-h][1-8]$/);
  
  if (isRank(lastChar)) {
    if (endsWithSquare) {
      // Move might be complete - allow check/checkmate symbols
      valid.add("+");
      valid.add("#");
      // Pawn promotion on 1st or 8th rank
      if (lastChar === "1" || lastChar === "8") {
        valid.add("=");
      }
      // Rare: could still continue with destination file for full disambiguation (Qd1e2)
      FILES.forEach((f) => valid.add(f));
    } else {
      // After disambiguation rank (e.g., N3), expect file or x
      FILES.forEach((f) => valid.add(f));
      valid.add("x");
    }
    return valid;
  }

  if (isFile(lastChar)) {
    // After a file: rank is always valid
    RANKS.forEach((r) => valid.add(r));
    // x is valid for captures (pawn: exd4, piece: Nexd4)
    valid.add("x");
    // Another file is valid for disambiguation if we haven't completed a square yet
    // e.g., Ra (could become Rae1) or Ne (could become Ned4)
    if (!endsWithSquare) {
      FILES.forEach((f) => valid.add(f));
    }
    return valid;
  }

  // After piece + disambiguation (e.g., N3, Nd, N3d, Nde)
  if (isPiece(input[0]) && len > 1) {
    // Could need file, rank, or x depending on context
    FILES.forEach((f) => valid.add(f));
    RANKS.forEach((r) => valid.add(r));
    valid.add("x");
    return valid;
  }

  // Fallback: allow common continuations
  FILES.forEach((f) => valid.add(f));
  RANKS.forEach((r) => valid.add(r));
  valid.add("x");

  return valid;
}

function canSubmit(input: string, chess: Chess): boolean {
  if (!input) return false;
  // Try to validate the move
  try {
    const testChess = new (chess.constructor as typeof Chess)(chess.fen());
    testChess.move(input);
    return true;
  } catch {
    return false;
  }
}

export function ChessKeyboard({ input, chess, onKey, onBackspace, onSubmit, disabled }: ChessKeyboardProps) {
  const validKeys = useMemo(() => getValidKeys(input, chess), [input, chess]);
  const submitEnabled = useMemo(() => canSubmit(input, chess), [input, chess]);

  const handleKey = (key: string) => {
    if (!disabled && validKeys.has(key)) onKey(key);
  };

  const baseKeyClass =
    "h-10 min-w-0 flex-1 px-0 text-sm font-medium touch-manipulation select-none transition-opacity";
  
  const getKeyClass = (key: string) => {
    const isValid = validKeys.has(key);
    return `${baseKeyClass} ${!isValid ? "opacity-25 pointer-events-none" : ""}`
  };

  return (
    <div className={`space-y-1.5 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Files: a-h */}
      <div className="flex gap-1">
        {FILES.map((f) => (
          <Button
            key={f}
            type="button"
            variant="outline"
            className={getKeyClass(f)}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Ranks: 1-8 */}
      <div className="flex gap-1">
        {RANKS.map((r) => (
          <Button
            key={r}
            type="button"
            variant="outline"
            className={getKeyClass(r)}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(r)}
          >
            {r}
          </Button>
        ))}
      </div>

      {/* Pieces + symbols + backspace */}
      <div className="flex gap-1">
        {PIECES.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            className={getKeyClass(p)}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(p)}
          >
            {p}
          </Button>
        ))}
        {SYMBOLS.map((s) => (
          <Button
            key={s}
            type="button"
            variant="outline"
            className={getKeyClass(s)}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(s)}
          >
            {s}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className={`${baseKeyClass} ${!input ? "opacity-25 pointer-events-none" : ""}`}
          onPointerDown={(e) => e.preventDefault()}
          onClick={onBackspace}
        >
          <Delete className="h-4 w-4" />
        </Button>
      </div>

      {/* Submit button */}
      <Button
        type="button"
        className={`w-full h-11 text-base font-medium transition-opacity ${!submitEnabled ? "opacity-50" : ""}`}
        onPointerDown={(e) => e.preventDefault()}
        onClick={onSubmit}
        disabled={disabled || !submitEnabled}
      >
        Play
      </Button>
    </div>
  );
}

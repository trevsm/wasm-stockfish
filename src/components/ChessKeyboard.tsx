import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChessKeyboardProps {
  onKey: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChessKeyboard({ onKey, onBackspace, onSubmit, disabled }: ChessKeyboardProps) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const pieces = ["N", "B", "R", "Q", "K"];
  const symbols = ["x", "O", "+", "="];

  const handleKey = (key: string) => {
    if (!disabled) onKey(key);
  };

  const keyClass =
    "h-10 min-w-0 flex-1 px-0 text-sm font-medium touch-manipulation select-none";

  return (
    <div className={`space-y-1.5 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Files: a-h */}
      <div className="flex gap-1">
        {files.map((f) => (
          <Button
            key={f}
            type="button"
            variant="outline"
            className={keyClass}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Ranks: 1-8 */}
      <div className="flex gap-1">
        {ranks.map((r) => (
          <Button
            key={r}
            type="button"
            variant="outline"
            className={keyClass}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(r)}
          >
            {r}
          </Button>
        ))}
      </div>

      {/* Pieces + symbols + backspace */}
      <div className="flex gap-1">
        {pieces.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            className={keyClass}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(p)}
          >
            {p}
          </Button>
        ))}
        {symbols.map((s) => (
          <Button
            key={s}
            type="button"
            variant="outline"
            className={keyClass}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => handleKey(s)}
          >
            {s === "O" ? "O" : s}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className={keyClass}
          onPointerDown={(e) => e.preventDefault()}
          onClick={onBackspace}
        >
          <Delete className="h-4 w-4" />
        </Button>
      </div>

      {/* Submit button */}
      <Button
        type="button"
        className="w-full h-11 text-base font-medium"
        onPointerDown={(e) => e.preventDefault()}
        onClick={onSubmit}
        disabled={disabled}
      >
        Play
      </Button>
    </div>
  );
}

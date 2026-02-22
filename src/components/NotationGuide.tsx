import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function NotationGuide() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(!showGuide)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showGuide ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Notation guide
      </button>

      {showGuide && (
        <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-2">
          <div>
            <p className="font-medium mb-1">Pieces</p>
            <p className="text-muted-foreground">
              K = King, Q = Queen, R = Rook, B = Bishop, N = Knight
            </p>
            <p className="text-muted-foreground">Pawns have no letter</p>
          </div>
          <div>
            <p className="font-medium mb-1">Moves</p>
            <p className="text-muted-foreground">
              <span className="font-mono">e4</span> — pawn to e4
            </p>
            <p className="text-muted-foreground">
              <span className="font-mono">Nf3</span> — knight to f3
            </p>
            <p className="text-muted-foreground">
              <span className="font-mono">Bxc6</span> — bishop captures on c6
            </p>
            <p className="text-muted-foreground">
              <span className="font-mono">exd5</span> — e-pawn captures on d5
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Special</p>
            <p className="text-muted-foreground">
              <span className="font-mono">O-O</span> — kingside castle
            </p>
            <p className="text-muted-foreground">
              <span className="font-mono">O-O-O</span> — queenside castle
            </p>
            <p className="text-muted-foreground">
              <span className="font-mono">e8=Q</span> — pawn promotes to queen
            </p>
          </div>
        </div>
      )}
    </>
  );
}

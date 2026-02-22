import type { Chess } from "chess.js";

function getPieceName(piece: string): string {
  const names: Record<string, string> = {
    k: "king",
    q: "queen",
    r: "rook",
    b: "bishop",
    n: "knight",
    p: "pawn",
  };
  return names[piece.toLowerCase()] || piece;
}

export function getMoveErrorMessage(input: string, chess: Chess): string {
  const legalMoves = chess.moves({ verbose: true });
  const legalSans = chess.moves();

  // Check for empty input
  if (!input) {
    return "Please enter a move.";
  }

  // Check if it looks like valid notation but the piece doesn't exist or can't move there
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
  type Square = `${(typeof files)[number]}${(typeof ranks)[number]}`;

  // Normalize input for checking
  const normalized = input.replace(/[+#]$/, "").replace(/=?[QRBN]$/, "");

  // Check for castling attempts
  if (input === "O-O" || input === "0-0" || input.toLowerCase() === "o-o") {
    const kingside = legalSans.find((m) => m === "O-O");
    if (!kingside) {
      if (chess.isCheck()) {
        return "Cannot castle while in check.";
      }
      const king = chess.get(chess.turn() === "w" ? "e1" : "e8");
      const rook = chess.get(chess.turn() === "w" ? "h1" : "h8");
      if (!king || king.type !== "k") {
        return "Cannot castle — king has moved.";
      }
      if (!rook || rook.type !== "r") {
        return "Cannot castle kingside — rook has moved or is missing.";
      }
      return "Cannot castle kingside — path is blocked or passes through check.";
    }
  }

  if (input === "O-O-O" || input === "0-0-0" || input.toLowerCase() === "o-o-o") {
    const queenside = legalSans.find((m) => m === "O-O-O");
    if (!queenside) {
      if (chess.isCheck()) {
        return "Cannot castle while in check.";
      }
      const king = chess.get(chess.turn() === "w" ? "e1" : "e8");
      const rook = chess.get(chess.turn() === "w" ? "a1" : "a8");
      if (!king || king.type !== "k") {
        return "Cannot castle — king has moved.";
      }
      if (!rook || rook.type !== "r") {
        return "Cannot castle queenside — rook has moved or is missing.";
      }
      return "Cannot castle queenside — path is blocked or passes through check.";
    }
  }

  // Check if it's a pawn move (starts with lowercase file or is just a square)
  const pawnMoveMatch = normalized.match(/^([a-h])?x?([a-h])([1-8])$/);
  if (pawnMoveMatch) {
    const targetFile = pawnMoveMatch[2];
    const targetRank = pawnMoveMatch[3];
    const targetSquare = `${targetFile}${targetRank}`;
    const sourceFile = pawnMoveMatch[1];

    // Find pawn moves to this square
    const pawnMoves = legalMoves.filter(
      (m) => m.piece === "p" && m.to === targetSquare
    );

    if (pawnMoves.length === 0) {
      const targetRankNum = parseInt(targetRank);
      const isWhite = chess.turn() === "w";

      // Check if there's a pawn on the same file that could theoretically move there
      const board = chess.board();
      const playerPawnsOnFile = board
        .flat()
        .filter(
          (p) =>
            p &&
            p.type === "p" &&
            p.color === chess.turn() &&
            p.square[0] === targetFile
        );

      if (playerPawnsOnFile.length > 0 && !sourceFile) {
        const pawn = playerPawnsOnFile[0]!;
        const pawnRank = parseInt(pawn.square[1]);

        // Check if the target square is where the pawn already is
        if (targetSquare === pawn.square) {
          return `Your pawn is already on ${targetSquare}.`;
        }

        // Check if trying to move backwards
        if (
          (isWhite && targetRankNum < pawnRank) ||
          (!isWhite && targetRankNum > pawnRank)
        ) {
          return `Pawns cannot move backwards.`;
        }

        // Check if trying to move too far
        const distance = Math.abs(targetRankNum - pawnRank);
        const startRank = isWhite ? 2 : 7;
        if (distance > 2) {
          return `Pawns can only move 1 square forward, or 2 from the starting position.`;
        }
        if (distance === 2 && pawnRank !== startRank) {
          return `Pawns can only move 2 squares from their starting position.`;
        }

        // Check if there's a piece blocking
        const targetPiece = chess.get(targetSquare as Square);
        if (targetPiece) {
          return `Cannot move pawn to ${targetSquare} — square is occupied. Pawns capture diagonally.`;
        }

        // Check if there's a piece blocking the path (for 2-square moves)
        if (distance === 2) {
          const intermediateRank = isWhite ? pawnRank + 1 : pawnRank - 1;
          const intermediateSquare =
            `${targetFile}${intermediateRank}` as Square;
          const blockingPiece = chess.get(intermediateSquare);
          if (blockingPiece) {
            return `Cannot move pawn to ${targetSquare} — path is blocked by ${blockingPiece.color === "w" ? "white" : "black"} ${getPieceName(blockingPiece.type)} on ${intermediateSquare}.`;
          }
        }
      }

      // Check if there's a piece blocking (no pawn on that file)
      const targetPiece = chess.get(targetSquare as Square);
      if (targetPiece && !sourceFile) {
        return `Cannot move pawn to ${targetSquare} — square is occupied. Pawns capture diagonally.`;
      }

      // Check if player has no pawn on that file
      if (playerPawnsOnFile.length === 0 && !sourceFile) {
        return `You don't have a pawn on the ${targetFile}-file.`;
      }

      // Check if it would leave king in check
      if (chess.isCheck()) {
        return `Invalid move — you must get out of check.`;
      }

      // Generic pawn move failure
      return `Cannot move pawn to ${targetSquare} — this move would leave your king in check.`;
    }

    if (sourceFile && pawnMoves.length > 0) {
      const fromFileMoves = pawnMoves.filter((m) => m.from[0] === sourceFile);
      if (fromFileMoves.length === 0) {
        return `No pawn on the ${sourceFile}-file can capture on ${targetSquare}.`;
      }
    }
  }

  // Check if it's a piece move (starts with piece letter)
  const pieceMoveMatch = normalized.match(
    /^([KQRBN])([a-h])?([1-8])?x?([a-h][1-8])$/
  );
  if (pieceMoveMatch) {
    const pieceType = pieceMoveMatch[1].toLowerCase();
    const disambigFile = pieceMoveMatch[2];
    const disambigRank = pieceMoveMatch[3];
    const targetSquare = pieceMoveMatch[4];

    const pieceName = getPieceName(pieceType);

    // Find all legal moves for this piece type to this square
    const pieceMoves = legalMoves.filter(
      (m) => m.piece === pieceType && m.to === targetSquare
    );

    if (pieceMoves.length === 0) {
      // Check if there's any piece of this type
      const board = chess.board();
      const playerPieces = board
        .flat()
        .filter(
          (p) => p && p.type === pieceType && p.color === chess.turn()
        );

      if (playerPieces.length === 0) {
        return `You don't have a ${pieceName} on the board.`;
      }

      // Check if the target square is occupied by own piece
      const targetPiece = chess.get(targetSquare as Square);
      if (targetPiece && targetPiece.color === chess.turn()) {
        return `Cannot move ${pieceName} to ${targetSquare} — square is occupied by your own ${getPieceName(targetPiece.type)}.`;
      }

      if (chess.isCheck()) {
        return `Cannot move ${pieceName} to ${targetSquare} — you must get out of check.`;
      }

      return `${pieceName} cannot move to ${targetSquare} — either no ${pieceName} can reach that square, or it would leave your king in check.`;
    }

    // Ambiguity check
    if (pieceMoves.length > 1 && !disambigFile && !disambigRank) {
      const fromSquares = pieceMoves.map((m) => m.from).join(" or ");
      return `Ambiguous move — multiple ${pieceName}s can move to ${targetSquare} (from ${fromSquares}).`;
    }
  }

  // Check for invalid notation patterns
  if (!/^[a-hKQRBNO0]/.test(input)) {
    return `Invalid notation.`;
  }

  // Check for promotion without reaching the back rank
  if (/=[QRBN]$/i.test(input)) {
    const promoRank = chess.turn() === "w" ? "8" : "1";
    if (!input.includes(promoRank)) {
      return `Promotion is only possible when a pawn reaches the ${promoRank === "8" ? "8th" : "1st"} rank.`;
    }
  }

  // Check if it looks like UCI notation (e.g., e2e4)
  if (/^[a-h][1-8][a-h][1-8]$/.test(input)) {
    return `"${input}" looks like UCI notation. Use standard algebraic notation instead.`;
  }

  // Generic fallback
  return `"${input}" is not a valid move.`;
}

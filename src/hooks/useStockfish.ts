import { useCallback, useEffect, useRef, useState } from "react";
import type { DifficultySettings } from "@/types";

const MOVETIME_MS = 1000;

export function useStockfish(settings: DifficultySettings) {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const resolveRef = useRef<((move: string) => void) | null>(null);
  const rejectRef = useRef<((err: Error) => void) | null>(null);

  const settingsKey =
    settings.type === "skill" ? `skill-${settings.level}` : `elo-${settings.elo}`;

  useEffect(() => {
    let isActive = true;
    const worker = new Worker("/stockfish.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<string>) => {
      if (!isActive) return;
      const line = typeof e.data === "string" ? e.data : String(e.data);
      if (line === "readyok") {
        setReady(true);
      } else if (line.startsWith("bestmove ")) {
        const parts = line.split(" ");
        const move = parts[1];
        if (move && move !== "(none)") {
          resolveRef.current?.(move);
          resolveRef.current = null;
          rejectRef.current = null;
        }
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      console.error("Stockfish worker error:", e.message, e);
    };

    // Use setTimeout to ensure the onmessage handler is fully attached
    // before sending commands (fixes race condition on fast devices)
    setTimeout(() => {
      if (!isActive) return;
      worker.postMessage("uci");

      if (settings.type === "skill") {
        worker.postMessage(`setoption name Skill Level value ${settings.level}`);
      } else {
        worker.postMessage("setoption name UCI_LimitStrength value true");
        worker.postMessage(`setoption name UCI_Elo value ${settings.elo}`);
      }

      worker.postMessage("ucinewgame");
      worker.postMessage("isready");
    }, 0);

    return () => {
      isActive = false;
      worker.onmessage = null;
      worker.onerror = null;
      worker.postMessage("quit");
      worker.terminate();
      workerRef.current = null;
      setReady(false);
    };
  }, [settingsKey]);

  const getBestMove = useCallback((fen: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Engine not initialized"));
        return;
      }

      resolveRef.current = resolve;
      rejectRef.current = reject;

      workerRef.current.postMessage("ucinewgame");
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go movetime ${MOVETIME_MS}`);
    });
  }, []);

  return { ready, getBestMove };
}

import { useCallback, useEffect, useRef, useState } from "react";

const MOVETIME_MS = 1000;

export function useStockfish(elo: number) {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const resolveRef = useRef<((move: string) => void) | null>(null);
  const rejectRef = useRef<((err: Error) => void) | null>(null);

  useEffect(() => {
    const worker = new Worker("/stockfish.js", { type: "module" });
    workerRef.current = worker;

    const handleMessage = (e: MessageEvent<string>) => {
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

    worker.addEventListener("message", handleMessage);

    worker.postMessage("uci");
    worker.postMessage("setoption name UCI_LimitStrength value true");
    worker.postMessage(`setoption name UCI_Elo value ${elo}`);
    worker.postMessage("ucinewgame");
    worker.postMessage("isready");

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.postMessage("quit");
      worker.terminate();
      workerRef.current = null;
      setReady(false);
    };
  }, [elo]);

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

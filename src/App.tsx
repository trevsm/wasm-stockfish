import { useEffect, useState } from "react";
import { GameScreen } from "@/components/GameScreen";
import { GameHistoryView } from "@/components/GameHistoryView";
import { MainMenu } from "@/components/MainMenu";
import { PuzzleList } from "@/components/PuzzleList";
import { PuzzleScreen } from "@/components/PuzzleScreen";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getPuzzleById } from "@/data/puzzles";
import {
  getActiveGame,
  getGameRecordById,
  saveActiveGame,
} from "@/lib/storage";
import type { DifficultyLevel, GameRecord, PlayerColor } from "@/types";
import type { Puzzle } from "@/types";

type Screen = "menu" | "game" | "history" | "puzzles" | "puzzle";

function getPath(): string {
  const path = window.location.pathname || "/";
  return path;
}

function parseRoute(path: string): { screen: Screen; gameId?: string; puzzleId?: string } {
  const p = path.replace(/\/$/, "") || "/";
  const gameMatch = p.match(/^\/game\/([a-zA-Z0-9-]+)$/);
  const historyMatch = p.match(/^\/history\/([a-zA-Z0-9-]+)$/);
  const puzzleMatch = p.match(/^\/puzzle\/([a-zA-Z0-9-]+)$/);
  if (gameMatch) return { screen: "game", gameId: gameMatch[1] };
  if (historyMatch) return { screen: "history", gameId: historyMatch[1] };
  if (puzzleMatch) return { screen: "puzzle", puzzleId: puzzleMatch[1] };
  if (p === "/puzzles") return { screen: "puzzles" };
  return { screen: "menu" };
}

function useRouteState() {
  useEffect(() => {
    const path = window.location.pathname;
    const valid =
      path === "/" ||
      path === "/puzzles" ||
      path.match(/^\/game\/[a-zA-Z0-9-]+$/) ||
      path.match(/^\/history\/[a-zA-Z0-9-]+$/) ||
      path.match(/^\/puzzle\/[a-zA-Z0-9-]+$/);
    if (!valid) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  const [state, setState] = useState(() => {
    const { screen, gameId, puzzleId } = parseRoute(getPath());
    if (screen === "game" && gameId) {
      const active = getActiveGame(gameId);
      const record = getGameRecordById(gameId);
      if (active) {
        return { screen: "game" as const, gameParams: active, gameId };
      }
      if (record) {
        return { screen: "history" as const, viewingRecord: record };
      }
    }
    if (screen === "history" && gameId) {
      const record = getGameRecordById(gameId);
      if (record) {
        return { screen: "history" as const, viewingRecord: record };
      }
    }
    if (screen === "puzzles") {
      return { screen: "puzzles" as const };
    }
    if (screen === "puzzle" && puzzleId) {
      const puzzle = getPuzzleById(puzzleId);
      if (puzzle) {
        return { screen: "puzzle" as const, puzzle };
      }
    }
    return { screen: "menu" as const };
  });

  useEffect(() => {
    const redirectToMenu = () => {
      if (window.location.pathname !== "/") {
        window.history.replaceState(null, "", "/");
      }
      setState({ screen: "menu" });
    };

    const syncFromUrl = () => {
      const { screen, gameId, puzzleId } = parseRoute(getPath());
      if (screen === "menu") {
        setState({ screen: "menu" });
        return;
      }
      if (screen === "puzzles") {
        setState({ screen: "puzzles" });
        return;
      }
      if (screen === "puzzle" && puzzleId) {
        const puzzle = getPuzzleById(puzzleId);
        if (puzzle) {
          setState({ screen: "puzzle", puzzle });
          return;
        }
      }
      if (screen === "game" && gameId) {
        const active = getActiveGame(gameId);
        const record = getGameRecordById(gameId);
        if (active) {
          setState({ screen: "game", gameParams: active, gameId });
          return;
        }
        if (record) {
          setState({ screen: "history", viewingRecord: record });
          return;
        }
      }
      if (screen === "history" && gameId) {
        const record = getGameRecordById(gameId);
        if (record) {
          setState({ screen: "history", viewingRecord: record });
          return;
        }
      }
      redirectToMenu();
    };

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  return { state, setState };
}

export default function App() {
  const { state, setState } = useRouteState();

  const navigateTo = (path: string, newState: Parameters<typeof setState>[0]) => {
    const url = path.startsWith("/") ? path : `/${path}`;
    window.history.pushState(null, "", url);
    setState(newState);
  };

  const handleStartGame = (difficulty: DifficultyLevel, playerColor: PlayerColor) => {
    const gameId = crypto.randomUUID();
    const date = new Date().toISOString();
    const gameParams = {
      id: gameId,
      date,
      difficulty,
      playerColor,
      moves: [] as Array<{ san: string; by: "player" | "engine" }>,
    };
    saveActiveGame(gameParams);
    navigateTo(`/game/${gameId}`, { screen: "game", gameParams, gameId });
  };

  const handleViewGameHistory = (record: GameRecord) => {
    navigateTo(`/history/${record.id}`, {
      screen: "history",
      viewingRecord: record,
    });
  };

  const handleResign = () => {
    navigateTo("/", { screen: "menu" });
  };

  const handleGameEnd = () => {
    navigateTo("/", { screen: "menu" });
  };

  const handleBack = () => {
    navigateTo("/", { screen: "menu" });
  };

  const handleOpenPuzzles = () => {
    navigateTo("/puzzles", { screen: "puzzles" });
  };

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    navigateTo(`/puzzle/${puzzle.id}`, { screen: "puzzle", puzzle });
  };

  const handlePuzzleBack = () => {
    navigateTo("/puzzles", { screen: "puzzles" });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 pt-12 sm:pt-6">
      <div className="absolute top-[max(0.5rem,env(safe-area-inset-top))] left-4 right-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">v{__APP_VERSION__}</span>
        <div className="-mr-2">
          <ThemeToggle />
        </div>
      </div>

      {state.screen === "menu" && (
        <MainMenu
          onStartGame={handleStartGame}
          onViewGame={handleViewGameHistory}
          onOpenPuzzles={handleOpenPuzzles}
        />
      )}

      {state.screen === "puzzles" && (
        <PuzzleList onSelectPuzzle={handleSelectPuzzle} onBack={handleBack} />
      )}

      {state.screen === "puzzle" && state.puzzle && (
        <PuzzleScreen
          puzzle={state.puzzle}
          onBack={handlePuzzleBack}
          onSolved={() => {}}
        />
      )}

      {state.screen === "game" && state.gameParams && state.gameId && (
        <GameScreen
          gameId={state.gameId}
          difficulty={state.gameParams.difficulty as DifficultyLevel}
          playerColor={state.gameParams.playerColor}
          initialMoves={state.gameParams.moves}
          initialDate={state.gameParams.date}
          onResign={handleResign}
          onGameEnd={handleGameEnd}
        />
      )}

      {state.screen === "history" && state.viewingRecord && (
        <GameHistoryView record={state.viewingRecord} onBack={handleBack} />
      )}
    </div>
  );
}

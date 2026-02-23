#!/usr/bin/env node
/**
 * Fetches real chess puzzles from chess-puzzles-api (Lichess data, CC0).
 * Run: node scripts/fetch-puzzles.js
 * Output: src/data/puzzles.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API = "https://chess-puzzles-api.vercel.app";

const THEME_TO_PUZZLE_THEME = {
  // Actual mate themes from Lichess
  mateIn1: "mateIn1",
  mateIn2: "mateIn2",
  mateIn3: "mateIn3",
  // Tactical themes
  fork: "fork",
  pin: "pin",
  skewer: "skewer",
  sacrifice: "sacrifice",
  deflection: "deflection",
  discoveredAttack: "discoveredAttack",
  clearance: "clearance",
  // Endgame themes
  endgame: "endgame",
  rookEndgame: "rookEndgame",
  pawnEndgame: "pawnEndgame",
  // Map some common Lichess themes to our categories
  crushing: "sacrifice",
  hangingPiece: "fork",
  trappedPiece: "pin",
  doubleCheck: "doubleCheck",
};

function mapThemes(apiThemes) {
  const themes = [];
  const seen = new Set();
  for (const t of apiThemes.split(/\s+/)) {
    const mapped = THEME_TO_PUZZLE_THEME[t];
    if (mapped && !seen.has(mapped)) {
      themes.push(mapped);
      seen.add(mapped);
    }
  }
  if (themes.length === 0) themes.push("endgame");
  return themes;
}

async function fetchPuzzles(themes = [], limit = 500, start = 0) {
  const params = new URLSearchParams({
    min_rating: "500",
    max_rating: "2500",
    limit: String(limit),
    start: String(start),
  });
  if (themes.length) params.set("themes", themes.join(","));
  const res = await fetch(`${API}/puzzles?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const TARGET = 10_000;
const BATCH = 500;

async function main() {
  const allPuzzles = new Map();

  // First fetch from general feed
  let start = 0;
  while (allPuzzles.size < TARGET) {
    const data = await fetchPuzzles([], BATCH, start);
    if (data.length === 0) break;

    for (const p of data) allPuzzles.set(p.PuzzleId, p);
    start += data.length;
    process.stdout.write(`\rFetched ${allPuzzles.size} / ${TARGET}...`);
    if (data.length < BATCH) break;
  }

  console.log("");

  const puzzles = Array.from(allPuzzles.values()).map((api) => {
    const moves = api.Moves.trim().split(/\s+/);
    const themes = mapThemes(api.Themes);
    return {
      id: api.PuzzleId,
      fen: api.FEN,
      moves,
      themes,
      rating: api.Rating,
    };
  });

  const outPath = path.join(__dirname, "..", "src", "data", "puzzles.json");
  fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
  console.log(`Wrote ${puzzles.length} puzzles to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

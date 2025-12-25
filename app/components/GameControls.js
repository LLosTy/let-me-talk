"use client";

import { Play, Pause, RotateCcw, X } from "lucide-react";
import { useGameState } from "./GameState";

export default function GameControls() {
  const { gameState, pauseGame, resetGame, exitGame } = useGameState();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
      <button
        onClick={pauseGame}
        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
        aria-label={gameState === "playing" ? "Pause" : "Play"}
        title={gameState === "playing" ? "Pause" : "Play"}
      >
        {gameState === "playing" ? (
          <Pause className="w-6 h-6 text-gray-800" />
        ) : (
          <Play className="w-6 h-6 text-gray-800" />
        )}
      </button>

      <button
        onClick={resetGame}
        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
        aria-label="Reset"
        title="Reset"
      >
        <RotateCcw className="w-6 h-6 text-gray-800" />
      </button>

      <button
        onClick={exitGame}
        className="p-2 hover:bg-red-200 rounded-md transition-colors"
        aria-label="Exit"
        title="Exit"
      >
        <X className="w-6 h-6 text-gray-800" />
      </button>
    </div>
  );
}


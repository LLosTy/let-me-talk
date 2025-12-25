"use client";

import { useState } from "react";
import { useGameState } from "./GameState";

export default function MainMenu() {
  const { settings, updateSettings, startGame } = useGameState();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key, value) => {
    let numValue = parseInt(value, 10);
    
    // Apply constraints
    if (key === "playerCount") {
      numValue = Math.max(2, Math.min(8, numValue));
    } else if (key === "invulnerabilityPeriod" || key === "jumpInAmount") {
      numValue = Math.max(1, numValue);
    } else if (key === "maxTime") {
      numValue = Math.max(10, numValue);
    }

    setLocalSettings((prev) => ({ ...prev, [key]: numValue }));
  };

  const handleStart = () => {
    updateSettings(localSettings);
    startGame();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Game Setup
        </h1>

        <div className="space-y-6">
          {/* Player Count */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Player Count (2-8)
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleChange("playerCount", localSettings.playerCount - 1)}
                disabled={localSettings.playerCount <= 2}
                className="px-4 py-2 bg-red-500 text-white rounded-md font-semibold text-xl hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="2"
                max="8"
                value={localSettings.playerCount}
                onChange={(e) => handleChange("playerCount", e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md text-center text-lg font-semibold text-black focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleChange("playerCount", localSettings.playerCount + 1)}
                disabled={localSettings.playerCount >= 8}
                className="px-4 py-2 bg-green-500 text-white rounded-md font-semibold text-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Invulnerability Period */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Invulnerability Period (seconds)
            </label>
            <input
              type="number"
              min="1"
              value={localSettings.invulnerabilityPeriod}
              onChange={(e) => handleChange("invulnerabilityPeriod", e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-md text-center text-lg font-semibold text-black focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Jump In Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jump In Amount (number of times per player)
            </label>
            <input
              type="number"
              min="1"
              value={localSettings.jumpInAmount}
              onChange={(e) => handleChange("jumpInAmount", e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-md text-center text-lg font-semibold text-black focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Max Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time Per Player (seconds - chess clock style)
            </label>
            <input
              type="number"
              min="10"
              value={localSettings.maxTime}
              onChange={(e) => handleChange("maxTime", e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-md text-center text-lg font-semibold text-black focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}


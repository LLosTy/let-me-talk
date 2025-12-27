"use client";

import { createContext, useContext, useState, useCallback } from "react";

const GameStateContext = createContext();

export function GameStateProvider({ children }) {
  // Pre-game settings
  const [settings, setSettings] = useState({
    invulnerabilityPeriod: 3, // seconds
    jumpInAmount: 3, // number of times each player can jump in
    maxTime: 60, // seconds - time each player gets (chess clock style)
    playerCount: 2, // min 2, max 8
  });

  // Game state
  const [gameState, setGameState] = useState("menu"); // "menu" | "playing" | "paused" | "ended"
  const [currentSpeaker, setCurrentSpeaker] = useState(0); // index of current speaker
  const [playerTimes, setPlayerTimes] = useState([]); // Array of remaining time per player (chess clock)
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const [gracePeriodTime, setGracePeriodTime] = useState(0);
  const [jumpInCounts, setJumpInCounts] = useState([]); // Array of remaining jump-ins per player

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Start game - uses latest settings to ensure proper initialization
  const startGame = useCallback(() => {
    setGameState("playing");
    setCurrentSpeaker(0);
    // Get the latest settings to ensure arrays are properly sized
    // Use functional update to read the most recent settings
    setSettings((currentSettings) => {
      // Initialize each player with their max time (chess clock)
      const times = Array(currentSettings.playerCount).fill(
        currentSettings.maxTime
      );
      setPlayerTimes(times);
      // Initialize jump-in counts for all players
      const jumps = Array(currentSettings.playerCount).fill(
        currentSettings.jumpInAmount
      );
      setJumpInCounts(jumps);
      // Set grace period with latest settings
      setGracePeriodActive(true);
      setGracePeriodTime(currentSettings.invulnerabilityPeriod);
      return currentSettings;
    });
  }, []);

  // Pause game
  const pauseGame = useCallback(() => {
    setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState("menu");
    setCurrentSpeaker(0);
    setPlayerTimes([]);
    setGracePeriodActive(false);
    setGracePeriodTime(0);
    setJumpInCounts([]);
  }, []);

  // Exit game
  const exitGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Handle jump in
  const handleJumpIn = useCallback(
    (playerIndex) => {
      if (gameState !== "playing") return false;
      if (playerIndex === currentSpeaker) return false;
      if (gracePeriodActive) return false;
      if (jumpInCounts[playerIndex] <= 0) return false; // No jump-ins remaining
      if (playerTimes[playerIndex] <= 0) return false; // No time remaining

      // Jump in successful - switch to this player
      setCurrentSpeaker(playerIndex);
      setGracePeriodActive(true);
      setGracePeriodTime(settings.invulnerabilityPeriod);
      // Decrement jump-in count for this player
      setJumpInCounts((prev) => {
        const newCounts = [...prev];
        newCounts[playerIndex] = newCounts[playerIndex] - 1;
        return newCounts;
      });
      return true;
    },
    [
      gameState,
      currentSpeaker,
      gracePeriodActive,
      settings,
      jumpInCounts,
      playerTimes,
    ]
  );

  // End grace period early
  const endGracePeriod = useCallback(() => {
    if (gameState !== "playing") return;
    if (!gracePeriodActive) return;

    setGracePeriodActive(false);
    setGracePeriodTime(0);
  }, [gameState, gracePeriodActive]);

  // Handle speaker finish (next counter-clockwise)
  const handleSpeakerFinish = useCallback(() => {
    if (gameState !== "playing") return;

    // If grace period is active, end it early instead of finishing
    if (gracePeriodActive) {
      endGracePeriod();
      return;
    }

    // Move to next counter-clockwise player (going backwards)
    const nextSpeaker =
      (currentSpeaker - 1 + settings.playerCount) % settings.playerCount;
    setCurrentSpeaker(nextSpeaker);
    setGracePeriodActive(true);
    setGracePeriodTime(settings.invulnerabilityPeriod);
  }, [
    gameState,
    currentSpeaker,
    gracePeriodActive,
    settings.playerCount,
    settings.invulnerabilityPeriod,
    endGracePeriod,
  ]);

  // Update timers (chess clock style - only current speaker's time counts down)
  const updateTimers = useCallback(() => {
    if (gameState !== "playing") return;

    // Update grace period
    if (gracePeriodActive) {
      setGracePeriodTime((prev) => {
        if (prev <= 0.1) {
          setGracePeriodActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }

    // Update only the current speaker's timer (chess clock)
    setPlayerTimes((prev) => {
      const newTimes = [...prev];
      const currentTime = newTimes[currentSpeaker];

      if (currentTime <= 0.1) {
        // Current speaker's time is up - move to next counter-clockwise player
        const nextSpeaker =
          (currentSpeaker - 1 + settings.playerCount) % settings.playerCount;
        setCurrentSpeaker(nextSpeaker);
        setGracePeriodActive(true);
        setGracePeriodTime(settings.invulnerabilityPeriod);
        newTimes[currentSpeaker] = 0;
        return newTimes;
      }

      // Only count down if grace period is not active (or if we're counting down during grace period)
      // Actually, let's count down during grace period too, since they're speaking
      newTimes[currentSpeaker] = currentTime - 0.1;

      // Check if any player has time left
      const hasTimeLeft = newTimes.some((time) => time > 0);
      if (!hasTimeLeft) {
        // All players out of time - end game
        setGameState("ended");
      }

      return newTimes;
    });
  }, [
    gameState,
    gracePeriodActive,
    currentSpeaker,
    settings.playerCount,
    settings.invulnerabilityPeriod,
  ]);

  const value = {
    settings,
    updateSettings,
    gameState,
    currentSpeaker,
    playerTimes,
    gracePeriodActive,
    gracePeriodTime,
    jumpInCounts,
    startGame,
    pauseGame,
    resetGame,
    exitGame,
    handleJumpIn,
    handleSpeakerFinish,
    endGracePeriod,
    updateTimers,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameState must be used within GameStateProvider");
  }
  return context;
}

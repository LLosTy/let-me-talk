'use client';

import { useEffect } from 'react';
import { GameStateProvider, useGameState } from './components/GameState';
import SplitScreen from './components/SplitScreen';
import MainMenu from './components/MainMenu';
import GameControls from './components/GameControls';

function GameContent() {
  const { gameState, updateTimers } = useGameState();

  // Timer update loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      updateTimers();
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [gameState, updateTimers]);

  return (
    <main className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <div 
        className="aspect-square"
        style={{
          width: '100vw',
          maxWidth: '100vw',
        }}
      >
        <SplitScreen />
      </div>
      
      {gameState === 'menu' && <MainMenu />}
      
      {gameState !== 'menu' && <GameControls />}
    </main>
  );
}

export default function Home() {
  return (
    <GameStateProvider>
      <GameContent />
    </GameStateProvider>
  );
}

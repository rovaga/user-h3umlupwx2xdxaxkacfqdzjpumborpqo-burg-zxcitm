/**
 * IMPORTANT FOR AI:
 * - DO NOT modify this file.
 * - This is the stable entrypoint that never changes.
 * - All game logic must be in src/game/ and referenced via createGame.
 *
 * This file sets up the engine and launches the game.
 * The game implementation comes from src/game/index.ts which the AI can edit freely.
 */

import { Engine } from './engine/Engine';
import { createGame } from './game'; // <-- This path is fixed, AI edits src/game/index.ts

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Canvas element #game-canvas not found');
}

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.innerWidth < 768) ||
                 ('ontouchstart' in window);

// Create engine with mobile-optimized configuration
const engine = new Engine({
  canvas,
  enableShadows: !isMobile, // Disable shadows on mobile for better performance
  shadowMapSize: isMobile ? 512 : 2048, // Lower shadow resolution on mobile
  antialias: !isMobile, // Disable antialiasing on mobile
  maxPixelRatio: isMobile ? 1.5 : undefined, // Limit pixel ratio on mobile
});

// Create and run the game
const game = createGame(engine);
engine.run(game);

console.log('[Main] Game started');

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  engine.dispose();
});

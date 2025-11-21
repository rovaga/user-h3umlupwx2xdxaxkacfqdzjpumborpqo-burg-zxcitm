/**
 * IMPORTANT FOR AI:
 * - This is the ONLY game entrypoint that main.ts uses.
 * - You MUST export a `createGame` function that returns a Game instance.
 * - If you create new game files/folders, wire them up through this file.
 * - DO NOT create new top-level entry files outside of src/game/.
 *
 * RULES FOR AI DEVELOPMENT:
 * 1. All game code must live under src/game/
 * 2. This file must always export `createGame(engine: Engine): Game`
 * 3. Do not modify src/main.ts or src/engine/** files
 * 4. Use engine.scene, engine.camera, engine.input, engine.assetLoader
 * 5. Assets go in public/assets/current-game/ and are auto-discovered
 */

import type { Engine } from '../engine/Engine';
import type { Game } from '../engine/Types';
import { PlatformerGame } from './platformer/PlatformerGame';

/**
 * Main game creation function.
 * This is called by the engine to initialize the game.
 *
 * @param engine - The game engine instance
 * @returns A Game instance
 */
export function createGame(engine: Engine): Game {
  // You can switch between different games here
  // For example, based on query params or config:
  // const params = new URLSearchParams(window.location.search);
  // const mode = params.get('mode') || 'platformer';

  // For now, we just create the platformer game
  return new PlatformerGame(engine);
}

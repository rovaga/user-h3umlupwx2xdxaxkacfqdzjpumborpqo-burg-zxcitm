/**
 * IMPORTANT FOR AI:
 * - This file defines core engine types used throughout the project.
 * - DO NOT modify this file unless absolutely necessary.
 * - Game-specific types should go in src/game/types.ts instead.
 */

import * as THREE from 'three';

/**
 * Core game interface that all games must implement.
 * This is the contract between the engine and game modules.
 */
export interface Game {
  /**
   * Called every frame to update game logic.
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void;

  /**
   * Called when the game should clean up resources.
   */
  dispose(): void;

  /**
   * Optional: Called when window is resized.
   * @param width - New window width
   * @param height - New window height
   */
  onResize?(width: number, height: number): void;
}

/**
 * Input state tracking keyboard keys.
 */
export interface KeyState {
  [key: string]: boolean;
}

/**
 * Mouse state for pointer lock and movement tracking.
 */
export interface MouseState {
  locked: boolean;
  movementX: number;
  movementY: number;
}

/**
 * Configuration for the engine.
 */
export interface EngineConfig {
  canvas: HTMLCanvasElement;
  enableShadows?: boolean;
  shadowMapSize?: number;
  antialias?: boolean;
  maxPixelRatio?: number; // Maximum pixel ratio (useful for mobile optimization)
}

/**
 * Asset loader interface for discovering and loading game assets.
 */
export interface AssetLoader {
  /**
   * Get the URL for a specific asset by its relative path.
   * @param path - Relative path under the assets directory (e.g., 'sprites/player.png')
   */
  getUrl(path: string): string | undefined;

  /**
   * Get all available assets as a map of paths to URLs.
   */
  all(): Record<string, string>;

  /**
   * Load a texture from the asset path.
   * @param path - Relative path to the texture
   */
  loadTexture(path: string): Promise<THREE.Texture>;

  /**
   * Check if an asset exists.
   * @param path - Relative path to check
   */
  has(path: string): boolean;
}

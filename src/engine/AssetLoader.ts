/**
 * IMPORTANT FOR AI:
 * - This file handles asset discovery and loading.
 * - DO NOT modify this file.
 * - Games should use the AssetLoader instance provided by the Engine.
 */

import * as THREE from 'three';
import type { AssetLoader as IAssetLoader } from './Types';

/**
 * Asset loader that auto-discovers assets from the public/assets/current-game directory.
 * Uses Vite's import.meta.glob for automatic asset discovery.
 */
export class AssetLoader implements IAssetLoader {
  private assets: Record<string, string> = {};
  private textureLoader: THREE.TextureLoader;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.discoverAssets();
  }

  /**
   * Discover all assets using Vite's glob import.
   * This runs at build time and finds all files under /public/assets/current-game.
   */
  private discoverAssets(): void {
    try {
      // Vite's import.meta.glob with eager loading
      // This will be replaced at build time with actual file paths
      const assetModules = import.meta.glob('/public/assets/current-game/**/*', {
        eager: true,
        query: '?url',
        import: 'default',
      }) as Record<string, string>;

      // Convert absolute paths to relative paths
      // e.g., '/public/assets/current-game/sprites/player.png' -> 'sprites/player.png'
      for (const [fullPath, url] of Object.entries(assetModules)) {
        const relativePath = fullPath.replace('/public/assets/current-game/', '');
        this.assets[relativePath] = url;
      }

      console.log(`[AssetLoader] Discovered ${Object.keys(this.assets).length} assets`);
    } catch (error) {
      console.warn('[AssetLoader] No assets found or glob failed:', error);
    }
  }

  /**
   * Get the URL for a specific asset by its relative path.
   * @param path - Relative path under assets/current-game (e.g., 'sprites/player.png')
   */
  getUrl(path: string): string | undefined {
    return this.assets[path];
  }

  /**
   * Get all available assets.
   */
  all(): Record<string, string> {
    return { ...this.assets };
  }

  /**
   * Load a texture from an asset path.
   * @param path - Relative path to the texture
   */
  async loadTexture(path: string): Promise<THREE.Texture> {
    const url = this.getUrl(path);
    if (!url) {
      throw new Error(`[AssetLoader] Asset not found: ${path}`);
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Check if an asset exists.
   * @param path - Relative path to check
   */
  has(path: string): boolean {
    return path in this.assets;
  }

  /**
   * List all available asset paths.
   */
  list(): string[] {
    return Object.keys(this.assets);
  }
}

/**
 * IMPORTANT FOR AI:
 * - This is the stable engine layer that provides core functionality.
 * - DO NOT modify this file unless absolutely necessary.
 * - Games interact with the engine through the public API defined here.
 */

import * as THREE from 'three';
import type { Game, EngineConfig } from './Types';
import { Input } from './Input';
import { MobileInput } from './MobileInput';
import { AssetLoader } from './AssetLoader';

/**
 * Core game engine that manages the render loop, scene, camera, and renderer.
 * Provides a stable interface for games to build upon.
 */
export class Engine {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly input: Input;
  public readonly mobileInput: MobileInput;
  public readonly assetLoader: AssetLoader;

  private game: Game | null = null;
  private lastTime: number = 0;
  private animationId: number | null = null;
  private canvas: HTMLCanvasElement;
  private config: EngineConfig;
  private isContextLost: boolean = false;
  private targetFPS: number = 60;
  private frameInterval: number = 1000 / 60; // 60 FPS default
  private lastFrameTime: number = 0;

  constructor(config: EngineConfig) {
    this.config = config;
    this.canvas = config.canvas;
    
    // Limit frame rate on mobile devices to save battery and improve performance
    const isMobile = config.maxPixelRatio !== undefined;
    if (isMobile) {
      this.targetFPS = 30; // Target 30 FPS on mobile
      this.frameInterval = 1000 / 30;
    }

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    // Disable fog on mobile for better performance
    if (!isMobile) {
      this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80);
    }

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      antialias: config.antialias ?? true,
      powerPreference: 'high-performance', // Prefer performance over power savings
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Limit pixel ratio for mobile devices to improve performance
    const pixelRatio = config.maxPixelRatio 
      ? Math.min(window.devicePixelRatio, config.maxPixelRatio)
      : window.devicePixelRatio;
    this.renderer.setPixelRatio(pixelRatio);

    if (config.enableShadows ?? true) {
      this.renderer.shadowMap.enabled = true;
      // Use BasicShadowMap on mobile for better performance, PCFSoftShadowMap on desktop
      this.renderer.shadowMap.type = config.maxPixelRatio ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    }

    // WebGL context loss handling
    this.setupContextLossHandling();

    // Input setup
    this.input = new Input(config.canvas);
    this.mobileInput = new MobileInput();

    // Asset loader setup
    this.assetLoader = new AssetLoader();

    // Window resize handling
    window.addEventListener('resize', this.handleResize.bind(this));

    console.log('[Engine] Initialized');
  }

  /**
   * Setup WebGL context loss and restoration handling.
   */
  private setupContextLossHandling(): void {
    const gl = this.renderer.getContext();
    
    if (gl) {
      gl.canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.isContextLost = true;
        console.warn('[Engine] WebGL context lost');
      });

      gl.canvas.addEventListener('webglcontextrestored', () => {
        this.isContextLost = false;
        console.log('[Engine] WebGL context restored');
        // Reinitialize renderer settings
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = this.config.maxPixelRatio 
          ? Math.min(window.devicePixelRatio, this.config.maxPixelRatio)
          : window.devicePixelRatio;
        this.renderer.setPixelRatio(pixelRatio);
        if (this.config.enableShadows ?? true) {
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = this.config.maxPixelRatio ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
        }
      });
    }
  }

  /**
   * Handle window resize events.
   */
  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.game?.onResize) {
      this.game.onResize(width, height);
    }
  }

  /**
   * Main render loop.
   */
  private animate = (time: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Skip rendering if context is lost
    if (this.isContextLost) {
      return;
    }

    // Check if renderer context is still valid
    const gl = this.renderer.getContext();
    if (!gl || gl.isContextLost()) {
      this.isContextLost = true;
      return;
    }

    // Frame rate limiting for mobile devices
    const elapsed = time - this.lastFrameTime;
    if (elapsed < this.frameInterval) {
      return; // Skip this frame to maintain target FPS
    }
    this.lastFrameTime = time - (elapsed % this.frameInterval);

    // Calculate delta time in seconds
    const deltaTime = this.lastTime ? (time - this.lastTime) / 1000 : 0;
    this.lastTime = time;

    // Update game
    if (this.game) {
      this.game.update(deltaTime);
    }

    // Reset mouse delta after game update
    this.input.resetMouseDelta();

    // Ensure scene background is set (defensive check)
    if (!this.scene.background) {
      this.scene.background = new THREE.Color(0x87ceeb);
    }

    // Render
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      // If rendering fails, check for context loss
      if (gl && gl.isContextLost()) {
        this.isContextLost = true;
        console.warn('[Engine] Rendering failed - context lost');
      } else {
        console.error('[Engine] Rendering error:', error);
        // Try to recover by checking context again
        const currentGl = this.renderer.getContext();
        if (!currentGl || currentGl.isContextLost()) {
          this.isContextLost = true;
        }
      }
    }
  };

  /**
   * Start running a game.
   * @param game - The game instance to run
   */
  run(game: Game): void {
    if (this.game) {
      console.warn('[Engine] Stopping previous game');
      this.stop();
    }

    this.game = game;
    this.lastTime = 0;
    this.lastFrameTime = 0;
    console.log('[Engine] Starting game');
    this.animate(0);
  }

  /**
   * Stop the current game.
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.game) {
      this.game.dispose();
      this.game = null;
    }

    console.log('[Engine] Stopped');
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.stop();
    this.input.dispose();
    this.mobileInput.dispose();
    this.renderer.dispose();
    console.log('[Engine] Disposed');
  }

  /**
   * Helper: Create a basic directional light setup.
   * Common pattern that games can use.
   */
  createDefaultLighting(): {
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
  } {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.camera.left = -60;
    directional.shadow.camera.right = 60;
    directional.shadow.camera.top = 60;
    directional.shadow.camera.bottom = -60;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);

    return { ambient, directional };
  }
}

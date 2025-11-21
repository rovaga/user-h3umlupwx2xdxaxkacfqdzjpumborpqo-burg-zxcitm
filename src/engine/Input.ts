/**
 * IMPORTANT FOR AI:
 * - This file handles all input management (keyboard, mouse, pointer lock).
 * - DO NOT modify this file.
 * - Games should use the Input instance provided by the Engine.
 */

import type { KeyState, MouseState } from './Types';

/**
 * Input manager that tracks keyboard and mouse state.
 * Handles pointer lock for first-person camera controls.
 */
export class Input {
  private keys: KeyState = {};
  private mouse: MouseState = {
    locked: false,
    movementX: 0,
    movementY: 0,
  };
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer lock events
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouse.locked = document.pointerLockElement === this.canvas;
    });

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      if (this.mouse.locked) {
        this.mouse.movementX = e.movementX;
        this.mouse.movementY = e.movementY;
      }
    });
  }

  /**
   * Check if a specific key is currently pressed.
   * @param code - KeyCode (e.g., 'KeyW', 'Space', 'ArrowUp')
   */
  isKeyPressed(code: string): boolean {
    return this.keys[code] || false;
  }

  /**
   * Get all currently pressed keys.
   */
  getKeys(): KeyState {
    return this.keys;
  }

  /**
   * Check if pointer is locked.
   */
  isPointerLocked(): boolean {
    return this.mouse.locked;
  }

  /**
   * Get mouse movement delta since last frame.
   * Call resetMouseDelta() after reading to clear for next frame.
   */
  getMouseDelta(): { x: number; y: number } {
    return {
      x: this.mouse.movementX,
      y: this.mouse.movementY,
    };
  }

  /**
   * Reset mouse movement delta.
   * Should be called once per frame after reading mouse delta.
   */
  resetMouseDelta(): void {
    this.mouse.movementX = 0;
    this.mouse.movementY = 0;
  }

  /**
   * Clean up event listeners.
   */
  dispose(): void {
    // Note: We don't remove window event listeners as they're lightweight
    // and other instances might be using them
  }
}

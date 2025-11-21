/**
 * IMPORTANT FOR AI:
 * - This file handles mobile touch input (joystick, buttons, touch camera).
 * - DO NOT modify this file.
 * - Games should use the MobileInput instance provided by the Engine.
 */

import * as THREE from 'three';

interface TouchPosition {
  x: number;
  y: number;
}

/**
 * Mobile input handler for touch-based controls.
 * Provides virtual joystick, jump button, and touch-based camera rotation.
 */
export class MobileInput {
  private joystickActive = false;
  private joystickCenter: TouchPosition = { x: 0, y: 0 };
  private joystickCurrent: TouchPosition = { x: 0, y: 0 };
  private joystickTouchId: number | null = null;

  private cameraTouchId: number | null = null;
  private lastCameraTouch: TouchPosition = { x: 0, y: 0 };
  private cameraDelta: TouchPosition = { x: 0, y: 0 };

  private jumpPressed = false;

  private joystickElement: HTMLElement | null = null;
  private joystickKnobElement: HTMLElement | null = null;
  private jumpButtonElement: HTMLElement | null = null;

  constructor() {
    this.setupMobileControls();
    this.setupEventListeners();
  }

  private setupMobileControls(): void {
    // Check if controls already exist
    if (document.getElementById('mobile-controls')) return;

    const controlsHTML = `
      <div id="mobile-controls" style="display: none;">
        <!-- Virtual Joystick -->
        <div id="joystick" style="
          position: fixed;
          bottom: 80px;
          left: 60px;
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.2);
          border: 3px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          touch-action: none;
        ">
          <div id="joystick-knob" style="
            position: absolute;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          "></div>
        </div>

        <!-- Jump Button -->
        <button id="jump-button" style="
          position: fixed;
          bottom: 120px;
          right: 60px;
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 100, 0.3);
          border: 3px solid rgba(255, 255, 100, 0.6);
          border-radius: 50%;
          color: white;
          font-size: 16px;
          font-weight: bold;
          touch-action: none;
          user-select: none;
        ">JUMP</button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', controlsHTML);

    this.joystickElement = document.getElementById('joystick');
    this.joystickKnobElement = document.getElementById('joystick-knob');
    this.jumpButtonElement = document.getElementById('jump-button');

    // Show/hide based on orientation
    this.updateControlsVisibility();
  }

  private setupEventListeners(): void {
    // Joystick events
    if (this.joystickElement) {
      this.joystickElement.addEventListener('touchstart', this.handleJoystickStart.bind(this));
      this.joystickElement.addEventListener('touchmove', this.handleJoystickMove.bind(this));
      this.joystickElement.addEventListener('touchend', this.handleJoystickEnd.bind(this));
    }

    // Jump button events
    if (this.jumpButtonElement) {
      this.jumpButtonElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.jumpPressed = true;
      });
      this.jumpButtonElement.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.jumpPressed = false;
      });
    }

    // Camera touch (anywhere on screen except controls)
    document.addEventListener('touchstart', this.handleCameraTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleCameraTouchMove.bind(this));
    document.addEventListener('touchend', this.handleCameraTouchEnd.bind(this));

    // Orientation change
    window.addEventListener('resize', this.updateControlsVisibility.bind(this));
    window.addEventListener('orientationchange', this.updateControlsVisibility.bind(this));
  }

  private handleJoystickStart(e: TouchEvent): void {
    e.preventDefault();
    if (this.joystickTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;

    const rect = this.joystickElement!.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    this.joystickActive = true;
    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }

  private handleJoystickMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.joystickActive) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  private handleJoystickEnd(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickCurrent = { x: 0, y: 0 };
        this.resetJoystickKnob();
        break;
      }
    }
  }

  private updateJoystickPosition(touchX: number, touchY: number): void {
    const dx = touchX - this.joystickCenter.x;
    const dy = touchY - this.joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 35; // Half of joystick radius

    let finalX = dx;
    let finalY = dy;

    if (distance > maxDistance) {
      finalX = (dx / distance) * maxDistance;
      finalY = (dy / distance) * maxDistance;
    }

    // Normalize to -1 to 1
    this.joystickCurrent = {
      x: finalX / maxDistance,
      y: finalY / maxDistance,
    };

    // Update visual position
    if (this.joystickKnobElement) {
      this.joystickKnobElement.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;
    }
  }

  private resetJoystickKnob(): void {
    if (this.joystickKnobElement) {
      this.joystickKnobElement.style.transform = 'translate(-50%, -50%)';
    }
  }

  private handleCameraTouchStart(e: TouchEvent): void {
    // Ignore touches on controls
    const target = e.target as HTMLElement;
    if (target.closest('#mobile-controls')) return;

    if (this.cameraTouchId !== null) return;

    const touch = e.touches[0];
    this.cameraTouchId = touch.identifier;
    this.lastCameraTouch = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  private handleCameraTouchMove(e: TouchEvent): void {
    if (this.cameraTouchId === null) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === this.cameraTouchId) {
        this.cameraDelta = {
          x: touch.clientX - this.lastCameraTouch.x,
          y: touch.clientY - this.lastCameraTouch.y,
        };
        this.lastCameraTouch = {
          x: touch.clientX,
          y: touch.clientY,
        };
        break;
      }
    }
  }

  private handleCameraTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.cameraTouchId) {
        this.cameraTouchId = null;
        this.cameraDelta = { x: 0, y: 0 };
        break;
      }
    }
  }

  private updateControlsVisibility(): void {
    const controls = document.getElementById('mobile-controls');
    if (!controls) return;

    // Show on portrait mobile, hide on landscape/desktop
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = window.innerWidth < 768;

    controls.style.display = isPortrait && isMobile ? 'block' : 'none';
  }

  /**
   * Check if mobile controls are currently active/visible.
   */
  isMobileControlsActive(): boolean {
    const controls = document.getElementById('mobile-controls');
    return controls?.style.display === 'block';
  }

  /**
   * Get joystick movement vector (normalized -1 to 1).
   */
  getJoystickVector(): THREE.Vector2 {
    return new THREE.Vector2(this.joystickCurrent.x, -this.joystickCurrent.y);
  }

  /**
   * Check if jump button is pressed.
   */
  isJumpPressed(): boolean {
    return this.jumpPressed;
  }

  /**
   * Consume jump press (resets to false after reading once).
   */
  consumeJump(): boolean {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }

  /**
   * Get camera touch delta and reset.
   */
  getCameraDelta(): { x: number; y: number } {
    const delta = { ...this.cameraDelta };
    this.cameraDelta = { x: 0, y: 0 };
    return delta;
  }

  /**
   * Clean up event listeners.
   */
  dispose(): void {
    const controls = document.getElementById('mobile-controls');
    if (controls) {
      controls.remove();
    }
  }
}

/**
 * AI-EDITABLE: Player Controller
 *
 * This file contains the player character logic including movement,
 * camera controls, jumping, and collision detection.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Platform } from './Platform';
import { IngredientType } from './Ingredient';

export class Player {
  private engine: Engine;
  private mesh: THREE.Group; // Changed to Group to hold bun and ingredients
  private bunBottom: THREE.Mesh;
  private bunTop: THREE.Mesh;
  private indicator: THREE.Mesh;
  private collectedIngredients: THREE.Mesh[] = [];
  private collectedIngredientTypes: IngredientType[] = []; // Track ingredient types
  private ingredientStackHeight: number = 0;

  // Player state
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: number = 0;
  private onGround: boolean = false;

  // Player settings
  private readonly speed = 0.1;
  private readonly jumpForce = 0.4;
  private readonly gravity = -0.015;

  // Camera settings
  private cameraDistance = 8;
  private cameraHeight = 4;
  private cameraRotationY = 0;
  private cameraRotationX = 0.3;

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Create player group (hamburger)
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Optimize geometry complexity for mobile
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    const cylinderSegments = isMobile ? 8 : 16; // Reduce segments on mobile
    const coneSegments = isMobile ? 6 : 8;
    
    // Create bottom bun (brown cylinder)
    const bunBottomGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, cylinderSegments);
    const bunBottomMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574, // Golden brown bun color
      roughness: 0.7 
    });
    this.bunBottom = new THREE.Mesh(bunBottomGeometry, bunBottomMaterial);
    this.bunBottom.position.y = -0.15;
    this.bunBottom.castShadow = !isMobile; // Disable shadow casting on mobile
    this.mesh.add(this.bunBottom);

    // Create top bun (smaller, positioned above)
    const bunTopGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, cylinderSegments);
    const bunTopMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574,
      roughness: 0.7 
    });
    this.bunTop = new THREE.Mesh(bunTopGeometry, bunTopMaterial);
    this.bunTop.position.y = 0.25; // Will be adjusted as ingredients are added
    this.bunTop.castShadow = !isMobile; // Disable shadow casting on mobile
    this.mesh.add(this.bunTop);

    // Create direction indicator (yellow cone)
    const indicatorGeometry = new THREE.ConeGeometry(0.2, 0.4, coneSegments);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.position.z = 0.6;
    this.indicator.position.y = 0.25;
    this.mesh.add(this.indicator);

    console.log('[Player] Created as hamburger');
  }

  update(deltaTime: number, platforms: Platform[]): void {
    this.handleInput();
    this.applyPhysics();
    this.checkCollisions(platforms);
    this.updateMesh();
    this.updateCamera();
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    const moveDirection = new THREE.Vector3();

    // Get movement input (keyboard or mobile joystick)
    if (isMobile) {
      // Mobile joystick input
      const joystick = mobileInput.getJoystickVector();
      moveDirection.x = joystick.x;
      moveDirection.z = joystick.y;
    } else {
      // Keyboard input
      if (input.isKeyPressed('KeyW')) moveDirection.z += 1;
      if (input.isKeyPressed('KeyS')) moveDirection.z -= 1;
      if (input.isKeyPressed('KeyA')) moveDirection.x -= 1;
      if (input.isKeyPressed('KeyD')) moveDirection.x += 1;
    }

    // Apply movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      // Calculate movement relative to camera direction
      const angle = this.cameraRotationY;
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

      const worldMoveDirection = new THREE.Vector3();
      worldMoveDirection.addScaledVector(forward, moveDirection.z);
      worldMoveDirection.addScaledVector(right, moveDirection.x);
      worldMoveDirection.normalize();

      // Move player
      this.position.x += worldMoveDirection.x * this.speed;
      this.position.z += worldMoveDirection.z * this.speed;

      // Rotate player to face movement direction
      this.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
    }

    // Jump (keyboard or mobile button)
    const shouldJump = isMobile
      ? mobileInput.isJumpPressed()
      : input.isKeyPressed('Space');

    if (shouldJump && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    // Camera control (mouse or touch)
    if (isMobile) {
      // Mobile touch camera
      const touchDelta = mobileInput.getCameraDelta();
      this.cameraRotationY -= touchDelta.x * 0.005;
      this.cameraRotationX -= touchDelta.y * 0.005;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    } else if (input.isPointerLocked()) {
      // Mouse camera
      const mouseDelta = input.getMouseDelta();
      this.cameraRotationY -= mouseDelta.x * 0.002;
      this.cameraRotationX -= mouseDelta.y * 0.002;
      this.cameraRotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, this.cameraRotationX)
      );
    }
  }

  private applyPhysics(): void {
    // Apply gravity
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;

    // Reset to spawn if fallen off the world
    if (this.position.y < -10) {
      this.position.set(0, 5, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  private checkCollisions(platforms: Platform[]): void {
    this.onGround = false;

    for (const platform of platforms) {
      const bounds = platform.getBounds();
      const playerBottom = this.position.y - 0.3; // Adjusted for bun height
      const playerRadius = 0.5;

      // Check horizontal overlap
      if (
        this.position.x + playerRadius > bounds.min.x &&
        this.position.x - playerRadius < bounds.max.x &&
        this.position.z + playerRadius > bounds.min.z &&
        this.position.z - playerRadius < bounds.max.z
      ) {
        // Check vertical collision (landing on platform)
        if (
          playerBottom <= bounds.max.y &&
          playerBottom >= bounds.min.y &&
          this.velocity.y <= 0
        ) {
          this.position.y = bounds.max.y + 0.3;
          this.velocity.y = 0;
          this.onGround = true;
        }
      }
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  private updateCamera(): void {
    const camera = this.engine.camera;
    const cameraOffset = new THREE.Vector3();

    cameraOffset.x =
      Math.sin(this.cameraRotationY) *
      Math.cos(this.cameraRotationX) *
      this.cameraDistance;
    cameraOffset.y =
      Math.sin(this.cameraRotationX) * this.cameraDistance + this.cameraHeight;
    cameraOffset.z =
      Math.cos(this.cameraRotationY) *
      Math.cos(this.cameraRotationX) *
      this.cameraDistance;

    camera.position.copy(this.position).add(cameraOffset);

    // Prevent camera from going below ground
    if (camera.position.y < 0.5) {
      camera.position.y = 0.5;
    }

    camera.lookAt(this.position);
  }

  addIngredient(ingredientMesh: THREE.Mesh, height: number, ingredientType: IngredientType): void {
    // Disable shadow casting on mobile for better performance
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    ingredientMesh.castShadow = !isMobile;
    
    // Position ingredient on top of current stack (stack starts at top of bottom bun, y=0)
    ingredientMesh.position.y = this.ingredientStackHeight + height / 2;
    ingredientMesh.position.x = 0;
    ingredientMesh.position.z = 0;
    this.mesh.add(ingredientMesh);
    this.collectedIngredients.push(ingredientMesh);
    this.collectedIngredientTypes.push(ingredientType);
    this.ingredientStackHeight += height;
    
    // Move top bun and indicator higher to sit on top of ingredients
    this.bunTop.position.y = this.ingredientStackHeight + 0.1;
    this.indicator.position.y = this.ingredientStackHeight + 0.15;
    
    console.log(`[Player] Added ingredient ${ingredientType}. Stack height: ${this.ingredientStackHeight}`);
  }

  getIngredientList(): IngredientType[] {
    return [...this.collectedIngredientTypes];
  }

  resetIngredients(): void {
    // Remove all ingredient meshes from the scene
    for (const ingredient of this.collectedIngredients) {
      this.mesh.remove(ingredient);
      ingredient.geometry.dispose();
      (ingredient.material as THREE.Material).dispose();
    }
    
    // Clear arrays
    this.collectedIngredients = [];
    this.collectedIngredientTypes = [];
    this.ingredientStackHeight = 0;
    
    // Reset top bun and indicator positions
    this.bunTop.position.y = 0.25;
    this.indicator.position.y = 0.25;
    
    console.log('[Player] Ingredients reset - back to empty bun');
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRadius(): number {
    return 0.5;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.bunBottom.geometry.dispose();
    (this.bunBottom.material as THREE.Material).dispose();
    this.bunTop.geometry.dispose();
    (this.bunTop.material as THREE.Material).dispose();
    this.indicator.geometry.dispose();
    (this.indicator.material as THREE.Material).dispose();
    
    // Dispose collected ingredients
    for (const ingredient of this.collectedIngredients) {
      ingredient.geometry.dispose();
      (ingredient.material as THREE.Material).dispose();
    }
    
    console.log('[Player] Disposed');
  }
}

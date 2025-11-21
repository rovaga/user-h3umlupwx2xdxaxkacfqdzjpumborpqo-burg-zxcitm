/**
 * AI-EDITABLE: Burger Racing Vehicle
 *
 * This file contains the burger vehicle logic for the racing game.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export class BurgerVehicle {
  private engine: Engine;
  private mesh: THREE.Group;
  private bunBottom: THREE.Mesh;
  private bunTop: THREE.Mesh;
  private patty: THREE.Mesh;
  private cheese: THREE.Mesh;
  private lettuce: THREE.Mesh;
  private tomato: THREE.Mesh;

  // Vehicle state
  private position: THREE.Vector3;
  private rotation: number = 0;
  private speed: number = 0;
  private maxSpeed: number = 0.3;
  private acceleration: number = 0.008;
  private deceleration: number = 0.01;
  private turnSpeed: number = 0.03;
  private currentTurn: number = 0;

  // Camera settings
  private cameraDistance = 12;
  private cameraHeight = 6;
  private cameraRotationY = 0;
  private cameraRotationX = 0.2;

  constructor(engine: Engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 0.5, 0);

    // Create burger vehicle group
    this.mesh = new THREE.Group();
    engine.scene.add(this.mesh);

    // Optimize geometry complexity for mobile
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    const cylinderSegments = isMobile ? 8 : 16;
    
    // Bottom bun (base of vehicle)
    const bunBottomGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.4, cylinderSegments);
    const bunBottomMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574,
      roughness: 0.7 
    });
    this.bunBottom = new THREE.Mesh(bunBottomGeometry, bunBottomMaterial);
    this.bunBottom.position.y = -0.2;
    this.bunBottom.castShadow = !isMobile;
    this.mesh.add(this.bunBottom);

    // Patty (main body)
    const pattyGeometry = new THREE.CylinderGeometry(0.55, 0.6, 0.3, cylinderSegments);
    const pattyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.8 
    });
    this.patty = new THREE.Mesh(pattyGeometry, pattyMaterial);
    this.patty.position.y = 0.05;
    this.patty.castShadow = !isMobile;
    this.mesh.add(this.patty);

    // Cheese
    const cheeseGeometry = new THREE.CylinderGeometry(0.5, 0.55, 0.1, cylinderSegments);
    const cheeseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffd700,
      roughness: 0.4,
      metalness: 0.3
    });
    this.cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
    this.cheese.position.y = 0.25;
    this.cheese.castShadow = !isMobile;
    this.mesh.add(this.cheese);

    // Lettuce (wavy)
    const lettuceGeometry = new THREE.CylinderGeometry(0.52, 0.5, 0.15, cylinderSegments);
    const lettuceMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x90ee90,
      roughness: 0.9 
    });
    this.lettuce = new THREE.Mesh(lettuceGeometry, lettuceMaterial);
    this.lettuce.position.y = 0.375;
    this.lettuce.castShadow = !isMobile;
    this.mesh.add(this.lettuce);

    // Tomato
    const tomatoGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, cylinderSegments);
    const tomatoMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6347,
      roughness: 0.7 
    });
    this.tomato = new THREE.Mesh(tomatoGeometry, tomatoMaterial);
    this.tomato.position.y = 0.45;
    this.tomato.position.x = 0.2;
    this.tomato.castShadow = !isMobile;
    this.mesh.add(this.tomato);

    // Top bun
    const bunTopGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.25, cylinderSegments);
    const bunTopMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574,
      roughness: 0.7 
    });
    this.bunTop = new THREE.Mesh(bunTopGeometry, bunTopMaterial);
    this.bunTop.position.y = 0.575;
    this.bunTop.castShadow = !isMobile;
    this.mesh.add(this.bunTop);

    // Add wheels (4 wheels for a vehicle look)
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.5 
    });

    const wheelPositions = [
      { x: 0.4, y: -0.3, z: 0.4 },
      { x: -0.4, y: -0.3, z: 0.4 },
      { x: 0.4, y: -0.3, z: -0.4 },
      { x: -0.4, y: -0.3, z: -0.4 },
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = !isMobile;
      this.mesh.add(wheel);
    });

    console.log('[BurgerVehicle] Created racing burger');
  }

  update(deltaTime: number): void {
    this.handleInput();
    this.applyPhysics();
    this.updateMesh();
    this.updateCamera();
  }

  private handleInput(): void {
    const input = this.engine.input;
    const mobileInput = this.engine.mobileInput;
    const isMobile = mobileInput.isMobileControlsActive();

    let accelerate = false;
    let brake = false;
    let turnLeft = false;
    let turnRight = false;

    // Get input (keyboard or mobile)
    if (isMobile) {
      const joystick = mobileInput.getJoystickVector();
      accelerate = joystick.y < -0.3; // Forward on joystick
      brake = joystick.y > 0.3; // Backward on joystick
      turnLeft = joystick.x < -0.3;
      turnRight = joystick.x > 0.3;
    } else {
      accelerate = input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp');
      brake = input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown');
      turnLeft = input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft');
      turnRight = input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight');
    }

    // Acceleration
    if (accelerate) {
      this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
    } else if (brake) {
      this.speed = Math.max(this.speed - this.deceleration * 1.5, -this.maxSpeed * 0.5);
    } else {
      // Natural deceleration
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.deceleration);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.deceleration);
      }
    }

    // Turning (only when moving)
    if (Math.abs(this.speed) > 0.01) {
      if (turnLeft) {
        this.currentTurn = Math.max(-1, this.currentTurn - this.turnSpeed);
      } else if (turnRight) {
        this.currentTurn = Math.min(1, this.currentTurn + this.turnSpeed);
      } else {
        // Return to center
        if (this.currentTurn > 0) {
          this.currentTurn = Math.max(0, this.currentTurn - this.turnSpeed);
        } else if (this.currentTurn < 0) {
          this.currentTurn = Math.min(0, this.currentTurn + this.turnSpeed);
        }
      }
    } else {
      this.currentTurn = 0;
    }

    // Apply turning to rotation
    const turnAmount = this.currentTurn * Math.abs(this.speed) * 0.1;
    this.rotation += turnAmount;

    // Camera control (mouse or touch)
    if (isMobile) {
      const touchDelta = mobileInput.getCameraDelta();
      this.cameraRotationY -= touchDelta.x * 0.005;
      this.cameraRotationX -= touchDelta.y * 0.005;
      this.cameraRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotationX));
    } else if (input.isPointerLocked()) {
      const mouseDelta = input.getMouseDelta();
      this.cameraRotationY -= mouseDelta.x * 0.002;
      this.cameraRotationX -= mouseDelta.y * 0.002;
      this.cameraRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotationX));
    }
  }

  private applyPhysics(): void {
    // Move forward/backward based on rotation
    this.position.x += Math.sin(this.rotation) * this.speed;
    this.position.z += Math.cos(this.rotation) * this.speed;

    // Keep vehicle on track (simple boundary check)
    const boundary = 50;
    if (Math.abs(this.position.x) > boundary) {
      this.position.x = Math.sign(this.position.x) * boundary;
      this.speed *= 0.5; // Slow down when hitting boundary
    }
    if (Math.abs(this.position.z) > boundary) {
      this.position.z = Math.sign(this.position.z) * boundary;
      this.speed *= 0.5;
    }
  }

  private updateMesh(): void {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Add slight tilt when turning for visual effect
    const tiltAmount = this.currentTurn * 0.3;
    this.mesh.rotation.z = tiltAmount;
  }

  private updateCamera(): void {
    const camera = this.engine.camera;
    const cameraOffset = new THREE.Vector3();

    // Camera follows behind the vehicle
    cameraOffset.x = Math.sin(this.rotation + Math.PI) * this.cameraDistance;
    cameraOffset.y = this.cameraHeight;
    cameraOffset.z = Math.cos(this.rotation + Math.PI) * this.cameraDistance;

    camera.position.copy(this.position).add(cameraOffset);
    camera.lookAt(this.position);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getSpeed(): number {
    return this.speed;
  }

  getRotation(): number {
    return this.rotation;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.bunBottom.geometry.dispose();
    (this.bunBottom.material as THREE.Material).dispose();
    this.bunTop.geometry.dispose();
    (this.bunTop.material as THREE.Material).dispose();
    this.patty.geometry.dispose();
    (this.patty.material as THREE.Material).dispose();
    this.cheese.geometry.dispose();
    (this.cheese.material as THREE.Material).dispose();
    this.lettuce.geometry.dispose();
    (this.lettuce.material as THREE.Material).dispose();
    this.tomato.geometry.dispose();
    (this.tomato.material as THREE.Material).dispose();
    
    console.log('[BurgerVehicle] Disposed');
  }
}

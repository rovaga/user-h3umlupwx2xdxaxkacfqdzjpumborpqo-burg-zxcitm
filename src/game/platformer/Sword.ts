/**
 * AI-EDITABLE: Sword Collectible
 *
 * This file defines collectible swords that the player can collect.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum SwordType {
  IRON = 'iron',
  STEEL = 'steel',
  GOLD = 'gold',
  DIAMOND = 'diamond',
}

interface SwordConfig {
  type: SwordType;
  position: THREE.Vector3;
}

export class Sword {
  private engine: Engine;
  private mesh: THREE.Group; // Group to hold blade and handle
  private type: SwordType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.03;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.001;

  // Sword properties
  private static getGeometryComplexity(): { segments: number } {
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    return {
      segments: isMobile ? 6 : 12,
    };
  }

  private static readonly SWORD_CONFIGS = {
    [SwordType.IRON]: {
      bladeColor: 0xc0c0c0,
      handleColor: 0x8b4513,
      bladeLength: 1.2,
      bladeWidth: 0.15,
    },
    [SwordType.STEEL]: {
      bladeColor: 0x708090,
      handleColor: 0x654321,
      bladeLength: 1.3,
      bladeWidth: 0.12,
    },
    [SwordType.GOLD]: {
      bladeColor: 0xffd700,
      handleColor: 0xdaa520,
      bladeLength: 1.4,
      bladeWidth: 0.14,
    },
    [SwordType.DIAMOND]: {
      bladeColor: 0xb9f2ff,
      handleColor: 0x4169e1,
      bladeLength: 1.5,
      bladeWidth: 0.16,
    },
  };

  /**
   * Get the configuration for a sword type.
   */
  static getSwordConfig(type: SwordType) {
    return Sword.SWORD_CONFIGS[type];
  }

  constructor(engine: Engine, config: SwordConfig) {
    this.engine = engine;
    this.type = config.type;
    this.position = config.position.clone();

    const config_data = Sword.SWORD_CONFIGS[config.type];
    const { segments } = Sword.getGeometryComplexity();

    // Create sword group
    this.mesh = new THREE.Group();

    // Create blade (elongated box)
    const bladeGeometry = new THREE.BoxGeometry(
      config_data.bladeWidth,
      config_data.bladeLength,
      config_data.bladeWidth * 0.3
    );
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: config_data.bladeColor,
      roughness: 0.3,
      metalness: 0.8,
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = config_data.bladeLength / 2;
    this.mesh.add(blade);

    // Create crossguard (horizontal bar)
    const crossguardGeometry = new THREE.BoxGeometry(
      config_data.bladeWidth * 3,
      config_data.bladeWidth * 0.5,
      config_data.bladeWidth * 0.5
    );
    const crossguardMaterial = new THREE.MeshStandardMaterial({
      color: config_data.bladeColor,
      roughness: 0.3,
      metalness: 0.8,
    });
    const crossguard = new THREE.Mesh(crossguardGeometry, crossguardMaterial);
    crossguard.position.y = config_data.bladeLength * 0.1;
    this.mesh.add(crossguard);

    // Create handle (cylinder)
    const handleGeometry = new THREE.CylinderGeometry(
      config_data.bladeWidth * 0.4,
      config_data.bladeWidth * 0.4,
      config_data.bladeLength * 0.4,
      segments
    );
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: config_data.handleColor,
      roughness: 0.7,
      metalness: 0.1,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -config_data.bladeLength * 0.2;
    this.mesh.add(handle);

    // Create pommel (sphere at bottom of handle)
    const pommelGeometry = new THREE.SphereGeometry(
      config_data.bladeWidth * 0.5,
      segments,
      segments
    );
    const pommelMaterial = new THREE.MeshStandardMaterial({
      color: config_data.bladeColor,
      roughness: 0.3,
      metalness: 0.8,
    });
    const pommel = new THREE.Mesh(pommelGeometry, pommelMaterial);
    pommel.position.y = -config_data.bladeLength * 0.4;
    this.mesh.add(pommel);

    // Position the entire sword group
    this.mesh.position.copy(this.position);
    this.mesh.rotation.x = Math.PI / 2; // Lay sword flat horizontally

    // Disable shadows on mobile for better performance
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = !isMobile;
        child.receiveShadow = !isMobile;
      }
    });

    // Random float offset for variation
    this.floatOffset = Math.random() * Math.PI * 2;

    engine.scene.add(this.mesh);
    console.log(`[Sword] Created ${config.type} sword at`, config.position);
  }

  update(deltaTime: number): void {
    if (this.collected) return;

    // Rotate and float animation
    this.mesh.rotation.z += this.rotationSpeed;
    this.floatOffset += this.floatSpeed;
    this.mesh.position.y = this.position.y + Math.sin(this.floatOffset) * 0.15;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (this.collected) return false;

    const distance = this.mesh.position.distanceTo(playerPosition);
    const collectDistance = playerRadius + 0.5;

    if (distance < collectDistance) {
      this.collect();
      return true;
    }

    return false;
  }

  private collect(): void {
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    console.log(`[Sword] Collected ${this.type} sword`);
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): SwordType {
    return this.type;
  }

  createMeshForPlayer(): THREE.Group {
    // Create a new sword mesh for the player to hold
    const config_data = Sword.SWORD_CONFIGS[this.type];
    const { segments } = Sword.getGeometryComplexity();

    const swordGroup = new THREE.Group();

    // Create blade
    const bladeGeometry = new THREE.BoxGeometry(
      config_data.bladeWidth,
      config_data.bladeLength,
      config_data.bladeWidth * 0.3
    );
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: config_data.bladeColor,
      roughness: 0.3,
      metalness: 0.8,
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = config_data.bladeLength / 2;
    swordGroup.add(blade);

    // Create crossguard
    const crossguardGeometry = new THREE.BoxGeometry(
      config_data.bladeWidth * 3,
      config_data.bladeWidth * 0.5,
      config_data.bladeWidth * 0.5
    );
    const crossguardMaterial = new THREE.MeshStandardMaterial({
      color: config_data.bladeColor,
      roughness: 0.3,
      metalness: 0.8,
    });
    const crossguard = new THREE.Mesh(crossguardGeometry, crossguardMaterial);
    crossguard.position.y = config_data.bladeLength * 0.1;
    swordGroup.add(crossguard);

    // Create handle
    const handleGeometry = new THREE.CylinderGeometry(
      config_data.bladeWidth * 0.4,
      config_data.bladeWidth * 0.4,
      config_data.bladeLength * 0.4,
      segments
    );
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: config_data.handleColor,
      roughness: 0.7,
      metalness: 0.1,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -config_data.bladeLength * 0.2;
    swordGroup.add(handle);

    // Create pommel
    const pommelGeometry = new THREE.SphereGeometry(
      config_data.bladeWidth * 0.5,
      segments,
      segments
    );
    const pommelMaterial = new THREE.MeshStandardMaterial({
      color: config_data.bladeColor,
      roughness: 0.3,
      metalness: 0.8,
    });
    const pommel = new THREE.Mesh(pommelGeometry, pommelMaterial);
    pommel.position.y = -config_data.bladeLength * 0.4;
    swordGroup.add(pommel);

    return swordGroup;
  }

  getHeight(): number {
    return Sword.SWORD_CONFIGS[this.type].bladeLength;
  }

  dispose(): void {
    if (!this.collected && this.mesh) {
      this.engine.scene.remove(this.mesh);
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }
  }
}

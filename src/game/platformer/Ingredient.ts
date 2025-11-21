/**
 * AI-EDITABLE: Ingredient Collectible
 *
 * This file defines collectible ingredients that the hamburger player can collect.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

export enum IngredientType {
  LETTUCE = 'lettuce',
  BACON = 'bacon',
  CHEESE = 'cheese',
  TOMATO = 'tomato',
  PICKLE = 'pickle',
  ONION = 'onion',
}

interface IngredientConfig {
  type: IngredientType;
  position: THREE.Vector3;
}

export class Ingredient {
  private engine: Engine;
  private mesh: THREE.Mesh;
  private type: IngredientType;
  private position: THREE.Vector3;
  private collected: boolean = false;
  private rotationSpeed: number = 0.02;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.001;

  // Ingredient properties
  // Optimize geometry complexity for mobile devices
  private static getGeometryComplexity(): { cylinderSegments: number; sphereSegments: number } {
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    return {
      cylinderSegments: isMobile ? 6 : 8,
      sphereSegments: isMobile ? 6 : 8,
    };
  }

  private static readonly INGREDIENT_CONFIGS = {
    [IngredientType.LETTUCE]: {
      color: 0x90ee90,
      height: 0.15,
      geometry: () => {
        const { cylinderSegments } = Ingredient.getGeometryComplexity();
        return new THREE.CylinderGeometry(0.45, 0.5, 0.15, cylinderSegments);
      },
    },
    [IngredientType.BACON]: {
      color: 0xcd5c5c,
      height: 0.1,
      geometry: () => new THREE.BoxGeometry(0.5, 0.1, 0.4),
    },
    [IngredientType.CHEESE]: {
      color: 0xffd700,
      height: 0.12,
      geometry: () => new THREE.BoxGeometry(0.5, 0.12, 0.5),
    },
    [IngredientType.TOMATO]: {
      color: 0xff6347,
      height: 0.2,
      geometry: () => {
        const { sphereSegments } = Ingredient.getGeometryComplexity();
        return new THREE.SphereGeometry(0.25, sphereSegments, sphereSegments);
      },
    },
    [IngredientType.PICKLE]: {
      color: 0x32cd32,
      height: 0.3,
      geometry: () => {
        const { cylinderSegments } = Ingredient.getGeometryComplexity();
        return new THREE.CylinderGeometry(0.15, 0.15, 0.3, cylinderSegments);
      },
    },
    [IngredientType.ONION]: {
      color: 0xfff8dc,
      height: 0.2,
      geometry: () => {
        const { sphereSegments } = Ingredient.getGeometryComplexity();
        return new THREE.SphereGeometry(0.2, sphereSegments, sphereSegments);
      },
    },
  };

  /**
   * Get the configuration for an ingredient type.
   * Useful for creating previews or other visual representations.
   */
  static getIngredientConfig(type: IngredientType) {
    return Ingredient.INGREDIENT_CONFIGS[type];
  }

  constructor(engine: Engine, config: IngredientConfig) {
    this.engine = engine;
    this.type = config.type;
    this.position = config.position.clone();

    const config_data = Ingredient.INGREDIENT_CONFIGS[config.type];
    const geometry = config_data.geometry();
    const material = new THREE.MeshStandardMaterial({
      color: config_data.color,
      roughness: 0.6,
      metalness: config.type === IngredientType.CHEESE ? 0.3 : 0,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    // Disable shadows on mobile for better performance
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    this.mesh.castShadow = !isMobile;
    this.mesh.receiveShadow = !isMobile;

    // Random float offset for variation
    this.floatOffset = Math.random() * Math.PI * 2;

    engine.scene.add(this.mesh);
    console.log(`[Ingredient] Created ${config.type} at`, config.position);
  }

  update(deltaTime: number): void {
    if (this.collected) return;

    // Rotate and float animation
    this.mesh.rotation.y += this.rotationSpeed;
    this.floatOffset += this.floatSpeed;
    this.mesh.position.y = this.position.y + Math.sin(this.floatOffset) * 0.1;
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (this.collected) return false;

    const distance = this.mesh.position.distanceTo(playerPosition);
    const collectDistance = playerRadius + 0.3;

    if (distance < collectDistance) {
      this.collect();
      return true;
    }

    return false;
  }

  private collect(): void {
    this.collected = true;
    this.engine.scene.remove(this.mesh);
    console.log(`[Ingredient] Collected ${this.type}`);
  }

  isCollected(): boolean {
    return this.collected;
  }

  getType(): IngredientType {
    return this.type;
  }

  createMeshForPlayer(): THREE.Mesh {
    // Create a new mesh for the player's stack (since we removed the original)
    const config_data = Ingredient.INGREDIENT_CONFIGS[this.type];
    const geometry = config_data.geometry();
    const material = new THREE.MeshStandardMaterial({
      color: config_data.color,
      roughness: 0.6,
      metalness: this.type === IngredientType.CHEESE ? 0.3 : 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Shadow casting will be handled in Player.addIngredient
    return mesh;
  }

  getHeight(): number {
    return Ingredient.INGREDIENT_CONFIGS[this.type].height;
  }

  dispose(): void {
    if (!this.collected && this.mesh) {
      this.engine.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
  }
}

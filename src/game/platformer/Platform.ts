/**
 * AI-EDITABLE: Platform Component
 *
 * This file defines platforms that the player can stand on.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';

interface PlatformConfig {
  position: THREE.Vector3;
  size: THREE.Vector3;
  color?: number;
  visible?: boolean;
}

interface Bounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class Platform {
  private engine: Engine;
  private mesh: THREE.Mesh | null = null;
  private bounds: Bounds;

  constructor(engine: Engine, config: PlatformConfig) {
    this.engine = engine;

    // Calculate bounds
    this.bounds = {
      min: new THREE.Vector3(
        config.position.x - config.size.x / 2,
        config.position.y - config.size.y / 2,
        config.position.z - config.size.z / 2
      ),
      max: new THREE.Vector3(
        config.position.x + config.size.x / 2,
        config.position.y + config.size.y / 2,
        config.position.z + config.size.z / 2
      ),
    };

    // Create mesh if visible
    if (config.visible !== false) {
      const geometry = new THREE.BoxGeometry(
        config.size.x,
        config.size.y,
        config.size.z
      );
      const material = new THREE.MeshStandardMaterial({
        color: config.color ?? 0x8b4513,
        roughness: 0.7,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.copy(config.position);
      // Disable shadows on mobile for better performance
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
      this.mesh.castShadow = !isMobile;
      this.mesh.receiveShadow = !isMobile;
      engine.scene.add(this.mesh);
    }
  }

  getBounds(): Bounds {
    return this.bounds;
  }

  dispose(): void {
    if (this.mesh) {
      this.engine.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
  }
}

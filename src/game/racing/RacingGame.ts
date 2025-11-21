/**
 * AI-EDITABLE: Racing Game Implementation
 *
 * This file contains the main racing game logic.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';
import { BurgerVehicle } from './BurgerVehicle';

export class RacingGame implements Game {
  private engine: Engine;
  private vehicle: BurgerVehicle;
  private track: THREE.Mesh[] = [];
  private obstacles: THREE.Mesh[] = [];
  private checkpoints: THREE.Vector3[] = [];
  private currentCheckpoint: number = 0;
  private lapCount: number = 0;
  private startTime: number = Date.now();
  private bestTime: number = Infinity;

  constructor(engine: Engine) {
    this.engine = engine;

    // Setup lighting
    engine.createDefaultLighting();

    // Create track
    this.createTrack();

    // Create obstacles
    this.createObstacles();

    // Create vehicle
    this.vehicle = new BurgerVehicle(engine);

    // Initialize UI
    this.updateUI();

    console.log('[RacingGame] Initialized');
  }

  private createTrack(): void {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    
    // Create ground/road
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = !isMobile;
    this.engine.scene.add(ground);

    // Create road track (circular/oval track)
    const trackWidth = 8;
    const trackRadius = 30;
    const trackSegments = 64;

    // Create track segments
    for (let i = 0; i < trackSegments; i++) {
      const angle = (i / trackSegments) * Math.PI * 2;
      const x = Math.cos(angle) * trackRadius;
      const z = Math.sin(angle) * trackRadius;

      const segmentGeometry = new THREE.PlaneGeometry(trackWidth, 2);
      const segmentMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
      });
      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      segment.rotation.x = -Math.PI / 2;
      segment.position.set(x, 0.01, z);
      segment.rotation.y = angle + Math.PI / 2;
      segment.receiveShadow = !isMobile;
      this.track.push(segment);
      this.engine.scene.add(segment);

      // Create checkpoints (every 8 segments)
      if (i % 8 === 0) {
        this.checkpoints.push(new THREE.Vector3(x, 0, z));
      }
    }

    // Create grass/terrain around track
    const grassGeometry = new THREE.PlaneGeometry(100, 100);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.9,
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.01;
    grass.receiveShadow = !isMobile;
    this.engine.scene.add(grass);

    // Add track markings (center line)
    for (let i = 0; i < trackSegments; i += 4) {
      const angle = (i / trackSegments) * Math.PI * 2;
      const x = Math.cos(angle) * trackRadius;
      const z = Math.sin(angle) * trackRadius;

      const markingGeometry = new THREE.PlaneGeometry(0.2, 1);
      const markingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        roughness: 0.8,
      });
      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.rotation.x = -Math.PI / 2;
      marking.position.set(x, 0.02, z);
      marking.rotation.y = angle + Math.PI / 2;
      this.engine.scene.add(marking);
    }

    // Add barriers/walls on track edges
    for (let i = 0; i < trackSegments; i += 2) {
      const angle = (i / trackSegments) * Math.PI * 2;
      const innerX = Math.cos(angle) * (trackRadius - trackWidth / 2);
      const innerZ = Math.sin(angle) * (trackRadius - trackWidth / 2);
      const outerX = Math.cos(angle) * (trackRadius + trackWidth / 2);
      const outerZ = Math.sin(angle) * (trackRadius + trackWidth / 2);

      // Inner barrier
      const innerBarrier = this.createBarrier(innerX, innerZ, angle);
      this.engine.scene.add(innerBarrier);

      // Outer barrier
      const outerBarrier = this.createBarrier(outerX, outerZ, angle);
      this.engine.scene.add(outerBarrier);
    }
  }

  private createBarrier(x: number, z: number, angle: number): THREE.Mesh {
    const barrierGeometry = new THREE.BoxGeometry(0.3, 0.5, 1);
    const barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.7,
    });
    const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(x, 0.25, z);
    barrier.rotation.y = angle + Math.PI / 2;
    return barrier;
  }

  private createObstacles(): void {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    const obstacleCount = isMobile ? 5 : 10;
    const trackRadius = 30;

    // Create random obstacles on the track
    for (let i = 0; i < obstacleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = trackRadius + (Math.random() - 0.5) * 2; // Slight variation
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const obstacleGeometry = new THREE.ConeGeometry(0.5, 1, 8);
      const obstacleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff8800,
        roughness: 0.8,
      });
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      obstacle.position.set(x, 0.5, z);
      obstacle.castShadow = !isMobile;
      this.obstacles.push(obstacle);
      this.engine.scene.add(obstacle);
    }
  }

  update(deltaTime: number): void {
    // Update vehicle
    this.vehicle.update(deltaTime);

    // Check checkpoints
    this.checkCheckpoints();

    // Update UI
    this.updateUI();

    // Rotate obstacles for visual effect
    this.obstacles.forEach(obstacle => {
      obstacle.rotation.y += 0.02;
    });
  }

  private checkCheckpoints(): void {
    if (this.checkpoints.length === 0) return;

    const vehiclePos = this.vehicle.getPosition();
    const checkpoint = this.checkpoints[this.currentCheckpoint];
    
    const distance = vehiclePos.distanceTo(checkpoint);
    
    if (distance < 3) {
      this.currentCheckpoint++;
      
      if (this.currentCheckpoint >= this.checkpoints.length) {
        // Completed a lap
        this.currentCheckpoint = 0;
        this.lapCount++;
        
        const lapTime = (Date.now() - this.startTime) / 1000;
        if (lapTime < this.bestTime) {
          this.bestTime = lapTime;
        }
        
        this.startTime = Date.now();
        console.log(`[RacingGame] Lap ${this.lapCount} completed! Time: ${lapTime.toFixed(2)}s`);
      }
    }
  }

  private updateUI(): void {
    const speedElement = document.getElementById('speed');
    const lapElement = document.getElementById('lap');
    const timeElement = document.getElementById('time');
    const bestTimeElement = document.getElementById('best-time');

    if (speedElement) {
      const speed = Math.abs(this.vehicle.getSpeed());
      const speedKmh = (speed * 100).toFixed(0);
      speedElement.textContent = `Speed: ${speedKmh} km/h`;
    }

    if (lapElement) {
      lapElement.textContent = `Lap: ${this.lapCount + 1}`;
    }

    if (timeElement) {
      const currentTime = (Date.now() - this.startTime) / 1000;
      timeElement.textContent = `Time: ${currentTime.toFixed(2)}s`;
    }

    if (bestTimeElement) {
      if (this.bestTime === Infinity) {
        bestTimeElement.textContent = `Best: --`;
      } else {
        bestTimeElement.textContent = `Best: ${this.bestTime.toFixed(2)}s`;
      }
    }
  }

  onResize(width: number, height: number): void {
    // Handle resize if needed
  }

  dispose(): void {
    this.vehicle.dispose();
    
    // Dispose track segments
    this.track.forEach(segment => {
      segment.geometry.dispose();
      (segment.material as THREE.Material).dispose();
      this.engine.scene.remove(segment);
    });
    
    // Dispose obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.geometry.dispose();
      (obstacle.material as THREE.Material).dispose();
      this.engine.scene.remove(obstacle);
    });
    
    console.log('[RacingGame] Disposed');
  }
}

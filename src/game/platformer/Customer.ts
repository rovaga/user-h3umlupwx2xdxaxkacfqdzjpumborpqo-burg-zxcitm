/**
 * AI-EDITABLE: Customer/NPC
 *
 * This file defines customers that have ingredient orders for hamburgers.
 */

import * as THREE from 'three';
import type { Engine } from '../../engine/Engine';
import { IngredientType } from './Ingredient';

export interface CustomerOrder {
  ingredients: IngredientType[];
}

export class Customer {
  private engine: Engine;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private order: CustomerOrder;
  private orderFulfilled: boolean = false;
  private interactionRadius: number = 2.5;
  private orderTextMesh: THREE.Mesh | null = null;
  private orderTextSprite: THREE.Sprite | null = null;

  constructor(engine: Engine, position: THREE.Vector3, order: CustomerOrder) {
    this.engine = engine;
    this.position = position.clone();
    this.order = order;

    // Create customer mesh (simple person representation)
    this.mesh = new THREE.Group();
    
    // Optimize geometry complexity for mobile
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    const cylinderSegments = isMobile ? 6 : 8;
    const sphereSegments = isMobile ? 6 : 8;
    
    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, cylinderSegments);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4169e1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = !isMobile; // Disable shadow casting on mobile
    this.mesh.add(body);

    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, sphereSegments, sphereSegments);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.0;
    head.castShadow = !isMobile; // Disable shadow casting on mobile
    this.mesh.add(head);

    // Create order display (floating text)
    this.createOrderDisplay();

    this.mesh.position.copy(this.position);
    engine.scene.add(this.mesh);

    console.log(`[Customer] Created at`, position, 'with order:', order.ingredients);
  }

  private createOrderDisplay(): void {
    // Create a simple visual indicator for the order
    // We'll use a colored box above the customer's head
    const orderBoxGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.1);
    const orderBoxMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    const orderBox = new THREE.Mesh(orderBoxGeometry, orderBoxMaterial);
    orderBox.position.y = 1.5;
    orderBox.position.z = 0.3;
    this.mesh.add(orderBox);

    // Create ingredient indicators (small colored boxes)
    const ingredientSpacing = 0.25;
    const startX = -(this.order.ingredients.length - 1) * ingredientSpacing / 2;
    
    this.order.ingredients.forEach((ingredient, index) => {
      const color = this.getIngredientColor(ingredient);
      const indicatorGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
      const indicatorMaterial = new THREE.MeshStandardMaterial({ color });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(startX + index * ingredientSpacing, 1.5, 0.35);
      this.mesh.add(indicator);
    });
  }

  private getIngredientColor(type: IngredientType): number {
    const colors: Record<IngredientType, number> = {
      [IngredientType.LETTUCE]: 0x90ee90,
      [IngredientType.BACON]: 0xcd5c5c,
      [IngredientType.CHEESE]: 0xffd700,
      [IngredientType.TOMATO]: 0xff6347,
      [IngredientType.PICKLE]: 0x32cd32,
      [IngredientType.ONION]: 0xfff8dc,
    };
    return colors[type] || 0xffffff;
  }

  checkInteraction(playerPosition: THREE.Vector3): boolean {
    if (this.orderFulfilled) return false;
    
    const distance = this.position.distanceTo(playerPosition);
    return distance < this.interactionRadius;
  }

  validateOrder(playerIngredients: IngredientType[]): boolean {
    if (this.orderFulfilled) return false;
    
    // Check if player has exactly the required ingredients in the right order
    if (playerIngredients.length !== this.order.ingredients.length) {
      return false;
    }

    // Check if ingredients match in order
    for (let i = 0; i < this.order.ingredients.length; i++) {
      if (playerIngredients[i] !== this.order.ingredients[i]) {
        return false;
      }
    }

    return true;
  }

  fulfillOrder(): void {
    this.orderFulfilled = true;
    // Change customer color to indicate they're satisfied
    this.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.geometry instanceof THREE.CylinderGeometry) {
          // Body - make it green
          child.material.color.setHex(0x00ff00);
        }
      }
    });
    console.log('[Customer] Order fulfilled!');
  }

  getOrder(): CustomerOrder {
    return { ingredients: [...this.order.ingredients] };
  }

  isOrderFulfilled(): boolean {
    return this.orderFulfilled;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  update(deltaTime: number): void {
    // Animate customer (gentle bobbing)
    const bobAmount = Math.sin(Date.now() * 0.001) * 0.05;
    this.mesh.position.y = this.position.y + bobAmount;
  }

  dispose(): void {
    this.engine.scene.remove(this.mesh);
    this.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    console.log('[Customer] Disposed');
  }
}

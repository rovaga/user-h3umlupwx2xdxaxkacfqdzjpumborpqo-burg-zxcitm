# AI Development Rules for This Game Project

## Overview

This project is structured to be easily edited by AI agents. It uses a **two-layer architecture**:

1. **Stable Engine Layer** (human-owned, AI should NOT modify)
   - `src/main.ts` - Fixed entrypoint
   - `src/engine/**` - Core engine functionality

2. **Pluggable Game Module** (AI-owned, AI CAN freely modify)
   - `src/game/**` - All game logic lives here
   - `public/assets/current-game/**` - Game assets

## Core Rules for AI Agents

### ✅ DO:

1. **All game code goes in `src/game/`**
   - Modify/create any files under `src/game/`
   - Wire everything through `src/game/index.ts`
   - The only requirement: `src/game/index.ts` must export `createGame(engine: Engine): Game`

2. **Use the engine API**
   ```typescript
   // Access these from the engine instance:
   engine.scene          // THREE.Scene
   engine.camera         // THREE.PerspectiveCamera
   engine.renderer       // THREE.WebGLRenderer
   engine.input          // Input manager (keyboard, mouse, pointer lock)
   engine.assetLoader    // Asset discovery and loading
   ```

3. **Add assets to `public/assets/current-game/`**
   - Place files in subdirectories: `textures/`, `models/`, `audio/`, etc.
   - Assets are auto-discovered at build time
   - Reference them by relative path: `'textures/player.png'`

4. **Implement the Game interface**
   ```typescript
   export interface Game {
     update(deltaTime: number): void;  // Required
     dispose(): void;                   // Required
     onResize?(width: number, height: number): void;  // Optional
   }
   ```

5. **Create new game modes by editing `src/game/index.ts`**
   ```typescript
   // You can have multiple games in different folders:
   // src/game/platformer/
   // src/game/shooter/
   // src/game/rpg/

   // Switch between them in src/game/index.ts:
   export function createGame(engine: Engine): Game {
     const mode = new URLSearchParams(window.location.search).get('mode');
     if (mode === 'shooter') return new ShooterGame(engine);
     return new PlatformerGame(engine);
   }
   ```

### ❌ DON'T:

1. **Never modify `src/main.ts`**
   - This is the stable entrypoint
   - It always loads `src/game/index.ts`
   - Changing it breaks the architecture

2. **Never modify `src/engine/**`**
   - These are stable, human-owned engine files
   - Engine provides all the APIs you need
   - If you need engine changes, ask the human first

3. **Don't create new top-level entry files**
   - ❌ Don't create `src/newGame.ts` and reference it directly
   - ✅ Create `src/game/newGame/` and wire it through `src/game/index.ts`

4. **Don't skip the Game interface**
   - Always implement `update()` and `dispose()`
   - Engine calls these automatically

## File Structure

```
project/
├── index.html                    # HTML entry (points to /src/main.ts)
├── vite.config.ts                # Build config
├── public/
│   └── assets/
│       ├── shared/               # Shared assets (human-managed)
│       └── current-game/         # AI can add assets here
│           ├── textures/
│           ├── models/
│           └── audio/
└── src/
    ├── main.ts                   # 🔒 STABLE - DO NOT EDIT
    ├── engine/                   # 🔒 STABLE - DO NOT EDIT
    │   ├── Engine.ts
    │   ├── AssetLoader.ts
    │   ├── Input.ts
    │   └── Types.ts
    └── game/                     # ✏️ AI PLAYGROUND - EDIT FREELY
        ├── index.ts              # Must export createGame()
        └── platformer/           # Example game
            ├── PlatformerGame.ts
            ├── Player.ts
            └── Platform.ts
```

## Input System

The engine provides an Input manager:

```typescript
// Check key states
if (engine.input.isKeyPressed('KeyW')) { /* move forward */ }
if (engine.input.isKeyPressed('Space')) { /* jump */ }

// Mouse/pointer lock
if (engine.input.isPointerLocked()) {
  const delta = engine.input.getMouseDelta();
  cameraRotationY -= delta.x * 0.002;
}

// Common key codes:
// 'KeyW', 'KeyA', 'KeyS', 'KeyD'
// 'Space', 'ShiftLeft', 'ControlLeft'
// 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
```

## Asset Loading

Assets in `public/assets/current-game/` are auto-discovered:

```typescript
// Check if asset exists
if (engine.assetLoader.has('textures/player.png')) {
  // Load texture
  const texture = await engine.assetLoader.loadTexture('textures/player.png');
}

// Get URL for custom loading
const url = engine.assetLoader.getUrl('models/enemy.gltf');

// List all assets
const allAssets = engine.assetLoader.list();
console.log('Available assets:', allAssets);
```

## Example: Creating a New Game

1. Create a new directory: `src/game/my-new-game/`

2. Create `MyGame.ts`:
   ```typescript
   import type { Engine } from '../../engine/Engine';
   import type { Game } from '../../engine/Types';

   export class MyGame implements Game {
     constructor(private engine: Engine) {
       // Setup your game
       engine.createDefaultLighting();
       // ... create objects, etc.
     }

     update(deltaTime: number): void {
       // Update game logic every frame
     }

     dispose(): void {
       // Clean up resources
     }
   }
   ```

3. Edit `src/game/index.ts`:
   ```typescript
   import { MyGame } from './my-new-game/MyGame';

   export function createGame(engine: Engine): Game {
     return new MyGame(engine);
   }
   ```

4. Done! The browser will automatically use your new game.

## Common Patterns

### Creating Objects

```typescript
// Add to scene
const mesh = new THREE.Mesh(geometry, material);
this.engine.scene.add(mesh);

// Don't forget to clean up in dispose()
dispose() {
  this.engine.scene.remove(mesh);
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}
```

### Camera Control

```typescript
// The engine owns the camera, but you can move it
this.engine.camera.position.set(x, y, z);
this.engine.camera.lookAt(target);
```

### Lighting

```typescript
// Quick default setup
this.engine.createDefaultLighting();

// Or custom
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(10, 20, 10);
this.engine.scene.add(light);
```

## Testing Your Changes

```bash
npm run dev    # Start dev server
npm run build  # Build for production
```

## Summary

The key principle: **One fixed entry (`src/game/index.ts`), infinite game possibilities.**

Even if you "rebuild the whole game from scratch", you do it by:
1. Creating new files in `src/game/your-new-game/`
2. Updating `src/game/index.ts` to return your new game
3. The browser wiring (`index.html` → `src/main.ts` → `src/game/index.ts`) never changes

This prevents the common AI pitfall of creating `newGame.js` that never gets loaded!

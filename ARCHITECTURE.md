# Architecture Overview

This document explains how the AI-friendly architecture solves the core problems of AI-driven game development.

## The Problem

When AI agents develop games, they often:
1. Create new files (e.g., `newGame.js`) but the browser still loads `main.js`
2. Rewrite code without maintaining the wiring between HTML and JavaScript
3. Don't know which files they can safely modify vs. which are critical infrastructure

## The Solution: Two-Layer Architecture

### Layer 1: Stable Engine (Off-Limits to AI)

```
src/
├── main.ts              🔒 Fixed entrypoint
└── engine/              🔒 Stable engine layer
    ├── Engine.ts        - Render loop, scene, camera, renderer
    ├── AssetLoader.ts   - Auto-discovery of assets
    ├── Input.ts         - Keyboard, mouse, pointer lock
    └── Types.ts         - Core type definitions
```

**Key characteristics:**
- Written once by humans
- Provides stable APIs
- Never modified by AI
- Clear comments indicating "DO NOT MODIFY"

### Layer 2: Game Module (AI Playground)

```
src/
└── game/                ✏️ AI can edit freely
    ├── index.ts         - Must export createGame()
    └── [game-folders]/  - Any structure AI wants
```

**Key characteristics:**
- AI has complete freedom
- Can be rewritten from scratch
- Only requirement: `index.ts` exports `createGame(engine): Game`
- AI can create subdirectories, multiple games, etc.

## The Contract

### Fixed Wiring (Never Changes)

```
index.html
  └─> src/main.ts (fixed)
       └─> src/game/index.ts (AI edits this)
            └─> returns Game instance
```

Even if AI "rebuilds the entire game", it does so by:
1. Creating/modifying files in `src/game/`
2. Ensuring `src/game/index.ts` exports `createGame()`
3. The browser wiring **never changes**

### Example: AI Wants to Create a New Game

**Bad approach (what AIs often do):**
```javascript
// AI creates src/newGame.js
// But index.html still points to src/main.js
// New game never loads!
```

**Good approach (this architecture enforces):**
```typescript
// AI creates src/game/shooter/ShooterGame.ts
// AI edits src/game/index.ts:
export function createGame(engine: Engine): Game {
  return new ShooterGame(engine);
}
// ✅ Browser automatically uses new game!
```

## Asset Management

### Problem
AI doesn't know where to put assets or how to reference them.

### Solution
```
public/assets/current-game/
├── textures/
├── models/
└── audio/
```

**Auto-discovery:**
- AI drops files in `current-game/`
- Vite's `import.meta.glob` discovers them at build time
- Engine provides `assetLoader` API

**Usage:**
```typescript
// AI references assets by relative path
const texture = await engine.assetLoader.loadTexture('textures/player.png');
```

**No need for:**
- Import statements
- Manual file path wrangling
- Webpack configuration

## The Game Interface

All games must implement this simple interface:

```typescript
interface Game {
  update(deltaTime: number): void;  // Called every frame
  dispose(): void;                   // Clean up resources
  onResize?(width, height): void;    // Optional resize handler
}
```

This minimal contract allows AI to:
- Create any game structure it wants
- Use any patterns it prefers
- Rebuild from scratch without breaking anything

## Input System

Engine provides unified input handling:

```typescript
// Keyboard
if (engine.input.isKeyPressed('KeyW')) { /* move forward */ }

// Mouse (with pointer lock)
if (engine.input.isPointerLocked()) {
  const delta = engine.input.getMouseDelta();
  // Use for camera rotation
}
```

AI doesn't need to:
- Set up event listeners
- Manage pointer lock
- Track key states

## File Organization Patterns

### Single Game
```
src/game/
├── index.ts              # exports createGame()
├── Game.ts               # Main game class
├── Player.ts
├── Enemy.ts
└── Platform.ts
```

### Multiple Games
```
src/game/
├── index.ts              # Switches between games
├── platformer/
│   ├── PlatformerGame.ts
│   └── ...
├── shooter/
│   ├── ShooterGame.ts
│   └── ...
└── rpg/
    ├── RPGGame.ts
    └── ...
```

```typescript
// src/game/index.ts
export function createGame(engine: Engine): Game {
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'shooter') return new ShooterGame(engine);
  if (mode === 'rpg') return new RPGGame(engine);
  return new PlatformerGame(engine);
}
```

## Benefits

### For AI Agents
1. **Clear boundaries** - Comments explicitly say what can/can't be modified
2. **Stable APIs** - Engine provides everything needed
3. **Single entry point** - Only `src/game/index.ts` matters
4. **Automatic asset discovery** - Just drop files in a folder
5. **Can't break wiring** - Engine layer prevents common mistakes

### For Humans
1. **Predictable structure** - Always know where to look
2. **Easy to review** - AI changes confined to `src/game/`
3. **Stable foundation** - Engine never gets corrupted
4. **Hot reload works** - Vite dev server handles TypeScript

### For Development
1. **TypeScript throughout** - Type safety for both layers
2. **Vite build** - Fast builds, HMR, modern tooling
3. **Three.js included** - Full 3D capabilities
4. **Zero config** - Works out of the box

## Trade-offs

### What we give up:
- AI can't optimize the engine layer
- Slightly more rigid structure than "anything goes"
- AI needs to learn one specific pattern

### What we gain:
- **Reliability** - AI can't accidentally break the wiring
- **Speed** - AI doesn't waste time recreating infrastructure
- **Clarity** - Human knows exactly what changed
- **Reusability** - Engine works for many different games

## Extension Points

If AI needs capabilities not in the engine:

1. **Add to game layer** (preferred)
   ```typescript
   // src/game/utils/CustomPhysics.ts
   export class CustomPhysics { ... }
   ```

2. **Request engine change** (rare)
   - AI should ask human first
   - Human evaluates if it belongs in engine
   - Update benefits all future games

## Conclusion

This architecture **makes AI limitations into strengths**:

- **AI is stateless?** → Fixed contract ensures consistency
- **AI forgets context?** → Comments in every file remind it
- **AI creates new files?** → That's fine, as long as they wire through `index.ts`
- **AI rewrites everything?** → Engine layer stays stable

The result: AI can genuinely iterate on games without breaking the foundation.

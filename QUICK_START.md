# Quick Start Guide

## For Developers

### Install and Run
```bash
npm install
npm run dev
```

Open http://localhost:3000

### Build for Production
```bash
npm run build
npm run preview
```

## For AI Agents

### What You Can Edit
✅ Everything in `src/game/`
✅ Add files to `public/assets/current-game/`

### What You Cannot Edit
❌ `src/main.ts`
❌ `src/engine/**`
❌ `index.html` (usually)

### The Only Rule
`src/game/index.ts` must export:
```typescript
export function createGame(engine: Engine): Game
```

## Common Tasks

### Create a New Game from Scratch

1. Create your game directory:
```
src/game/my-awesome-game/
```

2. Create `MyGame.ts`:
```typescript
import type { Engine } from '../../engine/Engine';
import type { Game } from '../../engine/Types';

export class MyGame implements Game {
  constructor(private engine: Engine) {
    // Setup scene
    engine.createDefaultLighting();

    // Create game objects...
  }

  update(deltaTime: number): void {
    // Game logic here
  }

  dispose(): void {
    // Cleanup here
  }
}
```

3. Edit `src/game/index.ts`:
```typescript
import { MyGame } from './my-awesome-game/MyGame';

export function createGame(engine: Engine): Game {
  return new MyGame(engine);
}
```

4. Done! Refresh browser.

### Add Assets

1. Put files in `public/assets/current-game/`:
```
public/assets/current-game/
└── textures/
    └── player.png
```

2. Use in code:
```typescript
const texture = await engine.assetLoader.loadTexture('textures/player.png');
```

### Use Input

```typescript
// In your update() method:
if (engine.input.isKeyPressed('KeyW')) {
  player.moveForward();
}

if (engine.input.isKeyPressed('Space')) {
  player.jump();
}

// Mouse (pointer lock)
if (engine.input.isPointerLocked()) {
  const { x, y } = engine.input.getMouseDelta();
  camera.rotateY(-x * 0.002);
}
```

### Create Objects

```typescript
// Create a cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);

// Add to scene
this.engine.scene.add(cube);

// Don't forget to remove in dispose()!
dispose() {
  this.engine.scene.remove(cube);
  cube.geometry.dispose();
  (cube.material as THREE.Material).dispose();
}
```

### Move the Camera

```typescript
// Position camera
this.engine.camera.position.set(0, 5, 10);

// Look at something
this.engine.camera.lookAt(player.position);

// Or for orbit camera:
const offset = new THREE.Vector3(0, 5, 10);
this.engine.camera.position.copy(player.position).add(offset);
this.engine.camera.lookAt(player.position);
```

### Multiple Games (Switch via URL)

Edit `src/game/index.ts`:
```typescript
import { PlatformerGame } from './platformer/PlatformerGame';
import { ShooterGame } from './shooter/ShooterGame';

export function createGame(engine: Engine): Game {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') || 'platformer';

  if (mode === 'shooter') {
    return new ShooterGame(engine);
  }

  return new PlatformerGame(engine);
}
```

Access via:
- http://localhost:3000 (platformer)
- http://localhost:3000?mode=shooter (shooter)

## File Structure Reference

```
project/
├── index.html                      # Entry HTML
├── vite.config.ts                  # Vite config
├── tsconfig.json                   # TypeScript config
├── package.json                    # Dependencies
├── AI_RULES.md                     # Detailed AI guidelines
├── ARCHITECTURE.md                 # Architecture explanation
├── README.md                       # Project overview
├── QUICK_START.md                  # This file
│
├── public/
│   └── assets/
│       ├── shared/                 # Shared assets
│       └── current-game/           # ✏️ Add your assets here
│
└── src/
    ├── main.ts                     # 🔒 Fixed entry (don't edit)
    │
    ├── engine/                     # 🔒 Stable engine (don't edit)
    │   ├── Engine.ts
    │   ├── AssetLoader.ts
    │   ├── Input.ts
    │   └── Types.ts
    │
    └── game/                       # ✏️ Your playground
        ├── index.ts                # Must export createGame()
        └── platformer/             # Example game
            ├── PlatformerGame.ts
            ├── Player.ts
            └── Platform.ts
```

## Engine API Reference

### Engine Instance
```typescript
engine.scene          // THREE.Scene
engine.camera         // THREE.PerspectiveCamera
engine.renderer       // THREE.WebGLRenderer
engine.input          // Input manager
engine.assetLoader    // Asset loader

// Helper method
engine.createDefaultLighting()  // Adds ambient + directional light
```

### Input API
```typescript
engine.input.isKeyPressed(code: string): boolean
engine.input.getKeys(): KeyState
engine.input.isPointerLocked(): boolean
engine.input.getMouseDelta(): { x: number, y: number }
```

### AssetLoader API
```typescript
engine.assetLoader.getUrl(path: string): string | undefined
engine.assetLoader.has(path: string): boolean
engine.assetLoader.loadTexture(path: string): Promise<THREE.Texture>
engine.assetLoader.list(): string[]
engine.assetLoader.all(): Record<string, string>
```

### Game Interface (You Implement This)
```typescript
interface Game {
  update(deltaTime: number): void;     // Required
  dispose(): void;                      // Required
  onResize?(width, height): void;       // Optional
}
```

## Troubleshooting

### Game doesn't load
- Check `src/game/index.ts` exports `createGame`
- Check browser console for errors
- Verify `npm run dev` is running

### Assets not found
- Assets must be in `public/assets/current-game/`
- Reference by relative path: `'textures/foo.png'` not `'/public/assets/current-game/textures/foo.png'`
- Check `engine.assetLoader.list()` to see discovered assets

### TypeScript errors
- Run `npm run build` to see all errors
- Check `tsconfig.json` is present
- Ensure `@types/three` is installed

### Changes not appearing
- Check file is in `src/game/` (changes to engine won't work)
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Restart dev server

## Next Steps

1. Read `AI_RULES.md` for complete development guidelines
2. Read `ARCHITECTURE.md` to understand the design
3. Explore `src/game/platformer/` for examples
4. Start building!

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

# 3D Game - AI Editable Architecture

A Three.js game project designed to be easily edited by AI agents.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Architecture

This project uses a **two-layer architecture** optimized for AI development:

### Layer 1: Stable Engine (Human-Owned)
- `src/main.ts` - Fixed entrypoint that never changes
- `src/engine/**` - Core engine functionality (rendering, input, assets)

### Layer 2: Pluggable Game (AI-Owned)
- `src/game/**` - All game logic (AI can freely modify)
- `public/assets/current-game/**` - Game assets (AI can add files)

## For AI Developers

**Read `AI_RULES.md` for complete development guidelines.**

Key points:
- ✅ Modify anything in `src/game/`
- ✅ Add assets to `public/assets/current-game/`
- ❌ Don't touch `src/main.ts` or `src/engine/**`

The only requirement: `src/game/index.ts` must export:
```typescript
export function createGame(engine: Engine): Game
```

## Project Structure

```
├── index.html                 # Entry HTML
├── vite.config.ts             # Vite configuration
├── public/
│   └── assets/
│       └── current-game/      # Drop assets here (auto-discovered)
└── src/
    ├── main.ts                # 🔒 Stable entry (don't edit)
    ├── engine/                # 🔒 Stable engine (don't edit)
    │   ├── Engine.ts
    │   ├── AssetLoader.ts
    │   ├── Input.ts
    │   └── Types.ts
    └── game/                  # ✏️ AI playground (edit freely)
        ├── index.ts           # Game entry point
        └── platformer/        # Example platformer game
            ├── PlatformerGame.ts
            ├── Player.ts
            └── Platform.ts
```

## Current Game

The project currently includes a 3D platformer demo:
- Third-person camera controls
- WASD movement
- Space to jump
- Mouse look (click to lock pointer)
- Multiple platforms to explore

## How It Solves "AI as Game Dev" Problems

### Problem: AI creates new files but they never get loaded
**Solution:** Fixed entry point at `src/game/index.ts`. AI can create new games in subdirectories, but they all wire through this single entry point.

### Problem: AI rewrites everything, breaking the wiring
**Solution:** Two-layer architecture. Engine layer is off-limits and provides stable APIs. Game layer can be completely rewritten.

### Problem: Asset management is messy
**Solution:** Auto-discovery via Vite's `import.meta.glob`. Drop files in `public/assets/current-game/` and reference them by relative path.

### Problem: AI doesn't know what it can/can't modify
**Solution:** Clear boundaries with comments in every file. `AI_RULES.md` provides complete guidelines.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Technologies

- **Vite** - Fast build tool and dev server
- **Three.js** - 3D graphics library
- **TypeScript** - Type-safe development

## License

ISC

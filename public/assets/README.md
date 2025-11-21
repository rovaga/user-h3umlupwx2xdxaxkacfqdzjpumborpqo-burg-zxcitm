# Assets Directory

## Structure

```
assets/
├── shared/           # Shared assets across all games (human-managed)
└── current-game/     # Assets for the current game (AI can add here)
    ├── textures/
    ├── models/
    ├── audio/
    └── ...
```

## For AI Developers

All game assets should be placed in `current-game/` subdirectories.
The AssetLoader will automatically discover all files in this directory.

### Usage in game code:

```typescript
// Access assets via the engine's assetLoader
const texture = await engine.assetLoader.loadTexture('textures/player.png');

// Check if an asset exists
if (engine.assetLoader.has('models/enemy.gltf')) {
  // Load the asset
}

// Get direct URL
const url = engine.assetLoader.getUrl('audio/jump.mp3');
```

### File paths:

When you place a file at:
```
public/assets/current-game/textures/player.png
```

Reference it as:
```typescript
'textures/player.png'
```

The path is relative to `current-game/`.

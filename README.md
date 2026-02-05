# Webgame

A basic 3D HTML game scaffold that loads your local FBX goblin + FBX animations.

## 1) Put your files in the repo

Place your files like this (or edit `ASSET_PATHS` in `index.html`):

```text
assets/
  goblin/
    goblin.fbx
    ...textures...
  animations/
    walk.fbx
    jump.fbx
```

## 2) Run locally

```bash
cd /workspace/Webgame
python3 -m http.server 4173
```

Open: `http://localhost:4173/index.html`

## Controls

- Move: `W A S D` (or arrow keys)
- Jump: `Space`

## Notes

- The game uses Three.js + FBXLoader from CDN.
- If your files are in different locations, update `ASSET_PATHS` in `index.html`.
- If your FBX exports are in centimeters, the included model scale (`0.01`) is usually correct.

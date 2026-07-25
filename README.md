# ╔══════════════════════════════════════════╗
# ║         PIXEL FORGE  v0.1.0            ║
# ║   Pixel Art Editor for Windows 95      ║
# ╚══════════════════════════════════════════╝

```
  ____  _____    _    __  __ _____
 |  _ \| ____|  / \  |  \/  | ____|
 | |_) |  _|   / _ \ | |\/| |  _|
 |  __/| |___ / ___ \| |  | | |___
 |_|   |_____/_/   \_\_|  |_|_____|
```

> A pixel art editor with layers, animation, and offline support.
> Built with React, IndexedDB, and PWA. Themed after Windows 95.

---

## Overview

Pixel Forge is a lightweight, browser-based pixel art editor that runs
entirely offline. Draw sprites, animate frame-by-frame, manage layers,
and export your work — no server required.

The interface is styled after classic Windows 95/98 with beveled 3D borders,
blue gradient title bars, and chunky scrollbars. Because retro is forever.

## Features

### Drawing Tools
| Key | Tool       | Description                  |
|-----|------------|------------------------------|
| B   | Pencil     | Draw pixels with brush size  |
| E   | Eraser     | Erase pixels                 |
| G   | Fill       | Flood fill an area           |
| I   | Eyedropper | Pick color from canvas       |
| R   | Rectangle  | Draw rectangle outlines      |
| L   | Line       | Draw straight lines          |

### Layers
- Add, remove, duplicate, clear, merge down
- Per-layer opacity and visibility toggle
- Rename layers inline
- Reorder with up/down buttons

### Animation
- Add/remove/duplicate frames
- Play/pause animation preview
- Adjustable FPS (1-30)
- Onion skinning — see previous/next frames as ghosts

### Other
- Undo/Redo (50 steps, Ctrl+Z / Ctrl+Y)
- 40-color preset palette + custom color picker
- Brush size 1-16px
- Zoom 1-64x with grid overlay
- Export current frame as PNG
- Export spritesheet (all frames in a grid)
- Auto-saves to IndexedDB every 500ms
- PWA — installable, works offline
- Status bar with coordinates, tool info, frame count

## Canvas Sizes

Preset sizes available in the New Canvas dialog:
16x16, 32x32, 64x64, 128x128, 16x32, 32x16

Or enter any custom size up to 512x512.

## Tech Stack

- **React 19** — UI framework
- **Vite 8** — Build tool (Rolldown-powered, fast)
- **IndexedDB** — Client-side persistence
- **Workbox** — Service worker for offline PWA
- **vite-plugin-pwa** — PWA manifest generation

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Keyboard Shortcuts

| Shortcut         | Action              |
|------------------|---------------------|
| B                | Pencil tool         |
| E                | Eraser tool         |
| G                | Fill tool           |
| I                | Eyedropper tool     |
| R                | Rectangle tool      |
| L                | Line tool           |
| Ctrl+Z           | Undo                |
| Ctrl+Y           | Redo                |
| Space            | Play/Pause animation|
| N                | Add new frame       |
| Delete           | Clear current layer |
| +/-              | Zoom in/out         |

## License

Made with pixels and nostalgia.

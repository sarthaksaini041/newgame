# CHAOS TETHER — Hyper-Orbit Wrecking Arena

A zero-dependency, high-craft arcade space action game built with a custom **WebGL2 instanced & shader renderer** (with Canvas 2D fallback), **procedural deep-space backdrop**, and **Web Audio API cosmic synth engine**.

## Features

- **Tethered Kinetic Combat**: Whip, slingshot, and catapult high-velocity plasma Gyro-Cores through waves of hostile spacecraft and multi-phase Boss Dreadnoughts.
- **5 Distinct Starship Themes (Starship Hangar)**:
  - **VALKYRIE MK-IX** — Delta Interceptor (swept aerospace wings, twin rail-lances, dual nacelles)
  - **KRYPTOS MANTIS** — Scythe Predator (forward-swept bio-stealth scythes, split mandible prow)
  - **AEGIS VANGUARD** — Twin-Boom Gunship (heavy catamaran armor prongs, central rail capacitor)
  - **SERAPH HALO** — Astral Ring-Drive (floating orbital halo ring, detached chevron fins, prism spire)
  - **RONIN ZERO-X** — Cyber-Blade Racer (asymmetric needle-nose fuselage, starboard reactor pod)
- **8 Stackable Mutation Systems**: Twin Orbit, Arc Conductor, Singularity Core, Plasma Chain, Hyper-Elasticity, Shatter Nova, Siphon Core, and Thruster Overclock.
- **High-Load Performance Architecture**: Single-upload-per-frame WebGL2 instanced batching, 60 Hz fixed-timestep physics, uniform spatial hash grid, zero-GC object pools, and zero-DOM-churn HUD updates tested at 1M+ points.
- **Zero External Runtime Requests**: Self-hosted WOFF2 fonts, procedural 1024×1024 sprite/glyph atlas, and procedural Web Audio soundtrack & SFX.

## Controls

| Action | Keyboard / Mouse | Touch / Mouse Mode |
| :--- | :--- | :--- |
| **Thrust / Move** | `WASD` or Arrow Keys | Virtual Thumbstick / Cursor |
| **Hyper-Dash** | `Space` or Left Click | `DASH` button |
| **Yank & Catapult** | Hold `Shift` or Right Click, release to launch | Hold & release `YANK` |
| **Nova Overdrive** | `Q` or `F` (when charged) | `NOVA` button |
| **Pause / Mute** | `P` / `Esc` · `M` | HUD buttons |

## Local Development

```bash
# Serve directly from root (no build step required for dev)
npm run dev

# Build production bundle into dist/
npm run build

# Preview production dist/ bundle locally
npm run preview
```

## Deploy to Vercel

This repository includes [`vercel.json`](./vercel.json) configured for zero-config static deployment:

1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Vercel automatically detects `vercel.json`, runs `node scripts/build.mjs`, and deploys `dist/`.

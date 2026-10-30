# Boss Monster — Browser-Based Online Multiplayer Game

## Overview
Browser-based online multiplayer adaptation of the Boss Monster board game.
Phase 1 MVP: architecture/design docs + socket state sync. No feature content yet.

## Stack
- Backend: Node.js + Express + `ws` (WebSocket) on port 3000
- Frontend: React + Vite + TypeScript (Canvas grid renderer)
- State: server-authoritative; client is pure view over PublicState + phase
- Coding: local Qwen 2.5 Coder 7B via Ollama (http://localhost:11434)

## Game Summary (Boss Monster)
- 2-4 players, each builds a dungeon (5 rooms left-to-right) to lure and kill heroes.
- Players are Boss Monsters with unique abilities and XP thresholds.
- Each turn: build a room, lure heroes matching treasure type, resolve combat.
- Heroes have HP, treasure preference, damage.
- First boss to 10 souls wins; 5 wounds = eliminated.

## Phase 1 — Foundation (this phase)
1. Project scaffold (npm init, deps)
2. Backend WebSocket server: PlayerState registry (Map), room create/join, state broadcast
3. Core types: PlayerState, PublicState, Phase enum, Currency
4. Client: Vite + React, WebSocket hook, phase-driven view shell
5. Smoke test: two browser tabs connect, see shared state

## Phase 2+ (later)
- Card system (rooms, spells, bosses), auto-draw
- Hero combat (HP/damage)
- Room slot visuals on canvas grid
- Multiplayer lobby matchmaking
- Bot AI

## Directory Layout
```
boss-monster-multiplayer/
  server.mjs          # Express + ws
  package.json
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    core/
      types.ts
      serialize.ts
    components/
      GameView.tsx
      Lobby.tsx
    hooks/
      useWebSocket.ts
  build/              # vite output, served by express
```

## Conventions (from multi-project-game-dev skill)
- Vite outDir = './build'
- Component imports: ../../core/types from src/components
- formatCurrency accepts Partial<Currency>
- Client never keeps local game model; pure function of PublicState + phase
- Server auto-drives phases (REVEAL, DUNGEON, ROUND_END, GAME_OVER)

## Verification
- npm run build (tsc --noEmit + vite build)
- node scripts/verify_build.mjs (bundle contains card records)
- Smoke: start server, open two tabs, confirm shared state sync
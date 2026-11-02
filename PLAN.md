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

## Phase 1 — Foundation (✅ complete)
1. ✅ Project scaffold (npm init, deps)
2. ✅ Backend WebSocket server: PlayerState registry (Map), room create/join, state broadcast
3. ✅ Core types: Phase enum, Currency, RoomSlot, Hero, PlayerPublic, PublicState, ClientMessage, ServerMessage
4. ✅ Client: Vite + React, WebSocket hook, phase-driven view shell
5. ✅ Smoke test: two players connect, see shared state, play cards, combat resolves
6. ✅ Server sends SET_ID on connect (player identity)
7. ✅ Server-side shared draw pile (makeDeck, drawCard, DRAW_CARD handler, DRAWN response)
8. ✅ Client opening hand draw (3 cards from server), Draw Card button
9. ✅ Multi-player dungeon view (own dungeon highlighted as YOU, others shown)
10. ✅ Build verification: scripts/verify_build.mjs (17/17 checks pass)
11. ✅ Phase machine: LOBBY → AGENT → REVEAL → DUNGEON → ROUND_END → AGENT (loop) → GAME_OVER

## Phase 2+ (in progress / later)
- ✅ Card system: server-side deck with 19 room cards, 2 copies each, shuffled
- ✅ Auto-draw: opening hand of 3 cards, plus Draw Card button
- ✅ Rarity color-coding: common(blue), uncommon(green), rare(yellow), legendary(pink)
- ✅ PlayCard click handler with server-side validation
- ✅ Hero combat: HP/damage on server (resolveDungeon), hero health tracking
- ✅ Room slot visuals: DungeonCanvas renders 5-slot grid with HP bars
- ✅ Bot AI: botChooseCard (highest damage, rarity tiebreak)
- 🔄 Phase 3: Hero combat display (heroes shown as text, needs visual on canvas) → ✅ heroes now render on canvas for all dungeons; text replaced with combat status
- 🔄 Phase 4: Auto-play bots, multiplayer lobby enhancements, combat animations → ✅ auto-play toggle + combat flash; lobby enhancements pending

## Directory Layout
```
boss-monster-multiplayer/
  server.mjs          # Express + ws, deck system, phase machine
  package.json
  vite.config.ts
  tsconfig.json
  PLAN.md
  render.yaml         # Deploy to Render.com
  scripts/
    smoke_test.mjs    # WebSocket integration test
    verify_build.mjs  # Bundle content verification
  src/
    main.tsx
    App.tsx           # Phase-driven view: Lobby → GameView (all dungeons) → GameOver
    core/
      types.ts
    components/
      CardHandSimple.tsx  # React.memo, rarity color borders
      DungeonCanvas.tsx   # Canvas grid renderer (5 slots, HP bars)
      Lobby.tsx           # Name entry + create/join room
    data/
      cards.ts        # 19 room cards, RarityColors, drawCard()
    ai/
      bot.ts          # botChooseCard, botShouldPlay
    hooks/
      useWebSocket.ts # SET_ID, STATE, DRAWN handling, drawCard
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
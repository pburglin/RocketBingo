# Project Tasks — Rocket Bingo

## Phase 1: Project Initialization & Agentic Setup
- [ ] Initialize Node.js project (`npm init -y`) and install dependencies (Express, Socket.io, React/Vite).
- [ ] Configure `agent/validate.sh` script to run linting and tests in one go.
- [ ] Create basic directory structure (`/server`, `/client`, `/shared`).
- [ ] Setup Vitest (backend) and React Testing Library (frontend).

## Phase 2: Core Game Logic (TDD Approach)
- [ ] **Feature:** Board Generation
    - [ ] Create `generateBoard(type)` function (Classic 1-75 vs. Business Buzzwords).
    - [ ] Write unit tests to verify board has unique items and correct dimensions (5x5).
- [ ] **Feature:** Win Condition Checking
    - [ ] Create logic to check rows, columns, and diagonals.
    - [ ] Write unit tests with mock boards to confirm win detection.

## Phase 3: Real-Time Server (Socket.io)
- [ ] Setup Express server with Socket.io instance.
- [ ] Implement `create_room` event (generates Room ID).
- [ ] Implement `join_room` event (adds player to session state).
- [ ] Implement `game_state` broadcast (syncs started/stopped status).

## Phase 4: Frontend UI
- [ ] **Landing Page:** Create "Host Game" vs "Join Game" toggle.
- [ ] **Lobby:** Display QR Code (using `qrcode.react`) and Room URL.
- [ ] **Game Board:** Render 5x5 grid based on socket data.
- [ ] **Interaction:** Click handling to toggle cell state (visual only until verified).
- [ ] **Win Declaration:** "BINGO" button that emits verification request to server.

## Phase 5: Business Mode & Polish
- [ ] Create a JSON list of "Business Jargon" (e.g., "Circle back," "Low hanging fruit").
- [ ] Add UI selector for Game Mode (Classic vs. Business).
- [ ] Styling polish using Tailwind (Rocket theme: dark purples, oranges).

## Phase 6: Autonomous Verification
- [ ] Write an End-to-End (E2E) test using Playwright that simulates a Host and a Player completing a game loop.
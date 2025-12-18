# Rocket Bingo 🚀

A real-time, multiplayer Bingo web app featuring Classic and Business Meeting modes.

## Tech Stack
- **Runtime:** Node.js
- **Frontend:** React + Tailwind CSS
- **Backend:** Express + Socket.io
- **Testing:** Vitest (Unit), Playwright (E2E)

## Architecture for Agents
This project is designed to be built by autonomous agents.
* **Source of Truth:** `/shared/types.ts` (Define game interfaces here first).
* **Validation:** You must run `./agent/validate.sh` before marking a task complete.
* **State:** In-memory storage for MVP (Map<RoomID, GameState>).

## Quick Start
1. `npm install`
2. `npm run dev` (Starts client and server concurrently)

## Key Features
1. **Host Control:** Host generates a room and gets a QR Code.
2. **Player Join:** Players scan QR or use link to join mobile-first view.
3. **Live Sync:** When Host calls a number/word, it highlights on user screens (optional setting) or Users self-select.
4. **Verification:** Server validates the win when a user claims Bingo.
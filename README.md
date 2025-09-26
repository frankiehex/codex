# SyncInk 同步墨水

Real-time P2P collaborative whiteboard — draw together, talk together, no backend required.

## Features
- Real-time collaboration via Y.js CRDT + WebRTC P2P
- Pressure-sensitive drawing (Apple Pencil support)
- Multi-page whiteboard with per-page stroke isolation
- Laser pointer with auto-fade
- Voice chat over WebRTC
- URL-based room system with nickname entry
- i18n: Traditional Chinese (default) / English
- Glassmorphism UI with Tailwind CSS v4
- Special effects: Explosion + Chaos Clear

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173?room=YOUR_ROOM` in two tabs to test collaboration.

## Deploy

```bash
npm run build
npx vercel
```

# Chaos Cat

Chaos Cat is a lightweight Three.js browser game built as a static site for the 2026 Vibe Coding Game Jam.

## Play

- Open `index.html` in a browser, or serve the folder with any static host.
- Controls:
  - `WASD` or arrow keys move
  - `Space` jump
  - `Shift` dash
  - `E` or click paw swipe

## Deploy

- The project is build-free and consists of static files only.
- It can be deployed directly to Vercel, Netlify, GitHub Pages, or any simple static web host.

## Structure

- `index.html` boots the game and UI shell.
- `styles.css` contains the full visual treatment for menus and HUD.
- `src/scene.js` creates the room and supports.
- `src/playerController.js` handles the cat controller and animation.
- `src/interactables.js` manages knockable objects, fake physics, and particles.
- `src/scoringSystem.js` handles score, combo logic, ranks, and local best score.
- `src/ownerSystem.js` runs reactions and chase interruptions.
- `src/audioManager.js` creates tiny procedural sound effects with Web Audio.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based Snake game. The entire project is a single file: `snake.html`.

## Running the Game

Open `snake.html` directly in any modern browser — no build step, no server, no dependencies.

## Architecture

Everything lives in `snake.html`:

- **HTML** — canvas element, score display, message area
- **CSS** — dark theme (`#1a1a2e` background, `#4ecca3` accent), all inline in `<style>`
- **JavaScript** — all game logic inline in `<script>`:
  - Game state: `snake` (array of `{x,y}` segments), `dir`/`nextDir`, `food`, `score`, `best`, `gameState`
  - `GRID = 20`, `COLS/ROWS = 400/20 = 20` — grid dimensions
  - `step()` — advances the snake, checks collisions, grows on food
  - `draw()` — renders grid dots, food, snake with gradient coloring and directional eyes
  - `startGame()` / `endGame()` / `pauseGame()` — state transitions; speed adapts via `setTimeout` (starts at 160ms, floors at 65ms as score grows)
  - Input: keyboard only (Arrow keys + WASD, Space/Enter to start, P to pause)

## Git Workflow

After every meaningful unit of work — a feature added, a bug fixed, a refactor completed — commit and push immediately. Do not batch up multiple changes into one commit. This ensures work is never lost and the history is easy to revert.

- Commit format: `<type>: <short description>`
  - Types: `feat`, `fix`, `style`, `refactor`, `docs`
- Always push to `origin/main` (GitHub: `GithTan/claude-code-test`) right after committing
- Never leave completed work uncommitted at the end of a task

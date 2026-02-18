# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@uzimaru0000/use-pip` is a React Hook library that renders JSX components into a Picture-in-Picture window using Satori. The rendering pipeline is: **React JSX → Satori (SVG) → Canvas → MediaStream → PiP video element**.

## Commands

- **Build:** `pnpm build` (tsup, outputs CJS + ESM to `dist/`)
- **Dev (watch mode):** `pnpm dev`
- **Test:** `pnpm test` (vitest, single run)
- **Test (watch):** `pnpm test:watch`
- **Type check:** `pnpm type-check`
- **Lint:** `pnpm lint` (Biome)
- **Lint + fix:** `pnpm lint:fix`
- **Format:** `pnpm format` (Biome)
- **Storybook:** `pnpm storybook` (port 6006)

Package manager is **pnpm**. Node version is 22 (see `.tool-versions`).

## Architecture

### Rendering Pipeline (`src/satoriRenderer.ts`)

`renderToCanvas()` orchestrates the full pipeline: calls Satori to convert a JSX element into an SVG string, converts that SVG to an `HTMLImageElement`, then draws it onto a canvas.

### Core Hook (`src/hooks.ts`)

`usePinP()` creates hidden video and canvas elements, captures the canvas as a MediaStream (`captureStream`), and feeds it to the video element for PiP display. Key implementation details:
- Minimal video dimensions are computed via GCD to preserve aspect ratio efficiently
- Font resolution supports both sync and async patterns with lazy caching
- Audio support pipes through an `audioDestination` MediaStreamAudioDestinationNode
- iOS-specific handling requires synchronous user gesture for PiP entry

### Font Management (`src/fonts.ts`)

A simple cache layer (`Map<string, Font[]>`) for Satori fonts. The `FontResolver` type can return fonts synchronously or as a Promise.

### Public API (`src/index.ts`)

Exports: `usePinP` hook, `FontResolver`, `clearFontCache`, `Font`, `UnresolvedFont`.

## Code Style

- Biome for linting and formatting (2-space indent, single quotes for JS)
- TypeScript strict mode
- `react` is a peer dependency and marked as external in the build

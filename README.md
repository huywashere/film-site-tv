# NetPhim TV

Remote-first TV client for Android TV, Samsung Tizen, and LG webOS.

## Current milestone

- React and Vite TV shell
- Spatial D-pad navigation
- Versioned TV API client
- Loading, error, and demo-data states
- Android TV first architecture
- CI quality gate

## Requirements

- Node.js 22 or newer
- pnpm 9.5.0

## Local development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:4173`. Arrow keys emulate a remote control. Press Enter to select and Escape or Backspace to go back.

## Quality gate

```bash
pnpm check
```

## Architecture

Start with [docs/architecture/system-design.md](docs/architecture/system-design.md) and [docs/adr/0001-tv-stack.md](docs/adr/0001-tv-stack.md).

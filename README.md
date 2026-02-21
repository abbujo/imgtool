
# imgpipe (imgtool)

> High-performance AVIF-only image pipeline for modern web projects.

**imgpipe** is a full-stack, performance-first image processing tool designed for 2026+ web development. It strictly converts images into highly optimized, responsive AVIF variants based on predefined policies, targeting maximum mobile speeds, LCP optimization, and overall performance.

The project offers both a **powerful Command-Line Interface (CLI)** for batch processing across directories and a **modern, dynamic Web UI** (built with React) that allows users to drag and drop images for immediate local conversion and ZIP downloading. Everything runs locally on your machine, ensuring data privacy and high processing speed.

## Features

- **AVIF Only**: No legacy fallbacks. Uses `sharp` for top-tier compression.
- **Full-Stack Application**: Includes an Express backend API and a beautiful React frontend.
- **Local Web Interface**: Drag & drop processing with a visual gallery of converted results.
- **Smart Policies**: Automatically detects image type (`_hero`, `_card`, etc.) and applies specific width/quality rules.
- **Batch Processing**: Handles folders and globs via the CLI.
- **Fast**: Concurrent processing with progress indicators.
- **Safe**: Never upscales images. Preserves transparency.

## Installation

```bash
npm install -g imgpipe
# or run directly with npx
npx imgpipe ./images --out ./dist/images
```

## Usage

```bash
imgpipe <input> [options]
```

### Arguments

- `<input>`: Input folder or glob pattern (e.g., `./raw-assets` or `./raw/*.png`)

### Options

- `-o, --out <dir>`: Output directory (default: `./output`)
- `--clean`: Empty output directory before processing
- `--dry-run`: Simulate conversion without generating files
- `--cap <width>`: Cap maximum width (override policy)
- `-q, --quality <n>`: Override AVIF quality (0-100)
- `-e, --effort <n>`: Override CPU effort (0-9)
- `-h, --help`: Display help

## Naming Convention

Suffix your files to trigger specific policies:

- `image_hero.jpg` -> Uses **HERO** policy (high quality, multiple LCP breakpoints)
- `icon_github.png` -> Uses **ICON** policy (many small sizes)
- `photo_card.jpg` -> Uses **CARD** policy
- `logo_brand.png` -> Uses **LOGO** policy

Default policy is **GENERAL** if no suffix matches.

## Policies

| Type | Widths | Quality |
|---|---|---|
| **HERO** | 400, 720, 800, 1200, 1440 | 50 (effort 6) |
| **CARD** | 320, 480, 640, 960 | 50 |
| **GENERAL** | 320, 640, 960, 1200 | 50 |
| **ICON** | 32, 48, 64, 96, 128, 192 | 50 |
| **LOGO** | 128, 192, 256, 384, 512 | 50 |

## Web App Development

For a better developer experience, you can run both the backend server and the frontend client concurrently with a single command:

```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:3001`
- Frontend UI on `http://localhost:5173`

## License


ISC

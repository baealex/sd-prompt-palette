# Ocean Palette

> A self-hosted personal workspace for your image-generation workflow

Manage prompts like a color palette, browse your generated images, extract metadata, and sync your output folder — all in one place.

![](https://github.com/baealex/ocean-palette/assets/35596687/e4310657-7520-4f0b-9645-6e8f754a6461)

![](https://github.com/baealex/ocean-palette/assets/35596687/207c4996-a932-4216-b41d-c328a8397a0d)

![](https://github.com/baealex/ocean-palette/assets/35596687/4e1242f3-e4d6-4265-9b46-18d2da6775f1)

## Features

- **Ocean Palette** — Organize keywords by category, click to copy, drag to reorder. Treat words like paint on a palette.
- **Image Metadata Reader** — Upload any SD-generated image to extract model, sampler, steps, CFG, seed, and upscale info.
- **Collection Manager** — Save and browse your favorite generations in list, gallery, browse, or slideshow view.
- **Live Sync** — Watch your output folder and auto-import new images as they're generated.
- **Idea Generator** — Randomly combine keywords across categories to spark new prompt ideas.

## Quick Start

### Docker (Recommended)

```bash
docker run \
    -v ./data:/data \
    -v ./assets:/assets \
    -p 3332:3332 \
    baealex/ocean-palette
```

Open `http://localhost:3332` and start organizing.

### Node.js

```bash
git clone https://github.com/baealex/ocean-palette
cd ocean-palette
pnpm i
pnpm start
```

Open `http://localhost:3332`.

## License

[MIT](./LICENSE)

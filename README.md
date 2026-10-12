# SnaxSmart 3D vending demo

Unofficial design demo of a marketing site for SnaxSmart (healthy-snack
vending machines on rent), built around an interactive 3D vending machine.
Not affiliated with or endorsed by SnaxSmart.

## Run it

```bash
npm install
npm run dev      # local dev server
```

## Build

```bash
npm run build    # outputs static site to dist/
npm run preview  # serve the production build locally
```

The build is a fully static site (React + Vite, Three.js vendored in
`src/vendor/`) - host `dist/` on any static file server.

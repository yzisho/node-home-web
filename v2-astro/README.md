# NODE LEGION home page — Astro version

Mirrors a standard Astro project layout so integration is copying files over:

```
public/
  images/hero-legion.webp     ← hero background (used by globals.css)
  images/hero-legion.jpg      ← fallback / og:image
src/
  components/Card.astro       ← reusable card (plain, gold, centered, or link)
  layouts/BaseLayout.astro    ← <head>, sticky nav, footer, mobile-menu script
  pages/home.astro            ← the page → served at /home
  styles/card.css             ← card styles (imported by Card.astro)
  styles/globals.css          ← theme variables + all other styles (imported by BaseLayout)
```

## Integration

1. Copy `public/images/*` into the project's `public/images/`.
2. Copy `src/pages/home.astro` into `src/pages/`.
3. For the rest, two options:
   - **Standalone look (easiest):** copy `BaseLayout.astro`, `Card.astro`, `card.css`, `globals.css` over as-is. ⚠️ If the project already has files with these names, this replaces them and affects other pages — check first.
   - **Keep the existing site's shell:** don't copy `BaseLayout.astro`; instead point `home.astro`'s import at the existing layout, and move the nav/footer markup + `globals.css` import wherever that layout expects them.

## Editing

- Colors: CSS variables at the top of `styles/globals.css` (blue `#54b0ff`, gold `#ffb454`, navy backgrounds).
- Copy/text: the data arrays at the top of `pages/home.astro` (facts, steps, fees, socials); FAQ answers are plain HTML in the same file.
- To serve it as the front page instead of `/home`, rename `home.astro` → `index.astro`.

# Glyph: Opera Freeze

## Abstract
Opera freeze pattern: render-blocking third-party fonts plus tracker blocker or a hung tab equals no first paint. Title can show. The viewport stays browser-chrome grey. Refreshing the same tab reloads the hang.

## Verified Instances
- Operator screenshots 2026-08-23/24: “Grimoire — Constellation” title, blank Opera/Comet tab, refresh loops.
- Playwright Chromium loaded the same URL with full UI. Proof the server was not down.
- Fix path: non-blocking fonts, inline boot splash, `book.html` new cache key, Edge + local `127.0.0.1:8765`.

## Caveats
- Does not mean GRIMOIRE cannot run in Chromium-family browsers. Edge/Chrome were fine.
- Does not apply to a true GitHub Pages 404 (title would be “Site not found”).

## Scaling Gaps
- Self-host Cinzel/Source Sans so first paint never waits on Google.
- Detect hung first paint >4s and swap in the inline overlay even on old cached HTML via service worker — only if Cell1 wants a SW.

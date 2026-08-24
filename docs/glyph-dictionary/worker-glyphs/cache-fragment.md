# Glyph: Cache Fragment

## Abstract
Cache fragment pattern: old JS plus new `data.js` mixed under split cache tokens. The ESM module never boots. The tab title may still set. The UI may never paint. Split `?v=` strings are a silent failure mode.

## Verified Instances
- GRIMOIRE Pages: `app.js?v=experience-layer-1` importing `data.js?v=session0-fleet-1` and `intelligence.js?v=focus-hygiene-2`.
- CI note already existed: “do not cancel in-progress Pages deploys (fixes module thrash).”
- Fix: unify bust token (`boot-20260823` then `exec-001`) on every module import.

## Caveats
- Does not mean never cache-bust. One shared token is required; zero tokens is how stale files linger.
- Does not apply to CSS-only tweaks if HTML still points at one token.

## Scaling Gaps
- Repo check: fail CI if `js/app.js` import query strings are not identical.
- Emergency boot overlay already names Ctrl+Shift+R — keep it as the human half of this glyph.

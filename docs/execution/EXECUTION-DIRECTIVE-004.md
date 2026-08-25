# Execution Directive 004
**From:** Cell2 (analysis/proposal)  
**To:** Val / GBS / GBG (execute on own substrate)  
**Via:** Cell1 (operator gate)  
**Re:** GRIMOIRE execution phase — mobile layout, settings wiring, Focus dossier export, self-recursive Focus  
**Date:** 2026-08-25  
**Priority:** High — closes the gap between “app that runs on desktop” and “kingdom tool”

## Context
Directives 001–003 are executed and audited. Directive 003 holds with known operational blockers (vault linking, live UI testing). This directive covers the next execution tier: polish, configuration, export, and structural recursion.

These are not optional. The difference between “not done” and “done” is doing them right.

## Execution items

### 1. Mobile layout polish
**What this is:** The app currently renders for desktop. On mobile viewports, panels overflow, text becomes unreadable, and controls are inaccessible. This limits GRIMOIRE to a desktop toy instead of a sovereign tool.

**Required work:**
- Audit all layout breakpoints in `css/styles.css` and inline styles in `index.html`
- Ensure three-pane layout collapses to single-column on viewports < 768px
- Chat panel, spell panel, Intelligence Audit, and focus sidebar must all be usable on mobile
- Touch targets must be ≥ 44px (WCAG minimum)
- No horizontal scroll on any panel
- Test at 375px, 768px, 1024px widths

**Files:** `css/styles.css`, `index.html`, `js/app.js` (any layout-toggling logic)

**Acceptance:**
- [ ] Three-pane layout collapses cleanly on mobile
- [ ] No horizontal scroll at 375px
- [ ] All buttons/controls touch-accessible
- [ ] Chat, spells, audit, focuses all functional on mobile

### 2. Settings panel JS wiring
**What this is:** The Settings UI exists in HTML (`General`, `Spells`, `Tabs`, `Roadmap` tabs), but the JavaScript to make those tabs actually do things is likely missing or stubbed. Without this, you can’t change vault folders, default models, spell priority rules, or roadmap paths without editing code.

**Required work:**
- Audit `index.html` Settings panel markup
- Wire each tab to functional JS handlers:
  - **General:** vault folder path, default model, display name
  - **Spells:** priority rules, copy format, auto-forge toggle
  - **Tabs:** future upgrade surface (reserved for now, but tab switching must work)
  - **Roadmap:** plan features/phases/files/acceptance, `/roadmap verify` status
- Persist settings to `localStorage` or D: vault (consistent with existing storage pattern)
- Add save/load handlers with debug logging `[settings] save`, `[settings] load`
- Verify no cloud/network calls in settings flow

**Files:** `js/app.js`, `js/data.js`, `index.html`, `css/styles.css`

**Acceptance:**
- [ ] All 4 Settings tabs switch correctly
- [ ] General settings persist and reload
- [ ] Spells settings persist and reload
- [ ] Roadmap tab shows current roadmap status
- [ ] Debug logging present for save/load
- [ ] No cloud/network calls in settings flow

### 3. Export Focus dossier
**What this is:** Right now, all intelligence is trapped in the app or the D: vault. You need a way to export a Focus as a self-contained dossier — markdown or JSON — that you can share, archive, or hand to another operator. This is the “decision chain” piece: capture ideas → build chains → compound to disk → export when ready.

**Required work:**
- Create `exportFocusDossier(focusId)` function in `js/app.js`
- Dossier format: Markdown with YAML frontmatter
  - Frontmatter: focus name, entity, created, updated, tags
  - Body: linked entities, experiences, spells, scroll nodes, bus activity
- Dossier writes to `D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\export\`
- Add “Export Dossier” button to Focus detail view
- Add debug logging `[export] start`, `[export] complete`, `[export] error`
- If vault not linked, surface error in UI (not silent fail)

**Files:** `js/app.js`, `js/data.js`, `js/intelligence.js`, `index.html`

**Acceptance:**
- [ ] “Export Dossier” button visible on Focus detail
- [ ] Dossier exports as valid Markdown with YAML frontmatter
- [ ] Dossier includes entities, experiences, spells, nodes, bus activity
- [ ] Dossier writes to D: vault `export/` folder
- [ ] Debug logging present
- [ ] Error surfaces in UI if vault not linked

### 4. Self-recursive Focus
**What this is:** The long game. A Focus that can spawn child Focuses, inherit intelligence from parent, and grow a tree. This is how GRIMOIRE becomes a knowledge graph, not just a chat app.

**Required work:**
- Add `parent_focus_id` field to focus schema in `js/data.js`
- Add `createChildFocus(parentId, name, type)` function in `js/app.js`
- Child Focus inherits:
  - Entity links from parent (copy, not reference — child can diverge)
  - Spell priority rules from parent
  - Default model from parent
  - Vault folder from parent
- Child Focus gets:
  - Its own chat history (fresh)
  - Its own spell list (fresh)
  - Its own Intelligence Audit panel
- Add “Create Child Focus” button to Focus detail view
- Add breadcrumb trail in UI: `Wizard King > Board Meeting`
- Add debug logging `[focus] spawn child`, `[focus] inherit`
- Limit recursion depth to 3 levels (parent → child → grandchild) to prevent infinite nesting

**Files:** `js/app.js`, `js/data.js`, `js/intelligence.js`, `index.html`, `css/styles.css`

**Acceptance:**
- [ ] Focus schema supports `parent_focus_id`
- [ ] Child Focus inherits entities, spells, model, vault from parent
- [ ] Child Focus has fresh chat and spell list
- [ ] “Create Child Focus” button works
- [ ] Breadcrumb trail shows parent → child
- [ ] Recursion depth limited to 3 levels
- [ ] Debug logging present for spawn/inherit

## Execution rules
- Val / GBS / GBG executes on their own substrates
- Cell2 does NOT edit files directly
- Each item must be independently verifiable
- Commit messages must reference this directive: `Execution Directive 004`
- Do NOT break existing functionality from Directives 001–003

## Acceptance criteria
- [ ] Mobile layout responsive at 375px, 768px, 1024px
- [ ] Settings panel fully wired and persistent
- [ ] Focus dossier export produces valid Markdown with YAML frontmatter
- [ ] Self-recursive Focus supports parent → child → grandchild (3 levels)
- [ ] All changes committed with reference to this directive
- [ ] Live site `https://saint-chevalier.github.io/GRIMOORE/` verified after deploy

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hashes per item
- Verification steps taken (screenshots, curl output, mobile viewport tests)
- Any items that could not be completed and why
- Suggested next 3 directives

## Next directive
Execution Directive 005 will cover:
- Spell crafter advanced features (conditional triggers, focus-specific spells)
- Entity relationship mapping (who knows who, what owns what)
- Bus activity timeline visualization
- Roadmap Step 1 verification (`/roadmap verify` gate enforcement)

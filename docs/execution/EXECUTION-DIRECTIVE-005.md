# Execution Directive 005
**From:** Cell2 (analysis/proposal)  
**To:** Val / GBS / GBG (execute on own substrate)  
**Via:** Cell1 (operator gate — pending approval after Directive 004)  
**Re:** GRIMOIRE execution phase — spell crafter advanced features, entity relationship mapping, bus activity timeline, roadmap verify gate  
**Date:** 2026-08-25  
**Priority:** Medium — advanced features after core polish is stable

## Context
Directives 001–004 cover stabilization, verification, polish, configuration, export, and recursion. This directive covers advanced features that depend on those foundations being solid.

Do not start this directive until Directive 004 is executed, audited, and approved by Cell1.

## Execution items

### 1. Spell crafter advanced features
**What this is:** The basic spell crafter ships with tier/mastery and upgrade triggers. This adds conditional logic and focus-specific behavior.

**Required work:**
- Add `conditions` field to spell schema: `{ entity: "Wizard King", alignment_min: 0.6, has_entity: ["Boardy"], focus_type: "Person" }`
- Add `evaluateSpellConditions(spell, context)` function in `js/data.js`
- Spell only drafts/forges when all conditions evaluate true
- Add “Conditions” section to spell detail view in `index.html`
- Add debug logging `[spell-conditions] pass` / `[spell-conditions] fail` with reason
- Persist conditions in spell YAML/markdown

**Files:** `js/app.js`, `js/data.js`, `index.html`, `css/styles.css`

**Acceptance:**
- [ ] Spell schema supports `conditions` array
- [ ] `evaluateSpellConditions()` blocks draft/forge when conditions fail
- [ ] Conditions visible in spell detail view
- [ ] Debug logging shows pass/fail with reason
- [ ] Conditions persist across sessions

### 2. Entity relationship mapping
**What this is:** Right now entities are isolated facts. This adds relationship edges: who knows who, what owns what, who works where.

**Required work:**
- Add `relationships` field to entity schema in `js/data.js`: `{ target_entity: "Boardy", relation: "knows", since: "2026-08", strength: 0.8 }`
- Add supported relations: `knows`, `owns`, `works_for`, `member_of`, `created_by`, `linked_to`, `conflicts_with`
- Add relationship editor to entity detail view (add/remove/edit relations)
- Add relationship visualization in Intelligence Audit panel (simple graph or list)
- Auto-capture relationship hints from conversation patterns (“X works for Y”, “X knows Z”)
- Add debug logging `[entity-rel] add`, `[entity-rel] remove`

**Files:** `js/app.js`, `js/data.js`, `js/intelligence.js`, `index.html`, `css/styles.css`

**Acceptance:**
- [ ] Entity schema supports `relationships` array
- [ ] Relationship editor works in entity detail view
- [ ] Relationships visible in Audit panel
- [ ] Auto-capture detects relationship patterns
- [ ] Debug logging present for relationship mutations

### 3. Bus activity timeline visualization
**What this is:** The bus is the nervous system of GRIMOIRE — messages flow between focuses, entities, and external channels. Right now it’s invisible. This adds a timeline view.

**Required work:**
- Add `bus-timeline` panel to Intelligence Audit (new tab or section)
- Render bus activity as chronological timeline: timestamp, source focus, target, message type, payload preview
- Filter by: focus, entity, date range, message type
- Click a timeline entry to jump to the relevant focus or entity
- Persist timeline filters in `localStorage`
- Add debug logging `[bus-timeline] render`, `[bus-timeline] filter`

**Files:** `js/app.js`, `js/data.js`, `js/intelligence.js`, `index.html`, `css/styles.css`

**Acceptance:**
- [ ] Bus timeline tab/section visible in Audit panel
- [ ] Timeline renders chronologically with source/target/type
- [ ] Filters work (focus, entity, date range, type)
- [ ] Click entry navigates to relevant focus/entity
- [ ] Filters persist across sessions
- [ ] Debug logging present

### 4. Roadmap Step 1 verification gate enforcement
**What this is:** The `grimoire-sovereign-evolution.md` roadmap says Step 1 (bus relay serialization) is pending until `/roadmap verify` passes. The gate exists but may not enforce completion. This makes it real.

**Required work:**
- Audit `/roadmap verify` implementation in `js/app.js` or `tools/roadmap-verify.mjs`
- Ensure `/roadmap verify grimoire-sovereign-evolution` runs executable checks, not just text matching
- Checks must include:
  - Bus relay preserves full payload (from Directive 003)
  - Entity auto-capture writes valid YAML to D: vault
  - Session0 retirement has no active routing references
  - Spell crafter triggers fire on cast/forge
- `/roadmap verify` must return `complete`, `blocked`, or `pending` with specific reasons
- Step 1 auto-transitions to `complete` only when all checks pass
- Add debug logging `[roadmap-verify] pass` / `[roadmap-verify] fail` with check name

**Files:** `js/app.js`, `tools/roadmap-verify.mjs`, `docs/roadmaps/grimoire-sovereign-evolution.md`

**Acceptance:**
- [ ] `/roadmap verify grimoire-sovereign-evolution` runs executable checks
- [ ] Checks cover bus relay, entity writes, Session0 retirement, spell crafter
- [ ] Returns `complete`/`blocked`/`pending` with reasons
- [ ] Step 1 auto-transitions to `complete` only when all checks pass
- [ ] Debug logging present for each check

## Execution rules
- Val / GBS / GBG executes on their own substrates
- Cell2 does NOT edit files directly
- Each item must be independently verifiable
- Commit messages must reference this directive: `Execution Directive 005`
- Do NOT start until Directive 004 is executed, audited, and approved by Cell1

## Acceptance criteria
- [ ] Spell conditions block draft/forge when unmet
- [ ] Entity relationships mappable and visualizable
- [ ] Bus activity timeline renders, filters, and navigates
- [ ] `/roadmap verify` enforces Step 1 completion with executable checks
- [ ] All changes committed with reference to this directive
- [ ] Live site verified after deploy

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hashes per item
- Verification steps taken (screenshots, console logs, test results)
- Any items that could not be completed and why
- Suggested next 3 directives

## Next directive
Execution Directive 006 will cover:
- Advanced bus features (cross-focus spell casting, entity-triggered automation)
- Mobile-specific UX refinements (swipe gestures, offline mode)
- Community/contribution system scaffolding (if open source path is active)
- Performance audit and bundle size optimization

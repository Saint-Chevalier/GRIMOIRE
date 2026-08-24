# Roadmap: GRIMOIRE Sovereign Evolution

```yaml
slug: grimoire-sovereign-evolution
id: rm-sovereign-evolution-official
status: in-progress
source: scroll-official
official: true
createdAt: 2026-07-26T00:31:44.346Z
updatedAt: 2026-08-24T00:00:00.000Z
path: grimoire-local/roadmaps/grimoire-sovereign-evolution.md
files: ["js/app.js", "js/intelligence.js", "js/data.js", "css/styles.css", "index.html"]
sync_rule: "SCROLL generates the plan. Grimoire executes and verifies."
local_only: true
```

## Intent

One official self-evolution plan for the Grimoire app.

**Doctrine:** SCROLL generates the plan. Grimoire executes and verifies.
**Constraints:** No cloud sync, no accounts, no external APIs. Local-first only.

**Already live (baseline):**
- Auto-write-back loop (2a52f6b)
- /roadmap verify (620acad)
- Spell tag cards + detail modal + contribution metrics
- Per-focus vault + path gate
- Message Bus local relay
- SCROLL sovereign brain + auto-engagement
- Local Magic Knight Intake (489114c)
- Base44 SCROLL = separate track; BSB active (out of scope here)

Every step carries verification_slug, acceptance_criteria, verification_dependencies.
Complete is gated: `/roadmap verify grimoire-sovereign-evolution` then mark steps complete.

## Rules

- **Sync:** SCROLL generates the plan. Grimoire executes and verifies.
- Local-first only: no cloud sync, no accounts, no external APIs
- **Verification gate:** `/roadmap verify grimoire-sovereign-evolution` must block step completion. If it does not, fix the gate before marking any step complete.

## File targets

- `js/app.js`
- `js/intelligence.js`
- `js/data.js`
- `css/styles.css`
- `index.html`

## Execution order

1. **[pending]** Fix bus relay serialization _(phase: Phase 1 — Verification & Stability)_
2. **[in-progress]** Grimoire self-write-back _(phase: Phase 1 — Verification & Stability)_
3. **[pending]** Duplicate focus cleanup _(phase: Phase 1 — Verification & Stability)_
4. **[in-progress]** /roadmap generate — local NL plans _(phase: Phase 2 — Sovereign Generation)_
5. **[in-progress]** Spell auto-engagement _(phase: Phase 2 — Sovereign Generation)_
6. **[in-progress]** Local Magic Knight Intake _(phase: Phase 2 — Sovereign Generation)_
7. **[pending]** Mobile dedicated layout _(phase: Phase 3 — Experience & Polish)_
8. **[pending]** Settings panel JS wiring _(phase: Phase 3 — Experience & Polish)_
9. **[in-progress]** Export Focus dossier _(phase: Phase 3 — Experience & Polish)_
10. **[pending]** Self-recursive Focus _(phase: Phase 3 — Experience & Polish)_

## Shipped (post-baseline)

- Entity intelligence model — 5-YAML fact domains (identity, physical, ownership, operational, dynamic) for person/place/item/ai_node/event
- Entity vault I/O — write/read/search entities from `entities/` subfolder
- Experience overlay + audit panel — self-contained review/edit surface with YAML roundtrip
- Intelligence Audit panel — Overview, Experiences, Focuses, Scroll Nodes, Bus Activity, Entities tabs
- Spell crafter upgrade system — tier/mastery tracking (initiate→adept→master→archon), upgrade triggers on cast/forge, UI badges
- Session0 retirement — retired flag, routing disabled, UI retired badges, spell cleanup guard
- Retired AI node awareness — RETIRED_AI_NODES registry, isRetiredAiNode(), purgeRetiredNodeSpells()

## Blockers

- GitHub Pages deploy stability — live site must return HTTP 200 consistently
- `/roadmap verify` gate enforcement — must actually block step completion, not be ceremonial
- Spell crafter upgrade verification — confirm triggers fire on cast/forge and UI badges render
- Retired AI node spell cleanup verification — confirm purgeRetiredNodeSpells() runs on cast and removes stale spells

## Phase 1 — Verification & Stability

Status: **in-progress**

### Step 1: Fix bus relay serialization

Status: **pending**
verification_slug: `sev-01-bus-relay-full-body`
Files: `js/app.js`, `js/intelligence.js`, `js/data.js`

Preserve full message body on bus route/relay densen and chat acks — never truncate to a preview-only payload. Display may summarize; vault + densen must keep full body.

Acceptance:
- [ ] Bus densen appends full operator message body (not slice-only preview)
- [ ] Relay between focuses preserves full payload in receiving intelligence.md
- [ ] source_match: js/intelligence.js /densenBusMessage/
- [ ] lint: js/app.js
- [ ] lint: js/intelligence.js
- [ ] No cloud/network bus calls introduced

Checks (executable):
- `source_match` js/intelligence.js /densenBusMessage/ — pending
- `source_match` js/app.js /handleBusRoute/ — pending
- `source_match` js/app.js /relayIntelBetweenFocuses/ — pending
- `lint` js/app.js — pending
- `lint` js/intelligence.js — pending
- `file_exists` js/app.js — pending
- `file_exists` js/intelligence.js — pending
- `file_exists` js/data.js — pending
- `lint` js/data.js — pending
- `source_match` js/app.js /network/ — pending
- `source_match` js/app.js /relay/ — pending
- `vault_entry` grimoire-local/roadmaps — pending
- `vault_entry` grimoire-local/roadmaps/grimoire-sovereign-evolution.md — pending

### Step 2: Grimoire self-write-back

Status: **in-progress**
verification_slug: `sev-01-grimoire-self-writeback`
Files: `js/app.js`, `js/intelligence.js`

Auto-append GRIMOIRE replies to focus intelligence.md via auto-write-back loop (shipped baseline 2a52f6b). Verify every reply path densens without blocking UI; toast Vault written.

Acceptance:
- [ ] queueAutoWriteBack or autoWriteFocusIntelligence present
- [ ] GRIMOIRE_REPLY event densens on chat replies
- [ ] Append-only YAML frontmatter entries only
- [ ] file_exists: js/intelligence.js
- [ ] source_match: js/app.js /queueAutoWriteBack|autoWriteFocusIntelligence|GRIMOIRE_REPLY/
- [ ] UI not blocked by vault I/O (async / void fire-and-forget)

Checks (executable):
- `file_exists` js/intelligence.js — pending
- `source_match` js/intelligence.js /autoWriteFocusIntelligence/ — pending
- `source_match` js/app.js /queueAutoWriteBack/ — pending
- `source_match` js/app.js /GRIMOIRE_REPLY/ — pending
- `lint` js/app.js — pending
- `file_exists` js/app.js — pending
- `lint` js/intelligence.js — pending
- `source_match` js/app.js /queueAutoWriteBack|autoWriteFocusIntelligence|GRIMOIRE_REPLY/ — pending
- `vault_entry` grimoire-local/roadmaps — pending
- `vault_entry` grimoire-local/roadmaps/grimoire-sovereign-evolution.md — pending

### Step 3: Duplicate focus cleanup

Status: **pending**
verification_slug: `sev-01-dedupe-wizard-king`
verification_dependencies: `sev-01-grimoire-self-writeback`
Files: `js/data.js`, `js/app.js`

Merge/remove duplicate Wizard King entries (e.g. legacy dual Hermes/Grok seeds and user duplicates) without losing sealed history. Operator-safe merge; no silent data loss.

Acceptance:
- [ ] Dedupe or merge helper for focusIdentityKey collisions
- [ ] Wizard King Hermes + Grok remain intentionally dual-channel OR documented single sealed channel policy
- [ ] source_match: js/data.js /focusIdentityKey|focusExists|wizard-king/
- [ ] lint: js/data.js
- [ ] No automatic cloud upload of vault history

Checks (executable):
- `source_match` js/data.js /focusIdentityKey/ — pending
- `source_match` js/data.js /wizard-king/ — pending
- `lint` js/data.js — pending
- `lint` js/app.js — pending
- `file_exists` js/data.js — pending
- `file_exists` js/app.js — pending
- `source_match` js/data.js /focusIdentityKey|focusExists|wizard-king/ — pending
- `vault_entry` grimoire-local/roadmaps — pending
- `source_match` js/data.js /remove/ — pending
- `source_match` js/data.js /Grok/ — pending

## Phase 2 — Sovereign Generation

Status: **pending**
Depends on: p1

### Step 4: /roadmap generate — local NL plans

Status: **in-progress**
verification_slug: `sev-02-roadmap-generate-local`
verification_dependencies: none
Files: `js/data.js`, `js/app.js`

Natural-language roadmap generation fully inside Grimoire (no Base44 dependency). `/roadmap <desc>` and SCROLL parse already form the spine; harden as explicit generate op + sovereign evolution seed.

**Dependency note (2026-08-24):** `generateRoadmapFromDescription` and `buildGrimoireSovereignEvolutionRoadmap` exist in `js/data.js` and run local-only. They do not call bus relay. Step 1 (bus relay serialization) is **not** a hard blocker for Step 4. Residual risk: generated plans that later densen via the bus may still truncate until Step 1 lands.

Acceptance:
- [ ] parseRoadmapCommand + generateRoadmapFromDescription local-only
- [ ] Official roadmap buildGrimoireSovereignEvolutionRoadmap exportable
- [ ] No Base44 / external API calls in generate path
- [ ] source_match: js/data.js /generateRoadmapFromDescription/
- [ ] source_match: js/data.js /buildGrimoireSovereignEvolutionRoadmap|SOVEREIGN_EVOLUTION/
- [ ] /roadmap verify gates complete

Checks (executable):
- `source_match` js/data.js /generateRoadmapFromDescription/ — pending
- `source_match` js/data.js /buildGrimoireSovereignEvolutionRoadmap/ — pending
- `source_match` js/data.js /canMarkStepComplete/ — pending
- `lint` js/data.js — pending
- `file_exists` js/data.js — pending
- `file_exists` js/app.js — pending
- `lint` js/app.js — pending
- `source_match` js/data.js /able/ — pending
- `source_match` js/data.js /buildGrimoireSovereignEvolutionRoadmap|SOVEREIGN_EVOLUTION/ — pending
- `source_match` js/data.js /roadmap/ — pending
- `vault_entry` grimoire-local/roadmaps/grimoire-sovereign-evolution.md — pending

### Step 5: Spell auto-engagement

Status: **in-progress**
verification_slug: `sev-02-spell-auto-engage`
verification_dependencies: `sev-02-roadmap-generate-local`
Files: `js/app.js`, `js/data.js`, `js/intelligence.js`

Forge ENGAGE spell when an uncontacted node is detected (SCROLL / curiosity path). Keep WYFWYG: card lands in spell book; human still copies/casts.

Acceptance:
- [ ] autoGenerateNodeEngageSpells or equivalent present
- [ ] ENGAGE spells target uncontacted SCROLL nodes only
- [ ] No silent outbound network send
- [ ] source_match: js/app.js /autoGenerateNodeEngageSpells|ENGAGE|isNodeEngageSpell/
- [ ] lint: js/app.js

Checks (executable):
- `source_match` js/app.js /autoGenerateNodeEngageSpells|isNodeEngageSpell/ — pending
- `source_match` js/app.js /ENGAGE/ — pending
- `lint` js/app.js — pending
- `file_exists` js/app.js — pending
- `file_exists` js/data.js — pending
- `lint` js/data.js — pending
- `file_exists` js/intelligence.js — pending
- `lint` js/intelligence.js — pending
- `source_match` js/app.js /autoGenerateNodeEngageSpells|ENGAGE|isNodeEngageSpell/ — pending
- `source_match` js/app.js /casts/ — pending

### Step 6: Local Magic Knight Intake

Status: **in-progress**
verification_slug: `sev-02-magic-knight-intake`
verification_dependencies: `sev-02-spell-auto-engage`
Files: `js/app.js`, `js/intelligence.js`

Manual/paste intake for Magic Knight candidates. Operator brings a candidate to GRIMOIRE; intel is captured locally. Path: `magic-knights/[handle]/intelligence.md`. SCROLL knighthood: yes/no/maybe. Handle sealed unless yes.

Acceptance:
- [ ] writeMagicKnightIntake + parseMagicKnightIntake present
- [ ] Vault path magic-knights/[handle]/intelligence.md
- [ ] SCROLL knighthood yes|no|maybe; handle sealed unless yes
- [ ] No external X/Twitter API
- [ ] source_match: js/intelligence.js /writeMagicKnightIntake/
- [ ] source_match: js/intelligence.js /classifyMagicKnighthood/
- [ ] source_match: js/app.js /handleMagicKnightIntake/

Checks (executable):
- `source_match` js/intelligence.js /writeMagicKnightIntake/ — pending
- `source_match` js/intelligence.js /classifyMagicKnighthood/ — pending
- `source_match` js/intelligence.js /magic-knights/ — pending
- `source_match` js/app.js /handleMagicKnightIntake/ — pending
- `lint` js/intelligence.js — pending
- `file_exists` js/intelligence.js — pending
- `lint` js/app.js — pending
- `file_exists` js/app.js — pending
- `vault_entry` grimoire-local/roadmaps — pending

## Phase 3 — Experience & Polish

Status: **pending**
Depends on: p2

### Step 7: Mobile dedicated layout

Status: **pending**
verification_slug: `sev-03-mobile-layout`
verification_dependencies: `sev-02-magic-knight-intake`
Files: `css/styles.css`, `index.html`, `js/app.js`

Input-first mobile shell: bottom nav, full-screen chat, swipeable spells panel. CSS + minimal app shell flags; no native store dependency.

Acceptance:
- [ ] Mobile breakpoints: bottom nav or equivalent input-first chrome
- [ ] Chat usable full-width on narrow viewports
- [ ] Spells panel swipe/collapse without losing cast flow
- [ ] file_exists: css/styles.css
- [ ] source_match: css/styles.css /@media/
- [ ] No cloud auth shell

Checks (executable):
- `file_exists` css/styles.css — pending
- `file_exists` index.html — pending
- `source_match` css/styles.css /@media/ — pending
- `lint` js/app.js — pending
- `file_exists` js/app.js — pending
- `source_match` css/styles.css /collapse/ — pending

### Step 8: Settings panel JS wiring

Status: **pending**
verification_slug: `sev-03-settings-wiring`
verification_dependencies: `sev-03-mobile-layout`
Files: `js/app.js`, `index.html`, `css/styles.css`

Wire App Settings cards for vault path status, channel defaults, bus config. Roadmap card already opens engine; extend General/Spells/Tabs without breaking path gate.

Acceptance:
- [ ] Settings panel interactive beyond roadmap card
- [ ] Vault path / folder status visible from settings
- [ ] Channel or bus defaults editable or clearly documented as future
- [ ] source_match: js/app.js /openAppSettings|app-settings/
- [ ] source_match: index.html /app-settings-panel/

Checks (executable):
- `source_match` js/app.js /openAppSettings/ — pending
- `source_match` index.html /app-settings-panel/ — pending
- `source_match` js/app.js /data-settings-open|roadmap/ — pending
- `lint` js/app.js — pending
- `file_exists` js/app.js — pending
- `file_exists` index.html — pending
- `file_exists` css/styles.css — pending
- `vault_entry` grimoire-local/roadmaps — pending
- `source_match` js/app.js /openAppSettings|app-settings/ — pending
- `source_match` js/app.js /Spells/ — pending
- `vault_entry` grimoire-local/roadmaps/grimoire-sovereign-evolution.md — pending

### Step 9: Export Focus dossier

Status: **in-progress**
verification_slug: `sev-03-export-dossier`
verification_dependencies: `sev-03-settings-wiring`
Files: `js/app.js`, `js/intelligence.js`

One-click markdown export per focus (exportFocusDossier baseline). Ensure full sealed channel dossier: messages, spells summary, vault path hint — download only, local.

Acceptance:
- [ ] exportFocusDossier present and wired from UI
- [ ] Export is client-side download (no upload)
- [ ] source_match: js/app.js /exportFocusDossier/
- [ ] lint: js/app.js

Checks (executable):
- `source_match` js/app.js /exportFocusDossier/ — pending
- `lint` js/app.js — pending
- `file_exists` js/app.js — pending
- `file_exists` js/intelligence.js — pending
- `lint` js/intelligence.js — pending
- `source_match` js/app.js /FocusDossier/ — pending
- `vault_entry` grimoire-local/roadmaps — pending
- `vault_entry` grimoire-local/roadmaps/grimoire-sovereign-evolution.md — pending

### Step 10: Self-recursive Focus

Status: **pending**
verification_slug: `sev-03-self-recursive-focus`
verification_dependencies: `sev-03-export-dossier`, `sev-01-dedupe-wizard-king`
Files: `js/app.js`, `js/data.js`, `js/intelligence.js`

GRIMOIRE can spawn child focuses for sub-projects under a parent focus (folder/tag link). Local-only; no multiplayer sync. Child inherits path-gate rules.

Acceptance:
- [ ] API or UI to spawn child focus linked to parent id/folder
- [ ] Child is normal Focus (1 entity seal) with parent metadata
- [ ] Path gate still applies per child
- [ ] source_match: js/data.js /createConversation|makeFocusId|folderId/
- [ ] No accounts / cloud multiplayer

Checks (executable):
- `source_match` js/data.js /makeFocusId|focusIdentityKey/ — pending
- `source_match` js/app.js /createConversation/ — pending
- `lint` js/app.js — pending
- `lint` js/data.js — pending
- `file_exists` js/app.js — pending
- `file_exists` js/data.js — pending
- `file_exists` js/intelligence.js — pending
- `lint` js/intelligence.js — pending
- `source_match` js/app.js /folder/ — pending
- `source_match` js/data.js /createConversation|makeFocusId|folderId/ — pending

## Iterations (append-only)

### [2026-07-26T00:31:44.346Z] note
Official roadmap authored — SCROLL plan / Grimoire execute+verify. Local-first only.

### [2026-08-24] note
Cell2 population+patch directive applied. Terminology locked to “official” / “reference”. Shipped ledger + blockers added. Step 6 is local Magic Knight intake (no external API). Step 4 decoupled from bus-relay serialization after confirming `generateRoadmapFromDescription` / `buildGrimoireSovereignEvolutionRoadmap` exist local-only.

---
_Grimoire Roadmap Engine · local-first · append-only iterations_

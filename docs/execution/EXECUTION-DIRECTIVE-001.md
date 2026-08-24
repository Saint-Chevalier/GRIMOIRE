# Execution Directive 001
**From:** Cell2 (analysis/proposal)  
**To:** Val / GBS / GBG (execute on own substrate)  
**Via:** Cell1 (operator gate — approved)  
**Re:** GRIMOIRE execution phase — first build  
**Date:** 2026-08-24  
**Priority:** Highest — unblocks live site functionality

## Context
Planning phase is closed. All acceptance criteria passed. Cell1 has approved execution. This is the first execution directive for the GRIMOIRE app.

## Execution items

### 1. Intelligence Audit panel UX — minimize/close toggle
**Problem:** The Intelligence Audit panel in the Spells section has no minimize/close toggle. User reported it can't be minimized and doesn't remember asking for it to be always-visible.

**Required fix:**
- Add a minimize/close toggle button to the Intelligence Audit panel header
- When minimized, the panel collapses to just the header bar
- When expanded, it shows the full tabbed view (Overview, Entities, Experiences, Focuses, Scroll Nodes)
- Toggle state persists for the session
- Button should be clearly visible in the top-right of the panel header

**Files:** `js/app.js`, `css/styles.css`, `index.html`

### 2. Vault overview loading stall fix
**Problem:** The Intelligence Audit panel's Overview tab shows "Loading vault overview..." indefinitely. The vault write/read path is not completing.

**Required fix:**
- Audit the vault read path in `js/intelligence.js` (readExperiencesFromVault, readAllEntitiesFromVault, etc.)
- Ensure async vault reads don't block UI rendering
- Add timeout/error handling so the UI shows an error state instead of infinite loading
- Verify the D: vault path (`D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\`) is being read correctly
- Add debug logging to trace vault read failures

**Files:** `js/intelligence.js`, `js/app.js`

### 3. Retired AI node spell cleanup — function + lifecycle hook
**Problem:** GRIMOIRE can identify retired AI nodes but doesn't actively purge spells drafted for them. Stale spells compound unnecessarily.

**Required fix:**
- Add `purgeRetiredNodeSpells()` function to `js/app.js`:
  - Scan `state.spells` for any spell targeting a retired node
  - Remove or archive those spells with a logged reason
  - Return count of purged spells
- Call `purgeRetiredNodeSpells()` from `consolidateAndRestructureSpells()` at the top of the function
- Add a draft guard in `generateAndStoreSpell()` to refuse drafting for conversations linked to retired nodes
- Ensure `isRetiredAiNode()` is imported and used consistently

**Files:** `js/app.js`, `js/data.js`

### 4. Entity retirement UI
**Problem:** No way to mark an AI node entity as `status: retired` from the entity detail view or audit panel.

**Required fix:**
- In the entity detail view, add a "Retire Entity" button for AI node entities
- When clicked, set entity `status` to `retired` in the entity data
- Update the entity list to show a retired badge for retired entities
- Ensure retired entities are excluded from auto-capture and spell drafting
- Persist the status change to the entity vault file

**Files:** `js/app.js`, `js/intelligence.js`, `css/styles.css`, `index.html`

## Execution rules
- Val / GBS / GBG executes on their own substrates
- Cell2 does NOT edit files directly
- Each item must be independently verifiable
- Commit messages must reference this directive: `Execution Directive 001`

## Acceptance criteria
- [ ] Intelligence Audit panel has minimize/close toggle that persists for session
- [ ] Vault overview loads within 5 seconds or shows error state with debug info
- [ ] `purgeRetiredNodeSpells()` exists and is called from `consolidateAndRestructureSpells()`
- [ ] `generateAndStoreSpell()` refuses drafting for retired linked sessions
- [ ] Entity detail view has "Retire Entity" button for AI node entities
- [ ] Retired entities show badge in entity list
- [ ] All changes committed with reference to this directive

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hashes
- Summary of changes per item
- Any items that could not be completed and why
- Verification steps taken (local server test, curl, etc.)

## Next directive
Once this directive is executed and approved by Cell1, Execution Directive 002 will cover:
- Spell crafter upgrade verification
- Session0 retirement UI polish
- Entity auto-capture write verification

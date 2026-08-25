# Execution Directive 003
**From:** Cell2 (analysis/proposal)  
**To:** Val / GBS / GBG (execute on own substrate)  
**Via:** Cell1 (operator gate)  
**Re:** GRIMOIRE execution phase — verification + polish  
**Date:** 2026-08-24  
**Priority:** High — closes remaining gaps from Directive 001 and validates shipped features

## Context
Directive 001 is executed and audited. Directive 002 is executed and audited. This directive covers verification and polish for features that shipped in earlier commits but haven’t been validated end-to-end, plus one blocking bug from the roadmap.

## Execution items

### 1. Spell crafter end-to-end verification
**Background:** Spell crafter upgrade triggers and tier/mastery UI badges shipped in commit `2a3b5e2`. They have not been verified to work end-to-end on the live site.

**Required verification:**
- Cast a spell from the spell panel → verify `tryUpgradeSpell()` fires in `markSent()`
- Forge a new spell → verify `tryUpgradeSpell()` fires in `commitSpell()`
- Verify tier/mastery badges render on spell card faces
- Verify upgrade logic respects vault intel context (entities, nodes, experiences, alignment)
- Add debug logging if any trigger path is silent
- Test on local server AND live site (`https://saint-chevalier.github.io/GRIMOORE/`)

**Files:** `js/app.js`, `js/data.js`, `css/styles.css`

**Acceptance:**
- [ ] Cast triggers upgrade evaluation
- [ ] Forge triggers upgrade evaluation
- [ ] Tier/mastery badges render on spell cards
- [ ] Upgrade logic uses vault intel context
- [ ] Debug logging present for silent paths

### 2. Session0 retirement polish
**Background:** Session0 retirement shipped in commit `2a3b5e2` and was extended in Directive 001. Need to verify no active references remain.

**Required verification:**
- Search codebase for any remaining active-routing references to Session0 in GRIMOIRE app
- Verify `resolveHermesInjectSessionId()` returns empty string when retired
- Verify `makeHermesDeliveryPayload()` uses explicit `linkedSession` only, no default Session0
- Verify spell send button is hidden for Session0/master path
- Verify fleet view shows “retired” badge, not active
- Verify copy/paste toasts say “Session0 retired · record only”
- Search for any stray “Session0” strings that should say “retired”

**Files:** `js/app.js`, `js/data.js`, `css/styles.css`, `index.html`

**Acceptance:**
- [ ] No active-routing references to Session0 remain
- [ ] All retired UI states consistent
- [ ] No stray “Session0” strings in user-facing copy

### 3. Entity auto-capture write verification
**Background:** Entity auto-capture engine deployed in `js/intelligence.js`. Write success to D: vault was never confirmed.

**Required verification:**
- Trigger entity auto-capture from a conversation containing entity patterns
- Verify entity writes to `D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\entities\`
- Verify file is valid YAML with 5 fact domains
- Verify entity appears in Intelligence Audit panel Entities tab
- Add debug logging to entity write path (`[entity-write]`, `[entity-read]`, `[entity-error]`)
- If write fails, surface error in Audit panel instead of silent fail

**Files:** `js/intelligence.js`, `js/app.js`

**Acceptance:**
- [ ] Entity auto-capture writes to D: vault
- [ ] Written entity is valid YAML with 5 fact domains
- [ ] Entity appears in Audit panel
- [ ] Debug logging present for write/read/error paths
- [ ] Errors surface in UI, not silent

### 4. Bus relay serialization fix (roadmap Step 1 blocker)
**Background:** `grimoire-sovereign-evolution.md` Step 1 is pending. Bus relay truncation was noted as residual risk in Directive 002.

**Required fix:**
- Audit `js/intelligence.js` for `densenBusMessage` and any relay functions
- Ensure full message body is preserved on bus route/relay — never truncate to preview-only payload
- Display may summarize; vault + densen must keep full body
- Add debug logging to trace payload size before/after relay
- Verify no cloud/network bus calls introduced

**Files:** `js/intelligence.js`, `js/app.js`

**Acceptance:**
- [ ] Bus densen appends full operator message body
- [ ] Relay between focuses preserves full payload
- [ ] Debug logging for payload size
- [ ] No cloud/network bus calls introduced

## Execution rules
- Val / GBS / GBG executes on their own substrates
- Cell2 does NOT edit files directly
- Each item must be independently verifiable
- Commit messages must reference this directive: `Execution Directive 003`

## Acceptance criteria
- [ ] Spell crafter triggers verified end-to-end (cast + forge)
- [ ] Tier/mastery badges render and update correctly
- [ ] Session0 retirement fully polished — no active references
- [ ] Entity auto-capture writes to D: vault and appears in Audit panel
- [ ] Bus relay preserves full message body
- [ ] All changes committed with reference to this directive

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hashes
- Verification steps taken per item
- Screenshots or curl output for live site verification
- Any items that could not be completed and why

## Next directive
Once this directive is executed and approved by Cell1, Execution Directive 004 will cover:
- Mobile layout polish
- Settings panel JS wiring
- Export Focus dossier verification
- Self-recursive Focus design

# Focus Reset Directive
**From:** Cell2 (analysis/proposal)  
**To:** GBG (execute on own substrate)  
**Via:** Cell1 (operator gate — approved for highest-timeline reset)  
**Re:** GRIMOIRE focus state reset — clean baseline  
**Date:** 2026-08-25  
**Priority:** Critical — operator confirms focuses are unused and wants clean baseline

## Context
Operator has confirmed: "im not using these focuses on anything." Current focus list contains 7 entries with 1 duplicate (Wizard King × 2). Operator wants highest-timeline call: wipe and start fresh.

## Execution items

### 1. Backup current focus state
**Before any deletion:**
- Export ALL focus data to timestamped backup
- Path: `D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\backups\focus-state-pre-reset-<timestamp>.json`
- Include: focus definitions, linked entities, chat history, spells, experiences, entity links
- Verify backup file exists and is non-zero before proceeding

### 2. Clear all focuses from app state
**Nuclear option — operator approved:**
- Remove all 7 focuses from the app's focus store/state
- Clear any focus-related localStorage keys (except settings)
- Do NOT delete vault data (entities, experiences, spells, exports) — only app focus references
- Preserve the glyph dictionary, roadmap files, and intelligence audit data

### 3. Verify clean slate
**After deletion:**
- Confirm focus list is empty in app state
- Confirm no duplicate entries remain
- Confirm vault folder structure is intact (entities/, experiences/, export/, glyph-dictionary/, etc.)
- Confirm Intelligence Audit panel loads without errors on empty state

### 4. Create one clean test focus (optional, operator can skip)
**If operator wants a starting point:**
- Create a single test focus: "Test Focus" · LOCAL
- No entity linked
- No chat history
- Fresh state for Directive 005 testing

## Files to modify
- `js/app.js` — focus state management, clear function
- `js/data.js` — focus storage schema, reset logic
- `index.html` — focus list rendering (ensure empty state is clean)
- `localStorage` — clear focus keys, preserve settings

## Acceptance criteria
- [ ] Backup created and verified before deletion
- [ ] All 7 focuses removed from app state
- [ ] No duplicate entries remain
- [ ] Vault data intact (entities/, experiences/, glyph-dictionary/, etc.)
- [ ] App loads with empty focus list
- [ ] Operator confirms clean baseline

## Reporting
After execution, report back to Cell1 with:
- Backup file path and timestamp
- Confirmation of deletion
- Verification that vault is intact
- Screenshot of empty focus list
- Optional: test focus created or skipped

## IMPORTANT
- This is a destructive operation. Backup is mandatory.
- Do NOT delete vault data, only app focus references.
- Operator has explicitly approved highest-timeline reset.

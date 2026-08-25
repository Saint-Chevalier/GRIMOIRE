# Execution Directive 007
**From:** Cell2 (analysis/proposal)  
**To:** GBG (execute on own substrate)  
**Via:** Cell1 (operator gate — approved)  
**Re:** GRIMOIRE brand click UX — consolidate Audit + Settings under Grimoire word  
**Date:** 2026-08-25  
**Priority:** High — operator feedback: settings button should not float separately

## Context
Directives 001–006 are executed and audited. Directive 006 made Intelligence Audit opt-in via the top-left "Grimoire" brand click. Operator now reports: "i see a button behind the folder. it says app settings. can you put the app settings in the name grimoire."

Current state:
- "Grimoire" brand word opens Intelligence Audit overlay
- A separate "app settings" button exists in the header
- Operator wants both accessed via the brand click

## Execution items

### 1. Remove standalone app settings button
**Current state:** A visible "app settings" button exists in the header, separate from the brand.

**Required change:**
- Remove the standalone app settings button from the header
- Do NOT remove the settings functionality itself — only the floating button
- The ⚙ icon next to the brand should remain or be removed per design choice (see item 2)

**Files:** `index.html`, `css/styles.css`

### 2. Add dropdown menu to Grimoire brand click
**Current state:** Clicking "Grimoire" opens Intelligence Audit overlay directly.

**Required change:**
- On click, show a small dropdown menu with two items:
  - "Intelligence Audit"
  - "App Settings"
- Clicking "Intelligence Audit" opens the existing Audit overlay
- Clicking "App Settings" opens Settings as a full-screen overlay/modal
- Clicking outside the menu closes it
- Pressing Escape closes the menu
- If menu is open and user clicks Grimoire again, close the menu (toggle behavior)
- Add cursor pointer and hover state to brand word

**Files:** `index.html`, `css/styles.css`, `js/app.js`

### 3. Create Settings overlay
**Current state:** Settings panel exists as a tabbed view in the main layout or as a separate view.

**Required change:**
- Render Settings as a full-screen overlay/modal when opened from the dropdown
- Add close button (×) in top-right corner
- Close on Escape key press
- Close on click outside the overlay content (backdrop click)
- Preserve all existing Settings tabs: General, Spells, Tabs, Roadmap
- Preserve all existing Settings functionality (save/load, localStorage)
- Overlay should be scrollable if content exceeds viewport

**Files:** `index.html`, `css/styles.css`, `js/app.js`

### 4. Persist last opened overlay
**Required behavior:**
- If user last opened Audit, reopening brand click opens Audit directly (skip menu)
- If user last opened Settings, reopening brand click opens Settings directly
- If user closed the app with menu open, reopen with menu open
- Store state in sessionStorage with key `grimoire-brand-overlay-v1`
- Values: `audit`, `settings`, `menu`
- Do NOT use localStorage — this is session preference

**Files:** `js/app.js`

### 5. Preserve all existing functionality
**Do NOT remove or break:**
- Intelligence Audit overlay functionality (all 7 tabs, data loading, debug logging)
- Settings panel functionality (all 4 tabs, save/load, localStorage)
- Mobile layout behavior
- Keyboard navigation and accessibility

**Only change:** How Audit and Settings are accessed (via brand dropdown/overlay instead of floating buttons)

## Acceptance criteria
- [ ] No standalone "app settings" button in header
- [ ] Clicking "Grimoire" brand opens dropdown with "Intelligence Audit" and "App Settings"
- [ ] Clicking "Intelligence Audit" opens existing Audit overlay
- [ ] Clicking "App Settings" opens Settings as full-screen overlay
- [ ] Both overlays have close button, Escape key, and backdrop click
- [ ] sessionStorage persists last opened state
- [ ] No layout breakage on mobile or desktop
- [ ] All existing Audit and Settings functionality preserved

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hash
- Verification steps (screenshots of dropdown, Audit overlay, Settings overlay)
- Any unexpected behavior

## IMPORTANT
- This is a UX consolidation only. Do not modify Audit data logic, vault writes, or Settings persistence.
- The dropdown should be lightweight — no animations that block interaction.
- Brand click is the single entry point for both Audit and Settings.

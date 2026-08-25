# Execution Directive 006
**From:** Cell2 (analysis/proposal)  
**To:** GBG (execute on own substrate)  
**Via:** Cell1 (operator gate — approved)  
**Re:** GRIMOIRE Intelligence Audit panel UX — make it opt-in, not permanent  
**Date:** 2026-08-25  
**Priority:** High — operator feedback: panel should not be forced on right side

## Context
After Focus Reset, operator reports the Intelligence Audit panel is always visible on the right side of the app. Operator wants it hidden by default and accessible only via the top-left "Grimoire" brand click. This is a UX correction, not a feature removal.

## Execution items

### 1. Remove Intelligence Audit from default layout
**Current state:** Intelligence Audit panel is rendered as a persistent right-side panel in the default three-pane layout.

**Required change:**
- Remove the Intelligence Audit panel from the default app layout
- The default view should be: left sidebar (focuses) + main chat area
- No right-side panel by default
- Preserve all Audit functionality — it just becomes opt-in

**Files:** `index.html`, `css/styles.css`, `js/app.js`

### 2. Add clickable trigger on "Grimoire" brand
**Current state:** Top-left "Grimoire" word is likely static branding.

**Required change:**
- Make the top-left "Grimoire" brand word clickable
- On click, open Intelligence Audit as a full-screen overlay/modal
- Add cursor pointer, hover state, and accessible label
- The overlay should cover the full app viewport (not just a side panel)

**Files:** `index.html`, `css/styles.css`, `js/app.js`

### 3. Make Audit panel a closeable overlay
**Current state:** Intelligence Audit is a persistent panel with tabs.

**Required change:**
- When opened via Grimoire brand click, render as full-screen overlay
- Add close button (×) in top-right corner of overlay
- Close on Escape key press
- Close on click outside the overlay content (backdrop click)
- Preserve all existing tabs and functionality inside the overlay
- Overlay should be scrollable if content exceeds viewport

**Files:** `index.html`, `css/styles.css`, `js/app.js`

### 4. Persist open/closed state
**Required behavior:**
- When overlay is closed, it stays closed on app reload
- When overlay is open and user reloads, it reopens
- Store state in sessionStorage with key `grimoire-intel-audit-overlay-v1`
- Do NOT use localStorage — this is session preference, not permanent setting

**Files:** `js/app.js`

### 5. Preserve all Audit functionality
**Do NOT remove:**
- Overview, Entities, Experiences, Focuses, Scroll Node, Glyphs tabs
- All data loading and rendering logic
- Debug logging (`[vault-audit]`, `[entity-write]`, etc.)
- Link to vault folder for data to appear

**Only change:** How the panel is presented (overlay vs persistent side panel)

## Acceptance criteria
- [ ] Intelligence Audit panel NOT visible by default on app load
- [ ] Clicking top-left "Grimoire" brand opens Audit as full-screen overlay
- [ ] Overlay has close button (×) and closes on Escape/backdrop click
- [ ] Overlay preserves all tabs and functionality
- [ ] Open/closed state persists across reloads via sessionStorage
- [ ] No horizontal scroll or layout breakage on any viewport
- [ ] All existing Audit debug logging preserved

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hash
- Verification steps (screenshot of closed state, screenshot of open overlay)
- Any unexpected behavior

## IMPORTANT
- This is a UX change only. Do not modify Audit data logic, vault writes, or tab content.
- The Audit panel must remain fully functional when opened.
- Do not use localStorage — sessionStorage only for this preference.

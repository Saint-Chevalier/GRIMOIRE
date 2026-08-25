# Execution Directive 009
**From:** Cell2 (analysis/proposal)  
**To:** GBG (execute on own substrate)  
**Via:** Cell1 (operator gate — approved)  
**Re:** GRIMOIRE vault linking resilience — IndexedDB persistence, health check, re-link UX  
**Date:** 2026-08-25  
**Priority:** Medium — polish for existing feature

## Context
Operator had to link the vault folder twice. The File System Access API handle didn't persist across refresh/session. This is a known browser limitation. We need to make the vault link more resilient without changing the security model.

## Execution items

### 1. Store vault handle in IndexedDB
**Current state:** Vault folder handle is stored in memory or sessionStorage only.

**Required change:**
- Store the File System Access API handle in IndexedDB with key `grimoire-vault-handle-v1`
- On app load, attempt to restore handle from IndexedDB
- If restore succeeds and handle is still valid, vault is automatically linked
- If restore fails or handle is invalid, show "Re-link vault" prompt
- Add debug logging: `[vault] restore`, `[vault] linked`, `[vault] broken`

**Files:** `js/app.js`, `js/data.js`

**Acceptance:**
- [ ] Vault handle persists in IndexedDB
- [ ] App auto-relinks vault on reload if handle valid
- [ ] Broken handle shows clear re-link prompt
- [ ] Debug logging present

### 2. Vault health check on load
**Required behavior:**
- On app initialization, check if vault handle exists and is valid
- If valid: show "Vault ready" toast, enable intelligence capture
- If invalid: show "Vault unlinked — click 📁 to restore" with one-click re-link
- If never linked: show setup prompt (existing behavior)
- Do NOT silently fail — always show vault state

**Files:** `js/app.js`

**Acceptance:**
- [ ] Vault state checked on every app load
- [ ] Valid handle → vault ready toast
- [ ] Invalid handle → re-link prompt
- [ ] No silent failures

### 3. Re-link UX polish
**Required behavior:**
- When vault is unlinked, the 📁 icon should pulse or highlight to draw attention
- Clicking it immediately opens the folder picker (already does)
- After re-link, show confirmation toast with folder name
- If user cancels the picker, show "Vault unlinked — intelligence capture disabled" in status bar
- Status bar should always show vault state: linked/unlinked/error

**Files:** `index.html`, `css/styles.css`, `js/app.js`

**Acceptance:**
- [ ] 📁 icon highlights when vault unlinked
- [ ] Status bar shows vault state at all times
- [ ] Re-link confirmation toast shows folder name
- [ ] Cancel shows disabled state clearly

### 4. Preserve existing functionality
**Do NOT change:**
- Vault folder structure
- Intelligence capture logic
- File System Access API permission flow
- Security protocol (vault isolation, gitignore)

**Only change:** How the handle is stored and how the app responds to broken handles.

## Acceptance criteria
- [ ] Vault handle persists across browser refreshes via IndexedDB
- [ ] App auto-relinks on reload if handle valid
- [ ] Broken handle shows clear re-link UX
- [ ] Status bar always shows vault state
- [ ] No silent failures
- [ ] All changes committed with reference to this directive

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hash
- Test results (refresh test, handle invalidation test)
- Any remaining browser-specific limitations

## IMPORTANT
- This is UX resilience only. Do not modify vault structure, capture logic, or security boundaries.
- The browser can still require re-authorization if the user clears site data or uses incognito. That's expected behavior.

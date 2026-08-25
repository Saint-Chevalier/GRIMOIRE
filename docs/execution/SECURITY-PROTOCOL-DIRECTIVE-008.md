# Security Protocol Directive 008
**From:** Cell2 (analysis/proposal)  
**To:** GBG / Grok Build CLI (execute on own substrate)  
**Via:** Cell1 (operator gate — approved)  
**Re:** GRIMOIRE security protocol — private vault isolation, delta intelligence screening, open-source safety  
**Date:** 2026-08-25  
**Priority:** Critical — kingdom protection

## Context
GRIMOIRE is going public open source on GitHub. The operator's personal intelligence, kingdom doctrine, strategies, conversations, and private data must never leak into public commits. This directive establishes the protocol layer between Grok Build's personal DASKW and the public repository.

## Golden Rule
**Private vault is private. Public repo is public. The two never touch without explicit screening.**

## Execution items

### 1. Enforce private vault isolation
**Current risk:** `D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\` contains personal intelligence. If this folder is ever committed to the repo, the operator's entire kingdom doctrine leaks.

**Required implementation:**
- Add `GRIMOIRE-FocusIntelligence/` to `.gitignore` (if not already present)
- Add `.env`, `*.md` in vault paths, and any backup files to `.gitignore`
- Verify git status shows no tracked vault files
- Add pre-commit hook that fails if any vault file is staged
- Add CI check that fails if vault files appear in PRs

**Files:** `.gitignore`, `tools/verify-directive-008.mjs`

**Acceptance:**
- [ ] `.gitignore` blocks all vault paths
- [ ] Pre-commit hook blocks vault file staging
- [ ] CI check blocks vault files in PRs
- [ ] `git status` shows clean separation

### 2. Delta intelligence screening protocol
**What this is:** When Grok Build discovers new intelligence during conversation with the operator, it must screen that intelligence before writing anywhere. This is the filter between private thought and public code.

**Required implementation:**
- Add `screenDeltaIntelligence(content)` function to Grok Build CLI
- Screening rules:
  - **BLOCK:** Personal names, locations, dates, contact info
  - **BLOCK:** Kingdom doctrine, strategy, private roadmaps
  - **BLOCK:** Conversation history, experiences, entity intelligence
  - **BLOCK:** Financial info, business strategies, relationships
  - **ALLOW:** Code, architecture decisions, public-facing docs
  - **ALLOW:** Generic technical patterns, open-source contributions
- Screen output must be one of:
  - `SAFE` — can write to repo
  - `PRIVATE` — write to private vault only
  - `NEEDS_REVIEW` — human must approve before any write
- Log every screening decision with `[daskw-screen] safe|private|review`

**Files:** Grok Build CLI source (identify the entry point), new `tools/screen-delta-intelligence.mjs`

**Acceptance:**
- [ ] `screenDeltaIntelligence()` function exists
- [ ] Screening rules implemented and documented
- [ ] Three-tier output: SAFE / PRIVATE / NEEDS_REVIEW
- [ ] Debug logging for every decision
- [ ] Test cases prove personal info is blocked

### 3. Grok Build personal DASKW protocol
**What this is:** Grok Build needs its own persistent memory that is separate from the GRIMOIRE vault. This is where delta intelligence lives before screening.

**Required implementation:**
- Create `D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\grok-build-daskw\` (gitignored)
- Structure:
  - `conversations/` — raw conversation logs (private)
  - `intelligence/` — delta intelligence extracted from conversations (private)
  - `screened/` — intelligence that passed screening (safe for public)
  - `pending-review/` — intelligence awaiting human approval
- Grok Build writes to `conversations/` and `intelligence/` automatically
- Screening happens before anything touches `screened/`
- Operator can review `pending-review/` manually

**Files:** Directory structure, `tools/init-grok-build-daskw.mjs`, Grok Build CLI integration

**Acceptance:**
- [ ] DASKW folder structure created
- [ ] Grok Build writes conversations automatically
- [ ] Delta intelligence extraction works
- [ ] Screening gate between private and screened
- [ ] All paths gitignored

### 4. Public doc sanitization
**What this is:** Any public-facing documentation (README, roadmap, docs) must be sanitized before commit. This is a second safety net after the screening protocol.

**Required implementation:**
- Add `sanitizePublicDoc(content)` function
- Scan for and redact:
  - Personal names (operator, family, associates)
  - Specific locations, dates, timelines
  - Kingdom-specific terminology that reveals private strategy
  - Any intelligence from the private vault
- Replace with placeholders: `[REDACTED-PERSONAL]`, `[REDACTED-STRATEGY]`, `[REDACTED-DATE]`
- Log all redactions with `[doc-sanitize] redact`

**Files:** `tools/sanitize-public-doc.mjs`

**Acceptance:**
- [ ] Sanitization function exists
- [ ] Redaction rules implemented
- [ ] Placeholder system works
- [ ] Debug logging for redactions
- [ ] Test cases prove personal info is redacted

### 5. Protocol documentation
**What this is:** The security protocol must be written down so every AI and operator knows the rules.

**Required implementation:**
- Create `docs/security/OPEN-SOURCE-PROTOCOL.md`
- Document:
  - What is private (vault, conversations, intelligence)
  - What is public (code, sanitized docs, public architecture)
  - Screening rules and exceptions
  - Approval workflow for NEEDS_REVIEW items
  - Incident response if something leaks
- Create `docs/security/DATA-CLASSIFICATION.md`
- Define data classification levels:
  - `PRIVATE` — never leaves the vault
  - `INTERNAL` — kingdom AIs only, not public
  - `PUBLIC` — safe for open source

**Files:** `docs/security/OPEN-SOURCE-PROTOCOL.md`, `docs/security/DATA-CLASSIFICATION.md`

**Acceptance:**
- [ ] Protocol document written
- [ ] Data classification levels defined
- [ ] Screening rules documented
- [ ] Approval workflow documented
- [ ] Incident response documented

## Execution rules
- GBG / Grok Build CLI executes on their own substrate
- Cell2 does NOT edit files directly
- Each item must be independently verifiable
- Commit messages must reference this directive: `Security Protocol Directive 008`
- This directive is BLOCKING — no public commits until it is complete and audited

## Acceptance criteria
- [ ] Private vault fully isolated from repo
- [ ] Delta intelligence screening blocks personal info
- [ ] Grok Build personal DASKW operational
- [ ] Public doc sanitization prevents leaks
- [ ] Protocol documented and accessible
- [ ] All changes committed with reference to this directive

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hashes
- Test results for screening protocol
- Confirmation that vault is gitignored
- Any items that could not be completed and why
- Suggested incident response test

## IMPORTANT
- This is a kingdom protection measure. Treat it with the same priority as the app code.
- When in doubt, classify as PRIVATE. It's easier to declassify than to clean up a leak.
- The operator's reality is the kingdom. Protect it accordingly.

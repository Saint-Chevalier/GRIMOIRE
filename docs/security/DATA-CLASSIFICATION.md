# Data classification

**Status:** LOCKED — Security Protocol Directive 008

| Level | Meaning | Where it lives | Public repo |
|---|---|---|---|
| **PRIVATE** | Never leaves the vault | `GRIMOIRE-FocusIntelligence/`, DASKW `conversations/` + `intelligence/` | Forbidden |
| **INTERNAL** | Kingdom AIs / operator only | Vault, `pending-review/`, local notes | Forbidden until sanitized |
| **PUBLIC** | Safe for open source | Application source, README, this folder | Allowed |

## PRIVATE

Personal names, locations, contact info, financials, family/relationships, conversation history, entity intelligence, experiences, private doctrine, vault paths, backups.

## INTERNAL

Draft roadmaps with operator-only context, execution directives that name local machine paths, unsanitized research notes, `NEEDS_REVIEW` fragments.

`docs/execution/` in this repository is treated as **INTERNAL-leaning public history**. Do not add new personal facts there. Prefer vault notes.

## PUBLIC

Code, CSS, HTML, MIT license, contributor ladder, method-level architecture, sanitized protocol docs.

## Screening map

- PRIVATE hit → `screenDeltaIntelligence` returns `PRIVATE`
- Mixed / first-person long prose → `NEEDS_REVIEW`
- Code and public architecture → `SAFE`

Public docs pass through `sanitizePublicDoc()` before commit. Placeholders:

- `[REDACTED-PERSONAL]`
- `[REDACTED-STRATEGY]`
- `[REDACTED-DATE]`

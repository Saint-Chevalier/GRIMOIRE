# Open-source protocol

**Status:** LOCKED — Security Protocol Directive 008  
**Rule:** Private vault is private. Public repo is public. They never mix without screening.

## What is private

- Local vault folder `GRIMOIRE-FocusIntelligence/` (any machine path)
- Grok Build DASKW: `conversations/`, `intelligence/`, `pending-review/`
- Operator identity, family, associates, contact info
- Experiences, entity dossiers, chat logs, alignment notes
- Kingdom doctrine, private strategy, financials, relationships
- `.env`, keys, backups, `focus-state-pre-reset-*.json`

## What is public

- Application source (`js/`, `css/`, `index.html`)
- Public architecture and method docs (this file, README, CONTRIBUTING)
- Sanitized roadmaps and protocol documents
- Example seeds under repo `conversations/` and `spells/` (examples, not vault dumps)

## Screening

Every new intelligence fragment is classified before write:

| Verdict | Action |
|---|---|
| `SAFE` | May write to the public repo or `screened/` |
| `PRIVATE` | Vault / DASKW `intelligence/` only — never the repo |
| `NEEDS_REVIEW` | Land in `pending-review/` until the operator approves |

```bash
node tools/screen-delta-intelligence.mjs "text"
node tools/gbg-daskw.mjs intelligence "delta text"
```

When in doubt, classify **PRIVATE**. Declassifying is cheaper than a leak.

## Approval workflow (NEEDS_REVIEW)

1. Fragment is written to `pending-review/` (gitignored).
2. Operator reads the file.
3. Approve → move to `screened/` then optionally fold a **sanitized** subset into a public PR.
4. Reject → delete or keep in vault `intelligence/`.
5. No AI auto-promotes `NEEDS_REVIEW` into the repo.

## Exceptions

- Public brand names of the project (Grimoire, Focus, SCROLL as product terms).
- GitHub organization name already on the public remote.
- Code identifiers required for the software to run.

## Incident response

If private material appears in a commit or PR:

1. **Stop.** Do not push further commits that repeat the leak.
2. Remove the file from the tree (`git rm --cached` if gitignored paths were forced).
3. If the leak reached a remote: rotate any exposed secrets; consider history rewrite only with operator approval.
4. File a private incident note in the vault (not the public repo).
5. Tighten the matching rule in `tools/screen-delta-intelligence.mjs` and add a test.

## Install the hook

```bash
git config core.hooksPath tools/githooks
```

Pre-commit runs `tools/guard-vault-staged.mjs` and will fail if vault paths are staged.

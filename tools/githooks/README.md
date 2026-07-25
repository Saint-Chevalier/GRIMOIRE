# GBG git hooks

**Install once** (repo-local):

```bash
git config core.hooksPath tools/githooks
```

Windows (PowerShell):

```powershell
git config core.hooksPath tools/githooks
```

`pre-commit` runs:

1. `node --check` on staged `.js` / `.mjs`
2. `node tools/roadmap-verify.mjs --gbg` (file + source_match gates for the verification layer)

Optional vault probe:

```bash
# Unix
ROADMAP_VAULT="/path/to/GRIMOIRE-FocusIntelligence" git commit …

# PowerShell
$env:ROADMAP_VAULT = "C:\path\to\GRIMOIRE-FocusIntelligence"
git commit …
```

Browser verification remains authoritative for per-step complete gates:

```
/roadmap verify [slug]
```

# Glyph: Retired Node

## Abstract
A retired AI node is an entity that is no longer part of the active kingdom path. It may remain as record. It must not receive active spells, auto-capture, or routing.

## Verified Instances
- Session0: `SESSION0_RETIRED = true`, UI badges “retired,” no active inject routing.
- Execution Directive 001: `purgeRetiredNodeSpells()` archives stale drafts; `generateAndStoreSpell()` refuses retired linked sessions.
- Entity Retire button writes `status: retired` to `entities/` and shows a retired badge in Intelligence Audit.

## Caveats
- Does not mean delete history. Cast History and vault files stay.
- Does not apply to a Focus that is merely idle. Idle is breathing status, not retirement.

## Scaling Gaps
- Operator-facing list of retired nodes in App Settings.
- Watcher rule: flag new spells whose target matches a retired entity file.

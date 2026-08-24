# Glyph: Cell Boundary

## Abstract
AI cells are isolated and cell-bound. They report through Cell1. No mission outside the assigned cell. Analysis proposes. Execution executes. The operator approves.

## Verified Instances
- Cell2 wrote Execution Directives 001/002 and did not edit app files.
- GBS/GBG executed on GRIMOIRE substrate and reported hashes to Cell1.
- SCROLL Watcher: observes and reports, does not write maps unless a separate executor is assigned.

## Caveats
- Does not forbid reading other cells’ public ledgers. Reading is not a mission takeover.
- Does not apply to the operator. Cell1 may cross every lane.

## Scaling Gaps
- Encode cell id on every directive filename and require it in the report.
- Guard: Cell2 PRs against `js/` fail unless Cell1 labeled them execute.

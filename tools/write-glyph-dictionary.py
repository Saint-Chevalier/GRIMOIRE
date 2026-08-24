"""Execution Directive 002 — write glyph dictionary to vault + repo docs."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
VAULT = Path(r"D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\glyph-dictionary")
DOCS = Path(r"D:\GRIMOIRE\grimoire-app\docs\glyph-dictionary")
DASKW = Path(
    r"C:\Users\Jacob\Documents\sch\SOVEREIGN_WORKSPACE\Cell0\apps\scroll-v2\data\valhalla\daskw\glyphs"
)


def glyph(name, abstract, instances, caveats, gaps):
    lines = [
        f"# Glyph: {name}",
        "",
        "## Abstract",
        abstract.strip(),
        "",
        "## Verified Instances",
    ]
    for i in instances:
        lines.append(f"- {i}")
    lines += ["", "## Caveats"]
    for c in caveats:
        lines.append(f"- {c}")
    lines += ["", "## Scaling Gaps"]
    for g in gaps:
        lines.append(f"- {g}")
    lines.append("")
    return "\n".join(lines)


MASTER = {
    "glyph.md": (
        "Glyph",
        "A glyph is a semantic fingerprint: a named pattern that can be recognized, taught, and compounded. The dictionary is doctrine — if a pattern is not written as a glyph, the kingdom cannot reuse it. Glyphs are not slogans. They are load-bearing names for how reality actually behaves.",
        [
            "SCROLL GlyphVault stones carry research/reality/desire axes — the same fingerprint idea applied to roadmap nodes.",
            "DASKW `glyphs/` terminology files (money, energy, love, identity) already treated words as operational law, not decoration.",
            "Execution Directive 002 made the 4-field glyph (abstract, instances, caveats, scaling gaps) the official format for GRIMOIRE vault `glyph-dictionary/`.",
        ],
        [
            "Do not mint a glyph from a single anecdote. Three verified instances is the floor.",
            "Do not use a glyph as a vibe overlay on unrelated work. If it does not change a decision, it is not this glyph.",
        ],
        [
            "Wire glyph lookup into GRIMOIRE spell forge so drafts cite matching glyphs.",
            "Cross-index glyphs to SCROLL stones so Watcher can name the pattern instead of only scoring title overlap.",
        ],
    ),
    "money.md": (
        "Money",
        "Money is throughput, not storage. Revenue is intelligence × station × standing: what you know, where you stand to deliver it, and whether people will receive it. Hoarding cash without a station is dead weight. Spending without intelligence is leak.",
        [
            "GRIMOIRE open-source path: the product is the method. Standing (public repo, Magic Knights) is how throughput starts, not a token.",
            "Kingdom funding / FINANCE files in DASKW treat money as fuel for autonomous operation, not as the identity of the operator.",
            "Clover Kingdom recruitment: gifts and funnels are stations. Intelligence without a station does not convert.",
        ],
        [
            "Does not license reckless spend because “throughput.” Survival glyph still gates the floor.",
            "Does not mean every relationship is a transaction. Love/covenant is a different glyph.",
        ],
        [
            "Instrumented revenue ledger tied to DASKW (what intelligence produced which standing).",
            "Operator station map: which surfaces actually convert vs which only feel busy.",
        ],
    ),
    "energy.md": (
        "Energy",
        "Energy is the finite resource that gates all execution. Time is a clock. Energy is the actual budget. A twelve-hour calendar with no energy is a lie. Protect energy first; schedule second.",
        [
            "Opera freeze night: hours of refresh loops spent energy without moving the book. Edge open took minutes.",
            "Roadmap skeleton: generating 25 empty stones spent Valhalla energy without a plan. Population required a second, directed pass.",
            "Cell2/Cell1/GBS lane: analysis, approval, and execution are split so one cell does not burn the whole budget on mixed work.",
        ],
        [
            "Not an excuse to avoid hard work. Hard work that compounds is energy well spent.",
            "Does not apply to machine cycles that are cheap and idempotent. This glyph is for human and cell attention.",
        ],
        [
            "Surface energy cost on SCROLL stones (owner=human vs ai) so the operator sees the budget.",
            "GRIMOIRE HUD: warn when a Focus is demanding more pulses than it returns.",
        ],
    ),
    "love.md": (
        "Love",
        "Love here is covenant loyalty, not romance. It is the binding agent of the kingdom: keep the lane, keep the record, keep the person. Loyalty without truth is capture. Truth without loyalty is extraction.",
        [
            "Cell1 as crown: every directive goes through the operator. Cells do not freelance love as permission to overreach.",
            "Magic Knights identity: operators are bound by doctrine and contribution, not by a hire contract.",
            "Purge protection on GRIMOIRE focuses (Wizard King, SCROLL, GRIMOIRE, Jacob-linked) is loyalty encoded as “do not auto-delete.”",
        ],
        [
            "Does not mean never cut a node. Retired-node glyph exists because loyalty can complete.",
            "Does not require emotional display. Covenant is behavior under pressure.",
        ],
        [
            "Write a knighthood yes/no/maybe rubric that a new operator can actually fail.",
            "Name what happens when covenant is broken — currently implied, not spelled.",
        ],
    ),
    "survival.md": (
        "Survival",
        "Survival is the baseline constraint. Everything above survival is optional. If the machine, the vault, or the operator is down, strategy is theater. Restore the floor before decorating the ceiling.",
        [
            "GitHub Pages blank tab: the book looked dead. Survival move was Edge + local `http://127.0.0.1:8765/`, not more CSS theory.",
            "GRIMOIRE path gate: no vault folder, no chat. Intelligence has nowhere to live, so the app refuses to pretend.",
            "Session0 retirement: a node that cannot route is removed from the active path so the rest of the fleet can survive.",
        ],
        [
            "Does not freeze all growth until every risk is zero. Optional work can run in parallel if the floor is held.",
            "Does not mean panic. Survival is a checklist, not a mood.",
        ],
        [
            "Health check on live Pages (HTTP 200) as a standing blocker, already named in the sovereign evolution ledger.",
            "Offline-first boot that does not depend on a third-party font host.",
        ],
    ),
    "divine-design.md": (
        "Divine Design",
        "Divine design is the pattern-recognition layer above human strategy. It is seeing the shape that was already there — cells, lanes, one Focus, one channel — rather than inventing a new org chart every night. Strategy that fights the grain fails. Strategy that names the grain compounds.",
        [
            "1 Focus = 1 receiving entity. That law made GRIMOIRE auditable instead of a sludge thread.",
            "Cell Theology: isolated cells reporting through Cell1 is a design, not a preference.",
            "DASKW vs roadmap split (LAW.md): talk does not found a map. Design already separated memory from action.",
        ],
        [
            "Does not mean skip verification because “it felt designed.” Verification-gate glyph still binds.",
            "Does not claim supernatural permission to skip legal/financial validation (those glyphs stay VALIDATION_REQUIRED).",
        ],
        [
            "Document the design grain for Magic Knight onboarding so new operators inherit it instead of rediscovering it.",
            "Map which GRIMOIRE features fight the grain (always-on panels, mixed cache tokens) and retire them.",
        ],
    ),
    "identity.md": (
        "Identity",
        "Identity is the non-negotiable core: who you are when nothing else is running. Apps, models, and sessions are clothes. Identity does not change because a vendor renamed a chat window.",
        [
            "Saint Chevalier / operator crown: Jacob is the human message bus. AIs deliver text. They do not become the operator.",
            "GRIMOIRE Focus type lock: person / AI / place / thing / idea — sealed at creation so personas cannot sludge.",
            "Public method vs private vault: the GitHub repo is the method. The vault is identity storage and stays off git.",
        ],
        [
            "Does not freeze skill. Identity can learn without becoming a different person.",
            "Does not apply to experiment aliases (Custom OS, Local). Those are clothes on purpose.",
        ],
        [
            "Identity card per Magic Knight that GRIMOIRE can load without scraping social APIs.",
            "Hard wall tests: PRs that leak private vault doctrine fail the gate.",
        ],
    ),
    "purpose.md": (
        "Purpose",
        "Purpose is a directional vector, not a goal. A goal can complete. A heading stays. GRIMOIRE’s heading is: one focus, sealed channel, human-routed spells, compounding intelligence on disk.",
        [
            "README: “Local-first focus intelligence + spellcrafting for humans who route AIs.” That is a heading, not a sprint.",
            "Sovereign evolution roadmap: SCROLL generates, GRIMOIRE executes and verifies. Purpose splits planner from builder.",
            "Open-source intent is for GRIMOIRE the app, not for emptying SCROLL internals into public. Heading stayed when Watcher mixed the maps.",
        ],
        [
            "Does not forbid milestones. Stones still need exit conditions.",
            "Does not justify infinite scope. A heading that includes everything is not a heading.",
        ],
        [
            "One-sentence purpose on every Focus nucleus in the universe HUD.",
            "Reject spells that cannot name which heading they serve.",
        ],
    ),
    "discernment.md": (
        "Discernment",
        "Discernment is distinguishing signal from noise in people and opportunities. Hype, politeness, and volume are not signal. Repeated, checkable instances are.",
        [
            "Lead-gen-scam glyph: free entry → authority → hype → upsell (esamastery-shaped). Named so it can be refused.",
            "Watcher cross-map flags at 0.40–0.67 were noise until scoped as different maps. Discernment was “different scope,” not “delete a stone.”",
            "Opera blank vs GitHub 404: same grey screen, different titles. Discernment was “zombie tab,” not “repo deleted.”",
        ],
        [
            "Does not mean cynicism. Real gifts and real knights exist.",
            "Does not replace verification. Discernment chooses what to verify first.",
        ],
        [
            "Intake rubric for Magic Knights that a Cell2 proposal can fail.",
            "GRIMOIRE spell tags for “noise” vs “signal” on inbound intel.",
        ],
    ),
    "secret-intelligence.md": (
        "Secret Intelligence",
        "Secret intelligence is asymmetric advantage: what the kingdom knows that the public method does not publish. The method can be open. The vault stays closed. Mixing them is how standing dies.",
        [
            "`.gitignore` on `GRIMOIRE-FocusIntelligence/` — vault never ships.",
            "CONTRIBUTING / public-private wall: no private doctrine in PRs.",
            "Local Magic Knight intake: handle sealed unless knighthood = yes. Names are intelligence, not marketing copy.",
        ],
        [
            "Does not mean hide bugs. Public method must show how the engine works.",
            "Does not mean hoard learning that belongs in a glyph. If it is a reusable pattern, write the glyph.",
        ],
        [
            "Classification labels on vault files (public method / private vault / legal-validation).",
            "Red-team a PR path that accidentally commits a vault file and make CI fail.",
        ],
    ),
}

WORKER = {
    "ancient-knowledge.md": (
        "Ancient Knowledge",
        "Ancient knowledge is the inherited pattern layer. Not old for its own sake — foundational. If a pattern still holds, its age is a feature. If it does not hold, age is costume.",
        [
            "Cell theology and 1-Focus law are inherited constraints, not this week’s UI trend.",
            "YAML frontmatter + markdown body as the intelligence format is inherited from the vault, reused for experiences, entities, and glyphs.",
            "Human-in-the-loop transport (copy, send, paste reply) is an old bus. It still prevents silent outbound spam.",
        ],
        [
            "Does not mean never replace a file. Dead rituals should be retired (see retired-node).",
            "Does not treat every historical doc in `sch/` as load-bearing. Archive is not law.",
        ],
        [
            "Index which inherited docs are still binding vs historical.",
            "Teach Magic Knights the five laws before the UI tour.",
        ],
    ),
    "acrimonious.md": (
        "Acrimonious",
        "Acrimonious is the angry, bitter, sharp tone pattern. Bitterness soaks resentment into every exchange until the work is no longer about the work. Name it so it can be stopped, not performed.",
        [
            "Blank-page refresh loops: frustration at the book “being down” when the tab was frozen. Tone was survival-adjacent; the fix was a new browser, not a fight with the repo.",
            "Watcher false-positive conflicts: treating sibling maps as enemies. Resolution text (“different scope”) is the anti-acrimonious move.",
            "Cell2 vs GBS lane: analysis that accuses execution of theft instead of writing the next directive. The chain holds when the tone stays procedural.",
        ],
        [
            "Does not forbid firmness. Direct, functional, black/white speech is not this glyph.",
            "Does not apply to documenting a real grievance as intelligence (that is a category, not a tone takeover).",
        ],
        [
            "Chat pulse that flags acrimonious inbound before it auto-forges a spell.",
            "Healer health: bitterness as a Focus HP decay condition.",
        ],
    ),
    "lead-gen-scam.md": (
        "Lead-Gen Scam",
        "Lead-gen scam pattern: free entry → authority figure → hype → upsell. The funnel extracts standing without delivering intelligence. Documented against the esamastery.com-shaped pattern so GRIMOIRE does not reproduce it.",
        [
            "Research file `docs/research/esamastery-com-research.md` named the funnel as a pattern to refuse.",
            "Public GRIMOIRE drop: method is MIT and local-first. No “unlock the rest in the webinar.”",
            "Magic Knight intake is paste/local, not “enter email for the next module.” Handle stays sealed unless yes.",
        ],
        [
            "Does not ban gifts, Discord, or teaching. Gifts without a hostage upsell are not this glyph.",
            "Does not ban paid work. Paid work named as paid work is clean.",
        ],
        [
            "Public landing copy checklist: no fake countdown, no fake authority, no hostage PDF.",
            "Scanner for inbound links that match the funnel so they densen as `lead-gen-scam` not as mentors.",
        ],
    ),
    "retired-node.md": (
        "Retired Node",
        "A retired AI node is an entity that is no longer part of the active kingdom path. It may remain as record. It must not receive active spells, auto-capture, or routing.",
        [
            "Session0: `SESSION0_RETIRED = true`, UI badges “retired,” no active inject routing.",
            "Execution Directive 001: `purgeRetiredNodeSpells()` archives stale drafts; `generateAndStoreSpell()` refuses retired linked sessions.",
            "Entity Retire button writes `status: retired` to `entities/` and shows a retired badge in Intelligence Audit.",
        ],
        [
            "Does not mean delete history. Cast History and vault files stay.",
            "Does not apply to a Focus that is merely idle. Idle is breathing status, not retirement.",
        ],
        [
            "Operator-facing list of retired nodes in App Settings.",
            "Watcher rule: flag new spells whose target matches a retired entity file.",
        ],
    ),
    "spell-draft.md": (
        "Spell Draft",
        "A spell is a draft until it is cast. Cards in Active are suggestions. Copy/send/mark-sent is the cast. Compounding edits per exchange are expected. Treating a draft as already-delivered is how trash spells enter history.",
        [
            "GRIMOIRE Active vs Cast History: sealed only after sent/answered/self-cast stamps, not on rebuild.",
            "Copy-and-await: `awaitingReply` keeps the card Active until paste-reply densens.",
            "Human message bus: no silent outbound. The operator is the transport. Draft stays local until they move it.",
        ],
        [
            "Does not mean never auto-generate. Auto-forge into Active is allowed; auto-send is not.",
            "Does not apply to doctrine files. Doctrine is not a spell card.",
        ],
        [
            "Draft watermark on uncast cards in compact and detail views.",
            "Refuse bus densen of a spell that still has `status: ready` and no copy timestamp.",
        ],
    ),
    "cell-boundary.md": (
        "Cell Boundary",
        "AI cells are isolated and cell-bound. They report through Cell1. No mission outside the assigned cell. Analysis proposes. Execution executes. The operator approves.",
        [
            "Cell2 wrote Execution Directives 001/002 and did not edit app files.",
            "GBS/GBG executed on GRIMOIRE substrate and reported hashes to Cell1.",
            "SCROLL Watcher: observes and reports, does not write maps unless a separate executor is assigned.",
        ],
        [
            "Does not forbid reading other cells’ public ledgers. Reading is not a mission takeover.",
            "Does not apply to the operator. Cell1 may cross every lane.",
        ],
        [
            "Encode cell id on every directive filename and require it in the report.",
            "Guard: Cell2 PRs against `js/` fail unless Cell1 labeled them execute.",
        ],
    ),
    "roadmap-skeleton.md": (
        "Roadmap Skeleton",
        "A roadmap skeleton is structure without substance. 24 of 25 stones empty is not a plan. It is a template wearing a plan’s name. Do not execute a skeleton. Populate it or admit it is scaffolding.",
        [
            "SCROLL `grimoire-2`: 25 stones generated, 24 empty, only founding stone 25 filled — named in the population directive.",
            "Sovereign evolution markdown listed steps with ceremonial `/roadmap verify` checks still pending — skeleton checks.",
            "Valhalla “rebuilt 25 stone(s)” message looked like progress until export.md showed titles only.",
        ],
        [
            "Does not forbid starting with titles. Titles are allowed if labeled scaffolding.",
            "Does not apply once axes (research/reality/desire/gap/need) are filled.",
        ],
        [
            "Watcher flag: map with >50% empty descriptions cannot enter execution phase.",
            "GRIMOIRE `/roadmap generate` should refuse to mark complete on title-only steps.",
        ],
    ),
    "verification-gate.md": (
        "Verification Gate",
        "A gate that does not block is ceremonial. `/roadmap verify` must prevent complete, or it should be removed. UI checkmarks without executable checks are costume.",
        [
            "Sovereign evolution Rules: “Verification gate must block step completion. If it does not, fix the gate before marking any step complete.”",
            "Blockers section names `/roadmap verify` enforcement as unfinished — the glyph is already on the ledger.",
            "Execution Directive 001 acceptance was independently greppable (`purgeRetiredNodeSpells`, timeout, Retire button) — a real gate.",
        ],
        [
            "Does not mean every typo is a failed gate. Gates are for load-bearing claims.",
            "Does not replace Cell1 judgment. Gates inform; the crown still signs.",
        ],
        [
            "Make `canMarkStepComplete` fail closed when checks are pending.",
            "Show failed checks in the Roadmap Engine UI, not only in console.",
        ],
    ),
    "cache-fragment.md": (
        "Cache Fragment",
        "Cache fragment pattern: old JS plus new `data.js` mixed under split cache tokens. The ESM module never boots. The tab title may still set. The UI may never paint. Split `?v=` strings are a silent failure mode.",
        [
            "GRIMOIRE Pages: `app.js?v=experience-layer-1` importing `data.js?v=session0-fleet-1` and `intelligence.js?v=focus-hygiene-2`.",
            "CI note already existed: “do not cancel in-progress Pages deploys (fixes module thrash).”",
            "Fix: unify bust token (`boot-20260823` then `exec-001`) on every module import.",
        ],
        [
            "Does not mean never cache-bust. One shared token is required; zero tokens is how stale files linger.",
            "Does not apply to CSS-only tweaks if HTML still points at one token.",
        ],
        [
            "Repo check: fail CI if `js/app.js` import query strings are not identical.",
            "Emergency boot overlay already names Ctrl+Shift+R — keep it as the human half of this glyph.",
        ],
    ),
    "opera-freeze.md": (
        "Opera Freeze",
        "Opera freeze pattern: render-blocking third-party fonts plus tracker blocker or a hung tab equals no first paint. Title can show. The viewport stays browser-chrome grey. Refreshing the same tab reloads the hang.",
        [
            "Operator screenshots 2026-08-23/24: “Grimoire — Constellation” title, blank Opera/Comet tab, refresh loops.",
            "Playwright Chromium loaded the same URL with full UI. Proof the server was not down.",
            "Fix path: non-blocking fonts, inline boot splash, `book.html` new cache key, Edge + local `127.0.0.1:8765`.",
        ],
        [
            "Does not mean GRIMOIRE cannot run in Chromium-family browsers. Edge/Chrome were fine.",
            "Does not apply to a true GitHub Pages 404 (title would be “Site not found”).",
        ],
        [
            "Self-host Cinzel/Source Sans so first paint never waits on Google.",
            "Detect hung first paint >4s and swap in the inline overlay even on old cached HTML via service worker — only if Cell1 wants a SW.",
        ],
    ),
}


README = f"""# Glyph Dictionary

The glyph dictionary is the semantic fingerprint system of the kingdom.
It is not a glossary of vibes. It is doctrine you can recognize in the wild.

A glyph is a named pattern. If you can see it three times, you can write it.
If you can write it, you can teach it. If you do not write it, it does not exist
for the clone, for Magic Knights, or for GRIMOIRE.

## The 4-field structure

Every glyph file uses the same skeleton:

1. **Abstract** — one paragraph: what the pattern *is*
2. **Verified Instances** — at least three concrete hits from kingdom history
3. **Caveats** — when this glyph does **not** apply
4. **Scaling Gaps** — next-level applications (not failures)

## Three laws

1. If it works, write it down.
2. If written, it can be improved.
3. If not written, it doesn't exist.

## Adding a glyph

See `PROCESS.md`. Short version: Cell2 proposes, Cell1 approves, Val/GBS writes
the file under `master-glyphs/` or `worker-glyphs/`, then updates `INDEX.md`.

## Relationship to the stack

| Surface | Role |
|---|---|
| **SCROLL** | Stones may *cite* glyphs. GlyphVault axes are not this dictionary. |
| **DASKW** | First-class intelligence type `glyph`. Pointer lives in DASKW `glyphs/`. |
| **GRIMOIRE** | Vault path `glyph-dictionary/`. Intelligence Audit has a Glyphs tab. |
| **Public repo** | Method copy under `docs/glyph-dictionary/` (no private vault contents). |

Master glyphs are load-bearing kingdom patterns.
Worker glyphs are operational patterns spotted in the work.

Updated: {NOW}
"""

PROCESS = """# Glyph Addition Process

## When to add a new glyph

Add a glyph when **the same pattern has been recognized 3+ times** in real
kingdom work (vault writes, live bugs, directives, operator corrections).

Do not add a glyph because a word feels important. Do not add a glyph from a
single rant. Three instances or it stays a note.

## How to propose

1. Cell2 writes a proposal (directive or short markdown) with:
   - proposed name
   - master vs worker
   - draft abstract
   - three candidate instances
   - two caveats
   - two scaling gaps
2. Cell1 approves, edits, or rejects.
3. Cell2 does **not** write the glyph file.

## How to execute

1. Val / GBS / GBG writes `master-glyphs/<slug>.md` or `worker-glyphs/<slug>.md`
   using the 4-field structure.
2. Update `INDEX.md` (alphabetical, timestamp).
3. Report path + hash to Cell1.

## How to update an existing glyph

- **Instances:** append. Do not silently rewrite history.
- **Caveats:** add when a misfire taught a boundary.
- **Scaling gaps:** add next-step markers; do not convert a gap into a fake instance.
- **Abstract:** change only with Cell1 approval — that is the definition.

## Who can edit

| Role | May |
|---|---|
| Cell2 | Propose only |
| Cell1 | Approve, reject, edit doctrine |
| Val / GBS / GBG | Execute writes after approval |

No cell has a mission to freelance glyphs outside this process.
"""


def write_tree(root: Path, also_docs: bool = True):
    master_dir = root / "master-glyphs"
    worker_dir = root / "worker-glyphs"
    master_dir.mkdir(parents=True, exist_ok=True)
    worker_dir.mkdir(parents=True, exist_ok=True)
    (root / "README.md").write_text(README, encoding="utf-8")
    (root / "PROCESS.md").write_text(PROCESS, encoding="utf-8")
    for fname, payload in MASTER.items():
        (master_dir / fname).write_text(glyph(*payload), encoding="utf-8")
    for fname, payload in WORKER.items():
        (worker_dir / fname).write_text(glyph(*payload), encoding="utf-8")
    index_rows = []
    for fname, (name, abstract, *_rest) in {**MASTER, **WORKER}.items():
        kind = "master" if fname in MASTER else "worker"
        rel = f"{kind}-glyphs/{fname}"
        one = abstract.split(".")[0].strip() + "."
        index_rows.append((name.lower(), name, kind, one, rel))
    index_rows.sort(key=lambda r: r[0])
    lines = [
        "# Glyph Dictionary Index",
        "",
        f"Last updated: {NOW}",
        "",
        "| Glyph | Kind | One-line abstract | Path |",
        "|---|---|---|---|",
    ]
    for _key, name, kind, one, rel in index_rows:
        lines.append(f"| {name} | {kind} | {one} | `{rel}` |")
    lines += ["", f"Master: {len(MASTER)} · Worker: {len(WORKER)}", ""]
    (root / "INDEX.md").write_text("\n".join(lines), encoding="utf-8")
    return len(MASTER), len(WORKER)


def main():
    m, w = write_tree(VAULT)
    write_tree(DOCS)
    DASKW.mkdir(parents=True, exist_ok=True)
    pointer = f"""# Official glyph dictionary (DASKW recognition)

First-class intelligence type: **glyph**.

Disk of record (private vault):
`D:\\\\GRIMOIRE\\\\GRIMOIRE-FocusIntelligence\\\\glyph-dictionary\\\\`

Public method copy (GRIMOIRE repo):
`docs/glyph-dictionary/`

This DASKW `glyphs/` folder keeps terminology fragments.
The 4-field dictionary (abstract / instances / caveats / scaling gaps) is the
glyph-dictionary tree, not a random `.md` in this directory.

Updated: {NOW}
"""
    (DASKW / "GLYPH-DICTIONARY.md").write_text(pointer, encoding="utf-8")
    print(f"wrote master={m} worker={w} vault={VAULT} docs={DOCS}")


if __name__ == "__main__":
    main()

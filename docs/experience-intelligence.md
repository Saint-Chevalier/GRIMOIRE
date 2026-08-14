# Experience Intelligence Design

## What it is
Experience Intelligence is **structured first-person knowledge** about what happened, what was done, why, how, and what was learned. It is not doctrine (universal rule). It is not a chat log (raw exchange). It is **distilled operational memory** — the kind of knowledge that comes from having been in the arena.

## Core model

### Experience entry
```yaml
id: exp-<slug>
type: experience
title: <human label>
summary: <1-2 sentences>

what_happened: <narrative — the situation, event, or problem>
what_i_did: <actions taken, decisions made, sequence>
why: <motivation, context, constraints, intent>
how: <process, method, tools, exact steps if reproducible>
outcome: <result — worked, failed, partial, unexpected>
lessons: <distilled learnings, principles extracted>
tags: [work, technical, social, learning, process, failure, success]
related_focuses: [focus-id-1, focus-id-2]
related_experiences: [exp-id-1]
date_range:
  start: ISO timestamp
  end: ISO timestamp or null
status: completed | ongoing | abandoned | superseded
certainty: proven | likely | uncertain | hypothesis
author: Jacob | Cell2 | <node-id>
created_at: ISO timestamp
updated_at: ISO timestamp
```

## Lifecycle
1. **Capture** — operator or Cell2 writes an experience entry from a real event.
2. **Structure** — the six-question scaffold (what, did, why, how, outcome, lessons) forces densening.
3. **Store** — written to vault as markdown under `experiences/<id>.md` plus indexed in `EXPERIENCES-INDEX.md`.
4. **Link** — attached to one or more Focuses; referenced from spells and doctrine.
5. **Reuse** — surfaced as spell context, doctrine input, or training signal.

## Relationship to existing GRIMOIRE types
- **Focus** = who/what we are tracking.
- **Spell** = outbound message or action directive.
- **Doctrine** = universal rule or standard.
- **Experience** = **personal operational memory** — the “been there” layer.

## DASKW integration
Every experience write:
- D: captured from real event
- A: structured via scaffold
- S: summarized in index
- K: linked to focuses, spells, doctrine
- W: written to vault disk

## UI shape
- New panel/tab: “Experiences”
- List view with filters (tag, focus, certainty, status)
- Detail/edit view with the six-question scaffold
- Inline link to active Focus
- Copy-as-spell shortcut (turn experience into a spell)

## Future automation
- Auto-suggest experience logging after a Focus reaches a milestone.
- Spell forge reads experiences for context (forge from real method, not generic advice).
- Cell2 uses experiences to calibrate advice quality.

# Glyph: Spell Draft

## Abstract
A spell is a draft until it is cast. Cards in Active are suggestions. Copy/send/mark-sent is the cast. Compounding edits per exchange are expected. Treating a draft as already-delivered is how trash spells enter history.

## Verified Instances
- GRIMOIRE Active vs Cast History: sealed only after sent/answered/self-cast stamps, not on rebuild.
- Copy-and-await: `awaitingReply` keeps the card Active until paste-reply densens.
- Human message bus: no silent outbound. The operator is the transport. Draft stays local until they move it.

## Caveats
- Does not mean never auto-generate. Auto-forge into Active is allowed; auto-send is not.
- Does not apply to doctrine files. Doctrine is not a spell card.

## Scaling Gaps
- Draft watermark on uncast cards in compact and detail views.
- Refuse bus densen of a spell that still has `status: ready` and no copy timestamp.

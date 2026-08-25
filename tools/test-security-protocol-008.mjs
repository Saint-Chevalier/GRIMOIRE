import { screenDeltaIntelligence } from "./screen-delta-intelligence.mjs";
import { sanitizePublicDoc } from "./sanitize-public-doc.mjs";
import { isBlockedVaultPath } from "./guard-vault-staged.mjs";

let fail = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!ok) fail++;
}

const privateCases = [
  ["email", "Contact me at operator@example.com please"],
  ["phone", "Call +1 (415) 555-0100 tonight"],
  ["ssn", "ssn 123-45-6789"],
  ["street", "I live at 123 Oak Street"],
  ["operator", "Jacob will approve the lane"],
  ["vault", "wrote to GRIMOIRE-FocusIntelligence/entities"],
  ["family", "my wife said the vault is ready"],
  ["doctrine", "kingdom doctrine requires silence"],
];
for (const [name, text] of privateCases) {
  const r = screenDeltaIntelligence(text);
  check(`screen PRIVATE ${name}`, r.verdict === "PRIVATE", r.verdict);
}

const safeCases = [
  ["function", "export function foo() { return 1; }"],
  ["html", "<button type=\"button\">Cast Spell</button>"],
  ["arch", "# Architecture\nThe app is a static ESM bundle with a local vault option."],
];
for (const [name, text] of safeCases) {
  const r = screenDeltaIntelligence(text, { filename: "app.js" });
  check(`screen SAFE ${name}`, r.verdict === "SAFE", r.verdict);
}

const san = sanitizePublicDoc(
  "Jacob emailed operator@example.com from D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence"
);
check("sanitize redacts personal", san.text.includes("[REDACTED-PERSONAL]"));
check("sanitize redacts strategy path", san.text.includes("[REDACTED-STRATEGY]"));
check("sanitize does not leave email", !san.text.includes("@example.com"));
check("sanitize logs count", san.redactions.length >= 2);

const review = screenDeltaIntelligence("I " + "think about shipping this lane. ".repeat(25));
check("screen NEEDS_REVIEW first-person", review.verdict === "NEEDS_REVIEW", review.verdict);

check("guard allows public daskw tool", !isBlockedVaultPath("tools/init-grok-build-daskw.mjs"));
check("guard allows gbg-daskw tool", !isBlockedVaultPath("tools/gbg-daskw.mjs"));
check("guard blocks vault dir", isBlockedVaultPath("GRIMOIRE-FocusIntelligence/entities.json"));
check("guard blocks daskw dir", isBlockedVaultPath("foo/grok-build-daskw/conversations/x.md"));
check("guard blocks pending-review dir", isBlockedVaultPath("pending-review/item.md"));
check("guard blocks pre-reset backup", isBlockedVaultPath("focus-state-pre-reset-2026.json"));
check("guard blocks env", isBlockedVaultPath(".env.local"));

if (fail) {
  console.error(`\n${fail} failed`);
  process.exit(1);
}
console.log("\nscreening tests passed");

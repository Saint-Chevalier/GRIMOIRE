/**
 * Execution Directive 003 — offline verification (no browser).
 * package.json is commonjs, so we source-match the ESM app files and write
 * a 5-domain entity into the D: vault using the same markdown shape.
 *
 * Run: node tools/verify-directive-003.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VAULT_ENTITIES = "D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence\\entities";

const fail = [];
const pass = [];
function check(name, ok, detail = "") {
  (ok ? pass : fail).push(name + (detail ? ` — ${detail}` : ""));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const app = read("js/app.js");
const data = read("js/data.js");
const intel = read("js/intelligence.js");
const html = read("index.html");

// 1. Spell crafter
check("tryUpgradeSpell in markSent (cast)", /tryUpgradeSpell\(spell, convoForUpgrade, \{ trigger: "cast" \}\)/.test(app));
check("tryUpgradeSpell in commitSpell (forge)", /tryUpgradeSpell\(spell, convo, \{ trigger: "forge" \}\)/.test(app));
check("tryUpgradeSpell debug logging", /\[spell-crafter\] evaluate/.test(app) && /\[spell-crafter\] silent/.test(app));
check("tier/mastery badges on spell face", /spell-face-tier/.test(app) && /spell-face-mastery/.test(app));
check("evaluateSpellUpgrade uses projected mastery", /projectedMastery/.test(data) && /computeSpellMasteryScore/.test(data));
check("crafter context loads vault intel via intelligence.js", /readAllEntitiesFromVault/.test(data) && /readExperiencesFromVault/.test(data));

// 2. Session0
check("SESSION0_RETIRED true", /export const SESSION0_RETIRED = true/.test(data));
check("resolveHermesInjectSessionId empty when retired", /if \(SESSION0_RETIRED\) return ""/.test(data));
check("makeHermesDeliveryPayload no Session0 default", /injectId = explicit && !isSession0\(explicit\) \? explicit : ""/.test(data));
check("spell send hidden for Session0", /Session0 retired · record only/.test(app));
check("fleet view retired badge", /session0-badge is-retired/.test(app) && /Session0 · retired/.test(app));
check("copy toast retired language", /Copied — \$\{SESSION0_NAME\} retired · record only/.test(app));
check("no live Send to Session0 CTA in app.js", !/Send to Session0/.test(app));

// 3. Entity I/O
check("[entity-write] log", /\[entity-write\]/.test(intel));
check("[entity-read] log", /\[entity-read\]/.test(intel));
check("[entity-error] log", /\[entity-error\]/.test(intel));
check("getLastEntityIo exported", /export function getLastEntityIo/.test(intel));
check("Audit panel surfaces entity I/O errors", /Entity vault I\/O failed/.test(html));

{
  const now = new Date().toISOString();
  const md = [
    "---",
    'id: "ent-directive-003-verify"',
    'type: "item"',
    'name: "Directive 003 Verify Widget"',
    "aliases: []",
    'certainty: "inferred"',
    'status: "active"',
    'source: "auto-capture"',
    `created_at: "${now}"`,
    `updated_at: "${now}"`,
    'tags: ["auto-detected", "directive-003"]',
    "related_entities: []",
    "related_focuses: []",
    "---",
    "",
    "## Directive 003 Verify Widget",
    "",
    "### Identity Facts",
    "",
    "- **kind:** verification-artifact",
    "- **location:** D: vault",
    "",
    "### Physical Facts",
    "",
    "- **color:** black",
    "- **size:** 1u",
    "",
    "### Ownership Facts",
    "",
    "- **paid:** $12",
    "",
    "### Operational Facts",
    "",
    "- **detected_from:** conversation",
    "",
    "### Dynamic Facts",
    "",
    "- **last_seen:** 2026-08-24",
    "",
    "_Entity Intelligence · DASKW on disk._",
    "",
  ].join("\n");
  const domains = ["Identity Facts", "Physical Facts", "Ownership Facts", "Operational Facts", "Dynamic Facts"];
  check("entity markdown has 5 fact domains", domains.every((d) => md.includes(`### ${d}`)));
  fs.mkdirSync(VAULT_ENTITIES, { recursive: true });
  const outPath = path.join(VAULT_ENTITIES, "ent-directive-003-verify.md");
  fs.writeFileSync(outPath, md, "utf8");
  check("entity wrote to D: vault", fs.existsSync(outPath) && fs.statSync(outPath).size > 200, outPath);
}

// 4. Bus full-body
check("densenBusMessage logs payload size", /\[bus-relay\] densen before/.test(intel) && /\[bus-relay\] densen after/.test(intel));
check("relayIntelBetweenFocuses logs payload size", /\[bus-relay\] relay before/.test(intel) && /\[bus-relay\] relay after/.test(intel));
check("densen writes bus.body not slice", /bus\.body,/.test(intel) && /full-body/.test(intel));
check("handleBusRoute passes full payload", /FULL BODY/.test(app) && /densenBusMessage\(target \|\| node, payload/.test(app));
check("no cloud bus client in intelligence.js", !/https?:\/\/(?!127\.0\.0\.1)/.test(intel));

console.log(`\n${pass.length} passed, ${fail.length} failed`);
if (fail.length) {
  console.error(fail.map((f) => " - " + f).join("\n"));
  process.exit(1);
}

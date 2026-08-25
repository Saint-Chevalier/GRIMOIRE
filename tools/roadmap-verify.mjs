/**
 * Execution Directive 005 — offline /roadmap verify for Step 1.
 * Run: node tools/roadmap-verify.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [
  { name: "bus densenBusMessage", file: "js/intelligence.js", pattern: "densenBusMessage" },
  { name: "bus full-body", file: "js/intelligence.js", pattern: "full-body" },
  { name: "handleBusRoute", file: "js/app.js", pattern: "handleBusRoute" },
  { name: "relayIntelBetweenFocuses", file: "js/app.js", pattern: "relayIntelBetweenFocuses" },
  { name: "Session0 retired", file: "js/data.js", pattern: "SESSION0_RETIRED" },
  { name: "spell crafter tryUpgradeSpell", file: "js/app.js", pattern: "tryUpgradeSpell" },
  { name: "entity writeEntityToVault", file: "js/intelligence.js", pattern: "writeEntityToVault" },
  { name: "evaluateSpellConditions", file: "js/data.js", pattern: "evaluateSpellConditions" },
];

let blocked = 0;
let failed = 0;
let passed = 0;
for (const c of checks) {
  const fp = path.join(ROOT, c.file);
  if (!fs.existsSync(fp)) {
    console.log(`[roadmap-verify] fail ${c.name} — missing ${c.file}`);
    failed++;
    continue;
  }
  const text = fs.readFileSync(fp, "utf8");
  const ok = text.includes(c.pattern);
  console.log(`[roadmap-verify] ${ok ? "pass" : "fail"} ${c.name}`);
  if (ok) passed++;
  else failed++;
}
const status = failed ? "blocked" : passed === checks.length ? "complete" : "pending";
console.log(`result=${status} passed=${passed} failed=${failed} blocked=${blocked}`);
if (failed) process.exit(1);

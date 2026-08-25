import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8");
const app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
const intel = fs.readFileSync(path.join(ROOT, "js/intelligence.js"), "utf8");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
let fail = 0;
function check(n, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}`);
  if (!ok) fail++;
}
check("evaluateSpellConditions", data.includes("export function evaluateSpellConditions"));
check("conditions on normalizeSpell", data.includes("normalizeSpellConditions"));
check("forge gated", app.includes("evaluateSpellConditions(spell"));
check("spell detail Conditions", app.includes("spell-detail-conditions") || html.includes("spell-detail-conditions"));
check("ENTITY_RELATIONS", data.includes("works_for") && data.includes("conflicts_with"));
check("relationships on entity", data.includes("relationships: normalizeEntityRelationships"));
check("entity-rel logs", intel.includes("[entity-rel] add") && intel.includes("[entity-rel] remove"));
check("auto-capture rel patterns", intel.includes("detectRelationshipsFromText"));
check("timeline tab", html.includes("tab-audit-timeline") && html.includes("panel-audit-timeline"));
check("timeline filters persist", html.includes("grimoire-bus-timeline-filters-v1"));
check("timeline click jump", html.includes("__selectFocusByName"));
check("step1 auto-complete", data.includes("sev-01-bus-relay-full-body") && data.includes('step.status = "complete"'));
check("verify statuses", data.includes('"complete"') && data.includes('"pending"') && data.includes('"blocked"'));
check("roadmap-verify logging", app.includes("[roadmap-verify]"));
if (fail) process.exit(1);
console.log("\nall passed");

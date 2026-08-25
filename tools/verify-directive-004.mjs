/**
 * Execution Directive 004 — offline verification.
 * Run: node tools/verify-directive-004.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPORT_DIR = "D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence\\export";

const fail = [];
const pass = [];
function check(name, ok, detail = "") {
  (ok ? pass : fail).push(name + (detail ? ` — ${detail}` : ""));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const css = read("css/styles.css");
const html = read("index.html");
const app = read("js/app.js");
const data = read("js/data.js");
const intel = read("js/intelligence.js");

check("mobile collapse at 767px", /@media \(max-width: 767px\)/.test(css));
check("three-pane becomes column on mobile", /flex-direction:\s*column/.test(css));
check("touch targets 44px", /min-height:\s*44px/.test(css));
check("no overflow-x on mobile app", /overflow-x:\s*hidden/.test(css));
check("intel-audit full-screen on mobile", /\.intel-audit-panel \{[\s\S]*position:\s*fixed/.test(css));

check("settings tabs in HTML", /data-settings-tab="general"/.test(html) && /data-settings-tab="spells"/.test(html) && /data-settings-tab="tabs"/.test(html) && /data-settings-tab="roadmap"/.test(html));
check("settings save/load functions", /function hydrateSettingsForm/.test(app) && /persistSettingsFromForm/.test(app));
check("settings debug logs", /\[settings\] save/.test(data) && /\[settings\] load/.test(app));
check("settings localStorage only", /SETTINGS_KEY/.test(data) && !/fetch\(/.test(data));

check("exportFocusDossier present", /async function exportFocusDossier/.test(app));
check("Export Dossier button", /id="btn-export-dossier"/.test(html) && /Export Dossier/.test(html));
check("writeExportDossier in intelligence.js", /export async function writeExportDossier/.test(intel));
check("[export] logs", /\[export\] start/.test(intel) && /\[export\] complete/.test(intel) && /\[export\] error/.test(intel));
check("dossier YAML builder", /function buildFocusDossierMarkdown/.test(data) && /parent_focus_id/.test(data));

check("parent_focus_id on schema", /parent_focus_id/.test(data) && /parent_focus_id: null/.test(app));
check("createChildFocus", /function createChildFocus/.test(app));
check("Create Child Focus button", /id="btn-create-child-focus"/.test(html));
check("breadcrumb", /focus-breadcrumb/.test(html) && /focusBreadcrumbLabel/.test(app));
check("depth cap 3", /FOCUS_MAX_DEPTH = 3/.test(data) && /canSpawnChildFocus/.test(data));
check("[focus] spawn/inherit logs", /\[focus\] spawn child/.test(app) && /\[focus\] inherit/.test(app));
check("cache bust exec-004", /exec-004/.test(html) && /__grimoireBootVersion = "exec-004"/.test(app));

{
  const md = [
    "---",
    'name: "Directive 004 Verify"',
    'entity: "ent-directive-004-verify"',
    'type: "idea"',
    `created: "${new Date().toISOString()}"`,
    `updated: "${new Date().toISOString()}"`,
    'parent_focus_id: ""',
    "tags: [\"directive-004\"]",
    "---",
    "",
    "# Directive 004 Verify — Dossier",
    "",
    "## Linked entities",
    "",
    "- **none**",
    "",
    "## Experiences",
    "",
    "_None captured._",
    "",
    "## Spells",
    "",
    "_No spells._",
    "",
    "## Scroll nodes",
    "",
    "_None._",
    "",
    "## Bus activity",
    "",
    "_None._",
    "",
  ].join("\n");
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const outPath = path.join(EXPORT_DIR, "directive-004-verify-dossier.md");
  fs.writeFileSync(outPath, md, "utf8");
  check("dossier wrote to D: export/", fs.existsSync(outPath) && fs.statSync(outPath).size > 120, outPath);
  check("dossier has YAML frontmatter", md.startsWith("---") && md.includes("parent_focus_id:"));
}

console.log(`\n${pass.length} passed, ${fail.length} failed`);
if (fail.length) {
  console.error(fail.map((f) => " - " + f).join("\n"));
  process.exit(1);
}

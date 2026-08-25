import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "css/styles.css"), "utf8");
const app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
let fail = 0;
function check(name, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) fail++;
}
check("overlay hidden by default", /id="intel-audit-overlay" class="intel-audit-overlay" hidden/.test(html));
check("brand-word trigger", /id="brand-word"/.test(html));
check("sessionStorage key", html.includes("grimoire-intel-audit-overlay-v1"));
check("Escape closes overlay", html.includes("Escape") && html.includes("closeIntelAuditOverlay"));
check("backdrop click", html.includes("data-audit-backdrop"));
check("overlay CSS full-screen", css.includes(".intel-audit-overlay") && css.includes("position: fixed"));
check("[hidden] forces display none", css.includes(".intel-audit-overlay[hidden]"));
check("brand click no longer opens settings", !/els\.brandText\?\.addEventListener\("click"/.test(app));
check("settings gear present", html.includes('id="btn-app-settings"'));
check(
  "all audit tabs preserved",
  ["overview", "entities", "experiences", "focuses", "scroll", "bus", "glyphs"].every((t) =>
    html.includes(`tab-audit-${t}`)
  )
);
check("exec-006 cache", html.includes("exec-006"));
if (fail) process.exit(1);
console.log(`\n${11 - fail} passed`);

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "css/styles.css"), "utf8");
const app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
let fail = 0;
function check(n, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}`);
  if (!ok) fail++;
}
check("no floating settings button", !/\sid="btn-app-settings"/.test(html) && !/id="btn-app-settings">/.test(html));
check("no ⚙ in live header", !html.includes("⚙"));
check("brand menu items", html.includes('data-brand-open="audit"') && html.includes('data-brand-open="settings"'));
check("sessionStorage brand key", html.includes("grimoire-brand-overlay-v1"));
check("settings overlay backdrop", html.includes("data-settings-backdrop"));
check("settings close button", html.includes("btn-app-settings-close"));
check("audit overlay kept", html.includes("intel-audit-overlay"));
check("settings tabs kept", ["general", "spells", "tabs", "roadmap"].every((t) => html.includes(`data-settings-tab="${t}"`)));
check("dropdown CSS", css.includes(".brand-menu") && css.includes(".brand-menu-item"));
check("settings full-screen z-index", /z-index:\s*90/.test(css));
check("openAppSettings exposed", app.includes("window.__openAppSettings"));
check("exec-007", html.includes("exec-007"));
if (fail) process.exit(1);
console.log("\nall passed");

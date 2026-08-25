/**
 * Execution Directive 009 — structural + status-label checks.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0;
function check(n, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${extra ? " — " + extra : ""}`);
  if (!ok) fail++;
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const data = read("js/data.js");
const intel = read("js/intelligence.js");
const app = read("js/app.js");
const html = read("index.html");
const css = read("css/styles.css");

check("IDB key constant", data.includes('VAULT_HANDLE_IDB_KEY = "grimoire-vault-handle-v1"'));
check("VAULT_HEALTH states", /LINKED:\s*"linked"/.test(data) && /UNLINKED:\s*"unlinked"/.test(data));
check("vaultStatusLabel", data.includes("export function vaultStatusLabel"));
check("idb dual-write v1", intel.includes("idbSet(VAULT_HANDLE_IDB_KEY"));
check("loadStoredVaultHandle", intel.includes("export async function loadStoredVaultHandle"));
check("getVaultHealth", intel.includes("export async function getVaultHealth"));
check("relinkStoredVaultHandle", intel.includes("export async function relinkStoredVaultHandle"));
check("log restore", intel.includes("[vault] restore"));
check("log linked", intel.includes("[vault] linked"));
check("log broken", intel.includes("[vault] broken"));
check("boot health check", app.includes("getVaultHealth()"));
check("boot vault ready toast", app.includes("Vault ready"));
check("boot relink toast", app.includes("Vault unlinked — click 📁 to restore"));
check("cancel capture disabled", app.includes("intelligence capture disabled"));
check("status bar data attr", html.includes('data-vault-state'));
check("status bar aria-live", html.includes('id="intel-folder-status"') && html.includes("aria-live"));
check("relink pulse css", css.includes("vault-needs-relink"));
check("cache bust html", html.includes("exec-009"));
check("cache bust app", app.includes("exec-009"));
check("no picker on boot", app.includes("forcePrompt: false") || app.includes("no OS picker on load"));
check("label copy linked", data.includes("Vault ready · ") && data.includes('"Vault ready"'));
check("label copy unlinked", data.includes("Vault unlinked — click 📁 to restore"));
check("label copy cancel", data.includes("Vault unlinked — intelligence capture disabled"));
check("label copy error", data.includes("Vault error — click 📁 to restore"));

if (fail) {
  console.error(`\n${fail} failed`);
  process.exit(1);
}
console.log("\n009 structural checks passed");

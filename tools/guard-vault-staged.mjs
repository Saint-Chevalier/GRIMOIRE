/**
 * Security Protocol Directive 008 — fail if vault / secrets are staged.
 *
 * Matches path *segments* (directories / exact secret files), not public
 * tool filenames that contain strings like "grok-build-daskw".
 *
 *   import { isBlockedVaultPath } from "./guard-vault-staged.mjs"
 *   node tools/guard-vault-staged.mjs
 */
import { execSync } from "node:child_process";
import path from "node:path";

const BLOCK = [
  /(^|\/)GRIMOIRE-FocusIntelligence(\/|$)/i,
  /(^|\/)FocusIntelligence(\/|$)/i,
  /(^|\/)grok-build-daskw(\/|$)/i,
  /(^|\/)pending-review(\/|$)/i,
  /focus-state-pre-reset/i,
  /(^|\/)\.env(\.|$)/,
  /\.pem$/i,
  /\.key$/i,
];

export function isBlockedVaultPath(file) {
  const f = String(file || "").replace(/\\/g, "/");
  return BLOCK.some((re) => re.test(f));
}

export function findBlockedPaths(files) {
  return (files || []).filter((f) => isBlockedVaultPath(f));
}

function runningAsMain() {
  const argv = process.argv[1];
  if (!argv) return false;
  return path.basename(argv).toLowerCase() === "guard-vault-staged.mjs";
}

function main() {
  const staged = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean);

  const hits = findBlockedPaths(staged);
  if (hits.length) {
    console.error("[vault-guard] BLOCKED staged private paths:");
    for (const h of hits) console.error("  -", h);
    process.exit(1);
  }
  console.log("[vault-guard] ok — no vault/secret paths staged");
}

if (runningAsMain()) main();

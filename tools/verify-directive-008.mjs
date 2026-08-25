import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isBlockedVaultPath } from "./guard-vault-staged.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0;
function check(n, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${extra ? " — " + extra : ""}`);
  if (!ok) fail++;
}

const gi = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
check("gitignore vault", gi.includes("GRIMOIRE-FocusIntelligence/"));
check("gitignore daskw", gi.includes("grok-build-daskw"));
check("gitignore env", gi.includes(".env"));
check("screen module", fs.existsSync(path.join(ROOT, "tools/screen-delta-intelligence.mjs")));
check("sanitize module", fs.existsSync(path.join(ROOT, "tools/sanitize-public-doc.mjs")));
check("vault guard", fs.existsSync(path.join(ROOT, "tools/guard-vault-staged.mjs")));
check("daskw init", fs.existsSync(path.join(ROOT, "tools/init-grok-build-daskw.mjs")));
check("protocol doc", fs.existsSync(path.join(ROOT, "docs/security/OPEN-SOURCE-PROTOCOL.md")));
check("classification doc", fs.existsSync(path.join(ROOT, "docs/security/DATA-CLASSIFICATION.md")));
check("ci workflow", fs.existsSync(path.join(ROOT, ".github/workflows/vault-guard.yml")));
check("pre-commit vault-guard", fs.readFileSync(path.join(ROOT, "tools/githooks/pre-commit"), "utf8").includes("guard-vault-staged"));

const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const vaultHits = tracked.filter((f) => isBlockedVaultPath(f));
check("no tracked vault files", vaultHits.length === 0, vaultHits.join(", "));
check(
  "guard allows public daskw tools",
  !isBlockedVaultPath("tools/init-grok-build-daskw.mjs") &&
    !isBlockedVaultPath("tools/gbg-daskw.mjs")
);
check(
  "guard blocks vault directory",
  isBlockedVaultPath("GRIMOIRE-FocusIntelligence/entities.json") &&
    isBlockedVaultPath("grok-build-daskw/conversations/x.md")
);

if (fail) process.exit(1);
console.log("\n008 structural checks passed");

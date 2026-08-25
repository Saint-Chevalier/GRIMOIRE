/**
 * Security Protocol Directive 008 — create private Grok Build DASKW tree.
 * Default root: D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence\\grok-build-daskw
 */
import fs from "node:fs";
import path from "node:path";

function defaultRoot() {
  if (process.env.GROK_BUILD_DASKW) return process.env.GROK_BUILD_DASKW;
  if (process.env.ROADMAP_VAULT) {
    return path.join(process.env.ROADMAP_VAULT, "grok-build-daskw");
  }
  return "D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence\\grok-build-daskw";
}
const ROOT = defaultRoot();

const LANES = ["conversations", "intelligence", "screened", "pending-review"];

export function initGrokBuildDaskw(root = ROOT) {
  fs.mkdirSync(root, { recursive: true });
  for (const lane of LANES) fs.mkdirSync(path.join(root, lane), { recursive: true });
  const readme = `# Grok Build DASKW (PRIVATE)

This tree is gitignored. Never copy it into the public GRIMOIRE repo.

- conversations/ — raw session logs
- intelligence/ — extracted delta intelligence
- screened/ — passed screenDeltaIntelligence (SAFE)
- pending-review/ — NEEDS_REVIEW, operator decides

Screening: node tools/screen-delta-intelligence.mjs
`;
  fs.writeFileSync(path.join(root, "README.md"), readme, "utf8");
  return { root, lanes: LANES };
}

const isMain = process.argv[1] && /init-grok-build-daskw/.test(process.argv[1]);
if (isMain) {
  const created = initGrokBuildDaskw();
  console.log("[daskw] init", created.root);
}

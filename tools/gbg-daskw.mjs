/**
 * Security Protocol Directive 008 — Grok Build DASKW write + screen gate.
 *
 *   node tools/gbg-daskw.mjs conversation "log text"
 *   node tools/gbg-daskw.mjs intelligence "delta text"
 */
import fs from "node:fs";
import path from "node:path";
import { initGrokBuildDaskw } from "./init-grok-build-daskw.mjs";
import { screenDeltaIntelligence } from "./screen-delta-intelligence.mjs";

const ROOT = initGrokBuildDaskw().root;

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function writeConversation(text, { source = "gbg" } = {}) {
  const file = path.join(ROOT, "conversations", `${stamp()}-${source}.md`);
  fs.writeFileSync(file, String(text || ""), "utf8");
  return file;
}

export function writeIntelligence(text, { source = "gbg" } = {}) {
  const raw = String(text || "");
  const intelFile = path.join(ROOT, "intelligence", `${stamp()}-${source}.md`);
  fs.writeFileSync(intelFile, raw, "utf8");
  const screen = screenDeltaIntelligence(raw, { filename: intelFile });
  let dest;
  if (screen.verdict === "SAFE") {
    dest = path.join(ROOT, "screened", path.basename(intelFile));
  } else if (screen.verdict === "NEEDS_REVIEW") {
    dest = path.join(ROOT, "pending-review", path.basename(intelFile));
  } else {
    dest = null;
  }
  if (dest) fs.writeFileSync(dest, raw, "utf8");
  return { intelFile, dest, screen };
}

const op = process.argv[2];
const body = process.argv.slice(3).join(" ");
if (op === "conversation") {
  console.log(writeConversation(body));
} else if (op === "intelligence") {
  console.log(JSON.stringify(writeIntelligence(body), null, 2));
}

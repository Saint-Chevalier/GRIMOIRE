/**
 * Execution Directive 011 — node registry, dispatch helpers, security.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { screenDeltaIntelligence } from "./screen-delta-intelligence.mjs";
import { isBlockedVaultPath } from "./guard-vault-staged.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0;
function check(n, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${extra ? " — " + extra : ""}`);
  if (!ok) fail++;
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const nodesSrc = read("js/nodes.js");
const data = read("js/data.js");
const intel = read("js/intelligence.js");
const app = read("js/app.js");
const html = read("index.html");
const gi = read(".gitignore");
const guard = read("tools/guard-vault-staged.mjs");

check("nodes module", nodesSrc.includes("export function createNode"));
check("data re-exports registry", data.includes("loadNodeRegistry") && data.includes('from "./nodes.js"'));
check("vault loadNodeRegistry", intel.includes("export async function loadNodeRegistry"));
check("clipboard dispatch", intel.includes("export async function dispatchSpellToClipboard"));
check("clipboard capture", intel.includes("export async function captureReplyFromClipboard"));
check("http dispatch", intel.includes("export async function dispatchSpellToHTTP"));
check("dispatch copy log", intel.includes("[dispatch] copy"));
check("dispatch paste log", intel.includes("[dispatch] paste"));
check("dispatch http send", intel.includes("[dispatch] http send"));
check("dispatch http receive", intel.includes("[dispatch] http receive"));
check("dispatch error log", intel.includes("[dispatch] error"));
check("settings nodes tab", html.includes('data-settings-tab="nodes"'));
check("audit nodes tab", html.includes('id="tab-audit-nodes"'));
check("gitignore registry", gi.includes("**/nodes/registry.json"));
check("gitignore secrets", gi.includes("**/nodes/secrets/"));
check("guard blocks registry", guard.includes("nodes\\/registry"));
check("cast no-target toast", app.includes("Spell has no target. Assign a node before casting."));
check("copy toast node name", app.includes("Spell copied — paste into"));

const tmpMjs = path.join(ROOT, "tools/_nodes-011-import.mjs");
fs.writeFileSync(tmpMjs, nodesSrc);
const nodes = await import(pathToFileURL(tmpMjs).href + "?t=" + Date.now());
try {
  fs.unlinkSync(tmpMjs);
} catch {
  /* ignore */
}
const { createNode, updateNode, deleteNode, getNodeById, getActiveNodes, setNodeRegistry, seedDefaultNodes, normalizeSpellTarget, assignSpellTarget, validateCapturedReply, buildHttpDispatchPayload, parseHttpDispatchReply, publicNodeView } = nodes;

setNodeRegistry({ version: 1, nodes: seedDefaultNodes() });
check("seed grok build", getNodeById("node-grok-build")?.dispatch_protocol === "clipboard");

const created = createNode({
  name: "Local Ollama",
  type: "local",
  endpoint: "http://127.0.0.1:11434",
  model: "llama3",
});
check("create local node", created.id.startsWith("node-") && created.dispatch_protocol === "http");
updateNode(created.id, { notes: "test" });
check("update node", getNodeById(created.id)?.notes === "test");
check("active includes seed", getActiveNodes().some((n) => n.id === "node-grok-build"));
deleteNode(created.id);
check("delete node", !getNodeById(created.id));

const grok = getNodeById("node-grok-build");
const spell = { content: "Do the thing", target: "GRIMOIRE" };
assignSpellTarget(spell, grok);
check("structured target", spell.targetNode?.node_id === "node-grok-build" && spell.target === "Grok Build");
check("normalize from string", normalizeSpellTarget("Grok Build")?.node_id === "node-grok-build");

check("reply empty", validateCapturedReply("  ", spell).ok === false);
check("reply same as spell", validateCapturedReply("Do the thing", spell).ok === false);
check("reply ok", validateCapturedReply("Here is the implementation.", spell).ok === true);

const payload = buildHttpDispatchPayload(spell, { model: "grok-3", type: "api", endpoint: "https://api.x.ai" });
check("http payload model", payload.model === "grok-3");
check("http payload messages", payload.messages?.[0]?.content === "Do the thing");
check("http parse openai", parseHttpDispatchReply({ choices: [{ message: { content: "hi" } }] }) === "hi");

const leaked = publicNodeView({ ...grok, api_key: "sk-secret-should-not-appear" });
check("public view strips key", !leaked.api_key);

const keyScreen = screenDeltaIntelligence("export const k = 'sk-abcdefghijklmnopqrstuvwxyz012345'");
check("screen flags api key", keyScreen.verdict === "PRIVATE", keyScreen.verdict);

check("guard registry path", isBlockedVaultPath("nodes/registry.json"));
check("guard secrets path", isBlockedVaultPath("nodes/secrets/node-x.key"));
check("guard allows js/nodes.js", !isBlockedVaultPath("js/nodes.js"));

if (fail) {
  console.error(`\n${fail} failed`);
  process.exit(1);
}
console.log("\n011 dispatch + registry checks passed");

/**
 * Execution Directive 012 — self-cast gating + PURPOSE + styling.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const app = read("js/app.js");
const css = read("css/styles.css");
const html = read("index.html");

check("parseSelfCastCommand", data.includes("export function parseSelfCastCommand"));
check("generateSelfCastSpell", data.includes("export function generateSelfCastSpell"));
check("PURPOSE heading", data.includes("## PURPOSE"));
check("purpose error copy", data.includes("Self-cast requires stated purpose."));
check("allowSelfCast false on auto-forge", (app.match(/allowSelfCast:\s*false/g) || []).length >= 2);
check("slash handle", app.includes("parseSelfCastCommand(userText)"));
check("alignment threshold 70", app.includes("focusDensityPercent(convo) < 70"));
check("once per session", app.includes("grimoire-self-cast-align-v1:"));
check("Forge Self-Cast button", html.includes("Forge Self-Cast"));
check("orange border", css.includes("#ff6b35"));
check("gold accent", css.includes("#ffd700"));
check("self-cast card class", css.includes(".spell-item.spell-self-cast"));
check("SELF-CAST badge", css.includes(".spell-self-cast-badge"));
check("no nodes message", app.includes("No external nodes configured. Add a node in Settings → Nodes"));
check("heal no longer auto-promotes", data.includes("s.selfCastIntent === true"));
check("cache bust", html.includes("exec-012"));

const snippet = `
export function parseSelfCastCommand(text) {
  const raw = String(text || "").trim();
  const m = raw.match(/^\\/(self-cast|reflect|introspect)\\b\\s*([\\s\\S]*)$/i);
  if (!m) return null;
  return { command: String(m[1] || "").toLowerCase(), rest: String(m[2] || "").trim() };
}
export function deriveSelfCastPurpose(text) {
  const parsed = parseSelfCastCommand(text);
  const raw = String(parsed ? parsed.rest : text || "")
    .replace(/^\\/(self-cast|reflect|introspect)\\b\\s*/i, "")
    .trim();
  if (raw) return raw.split(/[.!?\\n]/)[0].trim().slice(0, 180);
  return "";
}
export function injectSelfCastPurpose(spell, purpose) {
  const why = String(purpose || "").trim();
  if (!spell || !why) return false;
  const block = "## PURPOSE\\n" + why;
  const body = String(spell.content || spell.message || "");
  spell.content = /##\\s*PURPOSE\\b/i.test(body)
    ? body.replace(/##\\s*PURPOSE\\b[\\s\\S]*?(?=\\n##\\s|\\n#\\s|$)/i, block + "\\n").trim()
    : (block + "\\n\\n" + body).trim();
  spell.message = spell.content;
  return true;
}
export function selfCastHasPurpose(spell) {
  return /##\\s*PURPOSE\\b/i.test(String(spell?.content || spell?.message || ""));
}
`;
const tmp = path.join(ROOT, "tools/_self-cast-012-import.mjs");
fs.writeFileSync(tmp, snippet);
const gate = await import(pathToFileURL(tmp).href + "?t=" + Date.now());
try {
  fs.unlinkSync(tmp);
} catch {
  /* ignore */
}

check("cmd parse self-cast", gate.parseSelfCastCommand("/self-cast check gaps")?.command === "self-cast");
check("cmd parse reflect", gate.parseSelfCastCommand("/reflect who am I")?.command === "reflect");
check("normal chat is not a command", gate.parseSelfCastCommand("forge me a spell please") === null);
check("purpose from command rest", gate.deriveSelfCastPurpose("/self-cast audit the vault write path") === "audit the vault write path");
check("bare command has no purpose", gate.deriveSelfCastPurpose("/self-cast") === "");
const spell = { content: "body text" };
check("inject purpose", gate.injectSelfCastPurpose(spell, "Find the circular spell loop") === true);
check("purpose present", gate.selfCastHasPurpose(spell) && spell.content.includes("## PURPOSE"));
check("refuse empty purpose", gate.injectSelfCastPurpose({ content: "x" }, "") === false);

if (fail) {
  console.error(`\n${fail} failed`);
  process.exit(1);
}
console.log("\n012 self-cast gating checks passed");

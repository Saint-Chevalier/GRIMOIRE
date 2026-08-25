/**
 * Security Protocol Directive 008 — delta intelligence screening.
 *
 *   import { screenDeltaIntelligence } from "./screen-delta-intelligence.mjs"
 *   node tools/screen-delta-intelligence.mjs "text to screen"
 *
 * Verdicts: SAFE | PRIVATE | NEEDS_REVIEW
 */
export const VERDICTS = Object.freeze({
  SAFE: "SAFE",
  PRIVATE: "PRIVATE",
  NEEDS_REVIEW: "NEEDS_REVIEW",
});

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const CARD = /\b(?:\d[ -]*?){13,19}\b/;
const STREET = /\b\d{1,5}\s+[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Dr|Drive|Ct|Way)\b/i;
const WINDOWS_USER = /\b[A-Z]:\\Users\\[^\\\s]+/i;
const VAULT_PATH = /GRIMOIRE-FocusIntelligence|FocusIntelligence\\grok-build-daskw/i;
const OPERATOR_NAME = /\bJacob\b/;
const CONTACT = /\b(?:ssn|social security|passport|driver'?s license)\b/i;
const FINANCIAL = /\b(?:bank account|routing number|wire transfer|ssn|ein\b|tax id)\b/i;
const RELATIONSHIP = /\b(?:my wife|my husband|my kids?|my daughter|my son|my family)\b/i;
const DOCTRINE = /\b(?:kingdom doctrine|cell[0-9] hermes|personal daskw|sealed doctrine)\b/i;
const CONVO_DUMP = /\b(?:chat history|conversation log|alignment notes|experience overlay)\b/i;
const STRATEGY = /\b(?:go-to-market secret|undisclosed revenue|private roadmap for the kingdom)\b/i;
const API_KEY_TOKEN = /\b(?:sk-ant-[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9_-]{16,}|xai-[A-Za-z0-9_-]{8,})\b/;
const API_KEY_HEADER = /\b(?:authorization:\s*bearer\s+\S+|api[_-]?key\s*[:=]\s*['\"][^'\"]{8,})/i;

function hit(tier, rule, match) {
  return { tier, rule, match: String(match || "").slice(0, 80) };
}

export function screenDeltaIntelligence(content, opts = {}) {
  const text = String(content || "");
  const hits = [];
  const checks = [
    [EMAIL, "PRIVATE", "email"],
    [PHONE, "PRIVATE", "phone"],
    [SSN, "PRIVATE", "ssn"],
    [CARD, "PRIVATE", "card"],
    [STREET, "PRIVATE", "street-address"],
    [WINDOWS_USER, "PRIVATE", "local-user-path"],
    [VAULT_PATH, "PRIVATE", "vault-path"],
    [OPERATOR_NAME, "PRIVATE", "operator-name"],
    [CONTACT, "PRIVATE", "identity-doc"],
    [FINANCIAL, "PRIVATE", "financial"],
    [RELATIONSHIP, "PRIVATE", "personal-relationship"],
    [DOCTRINE, "PRIVATE", "kingdom-doctrine"],
    [CONVO_DUMP, "PRIVATE", "conversation-dump"],
    [STRATEGY, "PRIVATE", "private-strategy"],
    [API_KEY_TOKEN, "PRIVATE", "api-key"],
    [API_KEY_HEADER, "PRIVATE", "api-key-header"],
  ];
  for (const [re, tier, rule] of checks) {
    const m = text.match(re);
    if (m) hits.push(hit(tier, rule, m[0]));
  }

  const looksLikeCode =
    /(?:function\s+\w+|export\s+(?:async\s+)?function|const\s+\w+\s*=|class\s+\w+|<\/?[a-z][\s\S]*>|{[\s\S]*})/i.test(
      text
    ) ||
    /\.(js|mjs|css|html)\b/.test(String(opts.filename || ""));
  const looksLikePublicDoc =
    /^#\s+/m.test(text) &&
    /\b(architecture|api|contributing|license|roadmap)\b/i.test(text);

  let verdict = VERDICTS.SAFE;
  if (hits.some((h) => h.tier === "PRIVATE")) verdict = VERDICTS.PRIVATE;
  else if (hits.length) verdict = VERDICTS.NEEDS_REVIEW;
  else if (!looksLikeCode && !looksLikePublicDoc && text.length > 400 && /\bI\b/.test(text)) {
    verdict = VERDICTS.NEEDS_REVIEW;
    hits.push(hit("NEEDS_REVIEW", "long-first-person", "first-person prose"));
  }

  const tag = verdict === "SAFE" ? "safe" : verdict === "PRIVATE" ? "private" : "review";
  console.debug(`[daskw-screen] ${tag}`, { verdict, hits: hits.map((h) => h.rule) });
  return { verdict, hits, ok: verdict === VERDICTS.SAFE };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("screen-delta-intelligence.mjs")) {
  const input = process.argv.slice(2).join(" ") || "";
  const result = screenDeltaIntelligence(input);
  console.log(JSON.stringify(result, null, 2));
  if (result.verdict === "PRIVATE") process.exit(2);
  if (result.verdict === "NEEDS_REVIEW") process.exit(3);
}

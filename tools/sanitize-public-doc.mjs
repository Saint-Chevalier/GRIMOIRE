/**
 * Security Protocol Directive 008 — public documentation sanitizer.
 *
 *   import { sanitizePublicDoc } from "./sanitize-public-doc.mjs"
 *   node tools/sanitize-public-doc.mjs path/to/README.md
 */
import fs from "node:fs";

const PERSONAL = "[" + "REDACTED-PERSONAL" + "]";
const STRATEGY = "[" + "REDACTED-STRATEGY" + "]";
const DATE = "[" + "REDACTED-DATE" + "]";

const RULES = [
  { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, token: PERSONAL, rule: "email" },
  { re: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, token: PERSONAL, rule: "phone" },
  { re: /\b\d{3}-\d{2}-\d{4}\b/g, token: PERSONAL, rule: "ssn" },
  { re: /\bJacob\b/g, token: PERSONAL, rule: "operator-name" },
  { re: /\b[A-Z]:\\Users\\[^\\\s\\]+/gi, token: PERSONAL, rule: "user-path" },
  { re: /D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence/gi, token: STRATEGY, rule: "vault-path" },
  { re: /\b(?:go-to-market secret|undisclosed revenue|private roadmap for the kingdom)\b/gi, token: STRATEGY, rule: "strategy" },
  { re: /\b(?:19|20)\d{2}-\d{2}-\d{2}T[0-9:.Z+-]+\b/g, token: DATE, rule: "timestamp" },
];

export function sanitizePublicDoc(content) {
  let out = String(content || "");
  const redactions = [];
  for (const { re, token, rule } of RULES) {
    out = out.replace(re, (match) => {
      redactions.push({ rule, match: match.slice(0, 80) });
      console.debug("[doc-sanitize] redact", { rule, match: match.slice(0, 40) });
      return token;
    });
  }
  return { text: out, redactions, changed: redactions.length > 0 };
}

const file = process.argv[2];
if (file && import.meta.url.includes("sanitize-public-doc")) {
  const raw = fs.readFileSync(file, "utf8");
  const result = sanitizePublicDoc(raw);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(file, result.text, "utf8");
  }
  console.log(JSON.stringify({ file, changed: result.changed, count: result.redactions.length, redactions: result.redactions }, null, 2));
  if (result.changed && !process.argv.includes("--write")) process.exit(4);
}

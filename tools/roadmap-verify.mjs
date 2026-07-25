#!/usr/bin/env node
/**
 * Roadmap Verification Layer — CLI (actual checks, not AI self-report).
 *
 * Usage:
 *   node tools/roadmap-verify.mjs
 *   node tools/roadmap-verify.mjs --files js/app.js,js/data.js
 *   node tools/roadmap-verify.mjs --match js/data.js:canMarkStepComplete
 *   node tools/roadmap-verify.mjs --lint
 *   node tools/roadmap-verify.mjs --gbg   # commit-hook friendly (lint staged or all js)
 *
 * Exit codes: 0 = all pass, 1 = fail, 2 = blocked / usage error
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const DEFAULT_FILES = [
  "js/app.js",
  "js/data.js",
  "js/intelligence.js",
  "index.html",
  "css/styles.css",
];

function parseArgs(argv) {
  const out = {
    files: [],
    matches: [],
    lint: true,
    gbg: false,
    vault: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--gbg") out.gbg = true;
    else if (a === "--lint") out.lint = true;
    else if (a === "--no-lint") out.lint = false;
    else if (a === "--files" && argv[i + 1]) {
      out.files.push(
        ...String(argv[++i])
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else if (a === "--match" && argv[i + 1]) {
      // path:pattern
      const raw = String(argv[++i]);
      const sp = raw.indexOf(":");
      if (sp > 0) {
        out.matches.push({ path: raw.slice(0, sp), pattern: raw.slice(sp + 1) });
      } else {
        out.matches.push({ path: "js/data.js", pattern: raw });
      }
    } else if (a === "--vault" && argv[i + 1]) {
      out.vault = String(argv[++i]);
    } else if (!a.startsWith("-")) {
      out.files.push(a);
    }
  }
  return out;
}

function fileExists(rel) {
  const abs = resolve(ROOT, rel);
  return existsSync(abs);
}

function readSource(rel) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf8");
}

function nodeCheck(rel) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) {
    return { ok: false, evidence: `missing ${rel}` };
  }
  if (!/\.js$/i.test(rel) && !/\.mjs$/i.test(rel)) {
    return { ok: true, evidence: `${rel}: skip node --check (not JS)` };
  }
  const r = spawnSync(process.execPath, ["--check", abs], {
    encoding: "utf8",
  });
  if (r.status === 0) {
    return { ok: true, evidence: `${rel}: node --check ok` };
  }
  const err = (r.stderr || r.stdout || "lint failed").trim().slice(0, 240);
  return { ok: false, evidence: `${rel}: node --check failed — ${err}` };
}

function structuralLint(text, path) {
  if (!text) return { ok: false, evidence: `${path}: empty` };
  const stack = [];
  let inStr = null;
  let inLine = false;
  let inBlock = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLine) {
      if (ch === "\n") inLine = false;
      continue;
    }
    if (inBlock) {
      if (ch === "*" && next === "/") {
        inBlock = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "/" && next === "/") {
      inLine = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlock = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{" || ch === "(" || ch === "[") stack.push(ch);
    if (ch === "}" || ch === ")" || ch === "]") {
      const open = stack.pop();
      const want = { "}": "{", ")": "(", "]": "[" }[ch];
      if (open !== want) {
        return { ok: false, evidence: `${path}: unbalanced near ${i}` };
      }
    }
  }
  if (stack.length) return { ok: false, evidence: `${path}: unclosed ${stack.join(" ")}` };
  if (inStr) return { ok: false, evidence: `${path}: unclosed string` };
  return { ok: true, evidence: `${path}: structural ok` };
}

function checkVault(vaultRoot) {
  if (!vaultRoot) {
    return {
      result: "blocked",
      evidence: "no --vault path (browser uses File System Access API)",
    };
  }
  const abs = resolve(vaultRoot);
  if (!existsSync(abs)) {
    return { result: "fail", evidence: `vault root missing: ${abs}` };
  }
  const roadmaps = join(abs, "grimoire-local", "roadmaps");
  if (!existsSync(roadmaps)) {
    // also accept if vault itself is a focus vault with grimoire-local
    const alt = join(abs, "roadmaps");
    if (existsSync(alt)) {
      const n = readdirSync(alt).filter((f) => f.endsWith(".md")).length;
      return {
        result: "pass",
        evidence: `vault roadmaps/ has ${n} md file(s)`,
      };
    }
    return {
      result: "fail",
      evidence: `missing ${relative(ROOT, roadmaps)} under vault`,
    };
  }
  const n = readdirSync(roadmaps).filter((f) => f.endsWith(".md")).length;
  return {
    result: "pass",
    evidence: `grimoire-local/roadmaps/ present (${n} md)`,
  };
}

function run(opts) {
  const results = [];
  const files = opts.files.length ? opts.files : DEFAULT_FILES;

  for (const f of files) {
    const ok = fileExists(f);
    results.push({
      kind: "file_exists",
      path: f,
      result: ok ? "pass" : "fail",
      evidence: ok ? `${f} exists` : `${f} missing`,
    });
  }

  if (opts.lint) {
    for (const f of files.filter((x) => /\.js$/i.test(x))) {
      const nc = nodeCheck(f);
      results.push({
        kind: "lint",
        path: f,
        result: nc.ok ? "pass" : "fail",
        evidence: nc.evidence,
      });
    }
  }

  // Default source matches for verification layer itself when --gbg
  const matches = [...opts.matches];
  if (opts.gbg) {
    matches.push(
      { path: "js/data.js", pattern: "canMarkStepComplete" },
      { path: "js/data.js", pattern: "formatVerificationReport" },
      { path: "js/app.js", pattern: "runRoadmapVerification" },
      { path: "js/intelligence.js", pattern: "checkVaultEntry" }
    );
  }

  for (const m of matches) {
    const text = readSource(m.path);
    if (text == null) {
      results.push({
        kind: "source_match",
        path: m.path,
        pattern: m.pattern,
        result: "blocked",
        evidence: `cannot read ${m.path}`,
      });
      continue;
    }
    let ok = false;
    let evidence = "";
    try {
      const re = new RegExp(m.pattern);
      ok = re.test(text);
      evidence = ok
        ? `${m.path} matched /${m.pattern}/`
        : `${m.path} no match /${m.pattern}/`;
    } catch (e) {
      results.push({
        kind: "source_match",
        path: m.path,
        pattern: m.pattern,
        result: "blocked",
        evidence: `bad regex: ${e.message}`,
      });
      continue;
    }
    results.push({
      kind: "source_match",
      path: m.path,
      pattern: m.pattern,
      result: ok ? "pass" : "fail",
      evidence,
    });
  }

  if (opts.vault) {
    const v = checkVault(opts.vault);
    results.push({
      kind: "vault_entry",
      path: opts.vault,
      result: v.result,
      evidence: v.evidence,
    });
  }

  // Real lint is node --check only (see opts.lint). Structural helper kept for
  // optional offline use — do not double-fail after node --check already ran.

  return results;
}

function summarize(results) {
  const passed = results.filter((r) => r.result === "pass").length;
  const failed = results.filter((r) => r.result === "fail").length;
  const blocked = results.filter((r) => r.result === "blocked").length;
  const total = results.length || 1;
  const passRate = Math.round((passed / total) * 1000) / 10;
  const overall =
    failed > 0 ? "fail" : blocked > 0 && passed === 0 ? "blocked" : blocked > 0 ? "fail" : "pass";
  return { passed, failed, blocked, total: results.length, passRate, overall };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(`Roadmap verify CLI — executable checks

  node tools/roadmap-verify.mjs [--gbg] [--files a,b] [--match path:regex]
                                 [--vault /path/to/GRIMOIRE-FocusIntelligence]
                                 [--no-lint]

Exit: 0 pass · 1 fail · 2 blocked/error
Browser: /roadmap verify [slug]
`);
    process.exit(0);
  }

  const results = run(opts);
  const sum = summarize(results);

  console.log(`### Verification report (CLI)`);
  console.log(
    `Result: **${sum.overall}** · pass rate **${sum.passRate}%** (${sum.passed}/${sum.total})`
  );
  console.log("");
  for (const r of results) {
    const mark =
      r.result === "pass" ? "✓" : r.result === "fail" ? "✗" : "⚠";
    console.log(
      `${mark} [${r.result}] ${r.kind} ${r.path || ""}${
        r.pattern ? ` /${r.pattern}/` : ""
      } — ${r.evidence}`
    );
  }
  console.log("");
  if (sum.failed || sum.blocked) {
    console.log("**Blockers**");
    for (const r of results.filter((x) => x.result !== "pass")) {
      console.log(`- ${r.kind} ${r.path}: ${r.evidence}`);
    }
    console.log("");
  }
  console.log("**Next actions**");
  if (sum.overall === "pass") {
    console.log("- CLI checks passed. In app: `/roadmap verify` then mark steps complete.");
  } else {
    console.log("- Fix failing paths / symbols, re-run this CLI and `/roadmap verify` in the app.");
  }

  if (sum.overall === "pass") process.exit(0);
  if (sum.failed > 0) process.exit(1);
  process.exit(2);
}

main();

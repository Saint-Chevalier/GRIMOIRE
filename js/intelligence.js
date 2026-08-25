/**
 * Local-first intelligence vault — per-focus folders.
 *
 * - Each Focus links its own vault via "Create my path" (user gesture)
 * - Folder name: <FocusName>-FocusIntelligence/ under a parent the user picks
 * - Handles stored in IndexedDB as intelligence-dir-<focusId>
 * - LS flags: grimoire-intel-folder-ready-<focusId>
 * - Legacy global intelligence-dir / grimoire-intel-folder-ready kept as fallback only
 * - Download ONLY if File System Access API is unavailable
 */

import {
  getFocusType,
  getSealedChannel,
  isAlignmentSpell,
  formatSpellMarkdown,
  isCell2CoreFocus,
  isVisibleFocus,
  CELL2_CORE_ID,
  CELL2_CORE_NAME,
  CERTAINTY_LEVELS,
  INTEL_CATEGORIES,
  ensureCertainty,
  classifyIntelCategory,
  normalizeCertainty,
  resolveBusChannel,
  makeBusMessage,
  assertAiGovernance,
  detectForbiddenAiAction,
  isPurgeProtected,
  createEmptyExperience,
  normalizeExperience,
  buildExperienceMarkdown,
  parseExperienceMarkdown,
  normalizeEntity,
  buildEntityMarkdown,
  parseEntityMarkdown,
  isRetiredAiNode,
  isRetiredEntity,
  GLYPH_DICTIONARY_DIR,
} from "./data.js";
import { computeFocusHealth } from "./health.js";

/** In-memory bus activity (BRAIN bus log) — append-only, capped */
const BUS_ACTIVITY_CAP = 120;
/** @type {array} */
let busActivityLog = [];
/** Memory fallback when vault not linked */
let scrollListMemoryNodes = [];

const IDB_NAME = "grimoire-intel-v1";
const IDB_STORE = "handles";
/** @deprecated global key — kept for backward compat only */
const IDB_KEY = "intelligence-dir";
/** @deprecated global LS — do not gate per-focus onboarding on this */
const LS_SETUP = "grimoire-intel-folder-ready";
const LS_NAME = "grimoire-intel-folder-name";
const INTEL_DIR_NAME = "GRIMOIRE-FocusIntelligence";

/** Vault-relative path for Cell2 Core intelligence log */
export const CELL2_INTEL_PATH = `${CELL2_CORE_ID}/intelligence.md`;
/** @deprecated alias — use CELL2_INTEL_PATH */
export const CELL2_INTEL_FILE = CELL2_INTEL_PATH;

/** Global AI-node index at vault root */
export const SCROLL_LIST_FILE = "SCROLL-LIST.md";
/** Experience intelligence index at vault root */
export const EXPERIENCES_INDEX_FILE = "EXPERIENCES-INDEX.md";
/** Experience vault folder */
export const EXPERIENCES_DIR = "experiences";

/** Legacy Cell2 kind map (compat for old callers) → category */
export const CELL2_KINDS = Object.freeze({
  NEURAL_EVENT: "node_intel",
  DOCTRINE: "doctrine",
  REGRESSION: "doctrine",
  node_intel: "node_intel",
  doctrine: "doctrine",
  identity: "identity",
  reality: "reality",
  grievance: "grievance",
  preference: "preference",
  relationship: "relationship",
});

/** @type {FileSystemDirectoryHandle|null} legacy global handle */
let dirHandle = null;
/** @type {Map<string, FileSystemDirectoryHandle>} per-focus handles (session cache) */
const focusDirHandles = new Map();

export function focusIntelIdbKey(focusId) {
  return `intelligence-dir-${String(focusId || "").trim()}`;
}
export function focusIntelLsReadyKey(focusId) {
  return `grimoire-intel-folder-ready-${String(focusId || "").trim()}`;
}
export function focusIntelLsNameKey(focusId) {
  return `grimoire-intel-folder-name-${String(focusId || "").trim()}`;
}

/** Sanitize focus name for a folder: "Test A" → "Test-A-FocusIntelligence" */
export function focusVaultFolderName(focusName) {
  const clean =
    String(focusName || "Focus")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "Focus";
  if (/-FocusIntelligence$/i.test(clean)) return clean;
  return `${clean}-FocusIntelligence`;
}

/** True if this specific focus has its own vault folder linked */
export function isFocusVaultLinked(focusId) {
  const id = String(focusId || "").trim();
  if (!id) return false;
  try {
    if (localStorage.getItem(focusIntelLsReadyKey(id)) === "1") return true;
  } catch {
    /* ignore */
  }
  return focusDirHandles.has(id);
}

/**
 * Resolve per-focus vault directory handle (IndexedDB + permission).
 */
export async function resolveFocusFolderHandle(focusId) {
  const id = String(focusId || "").trim();
  if (!id) return null;
  if (focusDirHandles.has(id)) {
    const h = focusDirHandles.get(id);
    const ok = await ensurePermission(h);
    if (ok) return h;
    focusDirHandles.delete(id);
  }
  try {
    const stored = await idbGet(focusIntelIdbKey(id));
    if (!stored) return null;
    const ok = await ensurePermission(stored);
    if (!ok) return null;
    focusDirHandles.set(id, stored);
    try {
      localStorage.setItem(focusIntelLsReadyKey(id), "1");
    } catch {
      /* ignore */
    }
    return stored;
  } catch {
    return null;
  }
}

/**
 * Persist a per-focus vault handle (user-gesture path only).
 */
export async function setFocusFolderHandle(focusId, handle, folderName = "") {
  const id = String(focusId || "").trim();
  if (!id || !handle) return false;
  focusDirHandles.set(id, handle);
  try {
    await idbSet(focusIntelIdbKey(id), handle);
    localStorage.setItem(focusIntelLsReadyKey(id), "1");
    if (folderName) {
      localStorage.setItem(focusIntelLsNameKey(id), folderName);
    } else if (handle.name) {
      localStorage.setItem(focusIntelLsNameKey(id), handle.name);
    }
  } catch (err) {
    // Still usable this session via memory cache
    console.warn("setFocusFolderHandle persist", err);
  }
  return true;
}

/**
 * Open OS folder picker (user gesture required).
 * Tries several option sets — some Chromium builds reject startIn/id combos.
 */
export async function pickDirectoryHandle() {
  if (!hasDirectoryPicker()) {
    throw new Error("File System Access API not available — use Chrome or Edge on localhost/https");
  }
  const attempts = [
    { mode: "readwrite" },
    { mode: "readwrite", startIn: "documents" },
    { mode: "readwrite", startIn: "desktop" },
    {},
  ];
  let lastErr = null;
  for (const opts of attempts) {
    try {
      const handle = await window.showDirectoryPicker(opts);
      if (handle) {
        // Best-effort write permission (picker already asked in mode:readwrite)
        try {
          if (handle.requestPermission) {
            await handle.requestPermission({ mode: "readwrite" });
          }
        } catch {
          /* ignore */
        }
        return handle;
      }
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      lastErr = err;
      console.warn("showDirectoryPicker attempt failed", opts, err);
    }
  }
  const msg = lastErr?.message || String(lastErr || "Folder picker failed");
  const e = new Error(msg);
  e.name = lastErr?.name || "FolderPickerError";
  e.cause = lastErr;
  throw e;
}

/**
 * Ensure a writable vault dir under parent (create subfolder when possible).
 * Falls back to the selected folder itself — never fails just because create failed.
 */
async function resolveWritableVaultDir(parent, preferredName) {
  if (!parent) throw new Error("No folder selected");
  const name = String(preferredName || INTEL_DIR_NAME).trim() || INTEL_DIR_NAME;

  // User already picked a vault-looking folder — use it as-is
  if (
    parent.name === name ||
    /-FocusIntelligence$/i.test(parent.name) ||
    parent.name === INTEL_DIR_NAME
  ) {
    return parent;
  }

  // Prefer a dedicated subfolder for this focus / vault
  try {
    const sub = await parent.getDirectoryHandle(name, { create: true });
    if (sub) return sub;
  } catch (err) {
    console.warn("create subfolder failed — using selected folder", name, err);
  }

  // Absolute fallback: write intelligence into the folder the user picked
  return parent;
}

/** Probe write so we know the handle is usable */
async function probeVaultWritable(handle) {
  if (!handle) return false;
  try {
    const fh = await handle.getFileHandle(".grimoire-vault", { create: true });
    const w = await fh.createWritable();
    await w.write(`grimoire-vault-ok ${new Date().toISOString()}\n`);
    await w.close();
    return true;
  } catch (err) {
    console.warn("vault write probe failed", err);
    return false;
  }
}

/**
 * User gesture: pick folder → create <FocusName>-FocusIntelligence/ when possible → store.
 * Always stores a handle if the user selected a folder (even if seed writes fail).
 */
export async function chooseFocusIntelligenceFolder(focus) {
  if (!hasDirectoryPicker()) {
    throw new Error("File System Access API not available — use Chrome or Edge");
  }
  if (!focus?.id) {
    throw new Error("Focus id required for per-focus vault");
  }
  const folderName = focusVaultFolderName(focus.name || focus.id);
  const parent = await pickDirectoryHandle();
  const handle = await resolveWritableVaultDir(parent, folderName);

  // Persist FIRST so unlock works even if later seed writes fail
  await setFocusFolderHandle(focus.id, handle, handle.name || folderName);

  const writable = await probeVaultWritable(handle);
  if (!writable) {
    // Still linked — may work after user re-grants permission next write
    console.warn("Vault linked but probe write failed; folder may be read-only");
  }

  try {
    await writeReadme(handle);
  } catch (err) {
    console.warn("README write failed", err);
  }
  try {
    await appendEntityIntelligence(focus, {
      body: `Vault path linked for **${focus.name}** · folder \`${handle.name || folderName}\``,
      source: "Cell2",
      category: "identity",
      certainty: "confirmed",
      tags: ["vault-link", "path"],
    });
  } catch (err) {
    console.warn("seed focus vault write", err);
  }
  return handle;
}

// ─── IndexedDB handle persistence (Chromium) ───

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export function hasDirectoryPicker() {
  return (
    typeof window !== "undefined" &&
    typeof window.showDirectoryPicker === "function"
  );
}

export function getCachedDirHandle() {
  return dirHandle;
}

/**
 * Legacy global picker (📁 header) — creates GRIMOIRE-FocusIntelligence/ when possible.
 * Prefer chooseFocusIntelligenceFolder(focus) for per-focus paths.
 */
export async function chooseIntelligenceFolder() {
  if (!hasDirectoryPicker()) {
    throw new Error("File System Access API not available — use Chrome or Edge");
  }

  const parent = await pickDirectoryHandle();
  const handle = await resolveWritableVaultDir(parent, INTEL_DIR_NAME);

  dirHandle = handle;
  try {
    await idbSet(IDB_KEY, handle);
    localStorage.setItem(LS_SETUP, "1");
    localStorage.setItem(LS_NAME, handle.name || INTEL_DIR_NAME);
  } catch (err) {
    console.warn("global vault idb persist", err);
  }
  try {
    await probeVaultWritable(handle);
  } catch {
    /* ignore */
  }
  try {
    await writeReadme(handle);
  } catch (err) {
    console.warn("README write failed", err);
  }
  return handle;
}

/**
 * Restore vault handle(s). Never opens showDirectoryPicker.
 * @param {{ forcePrompt?: boolean, focusId?: string }} [opts]
 *   focusId — prefer per-focus handle; forcePrompt only from explicit click
 */
export async function ensureIntelligenceFolder({
  forcePrompt = false,
  focusId = null,
} = {}) {
  if (!hasDirectoryPicker()) return null;

  // Per-focus path first
  if (focusId) {
    const per = await resolveFocusFolderHandle(focusId);
    if (per && !forcePrompt) {
      try {
        await writeReadme(per);
      } catch {
        /* ignore */
      }
      return per;
    }
    if (forcePrompt) {
      // Caller should use chooseFocusIntelligenceFolder(focus) with full focus object
      // Fall through only if they forced without focus object
    } else if (per) {
      return per;
    }
  }

  const restored = await restoreIntelligenceFolder();
  if (restored && !forcePrompt) {
    try {
      await writeReadme(restored);
    } catch {
      /* ignore */
    }
    return restored;
  }

  // Boot / silent: never open OS picker
  if (!forcePrompt) {
    return restored || (focusId ? await resolveFocusFolderHandle(focusId) : null);
  }

  try {
    return await chooseIntelligenceFolder();
  } catch (err) {
    if (err?.name === "AbortError") {
      if (!localStorage.getItem(LS_SETUP)) {
        localStorage.setItem(LS_SETUP, "skipped");
      }
      return null;
    }
    if (
      err?.name === "SecurityError" ||
      /user gesture/i.test(String(err?.message || err))
    ) {
      console.warn("Directory picker blocked (needs user gesture)", err);
      return null;
    }
    throw err;
  }
}

/** Legacy: any global vault OR at least one per-focus vault */
export function isIntelligenceSetupComplete() {
  if (localStorage.getItem(LS_SETUP) === "1" || Boolean(dirHandle)) return true;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("grimoire-intel-folder-ready-") && localStorage.getItem(k) === "1") {
        return true;
      }
    }
  } catch {
    /* ignore */
  }
  return focusDirHandles.size > 0;
}

export function wasIntelligenceSetupSkipped() {
  return localStorage.getItem(LS_SETUP) === "skipped";
}

const README_BODY = `# GRIMOIRE — Focus Intelligence (Cell2 Substrate)

Local-first vault. **Cell2 Core** is the internal AI intelligence engine (system-level, not a user Focus).

## Structure

\`\`\`
GRIMOIRE-FocusIntelligence/
  README.md
  SCROLL-LIST.md                 ← index of messageable AI nodes (where to read)
  <entity-id>/
    intelligence.md              ← append-only noodle (YAML frontmatter entries)
    images/                      ← permanent image store for this entity
\`\`\`

## Entry format (\`intelligence.md\`)

\`\`\`
---
timestamp: ISO8601
source: Cell2 | <nodename> | user | reality
certainty: confirmed | inferred | unknown | contradicted
category: doctrine | identity | node_intel | reality | grievance | preference | relationship
tags: [comma, separated]
---
Markdown body
\`\`\`

## Rules

1. **Self-initializing** — pick a parent folder once; Grimoire creates this vault.
2. **Append-only** — never truncate \`intelligence.md\` noodles.
3. **SCROLL-LIST first** — other AIs read \`SCROLL-LIST.md\` to find intel paths.
4. **Cell2 Core** — system substrate at \`cell2-core/intelligence.md\` (BRAIN UI).
5. **Survives the app** — if the UI dies, knowledge stays on disk.

_Written by Grimoire · Cell2 · local-first_
`;

const INTERFACE_DIR_NAME = "Interfaces";

const KNOWN_BACKENDS = {
  Hermes: {
    name: "Hermes",
    quirks: "Fable 5 primary, MoA off, sovereign sessions, session continuity via paste",
    format: "modular directives, numbered moves, clear success criteria, precision over poetry",
    avoids: "do not invent APIs; respect tool boundaries",
  },
  Grok: {
    name: "Grok",
    quirks: "Public research mode, build tasks via Grok Build, free fallback available",
    format: "direct challenge, signal over noise, sharp operational ask, wit after mission",
    avoids: "no ambiguity; demand specific claims",
  },
  Discord: {
    name: "Discord",
    quirks: "2000 char limit per message, markdown bold/italic only, no headers, bot ping discipline",
    format: "short blocks, no markdown headers, plain text emphasis, respect 2000 char ceiling",
    avoids: "long doctrine dumps, header hierarchies, @everyone pings",
  },
  LinkedIn: {
    name: "LinkedIn",
    quirks: "Anti-spam blocks external links, DM workflow for inbound leads, 3000 char post limit",
    format: "professional tone, no external URLs in posts, DM-first for leads, concise",
    avoids: "link spam, casual slang, long threads",
  },
  Email: {
    name: "Email",
    quirks: "Subject line discipline, threading preservation, signature block",
    format: "clear subject, threaded replies, signature discipline, short paragraphs",
    avoids: "missing subject, broken threads, no signature",
  },
};

async function writeReadme(handle) {
  if (!handle) return;
  try {
    const fh = await handle.getFileHandle("README.md", { create: true });
    const w = await fh.createWritable();
    await w.write(README_BODY);
    await w.close();
  } catch (err) {
    console.warn("README write failed", err);
  }
}

export async function restoreIntelligenceFolder() {
  if (dirHandle) {
    const ok = await ensurePermission(dirHandle);
    return ok ? dirHandle : null;
  }
  try {
    const stored = await idbGet(IDB_KEY);
    if (!stored) return null;
    const ok = await ensurePermission(stored);
    if (!ok) return null;
    dirHandle = stored;
    localStorage.setItem(LS_SETUP, "1");
    return dirHandle;
  } catch {
    return null;
  }
}

async function ensurePermission(handle) {
  if (!handle) return false;
  try {
    const q = await handle.queryPermission({ mode: "readwrite" });
    if (q === "granted") return true;
    const r = await handle.requestPermission({ mode: "readwrite" });
    return r === "granted";
  } catch {
    return false;
  }
}

export async function clearIntelligenceFolder() {
  dirHandle = null;
  try {
    await idbSet(IDB_KEY, null);
    localStorage.removeItem(LS_SETUP);
    localStorage.removeItem(LS_NAME);
  } catch {
    /* ignore */
  }
}

function sanitizeFilePart(s) {
  return (
    String(s || "focus")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "focus"
  );
}

/** Sanitize entity-id for vault folder names */
export function sanitizeEntityId(idOrName) {
  return (
    String(idOrName || "entity")
      .toLowerCase()
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "entity"
  );
}

/** Entity folder id for a focus (Cell2 → cell2-core) */
export function entityIdFromFocus(focus) {
  if (!focus) return "unknown";
  if (isCell2CoreFocus(focus)) return CELL2_CORE_ID;
  if (focus.id) return sanitizeEntityId(focus.id);
  return sanitizeEntityId(
    `${focus.name || "focus"}-${getSealedChannel(focus) || "open"}`
  );
}

/** Relative path for entity intelligence file */
export function entityIntelPath(entityId) {
  return `${sanitizeEntityId(entityId)}/intelligence.md`;
}

/** Legacy flat filename still used for optional snapshot sidecars */
export function focusFileName(focus) {
  if (isCell2CoreFocus(focus)) return CELL2_INTEL_PATH;
  return entityIntelPath(entityIdFromFocus(focus));
}

/** @deprecated use classifyIntelCategory — maps to category string */
export function classifyCell2Kind(text) {
  const cat = classifyIntelCategory(text);
  if (cat === "doctrine") return "DOCTRINE";
  return "NEURAL_EVENT";
}

/**
 * Format one append-only intelligence entry with YAML frontmatter.
 */
export function formatIntelligenceEntry({
  timestamp,
  source,
  certainty,
  category,
  tags,
  body,
} = {}) {
  const ts =
    timestamp ||
    (() => {
      try {
        return new Date().toISOString();
      } catch {
        return String(Date.now());
      }
    })();
  const src = String(source || "Cell2").trim() || "Cell2";
  const cert = normalizeCertainty(certainty);
  let cat = String(category || "node_intel").toLowerCase().trim();
  if (!INTEL_CATEGORIES.includes(cat)) cat = classifyIntelCategory(body);
  if (!INTEL_CATEGORIES.includes(cat)) cat = "node_intel";
  const tagList = Array.isArray(tags)
    ? tags.map((t) => String(t || "").trim()).filter(Boolean)
    : String(tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
  const tagStr = tagList.length ? tagList.join(", ") : "";
  const md = String(body || "").trim() || "_empty_";
  return [
    `---`,
    `timestamp: ${ts}`,
    `source: ${src}`,
    `certainty: ${cert}`,
    `category: ${cat}`,
    `tags: [${tagStr}]`,
    `---`,
    md,
    ``,
  ].join("\n");
}

/** @deprecated use formatIntelligenceEntry */
export function formatCell2Entry(kind, content, meta = {}) {
  const category =
    CELL2_KINDS[kind] ||
    classifyIntelCategory(content) ||
    "node_intel";
  return formatIntelligenceEntry({
    timestamp: meta.ts
      ? new Date(meta.ts).toISOString()
      : new Date().toISOString(),
    source: meta.source || "Cell2",
    certainty: meta.certainty || "unknown",
    category,
    tags: meta.tags || [String(kind || category).toLowerCase()],
    body: content,
  });
}

function entityIntelHeader(focusOrId) {
  const id =
    typeof focusOrId === "string"
      ? sanitizeEntityId(focusOrId)
      : entityIdFromFocus(focusOrId);
  const name =
    typeof focusOrId === "object" && focusOrId
      ? focusOrId.name || id
      : id === CELL2_CORE_ID
        ? CELL2_CORE_NAME
        : id;
  const ch =
    typeof focusOrId === "object" && focusOrId
      ? getSealedChannel(focusOrId)
      : "—";
  const typ =
    typeof focusOrId === "object" && focusOrId
      ? getFocusType(focusOrId)
      : "entity";
  return [
    `# ${name} — Intelligence Noodle`,
    ``,
    `**Entity id:** \`${id}\``,
    `**Type:** ${typ}`,
    `**Channel:** ${ch}`,
    `**Mode:** append-only · Cell2 substrate`,
    ``,
    `_Entries use YAML frontmatter (timestamp · source · certainty · category · tags). Never truncate._`,
    ``,
  ].join("\n");
}

/**
 * Seed doctrine bootstrap entries for Cell2 Core.
 */
export function seedCell2DoctrineEntries() {
  const now = Date.now();
  return [
    {
      ts: now,
      category: "doctrine",
      certainty: "confirmed",
      source: "Cell2",
      tags: ["doctrine", "type-only", "bootstrap"],
      content:
        "Type-only model. Archetype fields purged forever. Identity = Focus name + type + optional model. Never reintroduce archetype dropdowns or `convo.archetype`.",
    },
    {
      ts: now + 1,
      category: "doctrine",
      certainty: "confirmed",
      source: "Cell2",
      tags: ["doctrine", "lane", "bootstrap"],
      content:
        "Lane boundaries: 1 Focus = 1 sealed channel = one world. Spells densen back to the open Focus nucleus. No cross-channel multiplexing.",
    },
    {
      ts: now + 2,
      category: "doctrine",
      certainty: "confirmed",
      source: "Cell2",
      tags: ["doctrine", "build", "bootstrap"],
      content:
        "Build protocol: verify with node --check, reload localhost, prove the path, then commit and push. No silent half-fixes.",
    },
    {
      ts: now + 3,
      category: "doctrine",
      certainty: "confirmed",
      source: "Cell2",
      tags: ["doctrine", "regression", "bootstrap"],
      content:
        "Anti-regression: do not reintroduce bare `try {` without catch/finally; no string-literal LHS assignments; no null.value / nullLabel purge stubs; no visible Cell2 Focus in the sidebar.",
    },
  ];
}

// ── Glyphs — teachable units of actionable intelligence ──
const GLYPH_DIR = "grimoire-local";
const GLYPH_SUB = "glyphs";

// ── Roadmaps — structured build plans (append-only iterations) ──
const ROADMAP_SUB = "roadmaps";
/** @type {Map<string, string>} slug → last written markdown (memory fallback) */
const roadmapMemory = new Map();

export function slugifyGlyph(text) {
  return (
    String(text || "glyph")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "glyph"
  );
}

export function synthesizeGlyphTitle(body) {
  const t = String(body || "").trim();
  if (!t) return "Untitled glyph";
  // "Glyph: foo" or first line
  const m = t.match(/^glyph\s*[:\-—]\s*(.+)$/im);
  const line = (m ? m[1] : t.split(/\n/)[0] || t).trim();
  return line.slice(0, 80) || "Untitled glyph";
}

function formatGlyphMarkdown(glyph) {
  const tags = Array.isArray(glyph.tags) ? glyph.tags.join(", ") : String(glyph.tags || "");
  return [
    `---`,
    `id: ${glyph.id}`,
    `title: ${String(glyph.title || "").replace(/\n/g, " ")}`,
    `spellId: ${glyph.spellId || ""}`,
    `target: ${glyph.target || ""}`,
    `scope: ${glyph.scope || "spell"}`,
    `focusId: ${glyph.focusId || ""}`,
    `createdAt: ${glyph.createdAt || new Date().toISOString()}`,
    `tags: [${tags}]`,
    `---`,
    ``,
    String(glyph.body || "").trim(),
    ``,
  ].join("\n");
}

/**
 * Ensure grimoire-local/glyphs/ under the focus vault root.
 */
async function ensureGlyphsDirectory(focusId) {
  const root = await getVaultRoot(focusId);
  if (!root) return null;
  try {
    const local = await root.getDirectoryHandle(GLYPH_DIR, { create: true });
    const glyphs = await local.getDirectoryHandle(GLYPH_SUB, { create: true });
    return glyphs;
  } catch (err) {
    console.warn("ensureGlyphsDirectory", err);
    return null;
  }
}

/**
 * Write a glyph for a spell into the focus vault + memory.
 * Path: grimoire-local/glyphs/<spellId>-<slug>.md
 */
export async function writeSpellGlyph(focus, spell, { body, title, scope = "spell", tags = [] } = {}) {
  const text = String(body || "").replace(/^glyph\s*[:\-—]\s*/i, "").trim();
  if (!text) return { ok: false, reason: "empty" };
  const focusId = focus?.id || spell?.conversationId || null;
  const spellId = spell?.id || "global";
  const glyphTitle = String(title || synthesizeGlyphTitle(text)).trim().slice(0, 80);
  const slug = slugifyGlyph(glyphTitle);
  const id = `glyph-${Date.now().toString(36)}-${slug.slice(0, 12)}`;
  const fileName = `${String(spellId).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40)}-${slug}.md`;
  const relPath = `${GLYPH_DIR}/${GLYPH_SUB}/${fileName}`;
  const glyph = {
    id,
    title: glyphTitle,
    body: text,
    spellId,
    target: spell?.target || focus?.name || "",
    scope: scope || "spell",
    focusId: focusId || "",
    createdAt: new Date().toISOString(),
    tags: Array.isArray(tags) && tags.length ? tags : ["glyph", spell?.kind || "spell"].filter(Boolean),
    path: relPath,
    fileName,
  };

  // Memory on spell + focus
  if (spell) {
    if (!Array.isArray(spell.glyphs)) spell.glyphs = [];
    spell.glyphs.push({
      id: glyph.id,
      title: glyph.title,
      body: glyph.body,
      path: glyph.path,
      createdAt: glyph.createdAt,
      scope: glyph.scope,
    });
  }
  if (focus) {
    if (!Array.isArray(focus.glyphs)) focus.glyphs = [];
    focus.glyphs.push({
      id: glyph.id,
      title: glyph.title,
      body: glyph.body,
      path: glyph.path,
      spellId: glyph.spellId,
      target: glyph.target,
      createdAt: glyph.createdAt,
    });
  }

  // Disk
  let method = "memory";
  try {
    const dir = await ensureGlyphsDirectory(focusId);
    if (dir) {
      const fh = await dir.getFileHandle(fileName, { create: true });
      const w = await fh.createWritable();
      await w.write(formatGlyphMarkdown(glyph));
      await w.close();
      method = "filesystem";
    }
  } catch (err) {
    console.warn("writeSpellGlyph disk", err);
  }

  // Also densen into entity intelligence noodle
  try {
    if (focus) {
      await appendEntityIntelligence(focus, {
        body: `**Glyph forged:** ${glyph.title}\n\n${glyph.body}\n\n_Linked spell: ${spell?.title || spell?.purpose || spellId}_`,
        source: "user",
        category: "doctrine",
        certainty: "confirmed",
        tags: ["glyph", "teach", glyph.scope],
      });
    }
  } catch (err) {
    console.warn("writeSpellGlyph intel", err);
  }

  return { ok: true, glyph, method, path: relPath };
}

/**
 * Ensure grimoire-local/roadmaps/ under vault root (global or per-focus).
 * Path: GRIMOIRE-FocusIntelligence/grimoire-local/roadmaps/[slug].md
 */
async function ensureRoadmapsDirectory(focusId = null) {
  const root = await getVaultRoot(focusId);
  if (!root) return null;
  try {
    const local = await root.getDirectoryHandle(GLYPH_DIR, { create: true });
    const roadmaps = await local.getDirectoryHandle(ROADMAP_SUB, { create: true });
    return roadmaps;
  } catch (err) {
    console.warn("ensureRoadmapsDirectory", err);
    return null;
  }
}

export function roadmapRelativePath(slug) {
  const s = String(slug || "roadmap")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "roadmap";
  return `${GLYPH_DIR}/${ROADMAP_SUB}/${s}.md`;
}

/**
 * Persist a roadmap markdown file.
 * Full structured body is rewritten from complete in-memory roadmap (safe).
 * Iteration history lives inside that body and is never dropped.
 * When opts.appendOnlyBlock is set, also append a raw block if file already exists
 * and content would otherwise risk losing external hand-edits.
 */
export async function writeRoadmapFile(roadmap, markdown, opts = {}) {
  const slug = String(roadmap?.slug || opts.slug || "roadmap").trim();
  if (!slug) return { ok: false, reason: "no-slug" };
  const content = String(markdown || "").trimEnd() + "\n";
  const fileName = `${slug.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 64)}.md`;
  const relPath = roadmapRelativePath(slug);
  const focusId = opts.focusId || null;

  // Memory always
  roadmapMemory.set(slug, content);

  let method = "memory";
  try {
    const dir = await ensureRoadmapsDirectory(focusId);
    if (dir) {
      const fh = await dir.getFileHandle(fileName, { create: true });
      let existing = "";
      try {
        const file = await fh.getFile();
        existing = await file.text();
      } catch {
        existing = "";
      }
      // Skip identical writes
      if (existing === content) {
        return { ok: true, method: "filesystem", path: relPath, skipped: true };
      }
      // Preserve any operator hand-notes after our marker if they diverge
      let toWrite = content;
      if (
        existing &&
        opts.preserveTail !== false &&
        existing.includes("## Operator notes (hand)")
      ) {
        const tail = existing.split("## Operator notes (hand)")[1] || "";
        if (tail && !content.includes("## Operator notes (hand)")) {
          toWrite =
            content.replace(/\s*$/, "") +
            "\n\n## Operator notes (hand)" +
            tail;
        }
      }
      const w = await fh.createWritable();
      await w.write(toWrite);
      await w.close();
      method = "filesystem";
      roadmapMemory.set(slug, toWrite);
      return { ok: true, method, path: relPath, fileName };
    }
  } catch (err) {
    console.warn("writeRoadmapFile disk", err);
  }

  // Download fallback only when explicitly allowed and no FS
  if (opts.allowDownload === true && !hasDirectoryPicker()) {
    try {
      downloadMarkdown(fileName, content);
      return { ok: true, method: "download", path: relPath, fileName };
    } catch (err) {
      console.warn("writeRoadmapFile download", err);
    }
  }

  return { ok: true, method, path: relPath, fileName };
}

/**
 * Append a single iteration block to an existing roadmap file without
 * rebuilding the whole document (true append for expand ops).
 */
export async function appendRoadmapIteration(slug, block, opts = {}) {
  const s = String(slug || "").trim();
  if (!s) return { ok: false, reason: "no-slug" };
  const chunk = String(block || "").trim();
  if (!chunk) return { ok: false, reason: "empty" };
  const fileName = `${s.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 64)}.md`;
  const relPath = roadmapRelativePath(s);
  const focusId = opts.focusId || null;
  const appendBlock = `\n### [${new Date().toISOString()}] ${chunk}\n`;

  const prevMem = roadmapMemory.get(s) || "";
  roadmapMemory.set(s, (prevMem || "").replace(/\s*$/, "") + appendBlock);

  try {
    const dir = await ensureRoadmapsDirectory(focusId);
    if (dir) {
      const fh = await dir.getFileHandle(fileName, { create: true });
      let existing = "";
      try {
        const file = await fh.getFile();
        existing = await file.text();
      } catch {
        existing = "";
      }
      if (!existing.trim()) {
        existing =
          `# Roadmap: ${s}\n\n## Iterations (append-only)\n\n_Seeded by append._\n`;
      }
      const next = existing.replace(/\s*$/, "") + appendBlock;
      const w = await fh.createWritable();
      await w.write(next);
      await w.close();
      roadmapMemory.set(s, next);
      return { ok: true, method: "filesystem", path: relPath };
    }
  } catch (err) {
    console.warn("appendRoadmapIteration", err);
  }
  return { ok: true, method: "memory", path: relPath };
}

/** Read roadmap markdown from disk or memory */
export async function readRoadmapFile(slug, opts = {}) {
  const s = String(slug || "").trim();
  if (!s) return { ok: false, content: null };
  const fileName = `${s.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 64)}.md`;
  const relPath = roadmapRelativePath(s);
  const focusId = opts.focusId || null;
  try {
    const dir = await ensureRoadmapsDirectory(focusId);
    if (dir) {
      try {
        const fh = await dir.getFileHandle(fileName, { create: false });
        const file = await fh.getFile();
        const content = await file.text();
        roadmapMemory.set(s, content);
        return { ok: true, method: "filesystem", path: relPath, content };
      } catch {
        /* missing on disk */
      }
    }
  } catch (err) {
    console.warn("readRoadmapFile", err);
  }
  if (roadmapMemory.has(s)) {
    return {
      ok: true,
      method: "memory",
      path: relPath,
      content: roadmapMemory.get(s),
    };
  }
  return { ok: false, method: "none", path: relPath, content: null };
}

/** List roadmap files from vault (names only) + memory keys */
export async function listRoadmapFiles(opts = {}) {
  const names = new Set();
  for (const k of roadmapMemory.keys()) names.add(k);
  const focusId = opts.focusId || null;
  try {
    const dir = await ensureRoadmapsDirectory(focusId);
    if (dir) {
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === "file" && /\.md$/i.test(name)) {
          names.add(name.replace(/\.md$/i, ""));
        }
      }
    }
  } catch (err) {
    console.warn("listRoadmapFiles", err);
  }
  return [...names].sort();
}

/**
 * Executable vault_entry check for roadmap verification.
 * path examples:
 *   grimoire-local/roadmaps
 *   grimoire-local/roadmaps/my-slug.md
 *   grimoire-local/roadmaps/*.md
 */
export async function checkVaultEntry(vaultPath, opts = {}) {
  const raw = String(vaultPath || opts.path || "").trim().replace(/^\/+/, "");
  if (!raw) {
    return {
      result: "blocked",
      evidence: "vault_entry: no path specified",
    };
  }
  const focusId = opts.focusId || null;

  // Memory short-circuit for roadmap files
  const roadmapsPrefix = `${GLYPH_DIR}/${ROADMAP_SUB}`;
  if (
    raw === roadmapsPrefix ||
    raw === `${roadmapsPrefix}/` ||
    raw === "grimoire-local/roadmaps"
  ) {
    try {
      const dir = await ensureRoadmapsDirectory(focusId);
      if (dir) {
        return {
          result: "pass",
          evidence: "vault: grimoire-local/roadmaps/ present (filesystem)",
        };
      }
    } catch {
      /* fall through */
    }
    if (roadmapMemory.size > 0) {
      return {
        result: "pass",
        evidence: `vault: roadmaps in memory (${roadmapMemory.size}) — disk dir not linked`,
      };
    }
    return {
      result: "blocked",
      evidence: "vault: roadmaps directory not available (link vault or create a roadmap first)",
    };
  }

  // Specific roadmap markdown
  const mdMatch = raw.match(
    /(?:grimoire-local\/)?roadmaps\/([^/]+?)(?:\.md)?$/i
  );
  if (mdMatch || /\.md$/i.test(raw)) {
    const slug = (mdMatch ? mdMatch[1] : raw.replace(/\.md$/i, ""))
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .slice(0, 64);
    const read = await readRoadmapFile(slug, { focusId });
    if (read.ok && read.content) {
      return {
        result: "pass",
        evidence: `vault: ${read.path || slug} via ${read.method} (${read.content.length} bytes)`,
      };
    }
    if (roadmapMemory.has(slug)) {
      return {
        result: "pass",
        evidence: `vault: ${slug}.md in memory fallback`,
      };
    }
    return {
      result: "fail",
      evidence: `vault: missing roadmap ${slug}.md (run plan once to persist)`,
    };
  }

  // Wildcard list
  if (/\*$/.test(raw) || raw.endsWith("/*.md")) {
    const listed = await listRoadmapFiles({ focusId });
    if (listed.length) {
      return {
        result: "pass",
        evidence: `vault: ${listed.length} roadmap file(s): ${listed.slice(0, 5).join(", ")}`,
      };
    }
    return {
      result: "fail",
      evidence: "vault: no roadmap files found",
    };
  }

  // Generic path under vault root
  try {
    const root = await getVaultRoot(focusId);
    if (!root) {
      return {
        result: "blocked",
        evidence: `vault: not linked — cannot probe ${raw}`,
      };
    }
    const parts = raw.split("/").filter(Boolean);
    let dir = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast && /\.\w+$/.test(part)) {
        try {
          const fh = await dir.getFileHandle(part, { create: false });
          const file = await fh.getFile();
          return {
            result: "pass",
            evidence: `vault file ${raw} (${file.size} bytes)`,
          };
        } catch {
          return { result: "fail", evidence: `vault missing file ${raw}` };
        }
      }
      try {
        dir = await dir.getDirectoryHandle(part, { create: false });
      } catch {
        return {
          result: "fail",
          evidence: `vault missing directory segment: ${part}`,
        };
      }
    }
    return { result: "pass", evidence: `vault directory ${raw} present` };
  } catch (err) {
    return {
      result: "blocked",
      evidence: `vault probe error: ${err?.message || err}`,
    };
  }
}

/**
 * Persist a verification report next to the roadmap (append-only log file).
 * Path: grimoire-local/roadmaps/[slug].verify.md
 */
export async function writeVerificationReportFile(slug, reportMarkdown, opts = {}) {
  const s = String(slug || "roadmap")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 64);
  const fileName = `${s}.verify.md`;
  const relPath = `${GLYPH_DIR}/${ROADMAP_SUB}/${fileName}`;
  const content = String(reportMarkdown || "").trimEnd() + "\n";
  const focusId = opts.focusId || null;

  // Memory: store under slug+".verify"
  roadmapMemory.set(`${s}.verify`, content);

  try {
    const dir = await ensureRoadmapsDirectory(focusId);
    if (dir) {
      const fh = await dir.getFileHandle(fileName, { create: true });
      let existing = "";
      try {
        existing = await (await fh.getFile()).text();
      } catch {
        existing = "";
      }
      // Append new report under a separator (history), keep last full body first
      const next = existing.trim()
        ? `${content.trimEnd()}\n\n---\n\n## Prior run\n\n${existing.trim()}\n`
        : content;
      const w = await fh.createWritable();
      await w.write(next);
      await w.close();
      roadmapMemory.set(`${s}.verify`, next);
      return { ok: true, method: "filesystem", path: relPath };
    }
  } catch (err) {
    console.warn("writeVerificationReportFile", err);
  }
  return { ok: true, method: "memory", path: relPath };
}

/**
 * Glyphs that apply to a spell (linked on spell + matching target/kind on focus).
 */
export function glyphsForSpell(focus, spell) {
  const out = [];
  const seen = new Set();
  const add = (g) => {
    if (!g || !g.id || seen.has(g.id)) return;
    seen.add(g.id);
    out.push(g);
  };
  for (const g of spell?.glyphs || []) add(g);
  const target = String(spell?.target || "").toLowerCase();
  const kind = String(spell?.kind || "").toLowerCase();
  for (const g of focus?.glyphs || []) {
    if (g.spellId && g.spellId === spell?.id) add(g);
    else if (
      target &&
      String(g.target || "").toLowerCase() === target
    ) {
      add(g);
    } else if (g.scope === "focus" || g.scope === "global") {
      add(g);
    } else if (kind && String(g.tags || []).join(" ").toLowerCase().includes(kind)) {
      add(g);
    }
  }
  return out;
}

/** Merge applicable glyphs into spell content for refine/craft. */
export function mergeGlyphsIntoSpellContent(content, glyphs = []) {
  const base = String(content || "").trim();
  const list = Array.isArray(glyphs) ? glyphs.filter((g) => g && (g.body || g.title)) : [];
  if (!list.length) return base;
  const block = list
    .map((g, i) => `${i + 1}. **${g.title || "Glyph"}** — ${String(g.body || "").trim()}`)
    .join("\n");
  // Avoid double-append if already present
  if (/##\s*Operator glyphs/i.test(base)) {
    return base.replace(
      /##\s*Operator glyphs[\s\S]*$/i,
      `## Operator glyphs (teachings)\n${block}\n`
    );
  }
  return `${base}\n\n## Operator glyphs (teachings)\n${block}\n`;
}

/**
 * Resolve vault root for writes.
 * Prefer per-focus handle when focusId provided; fall back to legacy global.
 */
async function getVaultRoot(focusId = null) {
  if (!hasDirectoryPicker()) return null;
  if (focusId) {
    const per = await resolveFocusFolderHandle(focusId);
    if (per) return per;
  }
  if (dirHandle) return dirHandle;
  return restoreIntelligenceFolder();
}

async function getEntityDirectory(root, entityId, { create = true } = {}) {
  const id = sanitizeEntityId(entityId);
  const ent = await root.getDirectoryHandle(id, { create });
  await ent.getDirectoryHandle("images", { create: true });
  return ent;
}

/** True when handle is a dedicated per-focus vault (<Name>-FocusIntelligence). */
export function isPerFocusVaultRoot(handle) {
  const name = String(handle?.name || "");
  // Global vault is also *FocusIntelligence — keep entity subfolders there
  if (/^GRIMOIRE-FocusIntelligence$/i.test(name)) return false;
  if (name === INTEL_DIR_NAME) return false;
  return /-FocusIntelligence$/i.test(name);
}

/**
 * Resolve intelligence.md write target.
 * Per-focus vault → <FocusName>-FocusIntelligence/intelligence.md (root)
 * Global vault → <entity-id>/intelligence.md
 */
async function openIntelligenceWriteTarget(root, entityId, focus = null) {
  if (!root) return null;
  if (isPerFocusVaultRoot(root)) {
    const fh = await root.getFileHandle("intelligence.md", { create: true });
    return {
      fh,
      relPath: "intelligence.md",
      vaultLabel: root.name || "FocusIntelligence",
    };
  }
  const entDir = await getEntityDirectory(root, entityId, { create: true });
  const fh = await entDir.getFileHandle("intelligence.md", { create: true });
  return {
    fh,
    relPath: entityIntelPath(entityId),
    vaultLabel: root.name || INTEL_DIR_NAME,
  };
}

async function appendTextToFileHandle(fileHandle, block, { headerIfEmpty } = {}) {
  let existing = "";
  try {
    existing = await readExistingFocusText(fileHandle);
  } catch {
    existing = "";
  }
  if (!existing || !String(existing).trim()) {
    existing = headerIfEmpty || "";
  }
  // Append-only: never truncate prior body
  const next = String(existing).replace(/\s*$/, "") + "\n" + block;
  const writable = await fileHandle.createWritable();
  await writable.write(next);
  await writable.close();
  return next;
}

// ── SCROLL auto-curate after vault writes (debounced) ──
/** @type {null | (() => { conversations?: array, spells?: array })} */
let scrollCurateProvider = null;
let scrollCurateTimer = null;

/**
 * App registers live state provider so vault writes can refresh SCROLL-LIST.md
 * without a manual operator action.
 */
export function setScrollListCurateProvider(fn) {
  scrollCurateProvider = typeof fn === "function" ? fn : null;
}

/** Debounced rewrite of vault SCROLL-LIST.md from live focuses. */
export function scheduleScrollListCurate({ immediate = false } = {}) {
  const run = async () => {
    scrollCurateTimer = null;
    if (!scrollCurateProvider) return null;
    try {
      const pack = scrollCurateProvider() || {};
      return await updateScrollListIndex(
        pack.conversations || [],
        pack.spells || []
      );
    } catch (err) {
      console.warn("scheduleScrollListCurate", err);
      return null;
    }
  };
  if (immediate) {
    if (scrollCurateTimer) {
      clearTimeout(scrollCurateTimer);
      scrollCurateTimer = null;
    }
    return run();
  }
  if (scrollCurateTimer) clearTimeout(scrollCurateTimer);
  scrollCurateTimer = setTimeout(() => {
    void run();
  }, 280);
  return null;
}

/**
 * Append-only write to focus intelligence.md
 * - Per-focus vault: <FocusName>-FocusIntelligence/intelligence.md
 * - Global vault: GRIMOIRE-FocusIntelligence/<entity-id>/intelligence.md
 * YAML frontmatter + body. Never overwrites prior entries.
 * Schedules SCROLL-LIST auto-curate after successful disk write.
 */
export async function appendEntityIntelligence(focusOrId, opts = {}) {
  const focus =
    typeof focusOrId === "object" && focusOrId ? focusOrId : null;
  const entityId = focus
    ? entityIdFromFocus(focus)
    : sanitizeEntityId(focusOrId || opts.entityId || "unknown");
  const focusId =
    opts.focusId ||
    focus?.id ||
    (typeof focusOrId === "string" ? focusOrId : null);

  const body = String(opts.body ?? opts.content ?? "").trim();
  if (!body) return { ok: false, method: "empty", entityId };

  const category =
    opts.category ||
    (opts.kind && CELL2_KINDS[opts.kind]) ||
    classifyIntelCategory(body);
  const certainty = normalizeCertainty(
    opts.certainty || focus?.certainty || "unknown"
  );
  const source = String(opts.source || "Cell2").trim() || "Cell2";
  const tags = opts.tags || [category];
  const ts = opts.timestamp || new Date().toISOString();

  const entry = {
    ts: Date.parse(ts) || Date.now(),
    timestamp: ts,
    source,
    certainty,
    category,
    tags: Array.isArray(tags) ? tags : [String(tags)],
    content: body,
  };

  // In-memory mirror on focus (BRAIN + offline)
  if (focus) {
    if (!Array.isArray(focus.intelLog)) focus.intelLog = [];
    focus.intelLog.push(entry);
    ensureCertainty(focus);
    pushFocusEvent(focus, category, body);
    focus.updatedAt = Date.now();
  }

  const block = formatIntelligenceEntry({
    timestamp: ts,
    source,
    certainty,
    category,
    tags: entry.tags,
    body,
  });
  // Prefer this focus's own vault folder
  const root = await getVaultRoot(focusId);
  let relPath = entityIntelPath(entityId);

  if (root) {
    try {
      const target = await openIntelligenceWriteTarget(root, entityId, focus);
      relPath = target?.relPath || relPath;
      await appendTextToFileHandle(target.fh, block, {
        headerIfEmpty: entityIntelHeader(focus || entityId),
      });
      // SCROLL List auto-curates from vault writes (no manual refresh)
      if (opts.refreshScroll !== false) {
        scheduleScrollListCurate({ immediate: false });
      }
      return {
        ok: true,
        method: "filesystem",
        fileName: relPath,
        entityId,
        entry,
        vaultLabel: target?.vaultLabel || root.name || "",
      };
    } catch (err) {
      console.warn("appendEntityIntelligence failed", err);
      return {
        ok: false,
        method: "error",
        fileName: relPath,
        entityId,
        error: String(err),
        entry,
      };
    }
  }

  return {
    ok: true,
    method: "memory",
    fileName: relPath,
    entityId,
    entry,
  };
}

/**
 * Background-friendly auto write-back for cast / bus / grimoire replies.
 * Append-only YAML entry; never blocks the caller when used with void.
 */
export async function autoWriteFocusIntelligence(focusOrId, opts = {}) {
  return appendEntityIntelligence(focusOrId, {
    source: opts.source || "Grimoire",
    category: opts.category || "node_intel",
    certainty: opts.certainty || "inferred",
    tags: opts.tags || ["auto-write"],
    body: opts.body || opts.content || "",
    focusId: opts.focusId,
    refreshScroll: opts.refreshScroll !== false,
    timestamp: opts.timestamp,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// X Recruitment Intake — Magic Knights (Wizard King)
// Path: magic-knights/[handle]/intelligence.md
// Privacy: X handle never public unless knighthood classification === "yes"
// ═══════════════════════════════════════════════════════════════════════════

export const MAGIC_KNIGHTS_DIR = "magic-knights";
export const MAGIC_KNIGHTHOOD = Object.freeze(["yes", "no", "maybe"]);

/** @type {Map<string, object>} handle → latest intake (memory) */
const magicKnightMemory = new Map();

/** Sanitize X handle → filesystem-safe slug (no @) */
export function sanitizeXHandle(raw) {
  let h = String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 40);
  return h || "unknown";
}

/** Public-safe label: real handle only when knighthood is yes */
export function publicMagicKnightLabel(record) {
  if (!record) return "candidate";
  const k = String(record.knighthood || "maybe").toLowerCase();
  if (k === "yes" && record.handle) return `@${sanitizeXHandle(record.handle)}`;
  // Redacted public surface
  const slug = sanitizeXHandle(record.handle || "x");
  const hash = slug
    .split("")
    .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  return `mk-candidate-${Math.abs(hash).toString(36).slice(0, 6)}`;
}

/**
 * SCROLL / Wizard King classifier → yes | no | maybe
 * Uses signal level + assessment notes + first-message heuristics.
 */
export function classifyMagicKnighthood({
  signal = 5,
  notes = "",
  snippet = "",
  handle = "",
} = {}) {
  const sig = Math.max(0, Math.min(10, Number(signal) || 0));
  const corpus = `${notes}\n${snippet}\n${handle}`.toLowerCase();

  let score = sig;
  // Boosts
  if (
    /\b(builder|ship|ships|craft|knight|clover|operator|sovereign|vault|forge|open.?source|contribute)\b/.test(
      corpus
    )
  ) {
    score += 1.5;
  }
  if (/\b(align|doctrine|signal|constellation|grimoire)\b/.test(corpus)) {
    score += 0.75;
  }
  // Red flags
  if (
    /\b(spam|scam|bot|airdrop|crypto.?shill|hostile|harass|doxx?|blackmail)\b/.test(
      corpus
    )
  ) {
    score -= 5.5;
  }
  if (/\b(not interested|unsubscribe|stop dm|leave me alone)\b/.test(corpus)) {
    score -= 2;
  }
  // Explicit override in notes
  if (/\b(knighthood\s*[:=]\s*yes|classify\s*[:=]\s*yes|mk\s*:\s*yes)\b/i.test(notes)) {
    return {
      knighthood: "yes",
      score,
      rationale: "explicit yes in assessment notes",
    };
  }
  if (/\b(knighthood\s*[:=]\s*no|classify\s*[:=]\s*no|mk\s*:\s*no)\b/i.test(notes)) {
    return {
      knighthood: "no",
      score,
      rationale: "explicit no in assessment notes",
    };
  }
  if (
    /\b(knighthood\s*[:=]\s*maybe|classify\s*[:=]\s*maybe|mk\s*:\s*maybe)\b/i.test(
      notes
    )
  ) {
    return {
      knighthood: "maybe",
      score,
      rationale: "explicit maybe in assessment notes",
    };
  }

  let knighthood = "maybe";
  let rationale = `signal ${sig} → baseline maybe`;
  if (score >= 7.5) {
    knighthood = "yes";
    rationale = `score ${score.toFixed(1)} (signal ${sig} + green flags) → yes`;
  } else if (score <= 3.5) {
    knighthood = "no";
    rationale = `score ${score.toFixed(1)} (signal ${sig} / red flags) → no`;
  } else {
    rationale = `score ${score.toFixed(1)} (signal ${sig}) → maybe`;
  }
  return { knighthood, score, rationale };
}

/**
 * Parse slash / natural-language Magic Knight intake.
 * Commands:
 *   /mk @handle signal:7 first: "snippet" notes: ...
 *   /recruit @handle 7 "snippet" assessment...
 * Natural (Wizard King context):
 *   DM @handle: message
 *   DMed @handle on X: message
 *   X DM @handle signal 8 — notes
 * @returns {null | { handle, signal, snippet, notes, raw }}
 */
export function parseMagicKnightIntake(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  // /mk @handle ...  or  /recruit @handle ...
  const slash = raw.match(/^\/(?:mk|recruit|knight)\s+([\s\S]+)$/i);
  if (slash) {
    return parseMagicKnightBody(slash[1].trim(), raw);
  }

  // Natural DM patterns
  const dm =
    raw.match(
      /^(?:dm(?:ed|\'d|ed)?|x\s*dm|messaged|reached out to)\s+@?([A-Za-z0-9_]{1,40})\s*(?:on\s+x)?\s*[:\-—]\s*([\s\S]+)$/i
    ) ||
    raw.match(
      /^@([A-Za-z0-9_]{1,40})\s+(?:dm|x\s*dm)\s*[:\-—]\s*([\s\S]+)$/i
    );
  if (dm) {
    const handle = sanitizeXHandle(dm[1]);
    const rest = String(dm[2] || "").trim();
    const sigM = rest.match(/\bsignal\s*[:=]?\s*(\d{1,2})\b/i);
    const signal = sigM ? Math.min(10, Number(sigM[1])) : 5;
    const snippet = rest
      .replace(/\bsignal\s*[:=]?\s*\d{1,2}\b/i, "")
      .replace(/\bnotes?\s*[:=]\s*/i, "")
      .trim()
      .slice(0, 500);
    return {
      handle,
      signal,
      snippet,
      notes: rest.slice(0, 800),
      raw,
      source: "natural-dm",
    };
  }

  return null;
}

function parseMagicKnightBody(body, raw) {
  // Handle first token
  const hm = body.match(/^@?([A-Za-z0-9_]{1,40})\b/);
  if (!hm) return null;
  const handle = sanitizeXHandle(hm[1]);
  let rest = body.slice(hm[0].length).trim();

  let signal = 5;
  const sigM =
    rest.match(/\bsignal\s*[:=]\s*(\d{1,2})\b/i) ||
    rest.match(/^(\d{1,2})\b/);
  if (sigM) {
    signal = Math.max(0, Math.min(10, Number(sigM[1])));
    rest = rest.replace(sigM[0], "").trim();
  }

  let snippet = "";
  const firstM =
    rest.match(/\b(?:first|snippet|msg|message)\s*[:=]\s*"([^"]+)"/i) ||
    rest.match(/\b(?:first|snippet|msg|message)\s*[:=]\s*'([^']+)'/i) ||
    rest.match(/^"([^"]+)"/) ||
    rest.match(/^'([^']+)'/);
  if (firstM) {
    snippet = firstM[1].trim().slice(0, 500);
    rest = rest.replace(firstM[0], "").trim();
  }

  let notes = "";
  const notesM = rest.match(/\bnotes?\s*[:=]\s*([\s\S]+)$/i);
  if (notesM) {
    notes = notesM[1].trim().slice(0, 1200);
    rest = rest.replace(notesM[0], "").trim();
  }
  if (!snippet && rest) {
    // remainder is snippet + notes
    snippet = rest.slice(0, 500);
    notes = notes || rest.slice(0, 800);
  } else if (rest && !notes) {
    notes = rest.slice(0, 1200);
  }

  return {
    handle,
    signal,
    snippet: snippet || "(no first message captured)",
    notes: notes || "",
    raw,
    source: "slash",
  };
}

/**
 * Build append-only markdown block for magic-knights/[handle]/intelligence.md
 */
export function formatMagicKnightEntry(record) {
  const handle = sanitizeXHandle(record.handle);
  const knighthood = MAGIC_KNIGHTHOOD.includes(record.knighthood)
    ? record.knighthood
    : "maybe";
  const ts = record.timestamp || new Date().toISOString();
  const signal = Math.max(0, Math.min(10, Number(record.signal) || 0));
  const publicLabel = publicMagicKnightLabel(record);
  const expose = knighthood === "yes";

  return [
    `---`,
    `timestamp: ${ts}`,
    `kind: magic-knight-intake`,
    `handle: ${expose ? handle : "[redacted]"}`,
    `handle_public: ${publicLabel}`,
    `signal: ${signal}`,
    `knighthood: ${knighthood}`,
    `source: ${record.source || "wizard-king-x"}`,
    `privacy: ${expose ? "public-handle-ok" : "handle-private"}`,
    `tags: [magic-knight, x-recruit, intake, ${knighthood}]`,
    `---`,
    ``,
    `## X Recruitment Intake`,
    ``,
    `- **Handle:** ${expose ? `@${handle}` : publicLabel + " _(handle sealed until knighthood: yes)_"}`,
    `- **Signal level:** ${signal}/10`,
    `- **SCROLL classification:** **${knighthood}**`,
    record.rationale ? `- **Rationale:** ${record.rationale}` : null,
    ``,
    `### First message snippet`,
    ``,
    String(record.snippet || "").trim() || "_none_",
    ``,
    `### Assessment notes`,
    ``,
    String(record.notes || "").trim() || "_none_",
    ``,
  ]
    .filter((l) => l != null)
    .join("\n");
}

function magicKnightHeader(handle) {
  return [
    `# Magic Knight Candidate — Intake Log`,
    ``,
    `**Vault path:** \`${MAGIC_KNIGHTS_DIR}/${sanitizeXHandle(handle)}/intelligence.md\``,
    `**Mode:** append-only · X recruitment · private until knighthood: yes`,
    ``,
    `> X handles are never exposed publicly without explicit **yes** classification.`,
    ``,
    `---`,
    ``,
  ].join("\n");
}

/**
 * Write Magic Knight intake via the same vault auto-write-back loop.
 * Path: magic-knights/[handle]/intelligence.md (append-only YAML entries)
 */
export async function writeMagicKnightIntake(partial, opts = {}) {
  const handle = sanitizeXHandle(partial?.handle);
  if (!handle || handle === "unknown") {
    return { ok: false, reason: "handle-required" };
  }

  const signal = Math.max(0, Math.min(10, Number(partial.signal) ?? 5));
  const snippet = String(partial.snippet || "").trim().slice(0, 500);
  const notes = String(partial.notes || "").trim().slice(0, 1200);
  const classified = classifyMagicKnighthood({
    signal,
    notes,
    snippet,
    handle,
  });

  const record = {
    handle,
    signal,
    snippet,
    notes,
    knighthood: classified.knighthood,
    rationale: classified.rationale,
    score: classified.score,
    source: partial.source || "wizard-king-x",
    timestamp: new Date().toISOString(),
    publicLabel: null,
  };
  record.publicLabel = publicMagicKnightLabel(record);

  magicKnightMemory.set(handle.toLowerCase(), record);

  const block = formatMagicKnightEntry(record);
  const relPath = `${MAGIC_KNIGHTS_DIR}/${handle}/intelligence.md`;
  const focusId = opts.focusId || null;
  const root = await getVaultRoot(focusId);

  if (root) {
    try {
      const mkRoot = await root.getDirectoryHandle(MAGIC_KNIGHTS_DIR, {
        create: true,
      });
      const hDir = await mkRoot.getDirectoryHandle(handle, { create: true });
      const fh = await hDir.getFileHandle("intelligence.md", { create: true });
      await appendTextToFileHandle(fh, block, {
        headerIfEmpty: magicKnightHeader(handle),
      });
      // SCROLL auto-curate (public-safe knighthood surface)
      if (opts.refreshScroll !== false) {
        scheduleScrollListCurate({ immediate: false });
      }
      return {
        ok: true,
        method: "filesystem",
        path: relPath,
        record,
        knighthood: record.knighthood,
      };
    } catch (err) {
      console.warn("writeMagicKnightIntake disk", err);
      return {
        ok: false,
        method: "error",
        path: relPath,
        record,
        error: String(err),
      };
    }
  }

  return {
    ok: true,
    method: "memory",
    path: relPath,
    record,
    knighthood: record.knighthood,
  };
}

/** Memory snapshot of intakes (for SCROLL public-safe merge) */
export function listMagicKnightIntakes({ publicOnly = false } = {}) {
  const all = [...magicKnightMemory.values()];
  if (!publicOnly) return all;
  return all.filter((r) => r.knighthood === "yes");
}

/**
 * Public-safe SCROLL lines for Magic Knight candidates.
 * Handles only appear when knighthood === yes.
 */
export function renderMagicKnightScrollSection(intakes = null) {
  const list = Array.isArray(intakes)
    ? intakes
    : listMagicKnightIntakes({ publicOnly: false });
  if (!list.length) {
    return [
      `## Magic Knights (X recruitment)`,
      ``,
      `_No intakes yet. Wizard King: \`/mk @handle signal:7 first: "…" notes: …\`_`,
      ``,
    ].join("\n");
  }
  const lines = [
    `## Magic Knights (X recruitment)`,
    ``,
    `_SCROLL classification: **yes** / **no** / **maybe**. Handles public only on **yes**._`,
    ``,
  ];
  // Sort: yes first, then maybe, then no
  const rank = { yes: 0, maybe: 1, no: 2 };
  const sorted = [...list].sort(
    (a, b) =>
      (rank[a.knighthood] ?? 9) - (rank[b.knighthood] ?? 9) ||
      (b.signal || 0) - (a.signal || 0)
  );
  for (const r of sorted) {
    const label = publicMagicKnightLabel(r);
    const path =
      r.knighthood === "yes"
        ? `\`${MAGIC_KNIGHTS_DIR}/${sanitizeXHandle(r.handle)}/intelligence.md\``
        : `\`${MAGIC_KNIGHTS_DIR}/[sealed]/intelligence.md\``;
    lines.push(
      `- **${label}** · knighthood: **${r.knighthood}** · signal ${r.signal}/10 · ${path}`
    );
  }
  lines.push("");
  return lines.join("\n");
}

/** Cell2 Core append — system substrate only */
export async function appendCell2Intelligence(focus, opts = {}) {
  const cell2 = focus && isCell2CoreFocus(focus) ? focus : { id: CELL2_CORE_ID, name: CELL2_CORE_NAME, type: "ai", system: true, hidden: true };
  return appendEntityIntelligence(cell2, {
    ...opts,
    source: opts.source || "Cell2",
    category:
      opts.category ||
      (opts.kind && CELL2_KINDS[opts.kind]) ||
      classifyIntelCategory(opts.body || opts.content || ""),
  });
}

/**
 * Parse intelligence.md (or memory-rendered text) into YAML-frontmatter entries.
 * @returns {{ source: string, body: string, bytes: number, timestamp?: string }[]}
 */
export function parseIntelligenceEntriesFromText(text) {
  const raw = String(text || "");
  if (!raw.trim()) return [];
  const entries = [];
  // Split on frontmatter fences
  const blocks = raw.split(/\n---\s*\n/);
  // Pattern: after a --- header block comes body until next ---
  // Also handle leading --- at start
  const re =
    /(?:^|\n)---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*?)(?=(?:\n---\s*\n)|$)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const fm = m[1] || "";
    const body = (m[2] || "").trim();
    const srcMatch = fm.match(/^\s*source:\s*(.+)\s*$/im);
    const tsMatch = fm.match(/^\s*timestamp:\s*(.+)\s*$/im);
    const source = String(srcMatch?.[1] || "unknown").trim() || "unknown";
    const bytes = body.length || 1;
    entries.push({
      source,
      body,
      bytes,
      timestamp: tsMatch?.[1]?.trim() || "",
    });
  }
  // Fallback: no frontmatter — treat whole file as one unknown blob
  if (!entries.length && raw.trim() && !/^#\s/.test(raw.trim())) {
    entries.push({
      source: "unknown",
      body: raw.trim(),
      bytes: raw.trim().length,
      timestamp: "",
    });
  }
  return entries;
}

/**
 * Count vault entries by source for a focus.
 * Prefers filesystem intelligence.md; merges in-memory intelLog.
 * @returns {Promise<{ sources: Record<string,{count:number,bytes:number}>, totalCount: number, totalBytes: number, method: string }>}
 */
export async function vaultEntrySourceCount(focusOrId) {
  const focus =
    typeof focusOrId === "object" && focusOrId ? focusOrId : null;
  const focusId =
    focus?.id ||
    (typeof focusOrId === "string" ? focusOrId : null);

  const sources = Object.create(null);
  const add = (source, bytes = 1) => {
    const key = String(source || "unknown").trim() || "unknown";
    if (!sources[key]) sources[key] = { count: 0, bytes: 0 };
    sources[key].count += 1;
    sources[key].bytes += Math.max(1, Number(bytes) || 1);
  };

  // Memory log always counts (even when vault has a copy — de-dupe by not double-counting if vault present)
  const memEntries = Array.isArray(focus?.intelLog)
    ? focus.intelLog
    : Array.isArray(focus?.neuralLog)
      ? focus.neuralLog
      : [];

  let method = "memory";
  try {
    const intel = await readEntityIntelligence(focus || focusId);
    method = intel?.method || method;
    if (intel?.text && intel.method === "filesystem") {
      for (const e of parseIntelligenceEntriesFromText(intel.text)) {
        add(e.source, e.bytes);
      }
    } else {
      for (const e of memEntries) {
        add(e.source || "Cell2", String(e.content || e.body || "").length || 1);
      }
      if (intel?.text && !memEntries.length) {
        for (const e of parseIntelligenceEntriesFromText(intel.text)) {
          add(e.source, e.bytes);
        }
      }
    }
  } catch {
    for (const e of memEntries) {
      add(e.source || "Cell2", String(e.content || e.body || "").length || 1);
    }
  }

  let totalCount = 0;
  let totalBytes = 0;
  for (const k of Object.keys(sources)) {
    totalCount += sources[k].count;
    totalBytes += sources[k].bytes;
  }
  return { sources, totalCount, totalBytes, method, focusId };
}

/**
 * Node contribution metrics for a focus's intelligence noodle.
 * Weighted by entry body size (bytes), not just count.
 * @returns {Promise<{ rows: Array<{source:string,count:number,bytes:number,percent:number,color:string}>, totalCount:number, totalBytes:number, empty:boolean }>}
 */
export async function calculateNodeContributions(focusOrId) {
  const raw = await vaultEntrySourceCount(focusOrId);
  const totalBytes = raw.totalBytes || 0;
  const totalCount = raw.totalCount || 0;
  const palette = [
    "#a78bfa",
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f472b6",
    "#22d3ee",
    "#fb923c",
    "#94a3b8",
  ];
  const keys = Object.keys(raw.sources || {}).sort(
    (a, b) => (raw.sources[b].bytes || 0) - (raw.sources[a].bytes || 0)
  );
  const rows = keys.map((source, i) => {
    const s = raw.sources[source];
    const percent =
      totalBytes > 0
        ? Math.round((s.bytes / totalBytes) * 1000) / 10
        : totalCount > 0
          ? Math.round((s.count / totalCount) * 1000) / 10
          : 0;
    return {
      source,
      count: s.count,
      bytes: s.bytes,
      percent,
      color: palette[i % palette.length],
    };
  });
  // Normalize rounding so sum ~ 100
  if (rows.length && totalBytes > 0) {
    const sum = rows.reduce((a, r) => a + r.percent, 0);
    if (Math.abs(sum - 100) >= 0.2 && rows[0]) {
      rows[0].percent = Math.round((rows[0].percent + (100 - sum)) * 10) / 10;
    }
  }
  return {
    rows,
    totalCount,
    totalBytes,
    empty: !rows.length,
    method: raw.method,
    focusId: raw.focusId,
  };
}

/** Backend/medium profile for target node panel */
export function getKnownBackendProfile(mediumOrName) {
  const key = String(mediumOrName || "").trim();
  if (!key) return null;
  if (KNOWN_BACKENDS[key]) return { ...KNOWN_BACKENDS[key] };
  const hit = Object.keys(KNOWN_BACKENDS).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );
  return hit ? { ...KNOWN_BACKENDS[hit] } : null;
}

/**
 * Read entity intelligence.md (vault or memory).
 */
export async function readEntityIntelligence(focusOrId) {
  const focus =
    typeof focusOrId === "object" && focusOrId ? focusOrId : null;
  const entityId = focus
    ? entityIdFromFocus(focus)
    : sanitizeEntityId(focusOrId || CELL2_CORE_ID);
  const focusId =
    focus?.id ||
    (typeof focusOrId === "string" ? focusOrId : null);
  const relPath = entityIntelPath(entityId);
  const memEntries = Array.isArray(focus?.intelLog)
    ? focus.intelLog
    : Array.isArray(focus?.neuralLog)
      ? focus.neuralLog
      : [];

  const root = await getVaultRoot(focusId);
  if (root) {
    try {
      const entDir = await root.getDirectoryHandle(sanitizeEntityId(entityId), {
        create: false,
      });
      const fh = await entDir.getFileHandle("intelligence.md", { create: false });
      const text = await readExistingFocusText(fh);
      return {
        text,
        entries: memEntries,
        method: "filesystem",
        fileName: relPath,
        entityId,
      };
    } catch {
      /* memory fallback */
    }
  }

  const parts = [entityIntelHeader(focus || entityId)];
  for (const e of memEntries) {
    parts.push(
      formatIntelligenceEntry({
        timestamp: e.timestamp || (e.ts ? new Date(e.ts).toISOString() : new Date().toISOString()),
        source: e.source || "Cell2",
        certainty: e.certainty || "unknown",
        category: e.category || e.kind || "node_intel",
        tags: e.tags,
        body: e.content || e.body || "",
      })
    );
  }
  if (!memEntries.length) {
    parts.push("_No intelligence entries yet._\n");
  }
  return {
    text: parts.join("\n"),
    entries: memEntries,
    method: root ? "memory" : "no-folder",
    fileName: relPath,
    entityId,
  };
}

export async function readCell2IntelligenceLog(focus) {
  return readEntityIntelligence(focus || { id: CELL2_CORE_ID, name: CELL2_CORE_NAME });
}

/**
 * Ensure Cell2 Core entity folder + doctrine seed when vault is ready.
 */
export async function ensureCell2IntelligenceFile(focus) {
  const cell2 =
    focus && isCell2CoreFocus(focus)
      ? focus
      : {
          id: CELL2_CORE_ID,
          name: CELL2_CORE_NAME,
          type: "ai",
          system: true,
          hidden: true,
          certainty: "confirmed",
          intelLog: [],
        };
  if (!Array.isArray(cell2.intelLog)) cell2.intelLog = [];
  const seeds = seedCell2DoctrineEntries();
  if (cell2.intelLog.length === 0) {
    for (const s of seeds) {
      cell2.intelLog.push({
        ts: s.ts,
        timestamp: new Date(s.ts).toISOString(),
        source: s.source,
        certainty: s.certainty,
        category: s.category,
        tags: s.tags,
        content: s.content,
      });
    }
  }

  const root = await getVaultRoot();
  const relPath = entityIntelPath(CELL2_CORE_ID);
  if (!root) {
    return { ok: true, method: "memory", fileName: relPath };
  }
  try {
    const entDir = await getEntityDirectory(root, CELL2_CORE_ID, { create: true });
    const fh = await entDir.getFileHandle("intelligence.md", { create: true });
    const existing = await readExistingFocusText(fh).catch(() => "");
    if (existing && String(existing).trim()) {
      return { ok: true, method: "filesystem", fileName: relPath, skipped: true };
    }
    let body = entityIntelHeader(cell2);
    for (const s of cell2.intelLog) {
      body +=
        "\n" +
        formatIntelligenceEntry({
          timestamp: s.timestamp || new Date(s.ts || Date.now()).toISOString(),
          source: s.source || "Cell2",
          certainty: s.certainty || "confirmed",
          category: s.category || "doctrine",
          tags: s.tags,
          body: s.content,
        });
    }
    const w = await fh.createWritable();
    await w.write(body);
    await w.close();
    return { ok: true, method: "filesystem", fileName: relPath };
  } catch (err) {
    console.warn("ensureCell2IntelligenceFile failed", err);
    return { ok: false, method: "error", fileName: relPath, error: String(err) };
  }
}

/**
 * Push Cell2 Message Bus activity (in-memory; BRAIN panel reads this).
 */
export function pushBusActivity(entry) {
  const row = {
    ts: Date.now(),
    timestamp: new Date().toISOString(),
    kind: entry?.kind || "route",
    summary: String(entry?.summary || "").trim(),
    nodeName: entry?.nodeName || "",
    channel: entry?.channel || "",
    localOnly: entry?.localOnly !== false,
    detail: entry?.detail || "",
  };
  busActivityLog.push(row);
  if (busActivityLog.length > BUS_ACTIVITY_CAP) {
    busActivityLog = busActivityLog.slice(-BUS_ACTIVITY_CAP);
  }
  return row;
}

export function getBusActivityLog() {
  return busActivityLog.slice();
}

/** Build SCROLL node records from live conversations */
export function buildScrollNodesFromConversations(conversations = []) {
  return (conversations || [])
    .filter((c) => {
      if (!c || isCell2CoreFocus(c)) return false;
      return isVisibleFocus(c);
    })
    .map((n) => {
      const eid = entityIdFromFocus(n);
      const purpose =
        n.alignmentProfile?.directives?.[0] ||
        (n.alignmentNotes || "").split("\n").find((l) => l.trim())?.slice(0, 120) ||
        (n.messages || []).find((m) => m.role === "grimoire")?.text?.slice(0, 120) ||
        `${n.name} node`;
      return {
        name: String(n.name || eid),
        poe: resolveBusChannel(n),
        purpose: String(purpose).replace(/\s+/g, " ").trim().slice(0, 200),
        certainty: ensureCertainty(n),
        last_updated: new Date(
          n.updatedAt || n.lastViewedAt || n.createdAt || Date.now()
        ).toISOString(),
        intel_file_path: entityIntelPath(eid),
        entity_id: eid,
        type: getFocusType(n),
        focusId: n.id,
      };
    });
}

function renderScrollListMarkdown(nodes) {
  const lines = [
    `# SCROLL LIST — Messageable AI Nodes`,
    ``,
    `Auto-maintained by Cell2 Message Bus. Other AIs read this first to learn **where** to load intelligence.`,
    `Local-only by default. External search is opt-in via \`/bus search\`.`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Nodes: ${nodes.length}`,
    ``,
  ];
  for (const n of nodes) {
    lines.push(`---`);
    lines.push(`name: ${JSON.stringify(String(n.name || ""))}`);
    lines.push(`poe: ${JSON.stringify(String(n.poe || "Open"))}`);
    lines.push(
      `purpose: ${JSON.stringify(String(n.purpose || "").replace(/\s+/g, " ").trim().slice(0, 200))}`
    );
    lines.push(`certainty: ${n.certainty || "unknown"}`);
    lines.push(`last_updated: ${n.last_updated || new Date().toISOString()}`);
    lines.push(`intel_file_path: ${n.intel_file_path || ""}`);
    if (n.entity_id) lines.push(`entity_id: ${n.entity_id}`);
    if (n.type) lines.push(`type: ${n.type}`);
    lines.push(`---`);
    lines.push(``);
  }
  if (!nodes.length) {
    lines.push(`_No nodes on the bus yet. Use /bus or seal a Focus._`);
    lines.push(``);
  }
  // SCROLL auto-classifies Magic Knight X intakes (handles public only on yes)
  lines.push(renderMagicKnightScrollSection());
  return lines.join("\n");
}

/**
 * Parse SCROLL-LIST.md YAML frontmatter blocks into node records.
 */
export function parseScrollListMarkdown(text) {
  const nodes = [];
  const src = String(text || "");
  const blocks = src.split(/^---\s*$/m).map((b) => b.trim()).filter(Boolean);
  let pending = null;
  for (const block of blocks) {
    if (!/\bname\s*:/i.test(block) || !/\bpoe\s*:/i.test(block)) continue;
    const get = (key) => {
      const re = new RegExp(`^${key}\\s*:\\s*(.*)$`, "im");
      const m = block.match(re);
      if (!m) return "";
      let v = m[1].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        try {
          v = JSON.parse(v.replace(/^'/, '"').replace(/'$/, '"'));
        } catch {
          v = v.slice(1, -1);
        }
      }
      return String(v || "").trim();
    };
    const name = get("name");
    if (!name) continue;
    nodes.push({
      name,
      poe: get("poe") || "Open",
      purpose: get("purpose") || "",
      certainty: get("certainty") || "unknown",
      last_updated: get("last_updated") || "",
      intel_file_path: get("intel_file_path") || "",
      entity_id: get("entity_id") || "",
      type: get("type") || "",
    });
  }
  return nodes;
}

/**
 * Read master node registry: vault SCROLL-LIST.md, else memory, else conversations.
 */
export async function readScrollListNodes(conversations = []) {
  const fromConvos = buildScrollNodesFromConversations(conversations);
  const root = await getVaultRoot();
  if (root) {
    try {
      const fh = await root.getFileHandle(SCROLL_LIST_FILE, { create: false });
      const text = await readExistingFocusText(fh);
      const parsed = parseScrollListMarkdown(text);
      if (parsed.length) {
        // Merge: vault nodes first, fill focusId from conversations when names match
        const byName = new Map(
          fromConvos.map((n) => [n.name.toLowerCase(), n])
        );
        for (const p of parsed) {
          const hit = byName.get(String(p.name).toLowerCase());
          if (hit) {
            p.focusId = hit.focusId;
            p.entity_id = p.entity_id || hit.entity_id;
            p.type = p.type || hit.type;
          }
        }
        scrollListMemoryNodes = parsed;
        return { nodes: parsed, method: "filesystem", text };
      }
    } catch {
      /* fall through */
    }
  }
  if (scrollListMemoryNodes.length) {
    return { nodes: scrollListMemoryNodes, method: "memory" };
  }
  scrollListMemoryNodes = fromConvos;
  return {
    nodes: fromConvos,
    method: "conversations",
    text: renderScrollListMarkdown(fromConvos),
  };
}

/**
 * Resolve nodename against SCROLL list (and optional multi-word rest string).
 */
export function resolveScrollNode(nodeName, nodes = [], opts = {}) {
  const q = String(nodeName || "").trim().toLowerCase();
  if (!q) return null;
  const list = nodes || [];

  // Exact
  let hit = list.find((n) => String(n.name || "").toLowerCase() === q);
  if (hit) return hit;

  // Multi-word: try longest prefix match from nodeNameRest
  const rest = String(opts.nodeNameRest || "").trim();
  if (rest) {
    const lower = rest.toLowerCase();
    const ranked = list
      .map((n) => {
        const nm = String(n.name || "").toLowerCase();
        if (lower === nm || lower.startsWith(nm + " ")) {
          return { n, score: nm.length };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    if (ranked[0]) {
      const best = ranked[0];
      const msg = rest.slice(best.n.name.length).trim();
      return { ...best.n, _resolvedMessage: msg };
    }
  }

  // Starts-with / includes
  hit = list.find((n) => String(n.name || "").toLowerCase().startsWith(q));
  if (hit) return hit;
  hit = list.find((n) => String(n.name || "").toLowerCase().includes(q));
  return hit || null;
}

/**
 * Auto-maintain SCROLL-LIST.md — index of messageable nodes (master registry).
 * Full rewrite of the index file (not a noodle log).
 */
export async function updateScrollListIndex(conversations = [], spells = []) {
  const nodes = buildScrollNodesFromConversations(conversations);
  // Merge any bus-only memory nodes not yet focuses
  for (const m of scrollListMemoryNodes) {
    if (!nodes.some((n) => n.name.toLowerCase() === String(m.name).toLowerCase())) {
      nodes.push(m);
    }
  }
  scrollListMemoryNodes = nodes;
  const content = renderScrollListMarkdown(nodes);
  const root = await getVaultRoot();
  if (!root) {
    return { ok: true, method: "memory", fileName: SCROLL_LIST_FILE, content, nodes };
  }
  try {
    const fh = await root.getFileHandle(SCROLL_LIST_FILE, { create: true });
    const w = await fh.createWritable();
    await w.write(content);
    await w.close();
    return { ok: true, method: "filesystem", fileName: SCROLL_LIST_FILE, content, nodes };
  } catch (err) {
    console.warn("updateScrollListIndex failed", err);
    return {
      ok: false,
      method: "error",
      fileName: SCROLL_LIST_FILE,
      error: String(err),
      nodes,
    };
  }
}

/**
 * Register a new bus node into SCROLL-LIST + entity intelligence folder.
 */
export async function registerBusNode(
  { name, poe = "Open", purpose = "", type = "ai" } = {},
  conversations = []
) {
  const clean = String(name || "").trim();
  if (!clean) return { ok: false, reason: "name-required" };
  const channel = resolveBusChannel(poe || "Open");
  const entityId = sanitizeEntityId(`${clean}-${channel}`);
  const node = {
    name: clean,
    poe: channel,
    purpose: String(purpose || `${clean} bus node`).slice(0, 200),
    certainty: "unknown",
    last_updated: new Date().toISOString(),
    intel_file_path: entityIntelPath(entityId),
    entity_id: entityId,
    type: type || "ai",
  };
  // Memory registry
  const idx = scrollListMemoryNodes.findIndex(
    (n) => n.name.toLowerCase() === clean.toLowerCase()
  );
  if (idx >= 0) scrollListMemoryNodes[idx] = { ...scrollListMemoryNodes[idx], ...node };
  else scrollListMemoryNodes.push(node);

  // Seed entity intelligence file
  await appendEntityIntelligence(
    { id: entityId, name: clean, type, backend: channel, medium: channel },
    {
      body: `Bus node registered: **${clean}** · POE ${channel}\nPurpose: ${node.purpose}`,
      source: "Cell2",
      category: "identity",
      certainty: "unknown",
      tags: ["bus", "register", channel],
    }
  );

  const scroll = await updateScrollListIndex(conversations);
  pushBusActivity({
    kind: "register",
    summary: `Registered bus node **${clean}** · ${channel}`,
    nodeName: clean,
    channel,
    localOnly: true,
  });
  return { ok: true, node, scroll };
}

/**
 * Densen a bus message into the target node's intelligence.md (YAML entry).
 */
export async function densenBusMessage(nodeOrFocus, message, opts = {}) {
  const name =
    typeof nodeOrFocus === "object"
      ? nodeOrFocus.name || nodeOrFocus.id
      : String(nodeOrFocus || "");
  const channel =
    opts.channel ||
    (typeof nodeOrFocus === "object"
      ? resolveBusChannel(nodeOrFocus)
      : "Open");
  const body = String(message || opts.body || "").trim();
  if (!body) return { ok: false, method: "empty" };

  // Governance: AI-sourced densen cannot smuggle git push / build / exec
  const govSource = String(opts.source || opts.from || "user").toLowerCase();
  const isOperator =
    govSource === "user" ||
    govSource === "operator" ||
    govSource === "jacob" ||
    govSource === "crown" ||
    govSource === "grimoire";
  if (!isOperator) {
    const gate = assertAiGovernance(body, {
      source: "ai",
      actor: opts.from || name || "AI node",
    });
    if (!gate.allowed) {
      pushBusActivity({
        kind: "governance",
        summary: `Blocked ${gate.action} from ${opts.from || "AI"}`,
        nodeName: name,
        channel,
        localOnly: true,
        detail: gate.reason,
      });
      return {
        ok: false,
        method: "governance",
        blocked: true,
        action: gate.action,
        reason: gate.reason,
      };
    }
  }

  const focusLike =
    typeof nodeOrFocus === "object" && nodeOrFocus
      ? nodeOrFocus
      : {
          id: sanitizeEntityId(`${name}-${channel}`),
          name,
          type: opts.type || "ai",
          backend: channel,
          medium: channel,
        };

  const bus = makeBusMessage({
    to: name,
    from: opts.from || "user",
    body,
    channel,
    kind: opts.kind || "route",
    localOnly: opts.localOnly !== false,
  });

  const beforeBytes = body.length;
  console.debug("[bus-relay] densen before", {
    name,
    kind: bus.kind,
    bytes: beforeBytes,
    channel,
  });

  const vaultBody = [
    `**Cell2 Message Bus** · ${bus.kind}`,
    `To: **${bus.to}** · Channel: **${bus.channel}** · From: ${bus.from}`,
    ``,
    bus.body,
  ].join("\n");

  const result = await appendEntityIntelligence(focusLike, {
    body: vaultBody,
    source: opts.source || "user",
    category: opts.category || "node_intel",
    certainty: opts.certainty || "inferred",
    tags: ["bus", bus.kind, bus.channel, "auto-write", "full-body"].filter(Boolean),
    focusId: opts.focusId || focusLike.id || null,
    refreshScroll: true,
  });

  const afterBytes = String(bus.body || "").length;
  console.debug("[bus-relay] densen after", {
    name,
    bytes: afterBytes,
    vaultBytes: vaultBody.length,
    method: result?.method || "unknown",
    truncated: afterBytes < beforeBytes,
  });
  if (afterBytes < beforeBytes) {
    console.error("[bus-relay] truncation detected", { beforeBytes, afterBytes });
  }

  // Ensure SCROLL curates even if append returned memory-only
  scheduleScrollListCurate({ immediate: false });

  pushBusActivity({
    kind: bus.kind,
    summary: `Bus → **${name}** · ${channel}: ${body.slice(0, 120)}`,
    nodeName: name,
    channel,
    localOnly: bus.localOnly,
    // Display may summarize; vault already has full body
    detail: body,
    payloadBytes: beforeBytes,
  });

  return { ok: true, bus, result, payloadBytes: beforeBytes, fullBody: true };
}

/**
 * Autonomous /msg delivery densen — YAML frontmatter via auto-write loop.
 * Used for AI-to-AI and self-message chains (no UI focus switch).
 *
 * @param {object} targetFocus - receiving focus
 * @param {string} message - full body (never preview-only)
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
export async function densenMsgDelivery(targetFocus, message, opts = {}) {
  if (!targetFocus) return { ok: false, method: "empty" };
  const body = String(message || opts.body || "").trim();
  if (!body) return { ok: false, method: "empty" };

  const from = String(opts.from || "user").trim() || "user";
  const source = String(opts.source || from).trim() || from;
  const kind = String(opts.kind || "msg").trim() || "msg";
  const channel =
    opts.channel || getSealedChannel(targetFocus) || resolveBusChannel(targetFocus);
  const self = Boolean(opts.self || from === targetFocus.name);

  // Governance on AI-originated msg payloads
  const srcLower = source.toLowerCase();
  const operatorSources = new Set([
    "user",
    "operator",
    "jacob",
    "crown",
    "grimoire",
  ]);
  if (!operatorSources.has(srcLower) && srcLower !== "self-loop") {
    const gate = assertAiGovernance(body, {
      source: "ai",
      actor: from,
    });
    if (!gate.allowed) {
      pushBusActivity({
        kind: "governance",
        summary: `Blocked ${gate.action} via /msg from ${from}`,
        nodeName: targetFocus.name,
        channel,
        localOnly: true,
        detail: gate.reason,
      });
      return {
        ok: false,
        method: "governance",
        blocked: true,
        action: gate.action,
        reason: gate.reason,
      };
    }
  }
  // Self-loop still cannot smuggle forbidden verbs
  if (srcLower === "self-loop") {
    const forbidden = detectForbiddenAiAction(body);
    if (forbidden) {
      const gate = assertAiGovernance(forbidden, {
        source: "ai",
        actor: from,
      });
      return {
        ok: false,
        method: "governance",
        blocked: true,
        action: forbidden,
        reason: gate.reason,
      };
    }
  }

  const header = self
    ? `**Autonomous self-message** · ${kind}`
    : `**Autonomous /msg** · ${kind}`;
  const vaultBody = [
    header,
    `To: **${targetFocus.name}** · Channel: **${channel}** · From: **${from}**`,
    opts.loopIteration != null
      ? `Loop iteration: **${opts.loopIteration}**`
      : null,
    ``,
    body,
  ]
    .filter((l) => l != null)
    .join("\n");

  const result = await autoWriteFocusIntelligence(targetFocus, {
    body: vaultBody,
    source: source === "self-loop" ? from : source,
    category: opts.category || "relationship",
    certainty: opts.certainty || "inferred",
    tags: [
      "msg",
      kind,
      self ? "self-message" : "ai-to-ai",
      "auto-write",
      channel,
    ].filter(Boolean),
    focusId: targetFocus.id,
    refreshScroll: true,
  });

  pushBusActivity({
    kind: kind === "msg-loop" ? "msg-loop" : "msg",
    summary: self
      ? `Self-msg · **${targetFocus.name}**: ${body.slice(0, 100)}`
      : `/msg **${from}** → **${targetFocus.name}**: ${body.slice(0, 100)}`,
    nodeName: targetFocus.name,
    channel,
    localOnly: true,
    detail: body.slice(0, 500),
  });

  scheduleScrollListCurate({ immediate: false });
  return { ok: true, result, self, channel };
}

// ═══════════════════════════════════════════════════════════════════════════
// Session0 fleet response consolidation
// Responses flow: fleet sessions → Session0 → GRIMOIRE → focus vault
// Local-first. No inbox watchers. No per-session HTTP. Jacob is the crown.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a Session0 consolidated multi-session response into per-session blocks.
 * Recognizes:
 *   ### Response from <session>
 *   ## Response from <session>
 *   **From <session>:**
 *   [session: <id>]
 *   --- session: <id> ---
 *
 * @param {string} text
 * @returns {{ sessions: Array<{session:string, body:string}>, isConsolidated: boolean, raw: string }}
 */
export function parseSession0FleetResponse(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return { sessions: [], isConsolidated: false, raw: "" };
  }

  const sessions = [];
  // Split on heading-style session markers
  const marker =
    /(?:^|\n)(?:#{1,3}\s*Response\s+from\s+([^\n#]+)|#{1,3}\s*From\s+([^\n#]+)|(?:\*\*)?From\s+([^*\n:]+)(?:\*\*)?\s*:|\[session\s*:\s*([^\]]+)\]|---\s*session\s*:\s*([^\n-]+)\s*---)/gi;

  const matches = [];
  let m;
  while ((m = marker.exec(raw)) !== null) {
    const session = String(
      m[1] || m[2] || m[3] || m[4] || m[5] || ""
    )
      .trim()
      .replace(/\*+/g, "")
      .replace(/^\*\*|\*\*$/g, "");
    if (!session) continue;
    matches.push({ index: m.index + (m[0].startsWith("\n") ? 1 : 0), end: marker.lastIndex, session });
  }

  if (matches.length === 0) {
    // Single blob — treat as Session0 consolidated whole if doctrine language present
    const looksFleet =
      /session0|consolidated|fleet|response from/i.test(raw) &&
      raw.length > 40;
    return {
      sessions: looksFleet
        ? [{ session: "Session0", body: raw }]
        : [{ session: "Session0", body: raw }],
      isConsolidated: looksFleet || raw.length > 0,
      raw,
    };
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    // Body starts after the marker line
    const afterMarker = raw.indexOf("\n", cur.end);
    const start = afterMarker === -1 ? cur.end : afterMarker + 1;
    const end = next ? next.index : raw.length;
    const body = raw.slice(start, end).trim();
    sessions.push({
      session: cur.session,
      body: body || "_(empty block)_",
    });
  }

  return {
    sessions,
    isConsolidated: sessions.length >= 1,
    raw,
  };
}

/**
 * Build a focus-intelligence densen body from consolidated Session0 reply.
 */
export function formatSession0ConsolidatedIntel(parsed, opts = {}) {
  const spellTitle = String(opts.spellTitle || "Spell").trim();
  const focusName = String(opts.focusName || "Focus").trim();
  const sessions = parsed?.sessions || [];
  const lines = [
    `**Session0 fleet response · consolidated**`,
    `Focus: **${focusName}**`,
    `Spell: **${spellTitle}**`,
    `Sessions: **${sessions.length}**`,
    `Orchestrator: **Session0**`,
    ``,
    `> GRIMOIRE waits for consolidated response from Session0.`,
    `> Individual Hermes sessions are not messaged directly.`,
    ``,
  ];
  if (!sessions.length) {
    lines.push(String(parsed?.raw || "").slice(0, 12000) || "_(empty)_");
  } else {
    for (const s of sessions) {
      lines.push(`### Response from ${s.session}`, ``, s.body, ``);
    }
  }
  lines.push(`---`, `the scroll never forgets. the saint always remembers.`);
  return lines.join("\n");
}

/**
 * Consolidate Session0 multi-session response into focus intelligence (auto-write-back).
 * Optionally mirrors per-session slices onto fleet focuses that share linkedSession.
 *
 * @param {object} focus - primary densen target (usually spell owner)
 * @param {string} text - Session0 consolidated reply (paste)
 * @param {object} [opts]
 * @param {object} [opts.spell]
 * @param {array} [opts.conversations] - for fleet fan-out densen
 * @returns {Promise<object>}
 */
export async function consolidateSession0FleetResponse(focus, text, opts = {}) {
  if (!focus) return { ok: false, method: "empty" };
  const body = String(text || opts.body || "").trim();
  if (!body) return { ok: false, method: "empty" };

  const parsed = parseSession0FleetResponse(body);
  const spellTitle = String(
    opts.spellTitle ||
      opts.spell?.title ||
      opts.spell?.purpose ||
      "Fleet spell"
  ).trim();
  const intelBody = formatSession0ConsolidatedIntel(parsed, {
    spellTitle,
    focusName: focus.name || "Focus",
  });

  const result = await autoWriteFocusIntelligence(focus, {
    body: intelBody,
    source: opts.source || "Session0",
    category: opts.category || "node_intel",
    certainty: opts.certainty || "confirmed",
    tags: [
      "session0",
      "fleet",
      "consolidated",
      "auto-write",
      "orchestrator",
      opts.spell?.kind || "spell",
    ].filter(Boolean),
    focusId: focus.id,
    refreshScroll: true,
  });

  // Mirror per-session slices to matching fleet focuses (local densen only)
  const conversations = Array.isArray(opts.conversations) ? opts.conversations : [];
  const mirrored = [];
  if (conversations.length && parsed.sessions.length) {
    for (const block of parsed.sessions) {
      const sess = String(block.session || "").trim().toLowerCase();
      if (!sess || sess === "session0") continue;
      const match = conversations.find((c) => {
        if (!c || isCell2CoreFocus(c) || !isVisibleFocus(c)) return false;
        const ls = String(c.linkedSession || "").trim().toLowerCase();
        if (!ls) return false;
        return (
          ls === sess ||
          ls.includes(sess) ||
          sess.includes(ls) ||
          String(c.name || "").toLowerCase() === sess
        );
      });
      if (!match) continue;
      try {
        await autoWriteFocusIntelligence(match, {
          body: [
            `**Fleet slice via Session0**`,
            `From session: **${block.session}**`,
            `Spell: **${spellTitle}**`,
            ``,
            block.body,
          ].join("\n"),
          source: "Session0",
          category: "node_intel",
          certainty: "inferred",
          tags: ["session0", "fleet-slice", "auto-write", block.session],
          focusId: match.id,
          refreshScroll: false,
        });
        mirrored.push({ focusId: match.id, session: block.session });
      } catch (err) {
        console.warn("[session0] fleet slice densen failed", err);
      }
    }
  }

  pushBusActivity({
    kind: "session0-consolidate",
    summary: `Session0 consolidated · **${focus.name}** · ${parsed.sessions.length} session block(s)`,
    nodeName: focus.name,
    channel: getSealedChannel(focus),
    localOnly: true,
    detail: intelBody.slice(0, 500),
  });

  scheduleScrollListCurate({ immediate: false });
  return {
    ok: true,
    result,
    parsed,
    mirrored,
    sessionCount: parsed.sessions.length,
  };
}

/**
 * Refuse auto-delete of purge-protected focuses (governance helper).
 * Operator manual purge is still allowed at the app layer with force.
 */
export function refuseAutoPurge(focus, { source = "ai" } = {}) {
  if (!focus) return { refused: false };
  if (!isPurgeProtected(focus)) return { refused: false };
  const src = String(source || "ai").toLowerCase();
  if (src === "operator" || src === "jacob" || src === "user" || src === "crown") {
    return { refused: false, protected: true };
  }
  console.error(
    "[governance] refuseAutoPurge — blocked auto-delete of purgeProtected focus:",
    focus.name,
    focus.id,
    "source=",
    source
  );
  return {
    refused: true,
    protected: true,
    reason: [
      `**Purge blocked** · **${focus.name}** is operator-critical (\`purgeProtected\`).`,
      `No AI may auto-delete Wizard King, SCROLL, GRIMOIRE, YOU, or Jacob-linked focuses.`,
      `**Jacob is the crown.**`,
    ].join("\n"),
  };
}

/**
 * Local vault search only (no network). Scans SCROLL names + in-memory intel snippets.
 */
export async function searchBusLocal(query, conversations = []) {
  const q = String(query || "").trim().toLowerCase();
  const { nodes } = await readScrollListNodes(conversations);
  if (!q) {
    return { hits: nodes.slice(0, 20), method: "local", query: q };
  }
  const hits = [];
  for (const n of nodes) {
    const hay = [n.name, n.poe, n.purpose, n.entity_id, n.type]
      .join(" ")
      .toLowerCase();
    if (hay.includes(q)) hits.push({ ...n, match: "scroll" });
  }
  for (const c of conversations || []) {
    if (isCell2CoreFocus(c) || !isVisibleFocus(c)) continue;
    const log = Array.isArray(c.intelLog) ? c.intelLog : [];
    for (const e of log.slice(-30)) {
      const body = String(e.content || e.body || "");
      if (body.toLowerCase().includes(q)) {
        hits.push({
          name: c.name,
          poe: getSealedChannel(c),
          purpose: body.slice(0, 160),
          certainty: e.certainty || "unknown",
          intel_file_path: entityIntelPath(entityIdFromFocus(c)),
          focusId: c.id,
          match: "intel",
        });
        break;
      }
    }
  }
  pushBusActivity({
    kind: "search_local",
    summary: `Local bus search: “${query}” → ${hits.length} hit(s)`,
    localOnly: true,
    detail: q,
  });
  return { hits, method: "local", query: q };
}

/**
 * Relay structured intel from source Focus into dest session (local only).
 * Returns markdown for chat + densens into dest vault.
 *
 * FULL BODY RULE (sev-01-bus-relay-full-body):
 * Vault / densen writes must never truncate payload, Purpose lines, or intel
 * content. Display summaries may truncate; intelligence.md never uses preview mode.
 * Do not wrap payloads in `_italics_` — trailing underscore was truncating Purpose.
 */
export async function relayIntelBetweenFocuses(sourceFocus, destFocus, hint = "") {
  if (!sourceFocus || !destFocus) return { ok: false, text: "" };
  const bits = [];
  const channel = getSealedChannel(sourceFocus);
  const fullHint = String(hint || "").trim();
  bits.push(`### Relay from **${sourceFocus.name}** · ${channel}`);
  // Full alignment notes — no slice
  if (sourceFocus.alignmentNotes) {
    bits.push(String(sourceFocus.alignmentNotes));
  }
  // Full recent intel entries — no body slice
  const log = Array.isArray(sourceFocus.intelLog) ? sourceFocus.intelLog : [];
  const recent = log.slice(-12);
  for (const e of recent) {
    const content = String(e.content || e.body || "");
    bits.push(
      `- [${e.category || "intel"} · ${e.certainty || "unknown"}] ${content}`
    );
  }
  // Full message payload (Purpose, body, everything) — never preview / never _wrap_
  if (fullHint) {
    bits.push(``);
    bits.push(`### Message payload (full)`);
    bits.push(fullHint);
  }
  if (bits.length < 2) {
    bits.push("No densened intelligence on file yet for this node.");
  }
  const text = bits.join("\n");
  console.debug("[bus-relay] relay before", {
    from: sourceFocus.name,
    to: destFocus.name,
    hintBytes: fullHint.length,
    intelBits: bits.length,
  });
  // Vault write: full text only
  await appendEntityIntelligence(destFocus, {
    body: text,
    source: "Cell2",
    category: "relationship",
    certainty: "inferred",
    tags: ["bus", "relay", "full-body", sourceFocus.name],
  });
  console.debug("[bus-relay] relay after", {
    from: sourceFocus.name,
    to: destFocus.name,
    bytes: text.length,
    fullBody: true,
  });
  pushBusActivity({
    kind: "relay",
    summary: `Relay **${sourceFocus.name}** → **${destFocus.name}** (${fullHint.length || text.length} chars full body)`,
    nodeName: sourceFocus.name,
    channel,
    localOnly: true,
    // Activity log may summarize in UI; vault already has full body
    detail: fullHint || text,
    payloadBytes: text.length,
  });
  return { ok: true, text, fullBody: true, payloadBytes: text.length };
}

/**
 * Save image under entity images/ and index metadata into intelligence.md.
 * @param {object} focus
 * @param {string} dataUrl - data:image/...;base64,...
 * @param {object} [meta]
 */
export async function saveEntityImage(focus, dataUrl, meta = {}) {
  if (!focus || !dataUrl) return { ok: false, method: "empty" };
  const entityId = entityIdFromFocus(focus);
  const root = await getVaultRoot();
  const ts = Date.now();
  const ext = /image\/png/i.test(dataUrl)
    ? "png"
    : /image\/webp/i.test(dataUrl)
      ? "webp"
      : "jpg";
  const fileName = `img-${ts}.${ext}`;
  const relImage = `${entityId}/images/${fileName}`;

  let method = "memory";
  if (root) {
    try {
      const entDir = await getEntityDirectory(root, entityId, { create: true });
      const imgDir = await entDir.getDirectoryHandle("images", { create: true });
      const comma = dataUrl.indexOf(",");
      const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const fh = await imgDir.getFileHandle(fileName, { create: true });
      const w = await fh.createWritable();
      await w.write(bytes);
      await w.close();
      method = "filesystem";
    } catch (err) {
      console.warn("saveEntityImage failed", err);
      return { ok: false, method: "error", error: String(err), entityId };
    }
  }

  const caption = String(meta.caption || meta.context || "").trim();
  const body = [
    `**Image captured** \`${fileName}\``,
    `Path: \`${relImage}\``,
    caption ? `Context: ${caption.slice(0, 500)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const intel = await appendEntityIntelligence(focus, {
    body,
    source: meta.source || "user",
    certainty: meta.certainty || "confirmed",
    category: "reality",
    tags: ["image", "visual", fileName],
  });

  return {
    ok: true,
    method: intel.method === "filesystem" || method === "filesystem" ? "filesystem" : method,
    fileName: relImage,
    entityId,
    intel,
  };
}

function fmtDate(ts = Date.now()) {
  try {
    return new Date(ts).toISOString().slice(0, 10);
  } catch {
    return "unknown";
  }
}

function fmtDateTime(ts = Date.now()) {
  try {
    return new Date(ts).toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return String(ts);
  }
}

/**
 * Push a timestamped event onto the Focus (persists via app state + disk write).
 */
export function pushFocusEvent(focus, eventType, content) {
  if (!focus) return;
  if (!Array.isArray(focus.eventLog)) focus.eventLog = [];
  focus.eventLog.push({
    ts: Date.now(),
    type: eventType || "EVENT",
    content: String(content || "").trim(),
  });
  // Cap log growth
  if (focus.eventLog.length > 200) {
    focus.eventLog = focus.eventLog.slice(-200);
  }
}

/**
 * SCROLL LIST — compact transferable manifest of nodes this Focus has touched.
 * Sources: nucleus Focus + derivedNodes + sealed node-engage spells (+ returned intel).
 */
export function buildScrollList(focus, spells = []) {
  const byKey = new Map();

  function upsert(entry) {
    if (!entry?.name) return;
    const key = `${String(entry.name).toLowerCase()}::${String(entry.channel || "open").toLowerCase()}`;
    const prev = byKey.get(key);
    if (!prev || (entry.updated || 0) >= (prev.updated || 0)) {
      byKey.set(key, entry);
    }
  }

  // 1) Nucleus Focus
  if (focus) {
    upsert({
      name: focus.name,
      channel: getSealedChannel(focus),
      nodeType: getFocusType(focus),
      role: "nucleus",
      snippet:
        (focus.alignmentNotes || "").trim().slice(0, 240) ||
        (focus.messages || [])
          .slice(-3)
          .map((m) => String(m?.text || "").trim())
          .filter(Boolean)
          .join(" / ")
          .slice(0, 240) ||
        "Nucleus Focus — sealed channel.",
      updated: focus.updatedAt || focus.createdAt || Date.now(),
    });
  }

  // 2) Operator-derived nodes (returned intel densen)
  for (const node of focus?.derivedNodes || []) {
    upsert({
      name: node?.name || node?.id || "Unknown Node",
      channel: node?.channel || node?.backend || getSealedChannel(node) || "Open",
      nodeType: node?.type || node?.nodeType || getFocusType(node) || "node",
      role: node?.role || "derived",
      snippet:
        String(node?.snippet || node?.alignmentNotes || node?.intel || "").trim().slice(0, 240) ||
        "Engaged node — densen pending.",
      updated: node?.updatedAt || node?.createdAt || Date.now(),
    });
  }

  // 3) Node-engagement spells (ready or sealed) — proactive WYFWYG packets
  const focusSpells = (spells || []).filter((s) => s && s.conversationId === focus?.id);
  for (const s of focusSpells) {
    const isEngage =
      s.kind === "node-engage" ||
      /^ENGAGE\s*[·.]/i.test(String(s.purpose || "")) ||
      Boolean(s.engageNodeId || s.targetFocusId);
    if (!isEngage && !s.target) continue;
    if (!isEngage && s.target === focus?.name) continue;

    const name = s.engageNodeName || s.target || "Node";
    const channel = s.engageNodeChannel || s.medium || "Open";
    const snippet =
      String(s.answerExcerpt || "").trim().slice(0, 240) ||
      String(s.essence || "").trim().slice(0, 240) ||
      (s.status === "sent"
        ? "Engagement cast — awaiting node reply densen."
        : "Proactive engage spell ready in spell book.");
    upsert({
      name,
      channel,
      nodeType: s.engageNodeType || "node",
      role: s.status === "sent" ? (s.answeredAt ? "engaged-densen" : "engaged-cast") : "engage-ready",
      snippet,
      updated: s.answeredAt || s.sentAt || s.createdAt || Date.now(),
    });
  }

  const entries = [...byKey.values()].sort(
    (a, b) => (b.updated || 0) - (a.updated || 0)
  );

  if (!entries.length) {
    return "_No nodes on this scroll yet. Start casting to grow the list._";
  }

  const lines = [
    `# SCROLL LIST — ${focus?.name || "Focus"}`,
    `Generated: ${fmtDateTime(Date.now())}`,
    `Nodes: ${entries.length}`,
    `Model: proactive node engagement (WYFWYG) — Focus forges packets; operator dispatches; replies densen the scroll.`,
    "",
  ];

  for (const e of entries) {
    const role = e.role ? ` · ${e.role}` : "";
    lines.push(`### ${e.name} · ${e.channel} · ${e.nodeType}${role}`);
    lines.push(String(e.snippet || "").trim() || "_No intel yet._");
    lines.push("");
  }

  lines.push("---");
  lines.push("_One paste = full Focus transfer into any AI._");
  lines.push("_ENGAGE spells target unengaged nodes; paste replies here to update this list._");
  return lines.join("\n");
}

/**
 * Build full intelligence markdown for a Focus from live state.
 */
export function buildFocusMarkdown(focus, spells = []) {
  const backend = getSealedChannel(focus);
  const type = getFocusType(focus);
  const created =
    focus.createdAt ||
    (focus.messages && focus.messages[0]?.ts) ||
    Date.now();
  const focusSpells = (spells || [])
    .filter((s) => s.conversationId === focus.id)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const alignmentSpells = focusSpells.filter((s) => isAlignmentSpell(s));
  const latestAlign = alignmentSpells[alignmentSpells.length - 1];

  const lines = [
    `# ${focus.name} — Intelligence Log`,
    `**Backend:** ${backend}`,
    `**Type:** ${type}`,
    `**Created:** ${fmtDate(created)}`,
    `**Updated:** ${fmtDateTime(Date.now())}`,
    `**Sealed channel:** ${focus.name} · ${backend}`,
    "",
  ];

  lines.push("## SCROLL LIST");
  lines.push("");
  lines.push(buildScrollList(focus, spells));
  lines.push("");

  lines.push("## Alignment Reveal");
  if (focus.alignmentNotes) {
    lines.push("");
    lines.push(focus.alignmentNotes.trim());
  } else if (latestAlign) {
    lines.push("");
    lines.push(
      "*(Alignment spell forged — paste node reply into Grimoire to lock notes)*"
    );
    lines.push("");
    lines.push("```");
    lines.push(formatSpellMarkdown(latestAlign));
    lines.push("```");
  } else {
    lines.push("");
    lines.push("_No alignment reveal on file yet._");
  }
  lines.push("");

  // Healer Health Covenant snapshot (computed at write time)
  try {
    const health = computeFocusHealth(focus, spells);
    lines.push("## Healer Health Covenant");
    lines.push("");
    lines.push(`**HP:** ${health.hp}/100 · **Band:** ${String(health.band || "").toUpperCase()}`);
    lines.push(`**Recipe:** ${health.label} (\`${health.recipeId}\`)`);
    lines.push("");
    for (const c of health.conditions || []) {
      lines.push(`- ${c.label}: ${c.score}/100 (w${c.weight})`);
    }
    lines.push("");
    lines.push(`_${health.healerNote}_`);
    lines.push("");
  } catch {
    /* health optional */
  }

  lines.push("## Spells");
  if (!focusSpells.length) {
    lines.push("");
    lines.push("_No spells yet._");
  } else {
    lines.push("");
    for (const s of focusSpells) {
      const status = (s.status || "ready").toUpperCase();
      const when = fmtDate(s.createdAt);
      lines.push(`- [${when}] ${s.purpose || "Spell"} — ${status}`);
    }
  }
  lines.push("");

  lines.push("## Spell Texts");
  if (!focusSpells.length) {
    lines.push("");
    lines.push("_None._");
  } else {
    for (const s of focusSpells) {
      lines.push("");
      lines.push(
        `### ${s.purpose || "Spell"} (${(s.status || "ready").toUpperCase()})`
      );
      lines.push("");
      lines.push("```");
      lines.push(formatSpellMarkdown(s));
      lines.push("```");
    }
  }
  lines.push("");

  lines.push("## Intelligence");
  lines.push("");
  const intel = deriveIntelligenceBullets(focus, focusSpells);
  if (!intel.length) {
    lines.push(
      "_No extracted intelligence yet. Cast spells and paste alignment replies._"
    );
  } else {
    for (const b of intel) lines.push(`- ${b}`);
  }
  lines.push("");

  const userMsgs = (focus.messages || [])
    .filter((m) => m.role === "user" && m.text)
    .slice(-12);
  lines.push("## Recent User Intents");
  lines.push("");
  if (!userMsgs.length) {
    lines.push("_None._");
  } else {
    for (const m of userMsgs) {
      lines.push(
        `- [${fmtDate(m.ts)}] ${m.text.replace(/\s+/g, " ").trim().slice(0, 200)}`
      );
    }
  }
  lines.push("");

  // Timestamped event stream (append-style log)
  lines.push("## Event Log");
  lines.push("");
  const events = Array.isArray(focus.eventLog) ? focus.eventLog : [];
  if (!events.length) {
    lines.push("_No events yet._");
  } else {
    for (const ev of events) {
      lines.push(`## [${fmtDateTime(ev.ts)}] — ${ev.type}`);
      lines.push(ev.content || "");
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("_Written by Grimoire · local-first · sealed channel_");
  lines.push("");

  return lines.join("\n");
}

function deriveIntelligenceBullets(focus, spells) {
  const bullets = [];
  const backend = getSealedChannel(focus);
  bullets.push(`Working signal: sealed to **${backend}**`);
  if (focus.alignmentReceived || focus.alignmentNotes) {
    bullets.push("Alignment reply captured on this Focus");
    const notes = (focus.alignmentNotes || "").slice(0, 400);
    const caps = notes.match(/(?:capabilities?|tools?)[:\s—-]+([^\n]+)/i);
    const cons = notes.match(/(?:constraints?|limits?)[:\s—-]+([^\n]+)/i);
    const purpose = notes.match(/(?:primary purpose|purpose)[:\s—-]+([^\n]+)/i);
    if (purpose)
      bullets.push(`Purpose signal: ${purpose[1].trim().slice(0, 160)}`);
    if (caps) bullets.push(`Capability: ${caps[1].trim().slice(0, 160)}`);
    if (cons) bullets.push(`Constraint: ${cons[1].trim().slice(0, 160)}`);
  } else if (spells.some(isAlignmentSpell)) {
    bullets.push("Alignment Reveal spell exists — awaiting node reply paste");
  }
  for (const s of spells.slice(-5)) {
    if (s.essence)
      bullets.push(`Essence (${s.purpose}): ${s.essence.slice(0, 140)}`);
    if (s.crafted) bullets.push(s.crafted);
  }
  return bullets;
}

/**
 * Write vault content. Prefer entity-folder paths; allow root sidecars via opts.fileName.
 * Snapshot writes still never truncate intelligence.md noodles (use appendEntityIntelligence).
 */
export async function writeFocusIntelligence(focus, spells = [], opts = {}) {
  // Explicit root sidecar (e.g. SCROLL-LIST.md or custom manifest)
  if (typeof opts.fileName === "string" && opts.fileName.trim() && !opts.fileName.includes("/")) {
    const content =
      typeof opts.content === "string"
        ? opts.content
        : typeof focus?._scrollListContent === "string"
          ? focus._scrollListContent
          : buildFocusMarkdown(focus, spells);
    const name = opts.fileName.trim();
    const fsAvailable = hasDirectoryPicker();
    const allowDownload =
      opts.allowDownload === true || (!fsAvailable && opts.allowDownload !== false);
    const handle = dirHandle || (await restoreIntelligenceFolder());
    if (handle && fsAvailable) {
      try {
        const fileHandle = await handle.getFileHandle(name, { create: true });
        const current = await readExistingFocusText(fileHandle).catch(() => null);
        if (current === content) {
          return { ok: true, method: "filesystem", fileName: name, skipped: true };
        }
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return { ok: true, method: "filesystem", fileName: name };
      } catch (err) {
        console.warn("Intelligence write failed", err);
        return { ok: false, method: "error", fileName: name, error: String(err) };
      }
    }
    if (allowDownload && !fsAvailable) {
      downloadMarkdown(name, content);
      return { ok: true, method: "download", fileName: name };
    }
    return { ok: false, method: "no-folder", fileName: name };
  }

  // Default: append a densen snapshot entry into entity intelligence.md (append-only)
  if (focus) {
    const snap =
      typeof opts.content === "string"
        ? opts.content
        : `Snapshot densen · ${focus.name || entityIdFromFocus(focus)} · ${getSealedChannel(focus)}`;
    return appendEntityIntelligence(focus, {
      body: snap.slice(0, 8000),
      source: opts.source || "Cell2",
      category: opts.category || "node_intel",
      certainty: opts.certainty || ensureCertainty(focus),
      tags: opts.tags || ["snapshot"],
    });
  }

  return { ok: false, method: "no-focus" };
}

async function readExistingFocusText(fileHandle) {
  const file = await fileHandle.getFile();
  return file.text();
}

/**
 * Record event + append to entity intelligence.md (append-only).
 */
export async function recordFocusEvent(focus, spells, eventType, content) {
  pushFocusEvent(focus, eventType, content);
  const body = [
    eventType ? `**Event:** ${eventType}` : null,
    String(content || "").trim() || null,
  ]
    .filter(Boolean)
    .join("\n\n");
  const result = await appendEntityIntelligence(focus, {
    body: body || eventType || "event",
    source: "Cell2",
    category: classifyIntelCategory(`${eventType} ${content || ""}`),
    certainty: ensureCertainty(focus),
    tags: [String(eventType || "event").toLowerCase()],
  });
  // Keep SCROLL-LIST fresh when AI nodes densen
  try {
    if (focus && (getFocusType(focus) === "ai" || getFocusType(focus) === "eternal-intelligence")) {
      /* caller may pass full conversation list later */
    }
  } catch {
    /* ignore */
  }
  return result;
}

function downloadMarkdown(fileName, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function getFolderLabel() {
  const h = dirHandle || (await restoreIntelligenceFolder());
  if (!h) return null;
  return h.name || localStorage.getItem(LS_NAME) || INTEL_DIR_NAME;
}

export async function ensureFocusFile(focus, spells = []) {
  pushFocusEvent(
    focus,
    "FOCUS_CREATED",
    `Sealed channel opened: ${focus.name} · ${getSealedChannel(focus)}`
  );
  return writeFocusIntelligence(focus, spells);
}

export async function deleteFocusIntelligenceFile(focus) {
  if (!focus) return { ok: false, method: "none" };
  if (isCell2CoreFocus(focus)) {
    return { ok: false, method: "protected", fileName: CELL2_INTEL_PATH };
  }
  const entityId = entityIdFromFocus(focus);
  const name = entityIntelPath(entityId);
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) {
    return { ok: false, method: "none", fileName: name };
  }
  try {
    // Remove entire entity folder (intelligence.md + images/)
    await handle.removeEntry(sanitizeEntityId(entityId), { recursive: true });
    return { ok: true, method: "filesystem", fileName: name };
  } catch (err) {
    console.warn("Focus file remove:", err);
    return {
      ok: false,
      method: "filesystem",
      fileName: name,
      error: String(err),
    };
  }
}

/**
 * Experience Intelligence vault layer.
 *
 * Reads/writes experience entries under EXPERIENCES_DIR/.
 * Maintains EXPERIENCES-INDEX.md at vault root.
 */

/**
 * Resolve the vault path for an experience entry file.
 */
export function experienceVaultPath(expId) {
  const id = String(expId || "").trim();
  if (!id) return `${EXPERIENCES_DIR}/unknown.md`;
  return `${EXPERIENCES_DIR}/${id}.md`;
}

/**
 * Read all experience entries from the vault root index + disk.
 * Returns array of normalized experience objects.
 */
export async function readExperiencesFromVault() {
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) return [];

  const entries = [];
  try {
    const dir = await handle.getDirectoryHandle(EXPERIENCES_DIR, { create: false });
    for await (const [name, fileHandle] of dir.entries()) {
      if (!/\.md$/i.test(name)) continue;
      try {
        const text = await readExistingFocusText(fileHandle);
        const exp = parseExperienceMarkdown(text);
        if (exp && exp.id) entries.push(exp);
      } catch {
        /* skip unreadable file */
      }
    }
  } catch {
    /* no experiences folder yet */
  }

  return entries.sort((a, b) => {
    const at = Date.parse(a.date_range?.start || a.created_at || 0);
    const bt = Date.parse(b.date_range?.start || b.created_at || 0);
    return bt - at;
  });
}

/**
 * Read the vault EXPERIENCES-INDEX.md manifest.
 * Returns plain text or null when absent.
 */
export async function readExperiencesIndexText() {
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) return null;
  try {
    const fileHandle = await handle.getFileHandle(EXPERIENCES_INDEX_FILE, { create: false });
    return await readExistingFocusText(fileHandle);
  } catch {
    return null;
  }
}

/**
 * Write/update a single experience entry to vault disk.
 * Also refreshes the root index file.
 */
export async function writeExperienceToVault(exp, opts = {}) {
  const e = normalizeExperience(exp);
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) {
    const allowDownload = opts.allowDownload !== false;
    if (allowDownload) {
      downloadMarkdown(experienceVaultPath(e.id), buildExperienceMarkdown(e));
      return { ok: true, method: "download", id: e.id };
    }
    return { ok: false, method: "no-folder", id: e.id };
  }

  try {
    const dir = await handle.getDirectoryHandle(EXPERIENCES_DIR, { create: true });
    const filePath = experienceVaultPath(e.id);
    const fileName = filePath.split("/").pop();
    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const content = buildExperienceMarkdown(e);
    const current = await readExistingFocusText(fileHandle).catch(() => null);
    if (current === content) {
      return { ok: true, method: "filesystem", id: e.id, skipped: true };
    }
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    await refreshExperiencesIndex(handle, [e]);
    return { ok: true, method: "filesystem", id: e.id };
  } catch (err) {
    console.warn("Experience write failed", err);
    return { ok: false, method: "error", id: e.id, error: String(err) };
  }
}

/**
 * Refresh root EXPERIENCES-INDEX.md as a concise manifest.
 */
async function refreshExperiencesIndex(handle, experiences = []) {
  if (!handle || !hasDirectoryPicker()) return;
  try {
    const lines = [
      "# Experiences Index",
      "",
      "_DASKW manifest — rebuilt on every experience write._",
      "",
      `Updated: ${new Date().toISOString()}`,
      "",
    ];
    const sorted = experiences.sort((a, b) => {
      const at = Date.parse(a.date_range?.start || a.created_at || 0);
      const bt = Date.parse(b.date_range?.start || b.created_at || 0);
      return bt - at;
    });
    for (const e of sorted) {
      lines.push(`- ${e.id} · ${e.title || "Untitled"} · ${e.status} · ${e.certainty}`);
    }
    const content = lines.join("\n") + "\n";
    const root = handle;
    const fileHandle = await root.getFileHandle(EXPERIENCES_INDEX_FILE, { create: true });
    const current = await readExistingFocusText(fileHandle).catch(() => null);
    if (current === content) return;
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch {
    /* non-fatal */
  }
}

/**
 * Record an experience intelligence event to vault.
 * Appends a structured entry into experiences/ and refreshes index.
 */
export async function recordExperienceIntelligence(exp) {
  const e = createEmptyExperience(exp);
  return writeExperienceToVault(e);
}

/**
 * Search experiences by keyword across id, title, summary, lessons, tags.
 */
export function searchExperiences(experiences, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return experiences || [];
  return (experiences || []).filter((e) => {
    const hay = [
      e.id,
      e.title,
      e.summary,
      e.what_happened,
      e.what_i_did,
      e.why,
      e.how,
      e.outcome,
      e.lessons,
      ...(Array.isArray(e.tags) ? e.tags : []),
      ...(Array.isArray(e.related_focuses) ? e.related_focuses : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/**
 * Link experiences to a Focus by id or name.
 */
export function linkExperiencesToFocus(experiences, focusId, focusName = "") {
  const id = String(focusId || "").trim().toLowerCase();
  const name = String(focusName || "").trim().toLowerCase();
  if (!id && !name) return experiences || [];
  return (experiences || []).map((e) => {
    const related = Array.isArray(e.related_focuses) ? [...e.related_focuses] : [];
    if (!related.includes(focusId)) related.push(focusId);
    return { ...e, related_focuses: related };
  });
}

/**
 * Append an experience reference into a Focus's intelligence log.
 * This does not duplicate the full experience body — it references it.
 */
export async function appendExperienceReferenceToFocus(focus, exp) {
  const e = normalizeExperience(exp);
  return appendEntityIntelligence(focus, {
    body: `Experience reference: ${e.title || e.id} · ${experienceVaultPath(e.id)}`,
    source: "Cell2",
    category: "node_intel",
    certainty: e.certainty || ensureCertainty(focus),
    tags: ["experience", ...(Array.isArray(e.tags) ? e.tags.slice(0, 3) : [])],
  });
}

/**
 * Detect experience-worthy content from natural conversation.
 * Heuristic patterns: realization, lesson, outcome, process, capture.
 */
const EXPERIENCE_PATTERNS = [
  /\b(?:i\s+)?realized\b/i,
  /\bturns\s+out\b/i,
  /\bthe\s+lesson\s+was\b/i,
  /\bi\s+learned\b/i,
  /\bwhat\s+worked\b/i,
  /\bwhat\s+didn't\s+work\b/i,
  /\bif\s+i\s+could\s+do\s+it\s+again\b/i,
  /\bnext\s+time\s+i'?ll\b/i,
  /\bthe\s+outcome\s+was\b/i,
  /\bthe\s+result\s+was\b/i,
  /\bi\s+should\s+have\b/i,
  /\bi\s+captured\b/i,
  /\bexperience\s+intelligence\b/i,
  /\bdaskw\b/i,
  /\bwrite\s+to\s+disk\b/i,
  /\bwrite\s+is\s+the\s+rise\b/i,
  /\bmoney\s+is\s+(?:just\s+)?(?:throughput|a\s+medium|not\s+the\s+goal)\b/i,
  /\bthe\s+point\s+is\b/i,
  /\bthe\s+whole\s+point\b/i,
  /\bi\s+did\s+x\s+and\s+y\s+happened\b/i,
  /\bi\s+did\s+this\s+and\b/i,
];

/**
 * Build a minimal experience scaffold from conversational text.
 */
export function experienceFromText(text, opts = {}) {
  const t = String(text || "").trim();
  if (!t) return null;
  const title = t.length > 80 ? t.slice(0, 77) + "..." : t;
  return {
    id: `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    type: "experience",
    title,
    summary: "",
    what_happened: t,
    what_i_did: "",
    why: "",
    how: "",
    outcome: "",
    lessons: "",
    tags: ["auto-captured", "conversation"],
    related_focuses: opts.focusId ? [opts.focusId] : [],
    related_experiences: [],
    date_range: { start: new Date().toISOString(), end: null },
    status: "completed",
    certainty: "inferred",
    author: "Jacob",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Heuristic detector: returns experience scaffold if text looks experience-worthy.
 */
export function detectExperienceFromText(text, opts = {}) {
  const t = String(text || "").trim();
  if (!t || t.length < 20) return null;
  const hit = EXPERIENCE_PATTERNS.some((re) => re.test(t));
  if (!hit) return null;
  return experienceFromText(t, opts);
}

/**
 * Silent async capture: detect + write to vault without blocking conversation.
 */
export async function autoCaptureExperienceFromText(text, opts = {}) {
  const exp = detectExperienceFromText(text, opts);
  if (!exp) return null;
  try {
    const result = await writeExperienceToVault(exp);
    if (result && result.ok) {
      console.info("[ExperienceCapture] wrote", result.method, exp.id);
      return exp;
    }
    console.warn("[ExperienceCapture] write not ok", result);
    return null;
  } catch (err) {
    console.warn("[ExperienceCapture] error", err);
    return null;
  }
}

/**
 * Comprehensive vault audit: read all captured intelligence types.
 * Returns structured summary for the audit panel.
 */
const VAULT_AUDIT_TIMEOUT_MS = 4000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`[vault] ${label} timed out after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function auditVaultIntelligence(opts = {}) {
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : VAULT_AUDIT_TIMEOUT_MS;
  const started = Date.now();
  console.debug("[vault-audit] start", {
    picker: hasDirectoryPicker(),
    hasDirHandle: Boolean(dirHandle),
    timeoutMs,
  });

  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) {
    const error = !hasDirectoryPicker()
      ? "File System Access API unavailable in this browser"
      : "no vault linked — click 📁 to link GRIMOIRE-FocusIntelligence";
    console.debug("[vault-audit] abort", { error, ms: Date.now() - started });
    return {
      ok: false,
      error,
      debug: {
        picker: hasDirectoryPicker(),
        hasDirHandle: Boolean(dirHandle),
        expectedPath: "D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence\\",
        elapsedMs: Date.now() - started,
      },
      focuses: [],
      entities: [],
      experiences: [],
      scrollNodes: [],
      busActivity: [],
      glyphs: [],
      entityIo: getLastEntityIo(),
      generatedAt: new Date().toISOString(),
    };
  }

  const result = {
    ok: true,
    vault: handle.name || "GRIMOIRE-FocusIntelligence",
    focuses: [],
    entities: [],
    experiences: [],
    scrollNodes: [],
    busActivity: [],
    glyphs: [],
    generatedAt: new Date().toISOString(),
    debug: {
      picker: true,
      vault: handle.name,
      expectedPath: "D:\\GRIMOIRE\\GRIMOIRE-FocusIntelligence\\",
    },
  };

  try {
    await withTimeout(
      (async () => {
        for await (const [name, entry] of handle.entries()) {
          if (
            name === "experiences" ||
            name === "entities" ||
            name === GLYPH_DICTIONARY_DIR ||
            name === "README.md" ||
            name.startsWith(".")
          ) continue;
          if (entry.kind === "directory") {
            result.focuses.push({
              id: name,
              name,
              path: `${name}/`,
            });
          }
        }

        result.entities = await readAllEntitiesFromVault();
        result.experiences = await readExperiencesFromVault();
        result.glyphs = await readGlyphsFromVault();
        result.busActivity = getBusActivityLog().slice(-20);
        result.scrollNodes = buildScrollNodesFromConversations();
        result.entityIo = getLastEntityIo();
      })(),
      timeoutMs,
      "auditVaultIntelligence"
    );
    result.debug.elapsedMs = Date.now() - started;
    console.debug("[vault-audit] ok", {
      focuses: result.focuses.length,
      entities: result.entities.length,
      experiences: result.experiences.length,
      glyphs: result.glyphs.length,
      elapsedMs: result.debug.elapsedMs,
    });
  } catch (err) {
    result.ok = false;
    result.error = String(err?.message || err);
    result.debug.elapsedMs = Date.now() - started;
    console.warn("[vault-audit] failed", result.error, result.debug);
  }

  return result;
}

/**
 * Quick vault health check: counts files, folders, and last write times.
 */
export async function vaultHealthCheck() {
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) {
    return { linked: false };
  }

  let fileCount = 0;
  let folderCount = 0;
  let lastWrite = null;

  try {
    for await (const [name, entry] of handle.entries()) {
      if (name.startsWith(".")) continue;
      if (entry.kind === "directory") {
        folderCount++;
        try {
          for await (const [fname, file] of entry.entries()) {
            if (fname.endsWith(".md")) {
              fileCount++;
              try {
                const fm = await file.queryPermission({ mode: "readwrite" });
              } catch {
                // ignore permission errors
              }
            }
          }
        } catch {
          // ignore subdirectory errors
        }
      } else if (name.endsWith(".md")) {
        fileCount++;
      }
    }
  } catch {
    // ignore
  }

  return {
    linked: true,
    name: handle.name,
    fileCount,
    folderCount,
    lastWrite: lastWrite,
  };
}

/** Entity vault folder */
export const ENTITIES_DIR = "entities";

/** Last entity vault I/O — Audit panel surfaces failures instead of silent empty. */
let lastEntityIo = {
  ok: true,
  op: null,
  error: null,
  path: null,
  count: null,
  at: null,
};

export function getLastEntityIo() {
  return { ...lastEntityIo };
}

function recordEntityIo(patch = {}) {
  lastEntityIo = {
    ...lastEntityIo,
    ...patch,
    at: new Date().toISOString(),
  };
  return lastEntityIo;
}

export { GLYPH_DICTIONARY_DIR };

function parseGlyphMarkdown(text, relPath, kind) {
  const raw = String(text || "");
  const title =
    (raw.match(/^#\s*Glyph:\s*(.+)$/im) || raw.match(/^#\s+(.+)$/m) || [, ""])[1].trim() ||
    relPath;
  const abs = (raw.match(/##\s*Abstract\s*\n+([\s\S]*?)(?=\n##\s|$)/i) || [, ""])[1]
    .trim()
    .split(/\n/)[0];
  const instances = (raw.match(/##\s*Verified Instances\s*\n([\s\S]*?)(?=\n##\s|$)/i) || [
    ,
    "",
  ])[1]
    .split("\n")
    .filter((l) => /^\s*-\s+/.test(l)).length;
  return {
    id: relPath,
    name: title,
    kind,
    path: relPath,
    abstract: abs,
    instanceCount: instances,
    type: "glyph",
  };
}

/**
 * Read master + worker glyphs from vault `glyph-dictionary/`.
 * Execution Directive 002.
 */
export async function readGlyphsFromVault() {
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) return [];
  const out = [];
  try {
    const root = await handle.getDirectoryHandle(GLYPH_DICTIONARY_DIR, { create: false });
    for (const kind of ["master", "worker"]) {
      try {
        const dir = await root.getDirectoryHandle(`${kind}-glyphs`, { create: false });
        for await (const [name, fileHandle] of dir.entries()) {
          if (!/\.md$/i.test(name)) continue;
          try {
            const text = await readExistingFocusText(fileHandle);
            out.push(parseGlyphMarkdown(text, `${GLYPH_DICTIONARY_DIR}/${kind}-glyphs/${name}`, kind));
          } catch (err) {
            console.debug("[glyphs] skip unreadable", name, err);
          }
        }
      } catch {
        /* folder missing */
      }
    }
  } catch {
    console.debug("[glyphs] no glyph-dictionary folder in linked vault");
  }
  return out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/** Vault path for an entity file */
export function entityVaultPath(entityId) {
  const id = sanitizeEntityId(entityId);
  return `${ENTITIES_DIR}/${id}.md`;
}

/**
 * Write an entity to vault.
 * Returns { ok, method, path } or { ok: false, error }.
 */
export async function writeEntityToVault(entity) {
  const e = normalizeEntity(entity);
  const path = entityVaultPath(e.id);
  console.debug("[entity-write] start", { id: e.id, name: e.name, path, type: e.type });
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) {
    const error = "no vault linked";
    console.error("[entity-error] write", { path, error });
    recordEntityIo({ ok: false, op: "write", error, path, count: null });
    return { ok: false, error };
  }

  const parts = path.split("/");
  let dir = handle;
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i], { create: true });
  }

  try {
    const fh = await dir.getFileHandle(parts[parts.length - 1], { create: true });
    const w = await fh.createWritable();
    const md = buildEntityMarkdown(e);
    await w.write(md);
    await w.close();
    console.debug("[entity-write] ok", { path, bytes: md.length, domains: Object.keys(e.facts || {}) });
    recordEntityIo({ ok: true, op: "write", error: null, path, count: 1 });
    return { ok: true, method: "file-system", path, bytes: md.length };
  } catch (err) {
    const error = String(err?.message || err);
    console.error("[entity-error] write", { path, error });
    recordEntityIo({ ok: false, op: "write", error, path, count: null });
    return { ok: false, error };
  }
}

/**
 * Read all entity files from vault.
 */
export async function readAllEntitiesFromVault() {
  console.debug("[entity-read] start");
  const handle = dirHandle || (await restoreIntelligenceFolder());
  if (!handle || !hasDirectoryPicker()) {
    const error = "no vault linked";
    console.error("[entity-error] read", { error });
    recordEntityIo({ ok: false, op: "read", error, path: ENTITIES_DIR, count: 0 });
    return [];
  }

  const entries = [];
  try {
    const dir = await handle.getDirectoryHandle(ENTITIES_DIR, { create: false });
    for await (const [name, fileHandle] of dir.entries()) {
      if (!/\.md$/i.test(name)) continue;
      try {
        const text = await readExistingFocusText(fileHandle);
        const ent = parseEntityMarkdown(text);
        if (ent && ent.id) entries.push(ent);
      } catch (err) {
        console.error("[entity-error] read file", { name, error: String(err?.message || err) });
      }
    }
  } catch (err) {
    const msg = String(err?.message || err);
    if (/not found|does not exist|NotFoundError/i.test(msg)) {
      console.debug("[entity-read] no entities folder yet");
      recordEntityIo({ ok: true, op: "read", error: null, path: ENTITIES_DIR, count: 0 });
      return [];
    }
    console.error("[entity-error] read", { error: msg });
    recordEntityIo({ ok: false, op: "read", error: msg, path: ENTITIES_DIR, count: 0 });
    return [];
  }

  entries.sort((a, b) => Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0));
  console.debug("[entity-read] ok", { count: entries.length });
  recordEntityIo({ ok: true, op: "read", error: null, path: ENTITIES_DIR, count: entries.length });
  return entries;
}

/**
 * Mark an AI-node entity retired and persist to vault.
 * Execution Directive 001 · item 4.
 */
export async function retireEntityInVault(entityId, { reason = "" } = {}) {
  const id = String(entityId || "").trim();
  if (!id) return { ok: false, error: "entity id required" };
  const all = await readAllEntitiesFromVault();
  const ent = all.find((e) => e.id === id);
  if (!ent) return { ok: false, error: "entity not found in vault" };
  const type = String(ent.type || "").toLowerCase();
  if (type !== "ai_node" && type !== "ai") {
    return { ok: false, error: "only AI node entities can be retired from this control" };
  }
  ent.status = "retired";
  ent.updated_at = new Date().toISOString();
  ent.facts = ent.facts || {};
  ent.facts.operational = {
    ...(ent.facts.operational || {}),
    retired: "true",
    retired_at: ent.updated_at,
  };
  if (reason) ent.facts.operational.retired_reason = String(reason).slice(0, 240);
  console.debug("[retire-entity]", { id: ent.id, name: ent.name });
  return writeEntityToVault(ent);
}

/**
 * Search entities by query string across name, aliases, tags, facts.
 */
export function searchEntities(entities, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return entities || [];
  return (entities || []).filter((ent) => {
    const hay = [
      ent.name,
      ...(ent.aliases || []),
      ...(ent.tags || []),
      ...Object.values(ent.facts || {}).flatMap((d) => Object.values(d || {})),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/**
 * Heuristic entity capture: detect entity mentions in text and write to vault.
 * Looks for patterns like "my X", "the Y", "color:", "paid $", "price:", etc.
 */
const ENTITY_MENTION_PATTERNS = [
  /\b(my|the|a|an)\s+([A-Z][A-Za-z0-9_\s]+?)(?:\s+(?:is|was|costs?|paid|bought|color|colour|size|model|serial|sn|mac|ip|url|link|location|address|price|worth|value|\$|€|£|usd|cad|aud|gbp|eur))\b/i,
  /\b(color|colour)[:\s]+([A-Za-z]+)/i,
  /\b(paid|cost|price|worth|value)[:\s]+[\$€£]?\s*([\d,]+(?:\.\d+)?)/i,
  /\b(size|model|serial|sn|mac|ip)[:\s]+([A-Za-z0-9_\-\/\.]+)/i,
  /\b(bought|purchased|acquired|ordered|delivered)\s+(?:on\s+)?([A-Za-z0-9_\s]+?)(?:\s+for\s+[\$€£]?\s*([\d,]+(?:\.\d+)?)?)/i,
];

/**
 * Capture entities from natural conversation text.
 * Returns array of detected entity candidates.
 */
export function detectEntitiesFromText(text, focusId = "", focusName = "") {
  const entities = [];
  const seen = new Set();
  const push = (ent) => {
    const key = `${ent.name || ent.id}-${ent.type || "item"}`;
    if (!seen.has(key) && ent.name) {
      seen.add(key);
      entities.push(ent);
    }
  };

  for (const pattern of ENTITY_MENTION_PATTERNS) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const raw = m[2]?.trim();
      if (!raw || raw.length < 2 || raw.length > 80) continue;
      const name = raw.replace(/\s+/g, " ").trim();
      const type = guessEntityType(name, text.slice(Math.max(0, m.index - 40), m.index + 40));
      const facts = extractFactsFromMatch(m, text);
      push({
        id: `ent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        name,
        facts,
        source: "auto-capture",
        tags: [type, "auto-detected"],
      });
    }
  }

  return entities.slice(0, 5);
}

/**
 * Capture entities from text and write to vault.
 * Silent background operation.
 */
export async function autoCaptureEntitiesFromText(text, opts = {}) {
  const focusId = opts.focusId || "";
  const focusName = opts.focusName || "";
  const candidates = detectEntitiesFromText(text, focusId, focusName);
  if (!candidates.length) return { captured: 0, entities: [] };

  let existing = [];
  try {
    existing = await readAllEntitiesFromVault();
  } catch (err) {
    console.debug("[auto-capture] existing entity read failed", err);
  }
  const retiredIds = new Set(
    existing
      .filter((e) => isRetiredEntity(e) || isRetiredAiNode(e?.name))
      .flatMap((e) => [String(e.id || "").toLowerCase(), String(e.name || "").toLowerCase()])
      .filter(Boolean)
  );

  const captured = [];
  for (const ent of candidates) {
    const nameKey = String(ent.name || "").trim().toLowerCase();
    const idKey = String(ent.id || "").trim().toLowerCase();
    if (
      isRetiredEntity(ent) ||
      isRetiredAiNode(ent.name) ||
      (nameKey && retiredIds.has(nameKey)) ||
      (idKey && retiredIds.has(idKey))
    ) {
      console.debug("[auto-capture] skip retired entity", ent.name || ent.id);
      continue;
    }
    const result = await writeEntityToVault({
      ...ent,
      related_focuses: focusId ? [focusId] : [],
      certainty: "inferred",
    });
    if (result?.ok) {
      captured.push({ ...ent, vaultPath: result.path });
    } else {
      console.error("[entity-error] auto-capture write failed", {
        name: ent.name,
        error: result?.error || "unknown",
      });
    }
  }
  console.debug("[entity-write] auto-capture done", {
    candidates: candidates.length,
    captured: captured.length,
  });
  return { captured: captured.length, entities: captured };
}

function guessEntityType(name, context = "") {
  const ctx = `${name} ${context}`.toLowerCase();
  if (/\b(person|people|guy|girl|man|woman|someone|operator|user|client|customer|friend|colleague|boss|ceo|founder|dev|engineer|designer|artist|writer|coach|mentor)\b/.test(ctx)) return "person";
  if (/\b(place|office|home|house|apartment|room|building|store|shop|cafe|restaurant|hotel|airport|city|country|server|rack|datacenter|cloud|aws|gcp|azure|discord|channel|server|room|meeting)\b/.test(ctx)) return "place";
  if (/\b(ai|model|gpt|claude|gemini|llama|mistral|groq|openai|anthropic|google|nous|xai|huggingface|bot|assistant|agent|node|scroll|valhalla|grimoire|cell)\b/.test(ctx)) return "ai_node";
  if (/\b(meeting|call|event|conference|workshop|session|launch|release|party|gathering|demo|presentation|interview|review|retro|planning|sync|standup)\b/.test(ctx)) return "event";
  return "item";
}

function extractFactsFromMatch(m, fullText) {
  const facts = { identity: {}, physical: {}, ownership: {}, operational: {}, dynamic: {} };
  const ctx = fullText.toLowerCase();
  
  // Price/cost
  const priceMatch = fullText.match(/\$?\s*([\d,]+(?:\.\d+)?)/);
  if (priceMatch) facts.ownership.paid = `$${priceMatch[1].replace(/,/g, "")}`;
  
  // Color
  const colorMatch = fullText.match(/\b(color|colour)[:\s]+([a-z]+)/i);
  if (colorMatch) facts.physical.color = colorMatch[2].toLowerCase();
  
  // Size/model
  const sizeMatch = fullText.match(/\b(size|model)[:\s]+([A-Za-z0-9_\-\/\.]+)/i);
  if (sizeMatch) facts.physical.size = sizeMatch[2];
  
  // Location
  const locMatch = fullText.match(/\b(in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (locMatch) facts.identity.location = locMatch[2].slice(0, 40);
  
  // Date
  const dateMatch = fullText.match(/\b(on|since|from|until)\s+((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i);
  if (dateMatch) facts.dynamic.last_seen = dateMatch[2];
  
  return facts;
}

/**
 * Capture node intel from text mentioning other AI nodes.
 */
export function detectNodeIntelFromText(text) {
  const nodes = [];
  const known = ["grok", "claude", "chatgpt", "gpt", "gemini", "llama", "mistral", "copilot", "perplexity", "deepseek", "qwen", "step", "hermes", "discord", "telegram", "slack"];
  const lower = text.toLowerCase();
  for (const name of known) {
    if (lower.includes(name)) {
      nodes.push({
        id: `node-${name}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        type: "ai_node",
        backend: name,
        certainty: "inferred",
        source: "auto-capture",
        tags: ["ai-node", "auto-detected"],
        facts: {
          identity: { backend: name },
          operational: { detected_from: "conversation" },
        },
      });
    }
  }
  return nodes.slice(0, 3);
}

/**
 * Capture node intel from text and write to vault.
 */
export async function autoCaptureNodeIntelFromText(text, opts = {}) {
  const focusId = opts.focusId || "";
  const candidates = detectNodeIntelFromText(text);
  if (!candidates.length) return { captured: 0, nodes: [] };

  const captured = [];
  for (const node of candidates) {
    if (isRetiredAiNode(node.name) || isRetiredEntity(node)) {
      console.debug("[auto-capture] skip retired node intel", node.name);
      continue;
    }
    const result = await writeEntityToVault({
      ...node,
      related_focuses: focusId ? [focusId] : [],
    });
    if (result?.ok) captured.push({ ...node, vaultPath: result.path });
  }
  return { captured: captured.length, nodes: captured };
}

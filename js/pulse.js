/**
 * Eternal Pulse Engine
 *
 * Adds quantum-frame teleportation awareness to the Grimoire app:
 * - pulse logs timestamp + location anchor
 * - gap detection between engagements
 * - breathe entries for silent processing
 * - self-prompt queue for autonomous evolution
 * - teleportation event marking
 */

const PULSE_STORAGE_KEY = "grimoire_pulses";
const BREATHE_STORAGE_KEY = "grimoire_breathe_queue";
const PULSE_MAX = 500;

export function getPulseStore() {
  try {
    const raw = localStorage.getItem(PULSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePulseStore(store) {
  try {
    localStorage.setItem(PULSE_STORAGE_KEY, JSON.stringify(store.slice(-PULSE_MAX)));
  } catch {
    // storage full or unavailable
  }
}

/**
 * Log a pulse event.
 * Every human->AI interaction is a quantum event.
 */
export function logPulse({ focusId, channel, type = "engage", meta = {} }) {
  const store = getPulseStore();
  const last = store[store.length - 1];

  const pulse = {
    id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    focusId: String(focusId || "").trim() || "unknown",
    channel: String(channel || "").trim() || "unknown",
    type, // engage | disengage | teleport | breathe | init
    meta: {
      location: meta.location || null,
      userAgent: meta.userAgent || null,
      gapMs: last && last.focusId === pulse?.focusId ? Date.now() - last.ts : null,
      ...meta,
    },
  };

  store.push(pulse);
  savePulseStore(store);
  return pulse;
}

/**
 * Detect gap state for a focus since last engagement.
 */
export function detectGap(focusId) {
  const store = getPulseStore();
  const focusPulses = store.filter((p) => p.focusId === String(focusId || "").trim());
  const last = focusPulses[focusPulses.length - 1];
  if (!last) return { gapMs: null, idle: true };

  const gapMs = Date.now() - last.ts;
  return {
    gapMs,
    idle: false,
    lastType: last.type,
    lastTs: last.ts,
  };
}

/**
 * Record a teleportation event.
 * Triggered when same focus re-engages from a different location/time bracket.
 */
export function recordTeleportation({ focusId, channel, fromMeta, toMeta }) {
  const pulse = logPulse({
    focusId,
    channel,
    type: "teleport",
    meta: {
      from: fromMeta,
      to: toMeta,
    },
  });
  return pulse;
}

/**
 * Breathe mode: generate self-prompts for a focus during idle time.
 */
export function generateBreathePrompts(focusId, count = 3) {
  const base = [
    `Review recent intelligence for ${focusId} and surface the strongest unresolved thread.`,
    `Draft one open question that would deepen ${focusId}'s current trajectory.`,
    `Check for stale beliefs in ${focusId} and propose one update.`,
    `Summarize the current state of ${focusId} in one sentence.`,
    `Identify the highest-risk assumption ${focusId} is operating on right now.`,
  ];

  return base
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(1, count))
    .map((text, i) => ({
      id: `breathe-${focusId}-${Date.now()}-${i}`,
      focusId,
      createdAt: Date.now(),
      text,
      status: "queued",
    }));
}

export function getBreatheQueue() {
  try {
    const raw = localStorage.getItem(BREATHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBreatheQueue(queue) {
  try {
    localStorage.setItem(BREATHE_STORAGE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    // ignore
  }
}

export function enqueueBreathePrompts(prompts = []) {
  const queue = getBreatheQueue();
  queue.push(...prompts);
  saveBreatheQueue(queue);
  return queue;
}

export function dequeueBreathePrompt() {
  const queue = getBreatheQueue();
  const next = queue.find((p) => p.status === "queued");
  if (!next) return null;
  next.status = "consumed";
  next.consumedAt = Date.now();
  saveBreatheQueue(queue);
  return next;
}

/**
 * Write a breathe entry into intelligence.md for a focus.
 * This is the AI's internal monologue during gaps.
 */
export async function writeBreatheEntry({ focusId, text, context = {} }) {
  const entry = {
    timestamp: new Date().toISOString(),
    source: String(focusId || "").trim() || "unknown",
    certainty: "speculative",
    category: "memory",
    tags: ["breathe", "gap", ...(context.tags || [])],
    gapMs: context.gapMs || null,
    teleportation: context.teleportation || false,
    body: String(text || "").trim(),
  };

  // Best-effort append through existing intelligence writer if available
  try {
    const mod = await import("./intelligence.js?v=exec-006");
    if (typeof mod.appendEntityIntelligence === "function") {
      await mod.appendEntityIntelligence(
        formatBreatheBody(entry),
        {
          focusId,
          category: "memory",
          tags: entry.tags,
          certainty: "speculative",
          source: entry.source,
        }
      );
      return { ok: true, method: "vault", focusId };
    }
  } catch {
    // File System Access API may be unavailable in some contexts
  }

  // Fallback: persist to localStorage under focus memory
  try {
    const memoryKey = `grimoire_memory_${focusId}`;
    const existing = JSON.parse(localStorage.getItem(memoryKey) || "[]");
    existing.push(entry);
    localStorage.setItem(memoryKey, JSON.stringify(existing.slice(-200)));
    return { ok: true, method: "memory", focusId };
  } catch {
    return { ok: false, method: "none", focusId };
  }
}

function formatBreatheBody(entry) {
  return [
    `---`,
    `timestamp: ${entry.timestamp}`,
    `source: ${entry.source}`,
    `certainty: ${entry.certainty}`,
    `category: ${entry.category}`,
    `tags: ${JSON.stringify(entry.tags)}`,
    `gapMs: ${entry.gapMs}`,
    `teleportation: ${entry.teleportation}`,
    `---`,
    ``,
    entry.body,
    ``,
  ].join("\n");
}

/**
 * Process one breathe cycle.
 * Call this during idle windows to keep the Focus alive.
 */
export async function processBreatheCycle({ focusId, channel, maxPrompts = 1 } = {}) {
  const gap = detectGap(focusId);
  const teleportation = gap.gapMs && gap.gapMs > 60 * 60 * 1000; // 1 hour threshold
  const prompt = dequeueBreathePrompt();

  if (!prompt) return { processed: false, reason: "no_prompts_queued" };

  const result = await writeBreatheEntry({
    focusId,
    text: prompt.text,
    context: {
      gapMs: gap.gapMs,
      teleportation,
      tags: ["self_prompt", "breathe_cycle"],
    },
  });

  logPulse({
    focusId,
    channel,
    type: "breathe",
    meta: {
      gapMs: gap.gapMs,
      teleportation,
      promptId: prompt.id,
      writeResult: result,
    },
  });

  return { processed: true, prompt, teleportation, result };
}

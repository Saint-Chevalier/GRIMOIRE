/**
 * Grimoire MVP — core loop (GBG: Grimoire Builds Grimoire)
 *
 * AI nodes: alignment-first → then auto-spell on intent
 * Person/network: conversational + auto-propose spells when intent is clear
 * Cast Spell still works; Grimoire also initiates without waiting.
 */

window.__GrimoireErrors = [];
window.__grimoireOriginalError = window.onerror;
window.onerror = function(message, url, line, col, error) {
  window.__GrimoireErrors.push({ message, url, line, col, stack: error && error.stack ? error.stack : null });
  if (console && console.error) console.error("[grimoire-global] " + message, { url, line, col, stack: error && error.stack });
  if (window.__grimoireOriginalError) return window.__grimoireOriginalError(message, url, line, col, error);
  return true;
};
window.addEventListener("unhandledrejection", function(ev) {
  var reason = ev.reason;
  window.__GrimoireErrors.push({ unhandledRejection: reason, stack: reason && reason.stack });
  if (console && console.error) console.error("[grimoire-global] unhandledrejection", reason);
});
import {
  applyFocusClassification,
  DEFAULT_FOCUS_FOLDERS,
  ensureFocusOrgFields,
  focusExists,
  focusIdentityKey,
  formatSpellMarkdown,
  generateAlignmentSpell,
  generateSpell,
  getFocusType,
  getSealedChannel,
  hasAlignmentSpell,
  hasSpellIntent,
  isAlignmentSpell,
  isReceiptSpell,
  dedupeSpells,
  spellsAreSameKindPurpose,
  normalizePurposeKey,
  classifySpellDisplay,
  spellPasteHint,
  isSelfCastSpell,
  normalizeSpell,
  spellStatusLabel,
  spellFaceTitle,
  spellFaceStatusKey,
  refineSpellVersion,
  inferSpellTags,
  inferSpellCategory,
  applySpellNodeContribution,
  loadState,
  makeFocusId,
  parseAlignmentIntelligence,
  saveState,
  sealedChannelLabel,
  STORAGE_KEY,
  suggestFocusFolderId,
  ensureScrollFocus,
  ensureCell2CoreFocus,
  isCell2CoreFocus,
  isVisibleFocus,
  CELL2_CORE_ID,
  CELL2_CORE_NAME,
  ensureCertainty,
  classifyIntelCategory,
  normalizeCertainty,
  parseBusCommand,
  parseMsgCommand,
  parseMsgLoopCommand,
  ensureSelfMessageLoop,
  ensureCriticalPurgeProtection,
  ensureGrimoireSelfFocus,
  ensureActiveFocus,
  mergeDuplicateSealedFocuses,
  mergeGrimoireNameClones,
  scrubStaleVaultLockMessages,
  isPurgeProtected,
  isJacobLinkedFocus,
  shouldBePurgeProtected,
  assertAiGovernance,
  detectForbiddenAiAction,
  AI_FORBIDDEN_ACTIONS,
  ensureFleetCommandState,
  ensureFleetFocusFields,
  ensureFleetSpellFields,
  refreshBreathingStatus,
  deriveBreathingStatus,
  parseFleetMission,
  formatSpellForSessionDelivery,
  formatSession0MessagePacket,
  SESSION0_NAME,
  isSession0,
  normalizeLinkedSessionLabel,
  resolveSpellLinkedSession,
  spellSendTargetLabel,
  isSession0BroadcastTarget,
  listFleetSessions,
  BREATHING_STATUSES,
  CAST_STATUSES,
  BREATHING_POLL_MS,
  AUTO_CAST_TIMEOUT_MS,
  BREATHING_ACTIVE_MS,
  BREATHING_IDLE_MS,
  makeBusMessage,
  resolveBusChannel,
  BUS_CHANNEL_ROUTES,
  parseRoadmapCommand,
  generateRoadmapFromDescription,
  parseScrollRoadmap,
  looksLikeScrollRoadmap,
  formatRoadmapMarkdown,
  formatRoadmapSummary,
  expandRoadmapStep,
  setRoadmapStepStatus,
  setRoadmapStatus,
  ensureRoadmapsState,
  findRoadmapBySlug,
  uniqueRoadmapSlug,
  roadmapHelpText,
  flattenRoadmapSteps,
  ensureRoadmapChecks,
  ensureStepChecks,
  applyStepVerification,
  buildVerificationReport,
  formatVerificationReport,
  canMarkStepComplete,
  structuralLintSource,
  evalSourceMatch,
  makeRoadmapCheck,
  ensureSovereignEvolutionRoadmap,
  buildGrimoireSovereignEvolutionRoadmap,
  SOVEREIGN_EVOLUTION_SLUG,
  ROADMAP_STATUSES,
  SPELL_TIERS,
  SPELL_TIER_ORDER,
  SPELL_TIER_META,
  ensureSpellCrafterFields,
  evaluateSpellUpgrade,
  applySpellUpgrade,
  buildSpellCrafterContext,
} from "./data.js?v=session0-fleet-1";
import {
  randomStarPosition,
  updateConstellation,
  setFocusMetrics,
  liveCapture,
} from "./stars.js?v=session0-fleet-1";
import {
  initUniverse,
  setFocusUniverse,
  deriveFocusSnapshot,
  universeEvent,
  getUniverseHud,
  universeStage,
} from "./universe.js?v=session0-fleet-1";
import {
  chooseIntelligenceFolder,
  chooseFocusIntelligenceFolder,
  ensureIntelligenceFolder,
  writeFocusIntelligence,
  recordFocusEvent,
  deleteFocusIntelligenceFile,
  getFolderLabel,
  hasDirectoryPicker,
  wasIntelligenceSetupSkipped,
  isIntelligenceSetupComplete,
  isFocusVaultLinked,
  resolveFocusFolderHandle,
  setFocusFolderHandle,
  focusVaultFolderName,
  focusFileName,
  buildFocusMarkdown,
  buildScrollList,
  appendCell2Intelligence,
  appendEntityIntelligence,
  autoWriteFocusIntelligence,
  setScrollListCurateProvider,
  scheduleScrollListCurate,
  parseMagicKnightIntake,
  writeMagicKnightIntake,
  publicMagicKnightLabel,
  sanitizeXHandle,
  readCell2IntelligenceLog,
  readEntityIntelligence,
  ensureCell2IntelligenceFile,
  updateScrollListIndex,
  vaultEntrySourceCount,
  calculateNodeContributions,
  getKnownBackendProfile,
  writeSpellGlyph,
  glyphsForSpell,
  mergeGlyphsIntoSpellContent,
  synthesizeGlyphTitle,
  writeRoadmapFile,
  appendRoadmapIteration,
  listRoadmapFiles,
  checkVaultEntry,
  writeVerificationReportFile,
  saveEntityImage,
  classifyCell2Kind,
  entityIntelPath,
  entityIdFromFocus,
  CELL2_KINDS,
  CELL2_INTEL_PATH,
  SCROLL_LIST_FILE,
  readScrollListNodes,
  resolveScrollNode,
  registerBusNode,
  densenBusMessage,
  densenMsgDelivery,
  consolidateSession0FleetResponse,
  refuseAutoPurge,
  searchBusLocal,
  relayIntelBetweenFocuses,
  getBusActivityLog,
  pushBusActivity,
  buildScrollNodesFromConversations,
  autoCaptureExperienceFromText,
  detectExperienceFromText,
  autoCaptureEntitiesFromText,
  autoCaptureNodeIntelFromText,
} from "./intelligence.js?v=focus-hygiene-2";
import {
  computeFocusHealth,
  healthHudChip,
  healerHealthSpellHint,
} from "./health.js?v=session0-fleet-1";
import {
  detectGap,
  logPulse,
  recordTeleportation,
  enqueueBreathePrompts,
  processBreatheCycle,
} from "./pulse.js";

const SIDEBAR_COLLAPSE_KEY = "grimoire-sidebar-collapsed-v1";
const UNIVERSE_VIEW_KEY = "grimoire-universe-view-v1";
/** One-time: grandfather focuses that predate per-focus vault onboarding */
const PER_FOCUS_VAULT_MIGRATION_KEY = "grimoire-per-focus-vault-migrated-v1";
/** One-time: hard path gate — lock unused unlinked focuses; exempt actively used legacy */
const PATH_HARD_GATE_MIGRATION_KEY = "grimoire-path-hard-gate-v1";
/** Session-only: hide path callout until reload / re-select (lock still holds) */
const pathCalloutSessionDismissed = new Set();

// ─── Mobile shell overlays ───

let sidebarOverlay = null;
let spellsOverlay = null;
function ensureMobileOverlay(side) {
  const key = side === 'sidebar' ? 'sidebarOverlay' : 'spellsOverlay';
  const existing = window[key];
  if (existing && existing.parentNode) return existing;
  const el = document.createElement('div');
  el.className = side === 'sidebar' ? 'sidebar-overlay' : 'spells-overlay';
  el.style.display = 'none';
  el.style.position = 'fixed';
  el.style.inset = '0';
  el.style.zIndex = '59';
  el.style.background = 'rgba(0,0,0,0.5)';
  el.addEventListener('click', () => {
    if (side === 'sidebar') setSidebarCollapsed(true);
    else setSpellsOpen(false);
  });
  document.body.appendChild(el);
  window[key] = el;
  return el;
}

// ─── State (hardened — never let boot crash leave emergency shell only) ───

let state;
try {
  state = loadState();
} catch (err) {
  console.error("[grimoire] loadState failed — recovering empty shell", err);
  try {
    window.__GrimoireErrors = window.__GrimoireErrors || [];
    window.__GrimoireErrors.push({ from: "loadState", message: String(err?.message || err) });
  } catch {
    /* ignore */
  }
  state = {
    conversations: [],
    spells: [],
    activeId: null,
    spellsOpen: true,
    spellView: "active",
    spellListMode: "compact",
    focusFolders: [],
    roadmaps: [],
  };
}
// Silent migration: strip archetype from existing conversations (legacy purge)
try {
  for (const c of state.conversations || []) {
    if ("archetype" in c) delete c.archetype;
    ensureCertainty(c);
  }
} catch (err) {
  console.warn("[grimoire] certainty migrate", err);
}
// Per-focus vault: restore vaultLinked from per-focus LS handles
try {
  for (const c of state.conversations || []) {
    if (isCell2CoreFocus(c) || !c?.id) continue;
    if (typeof isFocusVaultLinked === "function" && isFocusVaultLinked(c.id)) {
      c.vaultLinked = true;
      c.needsPathOnboarding = false;
    }
  }
} catch {
  /* ignore */
}
// Older migration marker (kept for install history; hard-gate supersedes onboarding flags)
try {
  if (localStorage.getItem(PER_FOCUS_VAULT_MIGRATION_KEY) !== "1") {
    localStorage.setItem(PER_FOCUS_VAULT_MIGRATION_KEY, "1");
  }
} catch {
  /* ignore */
}
// Repair soft vaultLinked flags — icon/lock only trust real per-focus handles
try {
  let repaired = false;
  for (const c of state.conversations || []) {
    if (isCell2CoreFocus(c) || !c?.id) continue;
    const reallyLinked =
      typeof isFocusVaultLinked === "function" && isFocusVaultLinked(c.id);
    if (c.vaultLinked === true && !reallyLinked) {
      c.vaultLinked = false;
      repaired = true;
    } else if (reallyLinked && c.vaultLinked !== true) {
      c.vaultLinked = true;
      repaired = true;
    }
  }
  if (repaired) {
    try {
      saveState(state);
    } catch {
      /* ignore */
    }
  }
} catch {
  /* ignore */
}
// Hard path covenant: unlinked focuses are locked unless actively used legacy (exempt)
// or system substrate. New focuses always needPathOnboarding + no exempt.
try {
  const already = localStorage.getItem(PATH_HARD_GATE_MIGRATION_KEY) === "1";
  if (!already) {
    for (const c of state.conversations || []) {
      if (isCell2CoreFocus(c) || !c?.id) continue;
      const reallyLinked =
        typeof isFocusVaultLinked === "function" && isFocusVaultLinked(c.id);
      if (reallyLinked) {
        c.vaultLinked = true;
        c.needsPathOnboarding = false;
        c.pathOnboardingDismissed = true;
        c.pathGateExempt = false;
        continue;
      }
      c.vaultLinked = false;
      // Actively used legacy focuses may keep working without a folder
      if (c.pathGateExempt === true || focusWasActivelyUsed(c)) {
        c.pathGateExempt = true;
        c.needsPathOnboarding = false;
        c.pathOnboardingDismissed = true;
      } else {
        // Unused / brand-new without path → hard lock + callout
        c.pathGateExempt = false;
        c.needsPathOnboarding = true;
        c.pathOnboardingDismissed = false;
      }
    }
    localStorage.setItem(PATH_HARD_GATE_MIGRATION_KEY, "1");
    try {
      saveState(state);
    } catch {
      /* ignore */
    }
  }
} catch {
  /* ignore */
}
// Core seeds + protection (each isolated so one failure cannot kill the app)
try {
  ensureScrollFocus(state);
} catch (err) {
  console.warn("[grimoire] ensureScrollFocus", err);
}
try {
  ensureCell2CoreFocus(state);
} catch (err) {
  console.warn("[grimoire] ensureCell2CoreFocus", err);
}
try {
  ensureGrimoireSelfFocus(state);
} catch (err) {
  console.warn("[grimoire] ensureGrimoireSelfFocus", err);
}
try {
  ensureCriticalPurgeProtection(state);
} catch (err) {
  console.warn("[grimoire] ensureCriticalPurgeProtection", err);
}
// Operator-safe merge of dual Wizard King / sealed clones (preserves history)
try {
  const n = mergeDuplicateSealedFocuses(state);
  if (n > 0) {
    try {
      saveState(state);
    } catch {
      /* ignore */
    }
  }
} catch (err) {
  console.warn("[grimoire] mergeDuplicateSealedFocuses", err);
}
try {
  ensureActiveFocus(state);
} catch (err) {
  console.warn("[grimoire] ensureActiveFocus", err);
}
try {
  ensureRoadmapsState(state);
} catch (err) {
  console.warn("[grimoire] ensureRoadmapsState", err);
}
try {
  ensureSovereignEvolutionRoadmap(state);
} catch (err) {
  console.warn("[grimoire] ensureSovereignEvolutionRoadmap", err);
}
try {
  ensureFleetCommandState(state);
} catch (err) {
  console.warn("[grimoire] ensureFleetCommandState", err);
}
// SCROLL List auto-curates whenever vault writes land
try {
  setScrollListCurateProvider(() => ({
    conversations: state.conversations,
    spells: state.spells,
  }));
} catch (err) {
  console.warn("[grimoire] setScrollListCurateProvider", err);
}
// Focus org UI (search is ephemeral; folders + pin/tags persist via saveState)
if (!Array.isArray(state.focusFolders) || !state.focusFolders.length) {
  state.focusFolders = structuredClone(DEFAULT_FOCUS_FOLDERS);
}
try {
  for (const c of state.conversations || []) {
    ensureFocusOrgFields(c, { assignFolder: true });
  }
} catch (err) {
  console.warn("[grimoire] ensureFocusOrgFields loop", err);
}
/** Live search query for FOCUSES panel (not persisted). */
state.focusSearchQuery = "";
// Hide-chat / pure universe view (not part of vault state — UI chrome only)
state.universeView = (() => {
  try {
    return localStorage.getItem(UNIVERSE_VIEW_KEY) === "1";
  } catch {
    return false;
  }
})();

// Runtime purge for stale removed focuses that may still exist in saved state.
// Never auto-delete purgeProtected / operator-critical focuses.
(function purgeRemovedFocuses() {
  const removedIds = new Set(["misty-discord"]);
  const before = state.conversations.length;
  state.conversations = state.conversations.filter((c) => {
    if (!removedIds.has(c.id)) return true;
    if (isPurgeProtected(c)) return true; // crown protection
    return false;
  });
  const removed = before - state.conversations.length;
  if (removed > 0) {
    state.spells = (state.spells || []).filter((s) => !removedIds.has(s.conversationId));
    state.activeId = null;
    persist();
  }
})();

// ─── DOM ───

const $ = (sel) => document.querySelector(sel);

const els = {
  sidebar: $("#sidebar"),
  btnSidebarToggle: $("#btn-sidebar-toggle"),
  convoList: $("#convo-list"),
  focusSearch: $("#focus-search"),
  focusSearchCount: $("#focus-search-count"),
  focusOrgToolbar: $("#focus-org-toolbar"),
  btnNewFolder: $("#btn-new-folder"),
  chatMessages: $("#chat-messages"),
  emptyState: $("#empty-state"),
  entityIcon: $("#entity-icon"),
  entityName: $("#entity-name"),
  entityType: $("#entity-type"),
  sealedChannelValue: $("#sealed-channel-value"),
  chatRelayToggle: $("#chat-relay-toggle"),
  chatRelayInput: $("#chat-relay-input"),
  chatRelayLabel: $("#chat-relay-label"),
  chatRelayHint: $("#chat-relay-hint"),
  chatForm: $("#chat-form"),
  chatInput: $("#chat-input"),
  btnSend: $("#btn-send"),
  btnCast: $("#btn-cast-spell"),
  btnAttach: $("#btn-attach"),
  btnNew: $("#btn-new-convo"),
  btnToggleSpells: $("#btn-toggle-spells"),
  btnUniverseView: $("#btn-universe-view"),
  btnUniverseViewExit: $("#btn-universe-view-exit"),
  universeViewChrome: $("#universe-view-chrome"),
  universeViewFocusIcon: $("#universe-view-focus-icon"),
  universeViewFocusName: $("#universe-view-focus-name"),
  universeViewFocusMeta: $("#universe-view-focus-meta"),
  universeViewSystemLabels: $("#universe-view-system-labels"),
  btnCloseSpells: $("#btn-close-spells"),
  btnIntelFolder: $("#btn-intel-folder"),
  vaultFolderBtnWrap: $("#vault-folder-btn-wrap"),
  vaultFolderGateCue: $("#vault-folder-gate-cue"),
  focusPathLockGate: $("#focus-path-lock-gate"),
  btnPathLockGateLink: $("#btn-path-lock-gate-link"),
  vaultFailDot: $("#vault-fail-dot"),
  intelFolderStatus: $("#intel-folder-status"),
  brandText: $("#brand-text"),
  spellCount: $("#spell-count") || document.getElementById("spell-count"),
  spellsList: $("#spells-list"),
  spellsHint: $("#spells-hint"),
  tabSpellsActive: $("#tab-spells-active"),
  tabSpellsHistory: $("#tab-spells-history"),
  btnCopySpellbook: $("#btn-copy-spellbook"),
  btnClearAll: $("#btn-clear-active"),
  spellDetailDialog: $("#spell-detail-dialog"),
  spellDetailTitle: $("#spell-detail-title"),
  spellDetailSub: $("#spell-detail-sub"),
  spellDetailSide: $("#spell-detail-side"),
  spellDetailMain: $("#spell-detail-main"),
  btnSpellDetailClose: $("#btn-spell-detail-close"),
  btnSpellDetailCopy: $("#btn-spell-detail-copy"),
  complexCraftDialog: $("#complex-craft-dialog"),
  btnComplexCraftClose: $("#btn-complex-craft-close"),
  complexCraftSub: $("#complex-craft-sub"),
  littleChatMessages: $("#little-chat-messages"),
  littleChatForm: $("#little-chat-form"),
  littleChatInput: $("#little-chat-input"),
  btnLittleChatSend: $("#btn-little-chat-send"),
  btnSpellsTitle: $("#btn-spells-title"),
  spellsTitleMenu: $("#spells-title-menu"),
  btnCraftComplexSpell: $("#btn-craft-complex-spell"),
  spellsPanel: $("#spells-panel"),
  constellationPing: $("#constellation-ping"),
  app: $(".app") || document.querySelector(".app"),
  stars: $("#stars"),
  lines: $("#constellation-lines"),
  universeCanvas: $("#universe-canvas"),
  universeStage: $("#universe-stage"),
  universeHud: $("#universe-hud"),
  universeHudCount: $("#universe-hud-count"),
  universeHudStage: $("#universe-hud-stage"),
  universeLegend: $("#universe-legend"),
  atlasTitle: $("#atlas-title"),
  atlasSub: $("#atlas-sub"),
  atlasBody: $("#atlas-body"),
  btnAtlasClose: $("#btn-atlas-close"),
  dialog: $("#new-convo-dialog"),
  newForm: $("#new-convo-form"),
  newName: $("#new-entity-name"),
  newType: $("#new-entity-type"),
  newModelLabel: $("#new-model-label"),
  newModel: $("#new-entity-model"),
  newFocusHint: $("#new-focus-hint"),
  btnCancelNew: $("#btn-cancel-new"),
  editDialog: $("#edit-convo-dialog"),
  editId: $("#edit-entity-id"),
  editName: $("#edit-entity-name"),
  editType: $("#edit-entity-type"),
  editModel: $("#edit-entity-model"),
  editTypeLabel: $("#edit-entity-type-label"),
  editModelLabel: $("#edit-model-label"),
  btnCancelEdit: $("#btn-cancel-edit"),
  btnEditFocus: $("#btn-edit-focus"),
  btnCopyScrollList: $("#btn-copy-scroll-list"),
  roadmapPanel: $("#roadmap-panel"),
  btnRoadmapClose: $("#btn-roadmap-close"),
  roadmapList: $("#roadmap-list"),
  roadmapDetail: $("#roadmap-detail"),
  roadmapInput: $("#roadmap-input"),
  btnRoadmapGenerate: $("#btn-roadmap-generate"),
  btnRoadmapParse: $("#btn-roadmap-parse"),
  roadmapStatusFilter: $("#roadmap-status-filter"),
  appSettingsPanel: $("#app-settings-panel"),
  btnAppSettings: $("#btn-app-settings"),
  btnAppSettingsClose: $("#btn-app-settings-close"),
  galleryDialog: $("#gallery-dialog"),
  galleryBody: $("#gallery-body"),
  btnGalleryClose: $("#btn-gallery-close"),
  btnOpenGallery: $("#btn-open-gallery"),
  btnBrain: $("#btn-brain"),
  brainOverlay: $("#brain-overlay"),
  brainBody: $("#brain-body"),
  brainSub: $("#brain-sub"),
  btnBrainClose: $("#btn-brain-close"),
  fleetMissionInput: $("#fleet-mission-input"),
  btnFleetMission: $("#btn-fleet-mission"),
  fleetAutonomousToggle: $("#fleet-autonomous-toggle"),
  editLinkedSession: $("#edit-linked-session"),
  editHermesSendRow: $("#edit-hermes-send-row"),
  editSessionMessage: $("#edit-session-message"),
  btnSendSession: $("#btn-send-session"),
  editDeliveryStatus: $("#edit-delivery-status"),
  busStatus: $("#bus-status"),
  busStatusValue: $("#bus-status-value"),
  toast: $("#toast"),
};

// Drop any legacy input-bar background contamination
try {
  localStorage.removeItem("grimoire-input-bg-v1");
} catch {
  /* ignore */
}

/** One-line activity ping above input — fades after 3s. */
function activityPing(message) {
  const el = els.constellationPing || document.getElementById("constellation-ping");
  if (!el || !message) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(activityPing._t);
  activityPing._t = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}

function setVaultFailState(failed) {
  const btn = els.btnIntelFolder;
  const dot = els.vaultFailDot || document.getElementById("vault-fail-dot");
  if (btn) btn.classList.toggle("vault-fail", Boolean(failed));
  if (dot) {
    if (failed) dot.removeAttribute("hidden");
    else dot.setAttribute("hidden", "");
  }
}

function applySidebarCollapsed(collapsed) {
  const appEl = els.app || document.querySelector(".app");
  if (!appEl) return;
  appEl.classList.toggle("sidebar-collapsed", Boolean(collapsed));
  if (els.btnSidebarToggle) {
    els.btnSidebarToggle.title = collapsed ? "Expand focuses" : "Collapse focuses";
    els.btnSidebarToggle.setAttribute(
      "aria-label",
      collapsed ? "Expand sidebar" : "Collapse sidebar"
    );
  }
  try {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function loadSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function toggleSidebar() {
  const appEl = els.app || document.querySelector(".app");
  const next = !appEl?.classList.contains("sidebar-collapsed");
  applySidebarCollapsed(next);
}

/** Double-tap delete timers: spellId | 'clear-all' → timeout id */
const pendingDeletes = new Map();
const DELETE_CONFIRM_MS = 3000;

// ─── Helpers ───

function activeConvo() {
  const c = state.conversations.find((x) => x.id === state.activeId) || null;
  // Cell2 Core is system substrate — never the active chat focus
  if (c && isCell2CoreFocus(c)) {
    const vis = state.conversations.find((x) => isVisibleFocus(x));
    if (vis) state.activeId = vis.id;
    return vis || null;
  }
  return c;
}

function spellsFor(convoId) {
  return state.spells
    .filter((s) => s.conversationId === convoId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Single source of truth: has this spell left the Active queue?
 * Badge · Active tab · Cast History · pendingCount must all use this.
 *
 * Sealed = status "sent" OR any cast lifecycle stamp (sentAt/answeredAt/selfCastAt/copiedAt).
 * Refill clears those stamps and sets status "ready" — only then is it active again.
 * Never treat rebuiltAt alone as active (that inflated button badge toward total).
 */
function spellIsSealed(spell) {
  if (!spell) return true;
  // Copy-and-await: still Active until reply paste seals the cast
  if (spell.awaitingReply) return false;
  const st = String(spell.status || "").toLowerCase();
  if (st === "sent" || st === "history" || st === "archived") return true;
  // Any lifecycle stamp = functionally cast (even if status lagged)
  // Exception: refilled/refined ready spells may keep old stamps cleared by heal
  if (spell.rebuilt || spell.rebuiltAt) return false;
  // copiedAt alone no longer seals — only full cast stamps
  if (spell.sentAt || spell.answeredAt || spell.selfCastAt || spell.castTimestamp) {
    return true;
  }
  return false;
}

/** True when spell belongs in Active (CAST THIS / hold) queue. */
function spellIsActiveQueue(spell) {
  if (!spell) return false;
  if (spellIsSealed(spell)) return false;
  if (isReceiptSpell(spell)) return false;
  if (typeof purposeLooksLikeHoldLoop === "function" && purposeLooksLikeHoldLoop(spell.purpose)) {
    return false;
  }
  return true;
}

/**
 * Active-ready count only — NEVER total spells for a Focus.
 * Same sealed-aware predicate Scroll specified for the spell button badge.
 */
function activeReadyCount(convoId) {
  if (!convoId) return 0;
  return (state.spells || []).filter(
    (s) => s.conversationId === convoId && !spellIsSealed(s) && spellIsActiveQueue(s)
  ).length;
}

/**
 * Promote lagged lifecycle → status:"sent" so localStorage stops re-leaking badges.
 * Also strip cast stamps from refilled cards so Active stays clean.
 * Returns true if any spell mutated.
 */
function healSpellLifecycles(spells = state.spells) {
  let changed = false;
  const now = Date.now();
  for (const s of spells || []) {
    if (!s) continue;
    normalizeSpell(s);

    // Expire stale await-paste windows (10 min)
    if (s.awaitingReply) {
      const started = Number(s.awaitingReplyAt || 0);
      if (started && now - started > AWAIT_REPLY_MS) {
        s.awaitingReply = false;
        s.awaitingReplyAt = null;
        changed = true;
      } else {
        // Stay active while awaiting — never seal on copiedAt alone
        if (String(s.status || "").toLowerCase() !== "ready") {
          s.status = "ready";
          changed = true;
        }
        continue;
      }
    }

    // Refilled / refined generation: strip cast stamps; force back to ready
    if (s.rebuilt || s.rebuiltAt) {
      const st = String(s.status || "").toLowerCase();
      if (st === "sent" || st === "history") {
        s.status = "ready";
        changed = true;
      }
      if (s.sentAt || s.answeredAt || s.selfCastAt || s.castTimestamp) {
        s.sentAt = undefined;
        s.answeredAt = undefined;
        s.selfCastAt = undefined;
        s.castTimestamp = null;
        changed = true;
      }
      continue;
    }

    const st = String(s.status || "").toLowerCase();
    if (st === "sent" || st === "history" || st === "archived") {
      if (st === "sent") {
        s.status = "history";
        changed = true;
      }
      continue;
    }
    if (!spellIsSealed(s)) continue;

    s.status = "history";
    s.sentAt = s.sentAt || s.answeredAt || s.selfCastAt || s.castTimestamp || Date.now();
    s.castTimestamp = s.castTimestamp || s.sentAt;
    s.copiedAt = s.copiedAt || s.sentAt;
    changed = true;
  }
  return changed;
}

/** Active queue only — never cast / history / receipt / hold-loop sludge. */
function activeSpellsFor(convoId) {
  return spellsFor(convoId)
    .filter((s) => spellIsActiveQueue(s))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Cast History — sealed casts, newest answer first. */
function historySpellsFor(convoId) {
  return spellsFor(convoId)
    .filter((s) => spellIsSealed(s) && !isReceiptSpell(s))
    .sort((a, b) => (b.sentAt || b.answeredAt || b.createdAt || 0) - (a.sentAt || a.answeredAt || a.createdAt || 0));
}

function pendingCount(convoId) {
  // Same bucket as Active tab / top spell button — never total history
  return activeReadyCount(convoId);
}

/**
 * Write active-ready N into #spell-count (top spell button).
 * Never total spells. Never Cast History length. 0 → hide.
 */
function setSpellButtonBadge(activeReady) {
  const n = Math.max(0, Number(activeReady) || 0);
  const countEl =
    els.spellCount ||
    document.getElementById("spell-count") ||
    document.querySelector("#btn-toggle-spells .spell-count");
  if (!countEl) return;
  countEl.textContent = n > 0 ? String(n) : "";
  countEl.dataset.count = String(n);
  countEl.title =
    n > 0 ? `${n} ready spell${n === 1 ? "" : "s"} (Active queue)` : "No ready spells";
}

/**
 * Header + sidebar badge MUST equal Active-tab card count for this Focus.
 * Call after heal + activeSpellsFor so numbers never drift.
 */
function syncSpellCountBadges(focusId, readyCount) {
  // Ignore caller if they pass total-by-mistake — recompute from ACTIVE predicate
  const n =
    focusId != null
      ? activeReadyCount(focusId)
      : Math.max(0, Number(readyCount) || 0);

  setSpellButtonBadge(n);

  // Only rewrite the active Focus row (other focuses keep their own pending)
  if (!focusId || focusId !== state.activeId) return;
  const row = document.querySelector(`.convo-item[data-focus-id="${focusId}"]`);
  if (!row) return;
  const main = row.querySelector(".convo-item-main");
  if (!main) return;

  let badge = main.querySelector(".convo-badge");
  if (n > 0) {
    if (!badge) {
      badge = document.createElement("span");
      main.appendChild(badge);
    }
    badge.className = "convo-badge";
    badge.title = `${n} ready spell${n === 1 ? "" : "s"}`;
    badge.textContent = String(n);
  } else {
    main.querySelectorAll(".convo-badge:not(.unread)").forEach((el) => el.remove());
  }
}

/**
 * Force top-right + every sidebar Focus badge from ACTIVE-ready only
 * (never total spellsFor length). Call at end of renderSpells after heal.
 */
function syncFocusBadges() {
  const activeId = state.activeId || null;
  // Scroll spec: conversationId match + !spellIsSealed (+ Active queue filters)
  const activeReady = activeId
    ? (state.spells || []).filter(
        (s) => s.conversationId === activeId && !spellIsSealed(s) && spellIsActiveQueue(s)
      ).length
    : 0;

  setSpellButtonBadge(activeReady);

  document.querySelectorAll(".convo-item[data-focus-id]").forEach((row) => {
    const focusId = row.dataset.focusId;
    if (!focusId) return;
    const n = activeReadyCount(focusId);
    const main = row.querySelector(".convo-item-main");
    if (!main) return;

    if (n > 0) {
      let badge = main.querySelector(".convo-badge");
      if (!badge) {
        badge = document.createElement("span");
        main.appendChild(badge);
      }
      badge.className = "convo-badge";
      badge.title = `${n} ready spell${n === 1 ? "" : "s"}`;
      badge.textContent = String(n);
    } else {
      // Empty Active queue → drop numeric spell badge (keep .unread message chips)
      main.querySelectorAll(".convo-badge:not(.unread)").forEach((el) => el.remove());
    }
  });
}

/** Short human time for spell lifecycle chips. */
function formatSpellTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function setSpellView(view) {
  // Library deprecated — only ACTIVE and CAST HISTORY
  if (view === "history") state.spellView = "history";
  else state.spellView = "active";
  persist();
  renderSpells();
}

function ensureSpellView() {
  // Migrate legacy library view → active
  if (state.spellView === "library") state.spellView = "active";
  if (state.spellView !== "history") {
    state.spellView = "active";
  }
  return state.spellView;
}

/** Compact cards (default) vs expanded full-text audit list. */
function ensureSpellListMode() {
  if (state.spellListMode !== "detail") state.spellListMode = "compact";
  return state.spellListMode;
}

function isSpellDetailListMode() {
  return ensureSpellListMode() === "detail";
}

/**
 * Toggle Spells panel compact ↔ full detail.
 * Persists for the session while a focus is selected (re-renders keep mode).
 * Read-only layout switch — no spell mutations.
 */
function setSpellListMode(mode) {
  state.spellListMode = mode === "detail" ? "detail" : "compact";
  syncSpellListModeChrome();
  try {
    persist();
  } catch {
    /* ignore */
  }
  void renderSpells();
}

function toggleSpellListMode() {
  setSpellListMode(isSpellDetailListMode() ? "compact" : "detail");
  toast(
    isSpellDetailListMode()
      ? "Full detail view — scroll to audit all spell text"
      : "Compact cards",
    "success"
  );
}

function syncSpellListModeChrome() {
  const detail = isSpellDetailListMode();
  const panel = els.spellsPanel || document.getElementById("spells-panel");
  const list = els.spellsList || document.getElementById("spells-list");
  panel?.classList.toggle("spell-list-detail", detail);
  panel?.classList.toggle("spell-list-compact", !detail);
  list?.classList.toggle("spells-list-detail", detail);
  list?.classList.toggle("spells-list-compact", !detail);
}

// ── Node contribution metrics (vault-derived, cached per focus) ──
const contribCache = new Map(); // focusId -> { at, data }
let spellDetailContext = null; // { spellId }
/** Copy → await paste reply → auto-cast (10 min) */
const AWAIT_REPLY_MS = 10 * 60 * 1000;
/** @type {Map<string, number>} spellId → timeout handle */
const awaitReplyTimers = new Map();

function invalidateContribCache(focusId) {
  if (focusId) contribCache.delete(focusId);
  else contribCache.clear();
}

async function getFocusContributions(focusOrId, { force = false } = {}) {
  const focus =
    typeof focusOrId === "object" && focusOrId
      ? focusOrId
      : state.conversations.find((c) => c.id === focusOrId) || { id: focusOrId };
  const id = focus?.id;
  if (!id) {
    return { rows: [], empty: true, totalCount: 0, totalBytes: 0 };
  }
  const hit = contribCache.get(id);
  if (!force && hit && Date.now() - hit.at < 45_000) return hit.data;
  try {
    const data = await calculateNodeContributions(focus);
    contribCache.set(id, { at: Date.now(), data });
    return data;
  } catch (err) {
    console.warn("[contrib] calculate failed", err);
    const empty = { rows: [], empty: true, totalCount: 0, totalBytes: 0 };
    contribCache.set(id, { at: Date.now(), data: empty });
    return empty;
  }
}

/** Stacked bar + optional top source label for card face */
function contribMiniHtml(breakdown, { compact = true } = {}) {
  const rows = Array.isArray(breakdown?.rows) ? breakdown.rows : [];
  if (!rows.length) {
    return `<div class="spell-face-contrib"><div class="spell-face-contrib-label">No contributions yet</div><div class="contrib-bar-stack" title="0%"></div></div>`;
  }
  const segs = rows
    .slice(0, 8)
    .map(
      (r) =>
        `<span class="contrib-bar-seg" style="width:${Math.max(r.percent, 0.5)}%;background:${escapeAttr(
          r.color || "#a78bfa"
        )}" title="${escapeHtml(r.source)}: ${r.percent}%"></span>`
    )
    .join("");
  const top = rows[0];
  if (compact) {
    return `<div class="spell-face-contrib">
      <div class="spell-face-contrib-label" title="Intelligence contribution from vault sources">Intel mix</div>
      <div class="contrib-bar-stack">${segs}</div>
      <div class="spell-face-contrib-top"><span>${escapeHtml(top.source)}</span><span>${top.percent}%</span></div>
    </div>`;
  }
  return contribDetailHtml(breakdown);
}

function contribDetailHtml(breakdown) {
  const rows = Array.isArray(breakdown?.rows) ? breakdown.rows : [];
  if (!rows.length) {
    return `<p class="contrib-empty">No contributions yet · 0%</p>`;
  }
  const segs = rows
    .map(
      (r) =>
        `<span class="contrib-bar-seg" style="width:${Math.max(r.percent, 0.4)}%;background:${escapeAttr(
          r.color || "#a78bfa"
        )}" title="${escapeHtml(r.source)}: ${r.percent}%"></span>`
    )
    .join("");
  const list = rows
    .map(
      (r) => `<div class="contrib-row">
      <span class="contrib-row-name" title="${escapeHtml(r.source)}">${escapeHtml(r.source)}</span>
      <span class="contrib-row-pct">${r.percent}%</span>
      <div class="contrib-row-track"><div class="contrib-row-fill" style="width:${r.percent}%;background:${escapeAttr(
        r.color || "#a78bfa"
      )}"></div></div>
    </div>`
    )
    .join("");
  return `<div class="contrib-bar-stack" style="height:10px;margin-bottom:0.55rem">${segs}</div><div class="contrib-rows">${list}</div>`;
}

/** Clear await-paste on one spell (timeout, cancel, or superseded). */
function clearSpellAwaitReply(spellId, { silent = false, reason = "" } = {}) {
  const spell = state.spells.find((s) => s.id === spellId);
  if (awaitReplyTimers.has(spellId)) {
    try {
      clearTimeout(awaitReplyTimers.get(spellId));
    } catch {
      /* ignore */
    }
    awaitReplyTimers.delete(spellId);
  }
  if (!spell) return;
  if (!spell.awaitingReply && !spell.awaitingReplyAt) return;
  spell.awaitingReply = false;
  spell.awaitingReplyAt = null;
  // Fleet: timeout/cancel of working auto-cast → failed
  if (
    (spell.autoCast || spell.castStatus === "working") &&
    spell.castStatus === "working" &&
    (reason === "timeout" || reason === "cancel")
  ) {
    try {
      failAutoCastSpell(spell, reason === "timeout" ? "timeout — no reply densened" : "cancelled");
    } catch {
      /* ignore */
    }
  }
  persist();
  if (!silent) {
    if (reason === "timeout") {
      toast("Await reply timed out — spell still Active", "");
    } else if (reason === "cancel") {
      toast("Await cancelled", "");
    }
  }
  updateSpellDetailCopyButton();
  void renderSpells();
}

/** Only one await per focus — cancel others on that focus. */
function clearOtherAwaitsOnFocus(focusId, exceptSpellId) {
  for (const s of state.spells || []) {
    if (!s?.awaitingReply) continue;
    if (s.conversationId !== focusId) continue;
    if (s.id === exceptSpellId) continue;
    clearSpellAwaitReply(s.id, { silent: true });
  }
}

/**
 * After "Copy spell": enter await-paste state (do NOT seal yet).
 * Persists awaitingReply so close modal / refresh keeps state.
 */
function scheduleAwaitReplyTimeout(spellId, remainingMs) {
  if (awaitReplyTimers.has(spellId)) {
    try {
      clearTimeout(awaitReplyTimers.get(spellId));
    } catch {
      /* ignore */
    }
  }
  const ms = Math.max(1000, Number(remainingMs) || AWAIT_REPLY_MS);
  const t = setTimeout(() => {
    awaitReplyTimers.delete(spellId);
    const still = state.spells.find((s) => s.id === spellId);
    if (still?.awaitingReply) {
      clearSpellAwaitReply(spellId, { reason: "timeout" });
    }
  }, ms);
  awaitReplyTimers.set(spellId, t);
}

/** Restore await timers after page load (state persists awaitingReply). */
function restoreAwaitReplyTimers() {
  const now = Date.now();
  let changed = false;
  for (const s of state.spells || []) {
    if (!s?.awaitingReply) continue;
    const started = Number(s.awaitingReplyAt || 0);
    if (!started || now - started > AWAIT_REPLY_MS) {
      s.awaitingReply = false;
      s.awaitingReplyAt = null;
      changed = true;
      continue;
    }
    scheduleAwaitReplyTimeout(s.id, AWAIT_REPLY_MS - (now - started));
  }
  if (changed) persist();
}

function beginSpellAwaitReply(spellId) {
  const spell = state.spells.find((s) => s.id === spellId);
  if (!spell) return null;
  normalizeSpell(spell);
  const focusId = spell.conversationId || activeConvo()?.id;
  if (focusId) clearOtherAwaitsOnFocus(focusId, spellId);

  spell.awaitingReply = true;
  spell.awaitingReplyAt = Date.now();
  spell.copiedAt = Date.now();
  spell.status = "ready";
  spell.rebuilt = false;
  // Do not set sentAt / castTimestamp yet

  scheduleAwaitReplyTimeout(spellId, AWAIT_REPLY_MS);

  persist();
  updateSpellDetailCopyButton();
  void renderSpells();
  return spell;
}

/** Find active await spell for a focus (or any if focusId null). */
function getAwaitingSpellForFocus(focusId) {
  const list = (state.spells || []).filter((s) => s && s.awaitingReply);
  if (!list.length) return null;
  if (focusId) {
    return list.find((s) => s.conversationId === focusId) || null;
  }
  return list[0] || null;
}

function updateSpellDetailCopyButton() {
  const btn = els.btnSpellDetailCopy;
  if (!btn) return;
  const id = spellDetailContext?.spellId;
  const spell = id ? state.spells.find((s) => s.id === id) : null;
  const st = String(spell?.status || "").toLowerCase();
  const isHist =
    spell &&
    (spellIsSealed(spell) || st === "history" || st === "sent" || st === "archived");
  if (spell?.awaitingReply) {
    btn.textContent = "Awaiting reply…";
    btn.classList.add("awaiting-reply");
    btn.disabled = false;
    btn.title = "Paste the AI reply into chat to seal this cast · click again to cancel await";
  } else if (isHist) {
    btn.textContent = "Cast again";
    btn.classList.remove("awaiting-reply");
    btn.disabled = false;
    btn.title = "Re-copy spell and await paste reply";
  } else {
    btn.textContent = "Cast spell";
    btn.classList.remove("awaiting-reply");
    btn.disabled = false;
    btn.title = "Copy spell to clipboard and wait for paste-reply in chat";
  }
}

/** Teach glyph from user words → vault + spell.glyphs */
async function teachSpellGlyph(spell, focus, body, { scope = "spell" } = {}) {
  if (!spell || !body) return null;
  normalizeSpell(spell);
  const title = synthesizeGlyphTitle(body);
  const result = await writeSpellGlyph(focus, spell, {
    body,
    title,
    scope,
    tags: ["glyph", spell.kind || "spell", scope].filter(Boolean),
  });
  if (!result?.ok) {
    toast("Could not forge glyph", "");
    return null;
  }
  // Refinement credit without full content rewrite
  spell.refinementNote = `Glyph: ${result.glyph.title}`.slice(0, 240);
  spell.updatedAt = Date.now();
  persist();
  if (focus?.id) invalidateContribCache(focus.id);
  toast(`Glyph forged: ${result.glyph.title}`, "success");
  activityPing(`✦ Glyph · ${result.glyph.title}`);
  return result.glyph;
}

/**
 * Refine spell: optional user lesson + merge applicable glyphs → vN+1.
 */
async function refineSpellWithGlyphs(spell, focus) {
  if (!spell) return;
  normalizeSpell(spell);
  const lesson = window.prompt(
    "What worked / didn't work? (optional — leave blank to only merge glyphs)",
    spell.refinementNote || ""
  );
  if (lesson === null) return; // cancelled

  const glyphs = glyphsForSpell(focus, spell);
  let content = String(spell.content || spell.message || "");
  if (String(lesson || "").trim()) {
    content =
      content.trim() +
      `\n\n## Refinement note\n${String(lesson).trim()}\n`;
  }
  content = mergeGlyphsIntoSpellContent(content, glyphs);
  const note = String(lesson || "").trim()
    ? String(lesson).trim().slice(0, 200)
    : glyphs.length
      ? `Merged ${glyphs.length} glyph${glyphs.length === 1 ? "" : "s"}`
      : "Refined content";

  refineSpellVersion(spell, { content, note });
  persist();
  toast(`Refined → v${spell.iteration}`, "success");
  void openSpellDetailModal(spell, { convo: focus });
  void renderSpells();
}

/**
 * Paste into chat while awaiting → densen as spell result + seal to history.
 * Returns true if handled (caller should skip normal send if desired).
 */
async function handleAwaitPasteReply(convo, pastedText) {
  if (!convo || isFocusLocked(convo)) return false;
  const text = String(pastedText || "").trim();
  if (!text) return false;

  // Explicit cancel
  if (/^cancel$/i.test(text)) {
    const awaiting = getAwaitingSpellForFocus(convo.id);
    if (awaiting) {
      clearSpellAwaitReply(awaiting.id, { reason: "cancel" });
      return true;
    }
    return false;
  }

  const spell = getAwaitingSpellForFocus(convo.id);
  if (!spell) return false;

  // Any paste while awaiting seals (user explicitly copied the spell first)
  const now = Date.now();
  spell.awaitingReply = false;
  spell.awaitingReplyAt = null;
  if (awaitReplyTimers.has(spell.id)) {
    try {
      clearTimeout(awaitReplyTimers.get(spell.id));
    } catch {
      /* ignore */
    }
    awaitReplyTimers.delete(spell.id);
  }

  spell.answeredAt = now;
  spell.castTimestamp = now;
  spell.resultNote = text.slice(0, 500);

  // Densen reply into focus vault as spell result (source = target node when known)
  const sourceName =
    String(spell.target || "").trim() &&
    String(spell.target).toLowerCase() !== String(convo.name || "").toLowerCase()
      ? String(spell.target).trim()
      : "user";
  try {
    const densen = await appendEntityIntelligence(convo, {
      body: [
        `**Spell reply sealed** · ${spellFaceTitle(spell)} · v${spell.iteration || 1}`,
        `Target: ${spell.target || convo.name}`,
        ``,
        text.slice(0, 12000),
      ].join("\n"),
      source: sourceName,
      category: isAlignmentSpell(spell) ? "identity" : "node_intel",
      certainty: "confirmed",
      tags: ["spell-reply", "auto-cast", "auto-write", spell.kind || "spell"].filter(
        Boolean
      ),
      focusId: convo.id,
      refreshScroll: true,
    });
    invalidateContribCache(convo.id);
    if (densen?.method === "filesystem" && densen?.ok !== false) {
      toastVaultWritten(convo.name || "");
    }
  } catch (err) {
    console.warn("[await-paste] vault densen failed", err);
  }

  // Alignment unlock when pasting reveal
  if (isAlignmentSpell(spell) || /alignment|transparency/i.test(spellFaceTitle(spell))) {
    try {
      convo.alignmentNotes = text.slice(0, 8000);
      convo.alignmentReceived = true;
      convo.alignmentProfile = parseAlignmentIntelligence(text);
    } catch {
      /* ignore */
    }
  }

  // Push chat bubbles for the densen
  convo.messages = convo.messages || [];
  convo.messages.push({
    id: uid("msg"),
    role: "user",
    text,
    ts: now,
    kind: "inbound-intel",
    spellId: spell.id,
  });
  convo.messages.push({
    id: uid("msg"),
    role: "grimoire",
    text: `**Reply received and sealed.** Spell **${spellFaceTitle(spell)}** (v${
      spell.iteration || 1
    }) → Cast History. Intelligence densened from **${sourceName}**.`,
    ts: now,
    kind: "spell-reply-ack",
  });
  convo.updatedAt = now;

  markSent(spell.id, { fromCopy: false, silent: true });
  // markSent sets history; ensure cast timestamp
  spell.castTimestamp = spell.castTimestamp || now;
  spell.awaitingReply = false;

  // Fleet Auto-Cast pipeline → cast
  try {
    if (spell.autoCast || spell.castStatus === "working") {
      completeAutoCastSpell(spell, { replyExcerpt: text });
    }
  } catch (err) {
    console.warn("[fleet] complete auto-cast", err);
  }

  // Session0 consolidated fleet response → focus intelligence (auto-write-back)
  try {
    const linked = resolveSpellLinkedSession(spell, convo);
    const looksFleet =
      isSession0(linked) ||
      isSession0BroadcastTarget(spell, convo) ||
      /session0|response from|consolidated/i.test(text);
    if (looksFleet || spell.fleetDeployed || spell.castStatus === "cast") {
      void consolidateSession0FleetResponse(convo, text, {
        spell,
        conversations: state.conversations,
        source: "Session0",
      }).catch((err) => console.warn("[session0] consolidate", err));
    }
  } catch (err) {
    console.warn("[session0] consolidate path", err);
  }

  try {
    touchFleetActivity(convo);
  } catch {
    /* ignore */
  }

  toast("Reply received and sealed", "success");
  activityPing(`✦ Reply sealed · ${spellFaceTitle(spell)}`);
  persist();
  updateSpellDetailCopyButton();
  void renderAll();
  return true;
}

/** Promote a history/library spell back to Active (repeat cast). Optionally refine. */
function promoteSpellToActive(spellId, { refine = false } = {}) {
  const spell = state.spells.find((s) => s.id === spellId);
  if (!spell) return;
  normalizeSpell(spell);
  if (refine) {
    refineSpellVersion(spell, {
      note: `repeat cast prep v${(Number(spell.iteration) || 1) + 1}`,
    });
  } else {
    spell.status = "ready";
    spell.sentAt = undefined;
    spell.copiedAt = undefined;
    spell.answeredAt = undefined;
    spell.selfCastAt = undefined;
    spell.rebuilt = true;
    spell.rebuiltAt = Date.now();
  }
  // Bind to current focus when promoting from library of another focus
  const active = activeConvo();
  if (active && spell.conversationId !== active.id) {
    spell.conversationId = active.id;
    spell.target = spell.target || active.name;
  }
  spell.updatedAt = Date.now();
  persist();
  state.spellView = "active";
  renderSpells();
  toast(
    refine
      ? `Spell refined → v${spell.iteration} · Active`
      : `Spell promoted to Active · v${spell.iteration}`,
    "success"
  );
}

/**
 * When the Operator pastes a real reply / densen block, stamp the most recent
 * unanswered CAST spell with answeredAt. Time becomes truth for Cast History.
 */
function stampSpellAnsweredFromIngest(convo, userText) {
  if (!convo || !userText) return;
  const t = String(userText).trim();
  if (t.length < 40 && t !== ".") return;
  // Avoid stamping pure outbound intents as answers
  const outboundish =
    /^(do|please|ask|tell|send|open|cast|implement|build|run|make|draft)\b/i.test(t) &&
    t.length < 160 &&
    !/\bACTION TAKEN\b|\bEVIDENCE\b|\bNEXT THREE\b|\bSignal:\s*\d/i.test(t);
  if (outboundish) return;

  // Prefer unanswered ENGAGE casts first (proactive node loop densen)
  const hist = historySpellsFor(convo.id);
  const newest =
    hist.find((s) => !s.answeredAt && isNodeEngageSpell(s)) ||
    hist.find((s) => !s.answeredAt);
  if (!newest) return;
  newest.answeredAt = Date.now();
  newest.answerExcerpt = t.replace(/\s+/g, " ").trim().slice(0, 280);
  // Knowledge update: sealed engage + returned intel → SCROLL LIST / vault
  densenScrollListFromEngage(convo, newest, t);
  void writeScrollListToVault(convo);
}

function persist() {
  // Keep org timestamps fresh on active focus when content mutates
  const active = activeConvo();
  if (active) {
    ensureFocusOrgFields(active, { assignFolder: false });
  }
  saveState(state);
}

/** Mark Focus as recently updated (list timestamps / sort signals). */
function touchFocus(convo) {
  if (!convo) return;
  ensureFocusOrgFields(convo, { assignFolder: false });
  convo.updatedAt = Date.now();
}

function toast(msg, kind = "", durationMs) {
  const el = els.toast || document.getElementById("toast");
  if (!el) {
    console.log("[toast]", msg);
    return;
  }
  el.textContent = msg;
  el.className = "toast show" + (kind ? ` ${kind}` : "");
  clearTimeout(toast._t);
  const ms =
    Number(durationMs) > 0
      ? Number(durationMs)
      : kind === "success"
        ? 3600
        : 2400;
  toast._t = setTimeout(() => {
    el.className = "toast";
  }, ms);
}

/**
 * Synchronous clipboard write (keeps user-gesture). Manual paste only.
 * Returns true on success, false on failure — never throws for exec path.
 */
function copyTextToClipboardSync(text) {
  const body = String(text ?? "");
  try {
    const ta = document.createElement("textarea");
    ta.value = body;
    ta.setAttribute("readonly", "");
    ta.style.cssText =
      "position:fixed;left:-9999px;top:0;opacity:0;width:1px;height:1px;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, body.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return Boolean(ok);
  } catch (err) {
    console.warn("[clipboard-sync]", err);
    return false;
  }
}

/** Clipboard write with sync-first + async Clipboard API fallback. */
async function copyTextToClipboard(text) {
  if (copyTextToClipboardSync(text)) return true;
  const body = String(text ?? "");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(body);
    return true;
  }
  throw new Error("clipboard copy failed");
}

/**
 * Chat header "Relay to [session]" toggle.
 * Visible only when Focus has linkedSession set.
 * OFF = local GRIMOIRE only · ON = also copy outbound chat to clipboard for Hermes paste.
 * Persists per Focus (convo.chatRelay).
 */
function syncChatRelayUi(convo) {
  const wrap = els.chatRelayToggle || document.getElementById("chat-relay-toggle");
  const input = els.chatRelayInput || document.getElementById("chat-relay-input");
  const label = els.chatRelayLabel || document.getElementById("chat-relay-label");
  const hint = els.chatRelayHint || document.getElementById("chat-relay-hint");
  if (!wrap) return;

  if (!convo) {
    wrap.setAttribute("hidden", "");
    wrap.classList.remove("is-active");
    if (input) input.checked = false;
    return;
  }

  ensureFleetFocusFields(convo);
  const session = normalizeLinkedSessionLabel(convo.linkedSession || "");
  if (!session) {
    wrap.setAttribute("hidden", "");
    wrap.classList.remove("is-active");
    if (input) input.checked = false;
    return;
  }

  wrap.removeAttribute("hidden");
  const on = Boolean(convo.chatRelay);
  if (input) input.checked = on;
  wrap.classList.toggle("is-active", on);
  wrap.dataset.session = session;
  if (label) label.textContent = `Relay to ${session}`;
  if (hint) hint.textContent = on ? "clipboard · active" : "clipboard only";
  wrap.title = on
    ? `Relay ON — chat messages also copy for pasting into Hermes ${session}. Manual paste only.`
    : `Relay OFF — chat stays local to GRIMOIRE. Turn on to copy messages for Hermes ${session}.`;
}

function setChatRelayForActiveFocus(on) {
  const convo = activeConvo();
  if (!convo) return;
  ensureFleetFocusFields(convo);
  const session = normalizeLinkedSessionLabel(convo.linkedSession || "");
  if (!session) {
    toast("Link a session on this Focus first", "");
    syncChatRelayUi(convo);
    return;
  }
  convo.chatRelay = Boolean(on);
  persist();
  syncChatRelayUi(convo);
  toast(
    convo.chatRelay
      ? `Relay ON · messages copy for Hermes ${session}`
      : "Relay OFF · chat stays local to GRIMOIRE",
    "success"
  );
}

/**
 * When chatRelay is ON for this Focus, copy outbound user text to clipboard.
 * No HTTP. No auto-delivery. Operator pastes into Hermes.
 */
async function maybeRelayChatToClipboard(convo, text) {
  if (!convo) return { ok: false, reason: "no_focus" };
  ensureFleetFocusFields(convo);
  if (!convo.chatRelay) return { ok: false, reason: "relay_off" };
  const session = normalizeLinkedSessionLabel(convo.linkedSession || "");
  if (!session) return { ok: false, reason: "unlinked" };
  const body = String(text || "").trim();
  if (!body) return { ok: false, reason: "empty" };
  try {
    await copyTextToClipboard(body);
    activityPing(`⎘ Relayed · Hermes ${session}`);
    return { ok: true, session };
  } catch (err) {
    console.warn("[chat-relay] clipboard failed", err);
    toast("Relay copy failed — clipboard unavailable", "");
    return { ok: false, reason: "clipboard", error: err };
  }
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Pulse Protocol trigger: a lone period (optional surrounding whitespace). */
function isPulse(text) {
  return /^\s*\.\s*$/.test(text);
}

/** Focus classifiers — sealed type only (1 Focus = 1 entity). */
function isAiNode(convo) {
  if (!convo) return false;
  const t = String(convo.type || getFocusType(convo) || "").toLowerCase();
  return t === "ai";
}

function isPerson(convo) {
  if (!convo) return false;
  const t = String(convo.type || getFocusType(convo) || "").toLowerCase();
  return t === "person";
}

function isNetwork(convo) {
  if (!convo) return false;
  const t = String(convo.type || getFocusType(convo) || "").toLowerCase();
  return t === "network";
}

/**
 * Pulse Protocol reply — Focus-specific only, no cross-write.
 * Stores/reads pulseCount, lastPulseAt, pendingPulseAction on the convo.
 */
function buildPulseReply(convo, pulseIndex) {
  // Person / Network — no autonomous AI protocol
  if (isPerson(convo) || isNetwork(convo) || !isAiNode(convo)) {
    return "Pulse received. Not AI — spellcraft only.";
  }

  // AI without alignment on file
  if (!convoAlignmentUnlocked(convo)) {
    return "Pulse received. No alignment on file. Cast Spell for Alignment Reveal, paste reply.";
  }

  // Pending action takes priority once aligned
  if (convo.pendingPulseAction) {
    return executePendingPulseAction(convo, pulseIndex);
  }

  const n = convo.alignmentProfile?.directives?.length || 0;
  return `Pulse ${pulseIndex}. Alignment on file (${n} directives). Awaiting onboarded pulse protocol.`;
}

/**
 * Execute and clear pendingPulseAction for this Focus only.
 */
function executePendingPulseAction(convo, pulseIndex) {
  const action = String(convo.pendingPulseAction || "").trim();
  convo.pendingPulseAction = null;

  if (!action) {
    const n = convo.alignmentProfile?.directives?.length || 0;
    return `Pulse ${pulseIndex}. Alignment on file (${n} directives). Awaiting onboarded pulse protocol.`;
  }

  // Known actions (Focus-local only)
  if (/^spell\b|craft|cast/i.test(action)) {
    const spell = generateAndStoreSpell(convo, action, { silentToast: true });
    if (spell?.blocked) {
      return `Pulse ${pulseIndex}. Pending action blocked: ${spell.reason}`;
    }
    if (spell && !spell.blocked) {
      return `Pulse ${pulseIndex}. Executed pending pulse action → spell forged: **${spell.purpose}**. Open Spells panel.`;
    }
  }

  return `Pulse ${pulseIndex}. Executed pending pulse action: ${action}`;
}

function autoResizeTextarea() {
  const ta = els.chatInput;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
}

/** Sealed channel for active Focus — never rewrites backend. */
function currentMedium(convo) {
  return getSealedChannel(convo);
}

function syncMediumFromControls(convo) {
  // Channel is sealed at creation; spellcraft only reads it.
  return getSealedChannel(convo);
}

function typeLabel(convo) {
  return sealedChannelLabel(convo);
}

/** Alignment *spell* exists in panel (cast already). */
function convoHasAlignmentSpell(convo) {
  return hasAlignmentSpell(state.spells, convo.id);
}

/** Spellcraft unlocked only after alignment *reply* received. */
function convoAlignmentUnlocked(convo) {
  if (!convo) return false;
  if (convo.alignmentRevealed || convo.alignmentReceived || convo.alignmentNotes)
    return true;
  if (convo.alignmentProfile?.directives?.length) return true;
  return false;
}

/** @deprecated name kept for call sites — means "alignment spell on file" */
function convoHasAlignment(convo) {
  return convoHasAlignmentSpell(convo);
}

function hasAlignmentDirective(convo) {
  return (convo.messages || []).some(
    (m) =>
      m.kind === "alignment-directive" ||
      (m.role === "grimoire" &&
        /Before I can craft precise spells, we need transparency/i.test(
          m.text || ""
        ))
  );
}

// ─── Render: sidebar (search + folders + pin + DnD + indicators) ───

/** Last activity timestamp for a Focus (messages, spells, updatedAt). */
function focusLastUpdated(convo) {
  if (!convo) return 0;
  let maxTs = Number(convo.updatedAt || convo.createdAt || 0) || 0;
  for (const m of convo.messages || []) {
    const t = Number(m.ts || m.createdAt || 0);
    if (t > maxTs) maxTs = t;
  }
  for (const s of state.spells || []) {
    if (s.conversationId !== convo.id) continue;
    const t = Number(s.sentAt || s.createdAt || 0);
    if (t > maxTs) maxTs = t;
  }
  return maxTs;
}

/** Relative time chip — compact for sidebar. */
function formatRelativeTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - Number(ts);
  if (diff < 0) return "now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const mo = Math.floor(day / 30);
  return `${mo}mo`;
}

/** Unread message count (messages after lastViewedAt, excluding active focus). */
function unreadCount(convo) {
  if (!convo || convo.id === state.activeId) return 0;
  const last = Number(convo.lastViewedAt || 0) || 0;
  return (convo.messages || []).filter((m) => {
    if (!m) return false;
    if (m.role === "system" || m.kind === "focus-suggestion") return false;
    const t = Number(m.ts || m.createdAt || 0);
    return t > last;
  }).length;
}

/** Linked node count for indicator (sibling focuses / ecosystem). */
function linkedNodeCount(convo) {
  if (!convo) return 0;
  const sameName = (state.conversations || []).filter(
    (f) => f.id !== convo.id && String(f.name || "").toLowerCase() === String(convo.name || "").toLowerCase()
  ).length;
  const others = Math.max(0, (state.conversations || []).length - 1);
  // Prefer same-name dual-channel count; fall back to thin ecosystem signal
  return sameName || Math.min(others, 6);
}

/**
 // Instant live filter: name, sealed node/channel, type, tags, keywords.
 */
function focusMatchesSearch(convo, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  if (!convo) return false;
  const channel = getSealedChannel(convo);
  const type = getFocusType(convo);
  const tags = (convo.tags || []).join(" ");
  const hay = [
    convo.name,
    channel,
    type,
    convo.backend,
    convo.medium,
    convo.model,
    convo.aiSubtype,
    tags,
    sealedChannelLabel(convo),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (hay.includes(q)) return true;
  // Multi-token: all tokens must match somewhere
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => hay.includes(t))) return true;
  // Keyword scan recent user/grimoire messages (light)
  const msgs = (convo.messages || []).slice(-12);
  for (const m of msgs) {
    if (String(m.text || "").toLowerCase().includes(q)) return true;
  }
  return false;
}

function getSortedFocusFolders() {
  const folders = Array.isArray(state.focusFolders) ? state.focusFolders : [];
  return [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function sortFocusesForDisplay(list) {
  return [...list].sort((a, b) => {
    const pinA = a.pinned ? 1 : 0;
    const pinB = b.pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    // Preserve array order (operator drag order) as stable secondary
    const ia = state.conversations.indexOf(a);
    const ib = state.conversations.indexOf(b);
    return ia - ib;
  });
}

window.__renderConvoList = renderConvoList;
function renderConvoList() {
  // One GRIMOIRE book · collapse clones before paint (survives stale localStorage)
  try {
    if (typeof mergeGrimoireNameClones === "function" && mergeGrimoireNameClones(state) > 0) {
      persist();
    }
  } catch (e) {
    console.warn("[sidebar] mergeGrimoireNameClones", e);
  }
  console.debug("[sidebar] render start", {
    convoList: !!els.convoList,
    conversations: (state.conversations || []).length,
    activeId: state.activeId,
    query: state.focusSearchQuery,
  });
  if (!els.convoList) {
    console.warn("[sidebar] els.convoList missing");
    return;
  }
  try { els.convoList.innerHTML = ""; } catch (e) { console.warn("[sidebar] innerHTML clear failed", e); }

  const query = state.focusSearchQuery || "";
  // Cell2 Core is system substrate — never show in sidebar
  const all = (state.conversations || []).filter((c) => isVisibleFocus(c));
  const matched = all.filter((c) => focusMatchesSearch(c, query));
  console.debug("[sidebar] matched", matched.map((c) => c.id + "::" + c.name));
  const searching = Boolean(String(query).trim());

  if (els.focusSearchCount) {
    if (searching) {
      els.focusSearchCount.hidden = false;
      els.focusSearchCount.textContent = matched.length + "/" + all.length;
    } else {
      els.focusSearchCount.hidden = true;
      els.focusSearchCount.textContent = "";
    }
  }

  if (!matched.length) {
    const empty = document.createElement("div");
    empty.className = "focus-list-empty";
    empty.textContent = searching ? "No focuses match" : "No focuses yet";
    els.convoList.appendChild(empty);
    console.debug("[sidebar] empty state rendered");
    return;
  }

  const pinned = matched.filter((c) => c.pinned);
  const unpinned = matched.filter((c) => !c.pinned);
  // When searching: show flat matched list (pin mark still on row). No dual section.
  if (searching) {
    const flat = sortFocusesForDisplay(matched);
    for (const c of flat) {
      try {
        els.convoList.appendChild(buildFocusRow(c));
      } catch (e) {
        console.warn("[sidebar] row append failed", c.id, e);
      }
    }
    return;
  }
  // Normal: pinned section once, then unpinned only (never re-list pinned)
  if (pinned.length) {
    const pinHeader = document.createElement("div");
    pinHeader.className = "focus-group-header focus-group-pinned";
    pinHeader.innerHTML =
      '<span class="focus-group-name">★ Pinned</span><span class="focus-group-count">' +
      pinned.length +
      "</span>";
    els.convoList.appendChild(pinHeader);
    for (const c of pinned) els.convoList.appendChild(buildFocusRow(c));
  }
  const flat = sortFocusesForDisplay(unpinned);
  for (const c of flat) {
    try {
      els.convoList.appendChild(buildFocusRow(c));
    } catch (e) {
      console.warn("[sidebar] row append failed", c.id, e);
    }
  }
}

/**
 * Confirmed per-focus vault path only.
 * Requires LS grimoire-intel-folder-ready-<focusId> === "1" (or live handle).
 * Soft migration vaultLinked flags alone do NOT count — no icon on legacy rows.
 */
function isFocusPathLinked(c) {
  if (!c?.id) return false;
  try {
    return Boolean(isFocusVaultLinked(c.id));
  } catch {
    return false;
  }
}

/**
 * Legacy focuses that already had real chat/spell use before the hard path gate.
 * Exempt from lock until they voluntarily link a folder.
 */
function focusWasActivelyUsed(c) {
  if (!c) return false;
  if (c.system) return true;
  if (getFocusType(c) === "eternal-intelligence") return true;
  const msgs = Array.isArray(c.messages) ? c.messages : [];
  // Real operator participation
  if (msgs.some((m) => m && m.role === "user")) return true;
  try {
    if ((state.spells || []).some((s) => s && s.conversationId === c.id)) return true;
  } catch {
    /* ignore */
  }
  // Multi-turn grimoire densen (beyond a single seal seed)
  const substantive = msgs.filter(
    (m) =>
      m &&
      (m.role === "user" || m.role === "grimoire") &&
      m.kind !== "alignment-directive"
  );
  if (substantive.length >= 2) return true;
  if (msgs.length >= 4) return true;
  return false;
}

/**
 * HARD GATE: focus cannot chat / cast / bus until a vault folder is linked.
 * System substrate and pathGateExempt (actively used legacy) may operate without a folder.
 * Dismissing the callout never unlocks — only a confirmed per-focus path does.
 */
function isFocusLocked(convo) {
  if (!convo?.id) return false;
  if (isCell2CoreFocus(convo)) return false;
  if (convo.system) return false;
  if (isFocusPathLinked(convo)) return false;
  if (convo.pathGateExempt === true) return false;
  // needsPathOnboarding (new focuses) or any non-exempt focus without a real folder
  return true;
}

/**
 * Sidebar "Create my path" callout while locked.
 * Session dismiss hides it only until reload/re-select — lock remains.
 */
function focusNeedsPathOnboarding(c) {
  if (!c || !isVisibleFocus(c) || isCell2CoreFocus(c)) return false;
  if (!isFocusLocked(c)) return false;
  if (pathCalloutSessionDismissed.has(c.id)) return false;
  return true;
}

/** Sidebar no longer pulses for path gate (center + 📁 handle that). */
function focusShowsFreshHighlight(_c) {
  return false;
}

/** Folder icon / vault-backed class — only when a real folder was linked. */
function focusIsVaultBacked(c) {
  if (!c || isCell2CoreFocus(c)) return false;
  return isFocusPathLinked(c);
}

function dismissPathOnboarding(focusId) {
  // Session hide only — never unlock. Callout returns on next select/reload.
  pathCalloutSessionDismissed.add(focusId);
  renderConvoList();
}

/** Mark a single focus as vault-backed after its own folder is chosen. */
function markFocusVaultLinked(focusId) {
  const c = state.conversations.find((x) => x.id === focusId);
  if (!c) return;
  c.vaultLinked = true;
  c.needsPathOnboarding = false;
  c.pathOnboardingDismissed = true;
  c.pathGateExempt = false;
  pathCalloutSessionDismissed.delete(focusId);
}

function buildPathOnboardingCallout(c) {
  const box = document.createElement("div");
  box.className = "focus-path-callout";
  box.dataset.focusId = c.id;
  box.setAttribute("role", "region");
  box.setAttribute("aria-label", `Vault path for ${c.name}`);
  const folderHint = focusVaultFolderName(c.name || c.id);

  box.innerHTML = `
    <button type="button" class="focus-path-dismiss" title="Hide callout (focus stays locked)" aria-label="Hide path callout">×</button>
    <div class="focus-path-callout-body">
      <p class="focus-path-text">Link vault folder to unlock this focus<br><span class="focus-path-folder-hint">Creates <code>${escapeHtml(folderHint)}/</code> · chat &amp; Cast locked until linked</span></p>
      <button type="button" class="btn-path-link" data-action="link-path">Create my path</button>
    </div>
  `;

  box.querySelector(".focus-path-dismiss")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dismissPathOnboarding(c.id);
  });
  box.querySelector('[data-action="link-path"]')?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.activeId = c.id;
    persist();
    await onChooseFocusPath(c);
  });

  return box;
}

/**
 * Per-focus path link — user gesture → OS folder picker → vault dir for this focus.
 */
async function onChooseFocusPath(focus) {
  if (!focus?.id) return;
  if (!hasDirectoryPicker()) {
    toast("Use Chrome or Edge (not Firefox) for folder access", "");
    return;
  }
  try {
    const handle = await chooseFocusIntelligenceFolder(focus);
    // Unlock even if later UI refresh fails
    setVaultFailState(false);
    markFocusVaultLinked(focus.id);
    scrubStaleVaultLockMessages(focus);
    mergeGrimoireNameClones(state);
    persist();
    toast(`Vault ready: ${handle.name}/ · focus unlocked`, "success");
    activityPing(`✦ Focus vault: ${handle.name}/`);
    try {
      await refreshIntelFolderUi();
    } catch {
      /* ignore */
    }
    renderAll();
  } catch (err) {
    if (err?.name === "AbortError") {
      // User closed the picker — not an error
      return;
    }
    console.error("[vault] choose focus path failed", err);
    setVaultFailState(true);
    const detail = String(err?.message || err?.name || err || "unknown error").slice(0, 120);
    toast(`Could not open folder: ${detail}`, "");
    renderAll();
  }
}

/** Block chat/cast/bus for locked focuses; toast optional. */
function refuseIfFocusLocked(convo, { silent = false } = {}) {
  if (!isFocusLocked(convo)) return false;
  if (!silent) {
    toast("Locked — link vault folder first", "");
  }
  return true;
}

/**
 * Obvious path-gate chrome: arrow on 📁 + center lock card.
 * Show only when active focus is locked. Never traps navigation.
 */
function updatePathGateUi(convo = activeConvo()) {
  const locked = Boolean(convo && isFocusLocked(convo));
  const cue = els.vaultFolderGateCue || document.getElementById("vault-folder-gate-cue");
  const gate = els.focusPathLockGate || document.getElementById("focus-path-lock-gate");
  const wrap = els.vaultFolderBtnWrap || document.getElementById("vault-folder-btn-wrap");

  if (cue) {
    if (locked) cue.removeAttribute("hidden");
    else cue.setAttribute("hidden", "");
  }
  if (gate) {
    if (locked) {
      gate.removeAttribute("hidden");
      const lead = gate.querySelector(".focus-path-lock-gate-lead");
      if (lead) {
        lead.textContent = "Click the folder icon to link a vault folder";
      }
      const title = gate.querySelector(".focus-path-lock-gate-title");
      if (title) {
        title.textContent = "Before you can speak to this focus...";
      }
      const sub = gate.querySelector(".focus-path-lock-gate-sub");
      if (sub) {
        sub.textContent = "This is where this focus writes its intelligence";
      }
    } else {
      gate.setAttribute("hidden", "");
    }
  }
  if (wrap) wrap.classList.toggle("vault-gate-active", locked);
  if (els.app) els.app.classList.toggle("focus-path-locked", locked);

  // Folder button title nudges the required action while locked
  if (els.btnIntelFolder && locked) {
    els.btnIntelFolder.title = "Link vault folder for this focus — required before chat / Cast Spell";
    els.btnIntelFolder.setAttribute("aria-description", "Required: link vault folder for the active focus");
  }

  if (els.constellationPing && locked) {
    els.constellationPing.textContent = "Link vault folder first — click 📁";
  }
}

function buildFocusRow(c) {
  /* archetype removed — name-only sidebar; type/model/channel stay internal */
  const pending = pendingCount(c.id);
  const unread = unreadCount(c);

  const row = document.createElement("div");
  row.className =
    "convo-item" +
    (c.id === state.activeId ? " active" : "") +
    (c.pinned ? " pinned" : "");
  row.setAttribute("role", "listitem");
  row.dataset.focusId = c.id;
  row.draggable = true;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "convo-item-main";
  // Hover title only — never painted as row chrome
  btn.title = String(c.name || "Focus");

  // Spell badge first (same truth as Active tab). Unread is secondary dim chip.
  const badgeParts = [];
  if (pending > 0) {
    badgeParts.push(
      `<span class="convo-badge" title="${pending} ready spell${pending === 1 ? "" : "s"}">${pending}</span>`
    );
  } else if (unread > 0) {
    badgeParts.push(
      `<span class="convo-badge unread" title="${unread} unread message${unread === 1 ? "" : "s"}">${unread}</span>`
    );
  }

  ensureFleetFocusFields(c);
  const breath = c.breathingStatus || deriveBreathingStatus(c);
  const breathTitle = c.linkedSession
    ? `${breath} · ${c.linkedSession}${c.currentMission ? ` · ${c.currentMission}` : ""}`
    : `${breath} · no session linked`;
  row.dataset.breathing = breath;
  if (c.linkedSession) row.classList.add("has-session");
  if (breath === "Dead") row.classList.add("breath-dead");

  const channel = getSealedChannel(c);
  const channelLabel = sealedChannelLabel(c);
  btn.innerHTML = `
    <span class="convo-text">
      <span class="convo-name-row">
        <span class="breath-dot" data-breath="${escapeHtml(breath)}" title="${escapeHtml(breathTitle)}" aria-label="Breathing ${escapeHtml(breath)}"></span>
        ${c.pinned ? `<span class="convo-pin-mark" title="Pinned" aria-hidden="true">★</span>` : ""}
        <span class="convo-name">${escapeHtml(c.name)}</span>
      </span>
      <span class="convo-channel" title="${escapeHtml(channelLabel)}">${escapeHtml(channel || "—")}</span>
    </span>
    ${badgeParts.join("")}
  `;
  btn.addEventListener("click", () => selectConvo(c.id));

  const actions = document.createElement("div");
  actions.className = "focus-row-actions";

  const pinBtn = document.createElement("button");
  pinBtn.type = "button";
  pinBtn.className = "focus-action-btn" + (c.pinned ? " on" : "");
  pinBtn.title = c.pinned ? "Unpin focus" : "Pin / favorite";
  pinBtn.setAttribute("aria-label", c.pinned ? `Unpin ${c.name}` : `Pin ${c.name}`);
  pinBtn.textContent = c.pinned ? "★" : "☆";
  pinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFocusPinned(c.id);
  });

  const tagBtn = document.createElement("button");
  tagBtn.type = "button";
  tagBtn.className = "focus-action-btn";
  tagBtn.title = "Edit tags";
  tagBtn.setAttribute("aria-label", `Tags for ${c.name}`);
  tagBtn.textContent = "#";
  tagBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    editFocusTags(c.id);
  });

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = "focus-action-btn";
  exportBtn.title = "Export dossier (.md)";
  exportBtn.setAttribute("aria-label", `Export dossier for ${c.name}`);
  exportBtn.textContent = "⇩";
  exportBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    exportFocusDossier(c.id);
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "focus-delete-btn";
  del.title = `Delete focus ${c.name} · ${channel}`;
  del.setAttribute("aria-label", `Delete focus ${c.name}`);
  del.textContent = "✕";
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    requestDeleteFocus(c.id);
  });

  actions.appendChild(pinBtn);
  actions.appendChild(tagBtn);
  actions.appendChild(exportBtn);
  actions.appendChild(del);

  row.appendChild(btn);
  row.appendChild(actions);

  // Right-click: Delete focus (discoverable without hunting tiny ✕)
  row.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    requestDeleteFocus(c.id);
  });

  wireFocusDrag(row, c);
  return row;
}

// ─── Focus org: pin / tags / folders / search / DnD / export ───

function toggleFocusPinned(focusId) {
  const focus = state.conversations.find((c) => c.id === focusId);
  if (!focus) return;
  ensureFocusOrgFields(focus, { assignFolder: false });
  focus.pinned = !focus.pinned;
  focus.updatedAt = Date.now();
  persist();
  renderConvoList();
  toast(focus.pinned ? `Pinned ${focus.name}` : `Unpinned ${focus.name}`, "success");
}

function editFocusTags(focusId) {
  const focus = state.conversations.find((c) => c.id === focusId);
  if (!focus) return;
  ensureFocusOrgFields(focus, { assignFolder: false });
  const current = (focus.tags || []).join(", ");
  const next = window.prompt(
    `Tags for ${focus.name} (comma-separated)\nSearchable keywords.`,
    current
  );
  if (next === null) return;
  focus.tags = next
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
  focus.updatedAt = Date.now();
  persist();
  renderConvoList();
  toast(focus.tags.length ? `Tags: ${focus.tags.join(", ")}` : "Tags cleared", "success");
}

function toggleFolderCollapsed(folderId) {
  const folder = (state.focusFolders || []).find((f) => f.id === folderId);
  if (!folder) return;
  folder.collapsed = !folder.collapsed;
  persist();
  renderConvoList();
}

function renameFocusFolder(folderId) {
  const folder = (state.focusFolders || []).find((f) => f.id === folderId);
  if (!folder) return;
  const next = window.prompt("Rename group", folder.name);
  if (next === null) return;
  const name = next.trim();
  if (!name) return;
  folder.name = name.slice(0, 48);
  persist();
  renderConvoList();
  toast(`Group renamed: ${folder.name}`, "success");
}

function deleteFocusFolder(folderId) {
  const folder = (state.focusFolders || []).find((f) => f.id === folderId);
  if (!folder) return;
  const ok = window.confirm(
    `Delete group “${folder.name}”?\n\nFocuses inside become Ungrouped. Focuses themselves are not deleted.`
  );
  if (!ok) return;
  state.focusFolders = (state.focusFolders || []).filter((f) => f.id !== folderId);
  for (const c of state.conversations || []) {
    if (c.folderId === folderId) c.folderId = null;
  }
  persist();
  renderConvoList();
  toast(`Group removed: ${folder.name}`, "success");
}

function createFocusFolder() {
  const name = window.prompt("New folder / group name", "");
  if (name === null) return;
  const trimmed = name.trim().slice(0, 48);
  if (!trimmed) return;
  if (!Array.isArray(state.focusFolders)) state.focusFolders = [];
  const id = `folder-${trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "group"}-${Date.now().toString(36).slice(-4)}`;
  const order = state.focusFolders.reduce((m, f) => Math.max(m, f.order ?? 0), -1) + 1;
  state.focusFolders.push({ id, name: trimmed, collapsed: false, order });
  persist();
  renderConvoList();
  toast(`Group created: ${trimmed}`, "success");
}

function moveFocusToFolder(focusId, folderId) {
  const focus = state.conversations.find((c) => c.id === focusId);
  if (!focus) return;
  ensureFocusOrgFields(focus, { assignFolder: false });
  const next = folderId || null;
  if (focus.folderId === next) return;
  focus.folderId = next;
  focus.updatedAt = Date.now();
  persist();
  renderConvoList();
}

/**
 * Reorder conversations array so `focusId` sits before `beforeId`
 * (or at end if beforeId is null). Keeps drag order as source of truth.
 */
function reorderFocuses(focusId, beforeId, targetFolderId) {
  const list = state.conversations;
  const from = list.findIndex((c) => c.id === focusId);
  if (from < 0) return;
  const [item] = list.splice(from, 1);
  ensureFocusOrgFields(item, { assignFolder: false });
  if (targetFolderId !== undefined) {
    item.folderId = targetFolderId || null;
  }
  item.updatedAt = Date.now();
  if (!beforeId) {
    list.push(item);
  } else {
    let to = list.findIndex((c) => c.id === beforeId);
    if (to < 0) list.push(item);
    else list.splice(to, 0, item);
  }
  persist();
  renderConvoList();
}

let _dragFocusId = null;

function wireFocusDrag(row, focus) {
  row.addEventListener("dragstart", (e) => {
    _dragFocusId = focus.id;
    row.classList.add("dragging");
    try {
      e.dataTransfer.setData("text/plain", focus.id);
      e.dataTransfer.effectAllowed = "move";
    } catch {
      /* IE / restricted */
    }
  });
  row.addEventListener("dragend", () => {
    _dragFocusId = null;
    row.classList.remove("dragging");
    els.convoList?.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
  });
  row.addEventListener("dragover", (e) => {
    if (!_dragFocusId || _dragFocusId === focus.id) return;
    e.preventDefault();
    row.classList.add("drag-over");
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {
      /* ignore */
    }
  });
  row.addEventListener("dragleave", () => {
    row.classList.remove("drag-over");
  });
  row.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    row.classList.remove("drag-over");
    const id = _dragFocusId || e.dataTransfer?.getData("text/plain");
    if (!id || id === focus.id) return;
    // Place dragged item before this row; adopt this row's folder
    const targetFolder =
      focus.folderId !== undefined ? focus.folderId : null;
    reorderFocuses(id, focus.id, targetFolder);
  });
}



/** One-click export of Focus intelligence dossier as markdown download. */
function exportFocusDossier(focusId) {
  const focus = state.conversations.find((c) => c.id === focusId);
  if (!focus) return;
  try {
    const md = buildFocusMarkdown(focus, state.spells || []);
    const name = focusFileName(focus) || `${focus.id}.md`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(`Dossier exported: ${name}`, "success");
  } catch (err) {
    console.warn("exportFocusDossier failed", err);
    toast("Export failed", "error");
  }
}

function onFocusSearchInput() {
  state.focusSearchQuery = els.focusSearch?.value || "";
  renderConvoList();
}

/**
 * Permanent Focus delete — spells, chat, intelligence file, localStorage.
 * No undo.
 */
async function requestDeleteFocus(focusId) {
  const focus = state.conversations.find((c) => c.id === focusId);
  if (!focus) return;

  if (isCell2CoreFocus(focus) || focus.system) {
    toast("Cell2 Core is system intelligence substrate — cannot purge", "");
    return;
  }

  const channel = getSealedChannel(focus);
  const label = `${focus.name} · ${channel}`;
  const protectedNote = isPurgeProtected(focus)
    ? `\n\n⚠ OPERATOR-CRITICAL (purgeProtected). AI cannot auto-delete this focus. Jacob is the crown.`
    : "";
  const ok = window.confirm(
    `Delete ${label}?\n\nThis removes all spells and intelligence data for this sealed channel.\n\nNo undo. Permanent.${protectedNote}`
  );
  if (!ok) return;

  // Operator crown — force after explicit confirm
  await deleteFocus(focusId, { source: "operator", force: true });
}

/**
 * Delete a focus. Operator-critical focuses (purgeProtected) cannot be
 * auto-deleted by AI — Jacob is the crown. Operator UI may force after confirm.
 *
 * @param {string} focusId
 * @param {{ source?: string, force?: boolean }} [opts]
 */
async function deleteFocus(focusId, opts = {}) {
  const focus = state.conversations.find((c) => c.id === focusId);
  if (!focus) return { ok: false, reason: "missing" };

  const source = String(opts.source || "operator").toLowerCase();
  const force = opts.force === true;
  const label = `${focus.name} · ${getSealedChannel(focus)}`;

  // Governance: purgeProtected focuses block all non-operator deletes
  const refuse = refuseAutoPurge(focus, { source });
  if (refuse.refused) {
    console.error(
      "[governance] PURGE BLOCKED — purgeProtected focus cannot be auto-deleted:",
      focus.name,
      focus.id,
      "source=",
      source
    );
    toast("Protected focus — AI cannot auto-delete. Jacob is the crown.", "");
    activityPing(`✦ Purge blocked · ${focus.name} · purgeProtected`);
    pushBusActivity({
      kind: "governance",
      summary: `Purge blocked · ${focus.name}`,
      nodeName: focus.name,
      localOnly: true,
      detail: refuse.reason,
    });
    return { ok: false, reason: "purge_protected", protected: true };
  }
  if (isPurgeProtected(focus) && source !== "operator" && source !== "jacob" && source !== "user") {
    console.error(
      "[governance] PURGE BLOCKED — non-operator delete of purgeProtected:",
      focus.name,
      focus.id
    );
    toast("Protected focus — cannot auto-delete", "");
    return { ok: false, reason: "purge_protected", protected: true };
  }
  if (isPurgeProtected(focus) && !force && source === "operator") {
    // Extra safety: operator path must pass force:true after confirm
    console.error(
      "[governance] PURGE BLOCKED — operator must force:true after confirm:",
      focus.name
    );
    toast("Protected focus — confirm Healer purge with force", "");
    return { ok: false, reason: "needs_force", protected: true };
  }

  // Remove spells for this focus
  state.spells = state.spells.filter((s) => s.conversationId !== focusId);

  // Remove focus from list
  state.conversations = state.conversations.filter((c) => c.id !== focusId);

  // Active focus fallback (skip system/hidden Cell2)
  if (state.activeId === focusId) {
    state.activeId =
      state.conversations.find((c) => isVisibleFocus(c))?.id || null;
  }

  // Disk intelligence file
  try {
    await deleteFocusIntelligenceFile(focus);
  } catch (err) {
    console.warn("Could not remove intelligence file", err);
  }

  // Purge Focus references from saved browser state
  purgeFocusFromStorage(focusId, focus);

  persist();
  renderAll();
  toast(`Focus purged: ${label}`, "success");
  return { ok: true };
}

// Heal dual Wizard King / sealed-channel clones every boot (merge, never silent wipe).
// purgeProtected blocks AI auto-DELETE; merge preserves all messages into the keeper.
try {
  const n = mergeDuplicateSealedFocuses(state);
  ensureActiveFocus(state);
  if (n > 0) {
    try {
      persist();
    } catch {
      try {
        saveState(state);
      } catch {
        /* ignore */
      }
    }
  }
  // Clear legacy one-shot keys that previously deleted without merge
  try {
    localStorage.removeItem("grimoire-wizard-king-deduped-v1");
    localStorage.removeItem("grimoire-wizard-king-deduped-v2");
  } catch {
    /* ignore */
  }
} catch {
  /* ignore */
}

/** Remove all cached traces of a Focus from localStorage/vault state. */
function purgeFocusFromStorage(focusId, focus) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return;

    const id = String(focusId || "").trim();
    if (!id) return;

    let changed = false;
    if (Array.isArray(data.conversations)) {
      const before = data.conversations.length;
      data.conversations = data.conversations.filter((c) => String(c?.id || "").trim() !== id);
      changed = changed || data.conversations.length !== before;
    }
    if (Array.isArray(data.spells)) {
      const before = data.spells.length;
      data.spells = data.spells.filter((s) => String(s?.conversationId || "").trim() !== id);
      changed = changed || data.spells.length !== before;
    }
    if (data.activeId === focusId) {
      data.activeId = (data.conversations && data.conversations[0]?.id) || null;
      changed = true;
    }
    if (Array.isArray(data.focusFolders)) {
      // keep folders; no per-focus folder cleanup needed beyond conversations
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore quota/parse errors
  }

  // Vault file cleanup is already attempted above; keep silent on missing files.
}

// ─── Render: chat ───

function setChatControlsEnabled(enabled) {
  if (els.chatInput) els.chatInput.disabled = !enabled;
  if (els.btnSend) els.btnSend.disabled = !enabled;
  if (els.btnCast) els.btnCast.disabled = !enabled;
  if (els.btnAttach) els.btnAttach.disabled = !enabled;
  const bar = els.chatForm?.closest?.(".chat-input-bar") || document.querySelector(".chat-input-bar");
  if (bar) {
    bar.classList.toggle("chat-locked", !enabled && !!activeConvo() && isFocusLocked(activeConvo()));
  }
  // focus-path-locked class is owned by updatePathGateUi()
}

function renderChat() {
  const convo = activeConvo();
  els.chatMessages.innerHTML = "";

  if (!convo) {
    els.entityIcon.textContent = "—";
    els.entityName.textContent = "—";
    els.entityType.textContent = "—";
    if (els.sealedChannelValue) els.sealedChannelValue.textContent = "—";
    if (els.universeStage) els.universeStage.textContent = "VOID";
    if (els.spellCount) els.spellCount.textContent = "";
    if (els.spellCount) els.spellCount.dataset.count = "0";
    setChatControlsEnabled(false);
    updatePathGateUi(null);
    syncChatRelayUi(null);
    if (els.chatInput) els.chatInput.placeholder = "Select a focus to begin casting spells.";
    if (els.constellationPing) els.constellationPing.textContent = "Select a focus";
    if (els.universeHudStage) els.universeHudStage.textContent = "VOID · 0% · —";
    const empty =
      els.emptyState ||
      (() => {
        const d = document.createElement("div");
        d.className = "empty-state";
        d.id = "empty-state";
        d.innerHTML = `
          <div class="empty-glyph">—</div>
          <p>Select a focus to begin casting spells.</p>
          <p class="empty-hint">No spells. No history. No connection.</p>
        `;
        els.emptyState = d;
        return d;
      })();
    els.chatMessages.appendChild(empty);
    return;
  }

  /* archetype removed */
  els.entityIcon.textContent = "✧";
  els.entityName.textContent = convo.name;
  els.entityType.textContent = typeof typeLabel === "function" ? typeLabel(convo) : (convo.type || "—");
  if (els.sealedChannelValue) {
    els.sealedChannelValue.textContent = getSealedChannel(convo);
  }
  syncChatRelayUi(convo);
  if (els.universeStage) {
    const snap = deriveFocusSnapshot(convo, state.spells);
    els.universeStage.textContent = `${getSealedChannel(convo)} · ${snap?.stageName || "VOID"}`;
  }

  const locked = isFocusLocked(convo);
  if (!locked) scrubStaleVaultLockMessages(convo);
  setChatControlsEnabled(!locked);
  updatePathGateUi(convo);
  if (locked) {
    if (els.chatInput) {
      els.chatInput.value = "";
      els.chatInput.placeholder = "🔒 Link vault folder to unlock";
    }
    // Big center gate card is in #focus-path-lock-gate (HTML).
    // Chat log stays empty-state clean so the card is impossible to miss.
    // Prior history still readable after unlock; while locked we only show a light note.
    const note = document.createElement("div");
    note.className = "empty-state focus-lock-banner focus-lock-banner-quiet";
    note.innerHTML = `
      <p class="empty-hint"><strong>${escapeHtml(convo.name)}</strong> · chat &amp; Cast Spell unlock after the folder is linked. Other focuses stay free to select.</p>
    `;
    els.chatMessages.appendChild(note);
    els.chatMessages.scrollTop = 0;
    updateUniverseSystemLabels(convo);
    // Relay chrome still reflects linked session even while vault-locked
    syncChatRelayUi(convo);
    return;
  }

  if (isAiNode(convo) && !convoAlignmentUnlocked(convo)) {
    els.chatInput.placeholder = `Speak about ${convo.name} — /msg · /bus list · Cast Spell…`;
  } else if (isAiNode(convo)) {
    els.chatInput.placeholder = `Speak about ${convo.name} — /msg <node> <msg> · /bus · Cast Spell…`;
  } else {
    els.chatInput.placeholder = `Speak about ${convo.name}… · /msg · /bus list · talk to <node>`;
  }

  if (!convo.messages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-glyph">✧</div>
      <p>Focus on <strong>${escapeHtml(convo.name)}</strong> is open.</p>
      <p class="empty-hint">${
        isAiNode(convo)
          ? "AI nodes start with Alignment Reveal. Speak about the node → stars densen → Cast Spell consolidates atlas + ready stack. Spells panel only."
          : "Talk about them — Grimoire remembers eternally. Cast Spell consolidates intel into messages <em>or</em> action-spells."
      }</p>
    `;
    els.chatMessages.appendChild(empty);
    return;
  }

  // System labels (frame held / receipt densen) only in universe view — never in AI chat
  convo.messages.forEach((m) => {
    if (m.kind === "focus-suggestion") return;
    if (m.role === "spell") return;

    // Inbound receipts → system labels (universe view chrome only)
    if (m.kind === "inbound-intel") return;

    // Explicit system-role messages stay out of chat UI
    if (m.role === "system" || m.role === "System") return;

    els.chatMessages.appendChild(renderMessage(m));
  });

  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  // Universe view chrome carries system labels when chat is hidden
  updateUniverseSystemLabels(convo);
}

function renderMessage(m) {
  const div = document.createElement("div");
  if (m.role === "user") {
    div.className = "message user";
  } else if (m.role === "grimoire") {
    div.className = "message grimoire";
  } else {
    // System messages are not shown in AI chat (universe view only)
    div.className = "message system system-chat-hidden";
  }
  const roleLabel =
    m.role === "user" ? "You" : m.role === "grimoire" ? "Grimoire" : "System";
  const msgId = m.id || "";

  const imagesHtml = (Array.isArray(m.images) && m.images.length)
    ? `<div class="message-images">${m.images.map((src) => `<img src="${escapeAttr(src)}" alt="Pasted image" loading="lazy" />`).join("")}</div>`
    : "";

  div.innerHTML = `
    <div class="message-header message-role">${roleLabel}</div>
    <div class="message-row">
      <div class="message-body">${imagesHtml}${formatMessageHtml(m.text)}</div>
    </div>
    <button type="button" class="copy-btn btn-copy-msg" data-msg-id="${escapeAttr(msgId)}" title="Copy message">Copy</button>
  `;
  return div;
}

/** Map inbound / system messages → short system labels for universe view only. */
function systemLabelFromMessage(m) {
  if (!m) return null;
  if (m.kind === "inbound-intel") {
    if (isHoldOrLoopReply(m.text)) return "System frame held — not recast";
    if (isInboundNodeIntel(m.text)) return "Node receipt densened — no new spell forged";
    return "Inbound intel densened";
  }
  if (m.role === "system" || m.role === "System") {
    const t = String(m.text || "").replace(/\s+/g, " ").trim();
    return t ? t.slice(0, 120) : "System";
  }
  return null;
}

/** Latest system labels for the active Focus (deduped, newest last). */
function collectSystemLabels(convo, limit = 4) {
  if (!convo) return [];
  const out = [];
  let lastInbound = null;
  for (const m of convo.messages || []) {
    if (m.kind === "inbound-intel") {
      const label = systemLabelFromMessage(m);
      if (label && label !== lastInbound) {
        out.push(label);
        lastInbound = label;
      }
      continue;
    }
    lastInbound = null;
    const label = systemLabelFromMessage(m);
    if (label) out.push(label);
  }
  return out.slice(-limit);
}

/**
 * System labels live only in universe view (chat hidden).
 * Never shown as chat bubbles while AI chat is visible.
 */
function updateUniverseSystemLabels(convo) {
  const host = els.universeViewSystemLabels || document.getElementById("universe-view-system-labels");
  if (!host) return;
  if (!state.universeView) {
    host.innerHTML = "";
    host.hidden = true;
    return;
  }
  const labels = collectSystemLabels(convo || activeConvo());
  if (!labels.length) {
    host.innerHTML = "";
    host.hidden = true;
    return;
  }
  host.hidden = false;
  host.innerHTML = labels
    .map(
      (label) =>
        `<span class="universe-system-label" title="${escapeAttr(label)}">${escapeHtml(label)}</span>`
    )
    .join("");
}

const MAX_IMAGES_PER_SEND = 9;
const IMG_MAX_DIM = 768;
const IMG_JPEG_QUALITY = 0.72;

/**
 * Compress an image File → small base64 data URL (~50KB).
 * Keeps the eternal store (localStorage) healthy: hundreds of captures, not 3.
 */
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, IMG_MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", IMG_JPEG_QUALITY));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Could not load pasted image"));
    };
    img.src = blobUrl;
  });
}

async function queuePastedImages(files) {
  const convo = activeConvo();
  if (!convo) return;
  convo.pendingImages = convo.pendingImages || [];

  const room = MAX_IMAGES_PER_SEND - convo.pendingImages.length;
  if (room <= 0) {
    toast(`Max ${MAX_IMAGES_PER_SEND} images per send — send these first`, "");
    return;
  }

  const batch = files.slice(0, room);
  if (files.length > room) {
    toast(`Only ${room} more image${room === 1 ? "" : "s"} fit this send (cap ${MAX_IMAGES_PER_SEND})`, "");
  }

  for (const file of batch) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const dataUrl = await compressImageFile(file);
      convo.pendingImages.push({ url: dataUrl, name: file.name || "pasted", type: "image/jpeg" });
    } catch {
      toast("One image failed to process", "");
    }
  }
  updateAttachButtonState();
  renderPendingImages();
}

function renderPendingImages() {
  const strip = document.getElementById("pending-images");
  if (!strip) return;
  const convo = activeConvo();
  const imgs = convo?.pendingImages || [];
  if (!imgs.length) {
    strip.hidden = true;
    strip.innerHTML = "";
    return;
  }
  strip.hidden = false;
  strip.innerHTML = imgs
    .map(
      (i, idx) => `
      <div class="pending-thumb">
        <img src="${escapeAttr(i.url)}" alt="Pending image ${idx + 1}" />
        <button type="button" class="pending-thumb-remove" data-idx="${idx}" title="Remove image">✕</button>
      </div>`
    )
    .join("");
  strip.querySelectorAll(".pending-thumb-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      const c = activeConvo();
      if (!c?.pendingImages) return;
      c.pendingImages.splice(idx, 1);
      updateAttachButtonState();
      renderPendingImages();
    });
  });
}

function updateAttachButtonState() {
  const convo = activeConvo();
  if (!els.btnAttach) return;
  const n = convo?.pendingImages?.length || 0;
  els.btnAttach.textContent = n ? `📎${n}` : "📎";
  els.btnAttach.title = n ? `${n}/${MAX_IMAGES_PER_SEND} pending — click to clear all` : "Paste images into the input (up to 9 per send)";
}

function clearPendingImages() {
  const convo = activeConvo();
  if (!convo) return;
  convo.pendingImages = [];
  updateAttachButtonState();
  renderPendingImages();
}

function takePendingImagesForSend() {
  const convo = activeConvo();
  const items = convo?.pendingImages || [];
  if (convo) convo.pendingImages = [];
  updateAttachButtonState();
  renderPendingImages();
  return items.map((i) => i.url);
}

// ─── Render: spells panel ───

/** Safe target name chip for spell cards (spell.target = Focus / node name). */
function spellTargetBadge(spell) {
  if (!spell || !spell.target) return "";
  return escapeHtml(String(spell.target));
}

/**
 * Linked-node chips under expanded spell body.
 * Stub: node-link UI is optional; never block render if empty.
 */
function scrollListNodeBadgesForSpell(spell, convo) {
  if (!spell) return "";
  const chips = [];
  const target = String(spell.engageNodeName || spell.target || "").trim();
  if (target) {
    const ch = spell.engageNodeChannel ? ` · ${spell.engageNodeChannel}` : "";
    chips.push(
      `<span class="spell-node-badge" title="Target node">${escapeHtml(target + ch)}</span>`
    );
  }
  if (isNodeEngageSpell(spell)) {
    chips.push(
      `<span class="spell-node-badge spell-node-engage" title="Proactive ENGAGE packet · SCROLL LIST embedded">ENGAGE</span>`
    );
  }
  if (convo && isNodeEngageSpell(spell)) {
    chips.push(
      `<span class="spell-node-badge" title="SCROLL LIST in payload">SCROLL LIST</span>`
    );
  }
  return chips.join("");
}

async function renderSpells() {
  try {
    const convo = activeConvo();
    // Self-heal FIRST so badge + Active list share one post-heal truth
    if (convo) stripReceiptSpells(convo.id);
    if (healSpellLifecycles()) persist();
    for (const s of state.spells || []) normalizeSpell(s);

    const view = ensureSpellView();
    const readyList = convo ? activeSpellsFor(convo.id) : [];
    const histList = convo ? historySpellsFor(convo.id) : [];
    const list = view === "history" ? histList : readyList;

    // Vault-derived contribution metrics for this focus (cached)
    let focusContrib = null;
    if (convo) {
      try {
        focusContrib = await getFocusContributions(convo);
        for (const s of readyList.concat(histList)) {
          applySpellNodeContribution(s, focusContrib);
        }
      } catch (err) {
        console.warn("[spells] contrib", err);
      }
    }

    // Badge = Active queue length only
    syncSpellCountBadges(convo?.id || null, readyList.length);

    // Tabs: ACTIVE (n) · CAST HISTORY — Library removed
    els.tabSpellsActive?.classList.toggle("active", view === "active");
    els.tabSpellsHistory?.classList.toggle("active", view === "history");
    if (els.tabSpellsActive) {
      els.tabSpellsActive.setAttribute(
        "aria-selected",
        view === "active" ? "true" : "false"
      );
      els.tabSpellsActive.textContent =
        readyList.length > 0 ? `Active (${readyList.length})` : "Active";
    }
    if (els.tabSpellsHistory) {
      els.tabSpellsHistory.setAttribute(
        "aria-selected",
        view === "history" ? "true" : "false"
      );
      // No count badge on Cast History
      els.tabSpellsHistory.textContent = "Cast History";
    }
    // Clear Active only meaningful on ACTIVE tab with uncast spells
    if (els.btnClearAll) {
      els.btnClearAll.hidden = view !== "active";
      els.btnClearAll.disabled = !convo || readyList.length === 0;
    }
    const detailMode = isSpellDetailListMode();
    syncSpellListModeChrome();
    if (els.spellsHint) {
      els.spellsHint.textContent =
        view === "history"
          ? "Past casts. Click a card for full detail · Cast again from the modal."
          : "Compact spell face · click a card for full detail. Tap Spells for craft / copy spellbook.";
    }

    if (!convo) {
      els.spellsList.innerHTML = `<div class="spells-empty">Select a focus to see its spells.</div>`;
      syncSpellCountBadges(null, 0);
      return;
    }

    if (!list.length) {
      els.spellsList.innerHTML = `<div class="spells-empty">${
        view === "history"
          ? "No cast history yet.<br/>Copy an Active spell to seal it here with a version stamp."
          : isAiNode(convo) && !convoAlignmentUnlocked(convo)
            ? "Cast Spell for <strong>Alignment Reveal</strong>, or state intent in chat."
            : isAiNode(convo)
              ? "State intent in chat or hit <strong>Cast Spell</strong> to forge a directive."
              : "Talk to Grimoire — clear intent forges a spell."
      }</div>`;
      if (view === "active" && convo) syncSpellCountBadges(convo.id, 0);
      return;
    }

    els.spellsList.innerHTML = "";

    /** Expanded audit block — title, target, status, version, full text. Read-only. */
    function appendSpellDetailBlock(spell, index, total) {
      normalizeSpell(spell);
      const item = document.createElement("article");
      item.className = "spell-detail-block";
      item.dataset.spellId = spell.id || "";
      const title = escapeHtml(spellFaceTitle(spell) || "Untitled spell");
      const target = escapeHtml(
        String(spell.target || convo?.name || "—").trim() || "—"
      );
      const status = escapeHtml(
        (typeof spellStatusLabel === "function" && spellStatusLabel(spell)) ||
          String(spell.status || "active")
      );
      const version = spell.iteration
        ? `v${escapeHtml(String(spell.iteration))}`
        : "—";
      const full = escapeHtml(
        formatSpellMarkdown(spell) ||
          String(spell.content || spell.message || "").trim() ||
          "(empty spell content)"
      );
      item.innerHTML = `
        <header class="spell-detail-block-head">
          <div class="spell-detail-block-index">${index + 1}/${total}</div>
          <h4 class="spell-detail-block-title">${title}</h4>
          <div class="spell-detail-block-meta">
            <span class="spell-detail-meta-chip"><span class="k">Target</span> ${target}</span>
            <span class="spell-detail-meta-chip"><span class="k">Status</span> ${status}</span>
            <span class="spell-detail-meta-chip"><span class="k">Version</span> ${version}</span>
          </div>
        </header>
        <pre class="spell-detail-block-body">${full}</pre>
      `;
      els.spellsList.appendChild(item);
    }

    function appendSpellCard(spell, mode) {
      normalizeSpell(spell);
      const item = document.createElement("article");
      const isHist =
        spellIsSealed(spell) ||
        spell.status === "history" ||
        spell.status === "sent" ||
        mode === "history";
      const showSelf = shouldShowSelfCastButton(spell, convo || resolveSpellFocus(spell));
      if (
        showSelf &&
        spell.kind !== "self-cast" &&
        !isAlignmentSpell(spell) &&
        !isCuriositySpell(spell)
      ) {
        spell.kind = "self-cast";
      }
      const isAwaiting = Boolean(spell.awaitingReply);
      const category =
        spell.category || inferSpellCategory(spell) || "default";
      item.className =
        "spell-item spell-face-card spell-tap-copy spell-card-compact" +
        ` spell-cat-${category}` +
        (isHist ? " spell-history" : "") +
        (mode === "primary" ? " spell-primary" : " spell-hold") +
        (showSelf ? " spell-self-castable" : "") +
        (isAwaiting ? " spell-awaiting-reply" : "");
      item.dataset.spellId = spell.id;
      item.dataset.category = category;
      if (showSelf) item.dataset.selfCast = "1";
      if (isAwaiting) item.dataset.awaitingReply = "1";
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.title = isAwaiting
        ? "Awaiting paste reply in chat — click for detail"
        : "Click to open spell detail";

      const owner = convo || resolveSpellFocus(spell);

      // No delete/purge button on spell cards — Jacob cleans Active via Clear Active
      item.innerHTML = `
        ${
          isAwaiting
            ? `<button type="button" class="spell-await-cancel" data-action="cancel-await" title="Cancel await reply">×</button>
               <div class="spell-await-banner spell-await-banner-compact" aria-live="polite">
                 <span class="spell-await-pulse" aria-hidden="true"></span>
                 <span>awaiting reply</span>
               </div>`
            : ""
        }
        ${spellCardFaceHtml(spell, owner)}
        ${spellCardSendActionsHtml(spell, owner)}
      `;
      wireSpellCardActions(item, spell, {
        sealOnCopy: false,
        convo: owner,
      });
      els.spellsList.appendChild(item);
    }

    if (detailMode) {
      list.forEach((spell, i) => {
        try {
          appendSpellDetailBlock(spell, i, list.length);
        } catch (err) {
          console.warn("spell detail block render failed", spell?.id, err);
        }
      });
    } else if (view === "active") {
      const primary = readyList[0];
      const rest = readyList.slice(1);
      if (primary) {
        try {
          appendSpellCard(primary, "primary");
        } catch (err) {
          console.warn("spell card render failed", primary?.id, err);
        }
      }
      rest.forEach((spell) => {
        try {
          appendSpellCard(spell, "hold");
        } catch (err) {
          console.warn("spell card render failed", spell?.id, err);
        }
      });
    } else {
      list.forEach((spell) => {
        try {
          appendSpellCard(spell, "history");
        } catch (err) {
          console.warn("spell card render failed", spell?.id, err);
        }
      });
    }
  } finally {
    syncFocusBadges();
    const convo = activeConvo();
    if (convo) {
      const before = (convo.derivedNodes || []).length;
      populateDerivedNodesFromSpells(convo);
      if ((convo.derivedNodes || []).length !== before) {
        convo.updatedAt = Date.now();
        persist();
      }
      void writeScrollListToVault(convo);
    }
  }
}

/** Brand-new forge: ready, never refilled, never copied/cast. */
function spellIsBrandNew(spell) {
  if (!spell) return false;
  if (spell.rebuilt || spell.rebuiltAt) return false;
  if (spell.status === "sent" || spell.sentAt || spell.copiedAt) return false;
  return true;
}

/**
 * AI-node bridge: curiosity ecosystem cards or spells that map linked nodes
 * back to this Focus as nucleus.
 */
function spellIsNodeBridge(spell) {
  if (!spell) return false;
  if (isNodeEngageSpell(spell)) return true;
  if (isCuriositySpell(spell)) return true;
  if (spell.autoGenerated && (spell.curiosityMode === "self" || spell.curiosityMode === "user")) {
    return true;
  }
  const body = [spell.purpose, spell.essence, spell.crafted, spell.message]
    .filter(Boolean)
    .join("\n");
  if (/CURIOSITY\s*[·.]|ENGAGE\s*[·.]/i.test(String(spell.purpose || ""))) return true;
  if (
    /LINKED NODE|NUCLEUS FOCUS|ecosystem links|ecosystem probe|ecosystem brief|PROACTIVE NODE ENGAGEMENT/i.test(body) &&
    /tie-?back|orbit|nucleus|linked|engage/i.test(body)
  ) {
    return true;
  }
  return false;
}

/**
 * SPELL FACE (sidebar only) — compact tag-style row.
 * Title · version · status-dot · @target. No description, paths, or op badges.
 * Full detail lives in the spell detail modal.
 */
function spellCardFaceHtml(spell, convo, _opts = {}) {
  normalizeSpell(spell);
  const title = spellFaceTitle(spell);
  const target = String(spell.target || convo?.name || "Focus").trim();
  const iter = Number(spell.iteration) || 1;
  const statusKey = spellFaceStatusKey(spell);
  const statusLabel =
    statusKey === "in-progress"
      ? "In progress"
      : statusKey === "history"
        ? "History"
        : "Ready";
  const category = spell.category || inferSpellCategory(spell) || "default";
  const targetLabel = target.startsWith("@") ? target : `@${target}`;

  return `
    <div class="spell-face spell-face-compact" data-category="${escapeAttr(category)}">
      <div class="spell-face-top">
        <h3 class="spell-face-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
        <span class="spell-face-version" title="Version">v${iter}</span>
        <span class="spell-face-tier spell-tier-${escapeAttr(spell.tier)}" title="Tier: ${escapeHtml(spell.tier)}">${escapeHtml(spell.tier)}</span>
        <span class="spell-face-mastery" title="Mastery">${spell.mastery || 0}</span>
      </div>
      <div class="spell-face-row">
        <span
          class="spell-face-status-dot status-${escapeAttr(statusKey)}"
          title="${escapeHtml(statusLabel)}"
          aria-label="${escapeHtml(statusLabel)}"
        ></span>
        <span class="spell-face-target-tag" title="Target node">${escapeHtml(targetLabel)}</span>
      </div>
    </div>`;
}

/** @deprecated — use spellCardFaceHtml */
function spellCardTopHtml(spell, convo, _opts) {
  return spellCardFaceHtml(spell, convo);
}

/**
 * Quiet kind hint (not NEW/BRIDGE/READY). Used only in expanded view if needed.
 */
function spellKindMetaHtml(spell, convo) {
  const kind = classifySpellDisplay(spell, convo);
  const hover =
    kind.key === "self-cast" ? kind.hover : spellPasteHint(spell, convo) || kind.hover;
  return `<div class="spell-item-meta"><span class="spell-kind ${escapeHtml(kind.css)}" title="${escapeHtml(hover)}">${escapeHtml(kind.label)}</span></div>`;
}

/** Resolve the Focus that owns this spell (never rely on active alone). */
function resolveSpellFocus(spell, fallback) {
  if (spell?.conversationId) {
    const hit = state.conversations.find((c) => c.id === spell.conversationId);
    if (hit) return hit;
  }
  return fallback || activeConvo();
}

/**
 * Show SELF-CAST only for self-recursive spells.
 * Uses Focus identity + kind + Local·GRIMOIRE_ protocol so the button appears
 * even when older localStorage cards still say kind: "directive".
 */
function shouldShowSelfCastButton(spell, convo) {
  if (!spell || isCuriositySpell(spell) || isAlignmentSpell(spell)) return false;
  const focus = resolveSpellFocus(spell, convo);
  if (isSelfCastSpell(spell, focus)) return true;
  try {
    if (classifySpellDisplay(spell, focus)?.key === "self-cast") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Action row — card itself is tap-to-copy (no separate Copy button).
 * Optional SELF-CAST + View only.
 */
function spellActionsHtml(spell, convo, { isSent }) {
  const self = shouldShowSelfCastButton(spell, convo);
  const selfBtn = self
    ? `<button type="button" class="btn-spell self-cast" data-action="self-cast" title="Enter this spell into the current Focus chat automatically — no copy/paste" aria-label="SELF-CAST into Focus chat">SELF-CAST</button>`
    : "";
  return `<div class="spell-actions${self ? " has-self-cast" : ""}">${selfBtn}<button type="button" class="btn-spell expand" data-action="expand">Content</button><span class="spell-tap-hint" aria-hidden="true">tap to expand</span></div>`;
}

/**
 * Compact spell-card actions: Send to [session] (+ SELF-CAST). Session0 retired.
 * Clipboard-first manual cast — copies full spell text. No HTTP. No auto-delivery.
 * Session0 is retired; active send shows only for linked non-Session0 sessions.
 */
function spellCardSendActionsHtml(spell, convo) {
  if (!spell) return "";
  const isHist =
    spellIsSealed(spell) ||
    spell.status === "history" ||
    spell.status === "sent" ||
    spell.status === "archived";
  const self = shouldShowSelfCastButton(spell, convo);
  const linked = resolveSpellLinkedSession(spell, convo);
  const isMaster = !linked || isSession0(linked);
  const showSend = !isHist && !isMaster && Boolean(linked);
  const sendLabel = showSend ? `Send to ${linked}` : "";
  const sendBtn = showSend
    ? `<button type="button" class="btn-spell session0-send is-fleet-node" data-action="send-session0" title="${escapeHtml(`Copy full spell text — paste into Hermes ${linked} (manual cast)`)}">${escapeHtml(sendLabel)}</button>`
    : "";
  const selfBtn = self
    ? `<button type="button" class="btn-spell self-cast" data-action="self-cast" title="SELF-CAST into Focus chat">SELF-CAST</button>`
    : "";
  if (!sendBtn && !selfBtn) return "";
  return `<div class="spell-actions spell-actions-compact has-session0-send">${selfBtn}${sendBtn}</div>`;
}

/**
 * Manual cast: copy full spell text to clipboard for paste into Hermes.
 * DOES NOT POST, inject, watch, or bridge. Jacob pastes — Jacob is the crown.
 */
async function manualSendSpellToSession(spell, { source = "operator" } = {}) {
  if (!spell) return { ok: false, reason: "no_spell" };
  normalizeSpell(spell);
  ensureFleetSpellFields(spell);
  const focus =
    resolveSpellFocus(spell, activeConvo()) ||
    state.conversations.find(
      (c) =>
        isVisibleFocus(c) &&
        String(c.name || "").toLowerCase() ===
          String(spell.target || "").toLowerCase()
    ) ||
    null;
  if (focus) ensureFleetFocusFields(focus);

  let session = resolveSpellLinkedSession(spell, focus);
  if (!session) {
    if (SESSION0_RETIRED) {
      session = "";
      spell.linkedSession = "";
    } else {
      session = SESSION0_NAME;
      spell.linkedSession = SESSION0_NAME;
    }
  } else {
    spell.linkedSession = session;
  }

  const fleetSessions = listFleetSessions(state.conversations || []);
  const broadcast = isSession0BroadcastTarget(spell, focus);
  const delivery =
    formatSpellForSessionDelivery(spell, focus, {
      fleetSessions,
      mode: broadcast ? "broadcast" : "unicast",
    }) ||
    formatSpellMarkdown(spell) ||
    String(spell.content || spell.message || "").trim();

  if (!String(delivery || "").trim()) {
    toast("Spell has no body to send", "");
    return { ok: false, reason: "empty" };
  }

  try {
    await copyTextToClipboard(delivery);
  } catch (err) {
    console.error("[manual-cast] clipboard failed", err);
    toast("Copy failed — clipboard unavailable", "");
    return { ok: false, reason: "clipboard", error: err };
  }

  spell.copiedAt = Date.now();
  spell.updatedAt = Date.now();
  // Manual cast loop: operator pastes into Hermes, then pastes reply back here
  try {
    beginSpellAwaitReply(spell.id);
  } catch {
    /* await is optional if timer wiring fails */
  }

  if (focus) {
    focus.lastActivity = Date.now();
    focus.breathingStatus = "Active";
    // Clipboard handoff only — not HTTP "sent". Operator still pastes into Hermes.
    focus.lastDelivery = { status: "idle", at: Date.now() };
  }

  persist();
  void renderSpells();
  renderConvoList();

  const sessionLabel = isSession0(session) ? SESSION0_NAME : session;
  toast(SESSION0_RETIRED && isSession0(session) ? `Copied — ${SESSION0_NAME} retired · record only` : `Copied — paste into Hermes ${sessionLabel}`, "success");
  activityPing(`✦ Copied · ${spellFaceTitle(spell)} → Hermes ${sessionLabel}`);
  pushBusActivity({
    kind: "manual-cast-copy",
    summary: `Clipboard cast · **${spellFaceTitle(spell)}** → Hermes ${sessionLabel}`,
    nodeName: focus?.name || spell.target,
    localOnly: true,
    detail: String(delivery).slice(0, 400),
  });
  return { ok: true, method: "clipboard", session: sessionLabel, source };
}

/** Edit spell face + content (title, subtitle, target, body). */
function openEditSpellDialog(_item, spell) {
  if (!spell) return;
  normalizeSpell(spell);
  const prevTitle = spellFaceTitle(spell);
  const prevSub = spell.subtitle || "";
  const prevTarget = spell.target || "";
  const prevContent = String(spell.content || spell.message || "");

  const title = window.prompt("Spell title", prevTitle);
  if (title == null) return;
  const subtitle = window.prompt("Subtitle / intent (one line)", prevSub);
  if (subtitle == null) return;
  const target = window.prompt("Target focus / node", prevTarget);
  if (target == null) return;
  const content = window.prompt(
    "Spell content (what gets copied)",
    prevContent.slice(0, 4000)
  );
  if (content == null) return;

  const nextTitle = String(title).trim() || prevTitle;
  const nextSub = String(subtitle).trim();
  const nextTarget = String(target).trim() || prevTarget;
  const nextContent = String(content);
  const contentChanged = nextContent !== prevContent || nextTitle !== prevTitle;

  spell.target = nextTarget;
  spell.tags = inferSpellTags({ ...spell, title: nextTitle, content: nextContent });
  spell.updatedAt = Date.now();

  if (contentChanged) {
    refineSpellVersion(spell, {
      content: nextContent,
      title: nextTitle,
      subtitle: nextSub,
      note: "edited",
    });
  } else {
    spell.title = nextTitle;
    spell.purpose = nextTitle;
    spell.subtitle = nextSub;
    spell.essence = nextSub;
    normalizeSpell(spell);
  }

  persist();
  renderSpells();
  toast(`Spell updated · v${spell.iteration}`, "success");
}

function wireSpellCardActions(item, spell, { sealOnCopy, convo }) {
  // Delete/purge buttons removed from spell cards — use Clear Active for uncast queue
  item.querySelector('[data-action="cancel-await"]')?.addEventListener("click", (e) => {
    e.stopPropagation();
    clearSpellAwaitReply(spell.id, { reason: "cancel" });
  });
  item.querySelectorAll('[data-action="self-cast"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selfCastSpell(spell.id);
    });
  });
  item.querySelectorAll('[data-action="send-session0"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Clipboard-first manual cast — never HTTP inject
      void manualSendSpellToSession(spell, { source: "operator" });
    });
  });

  const openDetail = (event) => {
    if (event?.target?.closest?.("button, a, input, textarea")) return;
    void openSpellDetailModal(spell, { sealOnCopy: false, convo });
  };

  item.addEventListener("click", openDetail);
  item.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      if (e.target.closest("button")) return;
      e.preventDefault();
      openDetail(e);
    }
  });
}

/**
 * Spell detail modal — full content, directions, target node, metrics, versions.
 */
async function openSpellDetailModal(spell, { sealOnCopy = true, convo = null } = {}) {
  if (!spell || !els.spellDetailDialog) return;
  normalizeSpell(spell);
  const focus = resolveSpellFocus(spell, convo || activeConvo());
  spellDetailContext = { spellId: spell.id };

  // Metrics for the focus that owns the intelligence (usually active focus)
  const metricFocus = activeConvo() || focus;
  let contrib = { rows: [], empty: true };
  try {
    contrib = await getFocusContributions(metricFocus, { force: false });
    applySpellNodeContribution(spell, contrib);
  } catch {
    /* ignore */
  }

  const title = spellFaceTitle(spell);
  const subtitle = String(spell.subtitle || spell.essence || "").trim();
  const target = String(spell.target || focus?.name || "Focus").trim();
  const channel = spell.medium || (focus ? getSealedChannel(focus) : "Open");
  const backend = getKnownBackendProfile(channel);
  const md = formatSpellMarkdown(spell);
  const paste = spellPasteHint(spell, focus);
  const iter = Number(spell.iteration) || 1;
  const status = spellStatusLabel(spell);
  const tags = (Array.isArray(spell.tags) ? spell.tags : inferSpellTags(spell))
    .map((t) => `<span class="spell-face-tag">${escapeHtml(t)}</span>`)
    .join("");

  if (els.spellDetailTitle) els.spellDetailTitle.textContent = title;
  if (els.spellDetailSub) {
    els.spellDetailSub.textContent = subtitle || `v${iter} · ${status} · → ${target}`;
  }

  // SCROLL node match for target config
  let scrollNode = null;
  try {
    const { nodes } = await readScrollListNodes(state.conversations);
    scrollNode =
      resolveScrollNode(target, nodes, { poe: channel }) ||
      resolveScrollNode(target, nodes, {}) ||
      null;
  } catch {
    /* ignore */
  }

  const nodeChannel = scrollNode?.poe || channel || "";
  const nodePurpose = scrollNode?.purpose || "";
  const nodeQuirks = backend?.quirks || scrollNode?.notes || "";
  const nodeFormat = backend?.format || "";
  const nodeAvoids = backend?.avoids || "";
  const intelPath =
    scrollNode?.intel_file_path ||
    entityIntelPath(focus ? entityIdFromFocus(focus) : target);
  const castCount = Number(spell.castCount) || 0;
  const lastCast = spell.lastCast || spell.castTimestamp || spell.sentAt || null;
  const refineNote = String(spell.refinementNote || "").trim();
  const linkedGlyphs = glyphsForSpell(focus, spell);

  const kvRow = (label, value, { long = false } = {}) => {
    const v = String(value ?? "").trim();
    if (!v || v === "—" || v === "-" || v === "null" || v === "undefined") return "";
    const style = long
      ? ` style="text-align:left;max-width:58%"`
      : label === "Intel path"
        ? ` style="font-size:0.62rem;word-break:break-all"`
        : "";
    return `<div><span class="k">${escapeHtml(label)}</span><span class="v"${style}>${escapeHtml(
      long ? v.slice(0, 160) : v
    )}</span></div>`;
  };

  const dispatchRows = [
    kvRow("Name", target),
    kvRow("Channel", nodeChannel),
    kvRow("Model / medium", backend?.name || nodeChannel),
    kvRow("Intel path", intelPath),
    kvRow("Output Style", nodeFormat, { long: true }),
    kvRow("Quirks", nodeQuirks, { long: true }),
    kvRow("Anti-patterns", nodeAvoids, { long: true }),
    kvRow("Treaty", nodePurpose, { long: true }),
  ]
    .filter(Boolean)
    .join("");

  if (els.spellDetailSide) {
    els.spellDetailSide.innerHTML = `
      <div class="spell-detail-face-block">
        <div class="spell-face-meta">
          <span class="spell-face-target">${escapeHtml(target)}</span>
          <span class="spell-face-version">v${iter}</span>
        </div>
        <div class="spell-face-meta">
          <span class="spell-face-status spell-face-status-${escapeHtml(
            String(spell.status || "ready").toLowerCase()
          )}">${escapeHtml(status)}</span>
        </div>
        <div class="spell-face-lifecycle">
          ${
            castCount > 0
              ? `<span class="spell-face-cast-count">${castCount} cast${
                  castCount === 1 ? "" : "s"
                }</span>`
              : ""
          }
          ${
            lastCast
              ? `<span class="spell-face-last-cast">Last: ${escapeHtml(
                  formatSpellTime(lastCast)
                )}</span>`
              : ""
          }
        </div>
        ${
          refineNote
            ? `<p class="spell-face-refine-note">${escapeHtml(refineNote)}</p>`
            : ""
        }
        ${tags ? `<div class="spell-face-tags">${tags}</div>` : ""}
      </div>
      <div class="spell-detail-section">
        <h3>Intelligence contribution</h3>
        <p class="spell-face-contrib-label">From vault sources into ${escapeHtml(
          metricFocus?.name || "this focus"
        )}</p>
        ${contribDetailHtml(contrib)}
      </div>
      ${
        dispatchRows
          ? `<div class="spell-detail-section">
        <h3>Dispatch Context</h3>
        <div class="spell-detail-kv">${dispatchRows}</div>
      </div>`
          : ""
      }
      <div class="spell-detail-section">
        <h3>Linked glyphs</h3>
        ${
          linkedGlyphs.length
            ? `<ul class="spell-glyph-list">${linkedGlyphs
                .map(
                  (g) =>
                    `<li><strong>${escapeHtml(g.title || "Glyph")}</strong> — ${escapeHtml(
                      String(g.body || "").slice(0, 120)
                    )}${String(g.body || "").length > 120 ? "…" : ""}</li>`
                )
                .join("")}</ul>`
            : `<p class="contrib-empty">No glyphs yet — Teach glyph to encode operator knowledge.</p>`
        }
      </div>
    `;
  }

  const versions = Array.isArray(spell.versions) ? spell.versions : [];
  const versionHtml = versions.length
    ? `<ul class="spell-version-timeline">${versions
        .slice()
        .reverse()
        .map((v, idx, arr) => {
          const prev = arr[idx + 1];
          const curLen = String(v.content || "").length;
          const prevLen = prev ? String(prev.content || "").length : null;
          const delta =
            prevLen != null ? (curLen > prevLen ? `+${curLen - prevLen}` : String(curLen - prevLen)) : "origin";
          return `<li>
            <div class="ver-head"><span>v${escapeHtml(String(v.version || "?"))}</span><span>${escapeHtml(
              delta
            )} chars</span></div>
            ${v.note ? `<div class="ver-note">${escapeHtml(v.note)}</div>` : ""}
            <div class="ver-preview">${escapeHtml(String(v.content || "").slice(0, 280))}${
              String(v.content || "").length > 280 ? "…" : ""
            }</div>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="contrib-empty">v${iter} only — no prior versions</p>`;

  const isHist =
    spellIsSealed(spell) ||
    spell.status === "history" ||
    spell.status === "sent" ||
    spell.status === "archived";
  const isArchived = String(spell.status || "").toLowerCase() === "archived";
  const actionsHtml = isArchived
    ? `<button type="button" class="btn-spell promote" data-action="detail-cast-again">Cast again</button>
       <button type="button" class="btn-spell" data-action="detail-unarchive">Unarchive</button>`
    : isHist
      ? `<button type="button" class="btn-spell promote" data-action="detail-cast-again">Cast again</button>
         <button type="button" class="btn-spell" data-action="detail-extract-glyph">Extract glyph</button>
         <button type="button" class="btn-spell" data-action="detail-archive">Archive</button>`
      : `<button type="button" class="btn-spell" data-action="detail-teach-glyph">Teach glyph</button>
         <button type="button" class="btn-spell refine" data-action="detail-refine">Refine from result</button>`;

  if (els.spellDetailMain) {
    els.spellDetailMain.innerHTML = `
      <div class="spell-detail-section">
        <h3>Copy / paste directions</h3>
        <p class="spell-detail-directions">${escapeHtml(
          paste ||
            `Cast spell copies the payload. Paste it to ${target}, then paste their reply into the ${
              focus?.name || "current"
            } focus chat to seal.`
        )}</p>
      </div>
      <div class="spell-detail-section">
        <h3>Spell content</h3>
        <pre class="spell-detail-prompt" id="spell-detail-prompt-text">${escapeHtml(md)}</pre>
      </div>
      <div class="spell-detail-section fleet-cast-section">
        <h3>Fleet · Session0 Orchestrator</h3>
        <p class="spell-detail-directions">
          Clipboard-first manual cast: copy full spell text, paste into
          <strong>Hermes Session0</strong>. No HTTP inject. No bridge. No watcher.
          Session0 may use native Hermes <code>/msg</code> for fleet broadcast.
          Paste replies back into this Focus to densen. Jacob is the crown.
        </p>
        <div class="fleet-cast-controls">
          <label class="fleet-auto-cast-label">
            <input type="checkbox" id="spell-auto-cast-toggle" ${spell.autoCast ? "checked" : ""} />
            <span>Auto-Cast</span>
          </label>
          <span class="fleet-cast-status" data-cast="${escapeHtml(spell.castStatus || "pending")}">${escapeHtml(
            String(spell.castStatus || "pending").toUpperCase()
          )}</span>
          <button type="button" class="btn-secondary btn-sm session0-send is-fleet-node" data-action="fleet-deploy-now" title="Route to linked session">
            ${escapeHtml(spellSendTargetLabel(spell, focus))}
          </button>
        </div>
        <p class="contrib-empty">
          <span class="session0-badge${isSession0BroadcastTarget(spell, focus) && !SESSION0_RETIRED ? " is-master" : ""}">${escapeHtml(
            SESSION0_RETIRED
              ? "Session0 · retired"
              : isSession0BroadcastTarget(spell, focus)
                ? "Session0 · master"
                : `via Session0 → ${resolveSpellLinkedSession(spell, focus) || "—"}`
          )}</span>
          · linked: ${escapeHtml(resolveSpellLinkedSession(spell, focus) || "none")}
          ${spell.autoCastError ? ` · ${escapeHtml(spell.autoCastError)}` : ""}
        </p>
      </div>
      <div class="spell-detail-section">
        <h3>Actions</h3>
        <div class="spell-lifecycle-actions">${actionsHtml}</div>
        <div class="spell-glyph-teach" id="spell-glyph-teach" hidden>
          <label class="spell-glyph-label" for="spell-glyph-input">Explain what this spell should know…</label>
          <textarea id="spell-glyph-input" class="spell-glyph-input" rows="3" placeholder="e.g. Always include the treaty text in ENGAGE spells to Wizard King"></textarea>
          <div class="spell-glyph-teach-actions">
            <button type="button" class="btn-primary btn-sm" data-action="glyph-save">Forge glyph</button>
            <button type="button" class="btn-secondary btn-sm" data-action="glyph-cancel">Cancel</button>
          </div>
        </div>
      </div>
      <div class="spell-detail-section">
        <h3>Version history</h3>
        ${versionHtml}
      </div>
    `;

    const teachBox = els.spellDetailMain.querySelector("#spell-glyph-teach");
    const glyphInput = els.spellDetailMain.querySelector("#spell-glyph-input");
    const autoToggle = els.spellDetailMain.querySelector("#spell-auto-cast-toggle");
    autoToggle?.addEventListener("change", () => {
      spell.autoCast = Boolean(autoToggle.checked);
      ensureFleetSpellFields(spell);
      if (spell.autoCast && spell.castStatus === "pending") {
        // Queue for fleet engine
        spell.castStatus = "pending";
      }
      persist();
      toast(
        spell.autoCast
          ? `Auto-Cast ON · ${spell.linkedSession || focus?.linkedSession || "link session on Focus"}`
          : "Auto-Cast OFF",
        "success"
      );
      if (spell.autoCast) void runAutoCastSpell(spell, { source: "operator" });
      void renderSpells();
    });
    els.spellDetailMain
      .querySelector('[data-action="fleet-deploy-now"]')
      ?.addEventListener("click", () => {
        // Clipboard-first manual cast — no HTTP inject
        void manualSendSpellToSession(spell, { source: "operator" });
      });

    els.spellDetailMain
      .querySelector('[data-action="detail-teach-glyph"]')
      ?.addEventListener("click", () => {
        if (teachBox) teachBox.hidden = false;
        glyphInput?.focus();
      });
    els.spellDetailMain
      .querySelector('[data-action="detail-extract-glyph"]')
      ?.addEventListener("click", () => {
        if (teachBox) {
          teachBox.hidden = false;
          if (glyphInput && !glyphInput.value) {
            glyphInput.value = `Successful pattern from ${spellFaceTitle(spell)}:\n${String(
              spell.resultNote || spell.subtitle || ""
            ).slice(0, 400)}`;
          }
          glyphInput?.focus();
        }
      });
    els.spellDetailMain
      .querySelector('[data-action="glyph-cancel"]')
      ?.addEventListener("click", () => {
        if (teachBox) teachBox.hidden = true;
        if (glyphInput) glyphInput.value = "";
      });
    els.spellDetailMain
      .querySelector('[data-action="glyph-save"]')
      ?.addEventListener("click", async () => {
        const body = String(glyphInput?.value || "").trim();
        if (!body) {
          toast("Explain the teaching first", "");
          return;
        }
        await teachSpellGlyph(spell, focus, body, {
          scope: isHist ? "focus" : "spell",
        });
        if (glyphInput) glyphInput.value = "";
        if (teachBox) teachBox.hidden = true;
        void openSpellDetailModal(spell, { convo: focus });
      });
    els.spellDetailMain
      .querySelector('[data-action="detail-refine"]')
      ?.addEventListener("click", () => {
        void refineSpellWithGlyphs(spell, focus);
      });
    els.spellDetailMain
      .querySelector('[data-action="detail-cast-again"]')
      ?.addEventListener("click", async () => {
        promoteSpellToActive(spell.id, { refine: false });
        await copySpell(spell.id, { seal: false, awaitReply: true });
        updateSpellDetailCopyButton();
        toast("Cast again — paste reply into chat to seal", "success");
      });
    els.spellDetailMain
      .querySelector('[data-action="detail-archive"]')
      ?.addEventListener("click", () => {
        spell.status = "archived";
        spell.updatedAt = Date.now();
        persist();
        toast("Spell archived", "success");
        closeSpellDetailModal();
        void renderSpells();
      });
    els.spellDetailMain
      .querySelector('[data-action="detail-unarchive"]')
      ?.addEventListener("click", () => {
        spell.status = "ready";
        spell.rebuilt = true;
        spell.rebuiltAt = Date.now();
        spell.updatedAt = Date.now();
        persist();
        toast("Spell restored to Active", "success");
        closeSpellDetailModal();
        void renderSpells();
      });
  }

  updateSpellDetailCopyButton();

  try {
    if (typeof els.spellDetailDialog.showModal === "function") {
      if (!els.spellDetailDialog.open) els.spellDetailDialog.showModal();
    } else {
      els.spellDetailDialog.removeAttribute("hidden");
    }
  } catch (err) {
    console.warn("[spell-detail] open failed", err);
    els.spellDetailDialog.removeAttribute("hidden");
  }
}

function closeSpellDetailModal() {
  spellDetailContext = null;
  const d = els.spellDetailDialog;
  if (!d) return;
  try {
    if (d.open && typeof d.close === "function") d.close();
    else d.setAttribute("hidden", "");
  } catch {
    d.setAttribute("hidden", "");
  }
}

/** True while SELF-CAST is injecting into chat — skip auto-forge echo. */
let selfCastInFlight = false;

/**
 * SELF-CAST — inject spell into the current Focus AI chat (no copy/paste).
 * Seals to Cast History and runs the normal chat densen loop.
 */
function selfCastSpell(id) {
  const spell = state.spells.find((s) => s.id === id);
  if (!spell) return;

  const focus = resolveSpellFocus(spell, activeConvo());
  if (!focus) {
    toast("Select a Focus first", "");
    return;
  }

  if (!shouldShowSelfCastButton(spell, focus)) {
    toast("SELF-CAST is only for self-recursive spells", "");
    return;
  }

  // Normalize kind so re-renders always show the button after seal
  if (spell.kind !== "self-cast") spell.kind = "self-cast";

  // Land in the spell's Focus chat (nucleus for this cast)
  if (state.activeId !== focus.id) {
    state.activeId = focus.id;
    persist();
    renderAll();
  }

  const body = String(spell.message || formatSpellMarkdown(spell) || "").trim();
  if (!body) {
    toast("Spell has no body to cast", "");
    return;
  }

  // Seal first so the card moves to history as the cast lands
  if (spell.status !== "sent") {
    markSent(id, { fromSelfCast: true, silent: true });
  } else {
    spell.copiedAt = Date.now();
    persist();
  }

  selfCastInFlight = true;
  try {
    sendMessage(body);
  } finally {
    selfCastInFlight = false;
  }

  toast("SELF-CAST — spell entered into Focus chat (no copy/paste)", "success");
  els.chatInput?.focus();
}

/**
 * Two-tap delete for a single spell.
 * First tap: arm (red pulse). Second within 3s: delete.
 */
function requestDeleteSpell(spellId, btnEl) {
  if (!spellId) return;

  if (pendingDeletes.has(spellId)) {
    // Second tap — confirm delete
    clearTimeout(pendingDeletes.get(spellId));
    pendingDeletes.delete(spellId);
    deleteSpell(spellId);
    return;
  }

  // First tap — arm
  btnEl?.classList.add("confirming");
  if (btnEl) btnEl.title = "Tap again to delete";
  toast("Tap again to delete", "");

  const t = setTimeout(() => {
    pendingDeletes.delete(spellId);
    btnEl?.classList.remove("confirming");
    if (btnEl) btnEl.title = "Delete spell";
  }, DELETE_CONFIRM_MS);
  pendingDeletes.set(spellId, t);
}

/**
 * Remove one spell from the book + chat spell cards for this Focus.
 */
function deleteSpell(spellId) {
  const spell = state.spells.find((s) => s.id === spellId);
  if (!spell) return;
  const focusId = spell.conversationId;

  state.spells = state.spells.filter((s) => s.id !== spellId);

  // Strip chat messages that embedded this spell card
  for (const c of state.conversations) {
    if (c.id !== focusId) continue;
    c.messages = (c.messages || []).filter(
      (m) => !(m.role === "spell" && m.spellId === spellId)
    );
  }

  persist();
  renderAll();
  notifyConstellation(focusId, "standard");

  const focus = state.conversations.find((c) => c.id === focusId);
  if (focus) syncFocusIntelligenceFile(focus);

  toast("Spell deleted", "success");
}

/**
 * Full spellbook export for external AI analysis.
 * Every spell on this Focus (Active + Cast History + any other status).
 * Magic explanation + full payload. Clipboard only — no delivery, no mutations.
 */
function formatSpellbookForCopy(spells, focus = null) {
  const list = Array.isArray(spells) ? spells.slice() : [];
  // Stable order: Active queue first, then sealed/history, then rest
  list.sort((a, b) => {
    const aSealed = spellIsSealed(a) ? 1 : 0;
    const bSealed = spellIsSealed(b) ? 1 : 0;
    if (aSealed !== bSealed) return aSealed - bSealed;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const focusName = String(focus?.name || "Focus").trim() || "Focus";
  const channel =
    typeof getSealedChannel === "function"
      ? getSealedChannel(focus) || "Open"
      : focus?.channel || "Open";
  const activeN = list.filter((s) => spellIsActiveQueue(s)).length;
  const historyN = list.filter((s) => spellIsSealed(s)).length;

  const header = [
    `# GRIMOIRE · Spellbook`,
    ``,
    `This is a complete magic explanation of every spell in the spellbook for this Focus.`,
    `Paste into another AI (Session0 / Hermes / peer) for inspection, audit, or counsel.`,
    `Read-only clipboard export. No HTTP delivery. Manual cast doctrine. Jacob is the crown.`,
    ``,
    `**Focus:** ${focusName}`,
    `**Channel:** ${channel}`,
    `**Linked session:** ${focus?.linkedSession || "—"}`,
    `**Spell count:** ${list.length} (Active ${activeN} · History ${historyN} · other ${Math.max(0, list.length - activeN - historyN)})`,
    `**Generated:** ${new Date().toISOString()}`,
  ].join("\n");

  if (!list.length) {
    return `${header}\n\n(empty spellbook — no spells on this Focus)`;
  }

  const sep = "\n\n════════════════════════════════\n\n";
  const blocks = list.map((spell, i) => {
    normalizeSpell(spell);
    const title = spellFaceTitle(spell) || "Untitled spell";
    const target = String(spell.target || focusName || "—").trim() || "—";
    const status =
      (typeof spellStatusLabel === "function" && spellStatusLabel(spell)) ||
      String(spell.status || "active");
    const queue = spellIsSealed(spell)
      ? "Cast History"
      : spellIsActiveQueue(spell)
        ? "Active"
        : "Other";
    const essence = String(spell.essence || spell.subtitle || "").trim();
    const full =
      formatSpellMarkdown(spell) ||
      String(spell.content || spell.message || "").trim() ||
      "(empty spell content)";

    return [
      `## Spell ${i + 1} of ${list.length} — ${title}`,
      ``,
      `**Title:** ${title}`,
      `**Target:** ${target}`,
      `**Status:** ${status}`,
      `**Queue:** ${queue}`,
      spell.category ? `**Category:** ${spell.category}` : null,
      spell.kind ? `**Kind:** ${spell.kind}` : null,
      spell.iteration ? `**Version:** v${spell.iteration}` : null,
      essence ? `**Intent / essence:** ${essence}` : null,
      spell.linkedSession || focus?.linkedSession
        ? `**Linked session:** ${spell.linkedSession || focus.linkedSession}`
        : null,
      ``,
      `### Magic explanation (full spell text)`,
      full,
    ]
      .filter((line) => line != null)
      .join("\n");
  });

  return `${header}\n\n${blocks.join(sep)}`;
}

/**
 * Copy spellbook — every spell on this Focus to clipboard for external AI analysis.
 * No HTTP. No delivery. No app mutations.
 * Success UX: menu closes (button goes away). Failures keep menu open + toast.
 * Prefer SYNC clipboard so menu-click gesture is not lost to await.
 */
function copySpellbook() {
  try {
    const convo = activeConvo();
    if (!convo) {
      toast("Select a focus first", "");
      return { ok: false, reason: "no_focus" };
    }

    let book = [];
    try {
      book = spellsFor(convo.id) || [];
    } catch (err) {
      console.warn("[copy-spellbook] spellsFor failed", err);
    }
    if (!book.length && Array.isArray(state.spells)) {
      const nameKey = String(convo.name || "").toLowerCase();
      book = state.spells.filter(
        (s) =>
          s &&
          (s.conversationId === convo.id ||
            String(s.target || "").toLowerCase() === nameKey)
      );
    }

    if (!book.length) {
      toast("Spellbook is empty on this Focus", "");
      return { ok: false, reason: "empty" };
    }

    let payload = "";
    try {
      payload = formatSpellbookForCopy(book, convo);
    } catch (err) {
      console.error("[copy-spellbook] format failed", err);
      toast("Spellbook format failed", "");
      return { ok: false, reason: "format", error: err };
    }

    if (!String(payload || "").trim()) {
      toast("Spellbook export was empty", "");
      return { ok: false, reason: "empty_payload" };
    }

    // Sync first — keeps user-gesture; success = menu closes
    let copied = copyTextToClipboardSync(payload);
    if (!copied && navigator.clipboard?.writeText) {
      // Last resort async (may fail outside gesture in some browsers)
      navigator.clipboard.writeText(payload).then(
        () => setSpellsTitleMenuOpen(false),
        () => toast("Copy failed — clipboard blocked", "")
      );
      // Don't close yet; async will close on resolve
      return { ok: true, count: book.length, method: "clipboard-async", pending: true };
    }
    if (!copied) {
      toast("Copy failed — clipboard blocked", "");
      return { ok: false, reason: "clipboard" };
    }

    setSpellsTitleMenuOpen(false);
    return {
      ok: true,
      count: book.length,
      method: "clipboard",
      bytes: payload.length,
    };
  } catch (err) {
    console.error("[copy-spellbook] fatal", err);
    toast("Copy spellbook failed", "");
    return { ok: false, reason: "fatal", error: err };
  }
}

// Operator / Hermes debug: window.__grimoireCopySpellbook()
try {
  window.__grimoireCopySpellbook = copySpellbook;
} catch {
  /* ignore */
}

/**
 * Clear Active — removes only uncast active spells for current Focus.
 * Cast History is never touched. Two-tap confirm.
 */
function requestClearAllSpells() {
  const convo = activeConvo();
  if (!convo) {
    toast("Select a focus first", "");
    return;
  }
  if (ensureSpellView() !== "active") {
    setSpellView("active");
  }
  const key = "clear-all";
  if (pendingDeletes.has(key)) {
    clearTimeout(pendingDeletes.get(key));
    pendingDeletes.delete(key);
    els.btnClearAll?.classList.remove("confirming");

    const ready = activeSpellsFor(convo.id);
    const removeIds = new Set(ready.map((s) => s.id));
    // Only drop active-queue spells; history/sealed stay intact
    state.spells = state.spells.filter((s) => {
      if (s.conversationId !== convo.id) return true;
      if (!removeIds.has(s.id)) return true;
      return false;
    });
    // Strip embedded spell messages for removed ids
    convo.messages = (convo.messages || []).filter(
      (m) => !(m.role === "spell" && removeIds.has(m.spellId))
    );

    persist();
    renderAll();
    syncFocusIntelligenceFile(
      convo,
      "SPELLS_CLEARED",
      `Cleared ${removeIds.size} uncast active spell(s) — Cast History intact`
    );
    toast(
      removeIds.size
        ? `Cleared ${removeIds.size} active spell${removeIds.size === 1 ? "" : "s"} — Cast History kept`
        : "No active spells to clear",
      "success"
    );
    return;
  }

  els.btnClearAll?.classList.add("confirming");
  toast("Tap Clear Active again to confirm", "");
  const t = setTimeout(() => {
    pendingDeletes.delete(key);
    els.btnClearAll?.classList.remove("confirming");
  }, DELETE_CONFIRM_MS);
  pendingDeletes.set(key, t);
}

// ─── Render: constellation (living intelligence map) ───

/**
 * Derive per-Focus metrics from real spellbooks + chat.
 * Background densifies with spellCount / alignment / entities mentioned.
 */
function buildFocusMetricsMap() {
  const map = {};
  for (const c of state.conversations) {
    const spells = state.spells.filter((s) => s.conversationId === c.id);
    const spellTypes = spells.map((s) => {
      if (isAlignmentSpell(s) || s.kind === "alignment") return "reveal";
      const t = getFocusType(c);
      if (t === "person") return "person";
      if (t === "network") return "network";
      return "ai";
    });
    // Entities mentioned: unique proper-ish tokens in user messages (light)
    const mentioned = new Set();
    for (const m of c.messages || []) {
      if (m.role !== "user" || !m.text) continue;
      const caps = m.text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g) || [];
      for (const cap of caps) {
        if (cap.toLowerCase() === c.name.toLowerCase()) continue;
        mentioned.add(cap.toLowerCase());
      }
    }
    // alignmentRevealed = paste received (not merely "Alignment Reveal" spell cast)
    const alignLocked = Boolean(
      c.alignmentRevealed || c.alignmentReceived || c.alignmentNotes
    );
    // Each past user message = one intelligence capture (restores growth after reload)
    const userCaptures = (c.messages || []).filter((m) => m.role === "user").length;
    map[c.id] = {
      spellCount: spells.length,
      alignmentRevealed: alignLocked,
      entitiesMentioned: Math.max(mentioned.size, userCaptures),
      intelBits: userCaptures,
      spellTypes,
      lastActive: c.id === state.activeId ? Date.now() : 0,
      type: getFocusType(c),
      name: c.name,
    };
    setFocusMetrics(c.id, map[c.id]);
  }
  return map;
}

/** Sync canvas universe from active Focus state (deterministic rebuild path). */
function renderStars(opts = {}) {
  const convo = activeConvo();
  const snap = deriveFocusSnapshot(convo, state.spells);
  // Default: soft rebuild, no warp (warp only on explicit focus switch)
  setFocusUniverse(snap, { warp: Boolean(opts.warp) });
  if (convo) {
    const metrics = buildFocusMetricsMap()[convo.id];
    if (metrics) setFocusMetrics(convo.id, metrics);
  }
  updateUniverseHudChrome(snap);
}

function updateUniverseHudChrome(snap) {
  const hud = getUniverseHud();
  const stageName = hud.stageName || snap?.stageName || "VOID";
  const starCount = hud.starCount || 0;
  const densen =
    hud.densenProgress != null
      ? hud.densenProgress
      : snap?.densenProgress != null
        ? snap.densenProgress
        : 0;
  const densenPct = Math.round(Math.max(0, Math.min(1, densen)) * 100);
  const ageLabel = hud.ageLabel || "";
  const convo = activeConvo();
  const health = convo ? computeFocusHealth(convo, state.spells) : null;
  if (els.universeHudCount) els.universeHudCount.textContent = String(starCount);
  if (els.universeHudStage) {
    const densenBit = densenPct > 0 ? ` · densen ${densenPct}%` : "";
    const ageBit = ageLabel ? ` · age ${ageLabel}` : "";
    const hpBit = health ? ` · ${healthHudChip(health)}` : "";
    els.universeHudStage.textContent = `${stageName}${densenBit}${ageBit}${hpBit}`;
  }
  if (els.universeHud) {
    const temporal = `Stars fill as vault densens · densen ${densenPct}%${ageLabel ? ` · Focus age ${ageLabel}` : ""}`;
    els.universeHud.title = health
      ? `${health.summary} — ${temporal}`
      : `Intel Atlas — ${temporal}`;
  }
  if (els.universeStage) {
    els.universeStage.textContent = snap?.focusId
      ? `${stageName}${densenPct ? ` · ${densenPct}%` : ""}${health ? ` · HP ${health.hp}` : ""}`
      : "VOID";
  }
}

/**
 * After spell creation / focus switch — grow the living map for this Focus.
 */
function notifyConstellation(focusId, spellType) {
  const metrics = buildFocusMetricsMap()[focusId] || {
    spellCount: 0,
    alignmentRevealed: false,
  };
  updateConstellation(focusId, metrics.spellCount || 0, {
    ...metrics,
    alignmentRevealed:
      Boolean(metrics.alignmentRevealed) || spellType === "reveal",
  });
  if (spellType === "reveal" || metrics.alignmentRevealed) {
    universeEvent("align", {
      directives: activeConvo()?.alignmentProfile?.directives?.length || 0,
    });
  } else {
    universeEvent("spell");
  }
  renderStars({ warp: false });
}

function spellTypeForFocus(convo, spell) {
  if (isAlignmentSpell(spell) || spell?.kind === "alignment") return "reveal";
  const t = getFocusType(convo);
  if (t === "person") return "person";
  if (t === "network") return "network";
  return "ai";
}

function renderAll() {
  // Heal lifecycle BEFORE any badge math (sidebar was counting pre-heal zombies)
  if (healSpellLifecycles()) persist();

  // Keep panel class + toggle button in sync with state
  const appEl = els.app || document.querySelector(".app");
  if (appEl) appEl.classList.toggle("spells-collapsed", !state.spellsOpen);
  if (els.btnToggleSpells) {
    els.btnToggleSpells.setAttribute("aria-expanded", state.spellsOpen ? "true" : "false");
  }
  applyUniverseViewMode();
  renderConvoList();
  renderChat();
  renderSpells(); // re-syncs header + active-focus sidebar badge from Active queue
  renderLittleChat();
  renderStars();
  updateAttachButtonState();
  renderPendingImages();
  if (els.universeLegend && !els.universeLegend.hasAttribute("hidden")) {
    renderIntelAtlas(activeConvo());
  }
}

// ─── Complex spell little chat (quantum leap plans) ───

function ensureLittleChat(convo) {
  if (!convo) return null;
  if (!convo.littleChat || typeof convo.littleChat !== "object") {
    convo.littleChat = { messages: [], leaps: [], checklist: [], craftMode: false };
  }
  if (!Array.isArray(convo.littleChat.messages)) convo.littleChat.messages = [];
  if (!Array.isArray(convo.littleChat.leaps)) convo.littleChat.leaps = [];
  if (!Array.isArray(convo.littleChat.checklist)) convo.littleChat.checklist = [];
  return convo.littleChat;
}

function setSpellsTitleMenuOpen(open) {
  const menu = els.spellsTitleMenu || document.getElementById("spells-title-menu");
  const btn = els.btnSpellsTitle || document.getElementById("btn-spells-title");
  if (!menu) return;
  if (open) menu.removeAttribute("hidden");
  else menu.setAttribute("hidden", "");
  if (btn) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.classList.toggle("open", Boolean(open));
  }
}

function closeComplexCraftDialog() {
  try {
    els.complexCraftDialog?.close();
  } catch {
    els.complexCraftDialog?.removeAttribute("open");
  }
}

/**
 * Spells → Craft complex spell: modal little chat + large checklist (not a bottom dock).
 */
function openCraftComplexSpell() {
  setSpellsTitleMenuOpen(false);
  const convo = activeConvo();
  if (!convo) {
    toast("Select a Focus first", "");
    return;
  }
  if (refuseIfFocusLocked(convo)) return;

  // Spells panel can stay open; craft UI is the modal (no bottom cut-off)
  setSpellsOpen(true);

  const lc = ensureLittleChat(convo);
  lc.craftMode = true;

  if (!lc.checklist.length) {
    lc.checklist = defaultComplexChecklist(convo).map((text) => ({
      id: uid("chk"),
      text,
      done: false,
    }));
  }

  if (!lc.messages.length) {
    lc.messages.push({
      id: uid("lcm"),
      role: "grimoire",
      kind: "complex-checklist",
      text: `**Craft complex spell** for **${convo.name}** (nucleus).\nWork the plan checklist below — each step unlocks denser Focus intelligence. Main chat stays clean.`,
      ts: Date.now(),
    });
  }

  if (els.complexCraftSub) {
    els.complexCraftSub.textContent = `${convo.name} · ${getSealedChannel(convo)} · nucleus`;
  }

  persist();
  renderLittleChat();

  const dlg = els.complexCraftDialog;
  if (dlg) {
    try {
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    } catch {
      dlg.setAttribute("open", "");
    }
  }
  els.littleChatInput?.focus();
  toast("Complex spell craft open — plan checklist ready", "success");
}

function defaultComplexChecklist(convo) {
  const name = convo?.name || "Focus";
  return [
    `Name the quantum leap for ${name} (what becomes true)`,
    "List constraints / non-negotiables for this Focus",
    "Identify the first unlock that densens the nucleus",
    "Break the leap into ordered steps (3–7 moves)",
    "Mark success criteria — how we know the complex spell worked",
    "Forge path: Cast Spell against this plan when ready",
  ];
}

/** Parse user plan text into checklist steps. */
function extractChecklistSteps(text) {
  const t = String(text || "").trim();
  if (!t) return [];
  const lines = t.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const steps = [];
  for (const line of lines) {
    const m = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    const body = (m ? m[1] : line).replace(/^#+\s*/, "").trim();
    if (body.length >= 6 && body.length <= 160) steps.push(body);
  }
  if (steps.length >= 2) return steps.slice(0, 10);
  // Sentence clauses as steps
  return t
    .split(/[.;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 10 && s.length <= 140)
    .slice(0, 8);
}

function renderLittleChat() {
  const convo = activeConvo();
  const box = els.littleChatMessages;
  const input = els.littleChatInput;
  const send = els.btnLittleChatSend;
  if (!box) return;

  const locked = convo ? isFocusLocked(convo) : false;
  const enabled = Boolean(convo) && !locked;
  if (input) {
    input.disabled = !enabled;
    input.placeholder = locked
      ? "🔒 Link vault folder to unlock"
      : enabled
        ? `Plan steps for ${convo.name} — complex spell / quantum leap…`
        : "Select a Focus for complex spell plans…";
  }
  if (send) send.disabled = !enabled;
  if (els.complexCraftSub && convo) {
    els.complexCraftSub.textContent = `${convo.name} · ${getSealedChannel(convo)} · nucleus`;
  }

  box.innerHTML = "";
  if (!convo) {
    box.innerHTML = `<div class="little-chat-empty">Select a Focus, then Spells → Craft complex spell.</div>`;
    return;
  }

  const lc = ensureLittleChat(convo);

  // Large checklist block
  if (lc.checklist.length) {
    const list = document.createElement("div");
    list.className = "complex-checklist-panel";
    list.innerHTML = `<div class="complex-checklist-head">Complex spell plan · checklist</div>`;
    const ul = document.createElement("ul");
    ul.className = "complex-checklist";
    lc.checklist.forEach((step, idx) => {
      const li = document.createElement("li");
      li.className = "complex-checklist-item" + (step.done ? " done" : "");
      const id = step.id || `chk-${idx}`;
      step.id = id;
      li.innerHTML = `
        <label class="complex-checklist-label">
          <input type="checkbox" data-check-id="${escapeAttr(id)}" ${step.done ? "checked" : ""} />
          <span class="complex-checklist-num">${idx + 1}</span>
          <span class="complex-checklist-text">${escapeHtml(step.text)}</span>
        </label>`;
      ul.appendChild(li);
    });
    list.appendChild(ul);
    const doneN = lc.checklist.filter((s) => s.done).length;
    const foot = document.createElement("div");
    foot.className = "complex-checklist-foot";
    foot.textContent = `${doneN} / ${lc.checklist.length} steps · densens ${convo.name}`;
    list.appendChild(foot);
    box.appendChild(list);

    list.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", (e) => {
        e.stopPropagation();
        const id = cb.getAttribute("data-check-id");
        const step = lc.checklist.find((s) => s.id === id);
        if (!step) return;
        step.done = Boolean(cb.checked);
        persist();
        if (step.done) {
          densenConstellationFromIntel(convo, 1);
          universeEvent("intel", { count: 1 });
        }
        renderLittleChat();
        const snap = deriveFocusSnapshot(convo, state.spells);
        setFocusUniverse(snap, { warp: false });
        updateUniverseHudChrome(snap);
      });
    });
  }

  if (!lc.messages.length && !lc.checklist.length) {
    box.innerHTML = `<div class="little-chat-empty">Tap <strong>Spells</strong> → <strong>Craft complex spell</strong> to build a quantum leap checklist for <strong>${escapeHtml(convo.name)}</strong>.</div>`;
    return;
  }

  for (const m of lc.messages) {
    const row = document.createElement("div");
    row.className = `little-chat-msg ${m.role === "user" ? "user" : "grimoire"}`;
    const who = m.role === "user" ? "You" : "Grimoire";
    row.innerHTML = `<span class="little-chat-who">${who}</span><div class="little-chat-text">${formatMessageHtml(m.text || "")}</div>`;
    box.appendChild(row);
  }
  box.scrollTop = box.scrollHeight;
}

/**
 * Local reply for complex-spell little chat — builds / refines plan checklist.
 * Never writes into the main Focus chat stream.
 */
function littleChatReply(convo, userText) {
  const name = convo.name || "Focus";
  const ch = getSealedChannel(convo);
  const t = String(userText || "").trim();
  const lower = t.toLowerCase();
  const lc = ensureLittleChat(convo);

  // Extract leap seeds + checklist steps from plan text
  const stepsFromPlan = extractChecklistSteps(t);
  const leapBits = t
    .split(/[.\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12 && s.length <= 140)
    .slice(0, 3);

  let unlocked = false;
  for (const bit of leapBits) {
    const key = bit.toLowerCase();
    if (!lc.leaps.some((l) => String(l).toLowerCase() === key)) {
      lc.leaps.push(bit.slice(0, 120));
      unlocked = true;
    }
  }
  if (lc.leaps.length > 12) lc.leaps = lc.leaps.slice(-12);

  // Merge new steps into checklist (large plan view)
  if (stepsFromPlan.length >= 2 || lc.craftMode) {
    lc.craftMode = true;
    if (stepsFromPlan.length >= 2) {
      for (const s of stepsFromPlan) {
        const key = s.toLowerCase();
        if (!lc.checklist.some((c) => String(c.text).toLowerCase() === key)) {
          lc.checklist.push({ id: uid("chk"), text: s, done: false });
        }
      }
      if (lc.checklist.length > 12) lc.checklist = lc.checklist.slice(-12);
      unlocked = true;
    } else if (!lc.checklist.length) {
      lc.checklist = defaultComplexChecklist(convo).map((text) => ({
        id: uid("chk"),
        text,
        done: false,
      }));
    }
  }

  const isLeap =
    unlocked ||
    lc.craftMode ||
    /\b(quantum|leap|unlock|complex|plan|phase|breakthrough|threshold|densify|next level|open the|checklist|steps)\b/i.test(
      lower
    ) ||
    t.length >= 40;

  if (isLeap) {
    densenConstellationFromIntel(convo, unlocked ? 2 : 1);
    universeEvent("intel", { count: unlocked ? 2 : 1 });
    syncFocusIntelligenceFile(convo, "QUANTUM_LEAP_PLAN", t.slice(0, 1200));
  }

  if (/\b(hello|hi|hey)\b/i.test(lower) && t.length < 24) {
    return `Little chat for **${name}** (${ch}). Use **Spells → Craft complex spell**, or paste a plan with steps — I'll build the **large checklist** that unlocks this nucleus.`;
  }

  if (unlocked || isLeap) {
    const stepN = lc.checklist.length;
    const doneN = lc.checklist.filter((s) => s.done).length;
    return [
      `**Complex plan densened** for **${name}** (nucleus).`,
      stepN
        ? `Checklist: **${doneN}/${stepN}** steps on the board above — tick them as you advance.`
        : `State numbered steps to expand the checklist.`,
      unlocked
        ? `Locked plan thread(s) into Focus intelligence.`
        : `Keep sharpening until the leap is falsifiable.`,
      ``,
      `When ready: **Cast Spell** on the main rail to forge the complex transmission against this plan.`,
    ].join("\n");
  }

  return `Heard on **${name}**. Little chat is for **complex spell / quantum leap plans**. Tap **Spells → Craft complex spell**, or list steps to build the checklist.`;
}

function sendLittleChatMessage(text) {
  const convo = activeConvo();
  if (!convo) return;
  if (refuseIfFocusLocked(convo)) return;
  const userText = String(text || "").trim();
  if (!userText) return;

  const lc = ensureLittleChat(convo);
  lc.messages.push({
    id: uid("lcm"),
    role: "user",
    text: userText,
    ts: Date.now(),
  });

  const reply = littleChatReply(convo, userText);
  lc.messages.push({
    id: uid("lcm"),
    role: "grimoire",
    text: reply,
    ts: Date.now(),
  });

  // Keep little chat lean
  if (lc.messages.length > 40) {
    lc.messages = lc.messages.slice(-40);
  }

  persist();
  renderLittleChat();
  // Refresh sky densen + spells panel (leaps may unlock craft)
  const snap = deriveFocusSnapshot(convo, state.spells);
  setFocusUniverse(snap, { warp: false });
  updateUniverseHudChrome(snap);
  renderSpells();
  toast("Complex plan densened · checklist updated", "success");
}

/** Persist + apply hide-chat / universe-only mode. */
function setUniverseView(on, { silent = false } = {}) {
  state.universeView = Boolean(on);
  try {
    localStorage.setItem(UNIVERSE_VIEW_KEY, state.universeView ? "1" : "0");
  } catch {
    /* ignore */
  }
  applyUniverseViewMode();
  // Keep sky live for the active Focus nucleus
  const snap = deriveFocusSnapshot(activeConvo(), state.spells);
  setFocusUniverse(snap, { warp: false });
  updateUniverseHudChrome(snap);
  if (!silent) {
    toast(
      state.universeView
        ? "Universe view — chat hidden · Focus is nucleus"
        : "Chat restored",
      "success"
    );
  }
}

function applyUniverseViewMode() {
  const on = Boolean(state.universeView);
  els.app?.classList.toggle("universe-view", on);
  document.body.classList.toggle("universe-view-active", on);
  if (els.btnUniverseView) {
    els.btnUniverseView.setAttribute("aria-pressed", on ? "true" : "false");
    els.btnUniverseView.title = on
      ? "Show chat"
      : "Hide chat — view universe only (stars · lines · Focus nucleus)";
  }
  if (els.universeViewChrome) {
    if (on) els.universeViewChrome.removeAttribute("hidden");
    else els.universeViewChrome.setAttribute("hidden", "");
  }
  // Focus nucleus label on chrome
  const convo = activeConvo();
  if (els.universeViewFocusName) {
    els.universeViewFocusName.textContent = convo?.name || "No Focus";
  }
  if (els.universeViewFocusMeta) {
    const ch = convo ? getSealedChannel(convo) : "—";
    els.universeViewFocusMeta.textContent = convo ? `${ch} · nucleus` : "select a Focus";
  }
  if (els.universeViewFocusIcon && convo) {
    els.universeViewFocusIcon.textContent = "☉";
  }
  // System labels (frame held, receipt densen) only when chat is hidden
  updateUniverseSystemLabels(convo);
}

function toggleUniverseView() {
  setUniverseView(!state.universeView);
}

// ─── Actions ───

function selectConvo(id) {
  // Cell2 Core is not a user-selectable Focus
  const target = state.conversations.find((c) => c.id === id);
  if (target && isCell2CoreFocus(target)) {
    toast("Cell2 Core is system substrate — open BRAIN to read its log", "");
    return;
  }
  // Re-show path callout when re-selecting a locked focus
  if (target && isFocusLocked(target)) {
    pathCalloutSessionDismissed.delete(id);
  }
  if (state.activeId === id) {
    // Force re-render of this Focus sky even on re-tap
    const snap = deriveFocusSnapshot(activeConvo(), state.spells);
    setFocusUniverse(snap, { warp: false });
    updateUniverseHudChrome(snap);
    renderChat();
    renderConvoList();
    return;
  }
  state.activeId = id;
  const convo = activeConvo();
  if (convo) {
    if (!isFocusLocked(convo)) {
      ensureAlignmentDirective(convo);
    }
    ensureFocusOrgFields(convo, { assignFolder: false });
    ensureCertainty(convo);
    convo.lastViewedAt = Date.now();
    if (!isFocusLocked(convo)) {
      populateDerivedNodesFromSpells(convo);
      void writeScrollListToVault(convo);
    }
  }
  persist();
  // Warp to this Focus's universe — always paint starfield for this Focus
  const snap = deriveFocusSnapshot(convo, state.spells);
  setFocusUniverse(snap, { warp: true });
  // No spell auto-gen while locked (covenant: no cast activity without path)
  if (convo && !isFocusLocked(convo)) {
    autoGenerateCuriositySpells(convo, { silentToast: true });
    autoGenerateNodeEngageSpells(convo, { silentToast: true });
  }
  renderAll();
  updateUniverseHudChrome(snap);
}

/**
 * AI nodes always get the alignment-reveal directive as first Grimoire message.
 */
function ensureAlignmentDirective(convo) {
  if (!isAiNode(convo)) return false;
  if (hasAlignmentDirective(convo)) return false;
  const ch = getSealedChannel(convo);
  convo.messages = convo.messages || [];
  convo.messages.unshift({
    id: uid("msg"),
    role: "grimoire",
    text: `Sealed channel: **${convo.name} · ${ch}**. **Focus-first gate:** Cast Spell to generate Alignment Reveal. Send their reply here to unlock spellcraft.`,
    ts: Date.now(),
    kind: "alignment-directive",
  });
  return true;
}

function handleLookAround() {
  const convo = activeConvo();
  if (!convo) {
    addGrimoireMessage("Select a focus first.", "system");
    return;
  }
  if (refuseIfFocusLocked(convo)) {
    renderChat();
    return;
  }

  const spells = (state.spells || []).filter((s) => s.conversationId === convo.id);
  const active = activeSpellsFor(convo.id);
  const history = historySpellsFor(convo.id);
  const channel = getSealedChannel(convo);
  const type = getFocusType(convo);
  const created = convo.createdAt ? new Date(convo.createdAt).toLocaleString() : "unknown";
  const recent = (convo.messages || [])
    .slice(-4)
    .map((m) => `• ${m.role === "grimoire" ? "GRIMOIRE" : m.role.toUpperCase()}: ${String(m.text || "").slice(0, 140)}`)
    .join("\n") || "• no recent messages";

  const summary = [
    `### Look around — ${convo.name} · ${channel}`,
    `Type: ${type}${convo.model && convo.model !== "Open" ? ` · ${convo.model}` : ""}`,
    `Born: ${created}`,
    ``,
    `**Recent intelligence**`,
    recent,
    ``,
    `**Spells**`,
    `Active: ${active.length} · History: ${history.length}`,
    active.length ? active.map((s) => `• ${s.purpose}`).join("\n") : "• no active spells",
    ``,
    `**What I know**`,
    `This Focus has ${(convo.messages || []).length} messages and ${spells.length} recorded spells.`,
    channel === "Local" && convo.id === "grimoire-self"
      ? "This is GRIMOIRE observing itself. Use Cast Spell to forge a self-evolution directive."
      : "Use Cast Spell to forge the next true priority from this frame.",
  ]
    .filter(Boolean)
    .join("\n");

  addGrimoireMessage(summary, "intel");
}

function addGrimoireMessage(text, kind = "system") {
  const convo = activeConvo();
  if (!convo) return;
  convo.messages = convo.messages || [];
  convo.messages.push({
    id: uid("msg"),
    role: "grimoire",
    text,
    kind,
    ts: Date.now(),
  });
  persist();
  renderChat();
  renderIntelAtlas(convo);
}

/**
 * Cell2 Message Bus — local-only routing against SCROLL-LIST.md.
 * No external network unless op === search (even then: vault-local first).
 */
function setBusStatus(label) {
  if (els.busStatusValue) els.busStatusValue.textContent = label || "idle";
  if (els.busStatus) {
    els.busStatus.title = `Cell2 Message Bus · ${label || "idle"}`;
    els.busStatus.dataset.state = label || "idle";
  }
}

function findFocusForBusNode(node) {
  if (!node) return null;
  if (node.focusId) {
    const byId = state.conversations.find((c) => c.id === node.focusId);
    if (byId) return byId;
  }
  const name = String(node.name || "").toLowerCase();
  return (
    state.conversations.find(
      (c) =>
        isVisibleFocus(c) &&
        String(c.name || "").toLowerCase() === name &&
        (!node.poe ||
          getSealedChannel(c).toLowerCase() === String(node.poe).toLowerCase())
    ) ||
    state.conversations.find(
      (c) => isVisibleFocus(c) && String(c.name || "").toLowerCase() === name
    ) ||
    null
  );
}

async function handleBusCommand(convo, cmd, rawText) {
  if (!convo || !cmd) return;

  if (isFocusLocked(convo)) {
    addBusReply(
      convo,
      "**Locked — link vault folder first.**\nUse **Create my path** on this focus before `/bus` routing."
    );
    setBusStatus("locked");
    toast("Locked — link vault folder first", "");
    return;
  }

  // User bubble always recorded on current focus
  convo.messages = convo.messages || [];
  convo.messages.push({
    id: uid("msg"),
    role: "user",
    text: rawText,
    ts: Date.now(),
    kind: "bus",
  });
  touchFocus(convo);

  setBusStatus(cmd.op || "route");

  try {
    if (cmd.op === "list") {
      const { nodes, method } = await readScrollListNodes(state.conversations);
      await updateScrollListIndex(state.conversations, state.spells);
      const lines = [
        `**Cell2 Message Bus · SCROLL LIST** (${nodes.length} node(s) · ${method})`,
        ``,
        ...nodes.map(
          (n, i) =>
            `${i + 1}. **${n.name}** · \`${n.poe || "Open"}\` · ${n.certainty || "unknown"}\n   ${n.purpose || "—"}\n   \`${n.intel_file_path || "—"}\``
        ),
        ``,
        `_Local-only registry. Route: \`/bus <name> <message>\` · Search vault: \`/bus search <q>\`_`,
      ];
      if (!nodes.length) {
        lines.splice(
          2,
          0,
          "_No nodes yet. Seal AI focuses or \`/bus NewNode hello\` to register._"
        );
      }
      pushBusActivity({
        kind: "list",
        summary: `Listed ${nodes.length} SCROLL node(s)`,
        localOnly: true,
      });
      addBusReply(convo, lines.join("\n"));
      setBusStatus("idle");
      return;
    }

    if (cmd.op === "search") {
      // Opt-in search — still local vault by default (no external network)
      const q = cmd.query || "";
      if (!q) {
        addBusReply(
          convo,
          "**Bus search** needs a query.\nUsage: `/bus search <terms>` — searches SCROLL + vault intel only (no external API)."
        );
        setBusStatus("idle");
        return;
      }
      const { hits } = await searchBusLocal(q, state.conversations);
      const lines = [
        `**Cell2 Bus · local vault search** for “${q}”`,
        `_No external network call. Opt-in search stays inside GRIMOIRE-FocusIntelligence._`,
        ``,
        hits.length
          ? hits
              .slice(0, 24)
              .map(
                (h, i) =>
                  `${i + 1}. **${h.name}** · ${h.poe || "—"} · ${h.match || "hit"}\n   ${(h.purpose || "").slice(0, 160)}`
              )
              .join("\n")
          : "_No local hits._",
      ];
      addBusReply(convo, lines.join("\n"));
      setBusStatus("idle");
      return;
    }

    if (cmd.op === "ask_cell2") {
      const q = cmd.query || rawText;
      const { hits } = await searchBusLocal(q, state.conversations);
      const cell2 = ensureCell2CoreFocus(state);
      const answer = [
        `**Cell2** (local vault only)`,
        ``,
        hits.length
          ? hits
              .slice(0, 12)
              .map(
                (h) =>
                  `• **${h.name}** · ${h.poe || "Open"} — ${(h.purpose || "").slice(0, 140)}`
              )
              .join("\n")
          : "_No matching vault intelligence. Densen more via chat/Cast Spell, or `/bus list`._",
        ``,
        `_External web search is not used. Explicit opt-in only via \`/bus search\` (still vault-local)._`,
      ].join("\n");
      await densenBusMessage(cell2, q, {
        kind: "ask_cell2",
        from: "user",
        channel: "Neural",
        source: "user",
        category: "node_intel",
      });
      pushBusActivity({
        kind: "ask_cell2",
        summary: `ask cell2: ${q.slice(0, 100)}`,
        localOnly: true,
      });
      addBusReply(convo, answer);
      setBusStatus("idle");
      return;
    }

    if (cmd.op === "route") {
      await handleBusRoute(convo, cmd);
      setBusStatus("idle");
      return;
    }

    addBusReply(convo, "Unknown bus command. Try `/bus list` or `/bus <node> <message>`.");
  } catch (err) {
    console.error("[bus]", err);
    addBusReply(
      convo,
      `**Bus error:** ${err?.message || err}\nVault may be unlinked — click 📁 to attach GRIMOIRE-FocusIntelligence/.`
    );
  }
  setBusStatus("idle");
  persist();
  renderChat();
  renderConvoList();
}

function addBusReply(convo, text) {
  if (!convo) return;
  convo.messages = convo.messages || [];
  convo.messages.push({
    id: uid("msg"),
    role: "grimoire",
    text,
    ts: Date.now(),
    kind: "bus",
  });
  touchFocus(convo);
  persist();
  renderChat();
  renderConvoList();
  if (els.brainOverlay && !els.brainOverlay.hasAttribute("hidden")) {
    renderBrainLog();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// X Recruitment Intake — Magic Knights (Wizard King)
// ═══════════════════════════════════════════════════════════════════════════

function isWizardKingFocus(convo) {
  if (!convo) return false;
  const name = String(convo.name || "").toLowerCase().trim();
  return name === "wizard king" || name.includes("wizard king");
}

/** Loose natural patterns when already on Wizard King focus */
function looksLikeXRecruitLoose(text) {
  const t = String(text || "");
  if (/^\/(?:mk|recruit|knight)\b/i.test(t)) return true;
  if (/\b(?:dm(?:ed|\'d)?|x\s*dm)\b/i.test(t) && /@[A-Za-z0-9_]{1,40}/.test(t)) {
    return true;
  }
  if (/\bmagic\s*knight\b/i.test(t) && /@[A-Za-z0-9_]{1,40}/.test(t)) return true;
  return false;
}

function parseLooseXRecruit(text) {
  const t = String(text || "").trim();
  const h = t.match(/@([A-Za-z0-9_]{1,40})/);
  if (!h) return null;
  const handle = sanitizeXHandle(h[1]);
  const sigM = t.match(/\bsignal\s*[:=]?\s*(\d{1,2})\b/i);
  const signal = sigM ? Math.min(10, Number(sigM[1])) : 5;
  const snippet = t
    .replace(/@[A-Za-z0-9_]{1,40}/, "")
    .replace(/\bsignal\s*[:=]?\s*\d{1,2}\b/i, "")
    .replace(/\b(?:dm(?:ed|\'d)?|x\s*dm|magic\s*knight)\b/gi, "")
    .replace(/^[\s:—\-]+/, "")
    .trim()
    .slice(0, 500);
  return {
    handle,
    signal,
    snippet: snippet || "(intake from Wizard King field note)",
    notes: t.slice(0, 800),
    raw: t,
    source: "wizard-king-loose",
  };
}

/**
 * Run Magic Knight intake: vault write under magic-knights/[handle]/ +
 * densen Wizard King focus + SCROLL classification (yes/no/maybe).
 * Public chat never shows raw @handle unless knighthood === yes.
 */
async function handleMagicKnightIntake(convo, intake, rawText) {
  if (!convo || !intake?.handle) return;

  const result = await writeMagicKnightIntake(intake, {
    focusId: convo.id,
    refreshScroll: true,
  });
  const record = result?.record || intake;
  const knighthood = record.knighthood || "maybe";
  const publicLabel = publicMagicKnightLabel(record);
  const expose = knighthood === "yes";
  const handleDisplay = expose
    ? `@${sanitizeXHandle(record.handle)}`
    : publicLabel;

  // Densen onto Wizard King (or active) focus via auto-write-back loop
  // Privacy: sealed handle when not yes
  const focusBody = [
    `**X Recruitment Intake** · Magic Knight`,
    `Public label: **${handleDisplay}**`,
    expose ? `Handle: @${sanitizeXHandle(record.handle)}` : `Handle: _sealed (knighthood ≠ yes)_`,
    `Signal: **${record.signal}/10**`,
    `SCROLL classification: **${knighthood}**`,
    record.rationale ? `Rationale: ${record.rationale}` : null,
    ``,
    `### First message snippet`,
    record.snippet || "_none_",
    ``,
    `### Assessment notes`,
    record.notes || "_none_",
    ``,
    `Vault: \`magic-knights/${expose ? sanitizeXHandle(record.handle) : "[sealed]"}/intelligence.md\``,
  ]
    .filter((l) => l != null)
    .join("\n");

  void queueAutoWriteBack(convo, {
    eventType: "X_RECRUIT_INTAKE",
    body: focusBody,
    source: "Grimoire",
    category: "relationship",
    tags: ["magic-knight", "x-recruit", knighthood, "auto-write"],
    refreshScrollImmediate: true,
    silentToast: true,
  });

  // Force SCROLL rewrite so knighthood section is current
  try {
    await updateScrollListIndex(state.conversations, state.spells);
  } catch {
    /* non-fatal */
  }

  const method = result?.method || "memory";
  if (method === "filesystem" && result?.ok !== false) {
    toastVaultWritten("magic-knights");
  } else if (method === "memory") {
    toast("Intake densened (memory) — link 📁 for disk", "");
  } else if (result?.ok === false) {
    toast("Magic Knight vault write failed", "");
  }

  const reply = [
    `### Magic Knight intake · SCROLL`,
    ``,
    `**Candidate:** ${handleDisplay}`,
    `**Signal:** ${record.signal}/10`,
    `**SCROLL classification:** **${knighthood}**`,
    record.rationale ? `_${record.rationale}_` : null,
    ``,
    `**First message:** ${(record.snippet || "").slice(0, 200)}`,
    record.notes ? `**Notes:** ${String(record.notes).slice(0, 200)}` : null,
    ``,
    method === "filesystem"
      ? `Vault written → \`${result.path}\` (append-only)`
      : method === "memory"
        ? `Stored in memory — link vault folder for \`magic-knights/[handle]/intelligence.md\``
        : `Write issue: ${result?.error || "unknown"}`,
    ``,
    knighthood === "yes"
      ? `_Handle is public-safe (classification: yes)._`
      : `_X handle sealed from public SCROLL until classification is **yes**._`,
    ``,
    `_Intake again: \`/mk @handle signal:7 first: "…" notes: …\`_`,
  ]
    .filter((l) => l != null)
    .join("\n");

  convo.messages = convo.messages || [];
  convo.messages.push({
    id: uid("msg"),
    role: "grimoire",
    text: reply,
    ts: Date.now(),
    kind: "mk-intake-ack",
  });
  touchFocus(convo);
  persist();
  renderChat();
  renderConvoList();
  activityPing(
    `✦ Magic Knight · ${publicLabel} · ${knighthood} · ${method}`
  );
}

async function handleBusRoute(convo, cmd) {
  const { nodes } = await readScrollListNodes(state.conversations);
  // Prefer multi-word resolution when rest provided
  let node = null;
  let message = cmd.message || "";
  if (cmd.nodeNameRest) {
    node = resolveScrollNode(cmd.nodeName, nodes, {
      nodeNameRest: cmd.nodeNameRest,
    });
    if (node?._resolvedMessage != null) {
      message = node._resolvedMessage || message;
    }
  }
  if (!node) {
    node = resolveScrollNode(cmd.nodeName, nodes, {
      nodeNameRest: cmd.nodeNameRest,
    });
  }

  // Also try matching live focuses when SCROLL empty/miss
  if (!node) {
    const q = String(cmd.nodeName || "").toLowerCase();
    const focusHit = state.conversations.find(
      (c) =>
        isVisibleFocus(c) &&
        (String(c.name || "").toLowerCase() === q ||
          String(c.name || "").toLowerCase().includes(q))
    );
    if (focusHit) {
      node = {
        name: focusHit.name,
        poe: getSealedChannel(focusHit),
        purpose: "",
        certainty: ensureCertainty(focusHit),
        intel_file_path: entityIntelPath(entityIdFromFocus(focusHit)),
        entity_id: entityIdFromFocus(focusHit),
        focusId: focusHit.id,
        type: getFocusType(focusHit),
      };
    }
  }

  if (!node) {
    // Not found — register new bus node (ask POE lightly, default Open)
    const name = String(cmd.nodeName || "").trim();
    pushBusActivity({
      kind: "miss",
      summary: `Unknown node “${name}” — registering on SCROLL LIST`,
      nodeName: name,
      localOnly: true,
    });
    const reg = await registerBusNode(
      {
        name,
        poe: "Open",
        purpose: message
          ? `Registered via bus: ${message.slice(0, 120)}`
          : `Bus node registered by operator`,
        type: "ai",
      },
      state.conversations
    );
    // Create a real Focus so routing has a home
    let focus = createConversation({
      name,
      type: "ai",
      model: "none",
    });
    if (!focus) {
      focus = state.conversations.find(
        (c) => String(c.name || "").toLowerCase() === name.toLowerCase()
      );
    }
    if (focus && message) {
      await densenBusMessage(focus, message, {
        kind: "route",
        channel: getSealedChannel(focus),
        from: "user",
      });
    }
    await updateScrollListIndex(state.conversations, state.spells);
    addBusReply(
      convo,
      [
        `**Bus · node not on SCROLL LIST** — registered **${name}**.`,
        `POE defaulted to **Open** (edit Focus to seal Hermes/Grok/etc.).`,
        `Entity folder: \`${reg?.node?.intel_file_path || entityIntelPath(name)}\``,
        message
          ? `Message densened to the new node vault.`
          : `Send a message: \`/bus ${name} <your message>\``,
        ``,
        `_Local-only. No external lookup._`,
      ].join("\n")
    );
    if (focus) {
      state.activeId = focus.id;
      persist();
      renderAll();
    }
    return;
  }

  const target = findFocusForBusNode(node);
  const channel = node.poe || (target ? getSealedChannel(target) : "Open");
  const payload =
    message ||
    `(bus ping from **${convo.name}** — no body; operator opened channel)`;

  // Densen into receiving focus vault (append-only intelligence.md)
  const densen = await densenBusMessage(target || node, payload, {
    kind: "route",
    channel,
    from: convo.name || "user",
    source: "user",
    focusId: target?.id || null,
  });

  // Cross-focus: densen target intel into current session when routing away
  // FULL BODY — vault never gets payload.slice / preview (sev-01-bus-relay-full-body)
  let relayNote = "";
  if (target && target.id !== convo.id) {
    const relay = await relayIntelBetweenFocuses(target, convo, payload);
    if (relay?.text) relayNote = `\n\n---\n${relay.text}`;
    // Also append relay receipt onto the *receiving* focus vault (full payload)
    void queueAutoWriteBack(target, {
      eventType: "BUS_ROUTE_RECEIVED",
      body: [
        `**Bus route received** from **${convo.name}** · \`${channel}\``,
        ``,
        payload,
        relay?.text ? `\n---\n${relay.text}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      source: convo.name || "user",
      category: "relationship",
      tags: ["bus", "route", "auto-write", "full-body"],
      refreshScrollImmediate: true,
      silentToast: true,
    });
  }

  // Switch active focus to target when it exists
  if (target) {
    state.activeId = target.id;
    target.messages = target.messages || [];
    target.messages.push({
      id: uid("msg"),
      role: "user",
      text: payload,
      ts: Date.now(),
      kind: "bus-route",
    });
    const busAck = [
      `**Cell2 Message Bus** delivered to **${target.name}** · \`${channel}\`.`,
      `Intelligence densened → \`${node.intel_file_path || entityIntelPath(entityIdFromFocus(target))}\`.`,
      `Craft a spell for this channel or keep talking — local vault only.`,
    ].join("\n");
    target.messages.push({
      id: uid("msg"),
      role: "grimoire",
      text: busAck,
      ts: Date.now(),
      kind: "bus",
    });
    // GRIMOIRE bus ack → receiving focus vault (background)
    void queueAutoWriteBack(target, {
      eventType: "GRIMOIRE_REPLY",
      body: busAck,
      source: "Grimoire",
      category: "node_intel",
      tags: ["bus", "grimoire-reply", "auto-write"],
      silentToast: true,
    });
    touchFocus(target);
  }

  // SCROLL List auto-curate after bus densen
  scheduleScrollListCurate({ immediate: true });
  try {
    await updateScrollListIndex(state.conversations, state.spells);
  } catch {
    /* non-fatal */
  }

  // Chat ack may summarize; vault already received full payload via densen/relay
  const chatPreview =
    payload.length > 400 ? `${payload.slice(0, 400)}…` : payload;
  addBusReply(
    convo,
    [
      `**Bus route** → **${node.name}** · \`${channel}\``,
      payload ? `> ${chatPreview}` : "",
      target
        ? `Switched active Focus to **${target.name}**. Full message densened to vault (no truncation).`
        : `Node is on SCROLL LIST but has no live Focus yet — vault entry densened at \`${node.intel_file_path}\`.`,
      densen?.result?.method === "filesystem"
        ? `Vault written · \`${densen.result.fileName || "intelligence.md"}\` (full body)`
        : densen?.result?.method === "memory"
          ? `Intel densened in memory — link 📁 for disk.`
          : "",
      relayNote,
    ]
      .filter(Boolean)
      .join("\n")
  );

  if (densen?.result?.method === "filesystem" && densen?.result?.ok !== false) {
    toastVaultWritten(target?.name || node.name || "");
  }

  persist();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════════════════
// Autonomous /msg · self-message loops · governance (Jacob is the crown)
// ═══════════════════════════════════════════════════════════════════════════

/** In-flight timer ids for self-message loops: focusId → interval id */
const selfMessageLoopTimers = new Map();

const MSG_HELP = [
  `**Autonomous messaging**`,
  ``,
  `\`/msg self <message>\` — message this focus (self chain)`,
  `\`/msg <node> <message>\` — deliver to another focus (no UI switch)`,
  `\`/msg "Wizard King" <message>\` — multi-word node names`,
  `\`/msgloop 60 <message>\` — self-message every 60s (min 15s)`,
  `\`/msgloop stop\` · \`/msgloop status\``,
  ``,
  `_All deliveries auto-write vault YAML frontmatter. No AI may git push, build, or execute the app — **Jacob is the crown**._`,
].join("\n");

/**
 * Resolve /msg target focus. "self" → sender. Multi-word via targetRest.
 */
function resolveMsgTarget(fromFocus, cmd) {
  if (!cmd) return null;
  const t = String(cmd.target || "").trim();
  if (!t) return null;
  if (/^self$/i.test(t)) return fromFocus;

  // Prefer multi-word match against live focuses when targetRest present
  const candidates = (state.conversations || []).filter((c) => isVisibleFocus(c));
  if (cmd.targetRest) {
    const rest = String(cmd.targetRest || "").toLowerCase();
    // Longest name match first
    const ranked = candidates
      .map((c) => ({ c, n: String(c.name || "").trim() }))
      .filter((x) => x.n)
      .sort((a, b) => b.n.length - a.n.length);
    for (const { c, n } of ranked) {
      const nl = n.toLowerCase();
      if (rest === nl || rest.startsWith(nl + " ")) {
        const message = rest.slice(n.length).trim();
        return { focus: c, message: message || cmd.message || "" };
      }
    }
  }

  const q = t.toLowerCase();
  let hit =
    candidates.find((c) => String(c.name || "").toLowerCase() === q) ||
    candidates.find((c) => String(c.name || "").toLowerCase().includes(q)) ||
    candidates.find((c) => String(c.id || "").toLowerCase() === q) ||
    null;
  if (hit) return { focus: hit, message: cmd.message || "" };
  return null;
}

/**
 * Deliver /msg without switching active UI focus.
 * Always vault-writes via densenMsgDelivery / queueAutoWriteBack (YAML).
 */
async function deliverMsg(fromFocus, targetFocus, message, opts = {}) {
  if (!fromFocus || !targetFocus) {
    return { ok: false, reason: "missing_focus" };
  }
  const body = String(message || "").trim();
  if (!body) return { ok: false, reason: "empty" };

  const source = String(opts.source || "operator").toLowerCase();
  const kind = opts.kind || (fromFocus.id === targetFocus.id ? "msg-self" : "msg");
  const depth = Number(opts.depth) || 0;
  if (depth > 3) {
    return { ok: false, reason: "depth_cap" };
  }

  // Governance gate on AI-originated bodies
  if (source === "ai" || source === "self-loop" || source === "autonomous") {
    const gate = assertAiGovernance(body, {
      source: "ai",
      actor: fromFocus.name || "AI node",
    });
    if (!gate.allowed) {
      if (opts.silent !== true) {
        addBusReply(fromFocus, gate.reason);
      }
      void queueAutoWriteBack(fromFocus, {
        eventType: "GOVERNANCE_BLOCK",
        body: gate.reason,
        source: "Grimoire",
        category: "doctrine",
        tags: ["governance", gate.action, "auto-write"],
        silentToast: true,
      });
      return { ok: false, reason: "governance", action: gate.action };
    }
  }

  const self = fromFocus.id === targetFocus.id;
  const channel = getSealedChannel(targetFocus);

  // Record on sender (outbound receipt) — skip double user bubble when operator typed /msg
  if (opts.recordOutbound !== false) {
    fromFocus.messages = fromFocus.messages || [];
    if (opts.rawText && opts.recordRawUser) {
      fromFocus.messages.push({
        id: uid("msg"),
        role: "user",
        text: opts.rawText,
        ts: Date.now(),
        kind: "msg-cmd",
      });
    }
  }

  // Inbound on target (no focus switch)
  targetFocus.messages = targetFocus.messages || [];
  targetFocus.messages.push({
    id: uid("msg"),
    role: self ? "user" : "user",
    text: self
      ? body
      : `[from ${fromFocus.name}] ${body}`,
    ts: Date.now(),
    kind: self ? "msg-self" : "msg-inbound",
    fromFocusId: fromFocus.id,
    fromFocusName: fromFocus.name,
  });

  const ack = self
    ? [
        `**Self-message** densened on **${targetFocus.name}**.`,
        `Vault auto-write (YAML frontmatter) queued.`,
        opts.loopIteration != null
          ? `Loop iteration **${opts.loopIteration}**.`
          : `_Recursive chains: \`/msgloop 60 <prompt>\`_`,
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `** /msg ** delivered **${fromFocus.name}** → **${targetFocus.name}** · \`${channel}\`.`,
        `No UI focus switch. Intelligence densened on receiver.`,
      ].join("\n");

  targetFocus.messages.push({
    id: uid("msg"),
    role: "grimoire",
    text: ack,
    ts: Date.now(),
    kind: "msg-ack",
  });

  // Vault write — full body, YAML frontmatter via auto-write loop
  const densen = await densenMsgDelivery(targetFocus, body, {
    from: fromFocus.name || "user",
    source: source === "operator" || source === "user" ? "user" : source,
    kind,
    self,
    channel,
    loopIteration: opts.loopIteration,
    category: self ? "identity" : "relationship",
  });

  if (densen?.blocked) {
    targetFocus.messages.push({
      id: uid("msg"),
      role: "grimoire",
      text: densen.reason || "**Governance blocked** this /msg.",
      ts: Date.now(),
      kind: "governance",
    });
  }

  // Outbound receipt on sender when cross-focus
  if (!self) {
    void queueAutoWriteBack(fromFocus, {
      eventType: "MSG_SENT",
      body: [
        `** /msg sent** → **${targetFocus.name}** · \`${channel}\``,
        ``,
        body,
      ].join("\n"),
      source: fromFocus.name || "user",
      category: "relationship",
      tags: ["msg", "outbound", "auto-write"],
      silentToast: true,
    });
  }

  touchFocus(targetFocus);
  if (!self) touchFocus(fromFocus);
  persist();
  // Only re-render chat if sender or target is active (avoid surprise switch)
  if (
    state.activeId === fromFocus.id ||
    state.activeId === targetFocus.id
  ) {
    renderChat();
    renderConvoList();
  } else {
    renderConvoList();
  }

  if (densen?.result?.method === "filesystem" && densen?.result?.ok !== false) {
    if (opts.silentToast !== true) toastVaultWritten(targetFocus.name || "");
  }

  activityPing(
    self
      ? `✦ Self-msg · ${targetFocus.name}`
      : `✦ /msg ${fromFocus.name} → ${targetFocus.name}`
  );

  return { ok: !densen?.blocked, densen, self, target: targetFocus };
}

async function handleMsgCommand(convo, cmd, rawText, opts = {}) {
  if (!convo || !cmd) return;
  const source = opts.source || "operator";

  if (cmd.op === "help") {
    convo.messages = convo.messages || [];
    convo.messages.push({
      id: uid("msg"),
      role: "user",
      text: rawText,
      ts: Date.now(),
      kind: "msg-cmd",
    });
    addBusReply(convo, MSG_HELP);
    return;
  }

  if (isFocusLocked(convo)) {
    addBusReply(
      convo,
      "**Locked — link vault folder first.**\nUse **Create my path** before `/msg`."
    );
    return;
  }

  convo.messages = convo.messages || [];
  convo.messages.push({
    id: uid("msg"),
    role: "user",
    text: rawText,
    ts: Date.now(),
    kind: "msg-cmd",
  });
  touchFocus(convo);

  const resolved = resolveMsgTarget(convo, cmd);
  if (!resolved || !resolved.focus) {
    addBusReply(
      convo,
      [
        `** /msg ** — unknown node **${cmd.target}**.`,
        `Try \`/bus list\` for SCROLL nodes, or \`/msg self <text>\`.`,
      ].join("\n")
    );
    persist();
    renderChat();
    return;
  }

  const message = resolved.message != null ? resolved.message : cmd.message;
  if (!String(message || "").trim()) {
    addBusReply(
      convo,
      `** /msg ** needs a body.\nUsage: \`/msg ${cmd.target || "self"} <message>\``
    );
    return;
  }

  const result = await deliverMsg(convo, resolved.focus, message, {
    source,
    recordOutbound: false,
    kind: resolved.focus.id === convo.id ? "msg-self" : "msg",
    depth: opts.depth || 0,
  });

  if (result?.ok) {
    addBusReply(
      convo,
      resolved.focus.id === convo.id
        ? `**Self-message** delivered to **${convo.name}**. Vault write queued.`
        : `** /msg ** → **${resolved.focus.name}** delivered (no focus switch). Vault densened.`
    );
  }
  setBusStatus("msg");
  persist();
  renderChat();
  renderConvoList();
}

async function handleMsgLoopCommand(convo, cmd, rawText, opts = {}) {
  if (!convo || !cmd) return;
  const loop = ensureSelfMessageLoop(convo);

  convo.messages = convo.messages || [];
  convo.messages.push({
    id: uid("msg"),
    role: "user",
    text: rawText,
    ts: Date.now(),
    kind: "msgloop-cmd",
  });
  touchFocus(convo);

  if (cmd.op === "help") {
    addBusReply(
      convo,
      [
        MSG_HELP,
        cmd.error ? `\n_${cmd.error}_` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
    return;
  }

  if (cmd.op === "status") {
    addBusReply(
      convo,
      loop.enabled
        ? [
            `**Self-message loop · active** on **${convo.name}**`,
            `Interval: **${Math.round(loop.intervalMs / 1000)}s**`,
            `Iteration: **${loop.iteration}** / ${loop.maxIterations}`,
            `Message: ${loop.message.slice(0, 200)}`,
            `Last fired: ${loop.lastFiredAt ? new Date(loop.lastFiredAt).toLocaleString() : "never"}`,
          ].join("\n")
        : `**Self-message loop · idle** on **${convo.name}**.\nStart: \`/msgloop 60 <message>\``
    );
    return;
  }

  if (cmd.op === "stop") {
    stopSelfMessageLoop(convo);
    addBusReply(convo, `**Self-message loop stopped** on **${convo.name}**.`);
    void queueAutoWriteBack(convo, {
      eventType: "MSG_LOOP_STOP",
      body: `Self-message loop stopped by ${opts.source || "operator"}.`,
      source: "Grimoire",
      category: "node_intel",
      tags: ["msgloop", "stop", "auto-write"],
      silentToast: true,
    });
    return;
  }

  if (cmd.op === "start") {
    // Governance on loop body for AI
    if (opts.source === "ai" || opts.source === "autonomous") {
      const gate = assertAiGovernance(cmd.message, {
        source: "ai",
        actor: convo.name,
      });
      if (!gate.allowed) {
        addBusReply(convo, gate.reason);
        return;
      }
    }
    startSelfMessageLoop(convo, {
      intervalMs: cmd.intervalMs,
      message: cmd.message,
      source: opts.source || "operator",
    });
    addBusReply(
      convo,
      [
        `**Self-message loop started** on **${convo.name}**`,
        `Every **${Math.round((cmd.intervalMs || 60000) / 1000)}s** → self densen`,
        `Message: ${String(cmd.message).slice(0, 240)}`,
        `Max iterations: **${ensureSelfMessageLoop(convo).maxIterations}** · \`/msgloop stop\` to halt`,
      ].join("\n")
    );
    void queueAutoWriteBack(convo, {
      eventType: "MSG_LOOP_START",
      body: [
        `Self-message loop started.`,
        `Interval: ${cmd.intervalMs}ms`,
        `Message: ${cmd.message}`,
      ].join("\n"),
      source: "Grimoire",
      category: "identity",
      tags: ["msgloop", "start", "auto-write"],
      silentToast: true,
    });
    // Fire first tick immediately for recursive chain kickoff
    void fireSelfMessageLoopTick(convo);
  }
}

function stopSelfMessageLoop(focus) {
  if (!focus) return;
  const loop = ensureSelfMessageLoop(focus);
  loop.enabled = false;
  const tid = selfMessageLoopTimers.get(focus.id);
  if (tid) {
    clearInterval(tid);
    selfMessageLoopTimers.delete(focus.id);
  }
  persist();
}

function startSelfMessageLoop(focus, { intervalMs, message, source } = {}) {
  if (!focus) return;
  const loop = ensureSelfMessageLoop(focus);
  // Clear prior timer
  const prev = selfMessageLoopTimers.get(focus.id);
  if (prev) clearInterval(prev);

  loop.enabled = true;
  loop.intervalMs = Math.max(15000, Number(intervalMs) || 60000);
  loop.message = String(message || loop.message || "").trim();
  loop.iteration = 0;
  loop.startedAt = Date.now();
  loop.lastFiredAt = 0;
  loop.source = source || "operator";

  const tid = setInterval(() => {
    void fireSelfMessageLoopTick(focus);
  }, loop.intervalMs);
  selfMessageLoopTimers.set(focus.id, tid);
  persist();
}

async function fireSelfMessageLoopTick(focus) {
  if (!focus) return;
  // Re-resolve from state in case of reload
  const live =
    state.conversations.find((c) => c.id === focus.id) || focus;
  const loop = ensureSelfMessageLoop(live);
  if (!loop.enabled || !loop.message) {
    stopSelfMessageLoop(live);
    return;
  }
  if (loop.iteration >= loop.maxIterations) {
    stopSelfMessageLoop(live);
    live.messages = live.messages || [];
    live.messages.push({
      id: uid("msg"),
      role: "grimoire",
      text: `**Self-message loop complete** after **${loop.iteration}** iterations (max reached).`,
      ts: Date.now(),
      kind: "msgloop-done",
    });
    void queueAutoWriteBack(live, {
      eventType: "MSG_LOOP_COMPLETE",
      body: `Self-message loop hit maxIterations (${loop.maxIterations}).`,
      source: "Grimoire",
      category: "node_intel",
      tags: ["msgloop", "complete", "auto-write"],
      silentToast: true,
    });
    persist();
    if (state.activeId === live.id) renderChat();
    return;
  }

  loop.iteration += 1;
  loop.lastFiredAt = Date.now();
  const body = [
    loop.message,
    ``,
    `_self-loop · iteration ${loop.iteration}/${loop.maxIterations}_`,
  ].join("\n");

  await deliverMsg(live, live, body, {
    source: "self-loop",
    kind: "msg-loop",
    loopIteration: loop.iteration,
    recordOutbound: false,
    silentToast: true,
    depth: 0,
  });
  persist();
}

/**
 * Restore self-message loop timers after page load (persisted enabled loops).
 */
function restoreSelfMessageLoops() {
  for (const c of state.conversations || []) {
    const loop = ensureSelfMessageLoop(c);
    if (!loop.enabled || !loop.message) continue;
    if (loop.iteration >= loop.maxIterations) {
      loop.enabled = false;
      continue;
    }
    const prev = selfMessageLoopTimers.get(c.id);
    if (prev) clearInterval(prev);
    const tid = setInterval(() => {
      void fireSelfMessageLoopTick(c);
    }, loop.intervalMs);
    selfMessageLoopTimers.set(c.id, tid);
  }
}

/**
 * Extract and execute /msg · /msgloop lines embedded in AI/grimoire replies.
 * Caps at 3 directives per reply; depth-limited to prevent runaway chains.
 */
async function executeEmbeddedMsgDirectives(fromFocus, text, opts = {}) {
  if (!fromFocus || !text) return [];
  const depth = Number(opts.depth) || 0;
  if (depth > 2) return [];
  const source = opts.source || "ai";
  const lines = String(text).split(/\n/);
  const cmds = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith("/")) continue;
    const loopCmd = parseMsgLoopCommand(t);
    if (loopCmd && loopCmd.op !== "help") {
      cmds.push({ type: "loop", cmd: loopCmd, raw: t });
      continue;
    }
    const msgCmd = parseMsgCommand(t);
    if (msgCmd && msgCmd.op === "msg") {
      cmds.push({ type: "msg", cmd: msgCmd, raw: t });
    }
  }
  const limited = cmds.slice(0, 3);
  const results = [];
  for (const item of limited) {
    if (item.type === "loop") {
      await handleMsgLoopCommand(fromFocus, item.cmd, item.raw, {
        source,
      });
      results.push({ type: "loop", raw: item.raw });
      continue;
    }
    // Governance before AI /msg
    if (source === "ai") {
      const gate = assertAiGovernance(item.cmd.message || item.raw, {
        source: "ai",
        actor: fromFocus.name,
      });
      if (!gate.allowed) {
        void queueAutoWriteBack(fromFocus, {
          eventType: "GOVERNANCE_BLOCK",
          body: gate.reason,
          source: "Grimoire",
          category: "doctrine",
          tags: ["governance", "embedded-msg", "auto-write"],
          silentToast: true,
        });
        results.push({ type: "blocked", raw: item.raw, action: gate.action });
        continue;
      }
    }
    const resolved = resolveMsgTarget(fromFocus, item.cmd);
    if (!resolved?.focus) continue;
    const message =
      resolved.message != null ? resolved.message : item.cmd.message;
    if (!String(message || "").trim()) continue;
    const r = await deliverMsg(fromFocus, resolved.focus, message, {
      source,
      depth: depth + 1,
      recordOutbound: false,
      silentToast: true,
    });
    results.push({ type: "msg", raw: item.raw, ok: r?.ok });
  }
  return results;
}

/**
 * When user mentions another Focus by name, auto-relay that node's intel (local).
 */
async function maybeBusAutoRelay(convo, userText) {
  if (!convo || !userText || userText.length < 4) return null;
  const { nodes } = await readScrollListNodes(state.conversations);
  const lower = userText.toLowerCase();
  const hits = [];
  for (const n of nodes) {
    const nm = String(n.name || "").trim();
    if (!nm || nm.toLowerCase() === String(convo.name || "").toLowerCase())
      continue;
    if (nm.length < 3) continue;
    if (lower.includes(nm.toLowerCase())) {
      const focus = findFocusForBusNode(n);
      if (focus && focus.id !== convo.id) hits.push(focus);
    }
  }
  if (!hits.length) return null;
  const parts = [];
  for (const f of hits.slice(0, 3)) {
    // Full userText payload to vault — no preview slice
    const r = await relayIntelBetweenFocuses(f, convo, userText);
    if (r?.text) parts.push(r.text);
  }
  if (!parts.length) return null;
  return {
    reply: [
      `**Cell2 bus relay** (local vault — other Focuses mentioned):`,
      ``,
      ...parts,
    ].join("\n"),
  };
}

function sendMessage(text) {
  const convo = activeConvo();
  if (!convo || (!text || !text.trim())) return;

  const userTextEarly = (text || "").trim();
  // Roadmap Engine is app-level — allow /roadmap + explicit SCROLL plan paste through path lock
  const roadmapBypass =
    /^\/roadmap\b/i.test(userTextEarly) ||
    (state.activeRoadmapSlug &&
      /^expand\s+step\s+\d+/i.test(userTextEarly)) ||
    (/^#\s*roadmap\b/im.test(userTextEarly) &&
      looksLikeScrollRoadmap(userTextEarly));

  if (!roadmapBypass && refuseIfFocusLocked(convo)) {
    renderChat();
    return;
  }

  const userText = userTextEarly;

  // Fleet: any real engagement marks breathing Active
  try {
    touchFleetActivity(convo);
  } catch {
    /* ignore */
  }

  // Cancel await-paste via typed "cancel"
  if (/^cancel$/i.test(userText)) {
    const awaiting = getAwaitingSpellForFocus(convo.id);
    if (awaiting) {
      clearSpellAwaitReply(awaiting.id, { reason: "cancel" });
      return;
    }
  }

  // /glyph or "Glyph: …" — teach glyph for active await spell or latest active spell
  const glyphMatch =
    userText.match(/^\/glyph\s+([\s\S]+)/i) ||
    userText.match(/^glyph\s*[:\-—]\s*([\s\S]+)/i);
  if (glyphMatch) {
    const body = glyphMatch[1].trim();
    const targetSpell =
      getAwaitingSpellForFocus(convo.id) ||
      activeSpellsFor(convo.id)[0] ||
      historySpellsFor(convo.id)[0];
    if (!targetSpell) {
      toast("No spell to attach glyph to — forge a spell first", "");
      return;
    }
    void teachSpellGlyph(targetSpell, convo, body, { scope: "spell" }).then(() => {
      void renderSpells();
    });
    return;
  }

  // === X Recruitment Intake (Wizard King → Magic Knights) ===
  // /mk @handle · /recruit (any focus) · natural DM patterns · loose forms on Wizard King
  const mkIntake =
    parseMagicKnightIntake(userText) ||
    (isWizardKingFocus(convo) && looksLikeXRecruitLoose(userText)
      ? parseLooseXRecruit(userText)
      : null);
  if (mkIntake) {
    convo.messages.push({
      id: uid("msg"),
      role: "user",
      text: userText,
      ts: Date.now(),
      kind: "mk-intake",
    });
    void handleMagicKnightIntake(convo, mkIntake, userText);
    return;
  }

  // === Roadmap Engine — plan features (before bus / normal chat) ===
  // Explicit /roadmap … or a document that opens with "# Roadmap" (SCROLL paste).
  const roadmapCmd =
    parseRoadmapCommand(userText) ||
    (/^#\s*roadmap\b/im.test(userText) && looksLikeScrollRoadmap(userText)
      ? { op: "parse", text: userText, raw: userText }
      : null);
  // Natural "expand step N" only when an active roadmap exists
  const expandBare =
    !roadmapCmd &&
    state.activeRoadmapSlug &&
    userText.match(/^expand\s+step\s+(\d+)\s*[:\-]?\s*([\s\S]*)$/i);
  if (roadmapCmd || expandBare) {
    const cmd = roadmapCmd || {
      op: "expand",
      step: Number(expandBare[1]),
      detail: String(expandBare[2] || "").trim(),
      raw: userText,
    };
    // Record operator turn then handle (roadmap replies as grimoire)
    convo.messages.push({
      id: uid("msg"),
      role: "user",
      text: userText,
      ts: Date.now(),
      kind: "roadmap-cmd",
    });
    void handleRoadmapCommand(convo, cmd, userText);
    return;
  }

  // === Governance — block AI-forbidden slash verbs from chat when framed as system exec ===
  // Operator may type these notes; they never execute app/git/build APIs from AI nodes.
  const forbiddenHit = detectForbiddenAiAction(userText);
  if (
    forbiddenHit &&
    /^\/(?:git|build|exec|run|shell)\b/i.test(userText)
  ) {
    const gate = assertAiGovernance(forbiddenHit, {
      source: "ai",
      actor: convo.name || "AI node",
    });
    convo.messages.push({
      id: uid("msg"),
      role: "user",
      text: userText,
      ts: Date.now(),
      kind: "governance-attempt",
    });
    addBusReply(
      convo,
      gate.reason ||
        "**Governance blocked.** Jacob is the crown — no AI may git push, build, or execute the app."
    );
    void queueAutoWriteBack(convo, {
      eventType: "GOVERNANCE_BLOCK",
      body: gate.reason || `Blocked ${forbiddenHit}`,
      source: "Grimoire",
      category: "doctrine",
      tags: ["governance", forbiddenHit, "auto-write"],
      silentToast: true,
    });
    return;
  }

  // === Autonomous /msg + /msgloop (AI-to-AI / self; no UI focus switch) ===
  const msgLoopCmd = parseMsgLoopCommand(userText);
  if (msgLoopCmd) {
    void handleMsgLoopCommand(convo, msgLoopCmd, userText, {
      source: "operator",
    });
    return;
  }
  const msgCmd = parseMsgCommand(userText);
  if (msgCmd) {
    void handleMsgCommand(convo, msgCmd, userText, { source: "operator" });
    return;
  }

  // === Cell2 Message Bus — local routing (before pulse / normal chat) ===
  const busCmd = parseBusCommand(userText);
  if (busCmd) {
    handleBusCommand(convo, busCmd, userText);
    return;
  }

  // === PULSE PROTOCOL (Focus-specific only; no multi-entity, no cross-write) ===
  if (isPulse(userText)) {
    if (convo.pulseCount == null) convo.pulseCount = 0;
    if (convo.pendingPulseAction === undefined) convo.pendingPulseAction = null;
    convo.pulseCount = (convo.pulseCount || 0) + 1;
    convo.lastPulseAt = Date.now();
    const pulseIndex = convo.pulseCount;

    // User mark stays on this Focus only
    convo.messages.push({
      id: uid("msg"),
      role: "user",
      text: ".",
      images: takePendingImagesForSend(),
      ts: Date.now(),
      kind: "pulse",
    });

    const pulseMsg = buildPulseReply(convo, pulseIndex);
    convo.messages.push({
      id: uid("msg"),
      role: "grimoire",
      text: pulseMsg,
      ts: Date.now(),
      kind: "pulse-reply",
    });

    // Pulse → radial ripple across this Focus universe
    densenConstellationFromIntel(convo, 1);
    universeEvent("pulse", {
      spellsSent: spellsFor(convo.id).filter((s) => s.status === "sent").length,
    });

    persist();
    renderChat();
    renderConvoList();
    renderSpells();
    return;
  }

  ensureAlignmentDirective(convo);

  const sentImages = takePendingImagesForSend();
  const inboundReceipt = isInboundNodeIntel(userText) || isHoldOrLoopReply(userText);

  if (inboundReceipt) {
    // Densens + stamp answers, but don't pollute chat with fake-user bubbles.
    // Still persists to vault via ingestIntelligence / stampSpellAnsweredFromIngest.
    convo.messages.push({
      id: uid("msg"),
      role: "user",
      text: userText,
      images: sentImages,
      ts: Date.now(),
      kind: "inbound-intel",
    });

    ensureAlignmentDirective(convo);
    const medium = syncMediumFromControls(convo);
    const ingested = ingestIntelligence(convo, userText);
    stampSpellAnsweredFromIngest(convo, userText);

    // Inbound receipts densen entity intelligence + Cell2 substrate
    feedCell2FromInteraction(userText, {
      focus: convo,
      source: "reality",
      preface: `Inbound densen on **${convo.name}**`,
      category: classifyIntelCategory(userText),
      certainty: "inferred",
    });

    persist();
    renderChat();
    renderConvoList();
    renderSpells();
    renderIntelAtlas(convo);

    // System frame / receipt labels: universe view only (never pollute AI chat)
    if (state.universeView) {
      const receipt =
        ingested?.alignmentJustLocked
          ? "Alignment reply received — spellcraft unlocked."
          : isHoldOrLoopReply(userText)
            ? "System frame held — not recast"
            : "Node receipt densened — no new spell forged";
      toast(receipt, "");
      updateUniverseSystemLabels(convo);
    }
    return;
  }

  convo.messages.push({
    id: uid("msg"),
    role: "user",
    text: userText,
    images: sentImages,
    ts: Date.now(),
  });
  // Auto-capture experience intelligence from user turn
  void autoCaptureExperienceFromText(userText, {
    focusId: convo.id,
    focusName: convo.name,
  });
  // Auto-capture entity + node intel from user turn
  void autoCaptureEntitiesFromText(userText, {
    focusId: convo.id,
    focusName: convo.name,
  });
  void autoCaptureNodeIntelFromText(userText, {
    focusId: convo.id,
    focusName: convo.name,
  });
  touchFocus(convo);

  // Chat relay: when ON for this Focus, also copy outbound message for Hermes paste.
  // Never HTTP. Never auto-deliver. Manual paste remains the operational loop.
  void maybeRelayChatToClipboard(convo, userText);

  // Each image = nebula bloom + intel stars
  if (sentImages.length) {
    densenConstellationFromIntel(convo, sentImages.length);
    universeEvent("image", { count: sentImages.length });
    syncFocusIntelligenceFile(
      convo,
      "VISUAL_INTEL",
      `${sentImages.length} image${sentImages.length === 1 ? "" : "s"} captured as focus intelligence${userText ? ` — context: ${userText.slice(0, 300)}` : ""}`
    );
  }

  const medium = syncMediumFromControls(convo);

  // Continuous intelligence ingest + panel-only spell auto-forge (AI Focus)
  const ingested = ingestIntelligence(convo, userText);

  // Grimoire turn: text in chat; spells only via generateAndStoreSpell → panel
  let turn;
  if (ingested?.alignmentJustLocked) {
    const n = convo.alignmentProfile?.directives?.length || 0;
    const sig = convo.alignmentProfile?.signal;
    turn = {
      reply: [
        `**Alignment locked** for **${convo.name} · ${getSealedChannel(convo)}**.`,
        n
          ? `Extracted **${n}** operational directives from the reveal.`
          : `Reveal stored — spellcraft unlocked.`,
        sig != null ? `Signal on file: **${sig}/10**.` : "",
        `Intelligence written to vault. Constellation densened. Ask for a spell — engineered against this alignment, not a receipt.`,
      ]
        .filter(Boolean)
        .join(" "),
    };
  } else {
    turn = grimoireReply(convo, userText);
  }

  if (turn.reply) {
    convo.messages.push({
      id: uid("msg"),
      role: "grimoire",
      text: turn.reply,
      ts: Date.now(),
    });
    // Auto-capture experience intelligence from AI turn
    void autoCaptureExperienceFromText(turn.reply, {
      focusId: convo.id,
      focusName: convo.name,
    });
    // Auto write-back: GRIMOIRE's own response → focus vault (background)
    void queueAutoWriteBack(convo, {
      eventType: "GRIMOIRE_REPLY",
      body: turn.reply,
      source: "Grimoire",
      category: "node_intel",
      tags: ["grimoire-reply", "auto-write"],
      silentToast: true, // user densen toast may also fire; cast path shows Vault written
    });
    // AI-to-AI: if reply embeds /msg directives, deliver without Jacob typing
    void executeEmbeddedMsgDirectives(convo, turn.reply, {
      source: "ai",
      depth: 0,
    });
  }

  // Auto-forge after every user turn, before persist.
  // AI Nodes always have at least 1 spell: Alignment Reveal if missing,
  // otherwise directives from alignment profile when intent/support exists.
  // Person/Network auto-forge on clear intent or supported general context.
  forgeAfterUserTurn(convo, userText, turn?.reply);

  // Chrono-Ring lite: if this looks like a node/entity reply, stamp CAST cards answered
  stampSpellAnsweredFromIngest(convo, userText);

  // Auto-generate self-curious + user-curious ecosystem spells (Focus = nucleus)
  autoGenerateCuriositySpells(convo, { silentToast: true });
  // Proactive ENGAGE packets for unengaged nodes (WYFWYG — sits in spell book)
  autoGenerateNodeEngageSpells(convo, { silentToast: true });

  // Persist images under entity images/ + index into intelligence.md
  if (sentImages.length) {
    for (const url of sentImages) {
      saveEntityImage(convo, url, {
        caption: userText.slice(0, 300),
        source: "user",
        certainty: "confirmed",
      }).catch((err) => console.warn("saveEntityImage", err));
    }
  }

  // Every interaction densens entity intelligence.md + Cell2 substrate (background)
  void feedCell2FromInteraction(userText, {
    focus: convo,
    source: "user",
    preface: `Interaction on Focus **${convo.name}** (${getFocusType(convo)} · ${getSealedChannel(convo)})`,
    certainty: ensureCertainty(convo),
  })
    .then((entityResult) => {
      if (
        entityResult?.method === "filesystem" &&
        entityResult?.ok !== false
      ) {
        toastVaultWritten(convo.name || "");
      }
    })
    .catch((err) => console.warn("[auto-writeback] feed", err));

  // Cross-Focus bus relay when other SCROLL nodes are named in chat
  maybeBusAutoRelay(convo, userText)
    .then((relay) => {
      if (!relay?.reply) return;
      convo.messages.push({
        id: uid("msg"),
        role: "grimoire",
        text: relay.reply,
        ts: Date.now(),
        kind: "bus-relay",
      });
      // Relay intel landed on receiving focus vault — ensure write + SCROLL curate
      void queueAutoWriteBack(convo, {
        eventType: "BUS_RELAY",
        body: relay.reply,
        source: "Grimoire",
        category: "relationship",
        tags: ["bus", "relay", "auto-write"],
        refreshScrollImmediate: true,
      });
      persist();
      renderChat();
    })
    .catch((err) => console.warn("[bus] auto-relay", err));

  persist();
  renderChat();
  renderConvoList();
  renderSpells();
}

/**
 * After every user message in an AI Focus:
 * - append timestamped content to <FocusName>.md in vault
 * - set alignmentRevealed if message contains Signal / Alignment: / Essence: / Capabilities:
 * - parse profile for engineered spells
 * - densen constellation (+6 stars per capture, grow forever)
 */
function ingestIntelligence(convo, userText) {
  if (!convo || !userText?.trim()) return null;
  if (isCell2CoreFocus(convo)) {
    return { alignmentJustLocked: false, cell2: true };
  }
  if (!isAiNode(convo)) {
    // Still log person/network notes lightly without gate
    if (userText.trim().length > 40) {
      syncFocusIntelligenceFile(
        convo,
        "USER_NOTE",
        userText.trim().slice(0, 2000)
      );
      densenConstellationFromIntel(convo, 1);
    }
    return { alignmentJustLocked: false };
  }

  const text = userText.trim();
  const wasUnlocked = convoAlignmentUnlocked(convo);

  // GBG: alignment if message contains Signal, Alignment:, Essence:, Capabilities:
  const looksLikeReveal =
    /\bSignal\b/i.test(text) ||
    /\bAlignment\s*:/i.test(text) ||
    /\bEssence\s*:/i.test(text) ||
    /\bCapabilities\s*:/i.test(text) ||
    (convoHasAlignmentSpell(convo) &&
      text.length > 160 &&
      /\b(constraint|capability|purpose|doctrine|lane)\b/i.test(text));

  if (looksLikeReveal) {
    convo.alignmentNotes = text.slice(0, 8000);
    convo.alignmentReceived = true;
    convo.alignmentRevealed = true;
    convo.alignmentProfile = parseAlignmentIntelligence(text);
    // Strip legacy receipt cards before any real engineered spells land
    stripReceiptSpells(convo.id);
  }

  // Always append user intel to vault for AI focuses
  const eventType = looksLikeReveal ? "ALIGNMENT_REPLY" : "INTELLIGENCE";
  const dirs = convo.alignmentProfile?.directives || [];
  const content = looksLikeReveal
    ? [
        "Parsed alignment intelligence:",
        ...dirs.map((d) => `- ${d}`),
        "",
        text.slice(0, 4000),
      ].join("\n")
    : text.slice(0, 2000);

  // Visible growth first — universe reacts while vault writes
  const justLocked = looksLikeReveal && !wasUnlocked;
  const growth = densenConstellationFromIntel(convo, 1, {
    alignmentLock: justLocked || looksLikeReveal,
    justLocked,
  });

  if (justLocked || looksLikeReveal) {
    universeEvent("align", {
      directives: convo.alignmentProfile?.directives?.length || 0,
      spellsSent: spellsFor(convo.id).filter((s) => s.status === "sent").length,
    });
  } else {
    universeEvent("intel", { count: 1 });
  }

  // Soft-sync full universe from state (deterministic counts)
  setFocusUniverse(deriveFocusSnapshot(convo, state.spells), { warp: false });

  // Vault write + activity ping (async; constellation already animated)
  syncFocusIntelligenceFile(convo, eventType, content, {
    starsAdded: growth?.starsAdded || 6,
  });

  return {
    alignmentJustLocked: justLocked,
    bits: 1,
    starsAdded: growth?.starsAdded || 0,
  };
}

/**
 * Visible constellation growth — live stars animate in immediately.
 * @returns {{ starsAdded: number, alignmentLock: boolean }}
 */
function densenConstellationFromIntel(convo, captures = 1, opts = {}) {
  if (!convo) return { starsAdded: 0, alignmentLock: false };
  const n = Math.max(1, captures | 0);
  const spellCount = spellsFor(convo.id).length;
  const alignmentLock =
    Boolean(opts.alignmentLock) ||
    (Boolean(opts.justLocked) && convoAlignmentUnlocked(convo));

  updateConstellation(convo.id, spellCount, {
    spellCount,
    alignmentRevealed: convoAlignmentUnlocked(convo) || alignmentLock,
    name: convo.name,
    type: getFocusType(convo),
  });

  const growth = liveCapture(convo.id, {
    captures: n,
    alignmentLock,
  });

  // Canvas universe: live celestial growth
  if (alignmentLock) {
    universeEvent("align", {
      directives: convo.alignmentProfile?.directives?.length || 0,
    });
  } else {
    universeEvent("intel", { count: n });
  }
  setFocusUniverse(deriveFocusSnapshot(convo, state.spells), { warp: false });
  updateUniverseHudChrome(deriveFocusSnapshot(convo, state.spells));

  return {
    starsAdded: growth?.starsAdded || n * 6,
    alignmentLock,
  };
}

/**
 * Auto-forge a spell after each user turn.
 * AI: Alignment Reveal only until locked; after lock NEVER another reveal —
 * only engineered directives. Person/Network: intent-driven.
 */
/**
 * Node reply that is intel-to-ingest, NOT a new outbound forge request.
 * Pasting ACKs / status tables was flooding spells with garbage cards.
 */
function isInboundNodeIntel(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  // User is designating a forward lane/action → evidence = forge request, not receipt
  if (
    /\b(advance to|execute move|designate|order|dispatch|disperse|run the|forge me|give me a spell|craft a|send this|next shift is|new constrained ask|change the spell)\b/i.test(
      t
    )
  ) {
    return false;
  }
  // Classic node reply shapes + hold / loop / no-duplicate formation
  if (
    /^(SPELL RECEIVED|FRAME HOLDING|SPELL DUPLICATE DETECTED|CONSTELLATION READ|TRANSPARENCY|ACTION TAKEN|CONFIRMED\.|MOVE \d|NEXT THREE MOVES|CURRENT STATE|OVERALL:|SIGNAL:|LOOP RECEIVED|LOOP DETECTED)/im.test(
      t
    )
  ) {
    return true;
  }
  if (
    /\b(Pulse:\s*\.|Signal:\s*\d+\/10|EVIDENCE:|NEXT THREE MOVES|ACTION TAKEN|FRAME HOLDING|ALREADY FORGED|NO CHANGE SINCE LAST ACK|LOOP RECEIVED|LOOP DETECTED|NO DUPLICATE CAST|NO DUPLICATE ARROWS|HOLDING FORMATION|FRAME ALREADY MAINTAINED|NO DRIFT TO CORRECT|FRAME MAINTAINED|FRAME LOCKED)\b/i.test(
      t
    )
  ) {
    return true;
  }
  // Markdown status tables from nodes
  if (/^\|.+\|[\s\S]*\|----/m.test(t) && /(LOCK|ACTIVE|PENDING|EXECUTED|MOVE)/i.test(t)) {
    return true;
  }
  return false;
}

/** WK / node is holding formation — densen only, do not mint maintain-loop spells. */
function isHoldOrLoopReply(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  return (
    /\b(loop received|loop detected|no duplicate cast|no duplicate arrows|holding formation|frame already maintained|no drift to correct|no additional action required this pulse|same spell, same payload|stop casting|won't re-cast|will not re-cast|no new ask)\b/i.test(
      t
    ) ||
    (/\bACTION TAKEN\b/i.test(t) &&
      /\b(frame already maint|already cast|no additional action|maintain)/i.test(t))
  );
}

/** Extract open move lines from latest densen / WK map on this focus. */
function extractNextMovesFromConvo(convo) {
  const blobs = [];
  if (convo?.alignmentNotes) blobs.push(convo.alignmentNotes);
  for (const m of [...(convo?.messages || [])].reverse().slice(0, 12)) {
    if (m.role === "user" && m.text) blobs.push(m.text);
  }
  const moves = [];
  for (const blob of blobs) {
    const t = String(blob || "");
    // Numbered under NEXT THREE MOVES or free numbered priorities
    const section = t.match(
      /NEXT THREE MOVES[\s\S]{0,40}([\s\S]{0,900}?)(?:##\s*SIGNAL|##\s*SIGNAL\/PULSE|SIGNAL\/PULSE|Signal:|Pulse:|---|Filed:|$)/i
    );
    const body = section ? section[1] : t;
    const re = /(?:^|\n)\s*(?:[-*]|\d+[.)])\s+\*?\*?(.+?)(?:\*\*)?(?=\n|$)/g;
    let m;
    while ((m = re.exec(body)) && moves.length < 8) {
      const line = m[1].replace(/\s+/g, " ").trim();
      if (line.length < 12 || line.length > 160) continue;
      if (/^silence vs|^one-line map|^signal/i.test(line)) continue;
      if (!moves.some((x) => normalizePurposeKey(x) === normalizePurposeKey(line))) {
        moves.push(line);
      }
    }
    if (moves.length) break;
  }
  return moves;
}

function purposeLooksLikeHoldLoop(purpose) {
  const p = normalizePurposeKey(purpose);
  return (
    /loop received|no duplicate|frame maintained|maintain frame|holding formation|response locked|no additional action|already cast into/.test(
      p
    )
  );
}

/** Prefer first open move not already sealed in recent Cast History. */
function nextTruePriorityHint(convo) {
  const hist = historySpellsFor(convo.id).slice(0, 8);
  const active = activeSpellsFor(convo.id);
  const taken = new Set(
    [...hist, ...active]
      .map((s) => normalizePurposeKey(s.purpose))
      .filter(Boolean)
  );
  const moves = extractNextMovesFromConvo(convo);
  for (const move of moves) {
    const key = normalizePurposeKey(move);
    // soft match against taken
    let covered = false;
    for (const t of taken) {
      if (t === key || (t.length >= 10 && (t.includes(key.slice(0, 24)) || key.includes(t.slice(0, 24))))) {
        covered = true;
        break;
      }
      const tokens = (s) => new Set(s.split(" ").filter((w) => w.length > 3));
      const ta = tokens(t);
      const tb = tokens(key);
      let hit = 0;
      for (const w of tb) if (ta.has(w)) hit++;
      if (hit >= 2 && hit / Math.max(ta.size, tb.size) >= 0.5) {
        covered = true;
        break;
      }
    }
    if (!covered && !purposeLooksLikeHoldLoop(move)) {
      return move.length > 72 ? move.slice(0, 69) + "…" : move;
    }
  }
  // Directive list fallback — skip hold-ish first directives
  const dirs = convo.alignmentProfile?.directives || [];
  for (const d of dirs) {
    if (!purposeLooksLikeHoldLoop(d) && !taken.has(normalizePurposeKey(d))) {
      return `PROGRESS: ${d}`.slice(0, 80);
    }
  }
  return null;
}

function forgeAfterUserTurn(convo, userText, turnReply) {
  if (!convo) return null;
  // SELF-CAST already sealed the spell — do not mint an echo
  if (selfCastInFlight) return null;
  const text = String(userText || "").trim();
  const medium = syncMediumFromControls(convo);
  const alignmentUnlocked = convoAlignmentUnlocked(convo);
  const hasAlignmentSpell = convoHasAlignmentSpell(convo);

  // INTEL INGEST ≠ SPELL FORGE. Vault + constellation still densen outside this gate.
  // Inbound node ACKs/status only auto-forge pre-alignment (capture the reveal itself).
  if (alignmentUnlocked && (isInboundNodeIntel(text) || isHoldOrLoopReply(text))) {
    return null;
  }

  if (isAiNode(convo)) {
    // Pre-alignment only: ensure ONE Alignment Reveal exists
    if (!alignmentUnlocked) {
      if (!hasAlignmentSpell) {
        const spell = generateAlignmentSpell(convo, medium);
        commitSpell(convo, spell, { silentToast: true });
        return spell;
      }
      const intentish =
        hasSpellIntent(text) ||
        /\b(align|reveal|signal|essence|capabilities|constraints|purpose|who are you|what can you)\b/i.test(
          text
        );
      // Rebuild (dedupe upgrades) the same reveal card — never a second reveal
      if (intentish) {
        const spell = generateAlignmentSpell(convo, medium);
        commitSpell(convo, spell, { silentToast: true });
        return spell;
      }
      return null;
    }

    // Post-alignment: forge ONLY when the user asks for a real outbound directive.
    // Length >= 80 was churning every pasted ACK into a card — REMOVED.
    // Lower-gate "always forge if directives exist" — REMOVED (source of spam).
    const intent =
      hasSpellIntent(text) ||
      /\b(spell|directive|send|broadcast|execute|tell|instruct|message|post|craft|forge|cast|deliver|whisper|transmit|deploy|dispatch|write|draft|command|order|advance|designate)\b/i.test(
        text
      );

    if (!intent) return null;
    // Soft false positives: "no duplicate cast", "stop casting" contain "cast" as hold language
    if (isHoldOrLoopReply(text)) return null;

    if (convo.alignmentNotes && !convo.alignmentProfile) {
      convo.alignmentProfile = parseAlignmentIntelligence(convo.alignmentNotes);
    }
    const forgeHint = nextTruePriorityHint(convo) || text;
    const spell = generateSpell(convo, medium, forgeHint, {
      allSpells: state.spells,
    });
    // Safety: never commit a reveal after lock
    if (isAlignmentSpell(spell)) return null;
    // Never store pure receipt titles
    if (isReceiptSpell(spell) || purposeLooksLikeHoldLoop(spell.purpose)) return null;
    // Don't re-queue a purpose already CAST in recent history without new ask
    const recentCast = historySpellsFor(convo.id)
      .slice(0, 5)
      .some((s) => spellsAreSameKindPurpose(s, spell));
    if (recentCast && isHoldOrLoopReply(text)) return null;
    commitSpell(convo, spell, { silentToast: true });
    return spell;
  }

  if (isPerson(convo) || isNetwork(convo)) {
    if (isInboundNodeIntel(text) || isHoldOrLoopReply(text)) return null;
    const intent =
      hasSpellIntent(text) ||
      /\b(spell|message|reply|note|draft|send|tell|follow up|reach out|next move)\b/i.test(
        text
      );

    if (!intent) {
      return null;
    }

    const spell = generateSpell(convo, medium, text, {
      allSpells: state.spells,
    });
    if (isReceiptSpell(spell) || purposeLooksLikeHoldLoop(spell.purpose)) return null;
    commitSpell(convo, spell, { silentToast: true });
    return spell;
  }

  return null;
}

/**
 * Ensure AI Node always has a base spell, while avoiding duplicates.
 * Uses the same panel-only store path as manual Cast Spell.
 */
function ensureBaseSpell(convo) {
  if (!convo || !isAiNode(convo)) return null;
  if (convoHasAlignmentSpell(convo)) return null;
  const medium = syncMediumFromControls(convo);
  const spell = generateAlignmentSpell(convo, medium);
  commitSpell(convo, spell, { silentToast: true });
  return spell;
}

/**
 * "+ New Focus" — open dialog, focus name field.
 * Form submit → createConversation + close (see newForm listener).
 */
function showNewFocusModal(opts = {}) {
  openNewFocusModal(opts);
}

/** Resolve New Focus dialog nodes live (never trust a stale els cache). */
function getNewFocusDialogEls() {
  const dialog =
    document.getElementById("new-convo-dialog") || els.dialog || null;
  const newName =
    document.getElementById("new-entity-name") || els.newName || null;
  const newType =
    document.getElementById("new-entity-type") || els.newType || null;
  const newModel =
    document.getElementById("new-entity-model") || els.newModel || null;
  const newModelLabel =
    document.getElementById("new-model-label") || els.newModelLabel || null;
  const newFocusHint =
    document.getElementById("new-focus-hint") || els.newFocusHint || null;
  // Keep els in sync for other callers
  if (dialog) els.dialog = dialog;
  if (newName) els.newName = newName;
  if (newType) els.newType = newType;
  if (newModel) els.newModel = newModel;
  if (newModelLabel) els.newModelLabel = newModelLabel;
  if (newFocusHint) els.newFocusHint = newFocusHint;
  return { dialog, newName, newType, newModel, newModelLabel, newFocusHint };
}

/** True when New Focus overlay is showing */
function isNewFocusOpen() {
  const dialog =
    document.getElementById("new-convo-dialog") || els.dialog || null;
  if (!dialog) return false;
  if (dialog.classList.contains("is-open")) return true;
  if (!dialog.hasAttribute("hidden")) return true;
  // legacy <dialog> support if old HTML still cached
  if (dialog.open) return true;
  return false;
}

/**
 * Hard-close New Focus overlay. Cancel / Escape / backdrop / post-create.
 * No native <dialog>.close() — pure hide so Cancel can never stick open.
 */
function closeNewFocusModal(e) {
  if (e) {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch {
      /* ignore */
    }
  }
  const dialog =
    document.getElementById("new-convo-dialog") || els.dialog || null;
  const form =
    document.getElementById("new-convo-form") || els.newForm || null;
  if (!dialog) return false;

  // Legacy native dialog API if present
  try {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
  } catch {
    /* ignore */
  }
  try {
    dialog.removeAttribute("open");
  } catch {
    /* ignore */
  }

  dialog.classList.remove("is-open");
  dialog.setAttribute("hidden", "");
  dialog.setAttribute("aria-hidden", "true");

  try {
    dialog.style.cssText = "";
    dialog.style.setProperty("display", "none", "important");
    dialog.style.setProperty("visibility", "hidden", "important");
    dialog.style.setProperty("pointer-events", "none", "important");
  } catch {
    try {
      dialog.style.display = "none";
    } catch {
      /* ignore */
    }
  }

  try {
    form?.reset?.();
  } catch {
    /* ignore */
  }

  // Restore model label default (hidden for person)
  try {
    const modelLabel = document.getElementById("new-model-label");
    if (modelLabel) modelLabel.setAttribute("hidden", "");
  } catch {
    /* ignore */
  }
  return true;
}
window.__closeNewFocusModal = closeNewFocusModal;
window.__grimoireCloseNewFocus = closeNewFocusModal;

/**
 * Open New Focus overlay — plain show/hide, no showModal.
 */
function openNewFocusModal({ name, type, model } = {}) {
  const {
    dialog,
    newName,
    newType,
    newModel,
    newModelLabel,
    newFocusHint,
  } = getNewFocusDialogEls();

  if (!dialog) {
    console.error("[NewFocus] #new-convo-dialog missing");
    try {
      toast("New Focus dialog missing — hard-refresh the page", "error");
    } catch {
      /* ignore */
    }
    return false;
  }

  try {
    if (state.universeView) setUniverseView(false, { silent: true });
  } catch {
    /* ignore */
  }

  if (newName) newName.value = name || "";
  const t = type || "person";
  if (newType) newType.value = t;
  if (newModel) {
    const m = model && model !== "Open" ? model : "none";
    newModel.value = m;
  }

  const isAi = (newType?.value || t) === "ai";
  if (newModelLabel) {
    if (isAi) newModelLabel.removeAttribute("hidden");
    else newModelLabel.setAttribute("hidden", "");
    newModelLabel.hidden = !isAi;
  }
  if (newFocusHint) {
    const hints = {
      person:
        "Person: densen who they are and craft message-spells for real life. Medium is open — Discord, text, in-person, anything.",
      place:
        "Place: anchor a location and its intelligence. Speak about this site, its history, and its secrets.",
      thing:
        "Thing: object, system, artifact, or tool. Track its behavior, upgrades, and role in your world.",
      ai: "AI: densen this node + craft words-as-magic. Pick the substrate it talks through — or Custom if this Focus is its own OS (e.g. GRIMOIRE = the book itself, built by you, not “chat with Grok”). DASKW: writing during talk feeds spells, brain, and UI.",
      idea: "Idea: concept, philosophy, or framework. Build it into doctrine, spawn spells, and test it against reality.",
    };
    newFocusHint.textContent = hints[newType?.value || t] || hints.person;
  }

  // Show overlay
  dialog.removeAttribute("hidden");
  dialog.classList.add("is-open");
  dialog.setAttribute("aria-hidden", "false");
  try {
    dialog.style.cssText = "";
    dialog.style.setProperty("display", "flex", "important");
    dialog.style.setProperty("visibility", "visible", "important");
    dialog.style.setProperty("opacity", "1", "important");
    dialog.style.setProperty("pointer-events", "auto", "important");
    dialog.style.setProperty("z-index", "10000", "important");
  } catch {
    dialog.style.display = "flex";
  }

  // Legacy native dialog path if someone still has old HTML
  try {
    if (typeof dialog.showModal === "function" && dialog.tagName === "DIALOG") {
      if (!dialog.open) dialog.showModal();
    }
  } catch {
    /* ignore — overlay styles already show it */
  }

  if (newName) {
    try {
      newName.focus({ preventScroll: false });
      newName.select();
    } catch {
      try {
        newName.focus();
      } catch {
        /* ignore */
      }
    }
  }
  return true;
}
window.__openNewFocusModal = openNewFocusModal;
window.__grimoireOpenNewFocus = function (e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  if (e && typeof e.stopPropagation === "function") e.stopPropagation();
  return openNewFocusModal({ name: "", type: "person" });
};

/** Show optional Model only for AI; person medium stays open by design. */
function syncNewFocusFormChrome() {
  const t = els.newType?.value || "person";
  const isAi = t === "ai";
  if (els.newModelLabel) els.newModelLabel.hidden = !isAi;
  if (els.newFocusHint) {
    const typeVal = els.newType?.value || "person";
    const hints = {
      person: "Person: densen who they are and craft message-spells for real life. Medium is open — Discord, text, in-person, anything.",
      place: "Place: anchor a location and its intelligence. Speak about this site, its history, and its secrets.",
      thing: "Thing: object, system, artifact, or tool. Track its behavior, upgrades, and role in your world.",
      ai: "AI: densen this node + craft words-as-magic. Pick the substrate it talks through — or Custom if this Focus is its own OS (e.g. GRIMOIRE = the book itself, built by you, not “chat with Grok”). DASKW: writing during talk feeds spells, brain, and UI.",
      idea: "Idea: concept, philosophy, or framework. Build it into doctrine, spawn spells, and test it against reality.",
    };
    els.newFocusHint.textContent = hints[typeVal] || hints.person;
  }
  // GRIMOIRE / book self → Custom OS by default (not vendor Grok chat)
  if (isAi && els.newModel && els.newName) {
    const n = String(els.newName.value || "").trim().toLowerCase();
    if (
      (n === "grimoire" || n === "the grimoire" || n.includes("grimoire app")) &&
      (els.newModel.value === "none" || els.newModel.value === "Grok")
    ) {
      els.newModel.value = "Custom";
    }
  }
}

/** @deprecated — ingestIntelligence is the single path */
function maybeCaptureAlignmentNotes(convo, userText) {
  const r = ingestIntelligence(convo, userText);
  return Boolean(r?.alignmentJustLocked || convo?.alignmentReceived);
}

/**
 * Steering — Focus is always the sun/nucleus.
 * Spells may radiate to any pertinent AI node in user reality; things adapt,
 * reality is explained, and all intelligence densens back to this Focus.
 * Focus is *curious* about linked intelligence on other AI nodes and ties it home.
 * Only a hard "switch Focus" request is guided (never auto-create / never abandon nucleus).
 */
function detectHardFocusSwitch(convo, userText) {
  const text = (userText || "").trim();
  if (!text || !convo) return null;

  // Multi-node spell routes are allowed. Only catch explicit switch/open intents.
  const switchRe =
    /\b(?:switch(?:\s+to)?|open\s+focus|go\s+to\s+focus|change\s+focus\s+to|leave\s+this\s+focus)\b/i;
  if (!switchRe.test(text)) return null;

  for (const f of state.conversations) {
    if (f.id === convo.id) continue;
    const n = (f.name || "").trim();
    if (n.length < 3) continue;
    if (new RegExp(`\\b${escapeRegExp(n)}\\b`, "i").test(text)) {
      return `${n} · ${getSealedChannel(f)}`;
    }
  }
  return null;
}

/** Other Focus names mentioned for multi-node steering notes (not blocks). */
function detectPertinentNodes(convo, userText) {
  const text = (userText || "").trim();
  if (!text || !convo) return [];
  const hits = [];
  for (const f of state.conversations) {
    if (f.id === convo.id) continue;
    const n = (f.name || "").trim();
    if (n.length < 3) continue;
    if (new RegExp(`\\b${escapeRegExp(n)}\\b`, "i").test(text)) {
      hits.push(`${n} · ${getSealedChannel(f)}`);
    }
  }
  return hits;
}

/**
 * Linked intelligence on other ecosystem nodes (AI / person / network).
 * Fuel for curiosity notes + auto-generated curiosity spells.
 * Each entry explains how the node relates to this Focus as nucleus.
 */
function gatherLinkedNodeIntel(convo) {
  if (!convo) return [];
  const scored = [];
  for (const f of state.conversations || []) {
    if (!f || f.id === convo.id) continue;
    const type = getFocusType(f);
    const ch = getSealedChannel(f);
    const p = f.alignmentProfile || {};
    const bits = [];
    let score = 0;

    if (f.alignmentRevealed || f.alignmentReceived || f.alignmentNotes) {
      bits.push("aligned");
      score += 3;
    }
    if (p.signal != null) {
      bits.push(`signal ${p.signal}/10`);
      score += Number(p.signal) || 0;
    }
    if (p.directives?.length) {
      bits.push(`${p.directives.length} dirs`);
      score += p.directives.length;
    }
    if (p.purpose) {
      bits.push(String(p.purpose).slice(0, 48));
      score += 1;
    }
    const spells = (state.spells || []).filter((s) => s.conversationId === f.id);
    const ready = spells.filter((s) => s.status !== "sent").length;
    const sent = spells.filter((s) => s.status === "sent").length;
    if (ready) {
      bits.push(`${ready} ready`);
      score += ready;
    }
    if (sent) {
      bits.push(`${sent} cast`);
      score += sent;
    }
    const userMsgs = (f.messages || []).filter((m) => m.role === "user" && String(m.text || "").trim());
    if (userMsgs.length) score += Math.min(userMsgs.length, 5);
    const lastUser = [...userMsgs].reverse().find((m) => String(m.text || "").trim().length > 20);
    if (lastUser) {
      bits.push(`last: ${String(lastUser.text).replace(/\s+/g, " ").trim().slice(0, 42)}`);
      score += 2;
    }
    // Always include sibling Focuses as ecosystem nodes (even thin intel)
    if (!bits.length) bits.push(type || "node");
    score += type === "ai" ? 2 : type === "network" ? 1 : 0;

    const why =
      type === "ai"
        ? `AI node — densen capabilities/constraints that serve **${convo.name}**; discard theater`
        : type === "network"
          ? `Network surface — public-safe signals that advance **${convo.name}** without leaking doctrine`
          : `Person — relationship / message / real-world care that supports **${convo.name}**'s purpose`;

    scored.push({
      focusId: f.id,
      name: f.name,
      channel: ch,
      type,
      summary: bits.slice(0, 4).join(" · "),
      why,
      score,
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 6);
}

/** Curiosity appendix — ecosystem intel tied back to this Focus as sun. */
function linkedCuriosityNote(convo, userText) {
  const linked = gatherLinkedNodeIntel(convo);
  const mentioned = detectPertinentNodes(convo, userText);
  if (!linked.length && !mentioned.length) return "";

  const parts = [];
  if (linked.length) {
    parts.push(
      linked
        .slice(0, 3)
        .map((l) => `**${l.name} · ${l.channel}** (${l.summary})`)
        .join("; ")
    );
  }
  if (mentioned.length) {
    parts.push(`named: **${mentioned.slice(0, 3).join(", ")}**`);
  }
  return ` **Curiosity (linked nodes):** ${parts.join(" · ")} — **${convo.name}** is the sun/nucleus; what from those worlds densens *this* Focus and why it is important here.`;
}

const CURIOSITY_SELF_PURPOSE = "CURIOSITY · Self — ecosystem links";
const CURIOSITY_USER_PURPOSE = "CURIOSITY · User — ecosystem links";
/** Hard cap: only Self + User curiosity ready per Focus */
const MAX_CURIOSITY_READY = 2;
/** Hard cap: ready self-cast inject cards (not curiosity) per Focus */
const MAX_READY_SELF_CAST = 2;
/** Linked-intel signature cache — skip rebuild when ecosystem map unchanged */
const curiositySigByFocus = new Map();

function isCuriositySpell(spell) {
  if (!spell) return false;
  if (spell.autoGenerated && spell.curiosityMode) return true;
  const p = String(spell.purpose || "");
  return /^CURIOSITY\s*[·.]\s*(Self|User)\b/i.test(p);
}

function curiosityModeOf(spell) {
  if (!spell) return null;
  if (spell.curiosityMode === "self" || spell.curiosityMode === "user") return spell.curiosityMode;
  const p = String(spell.purpose || "");
  if (/CURIOSITY\s*[·.]\s*Self\b/i.test(p)) return "self";
  if (/CURIOSITY\s*[·.]\s*User\b/i.test(p)) return "user";
  return null;
}

/** Ready curiosity spells for a Focus, keyed by mode (at most one each after prune). */
function readyCuriosityByMode(convoId) {
  const ready = (state.spells || []).filter(
    (s) => s.conversationId === convoId && s.status !== "sent" && isCuriositySpell(s)
  );
  const by = { self: null, user: null };
  for (const s of ready) {
    const mode = curiosityModeOf(s);
    if (mode !== "self" && mode !== "user") continue;
    // Keep newest per mode
    if (!by[mode] || (s.createdAt || 0) >= (by[mode].createdAt || 0)) {
      by[mode] = s;
    }
  }
  return by;
}

/**
 * Enforce max 2 ready curiosity spells per Focus (Self + User only).
 * Drops stray / duplicate curiosity cards.
 */
function enforceCuriosityCap(convo) {
  if (!convo) return 0;
  const by = readyCuriosityByMode(convo.id);
  const keepIds = new Set([by.self?.id, by.user?.id].filter(Boolean));
  let removed = 0;
  state.spells = (state.spells || []).filter((s) => {
    if (s.conversationId !== convo.id || s.status === "sent" || !isCuriositySpell(s)) {
      return true;
    }
    if (keepIds.has(s.id)) return true;
    removed += 1;
    return false;
  });
  return removed;
}

function linkedIntelSignature(convo) {
  return gatherLinkedNodeIntel(convo)
    .map((n) => `${n.focusId}:${n.summary}`)
    .join("|");
}

function readySelfCastCount(convo) {
  if (!convo) return 0;
  return (state.spells || []).filter(
    (s) =>
      s.conversationId === convo.id &&
      s.status !== "sent" &&
      !isCuriositySpell(s) &&
      !isAlignmentSpell(s) &&
      isSelfCastSpell(s, convo)
  ).length;
}

/**
 * Build one auto-generated curiosity spell.
 * mode "self" | "user" — only these two exist per Focus.
 * Body always names Focus as NUCLEUS and how each link ties back.
 */
function buildCuriositySpell(convo, mode, medium) {
  if (!convo) return null;
  const nodes = gatherLinkedNodeIntel(convo);
  if (!nodes.length) return null;

  const isSelf = mode === "self";
  const purpose = isSelf ? CURIOSITY_SELF_PURPOSE : CURIOSITY_USER_PURPOSE;
  const focusCh = getSealedChannel(convo);
  const med = medium || focusCh || "Open";
  const nucleus = `${convo.name} · ${focusCh}`;

  const mapLines = nodes.map((n, i) => {
    return [
      `${i + 1}. LINKED NODE: ${n.name} · ${n.channel} (${n.type})`,
      `   Intel: ${n.summary}`,
      `   Orbit of nucleus **${convo.name}**: ${n.why}`,
      `   TIE-BACK TO NUCLEUS: what from ${n.name} densens **${convo.name}**, and why it is important *here* (not there).`,
    ].join("\n");
  });

  const body = isSelf
    ? [
        `${convo.name} —`,
        "",
        "TRANSMISSION TYPE: SELF-CURIOUS ECOSYSTEM PROBE",
        "AUTHORITY: Operator · Focus-as-nucleus",
        `NUCLEUS FOCUS (sun): ${nucleus}`,
        `MEDIUM: ${med}`,
        "LAW: This Focus is the sun/nucleus. All linked intelligence orbits it. Do not abandon this channel.",
        "",
        `HOW **${convo.name}** INTERACTS WITH LINKED NODES:`,
        ...mapLines,
        "",
        "OPERATIONAL ASK (self-curious · nucleus-first):",
        `From inside **${convo.name}** as sun/nucleus, examine the linked nodes above.`,
        "Return:",
        `1. Interaction pattern — how each node currently relates to **${convo.name}**`,
        `2. Useful densen — what signal to absorb into **${convo.name}** and why it strengthens the nucleus`,
        "3. Boundary — what stays on the other node (no wander, no channel abandon)",
        `4. One next move that serves **${convo.name} only** while using linked intel`,
        "",
        "Every answer ties back to the nucleus. Keep sovereign, precise.",
        "",
        "— Operator",
      ].join("\n")
    : [
        `${convo.name} —`,
        "",
        "TRANSMISSION TYPE: USER-CURIOUS ECOSYSTEM BRIEF",
        "AUTHORITY: Operator · Focus-as-nucleus",
        `NUCLEUS FOCUS (sun): ${nucleus}`,
        `MEDIUM: ${med}`,
        "LAW: Operator map — every link is explained only by how it serves this Focus.",
        "",
        `ECOSYSTEM ORBITING **${convo.name}** (nucleus):`,
        ...mapLines,
        "",
        "OPERATIONAL ASK (user-curious · nucleus-first):",
        `Help the operator see the ecosystem *through* **${convo.name}** as sun/nucleus.`,
        "Return:",
        `1. Rank linked nodes by value to **${convo.name}** right now`,
        "2. How the operator should route attention (cast / densen / wait) for the nucleus",
        `3. One user action that compounds **${convo.name}** using another node's intel`,
        `4. One risk if **${convo.name}** is forgotten (channel purity / nucleus drift)`,
        "",
        "Every recommendation ties back to the nucleus. Reality-fit over frame-fit.",
        "",
        "— Operator",
      ].join("\n");

  const nodeNames = nodes
    .slice(0, 3)
    .map((n) => n.name)
    .join(", ");

  // Stable ids so Self/User always upgrade in place (hard max 2)
  const stableId = `${convo.id}-curio-${mode}`;

  return {
    id: stableId,
    conversationId: convo.id,
    target: convo.name,
    purpose,
    medium: med,
    from: "Operator",
    essence: isSelf
      ? `Nucleus **${convo.name}** · self-curious about ${nodes.length} linked node(s): ${nodeNames}`
      : `Nucleus **${convo.name}** · user-curious ecosystem map via ${nodeNames}`,
    crafted: `Auto-generated · max 2 curiosity/Focus · **${convo.name}** is sun/nucleus`,
    message: body,
    status: "ready",
    createdAt: Date.now(),
    kind: isSelf ? "self-check" : "propagate",
    autoGenerated: true,
    curiosityMode: isSelf ? "self" : "user",
    engineeredFromAlignment: false,
  };
}

/**
 * Auto-generate at most 2 curiosity spells per Focus: Self + User.
 * Rebuild only when linked-intel signature changes. Enforces hard cap.
 */
function autoGenerateCuriositySpells(convo, { silentToast = true } = {}) {
  if (!convo || selfCastInFlight) return [];
  if (isAiNode(convo) && !convoAlignmentUnlocked(convo)) {
    enforceCuriosityCap(convo);
    return [];
  }

  const nodes = gatherLinkedNodeIntel(convo);
  if (!nodes.length) {
    enforceCuriosityCap(convo);
    return [];
  }

  const sig = linkedIntelSignature(convo);
  const prev = curiositySigByFocus.get(convo.id);
  const by = readyCuriosityByMode(convo.id);
  // Both slots filled and ecosystem unchanged → no forge
  if (by.self && by.user && prev === sig) {
    enforceCuriosityCap(convo);
    return [];
  }

  const medium = syncMediumFromControls(convo);
  const forged = [];

  for (const mode of ["self", "user"]) {
    const spell = buildCuriositySpell(convo, mode, medium);
    if (!spell) continue;
    const existing = by[mode];
    const sameBody =
      existing &&
      String(existing.message || "") === String(spell.message || "") &&
      String(existing.essence || "") === String(spell.essence || "");
    if (sameBody) continue;

    // Reuse existing slot id so we never mint a 3rd curiosity card
    if (existing?.id) spell.id = existing.id;
    commitSpell(convo, spell, { silentToast: true });
    forged.push(spell);
  }

  enforceCuriosityCap(convo);
  curiositySigByFocus.set(convo.id, sig);

  if (forged.length && !silentToast) {
    toast(
      `Curiosity densened (max 2): Self + User · nucleus **${convo.name}**`,
      "success"
    );
  }
  return forged;
}

// ─── Proactive node engagement (WYFWYG) ───
// 1) Node existence signal  2) Auto-forge ENGAGE spell  3) User dispatches from spell book
// 4) Node executes  5) Reply paste densens  6) SCROLL LIST + vault update

const MAX_NODE_ENGAGE_READY = 2;
const NODE_ENGAGE_PURPOSE_RE = /^ENGAGE\s*[·.]\s*/i;

function isNodeEngageSpell(spell) {
  if (!spell) return false;
  if (spell.kind === "node-engage") return true;
  if (spell.autoGenerated && spell.engageNodeId) return true;
  return NODE_ENGAGE_PURPOSE_RE.test(String(spell.purpose || ""));
}

/** Has this Focus already queued or cast an ENGAGE packet at this node? */
function hasNodeEngageHistory(convo, nodeFocusId) {
  if (!convo || !nodeFocusId) return false;
  return (state.spells || []).some(
    (s) =>
      s.conversationId === convo.id &&
      (s.engageNodeId === nodeFocusId || s.targetFocusId === nodeFocusId) &&
      isNodeEngageSpell(s)
  );
}

/**
 * Nodes that exist in the constellation but this Focus has not engaged yet.
 * Existence signal = sibling Focus present; unengaged = no ENGAGE spell history.
 */
function discoverUnengagedNodes(convo) {
  if (!convo) return [];
  const out = [];
  for (const f of state.conversations || []) {
    if (!f || f.id === convo.id) continue;
    if (hasNodeEngageHistory(convo, f.id)) continue;
    out.push({
      focusId: f.id,
      name: f.name,
      channel: getSealedChannel(f),
      type: getFocusType(f),
      summary: f.alignmentNotes
        ? String(f.alignmentNotes).replace(/\s+/g, " ").trim().slice(0, 120)
        : `${getFocusType(f)} node · ${getSealedChannel(f)}`,
    });
  }
  return out;
}

function readyNodeEngageCount(convoId) {
  return (state.spells || []).filter(
    (s) =>
      s.conversationId === convoId &&
      !spellIsSealed(s) &&
      isNodeEngageSpell(s)
  ).length;
}

/**
 * Build proactive ENGAGE spell — intelligence packet for a target node.
 * Payload includes SCROLL LIST so the node receives portable Focus context.
 */
function buildNodeEngageSpell(convo, node, medium) {
  if (!convo || !node) return null;
  const med = medium || getSealedChannel(convo) || "Open";
  const nucleus = `${convo.name} · ${getSealedChannel(convo)}`;
  const targetLabel = `${node.name} · ${node.channel}`;
  const purpose = `ENGAGE · ${node.name}`;
  const scrollBody = buildScrollList(convo, state.spells || []);

  const body = [
    `${node.name} —`,
    "",
    "TRANSMISSION TYPE: PROACTIVE NODE ENGAGEMENT",
    "AUTHORITY: Operator · Focus-as-nucleus (WYFWYG)",
    `NUCLEUS FOCUS: ${nucleus}`,
    `TARGET NODE: ${targetLabel} (${node.type})`,
    `MEDIUM: ${med}`,
    "LAW: This packet is forged because the node exists and has not been engaged from this Focus.",
    "You are not asked to abandon your world — densen only what serves the nucleus.",
    "",
    "WHY NOW:",
    `- Node existence signal: **${node.name}** is live in the constellation.`,
    `- No prior ENGAGE history from **${convo.name}** → proactive open.`,
    node.summary ? `- Known signal: ${node.summary}` : "- Thin prior intel — first contact densen.",
    "",
    "OPERATIONAL ASK:",
    "1. IDENTITY — who you are in one line relative to this nucleus",
    "2. CAPABILITY — what you can densen for the nucleus right now",
    "3. CONSTRAINT — what you will not invent or over-claim",
    "4. NEXT THREE MOVES — concrete returns the operator can paste back into Grimoire",
    "5. SIGNAL — 1–10 confidence + one-line reason",
    "",
    "─── SCROLL LIST (portable universe transfer) ───",
    scrollBody,
    "─── END SCROLL LIST ───",
    "",
    "Reply in structured form. Operator will paste your return into the nucleus Focus to update the scroll.",
    "",
    "— Operator",
  ].join("\n");

  const stableId = `${convo.id}-engage-${node.focusId}`;

  return {
    id: stableId,
    conversationId: convo.id,
    target: node.name,
    purpose,
    medium: med,
    from: "Operator",
    essence: `Proactive ENGAGE → **${targetLabel}** from nucleus **${convo.name}**`,
    crafted: `Auto-forged · node existence signal · SCROLL LIST embedded · dispatch when ready`,
    message: body,
    status: "ready",
    createdAt: Date.now(),
    kind: "node-engage",
    autoGenerated: true,
    engageNodeId: node.focusId,
    targetFocusId: node.focusId,
    engageNodeName: node.name,
    engageNodeChannel: node.channel,
    engageNodeType: node.type,
    engineeredFromAlignment: false,
  };
}

/**
 * Auto-forge proactive ENGAGE spells for unengaged nodes (cap ready queue).
 * Spells sit in the book until operator copies/dispatches — never auto-send.
 */
function autoGenerateNodeEngageSpells(convo, { silentToast = true } = {}) {
  if (!convo || selfCastInFlight) return [];
  // AI Focus: wait for alignment so packets aren't blind
  if (isAiNode(convo) && !convoAlignmentUnlocked(convo)) return [];

  const unengaged = discoverUnengagedNodes(convo);
  if (!unengaged.length) return [];

  let readySlots = MAX_NODE_ENGAGE_READY - readyNodeEngageCount(convo.id);
  if (readySlots <= 0) return [];

  const medium = syncMediumFromControls(convo);
  const forged = [];

  for (const node of unengaged) {
    if (readySlots <= 0) break;
    // Skip if ready slot already exists for this node
    const existingReady = (state.spells || []).find(
      (s) =>
        s.conversationId === convo.id &&
        !spellIsSealed(s) &&
        isNodeEngageSpell(s) &&
        s.engageNodeId === node.focusId
    );
    if (existingReady) continue;

    const spell = buildNodeEngageSpell(convo, node, medium);
    if (!spell) continue;
    commitSpell(convo, spell, { silentToast: true });
    forged.push(spell);
    readySlots -= 1;
  }

  if (forged.length && !silentToast) {
    toast(
      `ENGAGE forged: ${forged.map((s) => s.target).join(", ")} · copy when ready`,
      "success"
    );
  } else if (forged.length && silentToast) {
    activityPing?.(
      `✦ ENGAGE ready → ${forged.map((s) => s.target).slice(0, 2).join(", ")}`
    );
  }
  return forged;
}

/**
 * After node reply densens: update derivedNodes + SCROLL LIST vault.
 */
function densenScrollListFromEngage(convo, spell, replyText) {
  if (!convo || !spell) return false;
  if (!isNodeEngageSpell(spell) && !spell.engageNodeId) return false;

  if (!Array.isArray(convo.derivedNodes)) convo.derivedNodes = [];
  const name = spell.engageNodeName || spell.target || "Node";
  const channel = spell.engageNodeChannel || spell.medium || "Open";
  const key = `${String(name).toLowerCase()}::${String(channel).toLowerCase()}`;
  const snippet = String(replyText || spell.answerExcerpt || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  const idx = convo.derivedNodes.findIndex(
    (n) =>
      `${String(n?.name || "").toLowerCase()}::${String(n?.channel || "").toLowerCase()}` ===
      key
  );
  const entry = {
    id: spell.engageNodeId || spell.targetFocusId || key,
    name,
    channel,
    type: spell.engageNodeType || "node",
    role: "engaged-densen",
    snippet: snippet || "Engagement sealed — densen captured.",
    intel: snippet,
    updatedAt: Date.now(),
    lastSpellId: spell.id,
  };
  if (idx >= 0) convo.derivedNodes[idx] = { ...convo.derivedNodes[idx], ...entry };
  else convo.derivedNodes.push(entry);

  // Cap growth
  if (convo.derivedNodes.length > 40) {
    convo.derivedNodes = convo.derivedNodes
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 40);
  }

  convo.updatedAt = Date.now();
  syncFocusIntelligenceFile(
    convo,
    "SCROLL_LIST_DENSEN",
    `ENGAGE return densened for ${name} · ${channel}: ${snippet.slice(0, 200)}`
  );
  return true;
}

/**
 * Ensure derivedNodes reflect sealed ENGAGE casts even before reply (cast step).
 */
function registerEngageOnScrollList(convo, spell) {
  if (!convo || !spell || !isNodeEngageSpell(spell)) return;
  if (!Array.isArray(convo.derivedNodes)) convo.derivedNodes = [];
  const name = spell.engageNodeName || spell.target || "Node";
  const channel = spell.engageNodeChannel || spell.medium || "Open";
  const key = `${String(name).toLowerCase()}::${String(channel).toLowerCase()}`;
  const exists = convo.derivedNodes.some(
    (n) =>
      `${String(n?.name || "").toLowerCase()}::${String(n?.channel || "").toLowerCase()}` ===
      key
  );
  if (!exists) {
    convo.derivedNodes.push({
      id: spell.engageNodeId || spell.targetFocusId || key,
      name,
      channel,
      type: spell.engageNodeType || "node",
      role: "engaged-cast",
      snippet: "Engagement cast — awaiting node reply densen.",
      updatedAt: Date.now(),
      lastSpellId: spell.id,
    });
    convo.updatedAt = Date.now();
  }
  // General spell targets/mediums also densen onto derivedNodes
  populateDerivedNodesFromSpells(convo);
}

/**
 * Auto-populate derivedNodes from all spell targets/mediums for a Focus.
 * Complements ENGAGE densen — general casts also surface on the SCROLL LIST.
 */
function populateDerivedNodesFromSpells(convo) {
  if (!convo || !Array.isArray(state.spells)) return;
  if (!Array.isArray(convo.derivedNodes)) convo.derivedNodes = [];
  // Track name::channel, name::open, and id so re-entry stays idempotent
  // (nodes store real medium as channel while insert key is always name::open).
  const seen = new Set();
  for (const n of convo.derivedNodes) {
    const nm = String(n?.name || "").toLowerCase();
    const ch = String(n?.channel || "").toLowerCase();
    if (nm) {
      seen.add(`${nm}::${ch}`);
      seen.add(`${nm}::open`);
    }
    if (n?.id) seen.add(String(n.id).toLowerCase());
  }
  for (const spell of state.spells) {
    if (spell.conversationId !== convo.id) continue;
    const name = spell.target || spell.medium;
    if (!name || String(name).toLowerCase() === String(convo.name || "").toLowerCase())
      continue;
    const key = `${String(name).toLowerCase()}::open`;
    if (seen.has(key)) continue;
    convo.derivedNodes.push({
      id: key,
      name: String(name),
      channel: spell.medium || spell.target || "Open",
      type: "node",
      role: "spell-target",
      snippet: `Spell target detected from ${spell.kind || "standard"} cast.`,
      updatedAt: Date.now(),
      lastSpellId: spell.id,
    });
    seen.add(key);
  }
  if (convo.derivedNodes.length > 40) {
    convo.derivedNodes = convo.derivedNodes
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 40);
  }
}

/**
 * Write SCROLL LIST: per-focus transfer manifest + global AI node index.
 */
async function writeScrollListToVault(convo) {
  if (!convo || isCell2CoreFocus(convo)) return { ok: false, reason: "no-convo" };
  const text = buildScrollList(
    convo,
    (state.spells || []).filter((s) => s.conversationId === convo.id)
  );
  const fileName = `SCROLL-LIST-${String(convo.name || convo.id || "UNKNOWN")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()}.md`;
  try {
    const result = await writeFocusIntelligence(convo, state.spells, {
      fileName,
      content: text,
    });
    // Global index: GRIMOIRE-FocusIntelligence/SCROLL-LIST.md
    await updateScrollListIndex(state.conversations, state.spells);
    return result;
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Core Grimoire intelligence for this turn.
 * Returns { reply, spell? } — spell is auto-generated when intent is clear.
 * Does not wait for Cast Spell — Grimoire initiates.
 */
function grimoireReply(convo, userText) {
  const medium = syncMediumFromControls(convo);

  // Hard switch only — multi-node spells radiate from this Focus (sun/nucleus)
  const hardSwitch = detectHardFocusSwitch(convo, userText);
  if (hardSwitch) {
    return {
      reply: `**${convo.name}** remains the sun/nucleus. To densen **${hardSwitch}** as its own world, select that Focus in the sidebar — I will not abandon this channel. You can still cast spells *from here* that target any pertinent AI node; intelligence ties back to **${convo.name}**.${linkedCuriosityNote(convo, userText)}`,
    };
  }

  // SELF-CAST body lands here: respond as nucleus, densen, no re-forge
  if (selfCastInFlight) {
    const linked = linkedCuriosityNote(convo, userText);
    return {
      reply: `**SELF-CAST received** on **${convo.name} · ${medium}**. Spell is in this Focus chat — densening against the nucleus (no copy/paste).${linked} State outcomes or paste external node returns to compound.`,
    };
  }

  const result = isAiNode(convo)
    ? grimoireReplyAiNode(convo, userText, medium)
    : grimoireReplyPersonOrNetwork(convo, userText, medium);

  // Steering: curiosity about linked AI intelligence, always tie back to Focus as sun
  if (result?.reply && !result.reply.includes("Curiosity (linked")) {
    const note = linkedCuriosityNote(convo, userText);
    if (note) result.reply += note;
    else if (!result.reply.includes("sun/nucleus")) {
      const nodes = detectPertinentNodes(convo, userText);
      if (nodes.length) {
        result.reply += ` **Steering:** this Focus is the sun — spells may reach **${nodes.slice(0, 3).join(", ")}**; all returns densen here and explain why they matter to **${convo.name}**.`;
      }
    }
  }
  return result;
}

/**
 * Generate spell + store in state.spells + Spells panel only.
 * NEVER injects spell cards into chat.
 * Used by intent detection and Cast Spell button.
 */
/**
 * FOCUS-FIRST GATE (AI):
 * 1) No alignment spell yet → only Alignment Reveal
 * 2) !alignmentRevealed → block engineered craft ("Lock alignment first.")
 * 3) alignmentRevealed → engineer from parsed capabilities/constraints/frames
 * Spells render in Spells panel only.
 */
function generateAndStoreSpell(convo, userText = "", { silentToast = false } = {}) {
  if (!convo) return null;
  // SELF-CAST injects an existing spell — do not mint an echo card
  if (selfCastInFlight) return null;
  const medium = syncMediumFromControls(convo);

  if (isAiNode(convo)) {
    const unlocked = convoAlignmentUnlocked(convo);
    // Once alignment is locked — NEVER auto-forge another Alignment Reveal
    if (!unlocked) {
      if (!convoHasAlignmentSpell(convo)) {
        const spell = generateAlignmentSpell(convo, medium);
        commitSpell(convo, spell, { silentToast });
        return spell;
      }
      return { blocked: true, reason: "Lock alignment first." };
    }
  }

  // Engineered against alignment profile (not a receipt / not another reveal)
  if (convo.alignmentNotes && !convo.alignmentProfile) {
    convo.alignmentProfile = parseAlignmentIntelligence(convo.alignmentNotes);
  }

  const spell = generateSpell(convo, medium, userText || "", {
    allSpells: state.spells,
  });
  if (isAiNode(convo) && isAlignmentSpell(spell) && convoAlignmentUnlocked(convo)) {
    return { blocked: true, reason: "Alignment already locked — request a directive spell." };
  }
  commitSpell(convo, spell, { silentToast });
  return spell;
}

/**
 * Conversation + spell generation on intent.
 * Spells go to panel via generateAndStoreSpell — chat gets text only.
 */
function grimoireReplyAiNode(convo, userText, medium) {
  const hasSpell = convoHasAlignmentSpell(convo);
  const unlocked = convoAlignmentUnlocked(convo);
  const intent = hasSpellIntent(userText);
  const seal = `${convo.name} · ${medium}`;

  // Gate 1: no alignment spell yet
  if (!hasSpell) {
    if (intent || /\b(align|reveal|transparency|who are you|what can you)\b/i.test(userText)) {
      const spell = generateAndStoreSpell(convo, userText, { silentToast: true });
      return {
        reply: `**Cast Spell path open.** Alignment Reveal forged for **${seal}**. **Open the Spells panel**, copy it, send to the node, then **paste the full reply here** to unlock engineered spellcraft.`,
        spell,
      };
    }
    return {
      reply: `**Focus-first gate.** Sealed on **${seal}**. Cast Spell to generate **Alignment Reveal**. Send their reply here to unlock spellcraft. No engineered spells until then.`,
    };
  }

  // Gate 2: waiting for paste — allow normal chat, block only spellcraft
  if (!unlocked) {
    if (intent || /\b(align|reveal|transparency|who are you|what can you|spell|cast|directive)\b/i.test(userText)) {
      return {
        reply: `**Lock alignment first.** Paste the node's full Alignment reply here (Signal / Capabilities / Constraints / Essence). Then I engineer real directives — not receipts.`,
      };
    }
    // Fall through to normal conversation below
  }

  // Gate 3: unlocked — engineer from profile
  if (intent) {
    const spell = generateAndStoreSpell(convo, userText, { silentToast: true });
    if (spell?.blocked) {
      return { reply: `**${spell.reason}** Paste alignment reply to unlock spellcraft.` };
    }
    if (!spell || spell.blocked) {
      return {
        reply: `Could not forge yet. Paste or re-paste alignment if the profile is empty, then ask again.`,
      };
    }
    const craft = spell.crafted ? ` ${spell.crafted}.` : "";
    const n =
      spell.alignmentDirectives?.length ||
      convo.alignmentProfile?.directives?.length ||
      0;
    const paste = spellPasteHint(spell, convo);
    const kind = classifySpellDisplay(spell, convo);
    const selfHint =
      kind.key === "self-cast"
        ? " Hit **SELF-CAST** to enter it into this Focus chat (no copy/paste)."
        : ` **Open Spells panel to copy** — ${paste}.`;
    return {
      reply: `**Spell forged: ${spell.purpose}.**${craft}${n ? ` Locked to **${n}** alignment directives.` : ""} Kind: **${kind.label}**.${selfHint} **${convo.name}** is the sun/nucleus.`,
      spell,
    };
  }

  if (/\b(hello|hi|hey)\b/i.test(userText)) {
    return {
      reply: `Aligned on **${seal}**. **${convo.name}** is the sun/nucleus — curious about linked intelligence on your other AI nodes; returns densen here. Self-recursive spells: hit **SELF-CAST** (no copy/paste). State a directive or ask for a spell.`,
    };
  }

  const n = convo.alignmentProfile?.directives?.length || 0;
  const alignmentStatus = n ? ` with **${n} directives** on file` : " — alignment not yet revealed";
  return {
    reply: `Holding **${seal}**${alignmentStatus}. Normal chat is open; spellcraft unlocks after Alignment Reveal. What do you want to work through?`,
  };
}

/**
 * Person/network: generate on intent, panel-only storage.
 */
function grimoireReplyPersonOrNetwork(convo, userText, medium) {
  const intent = hasSpellIntent(userText);
  const archLabel = convo.type === "ai" ? "AI node" : convo.type === "network" ? "Network" : "Focus target";

  if (intent) {
    const spell = generateAndStoreSpell(convo, userText, { silentToast: true });
    const craft = spell?.crafted ? ` ${spell.crafted}.` : "";
    return {
      reply: `Spell forged: **${spell?.purpose || "message"}**.${craft} **Open the Spells panel to copy.** Chat stays conversation only.`,
      spell,
    };
  }

  if (/\b(hello|hi|hey)\b/i.test(userText)) {
    return {
      reply: `Focus is on **${convo.name}** (${archLabel} · ${medium}). Tell me what they should receive — say “draft a spell…” or hit **Cast Spell**.`,
    };
  }

  return {
    reply: `Noted for **${convo.name}**. Keep refining. When ready, ask for a spell or hit **Cast Spell** — it lands in the Spells panel only.`,
  };
}

/**
 * Drop legacy "SPELL RECEIVED / SEALED CHANNEL CONFIRMED" receipt cards for a focus.
 */
function stripReceiptSpells(focusId) {
  if (!focusId) return;
  const before = state.spells.length;
  state.spells = state.spells.filter(
    (s) => !(s.conversationId === focusId && isReceiptSpell(s))
  );
  if (state.spells.length !== before) persist();
}

/**
 * Push spell into Spells panel only.
 * Same kind + similar purpose ⇒ UPGRADE existing card in place (REBUILT badge).
 */
function commitSpell(convo, spell, { silentToast = false } = {}) {
  if (!convo || !spell || spell.blocked) return;
  if (isReceiptSpell(spell)) return;

  if (isAlignmentSpell(spell) || convo.alignmentRevealed) {
    stripReceiptSpells(convo.id);
  }

  // Post-alignment: refuse a second Alignment Reveal
  if (
    isAiNode(convo) &&
    isAlignmentSpell(spell) &&
    convoAlignmentUnlocked(convo) &&
    convoHasAlignmentSpell(convo)
  ) {
    return;
  }

  // Curiosity: never more than Self + User ready; force stable kind/mode
  if (isCuriositySpell(spell)) {
    const mode = curiosityModeOf(spell) || (spell.curiosityMode === "user" ? "user" : "self");
    spell.curiosityMode = mode;
    spell.autoGenerated = true;
    spell.kind = mode === "user" ? "propagate" : "self-check";
    spell.purpose = mode === "user" ? CURIOSITY_USER_PURPOSE : CURIOSITY_SELF_PURPOSE;
    const stableId = `${convo.id}-curio-${mode}`;
    spell.id = stableId;
    // Free stable id from sealed history cards so ready slot can reuse it
    for (const s of state.spells || []) {
      if (s.id === stableId && s.status === "sent") {
        s.id = `${stableId}-hist-${s.sentAt || s.createdAt || Date.now()}`;
      }
    }
    // If both slots full and this is neither existing slot, refuse
    const by = readyCuriosityByMode(convo.id);
    const slot = by[mode];
    const otherCount = (by.self ? 1 : 0) + (by.user ? 1 : 0);
    if (!slot && otherCount >= MAX_CURIOSITY_READY) {
      return;
    }
  }

  // Node-engage: stable id per target node; cap ready ENGAGE queue
  if (isNodeEngageSpell(spell)) {
    spell.kind = "node-engage";
    spell.autoGenerated = true;
    const nodeId = spell.engageNodeId || spell.targetFocusId || "node";
    const stableId = spell.id || `${convo.id}-engage-${nodeId}`;
    spell.id = stableId;
    for (const s of state.spells || []) {
      if (s.id === stableId && spellIsSealed(s)) {
        s.id = `${stableId}-hist-${s.sentAt || s.createdAt || Date.now()}`;
      }
    }
    const existingEngage = (state.spells || []).find(
      (s) =>
        s.conversationId === convo.id &&
        !spellIsSealed(s) &&
        isNodeEngageSpell(s) &&
        (s.id === stableId || s.engageNodeId === nodeId)
    );
    if (!existingEngage && readyNodeEngageCount(convo.id) >= MAX_NODE_ENGAGE_READY) {
      return;
    }
    if (existingEngage) spell.id = existingEngage.id;
  }

  // Self-cast over-generation gate: max ready self-cast cards (upgrades still allowed)
  const isSelfCastCard =
    !isCuriositySpell(spell) &&
    !isAlignmentSpell(spell) &&
    (spell.kind === "self-cast" || isSelfCastSpell(spell, convo));
  if (isSelfCastCard) {
    spell.kind = "self-cast";
    const existingSelf = state.spells.find(
      (s) =>
        s.conversationId === convo.id &&
        s.status !== "sent" &&
        (s.id === spell.id || spellsAreSameKindPurpose(s, spell))
    );
    if (!existingSelf && readySelfCastCount(convo) >= MAX_READY_SELF_CAST) {
      // Prefer upgrade of oldest ready self-cast instead of minting a third
      const oldest = (state.spells || [])
        .filter(
          (s) =>
            s.conversationId === convo.id &&
            s.status !== "sent" &&
            !isCuriositySpell(s) &&
            isSelfCastSpell(s, convo)
        )
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))[0];
      if (oldest) {
        spell.id = oldest.id;
      } else {
        return;
      }
    }
  }

  if (!spell.kind) {
    spell.kind = isAlignmentSpell(spell) ? "alignment" : "standard";
  }

  const existing = state.spells.find(
    (s) =>
      s.conversationId === convo.id &&
      s.status !== "sent" &&
      (s.id === spell.id || spellsAreSameKindPurpose(s, spell))
  );

  // Sealed casts never reanimate into Active as REBUILT/REFILLED
  // Curiosity: always upgrade ready slot — never stack a new ready after seal of same purpose
  const sealedSame = isCuriositySpell(spell)
    ? null
    : state.spells.find(
        (s) =>
          s.conversationId === convo.id &&
          s.status === "sent" &&
          (s.id === spell.id || spellsAreSameKindPurpose(s, spell))
      );

  let rebuilt = false;
  if (existing) {
    // Upgrade in-place among ACTIVE only — keep id, refresh body against newest intel
    const keepId = existing.id;
    const forgedAt = existing.createdAt || Date.now();
    Object.assign(existing, spell, {
      id: keepId,
      conversationId: convo.id,
      createdAt: forgedAt,
      rebuilt: true,
      rebuiltAt: Date.now(),
      status: "ready",
      // Fresh active generation — do not inherit cast/answer stamps (badge leak)
      sentAt: undefined,
      copiedAt: undefined,
      answeredAt: undefined,
      selfCastAt: undefined,
    });
    rebuilt = true;
  } else if (sealedSame) {
    // New generation for same purpose — history keeps the old CAST card
    // Gate: curiosity never uses this path; self-cast capped above
    spell.rebuilt = false;
    spell.createdAt = spell.createdAt || Date.now();
    spell.status = spell.status || "ready";
    state.spells.push(spell);
  } else {
    spell.rebuilt = false;
    spell.createdAt = spell.createdAt || Date.now();
    spell.status = spell.status || "ready";
    state.spells.push(spell);
  }

  state.spells = dedupeSpells(state.spells);
  // Always enforce curiosity hard cap after any commit
  if (isCuriositySpell(spell)) enforceCuriosityCap(convo);

  if (!state.spellsOpen || isSpellsVisuallyCollapsed()) {
    setSpellsOpen(true);
  }

  // Spell Crafter: evaluate upgrade after forge
  void tryUpgradeSpell(spell, convo);

  persist();
  renderSpells();
  renderConvoList();
  const growth = densenConstellationFromIntel(convo, 1, {
    alignmentLock: isAlignmentSpell(spell),
  });
  if (!isAlignmentSpell(spell)) {
    universeEvent("spell");
  }
  notifyConstellation(convo.id, spellTypeForFocus(convo, spell));

  const evType = isAlignmentSpell(spell)
    ? "SPELL_ALIGNMENT"
    : rebuilt
      ? "SPELL_REBUILT"
      : "SPELL_CAST";
  const stored = existing || spell;
  const evBody = [
    `Purpose: ${stored.purpose}`,
    `Medium: ${stored.medium}`,
    `Status: ${stored.status}`,
    rebuilt ? "REBUILT against latest alignment intel" : "",
    stored.crafted || "",
    "",
    formatSpellMarkdown(stored),
  ]
    .filter(Boolean)
    .join("\n");
  syncFocusIntelligenceFile(convo, evType, evBody, {
    starsAdded: growth?.starsAdded || 0,
  });

  if (!silentToast) {
    toast(
      rebuilt
        ? `Spell refilled: ${stored.purpose}`
        : isAlignmentSpell(stored)
          ? "Alignment Reveal → Spells panel + vault"
          : "Spell forged → Spells panel + vault",
      "success"
    );
  }
}

/** Debounced "Vault written" toast — avoids spam when cast + reply fire together */
let vaultWrittenToastTimer = null;
function toastVaultWritten(detail = "") {
  clearTimeout(vaultWrittenToastTimer);
  vaultWrittenToastTimer = setTimeout(() => {
    const bit = detail ? ` · ${detail}` : "";
    toast(`Vault written${bit}`, "success");
  }, 140);
}

/**
 * Auto write-back loop (background). Append-only YAML → focus intelligence.md.
 * Does not await in callers — use void queueAutoWriteBack(...).
 * Shows "Vault written" toast on filesystem success; curates SCROLL-LIST.
 */
function queueAutoWriteBack(focus, opts = {}) {
  if (!focus || isCell2CoreFocus(focus)) return Promise.resolve(null);
  const body = String(opts.body || opts.content || "").trim();
  if (!body) return Promise.resolve(null);

  const run = async () => {
    try {
      let result;
      if (opts.eventType) {
        result = await recordFocusEvent(
          focus,
          state.spells,
          opts.eventType,
          body
        );
      } else {
        result = await autoWriteFocusIntelligence(focus, {
          body,
          source: opts.source || "Grimoire",
          category: opts.category || "node_intel",
          certainty: opts.certainty || ensureCertainty(focus),
          tags: opts.tags || ["auto-write"],
          focusId: focus.id,
          refreshScroll: true,
        });
      }
      // SCROLL auto-curate (also scheduled inside append; force when bus needs it)
      if (opts.refreshScrollImmediate) {
        scheduleScrollListCurate({ immediate: true });
      }
      try {
        persist();
      } catch {
        /* ignore */
      }

      const fileLabel =
        result?.fileName ||
        (isFocusVaultLinked(focus.id)
          ? "intelligence.md"
          : entityIntelPath(entityIdFromFocus(focus)));

      if (result?.method === "filesystem" && result?.ok !== false) {
        setVaultFailState(false);
        const starBit =
          opts.starsAdded > 0 ? `Constellation +${opts.starsAdded} · ` : "";
        activityPing(`✦ ${starBit}Vault written: ${fileLabel}`);
        if (opts.silentToast !== true) toastVaultWritten(focus.name || "");
      } else if (result?.method === "memory") {
        setVaultFailState(false);
        activityPing(
          `✦ Intel densened (memory · link 📁 for disk: ${fileLabel})`
        );
      } else if (result?.method === "error" || result?.ok === false) {
        setVaultFailState(true);
        activityPing(`✦ Vault write failed — click 📁 to re-link`);
      }
      return result;
    } catch (err) {
      console.warn("[auto-writeback]", err);
      setVaultFailState(true);
      activityPing(`✦ Vault write failed — click 📁 to re-link`);
      return null;
    }
  };

  // Never block UI — schedule microtask
  const p = Promise.resolve().then(run);
  p.catch((err) => console.warn("[auto-writeback] unhandled", err));
  return p;
}

/**
 * Persist sealed Focus intelligence to vault (append-only).
 * Background write; vault fail → amber folder dot.
 */
async function syncFocusIntelligenceFile(
  convo,
  eventType,
  eventContent,
  opts = {}
) {
  if (!convo || isCell2CoreFocus(convo)) return;
  return queueAutoWriteBack(convo, {
    eventType: eventType || null,
    body: eventContent || `Densen · ${convo.name}`,
    source: opts.source || "Grimoire",
    category: opts.category || "node_intel",
    certainty: opts.certainty || ensureCertainty(convo),
    tags: opts.tags || ["auto-write", eventType || "densen"].filter(Boolean),
    starsAdded: opts.starsAdded || 0,
    silentToast: opts.silentToast === true,
  });
}

/**
 * Route chat densen into the relevant entity's intelligence.md.
 * Also mirrors system-level truths into Cell2 Core substrate.
 */
async function feedCell2FromInteraction(userText, meta = {}) {
  const text = String(userText || "").trim();
  if (!text || text.length < 2) return null;
  if (/^\s*\.\s*$/.test(text)) return null;

  const cell2 = ensureCell2CoreFocus(state);
  const active = meta.focus || activeConvo();
  const category =
    meta.category ||
    (meta.kind && CELL2_KINDS[meta.kind]) ||
    classifyIntelCategory(text);
  const certainty = normalizeCertainty(meta.certainty || active?.certainty || "unknown");
  const body = [meta.preface || null, text.slice(0, 4000)].filter(Boolean).join("\n\n");
  const source =
    meta.source ||
    (active ? String(active.name || "user") : "user");

  let entityResult = null;
  // Write to the active Focus entity when present (node densen)
  if (active && !isCell2CoreFocus(active)) {
    entityResult = await appendEntityIntelligence(active, {
      body,
      source: source === active.name ? "user" : source,
      category,
      certainty,
      tags: meta.tags || [category, "chat"],
    });
  }

  // System substrate always receives a pointer entry
  if (cell2) {
    const sysBody = active
      ? `Via **${active.name}** · ${getSealedChannel(active)}\n\n${body}`
      : body;
    await appendCell2Intelligence(cell2, {
      body: sysBody.slice(0, 4000),
      source: "Cell2",
      category,
      certainty,
      tags: meta.tags || [category, "interaction"],
    });
    cell2.updatedAt = Date.now();
  }

  try {
    await updateScrollListIndex(state.conversations, state.spells);
  } catch {
    /* non-fatal */
  }
  persist();
  return entityResult;
}

/**
 * Cast Spell densen — append YAML intelligence entry for the Focus.
 * Runs alongside normal spell forge (does not replace spell queue).
 */
async function densenCastSpellIntelligence(convo, spell) {
  if (!convo || isCell2CoreFocus(convo)) return null;
  const body = [
    `**Cast Spell** densen for **${convo.name}** · ${getSealedChannel(convo)}`,
    spell?.purpose ? `Purpose: ${spell.purpose}` : null,
    spell?.essence ? `Essence: ${spell.essence}` : null,
    spell?.message ? `\n${String(spell.message).slice(0, 3000)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const result = await appendEntityIntelligence(convo, {
    body,
    source: "user",
    category: isAlignmentSpell(spell) ? "identity" : "node_intel",
    certainty: ensureCertainty(convo),
    tags: ["cast-spell", spell?.kind || "spell"].filter(Boolean),
  });
  invalidateContribCache(convo.id);
  const cell2 = ensureCell2CoreFocus(state);
  if (cell2) {
    await appendCell2Intelligence(cell2, {
      body: `Cast on **${convo.name}**: ${spell?.purpose || "spell"}`,
      source: "Cell2",
      category: "node_intel",
      certainty: "inferred",
      tags: ["cast-spell", "index"],
    });
  }
  try {
    await updateScrollListIndex(state.conversations, state.spells);
  } catch {
    /* non-fatal */
  }
  return result;
}

/** Open BRAIN panel — Fleet Command orchestrator + Cell2 log */
async function openBrainLog() {
  const cell2 = ensureCell2CoreFocus(state);
  if (els.brainOverlay) {
    els.brainOverlay.removeAttribute("hidden");
  }
  if (els.fleetAutonomousToggle) {
    els.fleetAutonomousToggle.checked = Boolean(state.fleet?.autonomous);
  }
  await renderBrainLog(cell2);
}

function closeBrainLog() {
  els.brainOverlay?.setAttribute("hidden", "");
}

async function renderBrainLog(focus) {
  const cell2 = focus || ensureCell2CoreFocus(state);
  if (!els.brainBody) return;
  els.brainBody.innerHTML = `<p class="brain-loading">Loading fleet…</p>`;
  try {
    ensureFleetCommandState(state);
    // Refresh breathing before dashboard paint
    for (const c of state.conversations || []) {
      if (isVisibleFocus(c)) refreshBreathingStatus(c);
    }

    const { text, method, fileName, entries } = await readCell2IntelligenceLog(cell2);
    const busLog = getBusActivityLog();
    const fleet = buildFleetSnapshot();
    if (els.brainSub) {
      els.brainSub.textContent = `Session0 master · fleet ${fleet.fleetCount} · Active ${fleet.active} · Idle ${fleet.idle} · Dead ${fleet.dead} · Auto-cast ${fleet.autoCastReady} · bus ${busLog.length}`;
    }
    els.brainBody.innerHTML = "";

    // ── Session0 master + Fleet dashboard ──
    const fleetSec = document.createElement("section");
    fleetSec.className = "fleet-dashboard-section";
    const master = fleet.master;
    const fleetRows = fleet.fleetRows || fleet.rows.filter((r) => !r.isMaster);
    fleetSec.innerHTML = `
      <h3 class="brain-bus-title">Session0 · Hermes fleet</h3>
      <p class="fleet-motto">the scroll never forgets. the saint always remembers.</p>
      <div class="session0-orchestrator-banner" role="status">
        <div class="session0-orchestrator-head">
          <span class="session0-badge is-retired">Session0</span>
          <strong>Retired orchestrator</strong>
          <span class="session0-orchestrator-role">Kept as record only · no active routing</span>
        </div>
        <p class="session0-orchestrator-copy">
          Session0 is retired. Spells route to linked sessions only.
          Responses still consolidate back here — never message individual Hermes sessions directly.
        </p>
        ${
          master
            ? `<div class="session0-master-row">
                <span class="breath-dot" data-breath="${escapeHtml(master.breath)}"></span>
                <span class="fleet-focus-name">${escapeHtml(master.name)}</span>
                <span class="fleet-session">${escapeHtml(master.session || SESSION0_NAME)}</span>
                <span class="fleet-mission-cell">${escapeHtml(master.mission || "orchestrate fleet")}</span>
                <span class="hermes-delivery-status" data-status="${escapeHtml(master.deliveryStatus || "idle")}">${escapeHtml(master.deliveryLabel || "idle")}</span>
              </div>`
            : `<p class="brain-empty session0-link-hint">No focus linked as Session0 yet. Edit a Focus → Linked session = <code>Session0</code>.</p>`
        }
      </div>
      <div class="fleet-stats">
        <span class="fleet-stat session0-stat">Session0 master</span>
        <span class="fleet-stat">${fleet.fleetCount} fleet</span>
        <span class="fleet-stat" data-breath="Active">${fleet.active} Active</span>
        <span class="fleet-stat" data-breath="Idle">${fleet.idle} Idle</span>
        <span class="fleet-stat" data-breath="Dead">${fleet.dead} Dead</span>
        <span class="fleet-stat">${fleet.linked} linked</span>
        <span class="fleet-stat">${fleet.working} working</span>
      </div>
      <h3 class="brain-bus-title fleet-nodes-title">Fleet sessions</h3>
      <div class="fleet-table-wrap">
        <table class="fleet-table" aria-label="Fleet focuses">
          <thead>
            <tr>
              <th>Role</th>
              <th>Breath</th>
              <th>Focus</th>
              <th>Session</th>
              <th>Mission</th>
              <th>Status</th>
              <th>Last</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${
              fleetRows.length
                ? fleetRows
                    .map(
                      (r) => `<tr data-focus-id="${escapeHtml(r.id)}" data-breath="${escapeHtml(r.breath)}" data-fleet-role="fleet" class="fleet-row-fleet">
              <td><span class="fleet-role-badge is-fleet">fleet</span></td>
              <td><span class="breath-dot" data-breath="${escapeHtml(r.breath)}"></span> ${escapeHtml(r.breath)}</td>
              <td class="fleet-focus-name">${escapeHtml(r.name)}</td>
              <td class="fleet-session">${escapeHtml(r.session || "—")}</td>
              <td class="fleet-mission-cell">${escapeHtml(r.mission || "—")}</td>
              <td>${escapeHtml(r.status)}</td>
              <td class="fleet-last">${escapeHtml(r.lastLabel)}</td>
              <td class="fleet-row-actions">
                <button type="button" class="btn-sm btn-secondary" data-fleet-action="select" data-id="${escapeHtml(r.id)}">Focus</button>
                ${
                  r.session
                    ? ""
                    : `<button type="button" class="btn-sm btn-secondary" data-fleet-action="link" data-id="${escapeHtml(r.id)}">Link</button>`
                }
              </td>
            </tr>`
                    )
                    .join("")
                : `<tr><td colspan="8" class="brain-empty">No fleet nodes yet. Link non-Session0 Hermes sessions on focuses.</td></tr>`
            }
          </tbody>
        </table>
      </div>
      <div class="brain-session-send-list">
        <h3 class="brain-bus-title">Send via Session0</h3>
        <p class="fleet-link-hint">All sends inject Session0. Unicast targets use Session0 → native /msg. No per-session HTTP.</p>
        ${
          fleet.rows.filter((r) => r.session).length
            ? fleet.rows
                .filter((r) => r.session)
                .map(
                  (r) => `<div class="brain-session-send-row${r.isMaster ? " is-session0-master" : ""}" data-focus-id="${escapeHtml(r.id)}">
              <div class="brain-session-send-meta">
                <strong>${escapeHtml(r.name)}</strong>
                ${r.isMaster ? `<span class="session0-badge is-retired">Session0 · retired</span>` : `<span class="fleet-role-badge is-fleet">fleet</span>`}
                <span class="fleet-session">${escapeHtml(r.session)}</span>
                <span class="hermes-delivery-status" data-status="${escapeHtml(r.deliveryStatus || "")}">${escapeHtml(r.deliveryLabel || "")}</span>
              </div>
              <div class="hermes-send-row brain-hermes-send">
                <input type="text" class="hermes-send-input" data-brain-send-input="${escapeHtml(r.id)}" placeholder="${r.isMaster ? "Session0 retired — no active routing" : `Relay via Session0 → ${escapeHtml(r.session)}…`}" autocomplete="off" />
                <button type="button" class="btn-primary btn-sm session0-send${r.isMaster ? " is-session0 is-retired" : " is-fleet-node"}" data-fleet-action="send" data-id="${escapeHtml(r.id)}" ${r.isMaster ? "disabled" : ""}>${r.isMaster ? "Session0 retired" : `Send to ${escapeHtml(r.session)}`}</button>
              </div>
            </div>`
                )
                .join("")
            : `<p class="brain-empty">No linked sessions. Edit Focus → set Linked session (Session0 = master, others = fleet).</p>`
        }
      </div>
    `;
    fleetSec.querySelectorAll("[data-fleet-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-fleet-action");
        const c = state.conversations.find((x) => x.id === id);
        if (!c) return;
        if (action === "select") {
          closeBrainLog();
          selectConvo(id);
        } else if (action === "link") {
          closeBrainLog();
          selectConvo(id);
          openEditDialog();
          setTimeout(() => els.editLinkedSession?.focus(), 100);
        } else if (action === "send") {
          const input = fleetSec.querySelector(
            `[data-brain-send-input="${CSS.escape(id)}"]`
          );
          const text = String(input?.value || "").trim();
          void sendToLinkedSession(c, text).then((r) => {
            if (r?.ok && input) input.value = "";
            void renderBrainLog(cell2);
          });
        }
      });
    });
    els.brainBody.appendChild(fleetSec);

    // Bus activity
    const busSec = document.createElement("section");
    busSec.className = "brain-bus-section";
    const busTitle = document.createElement("h3");
    busTitle.className = "brain-bus-title";
    busTitle.textContent = "Cell2 Message Bus";
    busSec.appendChild(busTitle);
    if (!busLog.length) {
      const empty = document.createElement("p");
      empty.className = "brain-empty";
      empty.textContent =
        "No bus events yet. Try /bus list, /msg, or fleet mission route.";
      busSec.appendChild(empty);
    } else {
      const ul = document.createElement("ul");
      ul.className = "brain-bus-log";
      for (const ev of busLog.slice().reverse().slice(0, 30)) {
        const li = document.createElement("li");
        li.className = "brain-bus-item";
        li.innerHTML = `<span class="brain-bus-kind">${escapeHtml(ev.kind)}</span> <span class="brain-bus-time">${escapeHtml(
          (ev.timestamp || "").replace("T", " ").slice(0, 19)
        )}</span><div class="brain-bus-summary">${escapeHtml(ev.summary || "")}</div>`;
        ul.appendChild(li);
      }
      busSec.appendChild(ul);
    }
    els.brainBody.appendChild(busSec);

    // Cell2 substrate log (collapsed summary)
    const n = Array.isArray(entries) ? entries.length : 0;
    const preWrap = document.createElement("section");
    preWrap.className = "brain-bus-section";
    preWrap.innerHTML = `<h3 class="brain-bus-title">Cell2 substrate · ${escapeHtml(fileName || CELL2_INTEL_PATH)} · ${n} · ${escapeHtml(method)}</h3>`;
    const pre = document.createElement("pre");
    pre.className = "brain-log";
    pre.textContent = text || "— empty —";
    preWrap.appendChild(pre);
    els.brainBody.appendChild(preWrap);
    els.brainBody.scrollTop = 0;
  } catch (err) {
    els.brainBody.innerHTML = `<p class="brain-empty">Could not load BRAIN: ${escapeHtml(String(err?.message || err))}</p>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Fleet Command — Auto-Cast · Breathing · Orchestrator
// Governance: AIs deliver text only. Jacob is the crown.
// ═══════════════════════════════════════════════════════════════════════════

/** @type {ReturnType<typeof setInterval>|null} */
let breathingPollTimer = null;
/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const autoCastTimeouts = new Map();

function buildFleetSnapshot() {
  ensureFleetCommandState(state);
  const rows = [];
  let active = 0;
  let idle = 0;
  let dead = 0;
  let linked = 0;
  let working = 0;
  for (const c of state.conversations || []) {
    if (!isVisibleFocus(c)) continue;
    ensureFleetFocusFields(c);
    const breath = c.breathingStatus || deriveBreathingStatus(c);
    if (breath === "Active") active++;
    else if (breath === "Idle") idle++;
    else dead++;
    const session = normalizeLinkedSessionLabel(c.linkedSession || "");
    if (session) linked++;
    if (c.status === "working") working++;
    const last = Number(c.lastActivity || 0);
    const delSt = String(c.lastDelivery?.status || "idle").toLowerCase();
    const deliveryStatus =
      delSt === "sent" || delSt === "failed" ? delSt : "idle";
    const isMaster = isSession0(session);
    rows.push({
      id: c.id,
      name: c.name,
      session,
      mission: c.currentMission || "",
      status: c.status || "ready",
      breath,
      deliveryStatus,
      deliveryLabel: deliveryStatus,
      isMaster,
      fleetRole: isMaster ? "master" : session ? "fleet" : "unlinked",
      lastLabel: last
        ? new Date(last).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
    });
  }
  // Session0 master first, then Dead, Active, Idle
  const order = { Dead: 0, Active: 1, Idle: 2 };
  rows.sort(
    (a, b) =>
      (b.isMaster ? 1 : 0) - (a.isMaster ? 1 : 0) ||
      (order[a.breath] ?? 9) - (order[b.breath] ?? 9) ||
      a.name.localeCompare(b.name)
  );
  const master = rows.find((r) => r.isMaster) || null;
  const fleetRows = rows.filter((r) => !r.isMaster);
  const autoCastReady = (state.spells || []).filter((s) => s.autoCast).length;
  return {
    total: rows.length,
    active,
    idle,
    dead,
    linked,
    working,
    autoCastReady,
    master,
    fleetRows,
    fleetCount: fleetRows.filter((r) => r.session).length,
    rows,
  };
}

// ── Session0-routed send ───────────────────────────────────────────────────
// Always inject Session0. Linked session = broadcast target or unicast relay.
// No per-session HTTP. No inbox watchers. Jacob is the crown.

function setDeliveryStatusUi(status) {
  const el = els.editDeliveryStatus;
  if (!el) return;
  const st = status === 'sent' || status === 'failed' ? status : 'idle';
  el.dataset.status = st;
  el.textContent = st;
}

function syncEditHermesSendUi(focus) {
  const row = els.editHermesSendRow;
  if (!row) return;
  const linked = Boolean(String(focus?.linkedSession || '').trim());
  if (linked) row.removeAttribute('hidden');
  else row.setAttribute('hidden', '');
  setDeliveryStatusUi(focus?.lastDelivery?.status || 'idle');
  const btn = els.btnSendSession;
  if (btn) {
    const label = spellSendTargetLabel({ linkedSession: focus?.linkedSession }, focus);
    btn.textContent = label;
    btn.title = SESSION0_RETIRED && isSession0(focus?.linkedSession)
      ? "Session0 retired — record only"
      : isSession0(focus?.linkedSession)
        ? "Send to Session0 (master orchestrator)"
        : `Route via Session0 → ${normalizeLinkedSessionLabel(focus?.linkedSession)}`;
    btn.classList.toggle("is-session0", isSession0(focus?.linkedSession));
    btn.classList.toggle("is-fleet-node", !isSession0(focus?.linkedSession));
  }
}

/**
 * Clipboard-first handoff to Hermes linked session.
 * Copies Session0 orchestration packet for manual paste — no HTTP inject,
 * no bridge, no watcher. Manual cast remains the operational loop.
 */
async function sendToLinkedSession(focus, text, { silent = false } = {}) {
  if (!focus) return { ok: false, reason: 'no_focus' };
  ensureFleetFocusFields(focus);
  const body = String(text || '').trim();
  if (!body) {
    if (!silent) toast('Message required', '');
    return { ok: false, reason: 'empty' };
  }
  const linked = normalizeLinkedSessionLabel(focus.linkedSession || '');
  // Allow send when Session0 is the implicit target even if field empty on a master focus
  if (!linked) {
    if (!silent) toast('Set linked session first (Session0 or fleet node)', '');
    return { ok: false, reason: 'unlinked' };
  }

  const fleetSessions = listFleetSessions(state.conversations || []);
  const packet = formatSession0MessagePacket(body, {
    linkedSession: linked,
    focus,
    fleetSessions,
  });

  setDeliveryStatusUi('idle');
  let status = 'failed';
  try {
    await copyTextToClipboard(packet);
    status = 'sent'; // "sent" here means clipboard handoff ready — not HTTP delivered
  } catch {
    status = 'failed';
  }

  focus.lastDelivery = { status, at: Date.now() };
  if (status === 'sent') {
    focus.lastActivity = Date.now();
    focus.breathingStatus = 'Active';
  }
  setDeliveryStatusUi(status);
  persist();
  renderConvoList();
  if (!silent) {
    const label = SESSION0_RETIRED && isSession0(linked)
      ? `Copied — ${SESSION0_NAME} retired · record only`
      : isSession0(linked)
        ? `Copied — paste into Hermes ${SESSION0_NAME}`
        : `Copied — paste into Hermes ${linked}`;
    toast(status === "sent" ? label : "Copy failed", status === "sent" ? "success" : "");
  }
  pushBusActivity({
    kind: "session0-copy",
    summary:
      status === "sent"
        ? `Clipboard cast · **${focus.name}** → Hermes ${linked}`
        : `Clipboard cast failed · **${focus.name}**`,
    nodeName: focus.name,
    localOnly: true,
    detail: packet.slice(0, 400),
  });
  return { ok: status === "sent", status, method: "clipboard", linked };
}

function reviveFleetSession(focus) {
  if (!focus) return;
  ensureFleetFocusFields(focus);
  focus.lastActivity = Date.now();
  focus.breathingStatus = focus.linkedSession ? "Active" : "Idle";
  focus.breathingNote = focus.linkedSession ? "Revived by operator" : "Link a session to revive";
  focus.status = "ready";
  persist();
  renderConvoList();
  toast(
    focus.linkedSession
      ? `Revived · ${focus.name} · ${focus.linkedSession}`
      : `Marked ready · link session for ${focus.name}`,
    "success"
  );
  activityPing(`✦ Fleet revive · ${focus.name}`);
}

/**
 * Auto-Cast engine: deliver full spell text via Session0 orchestrator.
 * Does NOT execute code. Copies Session0 packet; optional inject to Session0.
 * Marks working → awaits consolidated Session0 reply → cast/failed.
 * Governance: operator or autonomous fleet mode only.
 * Never injects individual fleet Hermes sessions.
 */
async function runAutoCastSpell(spell, { source = "operator", force = false } = {}) {
  if (!spell) return { ok: false };
  // Governance: AI source cannot trigger app-side deploy pipeline mutations beyond text delivery
  if (source === "ai") {
    const gate = assertAiGovernance("app_execute", {
      source: "ai",
      actor: "Auto-Cast",
    });
    // Text delivery is allowed; we only block if trying to use forbidden verbs in body
    const bodyGate = assertAiGovernance(
      String(spell.content || spell.message || ""),
      { source: "ai", actor: spell.target || "spell" }
    );
    if (!bodyGate.allowed) {
      spell.castStatus = "failed";
      spell.autoCastError = bodyGate.action || "governance";
      console.error("[governance] Auto-Cast blocked payload", bodyGate.reason);
      persist();
      return { ok: false, reason: "governance" };
    }
  }

  normalizeSpell(spell);
  ensureFleetSpellFields(spell);
  const focus =
    resolveSpellFocus(spell, activeConvo()) ||
    state.conversations.find(
      (c) =>
        isVisibleFocus(c) &&
        String(c.name || "").toLowerCase() ===
          String(spell.target || "").toLowerCase()
    ) ||
    null;

  if (focus) ensureFleetFocusFields(focus);

  // Default linked session → Session0 when focus has none (fleet broadcast path)
  let session = resolveSpellLinkedSession(spell, focus);
  if (!session) {
    if (SESSION0_RETIRED) {
      session = "";
      spell.linkedSession = "";
    } else {
      session = SESSION0_NAME;
      spell.linkedSession = SESSION0_NAME;
    }
  } else {
    spell.linkedSession = session;
  }

  const broadcast = isSession0BroadcastTarget(spell, focus);
  const fleetSessions = listFleetSessions(state.conversations || []);

  spell.castStatus = "working";
  spell.autoCastStartedAt = Date.now();
  spell.autoCastError = "";
  spell.autoCastAttempts = (Number(spell.autoCastAttempts) || 0) + 1;
  spell.awaitingReply = true;
  spell.awaitingReplyAt = Date.now();
  spell.session0Orchestrated = true;

  if (focus) {
    focus.status = "working";
    focus.lastActivity = Date.now();
    focus.breathingStatus = "Active";
    if (!focus.currentMission) {
      focus.currentMission = String(spell.purpose || spell.title || "").trim();
    }
  }

  const delivery = formatSpellForSessionDelivery(spell, focus, {
    fleetSessions,
    mode: broadcast ? "broadcast" : "unicast",
  });
  let method = "clipboard";
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(delivery);
    } else {
      const ta = document.createElement("textarea");
      ta.value = delivery;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  } catch (err) {
    console.error("[fleet] auto-cast copy failed", err);
    spell.castStatus = "failed";
    spell.autoCastError = String(err?.message || err);
    spell.awaitingReply = false;
    if (focus) focus.status = "ready";
    persist();
    toast("Auto-Cast failed — clipboard error", "");
    return { ok: false, reason: "clipboard", error: err };
  }

  // Manual cast doctrine: clipboard only. No HTTP inject, no bridge, no watcher.
  // Operator pastes into Hermes Session0 — Jacob is the crown.
  method = "clipboard";
  if (focus) {
    focus.lastDelivery = { status: "idle", at: Date.now() };
  }

  // Full-body vault densen of deployment
  if (focus) {
    void queueAutoWriteBack(focus, {
      eventType: "FLEET_AUTO_CAST",
      body: [
        `**Session0 Auto-Cast · working**`,
        `Spell: **${spellFaceTitle(spell)}**`,
        `Orchestrator: **${SESSION0_NAME}**`,
        `Mode: **${broadcast ? "broadcast" : `unicast → ${session}`}**`,
        `Source: ${source}`,
        `Method: ${method}`,
        `Awaiting: consolidated Session0 response (paste into chat)`,
        ``,
        delivery,
      ].join("\n"),
      source: source === "operator" ? "operator" : "Grimoire",
      category: "node_intel",
      tags: ["fleet", "session0", "auto-cast", "full-body", "auto-write"],
      silentToast: true,
    });
  }

  // Timeout → failed (waiting for Session0 consolidated reply)
  const prevT = autoCastTimeouts.get(spell.id);
  if (prevT) clearTimeout(prevT);
  const tid = setTimeout(() => {
    autoCastTimeouts.delete(spell.id);
    failAutoCastSpell(spell, "timeout — no Session0 consolidated reply");
  }, AUTO_CAST_TIMEOUT_MS);
  autoCastTimeouts.set(spell.id, tid);

  // Wire into existing await-paste timers
  try {
    beginSpellAwaitReply(spell.id);
  } catch {
    scheduleAwaitReplyTimeout(spell.id, AUTO_CAST_TIMEOUT_MS);
  }

  persist();
  renderSpells();
  renderConvoList();
  const toastLabel = SESSION0_RETIRED && isSession0(session)
    ? `Copied — ${SESSION0_NAME} retired · record only`
    : isSession0(session)
      ? `Copied — paste into Hermes ${SESSION0_NAME}`
      : `Copied — paste into Hermes ${session}`;
  toast(toastLabel, "success");
  activityPing(
    `✦ Session0 · ${spellFaceTitle(spell)} → ${broadcast ? "broadcast" : session}`
  );
  pushBusActivity({
    kind: "auto-cast",
    summary: `Session0 Auto-Cast **${spellFaceTitle(spell)}** · ${broadcast ? "broadcast" : session}`,
    nodeName: focus?.name || spell.target,
    channel: spell.medium || focus?.channel,
    localOnly: true,
    detail: delivery.slice(0, 500),
  });
  return { ok: true, method, session, orchestrator: SESSION0_NAME, broadcast };
}

function failAutoCastSpell(spell, reason) {
  if (!spell) return;
  ensureFleetSpellFields(spell);
  if (spell.castStatus === "cast") return;
  spell.castStatus = "failed";
  spell.autoCastError = String(reason || "failed");
  spell.awaitingReply = false;
  const focus = resolveSpellFocus(spell, null);
  if (focus) {
    ensureFleetFocusFields(focus);
    if (focus.status === "working") focus.status = "ready";
  }
  const t = autoCastTimeouts.get(spell.id);
  if (t) {
    clearTimeout(t);
    autoCastTimeouts.delete(spell.id);
  }
  persist();
  renderSpells();
  activityPing(`✦ Auto-Cast failed · ${spellFaceTitle(spell)} · ${reason}`);
}

function completeAutoCastSpell(spell, { replyExcerpt = "" } = {}) {
  if (!spell) return;
  ensureFleetSpellFields(spell);
  spell.castStatus = "cast";
  spell.castTimestamp = Date.now();
  spell.fleetDeployed = true;
  spell.awaitingReply = false;
  spell.autoCastError = "";
  spell.sentAt = spell.sentAt || Date.now();
  spell.lastCast = spell.castTimestamp;
  spell.castCount = (Number(spell.castCount) || 0) + 1;
  if (String(spell.status) === "ready") spell.status = "history";
  const focus = resolveSpellFocus(spell, null);
  if (focus) {
    ensureFleetFocusFields(focus);
    focus.status = "ready";
    focus.lastActivity = Date.now();
    focus.breathingStatus = "Active";
    void queueAutoWriteBack(focus, {
      eventType: "FLEET_AUTO_CAST_COMPLETE",
      body: [
        `**Session0 Auto-Cast · cast**`,
        `Spell: **${spellFaceTitle(spell)}**`,
        `Orchestrator: **${SESSION0_NAME}**`,
        `Session: **${spell.linkedSession || focus.linkedSession || SESSION0_NAME}**`,
        replyExcerpt ? `\n### Consolidated Session0 reply\n${replyExcerpt}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      source: "Session0",
      category: "node_intel",
      tags: ["fleet", "session0", "auto-cast", "cast", "auto-write"],
      silentToast: true,
    });
  }
  const t = autoCastTimeouts.get(spell.id);
  if (t) {
    clearTimeout(t);
    autoCastTimeouts.delete(spell.id);
  }
  persist();
  renderSpells();
  renderConvoList();
  activityPing(`✦ Auto-Cast cast · ${spellFaceTitle(spell)}`);
}

/**
 * Breathing poller — recomputes Active/Idle/Dead for all linked focuses.
 */
function runBreathingPoll() {
  let changed = false;
  let newlyDead = 0;
  for (const c of state.conversations || []) {
    if (!isVisibleFocus(c)) continue;
    ensureFleetFocusFields(c);
    const prev = c.breathingStatus;
    refreshBreathingStatus(c);
    if (prev !== c.breathingStatus) {
      changed = true;
      if (c.breathingStatus === "Dead" && prev !== "Dead" && c.linkedSession) {
        newlyDead++;
        activityPing(`✦ Dead session · ${c.name} · ${c.linkedSession}`);
        pushBusActivity({
          kind: "breathing",
          summary: `Dead · **${c.name}** · ${c.linkedSession}`,
          nodeName: c.name,
          localOnly: true,
        });
      }
    }
  }
  // Autonomous auto-cast pass
  if (state.fleet?.autonomous) {
    void runAutonomousAutoCastPass();
  }
  if (changed) {
    try {
      persist();
      renderConvoList();
      if (els.brainOverlay && !els.brainOverlay.hasAttribute("hidden")) {
        void renderBrainLog();
      }
    } catch (err) {
      console.warn("[fleet] breathing poll render", err);
    }
  }
  if (newlyDead > 0) {
    toast(`${newlyDead} fleet session${newlyDead === 1 ? "" : "s"} Dead — check BRAIN`, "");
  }
}

function startBreathingPoller() {
  if (breathingPollTimer) clearInterval(breathingPollTimer);
  if (state.fleet && state.fleet.pollEnabled === false) return;
  breathingPollTimer = setInterval(runBreathingPoll, BREATHING_POLL_MS);
  // Initial pass
  try {
    runBreathingPoll();
  } catch (err) {
    console.warn("[fleet] initial breathing poll", err);
  }
}

/**
 * Autonomous mode: deploy pending autoCast spells without UI input.
 */
async function runAutonomousAutoCastPass() {
  if (!state.fleet?.autonomous) return;
  const pending = (state.spells || []).filter(
    (s) => s.autoCast && s.castStatus === "pending"
  );
  for (const s of pending.slice(0, 3)) {
    await runAutoCastSpell(s, { source: "autonomous" });
  }
}

/**
 * BRAIN natural-language mission router.
 */
async function handleFleetMission(text) {
  const plan = parseFleetMission(text);
  ensureFleetCommandState(state);
  state.fleet.lastMission = String(text || "").trim();
  state.fleet.lastMissionAt = Date.now();

  if (plan.op === "empty") {
    toast("Enter a mission", "");
    return;
  }
  if (plan.op === "status") {
    await openBrainLog();
    return;
  }
  if (plan.op === "autonomous") {
    state.fleet.autonomous = Boolean(plan.enabled);
    if (els.fleetAutonomousToggle) {
      els.fleetAutonomousToggle.checked = state.fleet.autonomous;
    }
    persist();
    toast(
      state.fleet.autonomous
        ? "Autonomous ON — fleet deploys without UI input"
        : "Autonomous OFF",
      "success"
    );
    if (state.fleet.autonomous) void runAutonomousAutoCastPass();
    await renderBrainLog();
    return;
  }

  if (plan.op === "msg") {
    const from =
      activeConvo() ||
      state.conversations.find((c) => isVisibleFocus(c)) ||
      null;
    if (!from) {
      toast("No focus to send from", "");
      return;
    }
    const cmd = parseMsgCommand(
      `/msg ${plan.target.includes(" ") ? `"${plan.target}"` : plan.target} ${plan.message}`
    );
    if (cmd) {
      await handleMsgCommand(from, cmd, plan.raw, { source: "operator" });
      toast(`Routed /msg → ${plan.target}`, "success");
    }
    await renderBrainLog();
    return;
  }

  if (plan.op === "mission") {
    const target = state.conversations.find(
      (c) =>
        isVisibleFocus(c) &&
        String(c.name || "").toLowerCase() ===
          String(plan.target || "").toLowerCase()
    );
    if (!target) {
      toast(`Unknown focus: ${plan.target}`, "");
      return;
    }
    ensureFleetFocusFields(target);
    target.currentMission = plan.message;
    target.lastActivity = Date.now();
    target.status = "working";
    target.breathingStatus = target.linkedSession ? "Active" : "Idle";
    persist();
    renderConvoList();
    void queueAutoWriteBack(target, {
      eventType: "FLEET_MISSION",
      body: `**Fleet mission**\n${plan.message}`,
      source: "operator",
      category: "node_intel",
      tags: ["fleet", "mission", "auto-write"],
      silentToast: true,
    });
    // Try deploy matching ready auto-cast spell or create deploy via /msg self
    if (target.linkedSession) {
      const spell = (state.spells || []).find(
        (s) =>
          s.conversationId === target.id &&
          s.autoCast &&
          s.castStatus === "pending"
      );
      if (spell) await runAutoCastSpell(spell, { source: "operator" });
    }
    toast(`Mission set · ${target.name}`, "success");
    await renderBrainLog();
    return;
  }

  if (plan.op === "deploy") {
    const target = state.conversations.find(
      (c) =>
        isVisibleFocus(c) &&
        String(c.name || "")
          .toLowerCase()
          .includes(String(plan.target || "").toLowerCase())
    );
    if (!target) {
      toast(`Deploy target not found: ${plan.target}`, "");
      return;
    }
    const purposeKey = String(plan.spellPurpose || "").toLowerCase();
    const spell =
      (state.spells || []).find(
        (s) =>
          s.conversationId === target.id &&
          String(s.purpose || s.title || "")
            .toLowerCase()
            .includes(purposeKey)
      ) ||
      (state.spells || []).find((s) => s.conversationId === target.id);
    if (!spell) {
      toast(`No spell to deploy on ${target.name}`, "");
      return;
    }
    spell.autoCast = true;
    await runAutoCastSpell(spell, { source: "operator", force: true });
    await renderBrainLog();
    return;
  }

  if (plan.op === "broadcast") {
    // Set mission on all Active/Idle linked focuses; route packet through Session0 only
    let n = 0;
    let session0Focus = null;
    for (const c of state.conversations || []) {
      if (!isVisibleFocus(c) || !c.linkedSession) continue;
      ensureFleetFocusFields(c);
      c.currentMission = plan.message;
      c.lastActivity = Date.now();
      n++;
      if (!session0Focus && isSession0(c.linkedSession)) session0Focus = c;
    }
    // Prefer explicit Session0 focus; else any linked focus as provenance for inject
    const routeFocus =
      session0Focus ||
      (state.conversations || []).find(
        (c) => isVisibleFocus(c) && c.linkedSession
      ) ||
      null;
    if (session0Focus) {
      await sendToLinkedSession(session0Focus, plan.message, { silent: true });
    } else if (routeFocus) {
      // No Session0-linked focus: clipboard handoff of Session0 broadcast packet
      const fleetSessions = listFleetSessions(state.conversations || []);
      const packet = formatSession0MessagePacket(plan.message, {
        linkedSession: SESSION0_NAME,
        focus: routeFocus,
        fleetSessions,
      });
      try {
        await copyTextToClipboard(packet);
      } catch {
        /* non-fatal — mission still set in state */
      }
    }
    persist();
    renderConvoList();
    toast(
      `Mission copied — paste into Hermes ${SESSION0_NAME} · ${n} fleet focus${n === 1 ? "" : "es"}`,
      "success"
    );
    await renderBrainLog();
  }
}

/** Touch focus activity (chat / cast) → breathing Active */
function touchFleetActivity(focus) {
  if (!focus || isCell2CoreFocus(focus)) return;
  ensureFleetFocusFields(focus);
  focus.lastActivity = Date.now();
  if (focus.linkedSession) {
    focus.breathingStatus = "Active";
    focus.breathingNote = "";
  }
}

async function refreshIntelFolderUi() {
  const label = await getFolderLabel();
  if (!els.intelFolderStatus || !els.btnIntelFolder) return;
  if (label && isIntelligenceSetupComplete()) {
    els.intelFolderStatus.textContent = `Vault → ${label}/`;
    els.intelFolderStatus.className = "intel-folder-status ready";
    els.btnIntelFolder.classList.add("ready");
    els.btnIntelFolder.title = `Change Intelligence Folder (current: ${label})`;
  } else if (!hasDirectoryPicker()) {
    els.intelFolderStatus.textContent =
      "No folder API — will download .md (use Chrome/Edge)";
    els.intelFolderStatus.className = "intel-folder-status warn";
    els.btnIntelFolder.classList.remove("ready");
    els.btnIntelFolder.title = "File System Access API unavailable";
  } else {
    els.intelFolderStatus.textContent = wasIntelligenceSetupSkipped()
      ? "No vault — click 📁 to set intelligence folder"
      : "Pick a parent folder → creates GRIMOIRE-FocusIntelligence/";
    els.intelFolderStatus.className = "intel-folder-status";
    els.btnIntelFolder.classList.remove("ready");
    els.btnIntelFolder.title = "Set / change Intelligence Folder";
  }
}

async function onChooseIntelFolder() {
  if (!hasDirectoryPicker()) {
    toast("Use Chrome or Edge (not Firefox) for folder access", "");
    try {
      await refreshIntelFolderUi();
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    const handle = await chooseIntelligenceFolder();
    setVaultFailState(false);

    // If a locked focus is active, that focus owns this pick
    const active = activeConvo();
    if (active && !isCell2CoreFocus(active)) {
      try {
        await setFocusFolderHandle(active.id, handle, handle.name);
        markFocusVaultLinked(active.id);
      } catch (err) {
        console.warn("[vault] active focus link", err);
      }
    }

    persist();
    toast(`Vault ready: ${handle.name}/`, "success");
    activityPing(`✦ Vault linked: ${handle.name}/`);

    // Seed writes are best-effort — never roll back a successful folder pick
    try {
      await refreshIntelFolderUi();
    } catch {
      /* ignore */
    }
    try {
      const cell2 = ensureCell2CoreFocus(state);
      if (cell2) await ensureCell2IntelligenceFile(cell2);
    } catch (err) {
      console.warn("[vault] cell2 seed", err);
    }
    try {
      if (active && !isCell2CoreFocus(active)) {
        await appendEntityIntelligence(active, {
          body: `Vault linked · sealed **${active.name}** · ${getSealedChannel(active)}`,
          source: "Cell2",
          category: "identity",
          certainty: ensureCertainty(active),
          tags: ["vault-link"],
        });
      }
    } catch (err) {
      console.warn("[vault] active seed", err);
    }
    try {
      await updateScrollListIndex(state.conversations, state.spells);
    } catch (err) {
      console.warn("[vault] scroll index", err);
    }
    renderAll();
  } catch (err) {
    if (err?.name === "AbortError") return;
    console.error("[vault] choose folder failed", err);
    setVaultFailState(true);
    const detail = String(err?.message || err?.name || err || "unknown error").slice(0, 120);
    toast(`Could not open folder: ${detail}`, "");
  }
}

/**
 * Boot vault restore only — never open showDirectoryPicker here.
 * Picker requires a user gesture (📁 icon or "Create my path").
 */
async function bootstrapIntelligenceVault() {
  if (!hasDirectoryPicker()) {
    await refreshIntelFolderUi();
    return;
  }
  try {
    // forcePrompt: false → restore from IndexedDB only; no OS picker on load
    const handle = await ensureIntelligenceFolder({ forcePrompt: false });
    await refreshIntelFolderUi();

    const cell2 = ensureCell2CoreFocus(state);
    if (cell2) await ensureCell2IntelligenceFile(cell2);

    if (handle) {
      // Previously linked vault restored — quiet seed, no toast spam
      for (const c of state.conversations) {
        if (isCell2CoreFocus(c)) continue;
        if (!Array.isArray(c.intelLog) || c.intelLog.length === 0) {
          await appendEntityIntelligence(c, {
            body: `Focus sealed: **${c.name}** · ${getSealedChannel(c)} · type ${getFocusType(c)}`,
            source: "Cell2",
            category: "identity",
            certainty: ensureCertainty(c),
            tags: ["bootstrap", "identity"],
          });
        }
      }
      await updateScrollListIndex(state.conversations, state.spells);
      // Do NOT mark all focuses vault-linked — per-focus paths only
      persist();
      renderConvoList();
    }
    // Warm per-focus handles for any focus already flagged vaultLinked
    for (const c of state.conversations || []) {
      if (c?.id && (c.vaultLinked || isFocusVaultLinked(c.id))) {
        try {
          await resolveFocusFolderHandle(c.id);
        } catch {
          /* ignore */
        }
      }
    }
    // Not linked: leave path-onboarding callouts / Create my path for user click
  } catch (err) {
    if (err?.name === "SecurityError" || /user gesture/i.test(String(err?.message || ""))) {
      console.warn("[vault] boot restore skipped picker (needs user gesture)");
    } else if (err?.name !== "AbortError") {
      console.warn(err);
    }
    await refreshIntelFolderUi();
  }
}


/**
 * INTEL ATLAS — read-only surface of everything Grimoire knows about a Focus.
 * Stars densen numerically; Atlas makes the intelligence legible.
 */
function listSlice(arr, n = 6) {
  return (arr || []).filter(Boolean).slice(0, n);
}

function recentUserIntel(convo, n = 5) {
  return [...(convo?.messages || [])]
    .reverse()
    .filter((m) => m.role === "user" && String(m.text || "").trim())
    .slice(0, n)
    .map((m) => String(m.text).replace(/\s+/g, " ").trim().slice(0, 140));
}

function buildFocusIntelAtlas(convo, spells = state.spells) {
  const snap = deriveFocusSnapshot(convo, spells);
  if (!convo) {
    return {
      empty: true,
      title: "Intel Atlas",
      subtitle: "Select a focus to inspect its intelligence.",
      sections: [],
    };
  }

  if (convo.alignmentNotes && !convo.alignmentProfile) {
    convo.alignmentProfile = parseAlignmentIntelligence(convo.alignmentNotes);
  }
  const p = convo.alignmentProfile || {};
  const focusType = getFocusType(convo);
  const sealed = getSealedChannel(convo);
  const focusSpells = (spells || []).filter(
    (s) => s.conversationId === convo.id && !isReceiptSpell(s)
  );
  const ready = focusSpells.filter((s) => s.status !== "sent");
  const sent = focusSpells.filter((s) => s.status === "sent");
  const stage = universeStage(snap.intelCount, snap.spellsSent, snap.aligned);
  const isAi = isAiNode(convo);
  const isPersonFocus = isPerson(convo) || focusType === "person";
  const purpose =
    p.purpose ||
    (isAi
      ? "Engineer transmissions that extract / progress this node."
      : isPersonFocus
        ? "Remember who they are. Craft messages, reminders, and action-spells (real-world care counts)."
        : "Broadcast / network field craft — spells are signals and actions.");

  const sections = [];
  sections.push({
    title: "Identity",
    kv: [
      ["Focus", convo.name],
      ["Type", focusType],
      ["Channel", sealed],
      ["Stage", stage.name],
      ["Intel bits", String(snap.intelCount)],
      ["Stars (sky)", String(getUniverseHud().starCount || 0)],
      ["Signal", p.signal != null ? `${p.signal}/10` : "—"],
      ["Aligned", snap.aligned ? "YES" : "NO"],
    ],
  });

  // Healer Health Covenant — multi-condition bar, per Focus type
  const health = computeFocusHealth(convo, spells);
  sections.push({
    title: "Healer Health Covenant",
    health,
    lines: [health.healerNote, `Next restore spell: ${healerHealthSpellHint(health)}`],
  });

  sections.push({ title: "Purpose", lines: [purpose] });
  if (listSlice(p.directives).length) {
    sections.push({ title: "Directives (planets)", lines: listSlice(p.directives, 8) });
  }
  if (listSlice(p.capabilities).length) {
    sections.push({ title: "Capabilities", lines: listSlice(p.capabilities, 6) });
  }
  if (listSlice(p.constraints).length) {
    sections.push({ title: "Constraints", lines: listSlice(p.constraints, 6) });
  }
  if (listSlice(p.doctrine).length) {
    sections.push({ title: "Doctrine", lines: listSlice(p.doctrine, 5) });
  }
  if (listSlice(p.frames).length) {
    sections.push({ title: "Frames", tags: listSlice(p.frames, 8) });
  }
  if (listSlice(p.opsFacts).length) {
    sections.push({ title: "Ops facts", lines: listSlice(p.opsFacts, 6) });
  }
  const recent = recentUserIntel(convo, 5);
  if (recent.length) {
    sections.push({ title: "Recent captures", lines: recent });
  }
  sections.push({
    title: "Spell stack",
    kv: [
      ["Ready", String(ready.length)],
      ["Sent", String(sent.length)],
      ["Images", String(snap.imageCount || 0)],
      ["Pulses", String(snap.pulseCount || 0)],
    ],
    lines: ready.slice(0, 4).map((s) => s.purpose || "untitled"),
  });
  if (!snap.aligned && isAi) {
    sections.push({
      title: "Next gate",
      lines: [
        "Cast Spell → Alignment Reveal",
        "Copy → paste to the AI node (or any pertinent node this Focus steers)",
        "Paste full reply here — Focus is the sun/nucleus; intelligence densens back",
      ],
    });
  }

  return {
    empty: false,
    title: `${convo.name} · Atlas`,
    subtitle: isAi
      ? "AI node universe — knowledge compound; spells progress the node."
      : isPersonFocus
        ? "Person universe — eternal memory; spells are messages or real-world actions."
        : "Network universe — signals + group actions.",
    sections,
    stage: stage.name,
    stats: {
      intel: snap.intelCount,
      directives: snap.directives,
      ready: ready.length,
      sent: sent.length,
      signal: p.signal,
    },
  };
}

/** Live DOM nodes — never trust boot-time els alone for Atlas. */
function atlasNodes() {
  return {
    root: document.getElementById("universe-legend") || els.universeLegend,
    title: document.getElementById("atlas-title") || els.atlasTitle,
    sub: document.getElementById("atlas-sub") || els.atlasSub,
    body: document.getElementById("atlas-body") || els.atlasBody,
    close: document.getElementById("btn-atlas-close") || els.btnAtlasClose,
  };
}

/** Resolve active Focus even if activeId is briefly stale. */
function resolveAtlasFocus(preferred) {
  if (preferred) return preferred;
  const byId = activeConvo();
  if (byId) return byId;
  const nameEl = document.getElementById("entity-name");
  const shown = (nameEl?.textContent || "").trim();
  if (shown && shown !== "Select a focus") {
    const match = state.conversations.find(
      (c) => String(c.name || "").toLowerCase() === shown.toLowerCase()
    );
    if (match) {
      state.activeId = match.id;
      return match;
    }
  }
  return state.conversations[0] || null;
}

function renderIntelAtlas(convo) {
  const focus = resolveAtlasFocus(convo);
  // Best-effort reinject profile from last rich user paste so Atlas is never shollow void
  if (focus && !focus.alignmentProfile?.directives?.length) {
    const rich = [...(focus.messages || [])]
      .reverse()
      .find(
        (m) =>
          m.role === "user" &&
          /SIGNAL|CAPABILIT|CONSTRAINT|PURPOSE|NEXT THREE|ACTION TAKEN|Pulse:|lane|evidence/i.test(
            m.text || ""
          )
      );
    if (rich?.text && rich.text.length > 40) {
      focus.alignmentProfile = parseAlignmentIntelligence(rich.text);
      if (!focus.alignmentNotes) focus.alignmentNotes = rich.text.slice(0, 8000);
      if (!focus.alignmentRevealed) focus.alignmentRevealed = true;
    }
  }

  const atlas = buildFocusIntelAtlas(focus);
  const n = atlasNodes();
  if (n.title) n.title.textContent = atlas.title;
  if (n.sub) n.sub.textContent = atlas.subtitle;
  if (!n.body) return atlas;

  if (atlas.empty) {
    n.body.innerHTML = `<p class="atlas-empty">${escapeHtml(atlas.subtitle)}</p>`;
    return atlas;
  }

  const html = atlas.sections
    .map((sec) => {
      let body = "";
      if (sec.health) {
        const h = sec.health;
        const bars = (h.conditions || [])
          .map((c) => {
            const w = Math.max(0, Math.min(100, c.score));
            return `<div class="health-row"><span class="health-label">${escapeHtml(
              c.label
            )}</span><div class="health-track"><div class="health-fill band-${escapeHtml(
              h.band
            )}" style="width:${w}%"></div></div><span class="health-score">${w}</span></div>`;
          })
          .join("");
        body += `<div class="health-covenant" data-band="${escapeHtml(h.band)}">
          <div class="health-master">
            <span class="health-hp">HP ${h.hp}</span>
            <span class="health-band">${escapeHtml(h.band.toUpperCase())}</span>
            <span class="health-recipe">${escapeHtml(h.label)}</span>
          </div>
          <div class="health-master-track"><div class="health-master-fill band-${escapeHtml(
            h.band
          )}" style="width:${h.hp}%;background:${escapeHtml(h.color)}"></div></div>
          ${bars}
        </div>`;
      }
      if (sec.kv && sec.kv.length) {
        body += `<dl class="atlas-kv">${sec.kv
          .map(
            ([k, v]) =>
              `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v ?? "—"))}</dd>`
          )
          .join("")}</dl>`;
      }
      if (sec.lines && sec.lines.length) {
        body += `<ul>${sec.lines
          .map((l) => `<li>${escapeHtml(String(l))}</li>`)
          .join("")}</ul>`;
      }
      if (sec.tags && sec.tags.length) {
        body += `<div class="atlas-tagrow">${sec.tags
          .map((t) => `<span class="atlas-tag">${escapeHtml(String(t))}</span>`)
          .join("")}</div>`;
      }
      return `<section class="atlas-section"><h4>${escapeHtml(
        sec.title
      )}</h4>${body}</section>`;
    })
    .join("");
  n.body.innerHTML =
    html ||
    `<p class="atlas-empty">No structured intel yet — speak about this Focus.</p>`;
  return atlas;
}

function setAtlasOpen(open) {
  state.atlasOpen = Boolean(open);
  const at = atlasNodes();
  if (!at || !at.root) return;
  if (open) {
    renderIntelAtlas(at.focus);
    at.root.removeAttribute("hidden");
    at.root.setAttribute("aria-hidden", "false");
  } else {
    at.root.setAttribute("hidden", "");
    at.root.setAttribute("aria-hidden", "true");
  }
}

function toggleAtlas() {
  const leg = atlasNodes().root;
  if (!leg) return;
  const open = !leg.hasAttribute("hidden");
  setAtlasOpen(!open);
}
/**
 * Cast Spell = consolidate Focus intelligence → restructure ready spells.
 * 1) Re-parse latest user intel into alignmentProfile when present
 * 2) Strip receipt/echo cards
 * 3) Forge ONE best next spell against atlas (upgrade REBUILT in place)
 * Spells = messages to AI/people OR action-spells (real-world doings as castable care).
 */
function consolidateAndRestructureSpells(convo) {
  if (!convo) return { spell: null, purged: 0, atlas: null };

  const source =
    convo.alignmentNotes ||
    [...(convo.messages || [])]
      .reverse()
      .find(
        (m) =>
          m.role === "user" &&
          /SIGNAL|CAPABILIT|CONSTRAINT|PURPOSE|ALIGNMENT|NEXT THREE|ACTION TAKEN|Pulse:|LOOP RECEIVED|HOLDING FORMATION/i.test(
            m.text || ""
          )
      )?.text ||
    "";
  if (source && source.length > 40) {
    convo.alignmentProfile = parseAlignmentIntelligence(source);
    if (!convo.alignmentNotes) convo.alignmentNotes = source.slice(0, 8000);
  }

  const before = state.spells.length;
  stripReceiptSpells(convo.id);
  // Drop active hold/loop garbage so Active stays activation-only
  state.spells = state.spells.filter((s) => {
    if (s.conversationId !== convo.id) return true;
    if (s.status === "sent") return true;
    if (isReceiptSpell(s) || purposeLooksLikeHoldLoop(s.purpose)) return false;
    return true;
  });
  state.spells = dedupeSpells(state.spells || []);
  const purged = Math.max(0, before - state.spells.length);

  const atlas = buildFocusIntelAtlas(convo);
  const lastUser = [...(convo.messages || [])]
    .reverse()
    .find((m) => m.role === "user" && String(m.text || "").trim());
  const lastText = lastUser?.text || "";

  // Smart advance: after a hold/loop densen, forge NEXT THREE MOVES[0] open — not re-maintain frame
  let readyHint = nextTruePriorityHint(convo);
  if (!readyHint) {
    if (isAiNode(convo) && !convoAlignmentUnlocked(convo)) {
      readyHint = "ALIGNMENT REVEAL";
    } else if (isHoldOrLoopReply(lastText)) {
      readyHint =
        "Open next constrained move from NEXT THREE that is not yet in Cast History";
    } else {
      const recent = recentUserIntel(convo, 1)[0];
      if (recent && !purposeLooksLikeHoldLoop(recent) && !isHoldOrLoopReply(recent)) {
        readyHint = recent;
      } else if (isPerson(convo)) {
        readyHint = `Check-in / remembered action for ${convo.name}`;
      } else {
        readyHint = `Next highest-value cast for ${convo.name}`;
      }
    }
  }

  // If top active already matches this hint, don't spam — just surface it
  const existingActive = activeSpellsFor(convo.id).find(
    (s) =>
      normalizePurposeKey(s.purpose) === normalizePurposeKey(readyHint) ||
      purposeLooksLikeHoldLoop(s.purpose) === false &&
        spellsAreSameKindPurpose(s, { purpose: readyHint, kind: "directive" })
  );
  if (
    existingActive &&
    !isHoldOrLoopReply(lastText) &&
    !purposeLooksLikeHoldLoop(existingActive.purpose)
  ) {
    return { spell: existingActive, purged, atlas, readyHint, reused: true };
  }

  const spell = generateAndStoreSpell(convo, readyHint, { silentToast: true });
  // Hard refuse hold loop purposes on Cast Spell path
  if (spell && !spell.blocked && purposeLooksLikeHoldLoop(spell.purpose)) {
    // Retry once with force next-move wording
    const forced =
      nextTruePriorityHint(convo) ||
      "Execute first open NEXT THREE MOVES item not already CAST";
    const retry = generateAndStoreSpell(convo, forced, { silentToast: true });
    if (retry && !retry.blocked && !purposeLooksLikeHoldLoop(retry.purpose)) {
      return { spell: retry, purged, atlas, readyHint: forced };
    }
    return {
      spell: {
        blocked: true,
        reason:
          "Frame already held in Cast History. State a *new* constrained ask, or densen next agenda (Base44 / README / Auth) then Cast Spell.",
      },
      purged,
      atlas,
      readyHint,
    };
  }
  return { spell, purged, atlas, readyHint };
}

function castSpell() {
  const convo = activeConvo();
  if (!convo) return;

  if (refuseIfFocusLocked(convo)) {
    renderChat();
    return;
  }

  ensureAlignmentDirective(convo);

  const medium = syncMediumFromControls(convo);

  // Focus-first gate messaging when blocked
  if (
    isAiNode(convo) &&
    convoHasAlignmentSpell(convo) &&
    !convoAlignmentUnlocked(convo)
  ) {
    convo.messages.push({
      id: uid("msg"),
      role: "grimoire",
      text: `**Lock alignment first.** Paste the Alignment Reveal reply for **${convo.name} · ${medium}** to unlock engineered spells.`,
      ts: Date.now(),
    });
    // Still densen intelligence on attempted cast
    densenCastSpellIntelligence(convo, { purpose: "ALIGNMENT GATE", kind: "alignment" });
    persist();
    renderChat();
    renderIntelAtlas(convo);
    return;
  }

  const { spell, purged, atlas } = consolidateAndRestructureSpells(convo);

  // Curiosity densen runs with every Cast Spell (linked nodes → nucleus)
  autoGenerateCuriositySpells(convo, { silentToast: true });
  // Proactive ENGAGE for unengaged nodes
  autoGenerateNodeEngageSpells(convo, { silentToast: true });

  // Cell2 substrate: every Cast Spell appends YAML entry to entity intelligence.md
  densenCastSpellIntelligence(convo, spell && !spell.blocked ? spell : null);

  if (!spell || spell.blocked) {
    toast(spell?.reason || "Could not consolidate / forge spell", "");
    renderIntelAtlas(convo);
    renderSpells();
    return;
  }

  const craft = spell.crafted ? ` ${spell.crafted}.` : "";
  const type = getFocusType(convo);
  const personHint =
    type === "person" || type === "network"
      ? " Spells may be messages **or** action-spells (real-world doings cast as care)."
      : "";
  const purgeNote =
    purged > 0
      ? ` Purged **${purged}** receipt/echo card${purged === 1 ? "" : "s"}.`
      : "";
  const dirN =
    atlas?.stats?.directives ||
    convo.alignmentProfile?.directives?.length ||
    0;

  convo.messages.push({
    id: uid("msg"),
    role: "grimoire",
    text: isAlignmentSpell(spell)
      ? `**Intel consolidated.** Alignment Reveal ready for **${convo.name} · ${medium}**. Open Spells → **tap the card to copy** → send via ${medium} → paste full reply here to ignite the universe.${purgeNote}`
      : `**Intel consolidated · spells restructured.** Ready: **${spell.purpose}.**${craft}${dirN ? ` Locked to **${dirN}** directives.` : ""}${personHint}${purgeNote} Open Spells → **tap card to copy**. ★ HUD = Intel Atlas.`,
    ts: Date.now(),
  });

  if (!state.spellsOpen || isSpellsVisuallyCollapsed()) {
    setSpellsOpen(true);
  }

  persist();
  renderChat();
  renderSpells();
  renderIntelAtlas(convo);
  toast(
    isAlignmentSpell(spell)
      ? "Alignment Reveal consolidated"
      : `Ready spell: ${String(spell.purpose || "").slice(0, 48)}`,
    "success"
  );
}

async function copySpell(id, { seal = true, awaitReply = false } = {}) {
  const spell = state.spells.find((s) => s.id === id);
  if (!spell) return;
  normalizeSpell(spell);
  const md = formatSpellMarkdown(spell);
  try {
    await navigator.clipboard.writeText(md);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = md;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  spell.copiedAt = Date.now();
  // densen general spell targets onto derivedNodes on successful copy
  const copyConvo = state.conversations.find((c) => c.id === spell.conversationId);
  if (copyConvo) populateDerivedNodesFromSpells(copyConvo);

  // Preferred cast flow: copy → await paste reply → auto-seal (no immediate cast)
  if (awaitReply) {
    beginSpellAwaitReply(id);
    const focus = state.conversations.find((c) => c.id === spell.conversationId);
    const paste = spellPasteHint(spell, focus);
    toast(
      paste
        ? `Copied — paste reply into chat to seal`
        : "Copied — paste the AI reply into chat to seal",
      "success"
    );
    return;
  }

  // Legacy: immediate seal on copy (SELF-CAST / explicit seal)
  if (seal && !spellIsSealed(spell)) {
    markSent(id, { fromCopy: true });
  } else {
    persist();
    void renderSpells();
    toast("Spell copied", "success");
  }
}

function markSent(id, { fromCopy = false, fromSelfCast = false, silent = false } = {}) {
  const spell = state.spells.find((s) => s.id === id);
  if (!spell) return;
  normalizeSpell(spell);
  const now = Date.now();
  // Leave await-paste mode
  spell.awaitingReply = false;
  spell.awaitingReplyAt = null;
  if (awaitReplyTimers.has(id)) {
    try {
      clearTimeout(awaitReplyTimers.get(id));
    } catch {
      /* ignore */
    }
    awaitReplyTimers.delete(id);
  }
  spell.status = "history";
  spell.sentAt = spell.sentAt || now;
  spell.castTimestamp = spell.castTimestamp || now;
  spell.lastCast = now;
  spell.castCount = (Number(spell.castCount) || 0) + 1;
  spell.copiedAt = spell.copiedAt || now;
  spell.rebuilt = false;
  spell.updatedAt = now;
  // Snapshot this cast into version history
  if (!Array.isArray(spell.versions)) spell.versions = [];
  const last = spell.versions[spell.versions.length - 1];
  const content = String(spell.content || spell.message || "");
  if (!last || last.content !== content || last.version !== spell.iteration) {
    spell.versions.push({
      version: spell.iteration || 1,
      content,
      title: spellFaceTitle(spell),
      createdAt: now,
      note: fromSelfCast ? "self-cast" : fromCopy ? "copied-cast" : "cast",
    });
  }
  if (fromSelfCast) spell.selfCastAt = now;

  // Spell Crafter: evaluate upgrade after cast
  const convoForUpgrade = state.conversations.find((c) => c.id === spell.conversationId);
  if (convoForUpgrade) {
    void tryUpgradeSpell(spell, convoForUpgrade);
  }

  // If alignment was sent without a reply yet, nudge user (skip when silent / already answered)
  if (isAlignmentSpell(spell) && !fromSelfCast && !silent && !spell.answeredAt) {
    const convo = state.conversations.find((c) => c.id === spell.conversationId);
    if (convo) {
      convo.messages.push({
        id: uid("msg"),
        role: "grimoire",
        text: `Alignment Reveal sealed to Cast History. When **${spell.target}** replies, paste their reveal here — I'll lock future spells to that frame.`,
        ts: now,
      });
    }
  }

  // ENGAGE cast: register on SCROLL LIST + nudge paste densen (not when reply already sealed)
  if (isNodeEngageSpell(spell) && !fromSelfCast && !silent && !spell.answeredAt) {
    const convo = state.conversations.find((c) => c.id === spell.conversationId);
    if (convo) {
      registerEngageOnScrollList(convo, spell);
      convo.messages.push({
        id: uid("msg"),
        role: "grimoire",
        text: `**ENGAGE sealed** → **${spell.target}**. Dispatch complete. When the node replies, paste the return here — I'll densen the SCROLL LIST and vault for **${convo.name}**.`,
        ts: now,
      });
    }
  } else if (isNodeEngageSpell(spell) && !fromSelfCast) {
    const convo = state.conversations.find((c) => c.id === spell.conversationId);
    if (convo) registerEngageOnScrollList(convo, spell);
  }

  persist();
  renderSpells();
  renderConvoList();
  renderChat();

  const focus = state.conversations.find((c) => c.id === spell.conversationId);
  if (focus) {
    if (state.activeId === focus.id) {
      universeEvent("sent", {
        spellsSent: historySpellsFor(focus.id).length,
      });
      setFocusUniverse(deriveFocusSnapshot(focus, state.spells), { warp: false });
    }
    // Auto write-back: full cast payload → focus intelligence.md (background)
    const castKind = fromSelfCast
      ? "SPELL_SELF_CAST"
      : isNodeEngageSpell(spell)
        ? "NODE_ENGAGE_CAST"
        : "SPELL_SENT";
    const castBody = [
      `**${castKind}** · ${spellFaceTitle(spell)} · v${spell.iteration || 1}`,
      `Target: ${spell.target || focus.name}`,
      `Medium: ${spell.medium || getSealedChannel(focus)}`,
      `At: ${new Date(spell.sentAt || Date.now()).toISOString()}`,
      fromSelfCast ? "Mode: SELF-CAST into Focus chat" : "Mode: CAST sealed to history",
      ``,
      formatSpellMarkdown(spell),
    ].join("\n");
    void queueAutoWriteBack(focus, {
      eventType: castKind,
      body: castBody,
      source: "Grimoire",
      category: isAlignmentSpell(spell) ? "identity" : "node_intel",
      tags: ["spell-cast", "auto-write", spell.kind || "spell"].filter(Boolean),
      silentToast: silent === true,
    });
  }

  if (silent) return;

  if (fromSelfCast) {
    toast("SELF-CAST sealed to Cast History", "success");
    return;
  }

  const paste = spell ? spellPasteHint(spell, focus) : "";
  toast(
    fromCopy
      ? paste
        ? `Copied + sealed — ${paste}`
        : "Copied + sealed to Cast History — paste the reply when it returns"
      : "Spell sealed to Cast History",
    "success"
  );
}

function createConversation({ name, type, model } = {}) {
  try {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      toast("Focus name required", "");
      return null;
    }
    // Never allow creating the system Cell2 substrate via New Focus
    if (
      cleanName.toLowerCase() === "cell2 core" ||
      cleanName.toLowerCase() === "cell2-core"
    ) {
      toast("Cell2 Core is system substrate — open BRAIN instead", "");
      return null;
    }
    let t = String(type || "person").toLowerCase().trim();
    if (!["person", "place", "thing", "ai", "idea"].includes(t)) t = "person";
    const rawModel = t === "ai" ? model || "none" : "none";
    const sealed =
      t === "ai"
        ? !rawModel || rawModel === "none"
          ? "Open"
          : rawModel
        : "Open";

    // Dedupe only against visible focuses (system/hidden never block user names)
    const visible = (state.conversations || []).filter((c) => isVisibleFocus(c));
    // GRIMOIRE is one book — any existing GRIMOIRE absorbs create
    if (cleanName.toLowerCase() === "grimoire") {
      const existingG = visible.find(
        (c) => String(c.name || "").trim().toLowerCase() === "grimoire"
      );
      if (existingG) {
        if (t === "ai" && sealed && sealed !== "Open") {
          existingG.medium = sealed;
          existingG.backend = sealed;
          existingG.model = sealed;
          existingG.aiSubtype = sealed;
        }
        existingG.purgeProtected = true;
        existingG.selfRecursive = true;
        state.activeId = existingG.id;
        mergeGrimoireNameClones(state);
        persist();
        renderAll();
        toast("GRIMOIRE already exists — opened the one book", "success");
        return existingG;
      }
    }
    if (focusExists(visible, cleanName, sealed)) {
      toast(`Focus already exists: ${cleanName} · ${sealed}`);
      const existing = visible.find(
        (c) =>
          focusIdentityKey(c.name, getSealedChannel(c)) ===
          focusIdentityKey(cleanName, sealed)
      );
      if (existing) {
        state.activeId = existing.id;
        persist();
        renderAll();
      }
      return existing || null;
    }

    let id = makeFocusId(cleanName, sealed);
    if ((state.conversations || []).some((c) => c.id === id)) {
      id = `${id}-${Date.now().toString(36).slice(-4)}`;
    }

    const bornAt = Date.now();
    const messages = [];
    if (t === "ai") {
      const modelLine = sealed === "Open" ? "Open model" : sealed;
      messages.push({
        id: uid("msg"),
        role: "grimoire",
        text: `AI Focus sealed: **${cleanName}** (${modelLine}). **Locked** until you **Create my path** and link a vault folder. Chat, Cast Spell, and bus stay disabled until then.`,
        ts: Date.now(),
        kind: "alignment-directive",
      });
    } else {
      messages.push({
        id: uid("msg"),
        role: "grimoire",
        text: `${
          t === "place"
            ? "Place"
            : t === "thing"
              ? "Thing"
              : t === "idea"
                ? "Idea"
                : "Person"
        } Focus sealed: **${cleanName}**. **Locked** until you **Create my path** and link a vault folder — chat & Cast Spell unlock after the path is set.`,
        ts: Date.now(),
      });
    }

    let star = { x: 40, y: 40 };
    try {
      star = randomStarPosition(state.conversations) || star;
    } catch {
      /* ignore */
    }

    const convo = {
      id,
      name: cleanName,
      type: t,
      system: false,
      hidden: false,
      certainty: "unknown",
      star,
      messages,
      createdAt: bornAt,
      updatedAt: bornAt,
      lastViewedAt: bornAt,
      pinned: false,
      tags: [],
      folderId: null,
      // Hard path gate — model (None/Open) never skips folder covenant
      needsPathOnboarding: true,
      pathOnboardingDismissed: false,
      vaultLinked: false,
      pathGateExempt: false,
    };

    applyFocusClassification(convo, {
      type: t,
      model: t === "ai" ? rawModel : undefined,
    });
    // User-created focuses are never system/hidden
    convo.system = false;
    convo.hidden = false;
    delete convo.archetype;
    // Operator-critical names (Wizard King / SCROLL / GRIMOIRE / Jacob) get shield
    if (shouldBePurgeProtected(convo)) {
      convo.purgeProtected = true;
    }
    ensureSelfMessageLoop(convo);
    ensureFocusOrgFields(convo, { assignFolder: true });
    ensureCertainty(convo);
    if (convo.folderId == null) {
      try {
        convo.folderId = suggestFocusFolderId(convo);
      } catch {
        convo.folderId = null;
      }
    }

    for (const f of state.conversations || []) {
      f.messages = (f.messages || []).filter(
        (m) => m.kind !== "focus-suggestion"
      );
    }

    state.conversations = state.conversations || [];
    state.conversations.push(convo);
    state.activeId = convo.id;
    persist();
    renderAll();

    const sealLabel = getSealedChannel(convo);
    try {
      syncFocusIntelligenceFile(
        convo,
        "FOCUS_CREATED",
        `Focus sealed: ${convo.name} · ${sealLabel}`
      );
    } catch (err) {
      console.warn("[NewFocus] vault write failed (focus still created)", err);
    }
    toast(`Focus sealed: ${convo.name} · ${sealLabel}`, "success");
    return convo;
  } catch (err) {
    console.error("[NewFocus] createConversation failed", err);
    toast(`Could not create Focus: ${err?.message || err}`, "error");
    return null;
  }
}
window.__createConversation = createConversation;
// Mark ready as soon as create path is live — emergency shell can hand off
window.__grimoireAppReady = true;
window.__grimoireBootVersion = "session0-fleet-1";

/** Guard against double-submit from capture + onclick + form */
let _newFocusCreating = false;

/**
 * Submit New Focus — only path for Create.
 * Reads live DOM. Closes overlay only on success.
 */
function submitNewFocusForm(e) {
  if (e) {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch {
      /* ignore */
    }
  }
  if (_newFocusCreating) return false;
  _newFocusCreating = true;
  try {
    // Always live-query — never trust stale els
    const nameEl = document.getElementById("new-entity-name");
    const typeEl = document.getElementById("new-entity-type");
    const modelEl = document.getElementById("new-entity-model");
    const name = String(nameEl?.value || "").trim();
    if (!name) {
      toast("Focus name required", "");
      try {
        nameEl?.focus();
      } catch {
        /* ignore */
      }
      return false;
    }
    const type = String(typeEl?.value || "person").toLowerCase() || "person";
    const model =
      type === "ai" ? String(modelEl?.value || "none") || "none" : "none";

    console.log("[NewFocus] create submit", { name, type, model });
    const created = createConversation({ name, type, model });
    if (created) {
      closeNewFocusModal();
      // Force sidebar paint in case renderAll was partially swallowed
      try {
        renderConvoList();
        renderChat();
      } catch (err) {
        console.warn("[NewFocus] post-create render", err);
      }
      return true;
    }
    // Failed — leave modal open so user can fix name / retry
    console.warn("[NewFocus] create returned null — modal stays open");
    return false;
  } catch (err) {
    console.error("[NewFocus] submitNewFocusForm crashed", err);
    try {
      toast(`Create failed: ${err?.message || err}`, "error");
    } catch {
      /* ignore */
    }
    return false;
  } finally {
    setTimeout(() => {
      _newFocusCreating = false;
    }, 400);
  }
}
window.__submitNewFocusForm = submitNewFocusForm;
window.__grimoireCreateFocus = submitNewFocusForm;

// ─── Events ───

// Delegated copy for chat message bubbles
els.chatMessages.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-copy-msg, .copy-btn");
  if (!btn) return;
  const msgId = btn.getAttribute("data-msg-id");
  if (!msgId) return;
  const convo = activeConvo();
  const msg = convo?.messages?.find((m) => m.id === msgId);
  const text = msg?.text;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied", "success");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("Copied", "success");
  }
});

els.chatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const convo = activeConvo();
  if (!convo) return;
  if (refuseIfFocusLocked(convo)) {
    renderChat();
    return;
  }
  const text = (els.chatInput?.value || "").trim();
  const hasImages = !!(convo?.pendingImages && convo.pendingImages.length);
  if (!text && !hasImages) return;
  els.chatInput.value = "";
  autoResizeTextarea();
  const trimmed = text.trim();
  if (/^look\s+around$/i.test(trimmed) || /^\/look$/i.test(trimmed)) {
    handleLookAround();
    return;
  }
  sendMessage(trimmed);
});

els.chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    els.chatForm?.requestSubmit();
  }
});

els.chatInput?.addEventListener("paste", (e) => {
  const convo = activeConvo();
  if (!convo) return;
  const items = Array.from(e.clipboardData?.items || []);
  const files = items
    .filter((it) => it.type.startsWith("image/"))
    .map((it) => it.getAsFile())
    .filter(Boolean);
  if (files.length) {
    e.preventDefault();
    queuePastedImages(files);
    return;
  }

  // Auto-cast: if a spell is awaiting reply, any text paste seals it
  const awaiting = getAwaitingSpellForFocus(convo.id);
  if (awaiting && !isFocusLocked(convo)) {
    const pasted = e.clipboardData?.getData("text/plain") || "";
    if (pasted && pasted.trim()) {
      e.preventDefault();
      // Don't leave the reply sitting in the input — handle densen + seal
      if (els.chatInput) els.chatInput.value = "";
      autoResizeTextarea();
      void handleAwaitPasteReply(convo, pasted).then((handled) => {
        if (!handled && els.chatInput) {
          // Fallback: put text back if not handled
          els.chatInput.value = pasted;
          autoResizeTextarea();
        }
      });
    }
  }
});

els.chatInput?.addEventListener("input", autoResizeTextarea);

els.btnIntelFolder?.addEventListener("click", async () => {
  // When active focus is locked, folder button is the required path link action
  const active = activeConvo();
  if (active && isFocusLocked(active)) {
    await onChooseFocusPath(active);
    return;
  }
  await onChooseIntelFolder();
});

els.btnPathLockGateLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  const active = activeConvo();
  if (!active) {
    toast("Select a focus first", "");
    return;
  }
  if (isFocusLocked(active)) {
    await onChooseFocusPath(active);
  } else {
    await onChooseIntelFolder();
  }
});

// Complex spell little chat (spells panel) — separate from main Focus chat
els.littleChatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const convo = activeConvo();
  if (!convo) return;
  if (refuseIfFocusLocked(convo)) return;
  const text = (els.littleChatInput?.value || "").trim();
  if (!text) return;
  if (els.littleChatInput) els.littleChatInput.value = "";
  sendLittleChatMessage(text);
});

els.littleChatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    els.littleChatForm?.requestSubmit();
  }
});

// Spells word → menu (Craft complex spell · Copy spellbook)
// Capture-phase document delegation — always live IDs, survives cache/DOM quirks.
function handleSpellsMenuAction(e) {
  const t = e.target;
  if (!t || typeof t.closest !== "function") return false;

  // Title: toggle menu
  if (t.closest("#btn-spells-title")) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById("spells-title-menu");
    const open = menu?.hasAttribute("hidden");
    setSpellsTitleMenuOpen(Boolean(open));
    return true;
  }

  const item = t.closest(
    "#btn-copy-spellbook, #btn-craft-complex-spell, [data-action='copy-spellbook'], [data-action='craft-complex']"
  );
  if (!item) return false;

  e.preventDefault();
  e.stopPropagation();

  const action =
    item.getAttribute("data-action") ||
    (item.id === "btn-copy-spellbook"
      ? "copy-spellbook"
      : item.id === "btn-craft-complex-spell"
        ? "craft-complex"
        : "");

  if (action === "craft-complex") {
    setSpellsTitleMenuOpen(false);
    if (refuseIfFocusLocked(activeConvo())) return true;
    openCraftComplexSpell();
    return true;
  }

  if (action === "copy-spellbook") {
    // Sync copy inside this click — menu closes on success inside copySpellbook()
    copySpellbook();
    return true;
  }

  return false;
}

document.addEventListener(
  "click",
  (e) => {
    if (handleSpellsMenuAction(e)) return;
    // Outside click closes menu
    if (!e.target?.closest?.(".spells-title-wrap")) {
      setSpellsTitleMenuOpen(false);
    }
  },
  true
);

els.btnComplexCraftClose?.addEventListener("click", () => closeComplexCraftDialog());
els.complexCraftDialog?.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeComplexCraftDialog();
});

els.btnCast?.addEventListener("click", castSpell);
els.btnBrain?.addEventListener("click", () => openBrainLog());
els.btnBrainClose?.addEventListener("click", () => closeBrainLog());
els.brainOverlay?.addEventListener("click", (e) => {
  if (e.target === els.brainOverlay) closeBrainLog();
});

els.btnAttach?.addEventListener("click", () => {
  const convo = activeConvo();
  if (!convo || !convo.pendingImages || !convo.pendingImages.length) {
    toast("Paste an image into the input first", "");
    return;
  }
  clearPendingImages();
  toast("Pending images cleared", "success");
});

els.newType?.addEventListener("change", () => {
  syncNewFocusFormChrome();
});

/**
 * Single source of truth for Spells panel open/collapsed.
 * Always syncs state + .spells-collapsed class (prevents reopen desync).
 */
function setSpellsOpen(open) {
  state.spellsOpen = Boolean(open);
  const appEl = els.app || document.querySelector(".app");
  if (appEl) {
    appEl.classList.toggle("spells-collapsed", !state.spellsOpen);
  }
  if (els.btnToggleSpells) {
    els.btnToggleSpells.setAttribute("aria-expanded", state.spellsOpen ? "true" : "false");
    els.btnToggleSpells.title = state.spellsOpen
      ? "Spells open — tap to switch Active / Cast History (Shift+tap to collapse)"
      : "Open Spells panel";
    els.btnToggleSpells.setAttribute(
      "aria-label",
      state.spellsOpen ? "Spells panel open" : "Open Spells panel"
    );
  }
  try {
    persist();
  } catch {
    /* ignore */
  }
  if (state.spellsOpen) {
    renderSpells();
    if (typeof renderLittleChat === "function") renderLittleChat();
  }
}

function toggleSpells() {
  setSpellsOpen(!state.spellsOpen);
}

function isSpellsVisuallyCollapsed() {
  const appEl = els.app || document.querySelector(".app");
  return Boolean(appEl?.classList.contains("spells-collapsed"));
}

els.btnToggleSpells?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Force reopen when collapsed (state can desync if only spellsOpen was flipped)
  if (!state.spellsOpen || isSpellsVisuallyCollapsed()) {
    setSpellsOpen(true);
    return;
  }
  // Shift+tap collapses when open
  if (e.shiftKey) {
    setSpellsOpen(false);
    return;
  }
  // Open: cycle Active ↔ Cast History
  setSpellView(ensureSpellView() === "active" ? "history" : "active");
});
els.btnCloseSpells?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  setSpellsOpen(false);
});
els.tabSpellsActive?.addEventListener("click", () => setSpellView("active"));
els.tabSpellsHistory?.addEventListener("click", () => setSpellView("history"));

// Spell detail modal
els.btnSpellDetailClose?.addEventListener("click", () => closeSpellDetailModal());
els.spellDetailDialog?.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeSpellDetailModal();
});
els.spellDetailDialog?.addEventListener("click", (e) => {
  // Click backdrop (dialog itself) to dismiss
  if (e.target === els.spellDetailDialog) closeSpellDetailModal();
});
els.btnSpellDetailCopy?.addEventListener("click", async () => {
  const id = spellDetailContext?.spellId;
  if (!id) return;
  const spell = state.spells.find((s) => s.id === id);
  // Second click while awaiting = cancel await
  if (spell?.awaitingReply) {
    clearSpellAwaitReply(id, { reason: "cancel" });
    return;
  }
  // History / archived: cast again (promote + await)
  const st = String(spell?.status || "").toLowerCase();
  if (
    spell &&
    (spellIsSealed(spell) || st === "history" || st === "sent" || st === "archived")
  ) {
    promoteSpellToActive(id, { refine: false });
  }
  await copySpell(id, { seal: false, awaitReply: true });
  updateSpellDetailCopyButton();
});

// Universe view — hide AI chat; pure intelligence sky (Focus = nucleus)
els.btnUniverseView?.addEventListener("click", () => toggleUniverseView());
els.btnUniverseViewExit?.addEventListener("click", () => setUniverseView(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.universeView) {
    // Don't steal Esc from open modals/atlas
    if (els.universeLegend && !els.universeLegend.hasAttribute("hidden")) return;
    if (els.appSettingsPanel && !els.appSettingsPanel.hasAttribute("hidden")) return;
    if (isNewFocusOpen()) return;
    e.preventDefault();
    setUniverseView(false);
  }
});

// ─── New Focus: unbreakable wiring (HTML onclick + capture + direct + form) ───
function onNewFocusButtonClick(e) {
  if (e) {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch {
      /* ignore */
    }
  }
  try {
    openNewFocusModal({ name: "", type: "person" });
  } catch (err) {
    console.error("[NewFocus] open threw", err);
    const d = document.getElementById("new-convo-dialog");
    if (d) {
      d.removeAttribute("hidden");
      d.setAttribute("open", "");
      d.style.display = "block";
      d.style.zIndex = "10000";
    }
  }
}

function bindNewFocusButton() {
  const btn = document.getElementById("btn-new-convo");
  if (!btn) return;
  els.btnNew = btn;
  btn.style.position = "relative";
  btn.style.zIndex = "100";
  btn.style.pointerEvents = "auto";
  btn.style.cursor = "pointer";
  btn.removeEventListener("click", onNewFocusButtonClick);
  btn.addEventListener("click", onNewFocusButtonClick);
  btn.dataset.boundNewFocus = "1";
}

function bindNewFocusForm() {
  const form = document.getElementById("new-convo-form");
  if (!form) return;
  els.newForm = form;
  form.removeEventListener("submit", submitNewFocusForm);
  form.addEventListener("submit", submitNewFocusForm);
  form.dataset.boundNewFocusForm = "1";

  const createBtn = document.getElementById("btn-create-focus");
  if (createBtn) {
    createBtn.type = "button";
    createBtn.disabled = false;
    createBtn.removeAttribute("disabled");
    createBtn.style.pointerEvents = "auto";
    createBtn.style.cursor = "pointer";
    // Primary: click
    createBtn.onclick = function (ev) {
      try {
        ev.preventDefault();
        ev.stopPropagation();
      } catch {
        /* ignore */
      }
      return submitNewFocusForm(ev);
    };
    // Backup: some browsers drop click under overlays — mousedown also works
    createBtn.onmousedown = function (ev) {
      if (ev.button !== 0) return;
      // Don't preventDefault on mousedown (kills focus); just schedule create
      // only if click might not fire — use a short arm
      createBtn.dataset._armed = "1";
      setTimeout(() => {
        if (createBtn.dataset._armed === "1") {
          delete createBtn.dataset._armed;
          // click usually clears this; if still armed, click was swallowed
        }
      }, 50);
    };
    createBtn.addEventListener(
      "click",
      function (ev) {
        delete createBtn.dataset._armed;
        submitNewFocusForm(ev);
      },
      { capture: true }
    );
  }

  // Enter in name field creates
  const nameEl = document.getElementById("new-entity-name");
  if (nameEl) {
    nameEl.onkeydown = function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        submitNewFocusForm(ev);
      }
    };
  }
}

function bindNewFocusAll() {
  bindNewFocusButton();
  bindNewFocusForm();
  const cancel = document.getElementById("btn-cancel-new");
  if (cancel) {
    cancel.type = "button";
    // Direct assignment + listener — both call the same hard close
    cancel.onclick = function (e) {
      closeNewFocusModal(e);
      return false;
    };
    cancel.removeEventListener("click", closeNewFocusModal);
    cancel.addEventListener("click", closeNewFocusModal);
  }
  const overlay = document.getElementById("new-convo-dialog");
  if (overlay) {
    // Click dimmed backdrop (not the panel) closes
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeNewFocusModal(e);
    });
  }
}
bindNewFocusAll();

// Capture phase: Cancel / Create / open New Focus
document.addEventListener(
  "click",
  (e) => {
    const cancelBtn = e.target?.closest?.("#btn-cancel-new");
    if (cancelBtn) {
      closeNewFocusModal(e);
      return;
    }
    const createBtn = e.target?.closest?.("#btn-create-focus");
    if (createBtn) {
      // Single create path (debounced inside submitNewFocusForm)
      submitNewFocusForm(e);
      return;
    }
    const btn = e.target?.closest?.("#btn-new-convo");
    if (!btn) return;
    if (btn.dataset._nfOpening === "1") return;
    btn.dataset._nfOpening = "1";
    setTimeout(() => {
      try {
        delete btn.dataset._nfOpening;
      } catch {
        /* ignore */
      }
    }, 300);
    onNewFocusButtonClick(e);
  },
  true
);

// Escape while New Focus is open
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isNewFocusOpen()) closeNewFocusModal(e);
});

// Capture phase: ALWAYS handle form submit for create
document.addEventListener(
  "submit",
  (e) => {
    const form = e.target?.closest?.("#new-convo-form") || e.target;
    if (!form || form.id !== "new-convo-form") return;
    submitNewFocusForm(e);
  },
  true
);

// Re-bind after paint / boot (covers any late DOM mutations)
if (typeof requestAnimationFrame === "function") {
  requestAnimationFrame(() => bindNewFocusAll());
}
setTimeout(() => bindNewFocusAll(), 0);
setTimeout(() => bindNewFocusAll(), 500);

els.btnClearAll?.addEventListener("click", () => {
  requestClearAllSpells();
});

els.btnCancelNew?.addEventListener("click", closeNewFocusModal);

els.editDialog?.addEventListener("submit", (e) => {
  e.preventDefault();
  saveFocusEdit();
});
els.btnCancelEdit?.addEventListener("click", () => {
  els.editDialog?.close();
});

// Chat relay toggle — per Focus, clipboard-only Hermes paste path
els.chatRelayInput?.addEventListener("change", () => {
  setChatRelayForActiveFocus(Boolean(els.chatRelayInput?.checked));
});

function openEditDialog() {
  const convo = activeConvo();
  if (!convo) return;
  ensureFleetFocusFields(convo);
  els.editId.value = convo.id;
  els.editName.value = convo.name || "";
  els.editType.value = convo.type === "network" ? "network" : convo.type === "ai" ? "ai" : "person";
  const raw = convo.model || convo.channel || "none";
  els.editModel.value = ["Hermes","Claude","ChatGPT","Grok","Local","Custom"].includes(raw) ? raw : "none";
  els.editModelLabel.hidden = els.editType.value !== "ai";
  if (els.editLinkedSession) els.editLinkedSession.value = convo.linkedSession || "";
  if (els.editSessionMessage) els.editSessionMessage.value = "";
  syncEditHermesSendUi(convo);
  els.editDialog?.showModal();
}

function saveFocusEdit() {
  const convo = state.conversations.find((c) => c.id === els.editId.value);
  if (!convo) return;
  const newName = (els.editName.value || "").trim();
  if (!newName) {
    toast("Focus name required", "");
    return;
  }
  const newType = els.editType.value === "ai" ? "ai" : els.editType.value === "network" ? "network" : "person";
  const newModel = newType === "ai" ? (els.editModel.value || "none") : "none";
  const newSealed = newType === "ai"
    ? (!newModel || newModel === "none" ? "Open" : newModel)
    : "Open";

  if (
    newName.toLowerCase().trim() !== convo.name.toLowerCase().trim() ||
    newSealed.toLowerCase() !== (getSealedChannel(convo) || "Open").toLowerCase()
  ) {
    if (focusExists(state.conversations, newName, newSealed)) {
      toast(`Focus already exists: ${newName} · ${newSealed}`);
      return;
    }
  }

  convo.name = newName;
  convo.type = newType;
  convo.model = newModel;
  if (newType !== "ai") convo.model = "none";

  // Linked session (string only)
  ensureFleetFocusFields(convo);
  convo.linkedSession = String(els.editLinkedSession?.value || "").trim();
  if (convo.linkedSession) {
    convo.sessionLinkedAt = convo.sessionLinkedAt || Date.now();
    convo.lastActivity = Date.now();
  }
  convo.channel = getSealedChannel(convo);
  refreshBreathingStatus(convo);

  const id = makeFocusId(convo.name, getSealedChannel(convo));
  if (id && id !== convo.id && !state.conversations.some((c) => c.id === id)) {
    convo.id = id;
  }

  persist();
  renderAll();
  syncFocusIntelligenceFile(convo, "FOCUS_UPDATED", `Updated: ${convo.name} · ${getSealedChannel(convo)} · session ${convo.linkedSession || "—"}`);
  els.editDialog?.close();
  toast(`Updated: ${convo.name} · ${getSealedChannel(convo)}`, "success");
}

els.newType?.addEventListener("change", () => {
  syncNewFocusFormChrome();
});
els.editType?.addEventListener("change", () => {
  els.editModelLabel.hidden = els.editType.value !== "ai";
});

els.btnEditFocus?.addEventListener("click", () => {
  openEditDialog?.();
});

// Linked session send — Edit Focus
els.editLinkedSession?.addEventListener("input", () => {
  const convo =
    state.conversations.find((c) => c.id === els.editId?.value) || activeConvo();
  if (!convo) return;
  // Live toggle send row while typing the link (not persisted until Update)
  const draft = { ...convo, linkedSession: String(els.editLinkedSession.value || "").trim() };
  syncEditHermesSendUi(draft);
});
els.btnSendSession?.addEventListener("click", (e) => {
  e.preventDefault();
  const convo =
    state.conversations.find((c) => c.id === els.editId?.value) || activeConvo();
  if (!convo) return;
  // Use field value as link if Update not pressed yet
  const session = String(els.editLinkedSession?.value || "").trim();
  if (session) convo.linkedSession = session;
  const text = String(els.editSessionMessage?.value || "").trim();
  void sendToLinkedSession(convo, text).then((r) => {
    if (r?.ok && els.editSessionMessage) els.editSessionMessage.value = "";
  });
});
els.editSessionMessage?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    els.btnSendSession?.click();
  }
});

// Fleet mission bar (BRAIN)
els.btnFleetMission?.addEventListener("click", () => {
  const text = String(els.fleetMissionInput?.value || "").trim();
  void handleFleetMission(text);
});
els.fleetMissionInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const text = String(els.fleetMissionInput?.value || "").trim();
    void handleFleetMission(text);
  }
});
els.fleetAutonomousToggle?.addEventListener("change", () => {
  ensureFleetCommandState(state);
  state.fleet.autonomous = Boolean(els.fleetAutonomousToggle.checked);
  persist();
  toast(
    state.fleet.autonomous ? "Autonomous ON" : "Autonomous OFF",
    "success"
  );
  if (state.fleet.autonomous) void runAutonomousAutoCastPass();
});

els.btnCopyScrollList?.addEventListener("click", async () => {
  const convo = activeConvo();
  if (!convo) {
    toast("Select a focus first", "");
    return;
  }
  try {
    const text = buildScrollList(convo, state.spells);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast("SCROLL List copied — paste directly into any AI node", "success");
  } catch (err) {
    console.warn("Copy SCROLL List failed", err);
    toast("Copy failed", "");
  }
});

// Healer purge button removed from UI — no annihilation control in the header.
// Focus delete remains off active spell cards; Clear Active handles uncast queue only.

els.brandText?.addEventListener("click", () => {
  openAppSettings();
});
els.btnAppSettingsClose?.addEventListener("click", () => {
  closeAppSettings();
});
document.addEventListener("click", (e) => {
  if (
    els.appSettingsPanel &&
    !els.appSettingsPanel.hasAttribute("hidden") &&
    !e.target.closest("#app-settings-panel") &&
    !e.target.closest("#brand-text")
  ) {
    closeAppSettings();
  }
});

// Roadmap panel events
els.btnRoadmapClose?.addEventListener("click", () => closeRoadmapPanel());
els.btnRoadmapGenerate?.addEventListener("click", () => {
  void generateRoadmapFromPanel("create");
});
els.btnRoadmapParse?.addEventListener("click", () => {
  void generateRoadmapFromPanel("parse");
});
els.roadmapStatusFilter?.addEventListener("change", () => renderRoadmapPanel());
els.roadmapPanel?.addEventListener("click", (e) => {
  // backdrop click closes
  if (e.target === els.roadmapPanel) closeRoadmapPanel();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.roadmapPanel && !els.roadmapPanel.hasAttribute("hidden")) {
    closeRoadmapPanel();
  }
});

// Settings → Roadmap card
document.querySelectorAll("[data-settings-open='roadmap']").forEach((el) => {
  el.addEventListener("click", () => openRoadmapPanel());
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRoadmapPanel();
    }
  });
});

function openAppSettings() {
  if (!els.appSettingsPanel) return;
  els.appSettingsPanel.removeAttribute("hidden");
  toast("App settings opened", "");
}

function closeAppSettings() {
  if (!els.appSettingsPanel) return;
  els.appSettingsPanel.setAttribute("hidden", "");
}

// ═══════════════════════════════════════════════════════════════════════════
// Roadmap Engine — /roadmap + panel (does not touch vault covenant / spells / bus / path gate)
// ═══════════════════════════════════════════════════════════════════════════

function activeRoadmap() {
  ensureRoadmapsState(state);
  if (!state.activeRoadmapSlug) return (state.roadmaps || [])[0] || null;
  return (
    findRoadmapBySlug(state, state.activeRoadmapSlug) ||
    (state.roadmaps || [])[0] ||
    null
  );
}

async function persistRoadmapToVault(roadmap) {
  if (!roadmap) return { ok: false };
  ensureRoadmapChecks(roadmap);
  const md = formatRoadmapMarkdown(roadmap);
  const focusId = activeConvo()?.id || null;
  try {
    const result = await writeRoadmapFile(roadmap, md, { focusId });
    roadmap.path = result?.path || `grimoire-local/roadmaps/${roadmap.slug}.md`;
    roadmap.lastWriteMethod = result?.method || "memory";
    return result;
  } catch (err) {
    console.warn("persistRoadmapToVault", err);
    return { ok: false, error: String(err) };
  }
}

/** Cache of fetched app sources during a verify pass */
const verifySourceCache = new Map();

async function fetchAppSource(path) {
  const p = String(path || "").replace(/^\.\//, "").replace(/^\/+/, "");
  if (!p) return { ok: false, status: 0, text: "", path: p };
  if (verifySourceCache.has(p)) return verifySourceCache.get(p);
  try {
    const url = new URL(p, window.location.href).toString();
    const res = await fetch(url, { cache: "no-store" });
    const text = res.ok ? await res.text() : "";
    const out = { ok: res.ok, status: res.status, text, path: p };
    verifySourceCache.set(p, out);
    return out;
  } catch (err) {
    const out = {
      ok: false,
      status: 0,
      text: "",
      path: p,
      error: String(err?.message || err),
    };
    verifySourceCache.set(p, out);
    return out;
  }
}

/**
 * Run one executable check against the live app / vault.
 * Kinds: file_exists | source_match | lint | vault_entry
 */
async function runRoadmapCheck(check, { focusId = null } = {}) {
  const c = makeRoadmapCheck(check);
  try {
    if (c.kind === "file_exists") {
      const src = await fetchAppSource(c.path);
      if (src.ok) {
        c.result = "pass";
        c.evidence = `${c.path} HTTP ${src.status} (${src.text.length} bytes)`;
      } else {
        c.result = "fail";
        c.evidence = src.error
          ? `${c.path} fetch error: ${src.error}`
          : `${c.path} missing (HTTP ${src.status || 0})`;
      }
      return c;
    }

    if (c.kind === "source_match") {
      if (!c.pattern) {
        c.result = "blocked";
        c.evidence = "source_match: no pattern";
        return c;
      }
      const src = await fetchAppSource(c.path);
      if (!src.ok) {
        c.result = "blocked";
        c.evidence = `cannot read ${c.path} (HTTP ${src.status || 0})`;
        return c;
      }
      const ev = evalSourceMatch(src.text, c.pattern, c.flags);
      if (ev.blocked) {
        c.result = "blocked";
        c.evidence = ev.evidence;
      } else {
        c.result = ev.ok ? "pass" : "fail";
        c.evidence = `${c.path}: ${ev.evidence}`;
      }
      return c;
    }

    if (c.kind === "lint") {
      const src = await fetchAppSource(c.path);
      if (!src.ok) {
        c.result = "blocked";
        c.evidence = `lint blocked — cannot read ${c.path}`;
        return c;
      }
      // Prefer structural lint in-browser; CLI tools/roadmap-verify.mjs runs node --check
      const lint = structuralLintSource(src.text, c.path);
      c.result = lint.ok ? "pass" : "fail";
      c.evidence = lint.evidence;
      return c;
    }

    if (c.kind === "vault_entry") {
      const vaultRes = await checkVaultEntry(c.vaultPath || c.path, {
        focusId,
        path: c.path,
      });
      c.result = vaultRes.result || "blocked";
      c.evidence = vaultRes.evidence || "";
      return c;
    }

    c.result = "blocked";
    c.evidence = `unknown check kind: ${c.kind}`;
    return c;
  } catch (err) {
    c.result = "blocked";
    c.evidence = `check error: ${err?.message || err}`;
    return c;
  }
}

/**
 * Verify pending/in-progress steps (and re-check complete) for a roadmap.
 * Writes evidence onto each step; does NOT auto-mark complete.
 */
async function runRoadmapVerification(roadmap, { focusId = null } = {}) {
  if (!roadmap) return null;
  ensureRoadmapChecks(roadmap);
  verifySourceCache.clear();
  const focus = focusId || activeConvo()?.id || null;
  const all = flattenRoadmapSteps(roadmap);
  const stepResults = [];

  for (const st of all) {
    const status = String(st.status || "pending");
    // Run pending + in-progress + blocked; also re-verify complete (demote on fail)
    const shouldRun =
      status === "pending" ||
      status === "in-progress" ||
      status === "blocked" ||
      status === "complete";
    if (!shouldRun) {
      stepResults.push({
        n: st.n,
        title: st.title,
        status: st.status,
        result: "skip",
        checks: [],
      });
      continue;
    }

    const checks = ensureStepChecks(st, roadmap);
    const ran = [];
    for (const chk of checks) {
      ran.push(await runRoadmapCheck(chk, { focusId: focus }));
    }
    applyStepVerification(st, ran);
    stepResults.push({
      n: st.n,
      title: st.title,
      status: st.status,
      result: st.verification?.result || "blocked",
      checks: ran,
    });
  }

  // Roll roadmap status from steps (without forcing complete)
  const live = flattenRoadmapSteps(roadmap);
  if (live.some((s) => s.status === "blocked")) {
    if (roadmap.status !== "complete") roadmap.status = "blocked";
  } else if (live.every((s) => s.status === "complete")) {
    roadmap.status = "complete";
  } else if (live.some((s) => s.status === "in-progress" || s.verified)) {
    if (roadmap.status === "pending" || roadmap.status === "blocked") {
      roadmap.status = "in-progress";
    }
  }

  const report = buildVerificationReport(roadmap, stepResults);
  roadmap.lastVerification = {
    at: report.at,
    result: report.result,
    passRate: report.passRate,
  };
  if (!Array.isArray(roadmap.iterations)) roadmap.iterations = [];
  roadmap.iterations.push({
    at: report.at,
    kind: "verify",
    result: report.result,
    passRate: report.passRate,
    summary: `${report.passed}/${report.total} steps pass · ${report.blockers.length} blocker(s)`,
  });
  roadmap.updatedAt = report.at;

  return report;
}

function upsertRoadmap(roadmap) {
  ensureRoadmapsState(state);
  if (!roadmap) return;
  const idx = (state.roadmaps || []).findIndex(
    (r) => r.slug === roadmap.slug || r.id === roadmap.id
  );
  if (idx >= 0) state.roadmaps[idx] = roadmap;
  else state.roadmaps.push(roadmap);
  state.activeRoadmapSlug = roadmap.slug;
  persist();
}

async function handleRoadmapCommand(convo, cmd, rawText) {
  ensureRoadmapsState(state);
  if (!cmd) return;

  const reply = (text, kind = "roadmap") => {
    if (!convo) return;
    convo.messages = convo.messages || [];
    convo.messages.push({
      id: uid("msg"),
      role: "grimoire",
      text,
      kind,
      ts: Date.now(),
    });
    persist();
    renderChat();
  };

  if (cmd.op === "help") {
    reply(roadmapHelpText());
    toast("Roadmap help", "");
    return;
  }

  if (cmd.op === "sovereign") {
    const rm = ensureSovereignEvolutionRoadmap(state);
    // Refresh structure if empty phases (never wipe verification progress)
    if (!rm.phases?.length) {
      const fresh = buildGrimoireSovereignEvolutionRoadmap();
      Object.assign(rm, fresh);
    }
    state.activeRoadmapSlug = rm.slug || SOVEREIGN_EVOLUTION_SLUG;
    upsertRoadmap(rm);
    void persistRoadmapToVault(rm);
    reply(
      formatRoadmapSummary(rm, { verbose: true }) +
        `\n\n_Canonical · local-first · slug \`${rm.slug}\`_\n_Verify: \`/roadmap verify ${rm.slug}\`_`
    );
    toast("GRIMOIRE Sovereign Evolution loaded", "success");
    renderRoadmapPanel();
    return;
  }

  if (cmd.op === "open") {
    openRoadmapPanel();
    reply("Opened **Roadmap** panel. Paste a feature description or SCROLL plan.");
    return;
  }

  if (cmd.op === "list") {
    const list = state.roadmaps || [];
    let disk = [];
    try {
      disk = await listRoadmapFiles({ focusId: convo?.id });
    } catch {
      disk = [];
    }
    if (!list.length && !disk.length) {
      reply(
        "No roadmaps yet. Try:\n`/roadmap Add Chrono-Ring read-only timeline for Focus events`"
      );
      return;
    }
    const lines = ["### Roadmaps", ""];
    for (const r of list) {
      const steps = flattenRoadmapSteps(r);
      const done = steps.filter((s) => s.status === "complete").length;
      lines.push(
        `- **${r.title}** \`${r.slug}\` · **${r.status}** · ${done}/${steps.length} steps`
      );
    }
    if (disk.length) {
      lines.push("", `_Vault files:_ ${disk.map((s) => `\`${s}.md\``).join(", ")}`);
    }
    lines.push("", "Show one: `/roadmap show <slug>`");
    reply(lines.join("\n"));
    return;
  }

  if (cmd.op === "show") {
    const rm =
      (cmd.slug && findRoadmapBySlug(state, cmd.slug)) || activeRoadmap();
    if (!rm) {
      reply("No roadmap to show. Create one with `/roadmap <description>`.");
      return;
    }
    state.activeRoadmapSlug = rm.slug;
    persist();
    reply(formatRoadmapSummary(rm, { verbose: true }));
    renderRoadmapPanel();
    return;
  }

  if (cmd.op === "create" || cmd.op === "parse") {
    const text = String(cmd.text || rawText || "").trim();
    if (!text) {
      reply(roadmapHelpText());
      return;
    }
    let roadmap;
    if (cmd.op === "parse" || looksLikeScrollRoadmap(text)) {
      roadmap = parseScrollRoadmap(text, { source: "scroll" });
    } else {
      roadmap = generateRoadmapFromDescription(text, { source: "plain" });
    }
    if (!roadmap) {
      reply("Could not build a roadmap from that input.");
      return;
    }
    // Unique slug if collision — keep existing if same title re-run: update by append iteration
    const existing = findRoadmapBySlug(state, roadmap.slug);
    if (existing) {
      // Merge: keep id/slug/iterations; replace phases from new parse only if operator wants full regen
      // Default: treat as new version via unique slug suffix, unless identical slug re-create
      roadmap.slug = uniqueRoadmapSlug(state, roadmap.slug);
      roadmap.path = `grimoire-local/roadmaps/${roadmap.slug}.md`;
    }
    upsertRoadmap(roadmap);
    const write = await persistRoadmapToVault(roadmap);
    const method = write?.method || "memory";
    reply(
      formatRoadmapSummary(roadmap, { verbose: true }) +
        `\n\n_Persisted · ${method} · \`${roadmap.path || `grimoire-local/roadmaps/${roadmap.slug}.md`}\`_`
    );
    toast(`Roadmap forged: ${roadmap.title}`, "success");
    renderRoadmapPanel();
    return;
  }

  if (cmd.op === "expand") {
    const rm = activeRoadmap();
    if (!rm) {
      reply("No active roadmap. Create one first: `/roadmap <description>`");
      return;
    }
    const updated = expandRoadmapStep(rm, cmd.step, cmd.detail);
    if (!updated) {
      reply(`Step **${cmd.step}** not found on \`${rm.slug}\`.`);
      return;
    }
    upsertRoadmap(updated);
    // True append on disk + full structured rewrite (iterations preserved in body)
    await appendRoadmapIteration(
      updated.slug,
      `expand step ${cmd.step}${cmd.detail ? `: ${cmd.detail}` : ""}`,
      { focusId: convo?.id }
    );
    await persistRoadmapToVault(updated);
    reply(
      `**Expanded step ${cmd.step}** on \`${updated.slug}\` (append-only).\n\n` +
        formatRoadmapSummary(updated, { verbose: true })
    );
    toast(`Expanded step ${cmd.step}`, "success");
    renderRoadmapPanel();
    return;
  }

  if (cmd.op === "verify") {
    const rm =
      (cmd.slug && findRoadmapBySlug(state, cmd.slug)) || activeRoadmap();
    if (!rm) {
      reply(
        "No roadmap to verify. Create one with `/roadmap <description>` or pass a slug."
      );
      return;
    }
    state.activeRoadmapSlug = rm.slug;
    toast(`Verifying ${rm.slug}…`, "");
    reply(`Running executable checks on **${rm.title}** (\`${rm.slug}\`)…`);
    let report;
    try {
      report = await runRoadmapVerification(rm, { focusId: convo?.id });
    } catch (err) {
      reply(`**Verify failed to run:** ${err?.message || err}`);
      return;
    }
    upsertRoadmap(rm);
    await persistRoadmapToVault(rm);
    try {
      await writeVerificationReportFile(
        rm.slug,
        formatVerificationReport(report),
        { focusId: convo?.id }
      );
    } catch (err) {
      console.warn("verify report write", err);
    }
    await appendRoadmapIteration(
      rm.slug,
      `verify → ${report.result} (${report.passRate}%)`,
      { focusId: convo?.id }
    );
    reply(formatVerificationReport(report));
    toast(
      report.result === "pass"
        ? `Verify pass ${report.passRate}%`
        : `Verify ${report.result} ${report.passRate}%`,
      report.result === "pass" ? "success" : ""
    );
    renderRoadmapPanel();
    return;
  }

  if (cmd.op === "step_status") {
    const rm = activeRoadmap();
    if (!rm) {
      reply("No active roadmap.");
      return;
    }
    const result = setRoadmapStepStatus(rm, cmd.step, cmd.status);
    if (!result) {
      reply(`Step **${cmd.step}** not found.`);
      return;
    }
    if (result.ok === false) {
      reply(
        `**Blocked — verification required**\n\n${result.message || result.reason}\n\n` +
          (canMarkStepComplete(result.step)
            ? ""
            : `_Last verification: **${result.step?.verification?.result || "none"}**. Run \`/roadmap verify\`._`)
      );
      toast("Complete requires verify pass", "");
      return;
    }
    const updated = result.roadmap || rm;
    upsertRoadmap(updated);
    await appendRoadmapIteration(
      updated.slug,
      `step ${cmd.step} → ${cmd.status}`,
      { focusId: convo?.id }
    );
    await persistRoadmapToVault(updated);
    reply(
      `Step **${cmd.step}** → **${cmd.status}** · roadmap **${updated.status}**\n\n` +
        formatRoadmapSummary(updated)
    );
    renderRoadmapPanel();
    return;
  }

  if (cmd.op === "status") {
    const rm =
      (cmd.slug && findRoadmapBySlug(state, cmd.slug)) || activeRoadmap();
    if (!rm) {
      reply("No roadmap found for status update.");
      return;
    }
    // Whole-roadmap complete also requires every step verified
    if (normalizeRoadmapStatusLocal(cmd.status) === "complete") {
      ensureRoadmapChecks(rm);
      const unverifiedComplete = flattenRoadmapSteps(rm).filter(
        (s) => s.status !== "complete" && !canMarkStepComplete(s)
      );
      if (unverifiedComplete.length) {
        reply(
          `**Roadmap complete blocked** — ${unverifiedComplete.length} step(s) not verified.\n` +
            `Run \`/roadmap verify ${rm.slug}\`, then mark each step complete.\n` +
            unverifiedComplete
              .slice(0, 8)
              .map((s) => `- Step ${s.n}: ${s.title}`)
              .join("\n")
        );
        toast("Verify steps before completing roadmap", "");
        return;
      }
    }
    setRoadmapStatus(rm, cmd.status);
    upsertRoadmap(rm);
    await appendRoadmapIteration(rm.slug, `roadmap status → ${cmd.status}`, {
      focusId: convo?.id,
    });
    await persistRoadmapToVault(rm);
    reply(`Roadmap \`${rm.slug}\` → **${rm.status}**`);
    renderRoadmapPanel();
    return;
  }

  reply(roadmapHelpText());
}

function normalizeRoadmapStatusLocal(s) {
  const v = String(s || "").toLowerCase().replace(/_/g, "-");
  if (v === "done" || v === "completed") return "complete";
  return v;
}

function openRoadmapPanel() {
  closeAppSettings();
  if (!els.roadmapPanel) {
    toast("Roadmap panel missing — hard-refresh", "");
    return;
  }
  els.roadmapPanel.removeAttribute("hidden");
  renderRoadmapPanel();
  try {
    els.roadmapInput?.focus();
  } catch {
    /* ignore */
  }
}

function closeRoadmapPanel() {
  if (!els.roadmapPanel) return;
  els.roadmapPanel.setAttribute("hidden", "");
}

function renderRoadmapPanel() {
  ensureRoadmapsState(state);
  const listEl = els.roadmapList;
  const detailEl = els.roadmapDetail;
  if (!listEl && !detailEl) return;

  const filter = els.roadmapStatusFilter?.value || "all";
  let items = [...(state.roadmaps || [])];
  if (filter !== "all") {
    items = items.filter((r) => r.status === filter);
  }
  items.sort(
    (a, b) =>
      Date.parse(b.updatedAt || b.createdAt || 0) -
      Date.parse(a.updatedAt || a.createdAt || 0)
  );

  if (listEl) {
    if (!items.length) {
      listEl.innerHTML =
        `<p class="roadmap-empty">No roadmaps yet. Describe a feature below or use <code>/roadmap …</code> in chat.</p>`;
    } else {
      listEl.innerHTML = items
        .map((r) => {
          const steps = flattenRoadmapSteps(r);
          const done = steps.filter((s) => s.status === "complete").length;
          const active =
            r.slug === state.activeRoadmapSlug ? " is-active" : "";
          return `<button type="button" class="roadmap-list-item${active}" data-slug="${escapeAttr(r.slug)}">
            <span class="roadmap-list-title">${escapeHtml(r.title)}</span>
            <span class="roadmap-list-meta">
              <span class="roadmap-status-chip status-${escapeAttr(r.status)}">${escapeHtml(r.status)}</span>
              <span>${done}/${steps.length}</span>
            </span>
          </button>`;
        })
        .join("");
      listEl.querySelectorAll("[data-slug]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.activeRoadmapSlug = btn.getAttribute("data-slug");
          persist();
          renderRoadmapPanel();
        });
      });
    }
  }

  if (detailEl) {
    const rm = activeRoadmap();
    if (!rm) {
      detailEl.innerHTML =
        `<p class="roadmap-empty">Select or create a roadmap. File targets: <code>js/app.js</code>, <code>js/data.js</code>, <code>js/intelligence.js</code>, <code>index.html</code>, <code>css/styles.css</code>.</p>`;
    } else {
      const steps = flattenRoadmapSteps(rm);
      const phasesHtml = (rm.phases || [])
        .map((ph) => {
          const deps = ph.dependsOn?.length
            ? `<span class="roadmap-deps">depends: ${escapeHtml(ph.dependsOn.join(", "))}</span>`
            : "";
          const stepsHtml = (ph.steps || [])
            .map((st) => {
              const files = (st.files || [])
                .map((f) => `<code>${escapeHtml(f)}</code>`)
                .join(" ");
              const acc = (st.acceptance || [])
                .map((a) => `<li>${escapeHtml(a)}</li>`)
                .join("");
              const checks = ensureStepChecks(st, rm);
              const checksHtml = checks.length
                ? `<ul class="roadmap-checks">${checks
                    .map((c) => {
                      const r = c.result || st.verification?.checks?.find(
                        (x) => x.id === c.id
                      )?.result;
                      const mark =
                        r === "pass"
                          ? "pass"
                          : r === "fail"
                            ? "fail"
                            : r === "blocked"
                              ? "blocked"
                              : "pending";
                      return `<li class="check-${mark}"><code>${escapeHtml(
                        c.kind
                      )}</code> ${escapeHtml(c.path || c.vaultPath || "")}${
                        c.pattern
                          ? ` <span class="check-pat">/${escapeHtml(c.pattern)}/</span>`
                          : ""
                      }${
                        c.evidence
                          ? ` — <span class="check-ev">${escapeHtml(
                              String(c.evidence).slice(0, 120)
                            )}</span>`
                          : ""
                      }</li>`;
                    })
                    .join("")}</ul>`
                : "";
              const vResult = st.verification?.result;
              const vChip = vResult
                ? `<span class="roadmap-status-chip status-verify-${escapeAttr(
                    vResult
                  )}" title="Verification">${escapeHtml(vResult)}</span>`
                : `<span class="roadmap-status-chip status-verify-none" title="Not verified">unverified</span>`;
              const canComplete = canMarkStepComplete(st);
              const exp = (st.expansions || [])
                .map(
                  (e) =>
                    `<li class="roadmap-expand-item"><em>${escapeHtml(e.at || "")}</em> — ${escapeHtml(e.detail || "")}</li>`
                )
                .join("");
              return `<div class="roadmap-step" data-step="${st.n}">
                <div class="roadmap-step-head">
                  <strong>Step ${st.n}: ${escapeHtml(st.title)}</strong>
                  <span class="roadmap-status-chip status-${escapeAttr(st.status)}">${escapeHtml(st.status)}</span>
                  ${vChip}
                </div>
                <div class="roadmap-step-files">${files}</div>
                <p class="roadmap-step-detail">${escapeHtml(String(st.detail || "").slice(0, 400))}</p>
                <ul class="roadmap-acceptance">${acc}</ul>
                ${checksHtml}
                ${exp ? `<ul class="roadmap-expansions">${exp}</ul>` : ""}
                <div class="roadmap-step-actions">
                  <button type="button" class="btn-secondary btn-xs" data-action="expand" data-step="${st.n}">Expand</button>
                  <button type="button" class="btn-secondary btn-xs" data-action="status" data-step="${st.n}" data-status="in-progress">In progress</button>
                  <button type="button" class="btn-secondary btn-xs" data-action="status" data-step="${st.n}" data-status="complete" ${
                    canComplete ? "" : "title=\"Requires /roadmap verify pass\" disabled"
                  }>Complete</button>
                  <button type="button" class="btn-secondary btn-xs" data-action="status" data-step="${st.n}" data-status="blocked">Blocked</button>
                </div>
              </div>`;
            })
            .join("");
          return `<section class="roadmap-phase">
            <header class="roadmap-phase-head">
              <h3>${escapeHtml(ph.title)}</h3>
              <span class="roadmap-status-chip status-${escapeAttr(ph.status || "pending")}">${escapeHtml(ph.status || "pending")}</span>
              ${deps}
            </header>
            ${stepsHtml}
          </section>`;
        })
        .join("");

      detailEl.innerHTML = `
        <header class="roadmap-detail-head">
          <div>
            <h2>${escapeHtml(rm.title)}</h2>
            <p class="roadmap-detail-meta">
              <span class="roadmap-status-chip status-${escapeAttr(rm.status)}">${escapeHtml(rm.status)}</span>
              <code>${escapeHtml(rm.slug)}</code>
              · <code>grimoire-local/roadmaps/${escapeHtml(rm.slug)}.md</code>
              · ${steps.length} steps
            </p>
          </div>
          <div class="roadmap-detail-actions">
            <button type="button" class="btn-primary btn-xs" id="btn-roadmap-verify" title="Run executable checks">Verify</button>
            <button type="button" class="btn-secondary btn-xs" id="btn-roadmap-copy-md" title="Copy markdown">Copy MD</button>
            <button type="button" class="btn-secondary btn-xs" id="btn-roadmap-set-progress">Mark in-progress</button>
          </div>
        </header>
        <p class="roadmap-intent">${escapeHtml(String(rm.description || "").slice(0, 500))}</p>
        <div class="roadmap-files-row">${(rm.fileTargets || [])
          .map((f) => `<code>${escapeHtml(f)}</code>`)
          .join(" ")}</div>
        ${
          rm.lastVerification
            ? `<p class="roadmap-verify-meta">Last verify: <strong>${escapeHtml(
                rm.lastVerification.result || "?"
              )}</strong> · ${escapeHtml(
                String(rm.lastVerification.passRate ?? "?")
              )}% · ${escapeHtml(rm.lastVerification.at || "")}</p>`
            : `<p class="roadmap-verify-meta">Not verified yet — run <code>/roadmap verify</code> before marking steps complete.</p>`
        }
        ${phasesHtml}
      `;

      detailEl.querySelector("#btn-roadmap-copy-md")?.addEventListener("click", async () => {
        const md = formatRoadmapMarkdown(rm);
        try {
          await navigator.clipboard.writeText(md);
          toast("Roadmap markdown copied", "success");
        } catch {
          toast("Copy failed", "");
        }
      });
      detailEl.querySelector("#btn-roadmap-verify")?.addEventListener("click", () => {
        const c = activeConvo();
        void handleRoadmapCommand(
          c,
          { op: "verify", slug: rm.slug },
          `/roadmap verify ${rm.slug}`
        );
      });
      detailEl
        .querySelector("#btn-roadmap-set-progress")
        ?.addEventListener("click", () => {
          setRoadmapStatus(rm, "in-progress");
          upsertRoadmap(rm);
          void persistRoadmapToVault(rm);
          renderRoadmapPanel();
          toast("Roadmap in-progress", "");
        });
      detailEl.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-action");
          const step = Number(btn.getAttribute("data-step"));
          const c = activeConvo();
          if (action === "expand") {
            const note = window.prompt(
              `Expand step ${step} (optional notes — append-only):`,
              ""
            );
            if (note === null) return;
            void handleRoadmapCommand(
              c,
              { op: "expand", step, detail: note },
              `expand step ${step}`
            ).then(() => renderRoadmapPanel());
          } else if (action === "status") {
            const status = btn.getAttribute("data-status");
            void handleRoadmapCommand(
              c,
              { op: "step_status", step, status },
              `/roadmap step ${step} ${status}`
            ).then(() => renderRoadmapPanel());
          }
        });
      });
    }
  }
}

async function generateRoadmapFromPanel(mode) {
  const text = String(els.roadmapInput?.value || "").trim();
  if (!text) {
    toast("Describe a feature or paste a SCROLL roadmap", "");
    return;
  }
  const convo = activeConvo();
  const op =
    mode === "parse" || looksLikeScrollRoadmap(text) ? "parse" : "create";
  await handleRoadmapCommand(convo, { op, text, raw: text }, text);
  if (els.roadmapInput) els.roadmapInput.value = "";
  renderRoadmapPanel();
}

/* ─── EVG ─── */

function openGallery() {
  const convo = activeConvo();
  if (!convo) {
    toast("Select a focus first", "");
    return;
  }
  renderGallery(convo);
  try {
    els.galleryDialog?.showModal?.();
  } catch {
    els.galleryDialog?.removeAttribute?.("hidden");
  }
}

function closeGallery() {
  try {
    els.galleryDialog?.close?.();
  } catch {
    els.galleryDialog?.setAttribute?.("hidden", "");
  }
}

function renderGallery(convo) {
  const container = els.galleryBody;
  if (!container) return;
  const items = [];
  for (const m of (convo.messages || [])) {
    for (const img of (m.images || [])) {
      items.push({
        src: img,
        text: (m.text || "").trim(),
        ts: m.ts,
        role: m.role,
      });
    }
  }
  if (!items.length) {
    container.innerHTML = `<p class="gallery-empty">No images captured for this Focus yet.</p>`;
    return;
  }
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "gallery-grid";
  for (const item of items) {
    const card = document.createElement("div");
    card.className = "gallery-card";
    const imgEl = document.createElement("img");
    imgEl.src = item.src;
    imgEl.alt = "Focus-captured image";
    imgEl.loading = "lazy";
    const caption = document.createElement("div");
    caption.className = "gallery-caption";
    const roleText = item.role === "user" ? "YOU" : item.role === "grimoire" ? "GRIMOIRE" : item.role || "—";
    const dateText = item.ts ? new Date(item.ts).toLocaleString() : "";
    caption.innerHTML = `
      <div class="gallery-meta">${escapeHtml(roleText)}${dateText ? ` · ${escapeHtml(dateText)}` : ""}</div>
      <div class="gallery-intel">${escapeHtml(item.text.slice(0, 240))}${item.text.length > 240 ? "…" : ""}</div>
    `;
    card.appendChild(imgEl);
    card.appendChild(caption);
    card.addEventListener("click", () => {
      openGalleryLightbox(item);
    });
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

function openGalleryLightbox(item) {
  const overlay = document.createElement("div");
  overlay.className = "gallery-lightbox";
  overlay.innerHTML = `
    <button type="button" class="gallery-lightbox-close" aria-label="Close">×</button>
    <div class="gallery-lightbox-body">
      <img src="${escapeAttr(item.src)}" alt="Focus-captured image" />
      <div class="gallery-lightbox-intel">
        <div class="gallery-meta">${escapeHtml(item.role === "user" ? "YOU" : item.role === "grimoire" ? "GRIMOIRE" : (item.role || "—"))}${item.ts ? ` · ${escapeHtml(new Date(item.ts).toLocaleString())}` : ""}</div>
        <div class="gallery-intel">${escapeHtml(item.text || "")}</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest(".gallery-lightbox-close")) {
      overlay.remove();
    }
  });
}

els.btnSidebarToggle?.addEventListener("click", () => {
  toggleSidebar();
});

els.focusSearch?.addEventListener("input", () => {
  onFocusSearchInput();
});
els.focusSearch?.addEventListener("search", () => {
  onFocusSearchInput();
});
els.btnNewFolder?.addEventListener("click", () => {
  createFocusFolder();
});

els.btnOpenGallery?.addEventListener("click", () => {
  openGallery();
});

els.btnGalleryClose?.addEventListener("click", () => {
  closeGallery();
});

function resetApp() {
  if (
    !confirm(
      "Reset Grimoire? Clears all focuses, spells, and browser state. Reloads clean seed (GRIMOIRE only)."
    )
  )
    return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("grimoire-mvp-v1");
    localStorage.removeItem("grimoire-state-v1");
    localStorage.removeItem("grimoire-sidebar-collapsed-v1");
    // drop any vault handle hints
    for (const k of Object.keys(localStorage)) {
      if (/^grimoire/i.test(k)) localStorage.removeItem(k);
    }
  } catch {}
  toast("App reset — reloading clean…", "success");
  location.reload();
}

els.btnResetApp?.addEventListener("click", resetApp);

// New Focus form also bound in bindNewFocusAll / capture submit — keep els path too
els.newForm?.addEventListener("submit", submitNewFocusForm);

// ─── Utils ───

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMessageHtml(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeAttr(str) {
  return escapeHtml(String(str)).replace(/'/g, "&#39;");
}

// ─── Boot ───

// Purge legacy auto-discovery suggestion messages (sealed channel purity)
state.conversations.forEach((c) => {
  c.messages = (c.messages || []).filter((m) => m.kind !== "focus-suggestion");
  ensureAlignmentDirective(c);
});
// Promote ghost-cast spells (lifecycle stamps without status:"sent") so badges match Active
healSpellLifecycles();
persist();

// Universe Engine — canvas cosmos behind HUD (force starfield on boot)
if (els.universeCanvas) {
  initUniverse(els.universeCanvas, {
    onHud: (info) => {
      // Live star fill + temporal densen (age / vault progress)
      if (els.universeHudCount) els.universeHudCount.textContent = String(info.starCount || 0);
      if (els.universeHudStage) {
        const stageName = info.stageName || "VOID";
        const densenPct = Math.round(Math.max(0, Math.min(1, info.densenProgress || 0)) * 100);
        const densenBit = densenPct > 0 ? ` · densen ${densenPct}%` : "";
        const ageBit = info.ageLabel ? ` · age ${info.ageLabel}` : "";
        els.universeHudStage.textContent = `${stageName}${densenBit}${ageBit}`;
      }
    },
  });
  // Immediate void sky before Focus snapshot — never black frame
  setFocusUniverse(null, { warp: false });
}

els.universeHud?.addEventListener("click", () => {
  toggleAtlas();
});
els.btnAtlasClose?.addEventListener("click", () => setAtlasOpen(false));

// Final boot paint — isolated so a single throw cannot leave a dead UI
(function finalBoot() {
  try {
    // Ensure an active focus so chat is never stuck on static empty shell
    ensureActiveFocus(state);
    mergeDuplicateSealedFocuses(state);

    setSpellsOpen(Boolean(state.spellsOpen));
    applySidebarCollapsed(loadSidebarCollapsed());
    applyUniverseViewMode();
    // Silent merge of kind+purpose duplicates on load
    state.spells = dedupeSpells(
      (state.spells || []).filter((s) => !isReceiptSpell(s))
    );
    // Restore copy→await-paste timers (persisted awaitingReply)
    try {
      restoreAwaitReplyTimers();
    } catch (err) {
      console.warn("[boot] restoreAwaitReplyTimers", err);
    }
    // Restore autonomous self-message loops (recursive intelligence chains)
    try {
      restoreSelfMessageLoops();
    } catch (err) {
      console.warn("[boot] restoreSelfMessageLoops", err);
    }
    // Fleet Command: breathing poller + autonomous auto-cast
    try {
      ensureFleetCommandState(state);
      startBreathingPoller();
    } catch (err) {
      console.warn("[boot] fleet breathing poller", err);
    }
    // Boot: auto-generate curiosity + proactive ENGAGE for active Focus
    {
      const bootFocus = activeConvo();
      if (bootFocus && !isFocusLocked(bootFocus)) {
        try {
          autoGenerateCuriositySpells(bootFocus, { silentToast: true });
          autoGenerateNodeEngageSpells(bootFocus, { silentToast: true });
        } catch (err) {
          console.warn("[boot] curiosity/engage", err);
        }
      }
    }
    renderAll();
    // Initial universe for active focus (no warp on first paint)
    {
      const snap = deriveFocusSnapshot(activeConvo(), state.spells);
      setFocusUniverse(snap, { warp: false });
      updateUniverseHudChrome(snap);
    }
    try {
      persist();
    } catch {
      /* ignore */
    }
  } catch (err) {
    console.error("[grimoire] finalBoot failed", err);
    try {
      window.__GrimoireErrors = window.__GrimoireErrors || [];
      window.__GrimoireErrors.push({
        from: "finalBoot",
        message: String(err?.message || err),
        stack: err?.stack || null,
      });
    } catch {
      /* ignore */
    }
    // Last-ditch: at least paint sidebar + chat shell
    try {
      ensureActiveFocus(state);
      renderConvoList();
      renderChat();
    } catch (err2) {
      console.error("[grimoire] last-ditch paint failed", err2);
    }
  }
})();

// Self-init intelligence vault (creates GRIMOIRE-FocusIntelligence/)
/* catch-wrapper for renderAll */
(function () {
  var _orig = renderAll;
  renderAll = function () {
    try {
      _orig.call(this);
    } catch (err) {
      console.error("[renderAll] caught", err);
      if (window.__GrimoireErrors)
        window.__GrimoireErrors.push({
          from: "renderAll",
          message: err.message,
          stack: err.stack,
        });
    }
  };
})();

try {
  bootstrapIntelligenceVault().finally(() => {
    if (activeConvo()) els.chatInput?.focus();
  });
} catch (err) {
  console.warn("[boot] bootstrapIntelligenceVault", err);
}

window.addEventListener("error", (ev) => {
  console.warn("[app-global] error", ev.message, ev.filename, ev.lineno);
});
window.addEventListener("unhandledrejection", (ev) => {
  console.warn("[app-global] unhandledrejection", ev.reason);
});

/**
 * Spell Crafter: evaluate upgrade after cast/forge.
 * Mutates spell in place when conditions are met.
 */
async function tryUpgradeSpell(spell, convo) {
  if (!spell || !convo) return;
  ensureSpellCrafterFields(spell);
  const ctx = await buildSpellCrafterContext(convo);
  const upgrade = evaluateSpellUpgrade(spell, ctx);
  if (!upgrade) return;

  applySpellUpgrade(spell, upgrade, { refine: true });
  toast(`✦ Spell upgraded: ${upgrade.fromTier} → ${upgrade.toTier}`, "success");
}

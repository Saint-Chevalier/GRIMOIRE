/**
 * Execution Directive 011 — in-memory node registry + dispatch helpers.
 * Vault I/O lives in intelligence.js. API keys never live here.
 */

export const NODE_TYPES = Object.freeze(["cli", "api", "local", "discord", "telegram"]);
export const DISPATCH_PROTOCOLS = Object.freeze(["clipboard", "http"]);
export const NODE_STATUSES = Object.freeze(["active", "inactive", "error"]);
export const NODE_REGISTRY_PATH = "nodes/registry.json";
export const NODE_SECRETS_DIR = "nodes/secrets";

export function defaultDispatchProtocol(type) {
  const t = String(type || "").toLowerCase();
  return t === "api" || t === "local" ? "http" : "clipboard";
}

export function makeNodeId(name) {
  const slug =
    String(name || "node")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "node";
  return `node-${slug}`;
}

export function publicNodeView(node) {
  if (!node || typeof node !== "object") return null;
  const out = { ...node };
  delete out.api_key;
  delete out.apiKey;
  delete out.secret;
  return out;
}

export function normalizeNode(raw = {}) {
  const type = NODE_TYPES.includes(String(raw.type || "").toLowerCase())
    ? String(raw.type).toLowerCase()
    : "cli";
  const name = String(raw.name || "").trim() || "Unnamed node";
  const id = String(raw.id || "").trim() || makeNodeId(name);
  const protocol = DISPATCH_PROTOCOLS.includes(String(raw.dispatch_protocol || "").toLowerCase())
    ? String(raw.dispatch_protocol).toLowerCase()
    : defaultDispatchProtocol(type);
  const status = NODE_STATUSES.includes(String(raw.status || "").toLowerCase())
    ? String(raw.status).toLowerCase()
    : "active";
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    name,
    type,
    endpoint: String(raw.endpoint || (type === "cli" ? "local" : "")).trim(),
    model: String(raw.model || "").trim(),
    medium: String(raw.medium || "").trim(),
    status,
    created: String(raw.created || today),
    last_used: raw.last_used ? String(raw.last_used) : null,
    spells_sent: Number(raw.spells_sent) || 0,
    replies_received: Number(raw.replies_received) || 0,
    notes: String(raw.notes || "").trim(),
    api_key_ref: raw.api_key_ref ? String(raw.api_key_ref) : null,
    has_api_key: Boolean(raw.has_api_key || raw.api_key_ref),
    dispatch_protocol: protocol,
    auto_capture_replies: Boolean(raw.auto_capture_replies),
  };
}

export function seedDefaultNodes() {
  return [
    normalizeNode({
      id: "node-grok-build",
      name: "Grok Build",
      type: "cli",
      endpoint: "local",
      model: "grok",
      medium: "git-bash-cli",
      status: "active",
      dispatch_protocol: "clipboard",
      notes: "Primary build node. Operator launches manually.",
    }),
  ];
}

function emptyRegistry() {
  return { version: 1, nodes: seedDefaultNodes() };
}

let registry = emptyRegistry();

export function getNodeRegistry() {
  return registry;
}

export function setNodeRegistry(next) {
  const nodes = Array.isArray(next?.nodes) ? next.nodes.map((n) => normalizeNode(publicNodeView(n))) : [];
  registry = {
    version: Number(next?.version) || 1,
    nodes: nodes.length ? nodes : seedDefaultNodes(),
  };
  return registry;
}

/** In-memory load (vault hydrate is intelligence.loadNodeRegistry). */
export function loadNodeRegistry() {
  if (!registry?.nodes?.length) registry = emptyRegistry();
  return registry;
}

export function saveNodeRegistry(next) {
  if (next) setNodeRegistry(next);
  return registry;
}

export function getActiveNodes() {
  return (registry.nodes || []).filter((n) => n.status === "active");
}

export function getNodeById(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  return (registry.nodes || []).find((n) => n.id === key) || null;
}

export function createNode(partial) {
  const node = normalizeNode(partial || {});
  if (!String(partial?.name || "").trim()) {
    throw new Error("Node name is required");
  }
  if ((node.type === "api" || node.type === "local") && !node.endpoint) {
    throw new Error("Endpoint is required for api/local nodes");
  }
  if (getNodeById(node.id)) {
    node.id = `${node.id}-${Math.random().toString(36).slice(2, 6)}`;
  }
  registry.nodes.push(node);
  return node;
}

export function updateNode(id, updates) {
  const node = getNodeById(id);
  if (!node) throw new Error("Node not found");
  const merged = normalizeNode({ ...node, ...(updates || {}), id: node.id });
  const idx = registry.nodes.findIndex((n) => n.id === node.id);
  registry.nodes[idx] = merged;
  return merged;
}

export function deleteNode(id) {
  const key = String(id || "").trim();
  const before = registry.nodes.length;
  registry.nodes = registry.nodes.filter((n) => n.id !== key);
  return registry.nodes.length < before;
}

export function normalizeSpellTarget(raw, node = null) {
  const src = node || (raw && typeof raw === "object" ? raw : null);
  if (src && (src.node_id || src.id)) {
    const n = src.id && src.name ? src : getNodeById(src.node_id || src.id);
    const resolved = n || src;
    return {
      node_id: String(resolved.id || resolved.node_id || "").trim(),
      node_name: String(resolved.name || resolved.node_name || "").trim(),
      node_type: String(resolved.type || resolved.node_type || "cli"),
      dispatch_protocol: String(
        resolved.dispatch_protocol || defaultDispatchProtocol(resolved.type || resolved.node_type)
      ),
      channel: String(resolved.channel || resolved.medium || "default"),
    };
  }
  if (typeof raw === "string" && raw.trim()) {
    const hit =
      getActiveNodes().find((n) => n.name.toLowerCase() === raw.trim().toLowerCase()) ||
      getNodeById(raw.trim());
    if (hit) return normalizeSpellTarget(null, hit);
  }
  return null;
}

export function spellHasNodeTarget(spell) {
  const t = spell?.targetNode || spell?.target_node;
  return Boolean(t && (t.node_id || t.id));
}

export function spellTargetLabel(spell) {
  const t = spell?.targetNode || spell?.target_node;
  if (t?.node_name) return String(t.node_name);
  if (typeof spell?.target === "string" && spell.target.trim()) return spell.target.trim();
  return "";
}

export function assignSpellTarget(spell, node) {
  if (!spell) return spell;
  const target = normalizeSpellTarget(null, node);
  if (target) {
    spell.targetNode = target;
    spell.target = target.node_name;
  }
  return spell;
}

export function validateCapturedReply(text, spell) {
  const reply = String(text || "").trim();
  if (!reply) return { ok: false, reason: "empty" };
  const body = String(spell?.content || spell?.message || spell?.spell_text || "").trim();
  if (body && reply === body) return { ok: false, reason: "same-as-spell" };
  return { ok: true, reply };
}

export function httpAuthStyle(node) {
  const ep = String(node?.endpoint || "").toLowerCase();
  const model = String(node?.model || "").toLowerCase();
  if (/anthropic/.test(ep) || /claude/.test(model)) return "anthropic";
  if (/ollama|11434/.test(ep) || node?.type === "local") return "local";
  return "bearer";
}

export function resolveHttpEndpoint(node) {
  let ep = String(node?.endpoint || "").trim();
  if (!ep) return "";
  if (!/^https?:\/\//i.test(ep)) {
    if (/^localhost|^127\./i.test(ep)) ep = `http://${ep}`;
  }
  if (/\/chat\/completions\/?$|\/messages\/?$|\/api\/chat\/?$/.test(ep)) return ep.replace(/\/$/, "");
  if (/11434/.test(ep) || /ollama/i.test(ep)) return ep.replace(/\/$/, "") + "/api/chat";
  if (httpAuthStyle(node) === "anthropic") return ep.replace(/\/$/, "") + "/v1/messages";
  return ep.replace(/\/$/, "") + "/v1/chat/completions";
}

export function buildHttpDispatchPayload(spell, node) {
  const spellText = String(spell?.content || spell?.message || spell?.spell_text || "").trim();
  const context = String(spell?.context || spell?.subtitle || spell?.essence || "").trim();
  const style = httpAuthStyle(node);
  if (style === "anthropic") {
    return {
      model: node?.model || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.7,
      system: spellText,
      messages: [{ role: "user", content: context || "Execute the spell." }],
    };
  }
  if (style === "local" && /ollama|11434/.test(String(node?.endpoint || ""))) {
    return {
      model: node?.model || "llama3",
      stream: false,
      messages: [
        { role: "system", content: spellText },
        { role: "user", content: context || "Execute the spell." },
      ],
    };
  }
  return {
    model: node?.model || "gpt-4o-mini",
    messages: [
      { role: "system", content: spellText },
      { role: "user", content: context || "" },
    ],
    max_tokens: 4096,
    temperature: 0.7,
  };
}

export function parseHttpDispatchReply(data) {
  if (data == null) return "";
  if (typeof data === "string") return data;
  const openai = data?.choices?.[0]?.message?.content;
  if (openai) return String(openai);
  const anth = data?.content?.[0]?.text;
  if (anth) return String(anth);
  if (data?.message?.content) return String(data.message.content);
  if (data?.response) return String(data.response);
  return "";
}

export function registryForVault(reg = registry) {
  return {
    version: Number(reg?.version) || 1,
    nodes: (reg?.nodes || []).map((n) => {
      const row = publicNodeView(normalizeNode(n));
      delete row.api_key;
      delete row.apiKey;
      return row;
    }),
  };
}

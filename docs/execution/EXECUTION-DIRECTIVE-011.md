# Execution Directive 011
**From:** Cell2 (analysis/proposal)  
**To:** Val / GBS / GBG (execute on own substrate)  
**Via:** Cell1 (operator gate — approved)  
**Re:** GRIMOIRE AI connection layer — external node dispatch, reply capture, vault-stored node registry  
**Date:** 2026-08-25  
**Priority:** Critical — spells are circular without real AI targets

## Context
Operator feedback: "we are going to make grimoire app able to connect ai." Current spell system forges spells with targets, but the only available target is the app itself. Spells need real AI endpoints: Grok, Claude, Hermes, ChatGPT, local models. This directive builds the connection layer.

## Architecture principles
1. **API keys never leave the vault** — `D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\` is the only storage location for credentials
2. **Node registry is vault-only** — stored in `nodes/` subfolder, gitignored, never committed
3. **Dispatch is explicit** — operator chooses which node receives each spell; no silent auto-send
4. **Reply capture is manual by default** — operator pastes reply back into focus; auto-capture is opt-in per node
5. **Local-first, no cloud relay** — all calls go direct from browser to AI endpoint; GRIMOIRE app is not a proxy

## Execution items

### 1. Node registry schema and storage
**Create vault-backed node registry:**

**Storage location:** `D:\GRIMOIRE\GRIMOIRE-FocusIntelligence\nodes\registry.json` (gitignored)

**Schema per node:**
```json
{
  "id": "node-grok-build",
  "name": "Grok Build",
  "type": "cli",
  "endpoint": "local",
  "model": "grok",
  "medium": "git-bash-cli",
  "status": "active",
  "created": "2026-08-25",
  "last_used": "2026-08-25",
  "spells_sent": 0,
  "replies_received": 0,
  "notes": "Primary build node. Operator launches manually.",
  "api_key_ref": null,
  "dispatch_protocol": "clipboard",
  "auto_capture_replies": false
}
```

**Supported node types:**
- `cli` — Grok Build CLI, Hermes CLI, etc. (clipboard dispatch)
- `api` — OpenAI, Anthropic, xAI API endpoints (HTTP dispatch)
- `local` — local model endpoints (Ollama, LM Studio, etc.)
- `discord` — Discord bot relay
- `telegram` — Telegram bot relay

**Required functions in `js/data.js`:**
- `loadNodeRegistry()` — reads `nodes/registry.json` from vault
- `saveNodeRegistry(registry)` — writes to vault
- `createNode(node)` — adds new node, validates schema
- `updateNode(id, updates)` — patches node fields
- `deleteNode(id)` — removes node, archives spells
- `getActiveNodes()` — returns nodes with `status: "active"`
- `getNodeById(id)` — single node lookup

**Files:** `js/data.js`, `js/intelligence.js`

**Acceptance:**
- [ ] `nodes/registry.json` created in vault
- [ ] CRUD functions work
- [ ] Registry loads on app init
- [ ] Nodes appear in Intelligence Audit panel

### 2. Spell target resolution
**Current state:** Spells have a `target` field but it’s just a string label.

**Required change:**
- `target` becomes a structured object:
  ```js
  {
    "node_id": "node-grok-build",
    "node_name": "Grok Build",
    "node_type": "cli",
    "dispatch_protocol": "clipboard",
    "channel": "default"
  }
  ```
- When forging a spell, operator selects target from active nodes dropdown
- If no nodes exist, show: “No nodes configured. Add a node in Settings → Nodes.”
- Spell detail view shows target node name, type, and last-used date
- Casting a spell with no target shows error toast: “Spell has no target. Assign a node before casting.”

**Files:** `js/app.js`, `js/data.js`, `index.html`, `css/styles.css`

**Acceptance:**
- [ ] Spell target is a structured node reference
- [ ] Target selector dropdown populated from active nodes
- [ ] Spell detail shows target metadata
- [ ] Cast blocks if target missing
- [ ] Target persists across sessions

### 3. Dispatch engine — clipboard protocol (cli nodes)
**For CLI-type nodes (Grok Build, Hermes CLI, etc.):**

**Flow:**
1. Operator clicks “Cast Spell” or “Copy Spell”
2. App copies full spell text to clipboard
3. App shows toast: “Spell copied — paste into [Node Name]”
4. Operator manually pastes into the AI CLI/chat
5. Operator receives reply
6. Operator pastes reply back into GRIMOIRE focus
7. GRIMOIRE captures reply as experience, updates spell status

**Required implementation:**
- `dispatchSpellToClipboard(spell, node)` — copies spell text, shows toast with node name
- `captureReplyFromClipboard(spellId)` — reads clipboard, validates it’s a reply (not empty, not same as spell), writes to vault
- Clipboard API with fallback for older browsers
- Debug logging: `[dispatch] copy`, `[dispatch] paste`, `[dispatch] error`

**Files:** `js/app.js`, `js/data.js`

**Acceptance:**
- [ ] “Copy Spell” copies full spell text to clipboard
- [ ] Toast shows target node name
- [ ] “Paste Reply” captures clipboard content
- [ ] Reply validates as non-empty and different from spell
- [ ] Reply writes to vault as experience
- [ ] Spell status updates after reply capture

### 4. Dispatch engine — HTTP protocol (api/local nodes)
**For API-type nodes (OpenAI, Anthropic, xAI, local endpoints):**

**Flow:**
1. Operator clicks “Send Spell”
2. App constructs HTTP request to node endpoint with spell payload
3. Node responds with reply
4. GRIMOIRE captures reply automatically
5. Spell status updates

**Required implementation:**
- `dispatchSpellToHTTP(spell, node)` — POST to node endpoint with headers
- Request body:
  ```json
  {
    "model": node.model,
    "messages": [
      {"role": "system", "content": spell.spell_text},
      {"role": "user", "content": spell.context || ""}
    ],
    "max_tokens": 4096,
    "temperature": 0.7
  }
  ```
- Response handler captures `choices[0].message.content`
- Error handling: network failure, auth failure, rate limit
- API key stored in vault, never in code or localStorage
- Debug logging: `[dispatch] http send`, `[dispatch] http receive`, `[dispatch] http error`

**Files:** `js/app.js`, `js/data.js`, `js/intelligence.js`

**Acceptance:**
- [ ] HTTP dispatch sends spell to endpoint
- [ ] Response captured and written to vault
- [ ] API key read from vault, never exposed
- [ ] Errors show toast, don’t crash
- [ ] Debug logging for all HTTP stages

### 5. Node management UI
**Required interface:**

**Settings → Nodes tab:**
- List of configured nodes with name, type, status, last-used
- Add Node button → form with fields:
  - Name (required)
  - Type (cli/api/local/discord/telegram dropdown)
  - Model/OS (optional)
  - Endpoint (for API/local types — required if type is api/local)
  - Dispatch protocol (clipboard/http — auto-selected based on type)
  - Auto-capture replies (toggle)
  - API key (for API types — stored in vault, masked in UI)
- Edit/Delete per node
- Test connection button (for API types — sends ping, checks response)

**Files:** `index.html`, `css/styles.css`, `js/app.js`, `js/data.js`

**Acceptance:**
- [ ] Nodes tab in Settings
- [ ] Add/Edit/Delete nodes
- [ ] API key field masked in UI, stored in vault
- [ ] Test connection button works for API nodes
- [ ] Node list shows status and last-used

### 6. Security enforcement
**Required checks:**

- API keys stored only in vault (`nodes/registry.json` or `nodes/secrets/`)
- API keys never written to localStorage, sessionStorage, or URL params
- API keys never logged in debug output
- Node registry is gitignored
- Pre-commit hook blocks any node config file from being staged
- CI check fails if node config appears in PR
- `screenDeltaIntelligence()` from Directive 008 must flag API keys as PRIVATE

**Files:** `.gitignore`, `tools/guard-vault-staged.mjs`, `tools/screen-delta-intelligence.mjs`

**Acceptance:**
- [ ] API keys never leave vault
- [ ] Node registry gitignored
- [ ] Pre-commit hook blocks node config staging
- [ ] Screening protocol flags keys as PRIVATE

### 7. Integration with existing spell system
**Required wiring:**

- Spell forge flow: select target node → forge spell → spell has node reference
- Spell cast flow: check target → dispatch via clipboard or HTTP → capture reply → update spell status
- Spell detail view: show target node, dispatch status, reply history
- Intelligence Audit → Nodes tab: show node stats, spells sent, replies received
- Bus activity: log dispatch events (spell sent, reply received)

**Files:** `js/app.js`, `js/data.js`, `js/intelligence.js`, `index.html`

**Acceptance:**
- [ ] Spell forge includes target node selection
- [ ] Spell cast dispatches to correct node
- [ ] Reply capture updates spell status
- [ ] Nodes tab shows stats
- [ ] Bus logs dispatch events

## Execution rules
- Val / GBS / GBG executes on their own substrates
- Cell2 does NOT edit files directly
- Each item must be independently verifiable
- Commit messages must reference this directive: `Execution Directive 011`
- This directive is BLOCKING for open-source public launch — do not remove security checks

## Acceptance criteria
- [ ] Node registry CRUD works in vault
- [ ] Spells have structured node targets
- [ ] Clipboard dispatch copies spell, captures reply
- [ ] HTTP dispatch sends to endpoint, captures response
- [ ] Node management UI functional
- [ ] API keys never leave vault
- [ ] Node registry gitignored and protected
- [ ] Spell cast/dispatch/reply cycle works end-to-end
- [ ] All changes committed with reference to this directive

## Reporting
After execution, report back to Cell1 with:
- File paths and commit hash per item
- Test results for clipboard dispatch and HTTP dispatch
- Confirmation that API keys are vault-only
- Screenshots of node management UI
- Any endpoints that could not be completed and why

## IMPORTANT
- This is the layer that makes spells real. Execute with precision.
- When in doubt, favor explicit operator action over silent automation.
- The operator is the message bus. The app is the spellbook. The node is the destination.

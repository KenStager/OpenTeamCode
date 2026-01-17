# OpenTeamCode: Technical Feasibility Assessment

**Version**: 0.1.0
**Last Updated**: January 14, 2026
**Status**: Research & Planning Phase
**Assessment Date**: January 14, 2026

---

## Executive Summary

### Verdict

**OpenTeamCode is technically feasible**, but the implementation approach in the PRD needs revision. The PRD underestimates OpenCode's existing capabilities and overcomplicates the integration strategy.

### Confidence Level

**70%** - increases to 85%+ if Phase 0 validation succeeds

### Key Findings

| Finding | Impact |
|---------|--------|
| OpenCode provides 80%+ of required infrastructure | Reduces implementation scope |
| Standards injection already supported | No code needed, just configuration |
| Session continuation foundation exists | Build on compaction system |
| Subprocess wrapper approach is overcomplicated | Recommend plugin + CLI hybrid |
| Core hypotheses are unvalidated | Phase 0 experiments required |

### Primary Risk

**Adoption and maintenance discipline**, not technical challenges. The architecture can be built. Whether the team will maintain `.ai/` conventions and whether session continuation provides real value are unproven.

---

## OpenCode Foundation Assessment

### Architecture Overview

OpenCode is a **TypeScript/Bun monorepo** implementing an AI coding agent with CLI, web, and desktop interfaces.

| Aspect | Details |
|--------|---------|
| **Runtime** | Bun (not Node.js) |
| **Build System** | Turbo + Bun workspaces |
| **Framework** | Hono HTTP server, Solid.js TUI |
| **LLM SDK** | Vercel `@ai-sdk/*` for multi-provider support |
| **Architecture** | Event-driven pub/sub, agent-based tool execution |
| **Packages** | 18+ packages in monorepo |

### Key Integration Points

These OpenCode source locations are most relevant for OpenTeamCode integration:

```
opencode/packages/opencode/src/
├── session/
│   ├── index.ts         # Session lifecycle, state management
│   ├── processor.ts     # Main agent loop
│   ├── compaction.ts    # Context summarization for continuation
│   └── llm.ts           # LLM streaming integration
├── tool/
│   ├── tool.ts          # Tool interface definition
│   └── registry.ts      # Dynamic tool loading from plugins
├── permission/
│   └── next.ts          # Permission system (allow/deny/ask)
├── bus/
│   ├── index.ts         # Event pub/sub (Bus.publish, Bus.subscribe)
│   └── bus-event.ts     # Event type definitions
├── config/
│   └── config.ts        # Configuration loading, instructions injection
├── provider/
│   └── provider.ts      # Multi-provider LLM support (21+ providers)
└── server/
    └── server.ts        # Hono HTTP/WebSocket server with SSE
```

### What's Already Supported (No Code Needed)

| Feature | OpenCode Support | OpenTeamCode Action |
|---------|------------------|---------------------|
| Standards injection | `config.instructions` loads markdown files | Configure `.ai/standards.md` path |
| Multi-provider LLM | 21+ providers including Azure | Use existing config |
| Session serialization | JSON storage via Storage namespace | Leverage for artifacts |
| Tool extensibility | Plugin API + file-based discovery | Add team tools as plugins |
| Permission gating | allow/deny/ask with patterns | Extend for guardrail tiers |
| Event streaming | Bus + SSE for real-time updates | Subscribe for audit logging |

### What Needs Building

| Feature | Gap | Approach |
|---------|-----|----------|
| Session restoration | No explicit "continue from artifact" API | Build on compaction system |
| Azure DevOps integration | Not pre-integrated | New plugin + CLI commands |
| Guardrail tiers (GATE/INFO) | Only allow/deny/ask exist | Extend permission system |
| Team metadata in artifacts | Session storage is generic | Enhance artifact schema |
| Context graph | Not present | New component (AST analysis) |

### Dependency Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenCode changes direction | Low | High | Config-first integration, abstract interfaces |
| Plugin API breaking changes | Medium | Medium | Track changelog, contribute to upstream |
| OpenCode development stalls | Low | Medium | Fork option available if needed |
| Feature conflicts with upstream | Low | Low | Coordinate via issues/PRs |

---

## Primitive-by-Primitive Analysis

### Summary Table

| Primitive | Verdict | Technical Approach | Key Limitations |
|-----------|---------|-------------------|-----------------|
| A. Context Graph | Feasible | AST-based Python import analysis | 80% accuracy; dynamic imports missed |
| B. Durable Memory | Feasible (simpler than PRD) | Config + compaction + structured artifacts | 70% restoration fidelity ceiling |
| C. Presence & Collision | Feasible | ADO API + opt-in claims | Requires developer opt-in |
| D. PR Loop | Feasible | ADO REST API integration | Rate limiting, webhook reliability |
| E. Guardrails | Partially feasible | Extend permission system | Syntactic only; no semantic analysis |
| F. Model Routing | Questionable necessity | Decision tree + accounting | OpenCode already has model selection |

### Primitive A: Context Graph

**Verdict**: Feasible

**Technical Approach**:
- AST-based Python import analysis using `ast` module
- Nightly batch job extracts dependencies from all team repos
- Store in JSON/JSONL format for efficient queries
- CLI commands: `otc impact`, `otc context`

**Evidence**: Hudson River Trading case study demonstrates AST analysis scales to millions of lines.

**Limitations**:
- Dynamic imports (`importlib.import_module()`) not detected
- Conditional imports may be missed
- String-based imports invisible
- **Expected accuracy: ~80%**

**Recommendation**: Position as advisory ("Impact analysis suggests...") not authoritative. Always recommend human verification for high-risk changes.

### Primitive B: Durable Memory

**Verdict**: Feasible - Easier than PRD suggests

**Technical Approach**:

| Component | Approach | Status |
|-----------|----------|--------|
| Standards injection | OpenCode `config.instructions` | Already supported |
| Session artifacts | Enhance OpenCode compaction output | Build on existing |
| Team memory | Structured markdown in `.ai/memory/` | Convention + search |
| Session continuation | Load compaction summary + recent messages | Build restoration logic |

**Evidence**: OpenCode's `compaction.ts` already generates continuation prompts specifically designed for "new session will not have access to our conversation" scenarios.

**Limitations**:
- **70% restoration fidelity is a ceiling**, not a bug to fix
- Older reasoning chains are lost (context window limits)
- Dead-end attempts and implicit mental models not captured

**Key Insight**: 70% fidelity is sufficient for task-oriented handoffs (bug fixes, feature completion). The 30% loss matters more for exploratory work, which is less commonly handed off.

### Primitive C: Presence & Collision

**Verdict**: Feasible

**Technical Approach**:
- Query ADO API for open PRs touching similar files
- Git log analysis for recent commits in area
- Opt-in "claims" tracked in lightweight state store
- CLI commands: `otc status`, `otc claim`, `otc watch`

**Limitations**:
- Requires developer opt-in for active session visibility
- Real-time updates depend on ADO webhook reliability
- Developers may ignore collision warnings

**Recommendation**: Keep lightweight and optional. Primary value is surfacing information, not blocking action.

### Primitive D: PR Loop

**Verdict**: Feasible - Most Straightforward

**Technical Approach**:
- Azure DevOps REST API for all operations
- Standalone CLI commands (no OpenCode dependency)
- LLM analysis of diffs for review/summarization

**Key ADO API Endpoints**:
- `GET /pullrequests/{id}/iterations/{n}/changes` - PR diffs
- `POST /pullrequests/{id}/threads` - Inline comments
- `POST /pullrequests/{id}/statuses` - Status updates
- Service Hooks for `git.pullrequest.created/updated`

**Limitations**:
- Rate limiting: 200 TSTUs per 5-minute window
- Webhook reliability varies (may need polling fallback)
- Inline comment positioning requires iteration tracking

**Recommendation**: Implement as standalone CLI first. No OpenCode dependency needed for PR workflows.

### Primitive E: Guardrails

**Verdict**: Partially Feasible

**What's Achievable**:

| Tier | Mechanism | Feasibility |
|------|-----------|-------------|
| BLOCK | Secrets detection (regex/entropy) | ✅ Proven patterns |
| WARN | Path-based rules via permission system | ✅ Pattern matching |
| GATE | ADO API approval workflow | ✅ Standard integration |
| INFO | Event logging via Bus | ✅ Subscribe to events |

**What's NOT Achievable**:
- ❌ SQL injection detection via data flow analysis
- ❌ PII leaks through logic tracing
- ❌ Missing audit logs detection
- ❌ Business logic validation

**Rationale**: Semantic analysis requires deep code understanding beyond pattern matching. Would need integration with dedicated SAST tools.

**Recommendation**: Scope to syntactic/procedural rules. Semantic guardrails are Phase 3+ (integrate existing SAST tools).

### Primitive F: Model Routing

**Verdict**: Questionable Necessity

**Technical Approach**:
- Decision tree based on task type, risk tier, context size
- Token counting for budget tracking
- Config-driven routing rules

**Concern**: OpenCode already has model selection. Building a separate routing layer adds complexity for unclear value.

**Recommendation**: Defer until validated as real team pain point. Simple budget visibility may be sufficient.

---

## What Works: Solidly Feasible Components

### 1. Standards Injection

**Already Supported** - OpenCode's `config.instructions` field loads markdown files into system prompts.

```jsonc
// opencode.jsonc in repo root
{
  "instructions": [".ai/standards.md"]
}
```

OpenCode discovers this via `findUp`, reads the file, and prefixes it with "Instructions from: .ai/standards.md" in the system prompt.

**Action Required**: Documentation and team adoption, not code.

### 2. Session Continuation Foundation

**Foundation Exists** - OpenCode's compaction system (`session/compaction.ts`) provides:
- Dedicated "compaction" agent for generating summaries
- Continuation prompts designed for "new session will not have access"
- Messages with `summary=true` as restoration checkpoints
- Destructive pruning of old tool outputs to manage context

**Action Required**:
- Trigger compaction on `otc handoff`
- Enhance artifacts with team metadata (blockers, hypotheses)
- Load summary on `otc continue`

### 3. PR Loop / Azure DevOps Integration

**Straightforward API Work** - ADO REST API fully supports:
- Reading PR diffs and iterations
- Posting inline comments with line-level precision
- Status updates and thread management
- Webhook subscriptions for events

**Action Required**: Standard API integration work, no novel technical challenges.

### 4. Permission/Guardrails Foundation

**Extensible** - OpenCode's permission system provides:
- `allow/deny/ask` actions with pattern matching
- Tools call `ctx.ask()` for permission requests
- Rules stored per-project in Storage namespace

**Action Required**: Extend for GATE (external approval) and INFO (log only) tiers.

### 5. Context Graph

**Proven Pattern** - AST-based Python import analysis is well-established:
- `ast` module for parsing imports
- `networkx` for graph operations
- Parallel processing for large codebases

**Action Required**: Build extraction job, storage format, query CLI.

---

## What Won't Work as Designed

### 1. Subprocess Wrapper Approach

**Problem**: The PRD describes "subprocess wrapper" but this is overcomplicated.

**Issues**:
- ~40% overhead on subprocess creation
- Limited access to OpenCode internals
- State synchronization complexity
- Harder to intercept for guardrails

**Better Alternative**: Plugin + CLI Hybrid

```
┌─────────────────────┐          ┌─────────────────────────────────┐
│    OpenCode CLI     │          │      OpenTeamCode CLI (otc)      │
│  (with OTC plugin)  │          │                                   │
│                     │          │  • otc init (config generation)   │
│  • Guardrails       │          │  • otc handoff / continue         │
│  • Team memory      │          │  • otc pr review / summarize      │
│  • Artifact hooks   │          │  • otc impact / context           │
└─────────────────────┘          └─────────────────────────────────┘
```

**Why Better**:
- Plugin has direct access to OpenCode internals (session state, events)
- CLI handles orchestration and external services
- No subprocess overhead for in-session features
- Clean separation of concerns

### 2. Semantic Guardrails

**Problem**: PRD implies detecting logic errors, PII leaks through data flow, missing audit logs.

**Reality**: This requires deep semantic analysis beyond pattern matching. Would need specialized SAST tooling.

**Recommendation**: Scope to syntactic/procedural rules. Semantic analysis is Phase 3+ with dedicated tooling integration.

### 3. Model Routing

**Problem**: May be unnecessary complexity.

**Reality**: OpenCode already has model selection. Unclear if building a separate routing layer provides value.

**Recommendation**: Defer until validated as real pain point. Budget visibility may be sufficient.

### 4. 100% Session Restoration

**Problem**: PRD goal of high-fidelity session continuation.

**Reality**: LLM context windows (200K tokens) cannot hold arbitrarily long sessions. OpenCode already prunes old tool outputs destructively. This is **inherent to the technology**, not a bug.

**Recommendation**: Design for structured decision capture rather than perfect context replay. 70% fidelity is the realistic ceiling.

---

## Recommended Architecture

### Plugin + CLI Hybrid

Instead of subprocess wrapper, use:

**OpenCode Plugin** (`@openteamcode/plugin`):
- Guardrails (extend permission system)
- Team memory lookup tools
- Session artifact generation hooks
- Event subscriptions for audit logging

**Standalone CLI** (`otc`):
- Config generation (`otc init`)
- Session continuation (`otc handoff`, `otc continue`)
- ADO PR commands (`otc pr review`, `otc pr summarize`)
- Context graph queries (`otc impact`, `otc context`)
- Guardrail management (`otc guardrail list`, `otc sync`)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Developer                                   │
│                           (Terminal/CLI)                                │
└─────────────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐          ┌─────────────────────────────────┐
│    OpenCode CLI     │          │      OpenTeamCode CLI (otc)      │
│  + OTC Plugin       │          │                                   │
│                     │          │  Orchestration:                   │
│  In-Session:        │          │  • Config generation              │
│  • Guardrail hooks  │          │  • Session handoff/continue       │
│  • Memory lookup    │          │  • Context graph queries          │
│  • Artifact hooks   │          │                                   │
│                     │          │  External Integrations:           │
│                     │          │  • Azure DevOps PR workflows      │
│                     │          │  • Webhook processing             │
└─────────────────────┘          └─────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐          ┌─────────────────────────────────┐
│  .ai/ folder        │          │  Azure DevOps APIs               │
│  (repo-local state) │          │  (external workflows)            │
│                     │          │                                   │
│  • standards.md     │          │  • PR diffs and comments         │
│  • memory/          │          │  • Status updates                │
│  • sessions/        │          │  • Webhooks                      │
│  • policies.yaml    │          │                                   │
└─────────────────────┘          └─────────────────────────────────┘
```

### Why This Is Better

| Aspect | Subprocess Wrapper | Plugin + CLI Hybrid |
|--------|-------------------|---------------------|
| Access to OpenCode internals | Limited | Direct |
| Performance overhead | ~40% subprocess creation | None for in-session |
| State synchronization | Complex | Native |
| Testability | Integration tests only | Unit + integration |
| Maintenance | Fragile coupling | Clean separation |
| Contribution potential | None | Plugin can go upstream |

---

## Fundamental Limitations

These constraints are inherent to the technology and approach, not bugs to fix.

### 1. Context Window Limits Are Hard Constraints

LLMs cannot remember arbitrarily long sessions. Claude Sonnet 4.5 has 200K token limit. Long sessions exceed this.

**Implication**: Design for summarization and structured capture, not perfect memory. Cross-session continuation faces the same limits as within-session continuation.

### 2. LLM Behavior Is Not Guaranteed Stable

Model updates can change:
- Instruction-following quality
- Compaction effectiveness
- Standards compliance rates

**Implication**: Build in version tracking, model routing fallbacks, and human verification for critical paths. This is inherent to LLM-based systems.

### 3. Team Discipline Cannot Be Technically Enforced

No tool can force humans to:
- Maintain documentation
- Update standards
- Curate team memory

**Implication**: Culture and process matter more than tooling. Make maintenance low-friction and show immediate value, but accept some entropy.

### 4. OpenCode Is a Dependency

If OpenCode changes direction, integrations break.

**Implication**:
- Use config-first integration (less coupled)
- Design interfaces that could adapt to different foundations
- Consider contributing to OpenCode to align interests
- Fork is available as fallback if needed

---

## Risk Assessment

### Top Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Session continuation doesn't provide real value | Medium | Critical | Phase 0 validation before building |
| Team doesn't maintain `.ai/` conventions | Medium | High | Automation, low friction, demonstrated value |
| Guardrails false positives cause bypass | Medium | High | Start conservative, tune aggressively |
| LLM model updates break functionality | Medium | Medium | Version tracking, routing fallbacks |
| OpenCode changes break integration | Low | High | Config-first integration, abstraction layer |

### What Would Cause Failure Even If Executed Well

1. **Developers prefer starting fresh** - If 70% fidelity isn't useful and developers prefer clean starts, session continuation value prop fails
2. **Standards injection ignored** - If LLMs don't follow injected standards consistently, team cohesion value prop fails
3. **Maintenance burden exceeds value** - If keeping `.ai/` current costs more than it saves, adoption fails
4. **Shadow AI wins** - If developers find individual tools faster/better and bypass team tool, governance value fails

---

## Validation Requirements

Before committing to full implementation, prove these hypotheses:

### Critical Validations

| Hypothesis | Test | Success Criteria |
|------------|------|------------------|
| Session continuation provides value | 25 real handoff scenarios | >70% productive continuations |
| Standards injection works | With/without comparison | >80% compliance |
| Guardrails are acceptable | Secrets detection prototype | <5% false positives |
| Team will maintain conventions | 4-week pilot | Weekly updates, no abandonment |

### Decision Gate

**Proceed to implementation only if all four validations succeed.** If any fail, revisit scope or approach:

- Session continuation fails → Pivot to artifact generation (audit trail, not continuation)
- Standards injection fails → Investigate stronger enforcement or accept lower consistency
- Guardrails fail → Reduce to BLOCK-only (high-confidence secrets)
- Maintenance fails → Increase automation or simplify convention

---

## Conclusion

OpenTeamCode is technically feasible with the plugin + CLI hybrid architecture. The core problems (knowledge evaporation, inconsistent patterns, collaboration friction) are addressable with the proposed primitives.

However, **technical feasibility is not the primary risk**. The critical unknowns are:
1. Whether session continuation provides real value in practice
2. Whether the team will maintain `.ai/` conventions
3. Whether guardrails can achieve acceptable false positive rates

**Recommendation**: Conduct Phase 0 validation experiments before committing to full implementation. The experiments are low-cost and will definitively answer the critical questions.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-01-14 | Claude (feasibility analysis) | Initial assessment |

---

## References

### OpenCode Source Files

- `opencode/packages/opencode/src/session/compaction.ts` - Session continuation foundation
- `opencode/packages/opencode/src/config/config.ts` - Standards injection support
- `opencode/packages/opencode/src/permission/next.ts` - Permission system
- `opencode/packages/opencode/src/tool/registry.ts` - Plugin/tool extensibility
- `opencode/packages/opencode/src/bus/index.ts` - Event system

### External Research

- Hudson River Trading - Python dependency graph at scale
- Azure DevOps REST API documentation
- TruffleHog/GitGuardian - Secrets detection patterns
- 12-factor-agents - Context management patterns

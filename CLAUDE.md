# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenTeamCode** is a team-native CLI extension for AI-assisted coding that transforms ephemeral individual sessions into durable, shareable, governed team state. Built on OpenCode as its foundation using a **Plugin + CLI hybrid** architecture, it adds collaboration primitives for enterprise Python teams on Azure DevOps.

**Current Status**: Research and planning phase. PRD revised post-feasibility assessment. **Phase 0 validation required before implementation.**

## Project Documentation

All planning documents live in `project_docs/`:

| Document | Purpose |
|----------|---------|
| `openteamcode-prd.md` | Full product requirements document with detailed specifications |
| `openteamcode-executive-summary.md` | High-level overview for stakeholders |
| `feasibility-assessment.md` | Technical feasibility analysis with OpenCode evaluation |
| `decisions.md` | Architecture Decision Records (ADRs) tracking key decisions |
| `unanswered-questions.md` | Open questions requiring validation or team input |

**Important**: Update this CLAUDE.md whenever creating new documentation, making architectural decisions, or adding code to the project.

## OpenCode Foundation

OpenCode is cloned at `./opencode/` as the foundation. It is a **TypeScript/Bun monorepo** (not Go) implementing an AI coding agent with CLI, web, and desktop interfaces.

### OpenCode Key Facts

- **Runtime**: Bun (not Node.js)
- **Framework**: Hono HTTP server, Solid.js TUI
- **LLM SDK**: Vercel `@ai-sdk/*` for multi-provider support
- **Architecture**: Event-driven pub/sub, agent-based tool execution

### OpenCode Development Commands

```bash
# From ./opencode/ directory
bun install                              # Install dependencies
bun dev                                  # Run CLI in dev mode
bun dev <directory>                      # Run against specific directory
bun turbo typecheck                      # Type checking (all packages)
bun run --cwd packages/opencode test     # Run opencode tests
bun run --cwd packages/app dev           # Web UI dev server (localhost:5173)
```

See `./opencode/CLAUDE.md` for comprehensive OpenCode development guidance.

### OpenCode Key Integration Points

These are the OpenCode source locations most relevant for OpenTeamCode integration:

```
opencode/packages/opencode/src/
├── agent/agent.ts       # Agent definitions: build, plan, explore, general
├── session/             # Session state, message processing, context compaction
│   ├── index.ts         # Session namespace and lifecycle
│   ├── processor.ts     # Main agent loop
│   └── llm.ts           # LLM streaming integration
├── tool/                # Tool implementations
│   ├── tool.ts          # Tool interface definition
│   ├── registry.ts      # Tool registration and loading
│   └── [individual tools: bash, edit, grep, glob, read, write, etc.]
├── provider/provider.ts # Multi-provider LLM support
├── permission/next.ts   # Permission system (allow/deny/ask patterns)
├── bus/                 # Event pub/sub system
│   ├── index.ts         # Bus.publish() and Bus.subscribe()
│   └── bus-event.ts     # Event type definitions
├── config/config.ts     # Configuration loading and merging
└── server/server.ts     # Hono HTTP/WebSocket server with SSE
```

## Planned Architecture

**Plugin + CLI Hybrid** (per feasibility assessment):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Developer (Terminal/CLI)                    │
└─────────────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐          ┌─────────────────────────────────┐
│    OpenCode CLI     │          │      OpenTeamCode CLI (otc)      │
│  + OTC Plugin       │          │                                   │
│                     │          │  Orchestration:                   │
│  In-Session:        │          │  • otc init, handoff, continue    │
│  • Guardrail hooks  │          │  • otc context, impact            │
│  • Team memory      │          │                                   │
│  • Artifact hooks   │          │  External Integrations:           │
│                     │          │  • otc pr review / summarize      │
│                     │          │  • Azure DevOps PR workflows      │
└─────────────────────┘          └─────────────────────────────────┘
```

### The Five Primitives

> **Note**: Model Routing deferred pending validation of actual pain point. See PRD Appendix D.

| Primitive | Purpose | MVP Scope |
|-----------|---------|-----------|
| **A. Context Graph** | Cross-repo dependency awareness (advisory) | Deferred to Phase 2 |
| **B. Durable Memory** | Session artifacts + team knowledge (~70% fidelity ceiling) | Basic |
| **C. Presence & Collision** | Ambient awareness of parallel work | Deferred to Phase 2 |
| **D. PR Loop** | Azure DevOps integration | Yes |
| **E. Guardrails** | Tiered policy enforcement (syntactic only) | Basic |
| ~~F. Model Routing~~ | ~~Predictable model selection + budget~~ | **Deferred** (see Appendix D) |

### Integration Strategy

**Recommended** (per feasibility assessment): **Plugin + CLI hybrid** architecture.

- **OpenCode Plugin**: In-session features (guardrails, team memory lookup, artifact hooks)
- **Standalone CLI (`otc`)**: Orchestration and external integrations (ADO, context graph)

See `project_docs/feasibility-assessment.md` for full rationale and architecture diagram.

## Planned CLI Commands

### Core Loop
- `otc` - Launch TUI with team defaults
- `otc run "<task>"` - One-shot task with team context
- `otc handoff` - Save session artifact
- `otc continue <session>` - Resume previous session

### PR Workflows (Azure DevOps)
- `otc pr summarize <id>` - Generate PR description
- `otc pr review <id>` - Post structured review comments

### Guardrails
- `otc sync` - Pull latest policies
- `otc guardrail list` - Show active guardrails

## Repository Convention: `.ai/` Folder

Each repo using OpenTeamCode will have a standardized `.ai/` folder:

```
.ai/
├── config.yaml         # OTC configuration
├── standards.md        # Coding standards (injected into system prompts)
├── review.md           # PR review rubric for otc pr review
├── policies.yaml       # Guardrail configuration (syntactic rules only)
├── memory/             # Curated team knowledge
│   ├── patterns/       # "How we do X" documentation
│   ├── gotchas/        # Known issues and workarounds
│   └── decisions/      # Architecture decision records
└── sessions/           # Session artifacts (auto-generated)
    └── YYYY-MM-DD-slug/
        ├── session.json    # Machine-readable state
        ├── session.md      # Human-readable summary
        └── context.jsonl   # Compressed conversation
```

## Target Users

- **Primary**: Senior/Staff engineers on Python platform teams (5-50 repos, Azure DevOps)
- **Secondary**: Tech leads and engineering managers needing visibility and governance
- **Tertiary**: New team members benefiting from accumulated team knowledge

## Research Questions

See `project_docs/unanswered-questions.md` for the full question registry with status tracking.

### Answered (Feasibility Assessment + Research)
- ✅ **Standards injection**: OpenCode's `config.instructions` already supports loading `.ai/standards.md`
- ✅ **Permission system mapping**: OpenCode's allow/deny/ask maps to BLOCK/WARN; extension needed for GATE/INFO
- ✅ **Session continuation fidelity**: ~70% restoration ceiling via compaction system; fundamental limit due to context windows
- ✅ **Integration boundary**: Plugin + CLI hybrid recommended over subprocess wrapper (~40% overhead avoided)
- ✅ **OpenCode plugin API stability**: Moderate-to-high risk; 8 breaking changes in 4 months
- ✅ **Session restoration mechanics**: HTTP API available (`POST /session/:id/summarize`) with plugin customization
- ✅ **ADO webhook reliability**: Polling fallback recommended; no delivery SLA
- ✅ **Multi-repo tooling patterns**: No mature polyrepo solution exists; custom tooling needed

### Requires Validation (Phase 0 - CRITICAL)
**Implementation blocked until these pass:**
- ❓ Does session continuation provide real value in practice? (>60% success)
- ❓ What compliance rate does standards injection achieve? (>80% target)
- ❓ What false positive rate is acceptable for guardrails? (<5% target)
- ❓ Will team maintain `.ai/` conventions over time?

### Requires Team Input
- ❓ Session artifact visibility: team-wide by default or opt-in?
- ❓ Team memory curation: who maintains `.ai/memory/`?
- ❓ Acceptable guardrail friction level?

## Development Notes

### When Adding Documentation
1. Update this CLAUDE.md with new file references
2. Keep the PRD (`project_docs/openteamcode-prd.md`) as source of truth for requirements
3. Record architectural decisions in `project_docs/decisions.md`
4. Track open questions in `project_docs/unanswered-questions.md`

### When Adding Code
1. Follow OpenCode's style conventions (see `opencode/STYLE_GUIDE.md`)
2. Use TypeScript/Bun for consistency with OpenCode
3. Design for plugin + CLI hybrid architecture (see feasibility assessment)
4. Reference `project_docs/feasibility-assessment.md` for integration guidance

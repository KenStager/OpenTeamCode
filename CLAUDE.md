# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenTeamCode** is a team-native CLI extension for AI-assisted coding that transforms ephemeral individual sessions into durable, shareable, governed team state. Built on OpenCode as its foundation using a **Plugin + CLI hybrid** architecture, it adds collaboration primitives for enterprise Python teams on Azure DevOps.

**Current Status**: **Phase E Complete**. Q002 and Q003 complete (PASS). `otc` CLI fully implemented. **NEW**: OpenCode plugin (`@opencode-ai/otc-plugin`) provides integrated team features.

## Phase 0 Validation (Current Work)

Phase 0 validates four critical hypotheses before full implementation. All validation infrastructure is now in place.

| Experiment | Target | Status | Files |
|------------|--------|--------|-------|
| Q001: Session Continuation | >70% productive | **Ready** (tooling complete) | `validation/q001-session-handoff/` |
| Q002: Standards Injection | >80% compliance | **PASS (100%)** | `validation/q002-standards-injection/` |
| Q003: Guardrails | <5% false positives | **PASS (3.6% FPR)** | `validation/q003-guardrails/` |
| Q004: Team Discipline | Weekly maintenance | **Ready** (tooling complete) | `validation/q004-team-discipline/` |

**Tracking**: `project_docs/phase0-validation.md`

### Running Experiments

```bash
# Use the otc CLI for experiments (preferred)
cd packages/otc && npm install
npm run otc -- guardrail scan validation/q003-guardrails/corpus/true-positives/
npm run otc -- guardrail scan validation/q003-guardrails/corpus/true-negatives/

# Q001: Session handoff (requires OpenCode running)
npm run otc -- handoff                    # Export current session
npm run otc -- sessions list              # List exported sessions
npm run otc -- continue <session-id>      # Resume a session

# Q004: Team discipline
npm run otc -- init                       # Initialize .ai/ folder
npm run otc -- doctor                     # Health check
npm run otc -- status                     # Show current state
```

### PR Commands Setup

The `otc pr` commands require environment variables for Azure DevOps and Anthropic API access:

```bash
# Required for PR commands
export ADO_PAT="your-azure-devops-personal-access-token"
export ANTHROPIC_API_KEY="your-anthropic-api-key"

# Test with dry-run (no actual API calls)
npm run otc -- pr summarize 1234 --dry-run
npm run otc -- pr review 1234 --dry-run
```

Configure ADO organization/project in `.ai/config.yaml`:
```yaml
ado:
  organization: your-org
  project: your-project
```

Or the CLI will auto-detect from git remote URLs if you're in an ADO-hosted repo.

## Project Documentation

All planning documents live in `project_docs/`:

| Document | Purpose |
|----------|---------|
| `openteamcode-prd.md` | Full product requirements document with detailed specifications |
| `openteamcode-executive-summary.md` | High-level overview for stakeholders |
| `feasibility-assessment.md` | Technical feasibility analysis with OpenCode evaluation |
| `decisions.md` | Architecture Decision Records (ADRs) tracking key decisions |
| `unanswered-questions.md` | Open questions requiring validation or team input |
| `phase0-validation.md` | **NEW** Phase 0 experiment tracking and results |

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

## OpenTeamCode CLI (`otc`)

The `otc` CLI is implemented at `./packages/otc/`. It provides team collaboration commands that work alongside OpenCode.

### otc Development Commands

```bash
# From ./packages/otc/ directory
npm install                              # Install dependencies
npm run otc -- --help                    # Show all commands
npm run otc -- init                      # Initialize .ai/ folder
npm run otc -- status                    # Show current state
npm run otc -- doctor                    # Health check
npm run otc -- guardrail scan [path]     # Scan for secrets
npm run otc -- guardrail list            # List patterns
npm run otc -- handoff                   # Export session (requires OpenCode)
npm run otc -- sessions list             # List session artifacts
npm run otc -- continue <id>             # Resume session

# PR Workflow Commands (Azure DevOps)
npm run otc -- pr summarize <id>         # Generate AI summary for PR
npm run otc -- pr review <id>            # Post AI code review
npm run otc -- pr testplan <id>          # Generate test plan
npm run otc -- pr followup <id>          # Re-review after feedback
npm run otc -- pr link <id>              # Link session to PR
```

### otc Package Structure

```
packages/otc/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI entry point (yargs)
│   ├── commands/
│   │   ├── init.ts           # otc init
│   │   ├── status.ts         # otc status
│   │   ├── doctor.ts         # otc doctor (11 health checks)
│   │   ├── guardrail.ts      # otc guardrail scan/list/explain
│   │   ├── handoff.ts        # otc handoff
│   │   ├── sessions.ts       # otc sessions list/show/search
│   │   ├── continue.ts       # otc continue
│   │   └── pr.ts             # otc pr summarize/review/testplan/followup/link
│   ├── ado/                  # Azure DevOps integration
│   │   ├── types.ts          # ADO API type definitions
│   │   ├── auth.ts           # PAT token management
│   │   ├── client.ts         # ADO REST API client
│   │   └── pr.ts             # PR-specific operations
│   ├── llm/
│   │   └── index.ts          # Anthropic Claude integration for AI analysis
│   ├── guardrails/
│   │   ├── scanner.ts        # Secret detection (productionized from Q003)
│   │   └── patterns.ts       # 10 default detection patterns
│   └── util/
│       ├── config.ts         # .ai/ config loading (Zod schemas)
│       ├── output.ts         # CLI output helpers (chalk)
│       └── opencode-client.ts # OpenCode HTTP API client
└── templates/                # .ai/ folder templates
    ├── config.yaml
    ├── standards.md
    ├── policies.yaml
    └── review.md             # PR review rubric template
```

### OTC Plugin Package (Phase E - NEW)

The OpenCode plugin at `packages/otc-plugin/` provides integrated team features within OpenCode:

```
packages/otc-plugin/
├── package.json              # @opencode-ai/otc-plugin
├── tsconfig.json
├── scripts/
│   └── bundle.mjs            # esbuild bundler
├── src/
│   ├── index.ts              # Plugin entry point (exports OTCPlugin)
│   ├── hooks/
│   │   ├── standards.ts      # experimental.chat.system.transform hook
│   │   └── guardrails.ts     # permission.ask hook (blocks secrets)
│   ├── tools/
│   │   ├── pr-review.ts      # otc:pr-review tool
│   │   ├── pr-summarize.ts   # otc:pr-summarize tool
│   │   ├── pr-testplan.ts    # otc:pr-testplan tool
│   │   ├── guardrail-scan.ts # otc:guardrail-scan tool
│   │   └── session-export.ts # otc:session-export tool
│   └── lib/
│       ├── config.ts         # .ai/ config loading
│       ├── scanner.ts        # Secret detection (reused from CLI)
│       ├── llm.ts            # Anthropic Claude integration
│       └── ado.ts            # Azure DevOps API client
└── dist/
    └── index.js              # Bundled plugin (esbuild output)
```

**Plugin Development:**
```bash
cd packages/otc-plugin
npm install
npm run build                 # Build plugin with esbuild
```

**Using the Plugin:**
```jsonc
// In project's opencode.json or opencode.jsonc:
{
  "plugin": ["file:///path/to/packages/otc-plugin/dist/index.js"]
}
```

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

## Planned CLI Commands (MVP)

> **Note**: This is the MVP command surface. See PRD Section 6.2 for the complete CLI reference including Phase 2+ commands.

### Core Workflow
| Command | Description |
|---------|-------------|
| `otc` | Launch TUI with team defaults |
| `otc run "<task>"` | One-shot task with team context |
| `otc handoff` | Save session artifact for handoff |
| `otc continue <id>` | Resume session (supports `--strategy=merge\|repo\|summary`) |
| `otc init` | Initialize `.ai/` folder |
| `otc status` | Show local state: active session, pending ops, policy freshness |

### Session Management
| Command | Description |
|---------|-------------|
| `otc sessions list` | List sessions (supports `--pr`, `--owner`, `--status` filters) |
| `otc sessions show <id>` | Display session details (intent, plan, blockers) |
| `otc sessions search "<query>"` | Search session artifacts |

### PR Workflows (Azure DevOps)
| Command | Description |
|---------|-------------|
| `otc pr summarize <id>` | Generate/update PR description |
| `otc pr review <id>` | Post structured review comments |
| `otc pr testplan <id>` | Generate risk-based test plan |
| `otc pr followup <id>` | Re-review after human feedback |
| `otc pr link <id>` | Attach current session to PR |

### Guardrails
| Command | Description |
|---------|-------------|
| `otc sync` | Pull latest policies |
| `otc guardrail list` | Show active guardrails |
| `otc guardrail explain <id>` | Why did this guardrail fire? |

### Diagnostics
| Command | Description |
|---------|-------------|
| `otc doctor` | Health check (supports `--config` flag) |

**Phase 2+ commands** (not in MVP): `otc watch`, `otc sessions assign/archive/redact/visibility`, `otc pr status/queue/retry`, `otc guardrail request/approve/history`, `otc audit export`, `otc memory list/show`, `otc salvage`. See PRD for details.

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
- ❓ Does session continuation provide real value in practice? (>60% success) - **Q001 Ready** (tooling complete)
- ✅ What compliance rate does standards injection achieve? (>80% target) - **Q002 PASS (100%)**
- ✅ What false positive rate is acceptable for guardrails? (<5% target) - **Q003 PASS (3.6% FPR)**
- ❓ Will team maintain `.ai/` conventions over time? - **Q004 Ready** (tooling complete)

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

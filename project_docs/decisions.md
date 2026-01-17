# OpenTeamCode: Architecture Decisions

**Version**: 0.1.0
**Last Updated**: January 14, 2026
**Status**: Research & Planning Phase

---

## Decision Log

| ID | Decision | Status | Date |
|----|----------|--------|------|
| D001 | Use OpenCode as foundation | Validated | 2026-01-14 |
| D002 | Plugin + CLI hybrid architecture | Recommended | 2026-01-14 |
| D003 | Require Phase 0 validation before implementation | Recommended | 2026-01-14 |
| D004 | Defer Model Routing primitive | Recommended | 2026-01-14 |
| D005 | Scope guardrails to syntactic/procedural rules | Recommended | 2026-01-14 |
| D006 | Position Context Graph as advisory | Recommended | 2026-01-14 |

---

## D001: Use OpenCode as Foundation

**Status**: Validated
**Date**: 2026-01-14

### Context

OpenTeamCode needs a foundation for AI-assisted coding that provides:
- Terminal-first CLI experience
- Multi-provider LLM support
- Session management
- Tool extensibility
- Permission/policy infrastructure

Options considered:
1. Build from scratch
2. Fork an existing tool (Claude Code, Cursor)
3. Build on OpenCode (open-source AI coding CLI)

### Decision

**Use OpenCode as the foundation for OpenTeamCode.**

### Rationale

Feasibility assessment confirmed OpenCode provides:
- **80%+ of required infrastructure** already implemented
- TypeScript/Bun monorepo with clean architecture
- Excellent plugin/tool extensibility system
- Session state serialization (compaction system)
- Permission system (allow/deny/ask) extensible to guardrails
- Multi-provider support (21+ LLM providers including Azure)
- Event bus for real-time coordination
- Active development and open-source community

Key finding: Many features assumed to require building are actually **configuration** of existing OpenCode capabilities.

### Consequences

**Positive**:
- Faster time to value
- Leverage community improvements
- Proven architecture for AI coding workflows
- Standards injection already supported via `config.instructions`

**Negative**:
- Dependency on external project's direction
- Must track OpenCode updates and adapt
- Some features may require upstream contributions

**Mitigations**:
- Design config-first integration (less coupled)
- Abstract interfaces to allow foundation swaps if needed
- Consider contributing team features back to OpenCode

**API Churn Contingency Plan** (added post-audit):

OpenCode has had 8 breaking changes in 4 months with no semver policy. Concrete mitigations:

1. **Pin to specific commit/tag** (not floating versions like `^1.1.0`)
2. **Automated regression test suite** against OpenCode:
   - Run on every OpenCode release
   - Test all plugin hooks used by OpenTeamCode
   - Automated alerts on test failures
3. **Compatibility layer abstraction**:
   - Isolate plugin API from OpenTeamCode core
   - Single adapter module handles all OpenCode-specific calls
   - Allows swapping adapters if API changes
4. **Fork threshold criteria**:
   - Consider fork if >3 breaking changes in 30 days
   - Consider fork if >1 change breaks core OTC functionality
   - Decision factors: cost of maintaining fork vs. adapting, community trajectory, ability to contribute upstream

See Q018 in unanswered-questions.md for full contingency planning.

---

## D002: Plugin + CLI Hybrid Architecture

**Status**: Recommended
**Date**: 2026-01-14

### Context

The original PRD proposed a "subprocess wrapper" approach where OpenTeamCode would wrap OpenCode CLI calls. Feasibility assessment identified issues:
- Subprocess communication adds ~40% overhead on process creation
- Limited access to OpenCode internals (session state, events)
- State synchronization complexity between wrapper and wrapped CLI

### Decision

**Use a hybrid architecture: OpenCode plugin for in-session features + standalone CLI for orchestration.**

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

### Rationale

- **Plugin**: Direct access to OpenCode internals (session state, Bus events, permissions)
- **CLI**: Clean separation for external workflows (ADO integration, context graph)
- No subprocess overhead for in-session features
- Each component independently testable
- Plugin could be contributed to OpenCode community

### Consequences

**Positive**:
- Better performance for in-session features
- Direct access to OpenCode's event bus for guardrail hooks
- Cleaner separation of concerns
- Incremental development path

**Negative**:
- More integration points to maintain
- Requires understanding OpenCode plugin API
- Plugin API may change with OpenCode updates

---

## D003: Require Phase 0 Validation Before Implementation

**Status**: Recommended
**Date**: 2026-01-14

### Context

The PRD assumes several hypotheses that are critical but unvalidated:
1. Session continuation provides real value (70% fidelity is sufficient)
2. Standards injection achieves >80% LLM compliance
3. Guardrails achieve <5% false positive rate
4. Team will maintain `.ai/` conventions

Building the full system before validating these risks significant wasted effort.

### Decision

**Require Phase 0 validation experiments before committing to full implementation.**

Phase 0 activities:
1. Manual session handoff experiments (25 scenarios minimum)
2. Standards injection tests (with/without `.ai/standards.md`)
3. Secrets detection prototype (measure false positives)
4. Team discipline pilot (4-week `.ai/` folder trial)

### Rationale

- Core value proposition (session continuation) is unproven
- Low-cost experiments can validate/invalidate hypotheses
- Failure in Phase 0 changes scope or approach, not abandons project
- De-risks the hardest parts before major investment

### Consequences

**Positive**:
- Prevents building features that don't provide value
- Generates real data for design decisions
- Builds team familiarity with OpenCode
- Can pivot based on learnings

**Negative**:
- Delays implementation start
- Requires discipline to complete validation before building

**Decision Gate**: Proceed to implementation only if:
- >70% of session handoffs result in productive continuation
- >80% compliance with injected standards
- <5% false positive rate on secrets detection

---

## D004: Defer Model Routing Primitive

**Status**: Recommended
**Date**: 2026-01-14

### Context

The PRD includes Model Routing (Primitive F) with features:
- Task-based model selection
- Risk-based routing
- Budget tracking and enforcement
- Mode-based overrides (hotfix/explore)

However, OpenCode already has model selection capabilities.

### Decision

**Defer Model Routing primitive until validated as a real team pain point.**

### Rationale

- OpenCode already provides model selection
- Unclear if this solves a real problem vs. hypothetical one
- Budget visibility may be sufficient without routing logic
- Higher priority features (session continuation, PR loop, guardrails) should come first

### Consequences

**Positive**:
- Reduces initial scope
- Focuses effort on validated needs
- Can add later if budget/model issues emerge

**Negative**:
- Teams may experience cost surprises initially
- Less predictable model behavior

**Revisit When**: Team reports model selection or budget as pain points.

---

## D005: Scope Guardrails to Syntactic/Procedural Rules

**Status**: Recommended
**Date**: 2026-01-14

### Context

The PRD implies guardrails could detect semantic issues:
- SQL injection via data flow
- PII leaks through logic
- Missing audit logs

Feasibility assessment found this requires deep code analysis beyond pattern matching.

### Decision

**Scope guardrails to syntactic and procedural rules only. Semantic analysis is out of scope for initial implementation.**

What's in scope:
- ✅ Secrets detection (BLOCK): Regex/entropy patterns
- ✅ Path-based rules (WARN): Pattern matching on file paths
- ✅ Approval workflows (GATE): ADO API integration
- ✅ Audit logging (INFO): Event capture

What's out of scope:
- ❌ Data flow analysis for injection vulnerabilities
- ❌ PII detection through logic tracing
- ❌ Business logic validation

### Rationale

- Syntactic detection is proven (TruffleHog, GitGuardian patterns)
- Semantic analysis requires specialized tooling (SAST)
- Better to deliver reliable syntactic guardrails than unreliable semantic ones
- Can integrate existing SAST tools later if needed

### Consequences

**Positive**:
- Achievable with pattern matching
- Lower false positive rate
- Clear scope boundaries

**Negative**:
- Some security issues won't be caught by guardrails
- Teams may expect more than system delivers

**Future**: Consider SAST tool integration in Phase 3+ if semantic analysis needed.

---

## D006: Position Context Graph as Advisory

**Status**: Recommended
**Date**: 2026-01-14

### Context

Context Graph (Primitive A) provides cross-repo dependency awareness via AST-based import analysis. Known limitations:
- Dynamic imports not detected
- Conditional imports may be missed
- String-based imports invisible
- Estimated 80% accuracy, 20% miss rate

### Decision

**Position Context Graph as advisory ("suggests") not authoritative ("confirms").**

- Use language: "Impact analysis suggests..." not "Impact analysis confirms..."
- Always recommend human verification for high-risk changes
- Document known blind spots in user-facing help

### Rationale

- 80% accuracy is valuable for awareness but not for blocking
- False confidence could cause incidents (missed dependencies)
- Advisory positioning sets correct expectations
- Human judgment remains in the loop

### Consequences

**Positive**:
- Appropriate trust calibration
- Reduces risk of missed dependencies causing incidents
- Still provides significant value for awareness

**Negative**:
- Developers may ignore advisory warnings
- Less "automated" feel

---

## Pending Decisions

The following decisions are deferred pending Phase 0 validation or team input:

| Topic | Question | Blocker |
|-------|----------|---------|
| Session artifact visibility | Team-wide by default or opt-in? | Team input needed |
| Team memory curation | Who maintains `.ai/memory/`? | Team input needed |
| Guardrail friction threshold | What false positive rate causes abandonment? | Phase 0 data needed |
| OpenCode plugin vs. fork | When does plugin become insufficient? | Implementation experience needed |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.2.0 | 2026-01-14 | Claude (Opus 4.5) | Added API churn contingency plan and fork criteria to D001 (post-audit) |
| 0.1.0 | 2026-01-14 | Claude (feasibility analysis) | Initial decisions from feasibility assessment |

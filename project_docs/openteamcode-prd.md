# OpenTeamCode: Product Requirements Document

**Version**: 0.2.0-draft
**Last Updated**: January 14, 2026
**Status**: Vision & Requirements (Post-Feasibility)
**Document Owner**: Ken Stager

---

## Executive Summary

OpenTeamCode is a team-native CLI extension for AI-assisted coding that transforms ephemeral individual sessions into durable, shareable, governed team state. Built on [OpenCode](https://github.com/opencode-ai/opencode) as its foundation using a **Plugin + CLI hybrid** architecture, OpenTeamCode adds the collaboration primitives that enterprise Python teams on Azure DevOps need: cross-repo awareness, session continuity, PR-native workflows, and syntactic guardrails.

> **Status Note**: This PRD has been revised based on the January 2026 feasibility assessment. Key changes include: Plugin + CLI hybrid architecture (replacing subprocess wrapper), Phase 0 validation requirement, Model Routing deferred, guardrails scoped to syntactic analysis, and acknowledgment of fundamental limitations. See Document History for details.

**The Core Insight**: Claude Code's power is the tight feedback loop. Its weakness is that everything evaporates when the session ends. OpenTeamCode aims to make that state *shareable and governed* without sacrificing the speed that makes CLI-first tools valuable.

**Confidence Level**: 70% (increases to 85%+ if Phase 0 validation succeeds)

**The Mental Model**:

| Solo AI Coding (Status Quo) | Team-Native AI Coding (OpenTeamCode) |
|-----------------------------|--------------------------------------|
| State lives in your chat + local changes | State is shareable, versioned, continuable |
| Collaboration happens after the fact | Collaboration is built into the agent loop |
| Standards are tribal knowledge | Standards inject automatically from repo |
| Handoff means "read my chat logs" | Handoff means "continue my session" |
| Every dev gets a different AI reality | Team gets consistent, governed experience |

---

## Problem Statement

### The Current State

Individual developers using AI coding assistants (Claude Code, Cursor, Copilot) experience significant productivity gains. However, these tools create team-level problems:

1. **Knowledge Evaporation**: Valuable context, decisions, and reasoning disappear when sessions end. A developer spends 2 hours teaching the AI about a codebase, then closes the terminal and loses everything.

2. **Inconsistent Patterns**: Five developers using the same AI tool produce five different coding styles, architectural approaches, and quality levels. The AI has no awareness of "how we do things here."

3. **Collaboration Friction**: When Developer A hands off to Developer B, the transfer is lossy. "Read my chat logs" or "let me explain what I tried" is the best case. Worst case: Developer B starts from scratch.

4. **Governance Gaps**: No audit trail of what the AI suggested. No policy enforcement. No cost visibility. Security and compliance teams have no insight into AI-assisted work.

5. **Cross-Repo Blindness**: AI doesn't understand that changing a shared library affects 12 downstream services. It can't answer "what breaks if I merge this?"

6. **No Learning Loop**: The same mistakes get made repeatedly because there's no mechanism for the AI to learn from team feedback. Reviewer catches the same issue for the 10th time.

### The Opportunity

Teams need the *feel* of Claude Code (fast, terminal-first, tight feedback loop) with team-native primitives:

- Shared, versioned standards that inject automatically into every session
- Session state that another developer can actually *continue*, not just read about
- PR workflows that land in Azure DevOps where the team already collaborates
- Ambient awareness of who's working where to prevent conflicts
- Accumulated team knowledge that makes the agent smarter over time
- Governance that's predictable, auditable, and doesn't slow developers down

---

## Target Users

### Primary: Senior/Staff Engineers on Python Platform Teams

**Profile**:
- Work across 5-50 interconnected Python repositories
- Use Azure DevOps for source control and PR workflows
- Value terminal-first tools and keyboard-driven workflows
- Responsible for code quality, architecture decisions, and mentoring
- Currently use individual AI tools but frustrated by team coordination gaps

**Jobs to Be Done**:
- Ship features faster without sacrificing code quality
- Maintain consistency across team output
- Hand off work cleanly when context-switching or going on PTO
- Understand impact of changes across service boundaries
- Onboard new team members efficiently

### Secondary: Tech Leads and Engineering Managers

**Profile**:
- Oversee 5-15 engineers across multiple repositories
- Accountable for team velocity, quality, and budget
- Need to justify AI tooling investments to leadership
- Responsible for compliance and security posture

**Jobs to Be Done**:
- Ensure consistent quality standards across AI-assisted work
- Track and manage AI tooling costs
- Maintain audit trails for compliance
- Understand how the team is using AI and where it's helping

### Tertiary: New Team Members (< 6 months tenure)

**Profile**:
- Still learning team patterns and codebase structure
- Frequently unsure of "how we do things here"
- May come from different tech stacks or companies

**Jobs to Be Done**:
- Ramp up quickly on team conventions
- Get answers without constantly interrupting senior devs
- Understand why past decisions were made
- Contribute quality code that matches team standards

---

## Product Principles

### 1. Speed is Sacred

Team features must be ambient—never forms, never modals, never mandatory steps. The default experience should be "start coding now." If governance adds perceptible friction to the core loop, we've failed.

**Test**: Can a developer go from terminal prompt to productive coding in under 5 seconds?

### 2. State is the Product

Every feature should answer one question: "Does this turn ephemeral work into durable, team-usable state?" Features that don't contribute to shareable, governed state are distractions.

**Test**: After a session ends, what artifact remains that another developer could use?

### 3. Meet Developers Where They Are

PRs are where teams collaborate. Code review is where quality happens. Don't build a parallel universe—land artifacts in Azure DevOps. Dashboards are for managers; CLI is for developers.

**Test**: Does this feature produce something that appears in the PR workflow?

### 4. Graceful Degradation

Never lose work. Never block completely. Network down? Use cached policies. Model unavailable? Save state locally. The tool should remain useful in degraded conditions.

**Test**: What happens when [component] is unavailable? Is the developer blocked?

### 5. Pull Over Push

Team help should be available when requested, not forced. Suggestions, not mandates. Warnings, not blocks (except for true security violations). Developers should feel empowered, not policed.

**Test**: Can a developer ignore this feature and still be productive?

### 6. Learn Continuously

The system should get smarter because the team uses it. Feedback from PR reviews, test failures, and explicit signals should flow back into better suggestions. Static rules are a starting point, not the end state.

**Test**: Will this feature be noticeably better in 6 months than at launch?

---

## Fundamental Limitations

These constraints are **inherent to the technology and approach**, not bugs to fix. Understanding them upfront sets appropriate expectations.

### 1. Context Window Limits Are Hard Constraints

LLMs cannot remember arbitrarily long sessions. Claude models have 200K token limits. Long sessions exceed this.

**Implication**: Design for summarization and structured capture, not perfect memory. Cross-session continuation faces the same limits as within-session continuation. ~70% restoration fidelity is a ceiling.

### 2. LLM Behavior Is Not Guaranteed Stable

Model updates can change:
- Instruction-following quality
- Compaction effectiveness
- Standards compliance rates

**Implication**: Build in version tracking, routing fallbacks, and human verification for critical paths. This is inherent to LLM-based systems.

### 3. Static Code Analysis Has Blind Spots

AST-based import analysis achieves ~80% accuracy. Dynamic imports, conditional imports, and string-based imports are invisible.

**Implication**: Position code analysis (Context Graph) as advisory, not authoritative. Always recommend human verification for high-risk changes.

### 4. Team Discipline Cannot Be Technically Enforced

No tool can force humans to:
- Maintain documentation
- Update standards
- Curate team memory
- Use the tool consistently

**Implication**: Culture and process matter more than tooling. Make maintenance low-friction and show immediate value, but accept some entropy. This is why Phase 0 validation includes team discipline testing.

### 5. OpenCode Is a Dependency

If OpenCode changes direction, integrations may break.

**Implication**:
- Use config-first integration (less coupled)
- Design interfaces that could adapt to different foundations
- Consider contributing to OpenCode to align interests
- Fork is available as fallback if needed
- Track OpenCode releases and plugin API changes closely

---

## Solution Architecture: The Five Primitives

OpenTeamCode is organized around five foundational primitives that together create the "team-native" experience. Each primitive addresses a specific gap in solo AI tooling.

> **Note**: Model Routing was originally envisioned as a sixth primitive but is **deferred** pending validation of actual team pain points. OpenCode already provides model selection; additional routing complexity may not be needed. See Appendix D for the deferred specification.

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenTeamCode                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Context   │  │   Durable   │  │  Presence   │              │
│  │    Graph    │  │   Memory    │  │ & Collision │              │
│  │      A      │  │      B      │  │      C      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │  PR Loop    │  │ Guardrails  │   [Model Routing deferred]    │
│  │      D      │  │      E      │                               │
│  └─────────────┘  └─────────────┘                               │
├─────────────────────────────────────────────────────────────────┤
│                    OpenCode Foundation                           │
│         (Terminal TUI, Model Providers, File Operations)         │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Architecture: Plugin + CLI Hybrid

The feasibility assessment (January 2026) identified that a subprocess wrapper approach is overcomplicated with ~40% overhead on process creation. Instead, OpenTeamCode uses a **Plugin + CLI hybrid** architecture:

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
│  In-Session:        │          │  • otc init (config generation)   │
│  • Guardrail hooks  │          │  • otc handoff / continue         │
│  • Team memory      │          │  • otc context / impact           │
│  • Artifact hooks   │          │                                   │
│                     │          │  External Integrations:           │
│                     │          │  • otc pr review / summarize      │
│                     │          │  • Azure DevOps PR workflows      │
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

**Why Plugin + CLI Hybrid**:

| Aspect | Subprocess Wrapper (Rejected) | Plugin + CLI Hybrid (Chosen) |
|--------|-------------------------------|------------------------------|
| Performance | ~40% subprocess creation overhead | No overhead for in-session features |
| Access to OpenCode | Limited to CLI outputs | Direct access to session state, Bus events |
| State sync | Complex inter-process communication | Native integration |
| Testability | Integration tests only | Unit + integration tests |
| Maintenance | Fragile coupling | Clean separation of concerns |
| Upstream contribution | None | Plugin can be contributed back |

---

### Primitive A: Context Graph

**Problem Solved**: Multi-repo teams need to understand cross-boundary impacts. "What might be affected if I change this?" is unanswerable with solo tools.

> **Advisory, Not Authoritative**: The Context Graph uses AST-based static analysis with ~80% accuracy. It **suggests** potential impacts but does not **confirm** them. Always recommend human verification for high-risk changes.

**Known Limitations**:
- Dynamic imports (`importlib.import_module()`) not detected
- Conditional imports may be missed
- String-based imports invisible
- ~20% of cross-repo dependencies may not be captured

**Capabilities**:
- Surface "what imports this symbol/module?" across repo boundaries
- Suggest "what tests usually fail when this file changes?"
- Identify related open PRs across repositories
- Map service-to-library and internal package dependencies
- Show recent activity in a code area (commits, branches, PRs)

**Implementation Approach**:

*Phase 1 (MVP)*: Nightly batch job
- CI job runs in each repo, extracts Python imports and internal dependencies
- Writes results to central JSON file in blob storage
- CLI fetches and queries locally with caching
- ~80% accuracy—advisory, not authoritative

*Phase 2 (Scale)*: Incremental service
- Webhook-triggered updates on push
- Graph database or indexed SQLite for fast queries
- Query API with cross-repo joins

**Data Model**:
```
RepoNode {
  repo_id: string
  packages: [PackageNode]
  services: [ServiceNode]
}

PackageNode {
  name: string
  modules: [ModuleNode]
  internal_deps: [PackageNode]
  external_deps: [string]  // PyPI packages
}

ModuleNode {
  path: string
  symbols: [SymbolNode]
  imports: [ModuleNode]
  imported_by: [ModuleNode]  // reverse index
}

SymbolNode {
  name: string
  type: function | class | constant
  usages: [Usage]  // cross-repo references
}
```

**CLI Commands**:
```bash
otc context --deep <path|symbol>    # What does the team know about this?
otc impact <branch|diff>            # What might be affected if I merge this?
otc related <path|service>          # Related PRs, recent changes, owners
```

**Success Criteria**:
- Query response time < 2 seconds (cached)
- Impact analysis surfaces ~80% of potential downstream effects (advisory)
- Developers use `otc impact` before merging cross-cutting changes
- Users understand results are suggestive, not definitive

---

### Primitive B: Durable Memory

**Problem Solved**: Session state evaporates. Knowledge doesn't accumulate. Every developer and every session starts from zero.

**Two-Tier Memory Model**:

| Tier | Scope | Lifecycle | Governance |
|------|-------|-----------|------------|
| **Session Memory** | Single task/branch/PR | Created automatically, archived after merge | None (developer's workspace) |
| **Team Memory** | Cross-session patterns | Permanent until explicitly deprecated | PR approval required |

**Session Memory (Automatic)**

Every coding session produces a structured artifact:

```
.ai/sessions/
  2026-01-13-retry-logic/
    session.json          # Machine-readable state (see schema below)
    session.md            # Human-readable summary (generated)
    context.jsonl         # Compressed conversation (key turns only)
    working-set.patch     # Uncommitted changes at handoff time
    attachments/          # Screenshots, error logs, etc.
```

**session.json Schema**:
```json
{
  "id": "2026-01-13-retry-logic",
  "version": "1.0",
  "created": "2026-01-13T09:14:00Z",
  "updated": "2026-01-13T14:32:00Z",
  "owner": "kstager",
  "continuations": [],
  
  "context": {
    "repo": "payment-service",
    "branch": "feature/retry-logic",
    "pr": 1847,
    "ticket": "JIRA-4521",
    "related_repos": ["shared-utils"]
  },
  
  "intent": {
    "summary": "Add exponential backoff retry to payment API calls",
    "acceptance_criteria": [
      "Retries use exponential backoff with jitter",
      "Max 3 retries, configurable via env var",
      "Failures after retries raise PaymentRetryExhausted",
      "Telemetry emits retry counts per endpoint"
    ]
  },
  
  "plan": [
    {
      "id": "step-1",
      "description": "Add retry decorator to shared-utils",
      "status": "done",
      "commit": "a1b2c3d",
      "notes": null
    },
    {
      "id": "step-2", 
      "description": "Apply decorator to PaymentClient.charge()",
      "status": "done",
      "commit": "d4e5f6g",
      "notes": null
    },
    {
      "id": "step-3",
      "description": "Add unit tests for retry behavior",
      "status": "in-progress",
      "commit": null,
      "notes": "3 of 5 test cases passing"
    },
    {
      "id": "step-4",
      "description": "Add integration test with mock failures",
      "status": "blocked",
      "commit": null,
      "notes": null,
      "blocker_id": "blocker-1"
    },
    {
      "id": "step-5",
      "description": "Update telemetry dashboards",
      "status": "pending",
      "commit": null,
      "notes": null
    }
  ],
  
  "hypotheses": {
    "jitter-range": {
      "value": "0-100ms",
      "confidence": "medium",
      "rationale": "Standard practice, but should verify with SRE team"
    },
    "max-retries": {
      "value": 3,
      "confidence": "high", 
      "rationale": "Matches existing circuit breaker config in payment-service"
    }
  },
  
  "blockers": [
    {
      "id": "blocker-1",
      "question": "How do we simulate transient failures in integration tests?",
      "owner": null,
      "status": "open",
      "resolution": null
    }
  ],
  
  "next_actions": [
    {
      "action": "Ask about mock server setup for payment failures",
      "prerequisite": null
    },
    {
      "action": "Finish remaining 2 unit tests (timeout and jitter)",
      "prerequisite": null
    },
    {
      "action": "Wire up integration test",
      "prerequisite": "blocker-1"
    }
  ],
  
  "metrics": {
    "model_primary": "claude-sonnet-4-5-20250929",
    "tokens_in": 47320,
    "tokens_out": 12840,
    "cost_usd": 0.31,
    "duration_minutes": 47,
    "turns": 23
  }
}
```

**Team Memory (Curated)**

Distilled learnings that apply across sessions:

```
.ai/memory/
  patterns/
    retry-with-jitter.md      # "How we implement retries"
    auth-audit-logging.md     # "Auth changes must include audit logs"
  gotchas/
    payment-module-tests.md   # "Integration tests need mock server running"
  decisions/
    adr-001-retry-strategy.md # Formal architecture decisions
```

**Memory Distillation Flow**:
```
Sessions → Analysis → Proposed Memory → Human Review → Merged to .ai/memory/
```

The `otc learn propose` command analyzes recent sessions and generates candidate memory entries as a PR. Team reviews and merges.

**CLI Commands**:
```bash
otc handoff                      # Save session artifact, generate summary
otc continue <session>           # Resume a previous session
otc sessions list                # Show recent sessions
otc learn propose                # Generate team memory candidates
otc learn approve <memory-id>    # Fast-track approve a memory entry
```

**Success Criteria**:
- 90%+ of sessions produce valid artifacts automatically
- Session continuation successfully resumes work 60%+ of the time (see limitations)
- Team memory grows by 2-5 entries per month organically

**Limitations (Session Continuation)**:

> **70% restoration fidelity is a ceiling**, not a target to improve. This is a fundamental constraint of LLM context windows, not a bug.

| Limitation | Cause | Implication |
|------------|-------|-------------|
| Earlier reasoning chains lost | 200K token context limit | Long sessions exceed context; older turns pruned |
| Implicit mental models not captured | Summaries compress thought process | Nuanced understanding may not transfer |
| Dead-end attempts invisible | Compaction focuses on progress | New developer may retry failed approaches |

**Design Guidance**:
- 70% fidelity is sufficient for **task-oriented handoffs** (bug fixes, feature completion)
- **Exploratory work** is less suited for handoff; prefer shorter sessions with explicit breaks
- Team knowledge in `.ai/memory/` supplements what session artifacts cannot capture
- Design for structured decision capture, not perfect context replay

---

### Primitive C: Presence & Collision

**Problem Solved**: Teams have no ambient awareness of parallel work. Developers unknowingly create conflicts, duplicate effort, or step on each other's work.

**Design Philosophy**: Suggestive, not policing. Surface information, don't block action. Opt-in visibility for active work.

**Signal Sources**:

| Signal | Source | Latency |
|--------|--------|---------|
| Open PRs touching similar files | Azure DevOps API | Real-time |
| Recent commits in area | Git log analysis | On-demand |
| Active branches in area | Git branch analysis | On-demand |
| Active sessions (opt-in) | Lightweight heartbeat | Near real-time |

**Active Session Visibility (Opt-In)**:

Developers can optionally signal "I'm working in this area":
```bash
otc claim auth-service          # "I'm working here"
otc unclaim                      # Clear my claim
```

Claims are:
- Ephemeral (auto-expire after 4 hours or on terminal close)
- Visible to team via `otc status`
- Non-blocking (purely informational)

**Collision Detection**:

When starting work or before committing:
```bash
otc status auth-service
```

Output:
```
Area: auth-service/src/auth/

Recent Activity (7 days):
  • 3 commits by @sarah (token refresh logic)
  • 1 commit by @mike (logging changes)

Open PRs:
  • PR #1823: "Add OAuth2 PKCE support" (@sarah) - touches auth/oauth.py
  • PR #1819: "Fix token expiry edge case" (@dave) - touches auth/tokens.py

Active Sessions:
  • @sarah is working in auth-service (claimed 2h ago)

Recommendation: Coordinate with @sarah before making auth/ changes.
```

**Watch Mode**:
```bash
otc watch auth/                  # Alert me if someone else touches this
```

Creates a local watch that notifies (terminal bell or system notification) when:
- New PR opens touching watched files
- New commits land in watched area
- Another developer claims the watched area

**CLI Commands**:
```bash
otc status [area]               # Who's working where, open PRs, recent activity  
otc claim [area]                # Signal "I'm working here" (opt-in)
otc unclaim                     # Clear my active claim
otc watch <path>                # Alert on activity in area
otc unwatch <path>              # Stop watching
```

**Success Criteria**:
- Collision warnings prevent at least 1 merge conflict per developer per month
- < 30% of developers opt out of active session visibility
- `otc status` becomes part of "starting work" ritual

---

### Primitive D: PR Loop

**Problem Solved**: AI-assisted work needs to land in the PR workflow where teams actually collaborate. Posting to Slack or a dashboard is a dead end.

**Azure DevOps Integration Points**:

| Action | ADO API | Bot Behavior |
|--------|---------|--------------|
| Read PR diff | `GET /pullrequests/{id}/diff` | Fetch for analysis |
| Read PR comments | `GET /pullrequests/{id}/threads` | Understand human feedback |
| Post review comment | `POST /pullrequests/{id}/threads` | Structured review |
| Update PR description | `PATCH /pullrequests/{id}` | Summary generation |
| Add PR label | `POST /pullrequests/{id}/labels` | Risk tagging |

**PR Workflows**:

**1. PR Summarization**
```bash
otc pr summarize 1847
```
- Analyzes diff and commit messages
- Generates structured PR description
- Includes: summary, changes by area, risks, test coverage notes
- Posts as PR description update (or comment if no edit permission)

**2. PR Review**
```bash
otc pr review 1847
```
- Fetches diff and applies `.ai/review.md` rubric
- Posts review as threaded comments with severity tags
- Severity levels: `[critical]`, `[warning]`, `[suggestion]`, `[note]`
- Single "AI Review" thread that updates (doesn't spam)

**3. Test Plan Generation**
```bash
otc pr testplan 1847
```
- Analyzes changes and identifies risk areas
- Generates risk-based test plan
- Suggests manual test scenarios for non-automated cases
- Posts as PR comment

**4. Review Follow-up**
```bash
otc pr followup 1847
```
- Fetches new human comments since last AI review
- Re-analyzes in context of feedback
- Posts updated recommendations

**5. Session Linking**
```bash
otc pr link 1847
```
- Attaches current session artifact to PR
- Creates "AI Worklog" comment with session summary
- Updates on subsequent `otc handoff` calls

**Multi-Session PR Support**:

Real PRs span multiple sessions and days. The PR loop handles this:
- Sessions "attach" to a PR via `otc pr link`
- Subsequent sessions on same PR/branch accumulate
- Single "AI Worklog" comment updates with each session
- Full session artifacts linked for deep dive

**Comment Format Template**:
```markdown
## 🤖 AI Review (OpenTeamCode)

**Reviewed**: 2026-01-13 14:32 UTC | **Model**: claude-sonnet-4.5 | **Session**: [2026-01-13-retry-logic](.ai/sessions/2026-01-13-retry-logic/session.md)

### Summary
Brief summary of the changes and overall assessment.

### Findings

#### 🔴 Critical
- **file.py:42**: Description of critical issue
  ```python
  # Problematic code
  ```
  **Suggestion**: How to fix

#### 🟡 Warnings  
- **file.py:87**: Description of warning

#### 🟢 Suggestions
- **file.py:123**: Optional improvement

### Test Coverage
- [ ] Unit tests for retry logic
- [ ] Integration test with mock failures
- [x] Existing auth tests still pass

---
*Generated by OpenTeamCode v0.1.0 | [Feedback](link) | [Session Details](.ai/sessions/...)*
```

**CLI Commands**:
```bash
otc pr summarize <id>           # Generate/update PR description
otc pr review <id>              # Post structured review comments
otc pr testplan <id>            # Generate risk-based test plan
otc pr followup <id>            # Re-review after human feedback
otc pr link <id>                # Attach session to PR
otc pr status <id>              # Show AI activity on this PR
```

**Success Criteria**:
- AI reviews catch at least 1 issue per PR that humans confirm as valid
- PR descriptions generated by AI require < 20% human editing
- Developers prefer `otc pr review` over waiting for human review for initial feedback

---

### Primitive E: Guardrails

**Problem Solved**: Enterprise teams need predictable, auditable policy enforcement. "Guardrails" can't be hand-wavy—they must be explainable and tiered.

**Scope & Limitations**:

The feasibility assessment (January 2026) established that guardrails are **syntactic and procedural**, not semantic. Deep code analysis is out of scope.

| Category | In Scope | Out of Scope |
|----------|----------|--------------|
| **Secrets Detection** | ✅ Regex patterns, entropy analysis | ❌ Context-aware secret detection |
| **Path-Based Rules** | ✅ File/directory pattern matching | ❌ Semantic code area detection |
| **Approval Workflows** | ✅ ADO API integration for GATE tier | ❌ Complex multi-party approval chains |
| **Audit Logging** | ✅ Event capture via OpenCode Bus | ❌ Full conversation replay |
| **Security Analysis** | ❌ SQL injection data flow analysis | |
| **Data Privacy** | ❌ PII detection via logic tracing | |
| **Business Logic** | ❌ Missing audit log detection | |

> **Why This Matters**: Semantic analysis requires deep code understanding beyond pattern matching. This would require integration with dedicated SAST (Static Application Security Testing) tools, which is a Phase 3+ consideration. The current scope delivers reliable syntactic guardrails rather than unreliable semantic ones.

**Guardrail Levels**:

| Level | Behavior | User Experience | Bypass |
|-------|----------|-----------------|--------|
| **INFO** | Log, don't interrupt | Subtle note in session artifact | N/A |
| **WARN** | Prominent message | Yellow warning, requires `--ack` to proceed | `--ack` flag |
| **GATE** | Requires approval | Blocks until designated reviewer approves | Approval workflow |
| **BLOCK** | Hard stop | Red error, no bypass | None (security) |

**Examples by Level**:

| Level | Example Trigger |
|-------|-----------------|
| INFO | "FYI: This file hasn't been modified in 2 years" |
| WARN | "This pattern has caused incidents before (see ADR-042)" |
| WARN | "Changes to auth/ usually require security review" |
| GATE | "Payment processing changes require @security-team sign-off" |
| BLOCK | "Secrets detected in prompt context" |
| BLOCK | "Attempting to exfiltrate code to unauthorized endpoint" |

**Enforcement Points**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Input                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PRE-FLIGHT    │  ← Secrets scan, context validation
                    │   Guardrails    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Model Call    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    RUNTIME      │  ← Output validation, diff analysis
                    │   Guardrails    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    PRE-PR       │  ← Before posting to Azure DevOps
                    │   Guardrails    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PR Posted     │
                    └─────────────────┘
```

**Policy Configuration** (`.ai/policies.yaml`):
```yaml
version: "1.0"

guardrails:
  # Secrets detection (always BLOCK)
  - id: secrets-in-prompt
    level: block
    check: pre-flight
    pattern: secrets-regex
    message: "Secrets detected in prompt. Remove before continuing."
    
  # High-risk area warning
  - id: auth-module-changes
    level: warn
    check: runtime
    paths: ["src/auth/**", "src/security/**"]
    message: "Auth module changes typically require security review."
    link: "https://wiki/security-review-process"
    
  # Payment changes require approval
  - id: payment-gate
    level: gate
    check: pre-pr
    paths: ["src/payment/**", "src/billing/**"]
    approvers: ["@security-team", "@payment-owners"]
    message: "Payment changes require sign-off before PR."
    
  # Stale file notice
  - id: stale-file-notice
    level: info
    check: runtime
    condition: "file.last_modified < 2_years_ago"
    message: "This file hasn't been modified in over 2 years."

# Mode overrides
modes:
  hotfix:
    # Stricter in hotfix mode
    - id: auth-module-changes
      level: gate  # Escalate from warn to gate
    - id: minimal-diff
      level: warn
      condition: "diff.lines > 50"
      message: "Hotfix should be minimal. This diff is large."
      
  explore:
    # Relaxed in explore mode
    - id: auth-module-changes
      level: info  # Downgrade to info
```

**Escalation Path**:

When a GATE guardrail fires:
1. Session pauses with clear explanation
2. Developer can request exception via `otc guardrail request <id>`
3. Request creates notification to approvers (ADO PR comment or Teams/Slack)
4. Approver can approve via `otc guardrail approve <request-id>` or ADO
5. Session resumes with approval logged in artifact

**Audit Trail**:

Every guardrail event is logged:
```json
{
  "timestamp": "2026-01-13T14:32:00Z",
  "session_id": "2026-01-13-retry-logic",
  "guardrail_id": "payment-gate",
  "level": "gate",
  "trigger": "file src/payment/client.py modified",
  "action": "blocked",
  "resolution": {
    "type": "approved",
    "approver": "sarah@company.com",
    "timestamp": "2026-01-13T14:45:00Z"
  }
}
```

**Offline Behavior**:

Policies are cached locally on `otc sync`. When policy service is unreachable:
- Use cached policies (with "stale policy" warning)
- Log events locally, sync when reconnected
- BLOCK-level guardrails still enforced from cache

**CLI Commands**:
```bash
otc sync                         # Pull latest policies, cache locally
otc guardrail list               # Show active guardrails for current context
otc guardrail explain <id>       # Why did this guardrail fire?
otc guardrail request <id>       # Request exception for GATE guardrail
otc guardrail approve <req-id>   # Approve an exception request
otc guardrail history            # Show guardrail events in current session
```

**Success Criteria**:
- Zero secrets leak through to model context (BLOCK effectiveness)
- < 5% false positive rate on WARN/GATE guardrails
- Guardrail events are cited in compliance audits successfully
- Developers understand why guardrails fired (explanation quality)

---

### Primitive F: Model Routing (Deferred)

> **Status**: DEFERRED - Pending validation that model routing is a real team pain point.

Model Routing was originally envisioned as the sixth primitive, providing explicit routing policies for model selection and budget enforcement. However, the feasibility assessment (January 2026) identified:

1. **OpenCode already provides model selection** - Unclear if additional routing layer adds value
2. **Complexity may not be justified** - Simple budget visibility may be sufficient
3. **Higher priority features exist** - Session continuation, PR loop, and guardrails should come first

**Recommendation**: Defer until Phase 2+ and only implement if budget or model selection emerges as a validated pain point during MVP usage.

**What's Preserved**:
- Basic cost tracking via OpenCode's existing capabilities
- Model selection via OpenCode configuration
- Manual override options

**Full Specification**: See Appendix D for the complete deferred design.

---

## Repository Structure: The `.ai/` Convention

Every repository using OpenTeamCode has a standardized `.ai/` folder:

```
repo-root/
├── .ai/
│   ├── config.yaml              # OpenTeamCode configuration
│   ├── standards.md             # Coding standards and patterns
│   ├── review.md                # PR review rubric
│   ├── changes.md               # Changelog template
│   ├── adr.md                   # ADR template
│   ├── policies.yaml            # Guardrail configuration
│   ├── routing.yaml             # Model routing overrides
│   │
│   ├── memory/                  # Curated team knowledge
│   │   ├── patterns/
│   │   │   └── retry-logic.md
│   │   ├── gotchas/
│   │   │   └── payment-tests.md
│   │   └── decisions/
│   │       └── adr-001.md
│   │
│   └── sessions/                # Session artifacts
│       ├── 2026-01-13-retry-logic/
│       │   ├── session.json
│       │   ├── session.md
│       │   ├── context.jsonl
│       │   └── working-set.patch
│       └── ...
│
├── src/
├── tests/
└── ...
```

**File Purposes**:

| File | Purpose | Loaded When |
|------|---------|-------------|
| `config.yaml` | Repo-specific OTC settings | Every session |
| `standards.md` | Injected into system prompt | Every session |
| `review.md` | Rubric for `otc pr review` | PR review commands |
| `changes.md` | Template for changelog generation | Release workflows |
| `adr.md` | Template for architecture decisions | `otc adr` commands |
| `policies.yaml` | Repo-specific guardrails | Merged with org policy |
| `routing.yaml` | Repo-specific model routing | Merged with org routing |
| `memory/**` | Team knowledge base | Loaded on relevant queries |
| `sessions/**` | Session artifacts | On `otc continue` |

**Bootstrapping a New Repo**:
```bash
cd new-repo
otc init
```

Creates `.ai/` folder with templates and sensible defaults.

---

## CLI Command Reference

### Core Loop (Daily Use)

| Command | Description |
|---------|-------------|
| `otc` | Launch interactive TUI with team defaults |
| `otc run "<task>"` | One-shot task with team context |
| `otc ask "<question>"` | Quick question against repo + team memory |
| `otc handoff` | Save current session as portable artifact |
| `otc continue <session>` | Resume a previous session |

### Team Awareness

| Command | Description |
|---------|-------------|
| `otc status [area]` | Who's working where, open PRs, recent activity |
| `otc context [path]` | What does the team know about this code? |
| `otc impact [branch]` | What breaks if I merge this? |
| `otc claim [area]` | Signal "I'm working here" (opt-in) |
| `otc unclaim` | Clear active claim |
| `otc watch <path>` | Alert on activity in area |

### PR Workflows

| Command | Description |
|---------|-------------|
| `otc pr summarize <id>` | Generate/update PR description |
| `otc pr review <id>` | Post structured review comments |
| `otc pr testplan <id>` | Generate risk-based test plan |
| `otc pr followup <id>` | Re-review after human feedback |
| `otc pr link <id>` | Attach current session to PR |
| `otc pr status <id>` | Show AI activity on this PR |

### Memory & Learning

| Command | Description |
|---------|-------------|
| `otc sessions list` | Show recent sessions |
| `otc sessions search "<query>"` | Search session artifacts |
| `otc learn propose` | Generate team memory candidates from recent sessions |
| `otc learn approve <id>` | Approve a memory entry |
| `otc memory search "<query>"` | Search team memory |

### Governance & Policy

| Command | Description |
|---------|-------------|
| `otc sync` | Pull latest policies and prompt packs |
| `otc guardrail list` | Show active guardrails |
| `otc guardrail explain <id>` | Why did this fire? |
| `otc guardrail request <id>` | Request exception |
| `otc guardrail approve <req>` | Approve exception |

### Model & Budget

| Command | Description |
|---------|-------------|
| `otc model explain` | Show routing decision |
| `otc model override <model>` | Temporary override |
| `otc mode <mode>` | Switch mode (hotfix/normal/explore) |
| `otc budget` | Show budget status |
| `otc budget history` | Cost breakdown |

### Utilities

| Command | Description |
|---------|-------------|
| `otc init` | Bootstrap `.ai/` folder in repo |
| `otc doctor [session]` | Health check and repair |
| `otc salvage <session>` | Extract from corrupted session |
| `otc config` | View/edit configuration |
| `otc version` | Show version info |
| `otc help [command]` | Help and documentation |

---

## Technical Architecture

### Component Overview

OpenTeamCode uses a **Plugin + CLI hybrid** architecture as detailed in the Solution Architecture section above. The two primary components are:

**OpenCode Plugin (`@openteamcode/plugin`)**:
- Runs within the OpenCode process
- Direct access to session state, Bus events, permissions
- Handles: Guardrail hooks, team memory lookup, session artifact generation

**OpenTeamCode CLI (`otc`)**:
- Standalone command-line tool
- Orchestration and external integrations
- Handles: Config generation, session handoff/continue, ADO PR workflows, context graph queries

See the Integration Architecture diagram in the Solution Architecture section for the visual representation.

### Key Technical Decisions

#### Decision 1: OpenCode Integration Strategy

**Options Evaluated**:

| Approach | Pros | Cons |
|----------|------|------|
| **Subprocess wrapper** | Clean separation, upstream updates free | ~40% overhead, limited UX control, awkward state passing |
| **Fork and extend** | Deep integration, full control | Maintenance burden, drift from upstream |
| **Plugin + CLI hybrid** | Direct OpenCode access + clean separation for external integrations | Depends on OpenCode plugin API stability |

**Decision**: Use **Plugin + CLI hybrid** architecture.

**Rationale**: The feasibility assessment (January 2026) found subprocess wrapper adds ~40% overhead and limits access to OpenCode internals. Plugin + CLI hybrid provides:
- No overhead for in-session features (guardrails, memory lookup)
- Direct access to OpenCode's Bus events for audit logging
- Clean separation for external integrations (ADO, context graph)
- Potential to contribute plugin upstream

#### Decision 2: State Storage Location

| State Type | Storage | Rationale |
|------------|---------|-----------|
| Prompt packs | `.ai/` in repo | Version control, co-located with code |
| Session artifacts | `.ai/sessions/` in repo | Shareable, auditable, survives service outages |
| Team memory | `.ai/memory/` in repo | Governed via PR, version controlled |
| Context graph | Central blob storage | Too large for every repo, cross-repo queries |
| Presence signals | Central service (ephemeral) | Real-time, doesn't need persistence |
| Usage metrics | Central service | Aggregation, dashboards, compliance |
| Guardrail rules | Central + local cache | Central governance with offline fallback |

**Principle**: Default to repo storage, escalate to central service only when necessary.

#### Decision 3: Authentication Model

| Approach | Use Case | Implementation |
|----------|----------|----------------|
| **PAT (MVP)** | Initial rollout | Developers already have PATs |
| **OAuth (GA)** | Production use | Standard flow, token refresh |
| **Service Principal** | Background jobs | Context graph builds, batch analysis |

**Decision**: PAT for MVP, OAuth for GA, Service Principal for automation.

#### Decision 4: Context Graph Architecture

**Phase 1 (MVP - up to 20 repos)**:
- Nightly CI job per repo extracts dependencies
- Writes to central JSON file in blob storage
- CLI fetches and queries locally

**Phase 2 (Scale - 50+ repos)**:
- Webhook-triggered incremental updates
- SQLite or lightweight graph DB
- Query API with caching

### Error Handling & Resilience

| Failure Mode | Behavior |
|--------------|----------|
| Model API unavailable | Save state locally, show retry command |
| Policy service unreachable | Use cached policies with "stale" warning |
| Azure DevOps unreachable | Queue PR actions locally, sync when connected |
| Context graph unavailable | Proceed with local context only, warn user |
| Session corruption | Offer `otc doctor` / `otc salvage` recovery |

**Principle**: Never lose work. Never block completely.

---

## Phase 0: Validation Requirements

Before committing to full implementation, OpenTeamCode requires validation of critical hypotheses. Phase 0 is a **decision gate**—implementation proceeds only if validations succeed.

### Why Validation First

The feasibility assessment (January 2026) identified that core value propositions are **unvalidated assumptions**:

1. Session continuation actually provides value (developers might prefer starting fresh)
2. Standards injection achieves useful compliance rates
3. Guardrails don't create unacceptable friction
4. Teams will maintain `.ai/` conventions over time

Building features before validating these risks significant wasted effort.

### The Four Critical Validations

#### Validation 1: Session Continuation Value

**Hypothesis**: Developers benefit from session artifacts and can productively continue another developer's session.

**Test Protocol**:
1. Conduct 10 real handoff scenarios between team members
2. Export OpenCode compaction summaries manually
3. Second developer continues from artifact
4. Measure: Success rate, time to productivity, satisfaction score

**Success Criteria**: >60% of handoffs result in productive continuation without extensive re-explanation

**If Validation Fails**: Pivot to artifact generation for audit trail and documentation, not continuation. Session artifacts become historical records rather than working documents.

#### Validation 2: Standards Injection Effectiveness

**Hypothesis**: LLMs consistently follow instructions from `.ai/standards.md` with useful compliance rates.

**Test Protocol**:
1. Create `.ai/standards.md` with specific, measurable patterns (naming conventions, error handling, import ordering)
2. Run identical coding tasks with and without standards injection
3. Score compliance on each specific standard
4. Test across multiple LLM providers/versions

**Success Criteria**: >80% compliance with injected standards across test scenarios

**If Validation Fails**: Investigate stronger enforcement (post-generation validation) or accept standards as suggestions rather than expectations.

#### Validation 3: Guardrails False Positive Rate

**Hypothesis**: Secrets detection and WARN-level guardrails achieve acceptable accuracy without blocking legitimate work.

**Test Protocol**:
1. Deploy secrets detection patterns on test repositories
2. Run against real codebases and typical prompts
3. Measure false positive rate (legitimate code flagged incorrectly)
4. Track developer sentiment and bypass attempts

**Success Criteria**: <5% false positive rate with developers keeping guardrails enabled

**If Validation Fails**: Reduce guardrail scope to BLOCK-only (high-confidence secrets). Defer WARN/GATE tiers until detection improves.

#### Validation 4: Team Maintenance Discipline

**Hypothesis**: Teams will maintain `.ai/` conventions over time rather than abandoning them.

**Test Protocol**:
1. Run 4-week pilot with real team using `.ai/` folder
2. Monitor update frequency (commits to `.ai/` files)
3. Track standards staleness (do they reflect current practices?)
4. Measure memory growth (is `.ai/memory/` accumulating useful patterns?)

**Success Criteria**: Standards updated at least weekly; team memory grows organically (2-5 entries per month); no complete abandonment during pilot

**If Validation Fails**: Increase automation (`otc learn propose` generates candidates). Simplify formats and reduce required files. Consider whether convention-based approach is viable for the team.

### Decision Gate

| Validation | Passes | Action |
|------------|--------|--------|
| All 4 pass | ✅ | Proceed to Phase 1 (MVP) implementation |
| 3 of 4 pass | ⚠️ | Proceed with adjusted scope for failed area |
| 2 or fewer pass | ❌ | Revisit product thesis; significant pivot required |

### Phase 0 Deliverables

| Deliverable | Purpose |
|-------------|---------|
| Validation results document | Evidence for each hypothesis |
| Recommended scope adjustments | Based on validation findings |
| Updated PRD (if needed) | Reflecting any pivots |
| Go/no-go recommendation | For Phase 1 implementation |

---

## MVP Definition

> **Prerequisite**: Phase 0 validation must pass before MVP implementation begins. See "Phase 0: Validation Requirements" above.

### MVP Scope (Phase 1)

**Team**: 2-3 engineers
**Target**: Single team (5-10 developers), 5-15 repos

**Included**:

1. **Core CLI with OpenCode integration**
   - `otc` launches TUI with team context
   - `otc run`, `otc ask` work with injected standards
   - Plugin + CLI hybrid architecture (see Integration Architecture)

2. **Repo-first prompt packs (`.ai/`)**
   - Auto-discovery and loading
   - `standards.md` injection into system prompt
   - `otc init` bootstrapping

3. **Session artifacts (basic)**
   - `otc handoff` saves structured artifact
   - `otc continue` resumes with drift detection
   - Machine-readable + human-readable formats

4. **PR workflows (Azure DevOps)**
   - `otc pr summarize` generates descriptions
   - `otc pr review` posts structured comments
   - PAT authentication

5. **Basic guardrails**
   - Secrets detection (BLOCK level)
   - Configurable WARN-level rules
   - Local policy caching

**Excluded from MVP**:
- Context graph (cross-repo awareness) - Phase 2
- Team memory distillation - Phase 3
- Presence/collision detection - Phase 2
- OAuth authentication - Phase 3
- Central policy service - Phase 3
- Budget tracking/enforcement - Phase 2/3
- Watch/notification features - Phase 2+
- Model routing - Deferred pending validation (see Appendix D)

### MVP Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Adoption | 80% of target team using weekly | Usage telemetry |
| Session completion | 70% of sessions produce valid artifacts | Artifact validation |
| PR review quality | AI catches 1+ valid issue per PR | Human confirmation |
| Time to value | < 5 seconds from terminal to coding | Timing measurement |
| Developer NPS | > 20 | Survey at week 4, 8 |

### MVP+ (Phase 2)

**Prerequisites**: MVP success metrics met

**Adds**:
- Presence/collision (PR-based + opt-in active sessions)
- Cross-repo context graph (nightly batch)
- Feedback capture (`otc feedback` → learning)
- Budget tracking (visibility only, no enforcement)

### Full Product (Phase 3)

**Prerequisites**: MVP+ success metrics met

**Adds**:
- Team memory distillation
- Real-time context graph updates
- Budget enforcement (if validated as pain point)
- OAuth authentication
- Model routing (if validated as pain point during MVP/MVP+ - see Appendix D)
- Central policy service
- Multi-team/multi-org support
- Admin dashboard

---

## Rollout Strategy

### Phase 1: Private Alpha (Weeks 1-4)

**Participants**: 3-5 developers from one team (hand-picked early adopters)

**Goals**:
- Validate core workflow assumptions
- Identify blocking bugs and UX issues
- Refine `.ai/` conventions based on real use
- Build internal champions

**Support Model**: Direct Slack channel with product team

### Phase 2: Team Beta (Weeks 5-8)

**Participants**: Full target team (5-10 developers)

**Goals**:
- Validate at team scale
- Test session handoff between developers
- Measure productivity impact
- Refine PR workflow templates

**Support Model**: Weekly office hours + Slack channel

### Phase 3: Multi-Team Pilot (Weeks 9-16)

**Participants**: 2-3 teams (20-30 developers)

**Goals**:
- Validate cross-team dynamics
- Test context graph at scale
- Refine governance and policy features
- Build case for broader rollout

**Support Model**: Documentation + designated team champions + escalation path

### Phase 4: General Availability

**Prerequisites**:
- MVP+ features complete
- Documentation comprehensive
- Support model scalable
- Success metrics consistently met

---

## Success Metrics

### Leading Indicators (Weekly)

| Metric | Definition | Target |
|--------|------------|--------|
| Active users | Developers using OTC at least once | 80% of enabled users |
| Session frequency | Sessions per developer per week | > 10 |
| Artifact completion | % sessions producing valid artifacts | > 70% |
| PR command usage | `otc pr *` commands per PR | > 0.5 |

### Lagging Indicators (Monthly)

| Metric | Definition | Target |
|--------|------------|--------|
| PR cycle time | Time from PR open to merge (with vs without OTC) | 20% reduction |
| Review revision rate | PRs requiring revisions after AI review | Below baseline |
| Handoff success | Sessions continued by another developer | > 30% |
| Developer NPS | "How likely to recommend OTC?" | > 30 |

### Business Metrics (Quarterly)

| Metric | Definition | Target |
|--------|------------|--------|
| Cost per merged PR | Total AI spend / merged PRs | Track trend |
| Time saved | Self-reported hours saved per week | > 2 hours |
| Knowledge retention | New hire ramp time | 20% reduction |
| Incident prevention | Issues caught by guardrails | Track count |

---

## Risks and Mitigations

### Risk 1: Session Continuation Doesn't Provide Real Value (CRITICAL)

**Risk**: Developers prefer starting fresh over continuing sessions. If 70% fidelity isn't useful and developers consistently prefer clean starts, the core product thesis fails.

**Mitigation**:
- **Phase 0 validation required** before implementation
- Test with 10 real handoff scenarios
- Success criteria: >60% productive continuations
- **Pivot strategy if validation fails**: Session artifacts become audit trail/documentation rather than continuation mechanism

**Why This Is Risk #1**: Session continuation is the core differentiator. If it doesn't provide value, OpenTeamCode becomes "team governance layer" rather than "team-native AI coding"—a smaller, more competitive market.

### Risk 2: Shadow Usage of Other Tools

**Risk**: Developers bypass OTC and use individual AI tools, undermining governance.

**Mitigation**:
- Make OTC the path of least resistance for team-visible work
- Don't try to block other tools—compete on value
- Capture value when work surfaces (PR submission, handoff)
- Track and report on "AI-assisted PRs" vs "manual PRs"

### Risk 3: Governance Feels Like Friction

**Risk**: Guardrails and policies slow developers down, causing resentment.

**Mitigation**:
- Principle: Pull over push (suggestions, not mandates)
- Minimize GATE and BLOCK guardrails (reserve for true security)
- Make guardrail rationale always visible (`otc guardrail explain`)
- Track false positive rate and tune aggressively

### Risk 4: Session Artifacts Become Stale

**Risk**: Developers don't maintain artifacts, handoff degrades to status quo.

**Mitigation**:
- Auto-generate artifacts (no manual effort for basic handoff)
- Drift detection makes stale sessions obvious
- `otc doctor` provides clear recovery path
- Don't require perfection—60%+ useful handoff is still valuable

### Risk 5: Context Graph Is Wrong

**Risk**: Cross-repo impact analysis gives false confidence, causes incidents.

**Mitigation**:
- Position as advisory, not authoritative (see Context Graph section)
- "Impact analysis suggests..." not "Impact analysis confirms..."
- Track accuracy and improve over time
- Always recommend human verification for high-risk changes

### Risk 6: OpenCode Dependency

**Risk**: OpenCode project changes direction, breaks our integration.

**Mitigation**:
- Plugin + CLI hybrid architecture provides abstraction layer
- Could swap to different foundation if needed
- Contribute plugin back to OpenCode to ensure alignment
- Design internal APIs to be foundation-agnostic
- Track OpenCode releases closely; plugin API has moderate churn risk

### Risk 7: Cost Overruns

**Risk**: Teams exceed AI budget, causing backlash or access revocation.

**Mitigation**:
- Budget visibility from day one (even before enforcement)
- Graduated warnings before hard stops
- Per-user daily caps prevent runaway sessions
- Model routing deferred; rely on OpenCode's built-in model selection initially

---

## Open Questions

> **Full Question Registry**: See `project_docs/unanswered-questions.md` for detailed question tracking with status, owners, and resolution plans.

### Critical Validations (Phase 0)

These must be answered before implementation:

1. **Session continuation value** (Q001): Do developers actually benefit from session artifacts, or do they prefer starting fresh?
2. **Standards injection effectiveness** (Q002): Will LLMs consistently follow instructions from `.ai/standards.md`?
3. **Guardrails false positive rate** (Q003): Can secrets detection achieve <5% false positives?
4. **Team maintenance discipline** (Q004): Will the team maintain `.ai/` conventions over time?

### Product Questions (Require Team Input)

1. **Session artifact privacy**: Should session artifacts be visible to entire team by default? Or opt-in sharing?
2. **Memory curation burden**: Who curates team memory? Rotating responsibility? Automated proposals?
3. **Guardrail friction threshold**: What level of guardrail friction is acceptable before developers bypass?
4. **Org-wide vs. repo-specific policies**: How do we handle policy inheritance?

### Answered Technical Questions

Several technical questions have been answered through research (see `project_docs/unanswered-questions.md`):

- ✅ **Session restoration mechanics**: OpenCode HTTP API (`POST /session/:id/summarize`) with plugin customization
- ✅ **ADO webhook reliability**: Polling fallback recommended; no delivery SLA
- ✅ **Context window limits**: ~168K tokens usable for 200K model; ~70% restoration fidelity
- ✅ **OpenCode plugin API stability**: Moderate-to-high risk; 8 breaking changes in 4 months
- ✅ **Multi-repo tooling patterns**: No mature polyrepo solution exists; custom tooling needed

### Remaining Technical Questions

1. **When does plugin become insufficient?**: At what point would we need to fork OpenCode?
2. **TSTU costs per ADO operation**: Requires empirical measurement via Usage dashboard
3. **Offline mode scope**: What's minimum useful functionality when fully offline?

---

## Appendix A: Competitive Landscape

| Product | Strengths | Gaps vs. OpenTeamCode |
|---------|-----------|----------------------|
| **Claude Code** | Excellent CLI UX, powerful reasoning | No team state, no governance, no PR integration |
| **Cursor** | Great IDE integration, popular | IDE-centric (not terminal-first), no team features |
| **GitHub Copilot** | Broad adoption, IDE integration | Limited reasoning, no session continuity, no team governance |
| **Codegen agents** (various) | Autonomous generation | Often lack tight feedback loop, no team orientation |
| **Internal chatbots** | Org-specific knowledge | Usually not coding-focused, poor developer UX |

**OpenTeamCode's differentiation**: Team-native primitives (shared state, governance, learning) with Claude Code-like terminal-first UX.

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Session** | A single coding work unit, typically one task/branch/PR |
| **Session artifact** | The portable bundle (JSON + MD + patch) that captures session state |
| **Handoff** | Saving session state for another developer to continue |
| **Continuation** | Resuming a previous session with full context |
| **Prompt pack** | The `.ai/` folder contents that inject into every session |
| **Team memory** | Curated knowledge that persists across sessions |
| **Context graph** | Cross-repo dependency index for impact analysis |
| **Guardrail** | Policy rule that can INFO/WARN/GATE/BLOCK actions |
| **Drift** | Changes that occurred between session handoff and continuation |

---

## Appendix C: Reference Documents

### Phase 0 Documents (Required First)
*To be created*:
- Phase 0 Validation Protocol
- Session Handoff Experiment Guide
- Standards Injection Test Suite
- Guardrails Testing Framework

### Implementation Documents
*To be created*:
- `.ai/` Folder Specification
- Session Artifact Schema (JSON Schema)
- Guardrail Policy Language Specification (syntactic rules only)
- Azure DevOps Integration Guide
- OpenCode Plugin Development Guide
- CLI Command Detailed Reference

### Deferred Documents
- Model Routing Policy Reference (see Appendix D; create if Model Routing validated as needed)

---

## Appendix D: Deferred Features

### Model Routing (Originally Primitive F)

> **Status**: DEFERRED until Phase 2+ pending validation of actual team pain point.

**Problem Addressed**: Without explicit routing policy, teams get inconsistent behavior and surprise costs. "Which model when" must be predictable and auditable.

**Why Deferred**: OpenCode already provides model selection. The feasibility assessment found unclear value in building a separate routing layer. Simple budget visibility may be sufficient for MVP.

**Revisit When**: Team reports budget overruns or model selection as pain points during MVP usage.

#### Originally Planned Routing Dimensions

| Dimension | Options | Criteria |
|-----------|---------|----------|
| **Task Type** | interactive, review, summarize, generate | Latency vs. reasoning tradeoff |
| **Risk Tier** | standard, elevated, critical | Code area sensitivity |
| **Context Size** | small, medium, large | Token count thresholds |
| **Budget State** | normal, warning, exceeded | Team/user budget status |
| **Mode** | normal, hotfix, explore | Developer-selected mode |

#### Originally Planned Routing Policy (`.ai/routing.yaml`)

```yaml
version: "1.0"

models:
  opus:
    id: "claude-opus-4-20250514"
    tier: premium
    cost_per_1k_tokens: 0.015
    max_context: 200000
    strengths: ["complex reasoning", "architecture", "security review"]

  sonnet:
    id: "claude-sonnet-4-5-20250929"
    tier: standard
    cost_per_1k_tokens: 0.003
    max_context: 200000
    strengths: ["coding", "review", "general tasks"]

  haiku:
    id: "claude-haiku-4-5-20251001"
    tier: economy
    cost_per_1k_tokens: 0.0008
    max_context: 200000
    strengths: ["summarization", "simple queries", "high volume"]

routing_rules:
  - condition: "task.type == 'interactive'"
    model: sonnet
    rationale: "Balance of speed and capability for coding"

  - condition: "task.type == 'review'"
    model: sonnet
    rationale: "Good reasoning for code review"

  - condition: "task.type == 'summarize'"
    model: haiku
    rationale: "Cost-effective for summarization"

  - condition: "risk.tier == 'critical' AND task.type == 'review'"
    model: opus
    rationale: "Security-critical code gets best reasoning"

  - condition: "budget.state == 'warning'"
    model: haiku
    override: true
    rationale: "Near budget cap, using economy model"

  - condition: "budget.state == 'exceeded'"
    action: block
    message: "Budget exceeded. Contact team lead or wait for reset."

modes:
  hotfix:
    default_model: opus
    rationale: "Production issues get best model"
  explore:
    default_model: haiku
    rationale: "Experimentation uses economy model"

budgets:
  team:
    monthly_limit_usd: 500
    warning_threshold: 0.8
  user:
    daily_limit_usd: 25
    warning_threshold: 0.8
```

#### Originally Planned CLI Commands

```bash
otc model explain              # Show current routing decision
otc model override <model>     # Temporary override (with justification)
otc mode <hotfix|normal|explore>  # Switch mode
otc budget                     # Show budget status
otc budget history             # Cost breakdown over time
```

#### Originally Planned Success Criteria

- Model routing decisions are explainable in plain English
- Budget overruns are prevented (blocked before exceeding)
- Cost per PR is trackable and trends downward over time
- Developers rarely need to manually override routing

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.2.0-draft | 2026-01-14 | Ken Stager, Claude | Post-feasibility revision: Plugin + CLI hybrid architecture, Phase 0 validation, Model Routing deferred, guardrails scoped to syntactic |
| 0.1.0-draft | 2026-01-13 | Ken Stager, Claude | Initial draft |

---

*This document is a living artifact. Feedback and contributions welcome.*

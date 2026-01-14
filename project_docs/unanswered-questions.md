# OpenTeamCode: Unanswered Questions

**Version**: 0.2.0
**Last Updated**: January 14, 2026
**Status**: Research & Planning Phase (7 technical questions answered)

This document tracks open questions requiring validation, investigation, team input, or further research before OpenTeamCode implementation can proceed with confidence.

---

## Question Status Key

| Status | Meaning |
|--------|---------|
| **OPEN** | Not yet investigated |
| **INVESTIGATING** | Research in progress |
| **BLOCKED** | Waiting on external input |
| **ANSWERED** | Resolved (move to Decisions or delete) |

---

## Critical Validations

These questions **must be answered** before committing to full implementation. Failure to validate these risks building features that don't provide value.

### Q001: Session Continuation Value

**Status**: OPEN
**Priority**: CRITICAL
**Owner**: TBD

**Question**: Do developers actually benefit from session artifacts, or do they prefer starting fresh?

**Why It Matters**: Session continuation is the core value proposition of OpenTeamCode. If developers find 70% fidelity insufficient and prefer clean starts, the entire product thesis is questionable.

**Validation Approach**:
1. Conduct 10 real handoff scenarios between team members
2. Export OpenCode compaction summaries manually
3. Second developer continues from artifact
4. Measure: Success rate, time to productivity, satisfaction score

**Success Criteria**: >60% of handoffs result in productive continuation without extensive re-explanation

**If Validation Fails**: Pivot to pure artifact generation (audit trail, documentation) rather than continuation. Session artifacts become historical records, not working documents.

---

### Q002: Standards Injection Effectiveness

**Status**: OPEN
**Priority**: CRITICAL
**Owner**: TBD

**Question**: Will LLMs consistently follow instructions from `.ai/standards.md`? What compliance rate is achievable?

**Why It Matters**: Team cohesion value depends on AI following team standards. If compliance is <80%, the "consistent team experience" value prop is undermined.

**Validation Approach**:
1. Create `.ai/standards.md` with specific, measurable patterns (naming conventions, error handling patterns, import ordering)
2. Run identical coding tasks with and without standards injection
3. Score compliance on each specific standard
4. Test across multiple LLM providers/versions

**Success Criteria**: >80% compliance with injected standards across test scenarios

**If Validation Fails**:
- Investigate stronger enforcement mechanisms (post-generation validation)
- Consider whether standards should be warnings/suggestions rather than expectations
- May need to accept lower consistency than envisioned

---

### Q003: Guardrails False Positive Rate

**Status**: OPEN
**Priority**: CRITICAL
**Owner**: TBD

**Question**: Can secrets detection achieve <5% false positive rate without blocking legitimate work?

**Why It Matters**: High false positive rates cause developers to disable or bypass guardrails, negating the governance value. Shadow AI risk increases.

**Validation Approach**:
1. Deploy secrets detection patterns on test repositories
2. Run against real codebases and typical prompts
3. Measure false positive rate (legitimate code flagged as secrets)
4. Track developer sentiment and bypass attempts

**Success Criteria**: <5% false positive rate with developers keeping guardrails enabled

**If Validation Fails**:
- Reduce guardrail scope to BLOCK-only (true secrets with high confidence)
- Defer WARN/GATE tiers until detection improves
- Consider allowlist patterns for common false positives

---

### Q004: Team Maintenance Discipline

**Status**: OPEN
**Priority**: CRITICAL
**Owner**: TBD

**Question**: Will the team actually maintain `.ai/` conventions over time, or will the folder be created then abandoned?

**Why It Matters**: OpenTeamCode's value compounds with maintained team knowledge. If `.ai/` folders become stale, the system degrades to status quo.

**Validation Approach**:
1. Run 4-week pilot with real team using `.ai/` folder
2. Monitor update frequency (commits to `.ai/` files)
3. Track standards staleness (do they reflect current practices?)
4. Measure memory growth (is `.ai/memory/` accumulating useful patterns?)

**Success Criteria**:
- Standards updated at least weekly
- Team memory grows organically (2-5 entries per month)
- No complete abandonment during pilot

**If Validation Fails**:
- Increase automation (`otc learn propose` generates candidates)
- Reduce friction (simpler formats, fewer required files)
- Consider whether convention-based approach is viable for your team

---

## Technical Questions

These questions require investigation and prototyping to answer. They affect implementation approach but are not fundamental blockers.

### Q005: OpenCode Plugin API Stability

**Status**: ANSWERED
**Priority**: HIGH
**Owner**: Research completed

**Question**: How stable is OpenCode's plugin API? What's the upgrade/breaking change risk?

**Why It Matters**: Plugin + CLI hybrid architecture depends on stable plugin integration points. Frequent breaking changes would increase maintenance burden.

**Answer**: **MODERATE-TO-HIGH RISK** - OpenCode's plugin system is actively evolving with frequent API changes.

**Key Findings**:
1. **8 breaking changes in 4 months** (September 2025 - January 2026):
   - Jan 11, 2026: `chat.system.transform` hook signature changed (added sessionID)
   - Dec 22, 2025: `experimental.session.compacting` hook redesigned
   - Dec 15, 2025: `chat.params` hook output expanded (added topK)
   - Sep 18, 2025: Major `tool()` API redesign (all custom tools needed migration)

2. **SDK auto-generated** from OpenAPI spec (239 commits regenerating types)
   - Types like `Provider`, `Model`, `Config` change without notice

3. **No versioning guarantees**: No CHANGELOG.md, no semver policy, no deprecation warnings

4. **Active ecosystem** (25+ third-party plugins) but likely experiencing churn

**Recommendations for OpenTeamCode**:
- Pin dependencies tightly (`@opencode-ai/plugin@1.1.19` not `^1.1.0`)
- Avoid experimental hooks (`experimental.*`) unless willing to update frequently
- Write defensive code with runtime validation
- Plan for monthly plugin updates aligned with OpenCode releases
- Create compatibility matrix documenting tested OpenCode versions

**Risk Rating Summary**:
| Component | Risk Level |
|-----------|-----------|
| Hook signatures | HIGH |
| SDK type stability | HIGH |
| Custom tools API | MODERATE |
| Plugin loading/lifecycle | MODERATE |

---

### Q006: Session Restoration Mechanics

**Status**: ANSWERED
**Priority**: HIGH
**Owner**: Research completed

**Question**: How do we trigger OpenCode's compaction on demand for `otc handoff`? Can we control the compaction prompt?

**Why It Matters**: Handoff quality depends on compaction generating useful continuation prompts.

**Answer**: Yes, compaction can be triggered on-demand via HTTP API and prompts are customizable via plugins.

**Key Findings**:

1. **Manual Compaction Trigger** (for `otc handoff`):
   ```
   POST /session/:sessionID/summarize
   Content-Type: application/json

   {
     "providerID": "anthropic",
     "modelID": "claude-3-5-sonnet-20241022",
     "auto": false
   }
   ```
   - Located at `server.ts` lines 1163-1221
   - `auto: false` indicates manual handoff (vs. automatic overflow)

2. **Prompt Customization** (three levels):
   - **Plugin hook**: `experimental.session.compacting` can inject context or override prompt entirely
   - **Config-based**: `opencode.jsonc` agent.compaction.prompt field
   - **Static file**: `src/agent/prompt/compaction.txt`

3. **Default Compaction Prompt**:
   > "Provide a detailed prompt for continuing our conversation above. Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next considering new session will not have access to our conversation."

4. **What's Preserved vs. Lost**:
   - **Preserved**: All messages, summary checkpoint, metadata, tool definitions, file diffs
   - **Lost**: Tool output content (set to `"[Old tool result content cleared]"`)

5. **Pruning Thresholds**:
   - `PRUNE_MINIMUM = 20,000` - Only prune if saving >20k tokens
   - `PRUNE_PROTECT = 40,000` - Keep newest 40k tokens of tool outputs
   - Protected tools: "skill" tool outputs never pruned

**Implementation for OpenTeamCode**:
```typescript
async function handoff(sessionID: string) {
  // 1. Trigger compaction
  await fetch(`/session/${sessionID}/summarize`, {
    method: "POST",
    body: JSON.stringify({
      providerID: "anthropic",
      modelID: "claude-3-5-sonnet-20241022",
      auto: false
    })
  });

  // 2. Load compacted messages for artifact
  const messages = await fetch(`/session/${sessionID}/message`);

  // 3. Save artifact with summary checkpoint
}
```

**Q013 (Compaction Prompt Quality) is also answered here** - the default prompt is sufficient for task-oriented handoffs. Team-specific context can be injected via plugin hook.

---

### Q007: Azure DevOps Webhook Reliability

**Status**: ANSWERED
**Priority**: MEDIUM
**Owner**: Research completed

**Question**: How reliable are Azure DevOps webhooks for real-time PR workflows? Do we need polling fallback?

**Why It Matters**: PR Loop features may depend on timely webhook delivery. Unreliable webhooks would require polling, increasing complexity and latency.

**Answer**: **Polling fallback is strongly recommended.** Azure DevOps has no explicit webhook delivery SLA.

**Key Findings**:

1. **No Delivery Guarantee SLA**: 99.9% uptime applies to overall service, not webhook delivery specifically

2. **Failure Modes**:
   - **Terminal (410 Gone)**: Subscription disabled immediately, no retries
   - **Transient (408, 502, 503, 504)**: Up to 8 retries with exponential backoff (max ~3 minutes)
   - **Enduring (404, 500, others)**: Subscription enters "probation" - **events are dropped, not queued**

3. **Probation Period** (critical gap):
   - Up to 7 retries over 36 hours
   - Events during probation are **permanently lost**
   - After 36 hours, subscription becomes `DisabledBySystem`

4. **Community Evidence**:
   - Multiple GitHub issues document reliability problems (ArgoCD, Atlantis, Fleet)
   - Configuration drift can silently break webhooks

**Recommended Architecture** (Hybrid):
```
Primary Path (Webhook):
  PR created/updated → Service Hook → Immediate processing

Fallback Path (Polling):
  Every 5-10 minutes → REST API query for:
    - PRs updated since last poll
    - PRs not yet processed by webhook path
```

**Polling Frequency**:
- Normal: 5-15 minute intervals
- During webhook degradation: 1-2 minute intervals
- Rate limit impact: Minimal (1-2 API calls per interval)

**Decision**: Implement webhooks as primary with polling fallback. Discrepancies between paths provide early warning of webhook degradation.

---

### Q008: Context Window Limits

**Status**: ANSWERED
**Priority**: MEDIUM
**Owner**: Research completed

**Question**: What's the practical session length ceiling before context degradation becomes noticeable?

**Why It Matters**: Understanding limits helps set appropriate expectations for session duration and handoff frequency.

**Answer**: Practical ceiling is ~168K tokens for 200K context models. Compaction triggers automatically at this threshold.

**Key Findings**:

1. **Usable Context Formula**:
   ```
   usable_context = context_limit - OUTPUT_TOKEN_MAX
   overflow = (input + cache.read + output) > usable_context
   ```
   - OUTPUT_TOKEN_MAX defaults to 32,000 tokens
   - For Claude 3.5 Sonnet (200K): usable = 200K - 32K = **168K tokens**

2. **Recommended Session Lengths Before Compaction**:
   | Model Context | Usable Input | Approximate Turns |
   |---------------|--------------|-------------------|
   | 64K | ~45K tokens | 30-50 turns |
   | 128K | ~90K tokens | 60-100 turns |
   | 200K+ | ~160K tokens | 100-200 turns |

3. **Pruning Behavior**:
   - First 2 user turns always protected
   - "skill" tool outputs never pruned
   - Summary messages (`summary=true`) never pruned
   - Older tool outputs cleared but messages preserved

4. **Degradation Pattern**:
   - Initial handoff preserves ~70% of relevant context
   - Compaction summarizes but loses intermediate reasoning
   - Early tool outputs are pruned to make room for new context
   - Multiple handoffs compound degradation

5. **Configuration Options**:
   ```json
   {
     "compaction": {
       "auto": true,   // Enable/disable automatic compaction
       "prune": true   // Enable/disable old tool output pruning
     }
   }
   ```

**Practical Guidance**:
- For complex tasks requiring long context: prefer larger models (200K+)
- For task-oriented work (bug fixes, features): 70% restoration is sufficient
- For exploratory work: prefer shorter sessions with explicit handoffs
- Team knowledge in `.ai/memory/` supplements lost context

---

## Product Questions

These questions require team discussion and input. They are not technical blockers but affect product design.

### Q009: Primitive Priority

**Status**: BLOCKED (needs team input)
**Priority**: HIGH
**Owner**: Team

**Question**: Which of the six primitives are highest priority for your team's actual pain points?

**Options**:
1. Context Graph (cross-repo awareness)
2. Durable Memory (session artifacts + team knowledge)
3. Presence & Collision (parallel work awareness)
4. PR Loop (Azure DevOps integration)
5. Guardrails (policy enforcement)
6. Model Routing (model selection + budget)

**Why It Matters**: Prioritization affects implementation order. Should focus on highest-pain areas first.

---

### Q010: Guardrail Friction Threshold

**Status**: BLOCKED (needs team input)
**Priority**: HIGH
**Owner**: Team

**Question**: What level of guardrail friction is acceptable before developers bypass the system?

**Considerations**:
- How many WARN prompts per session before annoying?
- How long can GATE approval take before blocking productivity?
- Should there be an "explore mode" that relaxes guardrails?

---

### Q011: Session Artifact Visibility

**Status**: BLOCKED (needs team input)
**Priority**: MEDIUM
**Owner**: Team

**Question**: Should session artifacts in `.ai/sessions/` be visible to the entire team by default, or opt-in sharing?

**Options**:
1. **Team-wide by default**: All sessions visible, developers can mark sensitive ones private
2. **Private by default**: Developers explicitly share sessions they want visible
3. **Branch-based**: Sessions on feature branches private, main branch sessions shared

**Considerations**:
- Privacy expectations for exploratory/failed attempts
- Value of seeing teammate's session artifacts
- Audit/compliance requirements

---

### Q012: Team Memory Curation

**Status**: BLOCKED (needs team input)
**Priority**: MEDIUM
**Owner**: Team

**Question**: Who is responsible for curating team memory in `.ai/memory/`?

**Options**:
1. **Rotating responsibility**: Different team member each sprint
2. **Automated proposals**: `otc learn propose` generates candidates, team reviews
3. **Organic growth**: Anyone can add, periodic cleanup reviews
4. **Tech lead ownership**: Single owner maintains quality

**Considerations**:
- Maintenance burden vs. value
- Quality control for team knowledge
- Avoiding stale or contradictory entries

---

## Research Gaps

These areas need additional research to inform design decisions.

### Q013: OpenCode Compaction Prompt Quality

**Status**: ANSWERED (see Q006)
**Priority**: MEDIUM
**Owner**: Research completed

**Question**: Is OpenCode's default compaction prompt sufficient for team handoffs, or does it need customization?

**Answer**: The default prompt is sufficient for task-oriented handoffs. Team-specific context can be injected via the `experimental.session.compacting` plugin hook.

**Default Prompt**:
> "Provide a detailed prompt for continuing our conversation above. Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next considering new session will not have access to our conversation."

**Customization for OpenTeamCode**:
```typescript
// Plugin hook to inject team context
export default {
  "experimental.session.compacting": async (input, output) => {
    output.context = [
      await loadFile(".ai/standards.md"),
      "Team: Platform Engineering",
      "Current sprint goal: API v2 migration"
    ];
    return output;
  }
}
```

See Q006 for full implementation details.

---

### Q014: Multi-Repo Tooling Patterns

**Status**: ANSWERED
**Priority**: LOW
**Owner**: Research completed

**Question**: What tools do other teams use for cross-repository awareness in Python codebases?

**Answer**: The Python multi-repo tooling landscape is fragmented. Strong options exist for monorepos (Pants, Bazel) but limited mature solutions for polyrepo dependency tracking.

**Key Findings**:

| Tool | Scope | Cross-Repo | Best For |
|------|-------|------------|----------|
| **pydeps** | Single repo | No | Visualizing internal module deps |
| **importlab** | Single repo | No | Dependency ordering for type checkers |
| **Pants** | Monorepo | Within monorepo | Python-first monorepo builds |
| **Bazel** | Monorepo | Within monorepo | Polyglot enterprise monorepos |
| **Sourcegraph** | Multi-repo | Yes (indexed) | Enterprise code intelligence (commercial) |
| **LibCST** | Library | N/A | Building custom refactoring tools |
| **NetworkX** | Library | N/A | Graph algorithm foundation |

**Gap Analysis**:
1. **No mature multi-repo Python tool** for polyrepo dependency tracking
2. Most tools track packages (PyPI), not internal module imports across repos
3. AST-based tools miss dynamic imports (`importlib.import_module()`)
4. Tooling assumes monorepo or single-repo

**Recommendations for Context Graph**:

**Short-Term (MVP)**:
- Use pydeps + NetworkX for per-repo dependency graphs
- Query Azure Artifacts to identify package consumption
- Parse `requirements.txt`/`pyproject.toml` for external deps

**Medium-Term**:
- Build custom AST scanner using LibCST + NetworkX
- Clone/index all team repos, build global dependency graph
- Store in SQLite/JSON for fast lookup

**Long-Term (if monorepo adoption)**:
- Leverage Pants dependency inference directly

**Implication**: OpenTeamCode will likely need to build custom Context Graph infrastructure rather than integrating existing tools.

---

### Q015: Azure DevOps Rate Limiting Impact

**Status**: ANSWERED
**Priority**: LOW
**Owner**: Research completed

**Question**: What's the practical impact of ADO rate limits (200 TSTUs/5min) for automated PR workflows?

**Answer**: Manageable for teams of 5-50 with proper architecture. Microsoft does NOT publish TSTU costs per operation - requires empirical measurement.

**Key Findings**:

1. **Rate Limit Structure**:
   - 200 TSTUs per 5-minute sliding window per user/identity
   - TSTU = "Team Services Throughput Unit" (abstract resource consumption)
   - Typical user: 10 or fewer TSTUs per 5 minutes

2. **Response Headers** (for proactive throttling):
   | Header | Purpose |
   |--------|---------|
   | `X-RateLimit-Remaining` | TSTUs remaining before delays |
   | `X-RateLimit-Reset` | When usage resets (epoch time) |
   | `Retry-After` | Seconds to wait if throttled |

3. **Critical Gap**: Microsoft does NOT publish TSTU costs per operation. Must measure empirically via Usage dashboard.

4. **Throttling Behavior**:
   - Near limit: requests delayed (ms to 30s)
   - Over limit: HTTP 429 returned
   - Recovery within 5 minutes once consumption drops

**Capacity Planning** (for 5-50 developers):

| Team Size | Strategy | Total Capacity |
|-----------|----------|----------------|
| 5 devs | Shared service principal | 200 TSTUs/5min |
| 10 devs | 2 service principals | 400 TSTUs/5min |
| 25 devs | 5 service principals | 1000 TSTUs/5min |
| 50 devs | Per-developer PATs | 10,000 TSTUs/5min |

**Recommended Implementation**:
1. **Monitor headers**: Track `X-RateLimit-Remaining` on all requests
2. **Adaptive throttling**: Reduce concurrency when approaching limits
3. **Request batching**: Combine operations where API supports
4. **Smart caching**: Cache PR metadata (5-min TTL)
5. **Custom User-Agent**: Set `OpenTeamCode/1.0` for Usage dashboard filtering

**Configuration Example**:
```yaml
azureDevOps:
  rateLimits:
    enabled: true
    warningThreshold: 50   # Start throttling
    criticalThreshold: 20  # Pause non-critical ops
  cache:
    enabled: true
    ttl: 300  # 5 minutes
```

**Next Step**: Deploy with custom User-Agent and measure actual TSTU costs via Usage dashboard.

---

## Answered Questions

*Questions that have been resolved are moved here for reference.*

### Technical Questions (7 answered)
- **Q005**: OpenCode Plugin API Stability → **MODERATE-TO-HIGH RISK** - 8 breaking changes in 4 months
- **Q006**: Session Restoration Mechanics → **HTTP API available** - `POST /session/:sessionID/summarize` with plugin customization
- **Q007**: Azure DevOps Webhook Reliability → **Polling fallback recommended** - No delivery SLA, events lost during probation
- **Q008**: Context Window Limits → **~168K tokens usable** for 200K model, ~70% restoration fidelity

### Research Gaps (3 answered)
- **Q013**: Compaction Prompt Quality → **Default sufficient** - Team context injectable via plugin hook (see Q006)
- **Q014**: Multi-Repo Tooling Patterns → **Custom tooling needed** - No mature polyrepo solution exists
- **Q015**: ADO Rate Limiting Impact → **Manageable** - 200 TSTUs/5min per identity, empirical measurement required

### Remaining Open Questions
- **Q001-Q004**: Critical validations requiring real user testing
- **Q009-Q012**: Product questions requiring team input

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.2.0 | 2026-01-14 | Claude (Opus 4.5) | Answered 7 technical/research questions (Q005-Q008, Q013-Q015) |
| 0.1.0 | 2026-01-14 | Claude (feasibility analysis) | Initial question catalog from feasibility assessment |

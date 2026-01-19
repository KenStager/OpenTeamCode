# OpenTeamCode: Executive Summary

---

## The Opportunity

AI coding assistants have transformed individual developer productivity. Tools like Claude Code, Cursor, and GitHub Copilot deliver measurable speed improvements for engineers working alone.

But these tools create a team-level problem: **everything valuable disappears when the session ends**.

The context a developer built with the AI, the decisions made, the patterns learned—all of it evaporates. The next developer starts from zero. The same mistakes get made repeatedly. Five engineers using the same AI tool produce five different coding styles with no consistency, no governance, and no audit trail.

Enterprise engineering teams need the speed of modern AI coding tools with the collaboration, governance, and institutional learning that team software development requires.

---

## The Foundation: OpenCode

OpenTeamCode builds on [OpenCode](https://github.com/opencode-ai/opencode), an open source AI coding agent that brings agentic coding capabilities to any environment. OpenCode provides a terminal-first interface where developers interact with an AI assistant that can read files, write code, run commands, and iteratively solve complex programming tasks—similar to tools like Claude Code or Cursor, but with full transparency and flexibility.

**Why OpenCode as a foundation:**

- **Open source**: Full visibility into how the tool works, with community-driven development and no vendor lock-in. Teams can audit, customize, and contribute back.
- **Model-agnostic**: Connect to any LLM provider—Anthropic Claude, OpenAI GPT, Azure AI Foundry models, or self-hosted alternatives—using the same familiar interface. Switch providers without changing workflows.
- **Terminal-first**: Developers stay in their preferred environment with a fast, keyboard-driven experience that integrates naturally with existing toolchains.
- **Extensible**: Plugin architecture enables customization without forking the codebase, allowing teams to add domain-specific capabilities.

OpenTeamCode extends this foundation with the team primitives that enterprise development requires.

---

## The Solution

**OpenTeamCode** is a team-native CLI extension for AI-assisted coding that transforms ephemeral individual sessions into durable, shareable, governed team state.

Built on OpenCode with a **Plugin + CLI hybrid** architecture, OpenTeamCode preserves the fast, terminal-first experience developers love while adding the primitives teams need:

| Individual AI Tools | OpenTeamCode |
|---------------------|--------------|
| State lives in chat, lost when session ends | State is shareable, versioned, continuable |
| Collaboration happens after the fact | Collaboration is built into the workflow |
| Standards are tribal knowledge | Standards inject automatically (100% compliance measured) |
| Handoff means "read my chat logs" | Handoff means "continue my session" |
| Every developer gets a different experience | Team gets consistent, governed results |
| No awareness of parallel work | Collision detection prevents conflicts *(coming soon)* |
| Knowledge stays in individual heads | Team memory accumulates patterns *(coming soon)* |

The platform delivers team capabilities through two complementary components:
- **OpenCode Plugin**: In-session features including standards injection, real-time guardrails, and PR workflow tools
- **OTC CLI**: Orchestration commands for session management, team setup, and Azure DevOps integration

---

## Core Capabilities

### Shared Context and Standards

Every repository contains a `.ai/` folder with team standards, review rubrics, and patterns. These inject automatically into every AI session—no manual prompt engineering, no inconsistency between developers.

*Measured outcome: 100% compliance with injected standards in controlled testing (vs. 27% baseline without standards).*

### Session Continuity

When a developer hands off work, they save a structured session artifact that another developer can continue—enabling meaningful task handoff with captured intent, decisions, and context.

### PR-Native Integration

AI-generated reviews, summaries, and test plans post directly to Azure DevOps pull requests. The team collaborates where they already work:
- `pr summarize`: Generate structured PR descriptions from diffs
- `pr review`: Post AI code review with categorized findings
- `pr testplan`: Create risk-based test plans

### Cross-Repository Awareness

Before making changes, developers receive guidance on what might be affected across service boundaries—understanding dependencies across the codebase before changes propagate unexpectedly. *(Full implementation coming soon)*

### Collision Detection

When multiple developers work on related areas simultaneously, the system alerts them to potential conflicts before they happen—preventing merge conflicts and duplicated effort. *(Coming soon)*

### Governance Without Friction

Configurable guardrails enforce security policies through pattern-based detection with clear feedback when violations are blocked.

*Measured outcome: 3.6% false positive rate, 90% true positive rate—security without developer friction.*

### Team Memory

The platform accumulates team knowledge over time. Patterns that work, decisions that were made, and lessons learned become part of the team's institutional memory—accessible to every developer in every session, reducing onboarding time and preventing repeated mistakes. *(Coming soon)*

---

## Target Users

**Primary**: Senior and staff engineers on Python platform teams working across multiple interconnected repositories, using Azure DevOps for source control and code review.

**Secondary**: Engineering managers and tech leads who need visibility into AI-assisted work patterns, cost tracking, and consistent quality standards.

**Tertiary**: New team members who benefit from accumulated team knowledge and consistent patterns during onboarding.

---

## What We Share

OpenTeamCode builds on capabilities that exist across modern AI coding tools:

| Capability | Available In |
|------------|--------------|
| Terminal-first interface | Claude Code, GitHub Copilot CLI, OpenTeamCode |
| Standards/instructions injection | All major tools (CLAUDE.md, .cursorrules, Copilot instructions) |
| PR summaries and reviews | GitHub Copilot (GitHub), Claude Code (GitHub Actions) |
| Enterprise audit logging | GitHub Copilot Enterprise |

## What Makes OpenTeamCode Different

| Unique Capability | Description |
|-------------------|-------------|
| **Open source, model-agnostic** | Built on OpenCode—use any LLM provider (Anthropic, OpenAI, Azure AI Foundry, self-hosted) |
| **Team session handoff** | Save structured session artifacts that teammates can actually continue, not just resume locally |
| **Azure DevOps native** | First-class ADO integration for teams not on GitHub |
| **Cross-repo awareness** | Understand dependencies across service boundaries before changes propagate *(roadmap)* |
| **Collision detection** | Know when teammates are working in the same areas before conflicts arise *(roadmap)* |
| **Structured team memory** | Curated `.ai/memory/` with patterns, gotchas, and decisions—not just flat instruction files *(roadmap)* |

OpenTeamCode doesn't compete with individual AI coding tools on raw capability. It competes on **team leverage**—turning individual productivity gains into organizational capability.

---

## Value Proposition

### For Developers

- Immediate coding start with team context already loaded
- Structured handoff for cleaner work transfers
- Consistent AI behavior aligned with team patterns
- Guidance on cross-repo impacts with recommended verification
- Awareness of what teammates are working on to avoid conflicts *(coming soon)*

### For Engineering Leaders

- Consistent quality standards through automated policy checks
- Visibility into AI usage, costs, and patterns
- Audit trails for compliance requirements
- Reduced onboarding time through accumulated team knowledge
- Team knowledge that compounds over time, not just individual productivity *(coming soon)*

### For the Organization

- AI investment delivers team-level returns, not just individual speedups
- Institutional knowledge accumulates over time
- Governance scales with adoption
- Foundation for AI-assisted development as a core capability

---

## Success Metrics

### Proven Capabilities

| Capability | Measured Result |
|------------|-----------------|
| Standards Compliance | 100% adherence when standards injected (vs. 27% baseline) |
| Guardrail Accuracy | 3.6% false positive rate, 90% true positive rate |
| Secret Detection | 0% false positives for high-confidence patterns (AWS keys, private keys) |

### Operational Targets

| Metric | Target |
|--------|--------|
| Session Handoff Success | >70% of handoffs result in productive continuation |
| Developer Adoption | 80% weekly usage as default AI coding interface |
| Session Collaboration | 30% of sessions handed off and continued |
| PR Review Quality | AI findings confirmed valid by human reviewers |

---

## Technical Foundation

OpenTeamCode extends OpenCode through a Plugin + CLI hybrid architecture:

- **Plugin Layer**: Hooks into OpenCode's permission system for guardrails, system prompt for standards injection, and tool registry for PR workflows
- **CLI Layer**: Standalone commands for session management, team setup, and operations that don't require an active AI session

This architecture was validated through focused experiments measuring real-world effectiveness of standards injection and guardrail accuracy.

---

## Roadmap

### Current Release

Core platform capabilities:
- Standards injection with automatic `.ai/` folder detection
- Secret detection guardrails with configurable patterns
- Azure DevOps PR workflows (summarize, review, testplan)
- Session export and continuation infrastructure
- Health checks and team setup tooling

### Near-Term

- Session handoff validation with pilot team (25+ scenario target)
- Team discipline assessment through 4-week maintenance pilot
- Pilot team deployment for production validation

### Future Releases

- Cross-repository awareness with dependency mapping
- Collision detection for parallel work
- Team memory distillation from accumulated patterns
- Multi-organization support

---

*OpenTeamCode: The speed of Claude Code. The leverage of a team.*

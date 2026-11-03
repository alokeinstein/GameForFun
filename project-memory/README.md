# Project Memory System

## Purpose
This directory stores the compact, persistent memory of the **MAFIA 3D Multiplayer** project across AI coding-agent sessions. It preserves high-level context, architectural decisions, feature registries, and current progress without bloating the context window with implementation minutiae.

---

## File Registry & Reading Protocol

### Mandatory Files for New Chat Sessions (Read in this exact order):
1. [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — Permanent project identity, core gameplay, technology stack, and architectural constraints.
2. [`FEATURES.md`](./FEATURES.md) — Concise feature registry (Implemented, In Progress, Planned) with purpose and behavior.
3. [`CURRENT_STATUS.md`](./CURRENT_STATUS.md) — Active milestone, completed milestones, blockers, and recent checkpoints.
4. [`CHANGES_LOG.md`](./CHANGES_LOG.md) — Chronological history of meaningful high-level changes (newest first).
5. [`NEXT_STEPS.md`](./NEXT_STEPS.md) — Immediate development priorities and actionable tasks for the current session.

### Conditional / On-Demand Files:
- [`decisions/DECISIONS.md`](./decisions/DECISIONS.md) — **DO NOT READ AUTOMATICALLY ON CHAT START.** Consult only when investigating bugs, modifying established features, assessing architectural trade-offs, or when requirements appear to conflict. See [`decisions/README.md`](./decisions/README.md).
- [`archive/`](./archive/) — Retired historical notes and outdated task checklists.

---

## Maintenance Protocol
Whenever meaningful project changes occur:
- **Feature completed / started:** Update [`FEATURES.md`](./FEATURES.md) and [`CURRENT_STATUS.md`](./CURRENT_STATUS.md).
- **New architectural decision:** Record in [`decisions/DECISIONS.md`](./decisions/DECISIONS.md) and update high-level summaries if behavior changed.
- **Milestone finished / meaningful bug fixed:** Record concise bullet in [`CHANGES_LOG.md`](./CHANGES_LOG.md) and update [`NEXT_STEPS.md`](./NEXT_STEPS.md).

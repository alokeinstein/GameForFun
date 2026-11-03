# Architectural & Product Decisions

## Purpose
This directory stores historical product, gameplay, architectural, security, and database decisions made throughout the lifecycle of the MAFIA 3D project.

---

## CRITICAL READING PROTOCOL

> [!IMPORTANT]
> **DO NOT READ `DECISIONS.MD` AUTOMATICALLY WHEN STARTING A NEW CHAT SESSION.**
> 
> Current gameplay rules and technical architecture are already summarized in [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) and [`FEATURES.md`](../FEATURES.md). Reading the entire decision ledger on every session startup wastes context window and introduces unnecessary overhead.

### When to Consult `DECISIONS.md`:
1. **Investigating a bug** involving established gameplay or networking behavior (e.g. why a tie resulted in zero kills).
2. **Understanding rationale** before modifying or replacing an existing feature.
3. **Evaluating architectural changes** to ensure they do not re-introduce previously solved pitfalls.
4. **Detecting requirement conflicts** where a new request appears to contradict earlier specifications.
5. **Direct user inquiry** regarding historical decisions or technical choices.

---

## Recording New Decisions
When a new architectural or product decision is approved:
- Assign a sequential ID (`DEC-001`, `DEC-002`, etc.).
- Record the decision using this exact template:

```markdown
### DEC-XXX: Decision title
- **Date:** YYYY-MM-DD
- **Area:** Gameplay / Architecture / Security / Database / UI / Networking
- **Decision:** What was decided.
- **Reason:** Why this decision was made and what alternatives were rejected.
- **Impact:** What existing or future behavior depends on it.
```

- Update high-level summaries in [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) or [`FEATURES.md`](../FEATURES.md) so subsequent agents do not need to read historical decisions to understand current behavior.

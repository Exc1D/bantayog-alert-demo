---
name: trailofbits-designing-workflow-skills
description: Use when creating skills with sequential pipelines, routing patterns, safety gates, task tracking, or phased execution. Also for reviewing or refactoring existing workflow skills. Trigger phrases: "design a workflow skill", "multi-step skill", "pipeline skill", "routing skill".
allowed-tools: Read, Glob, Grep, TodoRead, TodoWrite
---

# Designing Workflow Skills

Build workflow-based skills that execute reliably by following structural patterns.

## Essential Principles

**The `description` field is the only thing that controls when a skill activates.** Put trigger keywords, use cases, and exclusions in the description.

**Phases must be numbered with entry and exit criteria.** Every phase needs: a number, entry criteria, numbered actions, exit criteria.

**Tools must match the executor.** Skills use `allowed-tools:` in frontmatter. Agents use `tools:` in frontmatter. Subagents get tools from their `subagent_type`.

**Progressive disclosure is structural, not optional.** SKILL.md stays under 500 lines. Detailed patterns go in `references/`. One level deep — no reference chains.

**Instructions must produce tool-calling patterns that scale.** Combine into one regex — not N×M calls. Use batching — not one subagent per file.

**Match instruction specificity to task fragility.**
- **Low freedom** (exact commands): Fragile operations — migrations, crypto, destructive actions
- **Medium freedom** (pseudocode with parameters): Preferred patterns where variation is acceptable
- **High freedom** (heuristics): Variable tasks — code review, exploration, documentation

## Pattern Selection

```
How many distinct paths does the skill have?

+-- One path, always the same
|   +-- Does it perform destructive actions?
|       +-- YES -> Safety Gate Pattern
|       +-- NO  -> Linear Progression Pattern
|
+-- Multiple independent paths from shared setup
|   +-- Routing Pattern
|
+-- Multiple dependent steps in sequence
    +-- Do steps have complex dependencies?
        +-- YES -> Task-Driven Pattern
        +-- NO  -> Sequential Pipeline Pattern
```

| Pattern | Use When | Key Feature |
|---------|----------|-------------|
| **Routing** | Multiple independent tasks from shared intake | Routing table maps intent to workflow files |
| **Sequential Pipeline** | Dependent steps, each feeding the next | Auto-detection may resume from partial progress |
| **Linear Progression** | Single path, same every time | Numbered phases with entry/exit criteria |
| **Safety Gate** | Destructive/irreversible actions | Two confirmation gates before execution |
| **Task-Driven** | Complex dependencies, partial failure tolerance | TaskCreate/TaskUpdate with dependency tracking |

## Structural Anatomy

Every workflow skill needs this skeleton:

```markdown
---
name: kebab-case-name
description: "Third-person description with trigger keywords"
allowed-tools:
  - [minimum tools needed]
---

# Title

## Essential Principles
[3-5 non-negotiable rules with WHY explanations]

## When to Use
[4-6 specific scenarios]

## When NOT to Use
[3-5 scenarios with named alternatives]

## [Pattern-Specific Section]
[Routing table / Pipeline steps / Phase list / Gates]

## Quick Reference
[Compact tables for frequently-needed info]

## Reference Index
[Links to all supporting files]

## Success Criteria
[Checklist for output validation]
```

## Anti-Pattern Quick Reference

| AP | Anti-Pattern | One-Line Fix |
|----|-------------|-------------|
| AP-1 | Missing goals/anti-goals | Add When to Use AND When NOT to Use sections |
| AP-2 | Monolithic SKILL.md (>500 lines) | Split into references/ and workflows/ |
| AP-3 | Reference chains (A -> B -> C) | All files one hop from SKILL.md |
| AP-4 | Hardcoded paths | Use `{baseDir}` for all internal paths |
| AP-5 | Broken file references | Verify every path resolves before submitting |
| AP-6 | Unnumbered phases | Number every phase with entry/exit criteria |
| AP-7 | Missing exit criteria | Define what "done" means for every phase |
| AP-8 | No verification step | Add validation at the end of every workflow |
| AP-9 | Vague routing keywords | Use distinctive keywords per workflow route |
| AP-11 | Wrong tool for the job | Use Glob/Grep/Read, not Bash equivalents |
| AP-12 | Overprivileged tools | Remove tools not actually used |
| AP-13 | Vague subagent prompts | Specify what to analyze, look for, and return |
| AP-15 | Reference dumps | Teach judgment, not raw documentation |
| AP-16 | Missing rationalizations | Add "Rationalizations to Reject" for audit skills |
| AP-17 | No concrete examples | Show input -> output for key instructions |
| AP-18 | Cartesian product tool calls | Combine patterns into single regex, grep once |
| AP-19 | Unbounded subagent spawning | Batch items into groups, one subagent per batch |
| AP-20 | Description summarizes workflow | Description = triggering conditions only |

## Tool Assignment Quick Reference

| Component Type | Typical Tools |
|---------------|---------------|
| Read-only analysis skill | Read, Glob, Grep, TodoRead, TodoWrite |
| Interactive analysis skill | Read, Glob, Grep, AskUserQuestion, TodoRead, TodoWrite |
| Code generation skill | Read, Glob, Grep, Write, Bash, TodoRead, TodoWrite |
| Pipeline skill | Read, Write, Glob, Grep, Bash, Task, TaskCreate, TaskList, TaskUpdate |

## Success Criteria

A well-designed workflow skill:
- [ ] Has When to Use AND When NOT to Use sections
- [ ] Uses a recognizable pattern (routing, pipeline, linear, safety gate, or task-driven)
- [ ] Numbers all phases with entry and exit criteria
- [ ] Lists only the tools it actually uses (least privilege)
- [ ] Keeps SKILL.md under 500 lines with details in references/workflows
- [ ] Has no hardcoded paths (uses `{baseDir}`)
- [ ] Has no broken file references
- [ ] Has no reference chains (all links one hop from SKILL.md)
- [ ] Includes a verification step at the end of the workflow
- [ ] Has a description that triggers correctly (third-person, specific keywords)
- [ ] Includes concrete examples for key instructions
- [ ] Explains WHY, not just WHAT, for essential principles

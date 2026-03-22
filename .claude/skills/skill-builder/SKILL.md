---
name: skill-builder
description: Use when creating new skills, optimizing existing skills, or auditing skill quality. Guides skill development following Claude Code official best practices. Trigger phrases: "create a skill", "build a skill", "improve skill", "audit skill", "skill quality".
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Skill Builder

Guides creation and optimization of Claude Code skills using official best practices.

## Mode 1: Build a New Skill

### Discovery Interview (before writing anything)

Ask questions one round at a time using AskUserQuestion. Each round covers one topic. Move to next only after the user answers.

**Round 1: Goal & Name**
- What does this skill do? What problem does it solve?
- What should we call it? (lowercase, hyphens, max 64 chars)

**Round 2: Trigger**
- What would someone say to trigger this? (2-3 natural phrases)
- Should it be user-only (`/slash-command`) or Claude-auto-invocable?
- Does it accept arguments?

**Round 3: Step-by-Step Process**
- Walk through exactly what happens from trigger to output.
- For each step: does Claude do it directly or delegate to subagent/script?
- Conversational or fire-and-forget?

**Round 4: Inputs, Outputs & Dependencies**
- What inputs does the skill need?
- What does it produce? Where?
- External APIs, scripts, tools?
- Reference files needed?

**Round 5: Guardrails & Edge Cases**
- What could go wrong? Common failure modes?
- What should this skill NOT do?
- Cost concerns? Ordering constraints?

**Round 6: Confirmation**

Summarize back:
```
## Skill Summary: [name]

**Goal:** [one sentence]
**Trigger:** `/name` + [natural phrases]
**Arguments:** [what it accepts]

**Process:**
1. [step]
2. [step]
...

**Inputs:** [what it reads]
**Outputs:** [what it produces + where]
**Guardrails:** [what can go wrong]
```

Ask: "Does this capture it? Anything to add or change?" Only build once confirmed.

### Build Phase

**Step 1: Choose skill type**
- **Task skills**: Step-by-step instructions for a specific action. Examples: deploy, test, generate report.
- **Reference skills**: Knowledge Claude applies to current work without performing an action. Examples: coding conventions, style guides.

**Step 2: Configure frontmatter**

```yaml
---
name: kebab-case-name
description: "Use when someone asks to [action], [action], or [action]. Trigger phrases: 'phrase1', 'phrase2'."
argument-hint: [optional-args]
allowed-tools: Read, Glob, Grep, Bash
disable-model-invocation: true  # Set if skill has side effects (file gen, API calls, costs money)
context: fork                  # Set if self-contained and doesn't need conversation history
agent: Explore                 # Subagent type when context: fork is set
---
```

**Step 3: Write skill content**

Structure task skills as:
1. **Context** — Files to read, reference material to load
2. **Step-by-step workflow** — Numbered steps
3. **Output format** — Templates, file paths, structured formats
4. **Notes** — Edge cases, constraints, what NOT to do

Content rules:
- Keep SKILL.md under 500 lines. Move detailed reference to supporting files.
- Use `$ARGUMENTS` / `$N` for dynamic input.
- Use `!`command`` for dynamic context injection (preprocessing).
- Specify all file paths explicitly.
- Be specific about subagent delegation — include exact prompt text.

**Step 4: Add supporting files (if needed)**

```
my-skill/
  SKILL.md              # Main instructions (<500 lines)
  reference.md           # Detailed docs
  scripts/
    helper.py           # Utility script
```

Reference supporting files from SKILL.md so Claude knows they exist.

**Step 5: Document in CLAUDE.md**
Add skill name, `/slash-command`, trigger phrases, and output location.

**Step 6: Test**
1. **Natural language** — Say something matching the description. Does it load?
2. **Direct invocation** — Run `/skill-name` with test arguments. Do substitutions work?
3. **Edge cases** — Missing arguments, unusual input.

### Mode 2: Audit an Existing Skill

Use this checklist after reading the skill file:

**Frontmatter Audit**
- [ ] `name` matches directory name
- [ ] `description` uses natural keywords someone would actually say
- [ ] `description` is specific enough to avoid false triggers
- [ ] `disable-model-invocation: true` set if skill has side effects
- [ ] `argument-hint` set if skill accepts arguments
- [ ] `allowed-tools` set if skill should NOT have all tools
- [ ] `context: fork` used if self-contained and verbose output
- [ ] No unnecessary fields

**Content Audit**
- [ ] SKILL.md under 500 lines
- [ ] Clear numbered steps
- [ ] Output format specified
- [ ] All file paths documented
- [ ] Agent delegation includes exact prompt text
- [ ] Notes section covers edge cases
- [ ] No vague instructions
- [ ] String substitutions used where skill takes input

**Integration Audit**
- [ ] Documented in CLAUDE.md
- [ ] Supporting files referenced from SKILL.md
- [ ] Scripts have correct paths and are executable

**Quality Audit**
- [ ] Beginner could follow without prior context
- [ ] Instructions are actionable, not abstract
- [ ] Delegates to subagents when appropriate
- [ ] Doesn't duplicate CLAUDE.md or other skills

### Complete Example

```yaml
---
name: meeting-notes
description: Use when someone asks to summarize meeting notes, recap a meeting, or format meeting minutes.
argument-hint: [topic or date]
---

## What This Skill Does

Takes raw meeting notes and produces a structured summary with action items.

## Steps

1. Ask the user to paste their raw meeting notes (or provide a file path).
2. Extract: attendees, key decisions, action items, open questions.
3. Format using the template below.
4. If $ARGUMENTS is provided, use it as the meeting title.

## Output Template

# Meeting: [title]
**Date:** [date or "Not specified"]
**Attendees:** [comma-separated]

## Key Decisions
- [decision]

## Action Items
- [ ] [person]: [task] (due: [date])

## Notes
- Keep summaries concise. Don't embellish.
- If notes are too vague, flag to user instead of making things up.
```

## When to Use

- When creating a new skill for a recurring task
- When an existing skill has quality issues or gaps
- When the skill structure doesn't match current project conventions
- As part of the skill improvement workflow

## When NOT to Use

- For one-off tasks that don't recur (just do it directly)
- When a suitable skill already exists (extend it instead)
- Without the Discovery Interview — always confirm the skill design first

## Important Notes

- Always read existing skill before optimizing.
- Check if similar skill exists before building new.
- For advanced patterns (subagent execution, hooks, permissions), see [reference.md](reference.md).
- Frontmatter `description` format: "Use when someone asks to [action], [action], or [action]."

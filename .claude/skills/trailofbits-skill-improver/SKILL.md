---
name: trailofbits-skill-improver
description: Use when improving skill quality, fixing skill issues, running skill review loops, or iteratively refining a skill. Trigger phrases: "fix my skill", "improve skill quality", "skill improvement loop", "audit skill quality".
allowed-tools: Task, Read, Edit, Write, Glob, Grep
---

# Skill Improver

Iteratively reviews and fixes Claude Code skill quality issues until they meet standards. Runs automated fix-review cycles.

## Prerequisites

Requires the `plugin-dev` plugin which provides the `skill-reviewer` agent.

## Core Loop

1. **Review** — Call skill-reviewer on the target skill
2. **Categorize** — Parse issues by severity
3. **Fix** — Address critical and major issues
4. **Evaluate** — Check minor issues for validity before fixing
5. **Repeat** — Continue until quality bar is met

## When to Use

- Improving a skill with multiple quality issues
- Iterating on a new skill until it meets standards
- Automated fix-review cycles instead of manual editing
- Consistent quality enforcement across skills

## When NOT to Use

- **One-time review**: Use `/skill-reviewer` directly
- **Quick single fixes**: Edit the file directly
- **Non-skill files**: Only works on SKILL.md files
- **Experimental skills**: Manual iteration gives more control

## Issue Categorization

### Critical Issues (MUST fix immediately)
- Missing required frontmatter fields (name, description) — Claude cannot index or trigger
- Invalid YAML frontmatter syntax — Parsing fails, skill won't load
- Referenced files that don't exist — Runtime errors when Claude follows links
- Broken file paths — Leads to tool failures

### Major Issues (MUST fix)
- Weak or vague trigger descriptions — Claude may not recognize when to use skill
- Wrong writing voice (second person "you" instead of imperative)
- SKILL.md exceeds 500 lines without using references/ — Overloads context
- Missing "When to Use" or "When NOT to Use" sections
- Description doesn't specify when to trigger

### Minor Issues (Evaluate before fixing)
- Subjective style preferences
- Optional enhancements that may add complexity without proportional value
- "Nice to have" improvements
- Formatting suggestions (valid but low impact)

## Minor Issue Evaluation

Before implementing any minor fix:
1. **Is this a genuine improvement?** Does it add real value?
2. **Could this be a false positive?** Is the reviewer misunderstanding context?
3. **Would this actually help Claude use the skill?** Focus on functional improvements.

## Completion Criteria

**CRITICAL**: Output this marker when done:
```
<skill-improvement-complete>
```

**When to output the marker:**
1. `skill-reviewer` reports "Pass" or no issues found → output marker immediately
2. All critical and major issues fixed AND verified → output marker
3. Remaining issues are only minor AND evaluated as false positives → output marker

**When NOT to output the marker:**
- Any critical issue remains unfixed
- Any major issue remains unfixed
- You haven't run skill-reviewer to verify fixes worked

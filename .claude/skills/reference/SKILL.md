---
name: reference
description: Complete technical reference for Claude Code skills. This document covers all frontmatter fields, advanced patterns, argument passing, troubleshooting, and how skills fit into your project. Use when building new skills, debugging skill issues, or understanding skill architecture.
allowed-tools: Read
---

# Skill Builder Reference

Complete technical reference for Claude Code skills. This document covers all frontmatter fields, advanced patterns, argument passing, troubleshooting, and how skills fit into your project.

Source: https://code.claude.com/docs/en/skills

## Understanding CLAUDE.md vs Skills

| | CLAUDE.md | Skill |
|---|---|---|
| **When loaded** | Every conversation, always | Only when invoked (via `/name` or auto-detection) |
| **What it's for** | Project-wide rules, conventions, context | Specific task workflows, specialized procedures |
| **Size concern** | Always in context, so keep it focused | Only loaded when needed, but keep under 500 lines |

**Rule of thumb:** If Claude should *always* know it, put it in CLAUDE.md. If Claude should only know it when doing a specific task, make it a skill.

## When to Use

- When building or auditing a new skill
- When debugging why a skill isn't triggering or loading
- When learning the skill architecture and file conventions
- As a reference when adding frontmatter fields to a skill

## When NOT to Use

- During normal task execution — this is reference material, not a workflow
- Without having read the skill file first
- As a replacement for the skill-builder skill (which guides creation)

## Frontmatter Field Reference

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `name` | No | string | directory name | Display name and `/slash-command`. Max 64 chars. |
| `description` | Recommended | string | first paragraph | What the skill does and when to use it. |
| `argument-hint` | No | string | none | Autocomplete hint for expected arguments. |
| `disable-model-invocation` | No | boolean | `false` | Only user can invoke. Removes from Claude's context. |
| `user-invocable` | No | boolean | `true` | Show in `/` menu. |
| `allowed-tools` | No | string | all tools | Tools available without permission prompts. |
| `model` | No | string | inherit | Model: `sonnet`, `opus`, `haiku`. |
| `context` | No | string | none | Set to `fork` for isolated subagent context. |
| `agent` | No | string | general-purpose | Subagent type when `context: fork` is set. |

## String Substitutions

| Variable | Description | Example |
|----------|-------------|---------|
| `$ARGUMENTS` | All arguments passed when invoking the skill | `/fix-issue 123` -> `123` |
| `$ARGUMENTS[N]` | Specific argument by 0-based index | `$ARGUMENTS[0]` = first arg |
| `$N` | Shorthand for `$ARGUMENTS[N]` | `$0` = first arg |
| `${CLAUDE_SESSION_ID}` | Current session ID | Useful for logs |

## Skill File Locations

| Location | Path | Applies to |
|----------|------|------------|
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project only |

## `allowed-tools` Syntax

Basic: `allowed-tools: Read, Grep, Glob`

With command filtering: `allowed-tools: Bash(git *)` — only git commands

| Pattern | What it allows |
|---------|---------------|
| `Bash` | Any bash command |
| `Bash(git *)` | Any command starting with `git` |
| `Bash(npm test)` | Only the exact command `npm test` |

## Advanced Patterns

### `context: fork` — Running Skills in a Subagent

Add `context: fork` to run a skill in an isolated subagent context:

```yaml
context: fork
agent: Explore  # Haiku, read-only. Best for research
```

Agent options:
- `Explore` — Haiku, read-only. Best for research, file discovery
- `Plan` — Inherits model, read-only. Best for planning research
- `general-purpose` — Inherits model, all tools

### Dynamic Context Injection (!`command`)

```yaml
## PR context
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`
```

Commands execute BEFORE the skill content is sent to Claude, output replaces the placeholder.

### Supporting Files

```
my-skill/
  SKILL.md              # Main instructions (<500 lines)
  reference.md          # Detailed docs
  scripts/
    helper.py           # Utility script
```

Reference them from SKILL.md. Supporting files load only when Claude needs them.

### Progressive Disclosure

Keep SKILL.md under 500 lines. Push detailed reference material to separate files.

## Troubleshooting

### Skill not triggering
1. Check the description — does it include keywords users would naturally say?
2. Verify it's visible — ask "What skills are available?"
3. Rephrase your request
4. Invoke directly with `/skill-name`
5. Check `disable-model-invocation` — if `true`, only `/name` works

### Claude doesn't see all skills
Skill descriptions are loaded into context. Budget: 2% of context window (fallback 16,000 chars total). Keep descriptions concise and keyword-rich.

### Subagent skill returns nothing useful
The skill probably contains guidelines without a concrete task. Add explicit instructions: "Do X, then return Y."

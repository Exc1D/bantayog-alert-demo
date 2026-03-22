---
name: trailofbits-agentic-actions-auditor
description: Audits GitHub Actions workflows for security vulnerabilities in AI agent integrations including Claude Code Action, Gemini CLI, OpenAI Codex, and GitHub AI Inference. Detects attack vectors where attacker-controlled input reaches AI agents running in CI/CD pipelines. Use when reviewing workflow files that invoke AI coding agents, auditing CI/CD pipeline security for prompt injection risks, or evaluating agentic action configurations.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Agentic Actions Auditor

Static security analysis guidance for GitHub Actions workflows that invoke AI coding agents. Discover workflow files, identify AI action steps, follow cross-file references, capture security-relevant configuration, and detect attack vectors where attacker-controlled input reaches an AI agent running in a CI/CD pipeline.

## When to Use

- Auditing a repository's GitHub Actions workflows for AI agent security
- Reviewing CI/CD configurations that invoke Claude Code Action, Gemini CLI, or OpenAI Codex
- Checking whether attacker-controlled input can reach AI agent prompts
- Evaluating agentic action configurations (sandbox settings, tool permissions, user allowlists)
- Assessing trigger events that expose workflows to external input (`pull_request_target`, `issue_comment`, etc.)

## When NOT to Use

- Analyzing workflows that do NOT use any AI agent actions (use general Actions security tools instead)
- Reviewing standalone composite actions or reusable workflows outside of a caller workflow context
- Performing runtime prompt injection testing (this is static analysis guidance, not exploitation)
- Auditing non-GitHub CI/CD systems (Jenkins, GitLab CI, CircleCI)

## Rationalizations to Reject

**1. "It only runs on PRs from maintainers"**
`pull_request_target`, `issue_comment`, and other trigger events expose actions to external input. Attackers do not need write access.

**2. "We use allowed_tools to restrict what it can do"**
Tool restrictions can still be weaponized. Even restricted tools like `echo` can be abused for data exfiltration.

**3. "There's no ${{ }} in the prompt, so it's safe"**
This is the classic env var intermediary miss. Data flows through `env:` blocks to the prompt field.

**4. "The sandbox prevents any real damage"**
Sandbox misconfigurations (`danger-full-access`, `Bash(*)`, `--yolo`) disable protections entirely.

## Audit Methodology

### Step 0: Determine Analysis Mode

If the user provides a GitHub repository URL or `owner/repo` identifier, use remote analysis mode. Otherwise, use local analysis mode.

### Step 1: Discover Workflow Files

Use Glob to locate all GitHub Actions workflow files:
- Glob for `.github/workflows/*.yml`
- Glob for `.github/workflows/*.yaml`

### Step 2: Identify AI Action Steps

Check each step's `uses:` field against known AI action references:

| Action Reference | Action Type |
|-----------------|-------------|
| `anthropics/claude-code-action` | Claude Code Action |
| `google-github-actions/run-gemini-cli` | Gemini CLI |
| `openai/codex-action` | OpenAI Codex |
| `actions/ai-inference` | GitHub AI Inference |

### Step 3: Capture Security Context

For each identified AI action step, capture:
- Step-level configuration (`prompt`, `claude_args`, `allowed_non_write_users`, `settings`, etc.)
- Workflow-level context (trigger events, environment variables, permissions)

### Step 4: Analyze for Attack Vectors

| Vector | Name | Quick Check |
|--------|------|-------------|
| A | Env Var Intermediary | `env:` block with `${{ github.event.* }}` value + prompt reads that env var |
| B | Direct Expression Injection | `${{ github.event.* }}` inside prompt field |
| C | CLI Data Fetch | `gh issue view`, `gh pr view` in prompt text |
| D | PR Target + Checkout | `pull_request_target` trigger + checkout with `ref:` to PR head |
| E | Error Log Injection | CI logs, build output passed to AI prompt |
| F | Subshell Expansion | Tool restriction list includes commands supporting `$()` expansion |
| G | Eval of AI Output | `eval`, `exec` consuming `steps.*.outputs.*` |
| H | Dangerous Sandbox Configs | `danger-full-access`, `Bash(*)`, `--yolo` |
| I | Wildcard Allowlists | `allowed_non_write_users: "*"`, `allow-users: "*"` |

### Step 5: Report Findings

Produce a structured findings report with:
- **Title:** Vector name
- **Severity:** High / Medium / Low / Info
- **File:** Workflow file path
- **Step:** Job and step reference with line number
- **Impact:** One sentence on what an attacker can achieve
- **Evidence:** YAML code snippet
- **Data Flow:** Numbered steps from attacker to AI agent
- **Remediation:** Action-specific guidance

### Summary Output

1. **Executive summary header:** `Analyzed X workflows containing Y AI action instances. Found Z findings: N High, M Medium, P Low, Q Info.`
2. **Summary table:** Workflow File | Findings | Highest Severity
3. **Findings by workflow** ordered by severity descending

## Security Context Checklist

For each AI action step, capture:

**Trigger events:**
- `pull_request_target` — runs in base branch context with secrets, triggered by external PRs
- `issue_comment` — comment body is attacker-controlled
- `issues` — issue body and title are attacker-controlled

**Environment variables:**
- Check workflow-level, job-level, and step-level `env:` blocks
- Note whether values contain `${{ }}` expressions referencing event data

**Permissions:**
- Flag overly broad permissions combined with AI agent execution

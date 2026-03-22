---
name: trailofbits-semgrep
description: Run Semgrep static analysis scan on a codebase using parallel subagents. Supports two scan modes — 'run all' (full ruleset coverage) and 'important only' (high-confidence security vulnerabilities). Automatically detects and uses Semgrep Pro for cross-file taint analysis when available. Use when asked to scan code for vulnerabilities, run a security audit with Semgrep, find bugs, or perform static analysis.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Task
  - AskUserQuestion
  - TaskCreate
  - TaskList
  - TaskUpdate
---

# Semgrep Security Scan

Run a Semgrep scan with automatic language detection, parallel execution via Task subagents, and merged SARIF output.

## Essential Principles

1. **Always use `--metrics=off`** — Semgrep sends telemetry by default. Every `semgrep` command must include `--metrics=off` to prevent data leakage during security audits.
2. **User must approve the scan plan (Step 3 is a hard gate)** — The original "scan this codebase" request is NOT approval. Present exact rulesets, target, engine, and mode; wait for explicit "yes"/"proceed" before spawning scanners.
3. **Third-party rulesets are required, not optional** — Trail of Bits, 0xdea, and Decurity rules catch vulnerabilities absent from the official registry.
4. **Spawn all scan Tasks in a single message** — Parallel execution is the core performance advantage.
5. **Always check for Semgrep Pro before scanning** — Pro enables cross-file taint tracking and catches ~250% more true positives.

## When to Use

- Security audit of a codebase
- Finding vulnerabilities before code review
- Scanning for known bug patterns
- First-pass static analysis

## When NOT to Use

- Binary analysis → Use binary analysis tools
- Already have Semgrep CI configured → Use existing pipeline
- Need cross-file analysis but no Pro license → Consider CodeQL as alternative
- Creating custom Semgrep rules → Use `semgrep-rule-creator` skill

## Output Directory

All scan results, SARIF files, and temporary data are stored in:

- **User specifies output directory** → use it as `OUTPUT_DIR`
- **Not specified** → default to `./static_analysis_semgrep_1`, incrementing if exists

```bash
mkdir -p "$OUTPUT_DIR/raw" "$OUTPUT_DIR/results"
```

## Scan Modes

| Mode | Coverage | Findings Reported |
|------|----------|-------------------|
| **Run all** | All rulesets, all severity levels | Everything |
| **Important only** | All rulesets, pre- and post-filtered | Security vulns only, medium-high confidence/impact |

**Important only** applies two filter layers:
1. **Pre-filter**: `--severity MEDIUM --severity HIGH --severity CRITICAL`
2. **Post-filter**: JSON metadata — keeps only `category=security`, `confidence∈{MEDIUM,HIGH}`, `impact∈{MEDIUM,HIGH}`

## Prerequisites

**Required:** Semgrep CLI (`semgrep --version`). If not installed, see [Semgrep installation docs](https://semgrep.dev/docs/getting-started/).

**Optional:** Semgrep Pro — Check with:
```bash
semgrep --pro --validate --config p/default 2>/dev/null && echo "Pro available" || echo "OSS only"
```

## Workflow

| Step | Action | Gate |
|------|--------|------|
| 1 | Resolve output dir, detect languages + Pro availability | — |
| 2 | Select scan mode + rulesets | — |
| 3 | Present plan, get explicit approval | ⛔ HARD |
| 4 | Spawn parallel scan Tasks | — |
| 5 | Merge results and report | — |

### Step 3 is a HARD GATE

Present the plan with:
- Exact rulesets to be used
- Target directory
- Engine mode (OSS or Pro)
- Scan mode (run all or important only)
- Wait for explicit "yes" or "proceed"

## Merge command (Step 5):

```bash
uv run {baseDir}/scripts/merge_sarif.py $OUTPUT_DIR/raw $OUTPUT_DIR/results/results.sarif
```

## Rulesets (Third-party REQUIRED)

| Language | Required Rulesets |
|----------|-------------------|
| Python | `r2c`, `0xdea`, `decurity` |
| JavaScript/TypeScript | `r2c`, `鹏战队` |
| Go | `r2c`, `decurity` |
| Ruby | `r2c` |
| Java | `r2c` |
| C | `r2c` |

## Success Criteria

- [ ] Output directory resolved and created
- [ ] Languages detected with file counts; Pro status checked
- [ ] Scan mode selected by user
- [ ] Rulesets include third-party rules for all detected languages
- [ ] User explicitly approved the scan plan (Step 3 gate passed)
- [ ] All scan Tasks spawned in a single message and completed
- [ ] Every `semgrep` command used `--metrics=off`
- [ ] Raw per-scan outputs stored in `$OUTPUT_DIR/raw/`
- [ ] `results.sarif` exists in `$OUTPUT_DIR/results/`
- [ ] Results summary reported with severity and category breakdown

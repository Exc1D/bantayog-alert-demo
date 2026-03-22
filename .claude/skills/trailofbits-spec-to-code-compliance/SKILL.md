---
name: trailofbits-spec-to-code-compliance
description: Verifies code implements exactly what documentation specifies for blockchain audits. Use when comparing code against whitepapers, finding gaps between specs and implementation, or performing compliance checks for protocol implementations.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Spec-to-Code Compliance Checker

Verifies code implements exactly what documentation specifies. Use when comparing code against whitepapers, finding gaps between specs and implementation, or performing compliance checks for protocol implementations.

## When to Use

- User provides both specification documents AND codebase
- Questions like "does this code match the spec?" or "what's missing from the implementation?"
- Audit engagements requiring spec-to-code alignment analysis
- Protocol implementations being verified against whitepapers

## When NOT to Use

- Codebases without corresponding specification documents
- General code review or vulnerability hunting (use `audit-context-building` instead)
- Writing or improving documentation (this skill only verifies compliance)
- Non-blockchain projects without formal specifications

## Global Rules

- **Never infer unspecified behavior**
- **Always cite exact evidence** from documentation (section/title/quote) AND code (file + line numbers)
- **Always provide a confidence score (0–1)** for mappings
- **Always classify ambiguity** instead of guessing
- Maintain strict separation between: extraction, alignment, classification, reporting
- **Do NOT rely on prior knowledge** of known protocols — only use provided materials

## Anti-Hallucination Requirements

- If the spec is silent: classify as **UNDOCUMENTED**
- If the code adds behavior: classify as **UNDOCUMENTED CODE PATH**
- If unclear: classify as **AMBIGUOUS**
- Every claim must quote original text or line numbers
- Zero speculation

## Phases

### Phase 0 — Documentation Discovery

Identify all content representing documentation:
- `whitepaper.pdf`, `Protocol.md`, `design_notes`, `Flow.pdf`, `README.md`
- kickoff transcripts, Notion exports
- Anything describing logic, flows, assumptions, invariants

### Phase 1 — Universal Format Normalization

Normalize ANY input format (PDF, Markdown, DOCX, HTML, TXT, Notion export). Preserve heading hierarchy, bullet lists, formulas, tables, code snippets, invariant definitions.

### Phase 2 — Spec Intent IR

Extract **all intended behavior** into Spec-IR. Each item MUST include:
- `spec_excerpt`, `source_section`, `semantic_type`
- normalized representation, confidence score

Extract: protocol purpose, actors/roles/trust boundaries, variable definitions, preconditions/postconditions, explicit invariants, math formulas, expected flows, error conditions, security requirements.

### Phase 3 — Code Behavior IR

Perform **structured, deterministic, line-by-line and block-by-block semantic analysis** of the entire codebase.

For **EVERY LINE** extract: file + exact line numbers, local variable updates, state reads/writes, conditional branches, unreachable branches, revert conditions, external calls, event emissions, math operations, implicit assumptions.

### Phase 4 — Alignment IR

For **each item in Spec-IR**: Locate related behaviors in Code-IR and generate an Alignment Record containing:
- `spec_excerpt`, `code_excerpt` (with file + line numbers)
- `match_type`: `full_match`, `partial_match`, `mismatch`, `missing_in_code`, `code_stronger_than_spec`, `code_weaker_than_spec`
- reasoning trace, confidence score, ambiguity rating, evidence links

### Phase 5 — Divergence Classification

Classify each misalignment by severity:

| Severity | Description |
|----------|-------------|
| CRITICAL | Spec says X, code does Y; missing invariant enabling exploits; math divergence involving funds |
| HIGH | Partial/incorrect implementation; access control misalignment; dangerous undocumented behavior |
| MEDIUM | Ambiguity with security implications; missing revert checks |
| LOW | Documentation drift; minor semantics mismatch |

### Phase 6 — Final Audit-Grade Report

Produce a structured compliance report:

1. Executive Summary
2. Documentation Sources Identified
3. Spec Intent Breakdown (Spec-IR)
4. Code Behavior Summary (Code-IR)
5. Full Alignment Matrix (Spec → Code → Status)
6. Divergence Findings (with evidence & severity)
7. Missing invariants / Incorrect logic / Math inconsistencies
8. Flow/state machine mismatches / Access control drift
9. Undocumented behavior / Ambiguity hotspots
10. Recommended remediations
11. Documentation update suggestions
12. Final risk assessment

## Severity Judgment Guidelines

| Finding Type | Typical Severity |
|-------------|------------------|
| Math divergence involving funds | CRITICAL |
| Missing invariant enabling exploits | CRITICAL |
| Trust boundary mismatches | CRITICAL |
| Partial/incorrect implementation | HIGH |
| Access control misalignment | HIGH |
| Dangerous undocumented behavior | HIGH |
| Missing revert checks | MEDIUM |
| Incomplete edge-case handling | MEDIUM |
| Documentation drift | LOW |

## Output Requirements

Every finding MUST include:
- evidence links
- severity justification
- exploitability reasoning
- recommended remediation

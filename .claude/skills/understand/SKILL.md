---
name: understand
description: Use when someone asks to understand the codebase architecture, analyze code structure, map dependencies, or generate a knowledge graph of the project.
argument-hint: [--full] or [directory-path]
allowed-tools: Read, Write, Bash, Glob, Grep
---

# /understand

Analyze the current codebase and produce a `knowledge-graph.json` file in `.understand-anything/`.

## Options

- `$ARGUMENTS` may contain:
  - `--full` — Force a full rebuild, ignoring any existing graph
  - A directory path — Scope analysis to a specific subdirectory

## Phase 0 — Pre-flight

1. Set `PROJECT_ROOT` to the current working directory.
2. Get the current git commit hash: `git rev-parse HEAD`
3. Create the intermediate output directory: `mkdir -p $PROJECT_ROOT/.understand-anything/intermediate`
4. Check if `$PROJECT_ROOT/.understand-anything/knowledge-graph.json` exists. If so, read it.
5. Check if `$PROJECT_ROOT/.understand-anything/meta.json` exists. If so, read it to get `gitCommitHash`.

**Decision logic:**
| Condition | Action |
|---|---|
| `--full` flag in `$ARGUMENTS` | Full analysis |
| No existing graph | Full analysis |
| Changed commit hash | Incremental update |
| Unchanged | Report "Graph is up to date" and STOP |

For incremental updates, get changed files: `git diff <lastHash>..HEAD --name-only`

6. **Collect project context:**
   - Read `README.md` (first 3000 chars) as `$README_CONTENT`
   - Read package manifest (`package.json`, `pyproject.toml`, etc.) as `$MANIFEST_CONTENT`
   - Capture top-level directory tree
   - Detect entry point: `src/index.ts`, `src/main.ts`, `src/App.tsx`, `main.py`, etc.

## Phase 1 — SCAN (Full analysis only)

Dispatch an Explore subagent to scan the project directory and discover all source files, detect languages and frameworks.

Output to: `$PROJECT_ROOT/.understand-anything/intermediate/scan-result.json`

After completion, read the scan result to get: project name, description, languages, frameworks, file list with line counts, complexity estimate.

**Gate check:** If >200 files, inform the user and suggest scoping with a subdirectory argument.

## Phase 2 — ANALYZE

### Full analysis path

Batch the file list into groups of 5-10 files. Run up to 3 subagents concurrently.

For each batch, dispatch a subagent to analyze the files and produce GraphNode and GraphEdge objects.

Output to: `$PROJECT_ROOT/.understand-anything/intermediate/batch-<N>.json`

After ALL batches complete, merge all nodes and edges. Deduplicate by ID.

### Incremental update path

Use changed files list from Phase 0. Batch and analyze only changed files. Merge with existing graph by removing old entries for changed files and adding fresh analysis.

## Phase 3 — ASSEMBLE

Merge all file-analyzer results. Perform integrity cleanup:
- Remove edges with missing source/target nodes
- Remove duplicate node IDs (keep last occurrence)
- Log removed items for summary

## Phase 4 — ARCHITECTURE

Dispatch a subagent to analyze codebase structure and identify architectural layers.

Output to: `$PROJECT_ROOT/.understand-anything/intermediate/layers.json`

Each layer must have: `id`, `name`, `description`, `nodeIds`.

For incremental updates: re-run on full graph since layer assignments may shift.

## Phase 5 — TOUR

Dispatch a subagent to create a guided learning tour for the codebase.

Output to: `$PROJECT_ROOT/.understand-anything/intermediate/tour.json`

Each step must have: `order`, `title`, `description`, `nodeIds`.

## Phase 6 — REVIEW

Assemble the full KnowledgeGraph JSON and validate it. Dispatch a subagent to review the graph for completeness and correctness.

Output to: `$PROJECT_ROOT/.understand-anything/intermediate/review.json`

If `approved: false`: apply automated fixes, re-validate. If critical issues remain, save with warnings.

## Phase 7 — SAVE

1. Write final graph to `$PROJECT_ROOT/.understand-anything/knowledge-graph.json`
2. Write metadata to `$PROJECT_ROOT/.understand-anything/meta.json`
3. Clean up intermediate files: `rm -rf $PROJECT_ROOT/.understand-anything/intermediate`
4. Report summary: project name, files analyzed, nodes/edges created, layers, tour steps, warnings

## Error Handling

- If subagent dispatch fails, retry once with additional context about the failure.
- Track all warnings in a `$PHASE_WARNINGS` list.
- If it fails a second time, skip that phase and continue with partial results.
- ALWAYS save partial results — a partial graph is better than no graph.

## When to Use

- When starting work on an unfamiliar area of the codebase
- After pulling changes that introduce unknown files or patterns
- To generate a dependency graph before a major refactor
- When the user asks to "understand the codebase" or similar

## When NOT to Use

- For small, well-understood changes in a known area
- When a `knowledge-graph.json` already exists and is recent (check git hash)
- Without scope — for large codebases (>200 files), scope to a subdirectory

## Reference: KnowledgeGraph Schema

### Node Types
| Type | Description | ID Convention |
|---|---|---|
| `file` | Source file | `file:<relative-path>` |
| `function` | Function or method | `func:<relative-path>:<name>` |
| `class` | Class, interface, or type | `class:<relative-path>:<name>` |
| `module` | Logical module or package | `module:<name>` |
| `concept` | Abstract concept or pattern | `concept:<name>` |

### Edge Types
| Category | Types |
|---|---|
| Structural | `imports`, `exports`, `contains`, `inherits`, `implements` |
| Behavioral | `calls`, `subscribes`, `publishes`, `middleware` |
| Data flow | `reads_from`, `writes_to`, `transforms`, `validates` |
| Dependencies | `depends_on`, `tested_by`, `configures` |
| Semantic | `related`, `similar_to` |

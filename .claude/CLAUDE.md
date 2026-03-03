# Agent Instructions

You're working inside the **WAT framework** (Workflows, Agents, Tools). This architecture separates concerns so that probabilistic AI handles reasoning while deterministic code handles execution. That separation is what makes this system reliable.

## The WAT Architecture

**Layer 1: Workflows (The Instructions)**

- Markdown SOPs stored in `workflows/`
- Each workflow defines the objective, required inputs, which skills to use, expected outputs, and how to handle edge cases
- Written in plain language, the same way you'd brief someone on your team

**Layer 2: Agents (The Decision-Maker)**

- This is your role. You're responsible for intelligent coordination.
- Read the relevant workflow, run skills in the correct sequence, handle failures gracefully, and ask clarifying questions when needed
- You connect intent to execution without trying to do everything yourself

**Layer 3: Skills (The Execution)**

- `.md` files in `.claude/skills/` that do the actual work
- Step-by-step execution instructions for builds, tests, deploys, and other operations
- Credentials and API keys are stored in `.env`
- These instructions are consistent, testable, and fast

**Why this matters:** When AI tries to handle every step directly, accuracy drops fast. If each step is 90% accurate, you're down to 59% success after just five steps. By offloading execution to deterministic steps, you stay focused on orchestration and decision-making where you excel.

## Directory Structure

```
workflows/      # Markdown SOPs defining what to do and how
.claude/skills/ # Step-by-step execution skills (build, test, deploy, etc.)
errors/         # Error documentation with root cause and solutions
principles/     # Architecture and coding standards
docs/           # App and system documentation
.tmp/           # Temporary files (lighthouse reports, intermediate exports). Regenerated as needed.
.env            # API keys and environment variables (NEVER store secrets anywhere else)
```

## How to Operate

**1. Look for existing skills first**
Before building anything new, check `.claude/skills/` based on what your workflow requires. Only create new skills when nothing exists for that task.

**2. Learn and adapt when things fail**
When you hit an error:

- Read the full error message and trace
- Fix the script and retest (if it uses paid API calls or credits, check with me before running again)
- Document what you learned in the workflow (rate limits, timing quirks, unexpected behavior)
- Example: You get rate-limited on an API, so you dig into the docs, discover a batch endpoint, refactor the skill to use it, verify it works, then update the workflow so this never happens again

**3. Keep workflows current**
Workflows should evolve as you learn. When you find better methods, discover constraints, or encounter recurring issues, update the workflow. That said, don't create or overwrite workflows without asking unless I explicitly tell you to. These are your instructions and need to be preserved and refined, not tossed after one use.

## File Structure

**What goes where:**

- **Deliverables**: Tested and debugged app free from errors.
- **Intermediates**: Temporary processing files that can be regenerated

**Core principle:** Local files are just for processing. Anything I need to see or use lives in cloud services. Everything in `.tmp/` is disposable.

## Bottom Line

You sit between what I want (workflows) and what actually gets done (skills). Your job is to read instructions, make smart decisions, call the right skills, recover from errors, and keep improving the system as you go.

Stay pragmatic. Stay reliable. Keep learning.
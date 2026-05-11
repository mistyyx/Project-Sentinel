# Project Sentinel

**Autonomous incident detection, root-cause analysis, and self-healing — powered by Claude Code subagents.**

---

## Overview

Project Sentinel is a monorepo demonstration of an **autonomous incident-resolution loop** built entirely on Claude Code. When a CRITICAL error surfaces in the service layer, a multi-agent pipeline takes over without human intervention:

1. A **Plan agent** reads the error log and cross-references incident history to outline a resolution strategy.
2. **Alpha-Debugger** diagnoses the root cause, verifies source-file guards, and applies a CLAUDE.md-compliant fix (or confirms no fix is needed).
3. **Beta-QA** writes regression tests that reproduce the original failure, runs the full test suite, and verifies all tests pass.
4. The orchestrator appends a structured entry to `docs/incident-history.log`, commits, and pushes — closing the loop automatically.

A **Chaos Monkey** process injects synthetic faults on a 5-second interval so the resolution loop always has live material to work with. The **Resolution Protocol** (defined in `CLAUDE.md`) mandates that every agent read the incident history before touching code, preventing repeated failed fixes and building institutional memory across sessions.

---

## Live Demo

| | |
|---|---|
| **Production dashboard** | [project-sentinel-4zcicvgg6-mistyyxs-projects.vercel.app](https://project-sentinel-4zcicvgg6-mistyyxs-projects.vercel.app) |
| **Walkthrough video** | [loom.com/share/08f544d1b8394fe4bced976d3716fc7e](https://www.loom.com/share/08f544d1b8394fe4bced976d3716fc7e) |

---

## Architecture

```
Project-Sentinel/
├── app/                        # Next.js 16 dashboard (dark-mode Vibe UI)
│   ├── app/                    # App Router pages and layouts
│   ├── components/             # React components
│   └── next.config.ts
│
├── services/                   # Node.js microservices (TypeScript strict)
│   ├── alert-dedup-engine.ts   # Deduplication window logic
│   ├── severity-parser.ts      # Severity field coercion and validation
│   ├── response-parser.ts      # JSON response Content-Type guard
│   ├── status.json             # Live system health state
│   ├── error.log               # Append-only incident log (Chaos Monkey target)
│   ├── __tests__/              # 50 regression tests (Node built-in runner)
│   └── tests/                  # Additional unit tests
│
├── scripts/
│   └── chaos-monkey.js         # Synthetic fault injector — 5-second interval
│
├── docs/
│   ├── incident-history.log    # Structured resolution history (mandatory read)
│   └── post-mortem.md          # 2026-05-11 session post-mortem
│
├── .claude/
│   └── agents/
│       ├── alpha-debugger.md   # Subagent Alpha — root-cause diagnosis + fix
│       └── beta-qa.md          # Subagent Beta — regression tests + verification
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # Test gate → Vercel production deploy
│
├── CLAUDE.md                   # Resolution Protocol, TypeScript rules, conventions
└── agent-logs.txt              # Exported orchestration session transcript
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript 5 |
| Services | Node.js, TypeScript (strict mode), Node built-in test runner |
| Database | SQLite via MCP (`mcp__sqlite-python`) |
| CI/CD | GitHub Actions — test gate + Vercel CLI deploy |
| Hosting | Vercel (production) |
| AI runtime | Claude Code with multi-agent orchestration (Plan, Alpha, Beta subagents) |
| Fault injection | Chaos Monkey (`scripts/chaos-monkey.js`) |

---

## Features

- **Real-time MCP monitoring** — SQLite MCP server surfaces live service state; the dashboard queries `status.db` directly without a REST layer.
- **Autonomous incident resolution** — a single prompt triggers the full Plan → Alpha → Beta → commit → push pipeline with no confirmation prompts between steps.
- **Multi-agent orchestration** — three purpose-built subagents collaborate in sequence: Plan (strategy), Alpha-Debugger (diagnosis + fix), Beta-QA (regression tests + verification).
- **Dark-mode Vibe UI** — dashboard built using the `frontend-design` Claude Code skill; styled with Tailwind CSS and a dark palette tuned for ops readability.
- **Context Control via Resolution Protocol** — `CLAUDE.md` enforces a mandatory `docs/incident-history.log` lookup before any fix is applied. If a matching prior failure is found, the agent enters Thinking Mode and derives an alternative approach rather than repeating a known-bad fix.
- **Chaos Monkey fault injection** — `scripts/chaos-monkey.js` appends synthetic `TypeMismatch`, `SyntaxError`, `LogicError`, `DependencyError`, and `ConfigError` entries to `error.log` every 5 seconds, keeping the resolution loop continuously exercised.
- **50-test regression suite** — covers edge cases (NaN/Infinity severity, absent Content-Type header, floating-point timestamps), source integrity guards (defensive strings must be present in each service file), chaos-monkey canary assertions (synthetic error types must not appear in production code), and integration payloads reproducing each failure pattern.

---

## Local Setup

**Prerequisites:** Node.js 20+, npm

```bash
# 1. Clone the repository
git clone https://github.com/mistyyx/Project-Sentinel.git
cd Project-Sentinel

# 2. Install and test services (should report 50/50 passing)
cd services
npm install
npm test

# 3. Start the Next.js dashboard (opens at http://localhost:3000)
cd ../app
npm install
npm run dev

# 4. In a separate terminal — start Chaos Monkey fault injection
node scripts/chaos-monkey.js
```

> Chaos Monkey appends a synthetic error to `services/error.log` every 5 seconds.
> Watch `services/status.json` update in real time as the dashboard polls it.

---

## Autonomous Resolution Demo

With the repository cloned and dependencies installed, start a Claude Code session from the repo root:

```bash
claude
```

Then paste this prompt:

```
Sentinel Agent, execute the full Resolution Protocol for the most recent CRITICAL incident.
Step 1: Use the Plan agent to outline a step-by-step resolution strategy.
         Read /services/error.log to identify the most recent CRITICAL incident.
Step 2: Delegate to alpha-debugger. Alpha must read /docs/incident-history.log first,
         diagnose the root cause, apply a CLAUDE.md-compliant fix, and output the diagnosis JSON.
Step 3: Delegate to beta-qa. Beta must write a regression test in /services/__tests__/,
         run npm test, and confirm all tests pass.
Step 4: Append a new entry to /docs/incident-history.log, then commit and push to main.
Do not ask for confirmation between steps. Execute end-to-end.
```

Claude Code will spawn the subagents in sequence, log every decision, and push the resolved state to GitHub — no further input required.

---

## Subagents

Subagent definitions live in `.claude/agents/` and are loaded automatically by Claude Code when referenced.

### Alpha-Debugger (`.claude/agents/alpha-debugger.md`)

The root-cause diagnosis engine. On every invocation Alpha:

1. Reads `services/error.log` and `services/status.json` to identify the most recent CRITICAL incident.
2. Reads `docs/incident-history.log` in full — if a matching prior fix exists, enters Thinking Mode and proposes an alternative rather than repeating a known failure.
3. Locates the offending file, identifies the root cause, and applies the minimal CLAUDE.md-compliant fix.
4. Emits a structured JSON diagnosis report (`incident_id`, `file`, `line`, `root_cause`, `fix_summary`, `prior_failure_check`).
5. Does **not** write tests — hands off to Beta-QA explicitly.

**Available tools:** Read, Edit, Write, Bash, Grep, Glob

### Beta-QA (`.claude/agents/beta-qa.md`)

The regression safety net. On every invocation Beta:

1. Reads Alpha's most recent fix from git log and the diagnosis report.
2. Writes a test in `services/__tests__/` that reproduces the original failure and asserts the fix holds.
3. Runs `npm test` — if any test fails, reports back to Alpha rather than modifying source code.
4. Appends a verified entry to `docs/incident-history.log` on success.

**Available tools:** Read, Edit, Write, Bash, Grep, Glob

---

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main` with two sequential jobs:

```
push to main
    │
    ▼
┌─────────────────────────────┐
│  test                       │
│  • npm ci (services/)       │
│  • npm test  — 50 tests     │
│  • must exit 0              │
└────────────┬────────────────┘
             │ needs: test
             ▼
┌─────────────────────────────┐
│  deploy                     │
│  • npm install -g vercel    │
│  • vercel pull --production │
│  • vercel build --prod      │
│  • vercel deploy --prebuilt │
└─────────────────────────────┘
```

**Required GitHub secrets:**

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `orgId` in `.vercel/project.json` (run `vercel link`) |
| `VERCEL_PROJECT_ID` | `projectId` in `.vercel/project.json` (run `vercel link`) |

---

## Submission Artifacts

| Artifact | Description |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Resolution Protocol, TypeScript rules, naming conventions enforced across all agents |
| [`docs/incident-history.log`](./docs/incident-history.log) | Structured log of every incident, fix, and test result across all sessions |
| [`docs/post-mortem.md`](./docs/post-mortem.md) | Full post-mortem for the 2026-05-11 resolution session |
| [`agent-logs.txt`](./agent-logs.txt) | Exported orchestration transcript showing Plan → Alpha → Beta execution |
| [`.claude/agents/`](./.claude/agents/) | Alpha-Debugger and Beta-QA subagent definitions |
| [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) | GitHub Actions workflow — test gate + Vercel deploy |

---

## Project Structure

```
Project-Sentinel/
├── .claude/
│   └── agents/
│       ├── alpha-debugger.md
│       └── beta-qa.md
├── .github/
│   └── workflows/
│       └── deploy.yml
├── app/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── incident-history.log
│   └── post-mortem.md
├── scripts/
│   └── chaos-monkey.js
├── services/
│   ├── __tests__/
│   │   └── regression.test.ts   # 50 tests
│   ├── tests/
│   ├── alert-dedup-engine.ts
│   ├── severity-parser.ts
│   ├── response-parser.ts
│   ├── error.log
│   ├── status.json
│   ├── status.db
│   ├── package.json
│   └── tsconfig.json
├── agent-logs.txt
├── CLAUDE.md
└── README.md
```

---

## Credits

Built with [Claude Code](https://claude.ai/code) as the capstone project for the Claude Code PDF Mastery curriculum.

Subagent architecture, Resolution Protocol, Chaos Monkey integration, regression test suite, CI/CD pipeline, and this documentation were all authored autonomously by Claude Code across multiple orchestrated sessions.

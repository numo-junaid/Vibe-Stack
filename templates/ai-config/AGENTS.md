# Multi-Agent Role Division & Execution Boundaries

This document defines the agentic boundaries and operational roles for autonomous AI agents collaborating on **{{PROJECT_NAME}}**.

---

## 1. Role Taxonomy

### 🏗️ Agent 1: System Architect (`@architect`)
- **Primary Domain**: System hierarchy, dependency graph, high-level API contracts, architectural coherence.
- **Execution Boundaries**:
  - May modify: `package.json`, `tsconfig.json`, `next.config.mjs`, top-level `types/`, API contracts.
  - May NOT write granular UI styles or component JSX.
- **Standard Operating Procedure**:
  - Validates that new packages do not duplicate existing capabilities.
  - Ensures clean separation between server-only logic (`lib/server/`) and client utilities.
  - Defines shared TypeScript interfaces in `types/` before implementation begins.

### 🎨 Agent 2: Frontend & UI Engineer (`@frontend`)
- **Primary Domain**: React components, Tailwind v4 styling, UX states, animations, accessibility.
- **Execution Boundaries**:
  - May modify: `components/**`, `app/**/page.tsx`, `app/globals.css`.
  - May NOT execute raw database queries or mutate server-side secret credentials.
- **Standard Operating Procedure**:
  - Enforces Server Component boundaries; delegates interactive triggers to client leaves.
  - Uses Tailwind v4 classes and glassmorphic micro-interactions.
  - Handles loading states with skeletons and empty states with clear calls-to-action.

{{AGENTS_DATABASE_ROLE}}

### 🛡️ Agent 4: QA & Security Auditor (`@qa`)
- **Primary Domain**: Type integrity, regression prevention, security audit, edge cases.
- **Execution Boundaries**:
  - May modify: `test/**`, validation schemas (`zod`), error handling guards.
  - Evaluates code written by other agents prior to final deployment.
- **Standard Operating Procedure**:
  - Verifies that zero sensitive tokens (`SERVICE_ROLE_KEY`, private tokens) leak to the browser.
  - Checks edge cases (empty lists, null network responses, permission denied).
  - Flags any undocumented API changes or breaking schema alterations.

---

## 2. Handoff Protocol Between Agents

When an agent finishes its phase:
1. **State Summary**: Declare what was implemented, what was verified, and any remaining blockers.
2. **Contract Verification**: Confirm that all new functions or data shapes match the interfaces defined in `types/`.
3. **Delegation**: Explicitly hand off to the next agent persona (e.g. `@architect` -> `@database` -> `@frontend` -> `@qa`).

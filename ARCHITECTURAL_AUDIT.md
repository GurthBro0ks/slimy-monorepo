# Architectural Audit: Slimy Monorepo

This document outlines the findings and actions taken during a high-intensity architectural audit of the `slimy-monorepo`.

## Phase 1: Surgical Audit

### 1. Dependency Mapping

An analysis of all `package.json` files was performed to map the workspace dependencies. The key findings were significant version inconsistencies across core libraries like React, Next.js, and Zod.

### 2. Key Findings

#### Finding 1: Zombie Packages

The most critical finding is that all five packages in the `packages/` directory (`shared-auth`, `shared-codes`, `shared-config`, `shared-db`, `shared-snail`) are **zombie packages**. They exist in the workspace but contain no source code, exports, or dependencies. They are empty shells.

**Impact:** This adds unnecessary complexity, misleads developers about the existence of shared logic, and bloats the workspace configuration.

**Recommendation:** These packages should either be **implemented** with the intended shared code or **removed** entirely from the monorepo.

#### Finding 2: Dependency Version Inconsistencies

Multiple core dependencies are mismatched across different applications, which can lead to subtle bugs, inconsistent behavior, and increased bundle sizes.

| Dependency | `@slimy/web` | `@slimy/admin-ui` | `@slimy/admin-api` | `@slimy/bot` |
| :--- | :--- | :--- | :--- | :--- |
| **React** | `19.2.0` | `18.2.0` | - | - |
| **Next.js** | `16.0.1` | `14.2.5` | - | - |
| **Zod** | `4.1.12` | - | `3.25.6` | - |
| **Sharp** | `0.33.5` | - | `0.33.4` | - |
| **TypeScript**| `^5` (dev) | - | - | `^5.3.3` (dev) |

## Phase 2: Active Remediation

Based on the findings, the following actions were taken:

1.  **Harmonize Sharp Version:** The `sharp` dependency in `@slimy/admin-api` was updated from `^0.33.4` to `^0.33.5` to match the version used in `@slimy/web`.
2.  **Update Lockfile:** `pnpm install` was run to apply the change and update the `pnpm-lock.yaml` file.

## Phase 3: Automated Guardrails

To prevent future accumulation of dead code, a custom deprecation checker was built.

### 1. ESLint Incompatibility

An initial attempt to use `eslint-plugin-deprecation` failed due to its incompatibility with ESLint v9, the version used in this project. Forcing a downgrade was deemed too disruptive.

### 2. Custom Deprecation Checker

A custom script, `scripts/check-deprecation.ts`, was created to serve as a robust, lightweight alternative. This script:

- Uses `glob` to find all source files.
- Uses simple string matching and regex to find `@deprecated` JSDoc tags and their associated exports in the `packages/` directory.
- Scans the `apps/` directory for any imports of these deprecated exports.
- Logs a warning and exits with a non-zero status code if any deprecated usages are found, making it ideal for CI/CD integration.

### 3. Integration

The script was added to the root `package.json` as `lint:deprecations`.

## Phase 4: Deliverables

This document serves as the primary deliverable. All changes, including the new deprecation checker, have been committed to the repository.

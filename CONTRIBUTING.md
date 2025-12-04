# Contributing to Slimy Monorepo

Welcome to the Slimy Monorepo! We're excited to have you contribute. To maintain a clean and scalable codebase, we adhere to a strict "Zero-Zombie Policy."

## Code Hygiene: The "Zombie Hunt"

Our core philosophy is simple: **If an export is not used in an app, it should not exist.** This prevents the accumulation of dead code, which increases maintenance overhead and cognitive load.

### The Deprecation Lifecycle

We follow a three-step process for managing unused code:

1.  **Identify:** During audits or routine development, unused exports from `packages/` are identified. We use dependency analysis and usage searches (`grep`) to find code that is not imported by any application in the `apps/` directory.

2.  **Deprecate:** Once an export is confirmed to be unused, it is marked with a JSDoc comment:
    ```typescript
    /** @deprecated [Manus Audit] Unused */
    ```

3.  **Eliminate:** Code marked as deprecated should be removed. If the deprecation warning persists for more than one sprint, or during a dedicated audit, the code is deleted entirely. This is the final and most important step.

## Linter Guardrails

To enforce this policy automatically, our ESLint configuration is equipped with rules that detect the use of deprecated code. Before committing, you must run `pnpm lint`. The build will fail if it detects usage of code marked for deprecation, ensuring that zombies, once identified, cannot be reanimated.

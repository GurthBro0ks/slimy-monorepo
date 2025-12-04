# Keeping the Monorepo Clean: The Deprecation Workflow

## Section 1: The Philosophy - Why We Hunt Zombies

In a large, evolving monorepo, code that is no longer needed—or has been replaced by a better alternative—can linger like a zombie. This "dead" or obsolete code creates several problems:

*   **Performance Degradation:** Unused code can still be bundled, increasing application size and slowing down load times.
*   **Reduced Clarity:** It becomes harder for developers to know which function or component is the correct one to use, leading to confusion and bugs.
*   **Maintenance Overhead:** Zombie code still needs to be read, understood, and maintained, wasting valuable developer time and effort.

Our deprecation workflow is a systematic process for identifying, marking, and safely removing this code. By consistently following this workflow, we keep our codebase clean, performant, and easy to navigate.

## Section 2: The Tool - `lint:deprecations`

To automate this process, we have a custom script that acts as our zombie detector.

### The Command

To run the checker, use the following command from the root of the monorepo:

```bash
pnpm run lint:deprecations
```

### How It Works

The script performs two main functions:

1.  **Scans `packages/*`:** It looks for any exported function, component, or class that has been marked with a `/** @deprecated */` JSDoc tag.
2.  **Scans `apps/*`:** It then checks if any of the applications are importing and using these deprecated exports.

### Reading the Output

*   **If the build is clean:**

    You will see a success message, and the script will exit with code 0.

    ```
    ✅ No deprecated exports found in packages/*
    ```

*   **If deprecated usage is found:**

    The script will log a detailed warning, specifying which deprecated export is being used and where. It will then exit with code 1, which will fail the build in a CI environment.

    ```
    ❌ Found 4 usage(s) of deprecated exports:

    ⚠️  [WARNING] 4 usage(s) of deprecated 'getUser' from shared-db
       Deprecated in: packages/shared-db/index.ts:5
       Used in:
          - apps/web/test-deprecation.ts:1
          - apps/web/test-deprecation.ts:4
          - apps/web/test-deprecation.ts:12
          - apps/web/test-deprecation.ts:13

    ❌ Build failed: Deprecated exports are still in use.
    ```

## Section 3: The Lifecycle - A Step-by-Step Guide

Follow these steps to deprecate and remove code safely.

### Step 1: Mark It

When you identify code that should be removed, the first step is to mark it as deprecated. Add a `/** @deprecated */` JSDoc tag directly above the export.

**Good Practice:** Always include a reason and suggest an alternative.

```typescript
/**
 * @deprecated Use the new `getUserById` function from `@slimy/user-api` instead. This function will be removed in Q3 2025.
 */
export function getUser(id: string) {
  // ... old logic
}
```

### Step 2: Check It

After marking the code, run the deprecation checker to see if it is being used anywhere.

```bash
pnpm run lint:deprecations
```

If the script finds usages, your goal is to refactor the code in `apps/*` to use the suggested alternatives until the script passes with no warnings.

### Step 3: Kill It

Once the `lint:deprecations` script runs clean—meaning no applications are using the deprecated code—it is safe to remove the zombie.

1.  Delete the deprecated function, component, or class from the package.
2.  Commit your changes.

Congratulations, you have made the monorepo a cleaner and safer place!

## Section 4: FAQ

**Q: What if I need to use a deprecated function temporarily?**

**A:** The primary rule is to avoid using deprecated code. If you absolutely must use it for a temporary fix, you have two options, but both should be considered a last resort:

1.  **Fix the Caller (Preferred):** The best solution is to update the code that is calling the deprecated function to use the modern alternative.
2.  **Temporarily Remove the Tag:** If you cannot fix the caller immediately, you can remove the `@deprecated` tag. However, you **must** create a tech debt ticket and assign it to your team to ensure the usage is addressed and the tag is restored later.

**Q: The script is failing in CI. What do I do?**

**A:** This is by design. The CI failure prevents new usages of deprecated code from being merged. Read the error log to identify the deprecated function and where it's being used. Your pull request will not be mergeable until you have removed the deprecated usage.

**Q: Can I deprecate code inside an `app`?**

**A:** The script is currently configured to check for deprecated exports in `packages/*` and their usage in `apps/*`. It does not track deprecations within the same app. The primary goal is to manage the public API of our shared packages.

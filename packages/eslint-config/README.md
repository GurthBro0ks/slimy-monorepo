# @slimy/eslint-config

Shared ESLint configurations for Slimy.ai services

## Purpose

Provides centralized ESLint configurations across all Slimy.ai applications, ensuring:
- Consistent code style
- Best practices enforcement
- Type-safe linting with TypeScript
- Framework-specific rules (React, Node.js)
- Import ordering and organization

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Configurations need to be:
- Extracted from existing `.eslintrc` files
- Standardized across all services
- Extended with best practices

## Proposed Tech Stack

- **ESLint 9.x** - Linting engine
- **TypeScript ESLint** - TypeScript support
- **React Plugin** - React-specific rules
- **Import Plugin** - Import/export rules
- **Prettier Integration** - Code formatting

## Proposed Configurations

### Base Config (`@slimy/eslint-config`)

```javascript
// Usage in app
module.exports = {
  extends: ['@slimy/eslint-config'],
};
```

### React Config (`@slimy/eslint-config/react`)

```javascript
// Usage in React app
module.exports = {
  extends: ['@slimy/eslint-config/react'],
};
```

### Next.js Config (`@slimy/eslint-config/next`)

```javascript
// Usage in Next.js app
module.exports = {
  extends: ['@slimy/eslint-config/next'],
};
```

### Node.js Config (`@slimy/eslint-config/node`)

```javascript
// Usage in Node.js app
module.exports = {
  extends: ['@slimy/eslint-config/node'],
};
```

## Proposed Directory Structure

```
packages/eslint-config/
├── src/
│   ├── base.js               # Base ESLint config
│   ├── react.js              # React-specific config
│   ├── next.js               # Next.js-specific config
│   ├── node.js               # Node.js-specific config
│   └── rules/                # Shared rule sets
│       ├── typescript.js     # TypeScript rules
│       ├── imports.js        # Import rules
│       ├── style.js          # Style rules
│       └── security.js       # Security rules
├── package.json
└── README.md
```

## Base Configuration

```javascript
// src/base.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // Must be last
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
    }],

    // Imports
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
};
```

## React Configuration

```javascript
// src/react.js
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript
    'react/jsx-uses-react': 'off',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-key': 'error',

    // Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Accessibility
    'jsx-a11y/anchor-is-valid': 'error',
  },
};
```

## Next.js Configuration

```javascript
// src/next.js
module.exports = {
  extends: [
    './react.js',
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'warn',
  },
};
```

## Node.js Configuration

```javascript
// src/node.js
module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
  },
  rules: {
    'no-console': 'off', // Console is OK in Node.js
    '@typescript-eslint/no-var-requires': 'off', // Allow require() in configs
  },
};
```

## Dependencies

```json
{
  "name": "@slimy/eslint-config",
  "version": "0.1.0",
  "main": "src/base.js",
  "peerDependencies": {
    "eslint": "^9.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "@next/eslint-plugin-next": "^14.0.0",
    "eslint-import-resolver-typescript": "^3.6.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "typescript": "^5.3.0"
  }
}
```

## Usage

### In Web App (Next.js)

```javascript
// apps/web/.eslintrc.js
module.exports = {
  root: true,
  extends: ['@slimy/eslint-config/next'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

### In Admin API (Node.js)

```javascript
// apps/admin-api/.eslintrc.js
module.exports = {
  root: true,
  extends: ['@slimy/eslint-config/node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

### In Shared Package

```javascript
// packages/shared-db/.eslintrc.js
module.exports = {
  root: true,
  extends: ['@slimy/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

## Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix"
  }
}
```

## Integration with Prettier

Prettier handles formatting, ESLint handles code quality:

```javascript
// .prettierrc.js (root)
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
};
```

ESLint config already includes `eslint-config-prettier` to disable conflicting rules.

## Migration Checklist

1. **Extract existing ESLint configs**:
   - Review `.eslintrc` files in all apps
   - Identify common rules
   - Document app-specific rules

2. **Create base config**:
   - Set up TypeScript support
   - Configure import rules
   - Add consistent style rules

3. **Create framework-specific configs**:
   - React config for UI apps
   - Next.js config for web
   - Node.js config for APIs

4. **Update all apps**:
   - Replace local configs with shared config
   - Test linting across all apps
   - Fix any new linting errors

5. **Add to CI/CD**:
   - Run ESLint in GitHub Actions
   - Fail builds on linting errors
   - Optionally add auto-fix commits

## CI/CD Integration

```yaml
# .github/workflows/lint.yml
name: Lint
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
```

## Custom Rules

Add custom rules specific to Slimy.ai:

```javascript
// src/rules/slimy.js
module.exports = {
  rules: {
    // Enforce error codes from @slimy/shared-codes
    'slimy/use-error-codes': 'error',

    // Enforce API response format
    'slimy/api-response-format': 'error',

    // Prevent direct database access (use repositories)
    'slimy/no-direct-db-access': 'warn',
  },
};
```

## VSCode Integration

Recommend VSCode settings for the workspace:

```json
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## Used By

- `@slimy/web` - Next.js config
- `@slimy/admin-api` - Node.js config
- `@slimy/admin-ui` - Next.js config
- `@slimy/bot` - Node.js config
- All packages - Base config

## Related Packages

- `@slimy/tsconfig` - TypeScript configurations
- Prettier - Code formatting (complementary)

## Best Practices

1. **Keep rules consistent**: Don't have conflicting rules between configs
2. **Document exceptions**: If you disable a rule, document why
3. **Gradual adoption**: Start with warnings, then errors
4. **Auto-fix when possible**: Use `--fix` in development
5. **Review regularly**: Update rules as the team agrees on new standards

## Future Enhancements

- **Custom ESLint Rules**: Slimy.ai-specific rules
- **Auto-fix on commit**: Git hooks with Husky
- **Import cost tracking**: Warn on large imports
- **Complexity limits**: Cyclomatic complexity rules
- **Performance hints**: Detect performance anti-patterns

## License

Proprietary - Slimy.ai

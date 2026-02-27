// eslint.config.js
// Based on Airbnb JavaScript Style Guide with TypeScript support
// https://github.com/airbnb/javascript

import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import stylistic from '@stylistic/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // Fetch API
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // Events
        Event: 'readonly',
        CustomEvent: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        WheelEvent: 'readonly',
        PointerEvent: 'readonly',
        TouchEvent: 'readonly',
        FocusEvent: 'readonly',
        InputEvent: 'readonly',
        // DOM Elements
        Element: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLSelectElement: 'readonly',
        SVGElement: 'readonly',
        // Other DOM APIs
        Node: 'readonly',
        NodeList: 'readonly',
        DOMRect: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        PerformanceObserver: 'readonly',
        // Media
        MediaQueryList: 'readonly',
        MediaRecorder: 'readonly',
        // Misc
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        Audio: 'readonly',
        Worker: 'readonly',
        WebSocket: 'readonly',
        EventSource: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        // TypeScript/React
        React: 'readonly',
        JSX: 'readonly',
        // Fetch/HTTP API types
        RequestInit: 'readonly',
        RequestInfo: 'readonly',
        BodyInit: 'readonly',
        XMLHttpRequest: 'readonly',
        XMLHttpRequestUpload: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin,
      '@stylistic': stylistic,
    },
    rules: {
      // ============================================
      // TypeScript recommended rules
      // ============================================
      ...typescript.configs.recommended.rules,

      // ============================================
      // React recommended rules
      // ============================================
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off', // We often export utilities alongside components
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // ============================================
      // Airbnb-inspired: Best Practices
      // ============================================
      'no-console': 'warn', // Airbnb: warn about console.log
      'no-debugger': 'error',
      'no-alert': 'warn', // Warn about alert/confirm/prompt usage
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-await': 'off', // Async functions may be intentionally await-free for interface consistency
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['error', 'multi-line'],
      'default-case': 'warn', // Encourage default case in switch statements
      'default-case-last': 'error',
      'dot-notation': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-empty-function': 'warn',
      'no-floating-decimal': 'error',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-nested-ternary': 'warn', // Discourage deeply nested ternaries
      'no-unneeded-ternary': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': ['warn', {
        array: false,
        object: true,
      }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'object-shorthand': ['error', 'always'],
      'arrow-body-style': ['warn', 'as-needed'],
      'no-useless-constructor': 'off', // TypeScript handles this

      // ============================================
      // Airbnb-inspired: Variables
      // ============================================
      'no-shadow': 'off', // Use TypeScript version
      '@typescript-eslint/no-shadow': 'warn',
      'no-use-before-define': 'off', // Use TypeScript version
      '@typescript-eslint/no-use-before-define': ['error', {
        functions: false,
        classes: true,
        variables: true,
      }],

      // ============================================
      // Airbnb-inspired: Stylistic (via @stylistic)
      // ============================================
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/block-spacing': 'error',
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/computed-property-spacing': ['error', 'never'],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/no-mixed-operators': 'warn', // Encourage parentheses for clarity
      '@stylistic/padded-blocks': ['error', 'never'],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],

      // ============================================
      // Import rules (Airbnb-inspired)
      // ============================================
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/extensions': 'off', // TypeScript handles this
      'import/prefer-default-export': 'off', // Named exports are fine
      'import/no-extraneous-dependencies': 'off', // monorepo setup
      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'type',
        ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/newline-after-import': ['error', { count: 1 }],
      'import/no-duplicates': 'error',

      // ============================================
      // TypeScript-specific rules
      // ============================================
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '.*',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // '@typescript-eslint/prefer-optional-chain' requires type information, disabled for now
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Can be strict for some cases
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'off',

      // ============================================
      // React-specific Airbnb rules
      // ============================================
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/jsx-no-useless-fragment': 'warn', // Avoid unnecessary fragments
      'react/jsx-pascal-case': 'error',
      'react/self-closing-comp': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unused-state': 'error',
      'react/prefer-stateless-function': 'warn',
      'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.tsx'] }],
      'react/function-component-definition': 'off', // Allow both arrow functions and function declarations
      'react/hook-use-state': 'warn', // Encourage proper useState destructuring
      'react/jsx-no-constructed-context-values': 'warn',
      'react/no-unstable-nested-components': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  // API-specific overrides (no React)
  {
    files: ['apps/api/**/*.{js,ts}'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': 'off',
      'react/jsx-filename-extension': 'off',
      'react/function-component-definition': 'off',
      '@stylistic/jsx-quotes': 'off',
    },
  },
  // Test files - relax some rules
  {
    files: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}', '**/tests/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Logger, debug utilities, and CLI scripts - legitimate console usage
  {
    files: [
      'packages/logger/**/*.ts',
      '**/debug.ts',
      '**/ErrorBoundary.tsx',
      '**/scripts/**/*.ts',
      '**/seed/**/*.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  // Config files
  {
    files: ['**/*.config.{js,ts,mjs,cjs}', '**/vite.config.*'],
    rules: {
      'import/no-default-export': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  // Type declaration files - import() annotations are standard in .d.ts
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  // MongoDB scripts (shell scripts)
  {
    files: ['**/scripts/*.js', '**/mongo/**/*.js'],
    languageOptions: {
      globals: {
        db: 'writable', // MongoDB shell allows db = db.getSiblingDB()
        print: 'readonly',
        printjson: 'readonly',
        ObjectId: 'readonly',
        ISODate: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // Type Safety for Apps: Enforce type definitions only in approved locations
  // Types may only be exported from:
  //  - packages/schema/src/** (shared API contracts)
  //  - **/types/** (app-specific types)
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx'],
    ignores: ['apps/**/types/**/*.ts', 'apps/**/types/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportNamedDeclaration[declaration.type="TSInterfaceDeclaration"]',
          message: 'Type definitions must be in packages/schema (shared contracts) or in a types/ directory (app-specific types). See .claude/skills/type-safety-schema/SKILL.md',
        },
        {
          selector: 'ExportNamedDeclaration[declaration.type="TSTypeAliasDeclaration"]',
          message: 'Type definitions must be in packages/schema (shared contracts) or in a types/ directory (app-specific types). See .claude/skills/type-safety-schema/SKILL.md',
        },
        {
          selector: 'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/Schema$/]',
          message: 'Zod schemas must be in packages/schema. See .claude/skills/type-safety-schema/SKILL.md',
        },
      ],
    },
  },
  // React Native (syncstation-app): Animated API requires passing ref values to style props during render
  // react-hooks/refs is a false positive for this pattern - Animated.Value is designed for this use case
  {
    files: ['apps/syncstation-app/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/refs': 'off',
    },
  },
  // Type Safety for Packages: No ESLint restrictions
  // Packages SHOULD freely export types - the API surface is controlled by:
  //  1. What's re-exported from src/index.ts (public API)
  //  2. What's re-exported from src/internal.ts (internal/testing API)
  //  3. The package.json "exports" field
  // Component files export their types, entry points re-export them for consumers.
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      '**/*.config.cjs',
    ],
  },
];

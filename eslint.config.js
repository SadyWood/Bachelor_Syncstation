/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/.expo/**',
      '**/*.config.js',
      '**/index.js',
      '**/babel.config.js',
      '**/metro.config.js',
    ],
  },
  ...compat.extends(
    'airbnb-base',
    'airbnb-typescript/base',
    'prettier' // Disables ESLint formatting rules that conflict with Prettier
  ),
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Airbnb overrides - customize as needed
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'import/prefer-default-export': 'off', // Named exports are fine
      'no-console': 'warn', // Allow console in development
      'import/no-unresolved': 'off', // TypeScript handles this
      // Disable incompatible rules from airbnb-typescript with newer @typescript-eslint
      '@typescript-eslint/lines-between-class-members': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      // Disable return-await - it's a style preference and not critical
      '@typescript-eslint/return-await': 'off',
      // Allow shadowing in specific contexts (route handlers)
      '@typescript-eslint/no-shadow': ['error', { allow: ['content', 'subjects', 'products', 'userAddresses'] }],
    },
  },
  // Config files can use __dirname and devDependencies
  {
    files: ['**/*.config.{js,ts}', 'drizzle.config.ts'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'no-underscore-dangle': 'off',
    },
  },
  // Scripts can use console and have relaxed rules
  {
    files: ['**/scripts/**/*.ts', '**/src/scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
      'no-promise-executor-return': 'off',
      'no-continue': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Server files can use console
  {
    files: ['**/server.ts', '**/client.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // Utility files can use bitwise operators
  {
    files: ['**/lib/uuidv7.ts'],
    rules: {
      'no-bitwise': 'off',
    },
  },
  // Type Safety Enforcement: Prevent duplicate type definitions
  // Forces all shared types to live in packages/schema for consistency
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx'],
    ignores: ['apps/**/types/**/*.ts', 'apps/**/types/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportNamedDeclaration[declaration.type="TSInterfaceDeclaration"]',
          message:
            'Type definitions must be in packages/schema (shared contracts) or in a types/ directory (app-specific types). See .claude/skills/type-safety-schema/SKILL.md',
        },
        {
          selector: 'ExportNamedDeclaration[declaration.type="TSTypeAliasDeclaration"]',
          message:
            'Type definitions must be in packages/schema (shared contracts) or in a types/ directory (app-specific types). See .claude/skills/type-safety-schema/SKILL.md',
        },
        {
          selector:
            'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/Schema$/]',
          message: 'Zod schemas must be in packages/schema. See .claude/skills/type-safety-schema/SKILL.md',
        },
      ],
    },
  }
);

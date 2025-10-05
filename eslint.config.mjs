// eslint.config.mjs
// @ts-check

import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.d.ts',
      'eslint.config.*',
      '.prettierrc.*',
    ],
  },

  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // change to 'commonjs' if you don’t use ESM
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: new URL('.', import.meta.url).pathname },
    },
  },
  eslintConfigPrettier,
  { plugins: { prettier: prettierPlugin }, rules: { 'prettier/prettier': 'error' } },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/prefer-regexp-exec': 'warn',
    },
  },
);

import eslint from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Enforce using type instead of interface
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // Allow any types - we'll use them when needed
      '@typescript-eslint/no-explicit-any': 'off',

      // Allow unused variables - sometimes they're needed for destructuring or future use
      '@typescript-eslint/no-unused-vars': 'off',

      // Disable base rules that are covered by TypeScript
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', '*.js'],
  },
]

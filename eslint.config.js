import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Lint only source code. Ignore build outputs and serverless/scripts tooling.
  globalIgnores([
    'dist',
    '.vercel',
    'api',
    'scripts',
    'node_modules',
    '*.cjs',
    'setup-apriq-ui.js',
    'src/engine/test.js',
  ]),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Keep lint signal high without blocking deploys on harmless leftovers.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // These rules are overly strict for this codebase’s existing patterns.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])

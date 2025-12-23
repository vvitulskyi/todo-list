import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // shadcn/ui files often export both components and helpers (variants)
      'react-refresh/only-export-components': 'off',
      // React 19 rule; we intentionally reset form state when the dialog opens
      'react-hooks/set-state-in-effect': 'off',
      // shadcn/ui types often use empty interfaces extending intrinsic props
      '@typescript-eslint/no-empty-object-type': 'off',
      // TanStack Virtual uses APIs that trigger this warning; it's expected/benign here.
      'react-hooks/incompatible-library': 'off',
    },
  },
])

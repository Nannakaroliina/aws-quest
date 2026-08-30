import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

/**
 * Flat config. TypeScript + Svelte 5. The transitional engine / mini-game
 * modules carry `// @ts-nocheck` and lean on browser DOM globals; the rest is
 * ordinary strict TS. Prettier owns formatting, so it stays last.
 */
export default ts.config(
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/', 'static/', 'coverage/'],
  },

  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },

  {
    // Ported imperative code: kept verbatim from the pre-SvelteKit build and
    // carried behind `// @ts-nocheck` until each screen/sim becomes a Svelte
    // component. Relax the rules that only fight that transitional style.
    files: ['src/lib/game/engine.ts', 'src/lib/minigames/**/*.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-nocheck': false }],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-cond-assign': 'off',
    },
  },
);

import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

/**
 * Flat config. The game code in src/ is plain browser <script> files (IIFEs
 * that hang modules off window.AWSQUEST_*), not ES modules — so sourceType is
 * "script" there. Tooling files are real ESM/CJS Node.
 */
export default [
  {
    ignores: ['node_modules/**', 'assets/**', 'package-lock.json'],
  },

  js.configs.recommended,

  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // cross-file singletons attached to window by the game's own scripts
        AWSQUEST_CONTENT: 'writable',
        AWSQUEST_SOUND: 'writable',
        AWSQUEST_MINIGAMES: 'writable',
        AWSQUEST_BUILD: 'writable',
        AWSQUEST_BUILDS: 'writable',
      },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-implicit-globals': 'error',
      'no-console': 'off',
    },
  },

  {
    files: ['scripts/**/*.{js,mjs,cjs}', 'eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  // must stay last: turns off rules that would fight Prettier
  prettier,
];

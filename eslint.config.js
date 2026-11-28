// Lint rules for the whole workspace. Type-aware: each file is checked with its nearest tsconfig.json.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/*.js', '!eslint.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Files stay small enough to read whole (the brief: under about 300 lines).
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    // The rules run on the page and on the server alike, and must answer the same on both (session 293): a
    // tie broken by localeCompare follows the device's language (Lithuanian sorts y with i), so the page's
    // fight could eat another meal than the server's and spend other trophies; nor may the rules read the
    // clock or chance of their own, which come in with each command.
    files: ['packages/kernel/src/**/*.ts', 'packages/features/src/**/*.ts', 'packages/content/src/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'The rules draw chance from the save (rng).' },
        { object: 'Date', property: 'now', message: 'The rules take the time they are given.' },
        ...['localeCompare', 'toLocaleString', 'toLocaleLowerCase', 'toLocaleUpperCase'].map((property) => ({
          property,
          message: "This follows the device's language: order ids with codeOrder, and say numbers through fmt.",
        })),
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'The rules take the time they are given.',
        },
      ],
    },
  },
  {
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);

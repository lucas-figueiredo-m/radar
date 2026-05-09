import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

const baseLanguageOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
  globals: { ...globals.browser, ...globals.node },
};

export default [
  {
    ignores: [
      '**/dist/**',
      '**/dist-electron/**',
      '**/release/**',
      '**/node_modules/**',
      '**/build/**',
      'examples/expo/**',
      'examples/react-native/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: baseLanguageOptions,
  },

  {
    files: ['apps/app/**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    ...reactPlugin.configs.flat.recommended,
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      ...baseLanguageOptions,
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['apps/app/**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    ...reactPlugin.configs.flat['jsx-runtime'],
  },
  {
    files: ['apps/app/**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['apps/app/**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    rules: {
      'react/prop-types': 'off',
    },
  },
];

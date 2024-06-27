import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:import/errors',
      'plugin:import/warnings',
      'prettier',
    ),
  ),
  {
    ignores: ['node_modules/**/*', 'build/**/*', 'dist/**/*'],
  },
  {
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      react: fixupPluginRules(react),
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        createClass: 'createReactClass',
        pragma: 'React',
        fragment: 'Fragment',
        version: 'detect',
        flowVersion: '0.53',
      },
      'import/resolver': {
        typescript: {},

        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },

    rules: {
      'prettier/prettier': ['error'],
      'import/no-extraneous-dependencies': 'off',
      'import/prefer-default-export': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-no-constructed-context-values': 'off',

      'react/jsx-filename-extension': [
        1,
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],

      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
          js: 'never',
          jsx: 'never',
        },
      ],

      'import/no-unresolved': [
        2,
        {
          commonjs: true,
          amd: true,
        },
      ],

      'import/named': 2,
      'import/namespace': 0,
      'import/default': 2,
      'import/export': 2,
      'linebreak-style': 0,
      'class-methods-use-this': 0,
      'eslint-disable-next-line react/jsx-no-useless-fragment': 'off',
      'no-underscore-dangle': 'off',
      'no-useless-constructor': 0,
      'max-classes-per-file': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      camelcase: 'off',
    },
  },
];

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
        react: {
            version: 'detect' // Automatically detect React version
        }
    }
  },
  // 1. Base JavaScript rules
  js.configs.recommended,
  // 2. React Rules
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: {
      react,
    },
    rules: {
      // Spread the recommended rules from the plugin
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules, // Add this if you are using React 17+ (no import React required)
      
      // You can override specific rules here, for example:
      'react/prop-types': 'off', 
    },
  },
];
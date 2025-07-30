import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import next from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  {
    ignores: [
      'src/generated/**/*',
      'src/generated/**/*.js',
      'src/generated/**/*.ts',
      '.next/**/*',
      'node_modules/**/*',
      '*.d.ts',
      'dist/**/*',
      'build/**/*',
      '*.config.js',
      '*.config.ts',
      'eslint.config.js',
      'next.config.js',
      'tailwind.config.js',
      // PWA auto-generated files
      'public/sw.js',
      'public/workbox-*.js',
      'public/worker-*.js',
      // Node.js scripts
      'scripts/test-pwa-features.js',
    ],
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      react: react,
      '@next/next': next,
    },
    rules: {
      // Next.js rules
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,

      // TypeScript rules - more relaxed for better DX
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Temporarily disabled for bulk fixing
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // React rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // Changed from error to warn
      'react/jsx-no-target-blank': 'error',
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-unescaped-entities': 'error',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+

      // General JavaScript rules - relaxed for better DX
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-console': 'off', // Temporarily disabled for development
      'no-debugger': 'warn', // Allow debugger in development
      'no-var': 'error',
      'prefer-const': 'error',
      'no-undef': 'off', // TypeScript handles this
      eqeqeq: 'warn',
      curly: 'error',

      // Disable overly strict rules that hurt DX
      'no-alert': 'off',
      'no-eval': 'error',
      'no-throw-literal': 'warn',
      complexity: 'off',
      'max-lines': 'off',
      'max-params': 'off',
      'no-magic-numbers': 'off',
      'no-plusplus': 'off',
      'no-underscore-dangle': 'off',
      'prefer-destructuring': 'off',

      // Style rules - let Prettier handle most formatting
      quotes: 'off',
      semi: 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      indent: 'off',
      'linebreak-style': 'off',
      'max-len': 'off',
    },
  },
];

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import prettierConfig from 'eslint-config-prettier';

export default [
  // 1. Globally ignored files and directories
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'blob-report/**',
      'next-env.d.ts',
      '*.bak',
      'pnpm-lock.yaml',
    ],
  },

  // 2. Base Recommended JavaScript Rules
  js.configs.recommended,

  // 3. Main TypeScript and React application rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      boundaries: boundaries,
      'import-x': importX,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'features', pattern: 'src/features/*/**', capture: ['featureName'] },
        { type: 'components-atoms', pattern: 'src/components/atoms/**' },
        { type: 'components-molecules', pattern: 'src/components/molecules/**' },
        { type: 'components-organisms', pattern: 'src/components/organisms/**' },
        { type: 'components-templates', pattern: 'src/components/templates/**' },
        { type: 'components-layouts', pattern: 'src/components/layouts/**' },
        { type: 'components-ui', pattern: 'src/components/ui/**' },
        { type: 'components-shared', pattern: 'src/components/shared/**' },
        { type: 'lib-server', pattern: 'src/lib/server/**' },
        { type: 'lib-client', pattern: 'src/lib/client/**' },
        { type: 'lib-shared', pattern: 'src/lib/!(server|client)/**' },
        { type: 'hooks', pattern: 'src/hooks/**' },
        { type: 'providers', pattern: 'src/providers/**' },
        { type: 'config', pattern: 'src/config/**' },
        { type: 'types', pattern: 'src/types/**' },
        { type: 'styles', pattern: 'src/styles/**' },
      ],
      'boundaries/ignore': ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    },
    rules: {
      // TypeScript handles undeclared variables and type/value overloading natively
      'no-undef': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': ['error', { ignoreDeclarationMerge: true }],

      // ----------------------------------------------------------------------
      // AGENTS.md Rule 10 & 77: TypeScript Strictness - NO `any`, NO `@ts-ignore`
      // ----------------------------------------------------------------------
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',

      // ----------------------------------------------------------------------
      // AGENTS.md Rule 25 & 77: Observability & Logging - NO raw console.log
      // ----------------------------------------------------------------------
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // ----------------------------------------------------------------------
      // AGENTS.md Rule 35 & 77: Security - NO arbitrary dangerouslySetInnerHTML
      // ----------------------------------------------------------------------
      'no-restricted-properties': [
        'error',
        {
          property: 'dangerouslySetInnerHTML',
          message:
            'Arbitrary dangerouslySetInnerHTML is prohibited by AGENTS.md Rule 35. Content must be sanitized and explicitly approved.',
        },
      ],

      // ----------------------------------------------------------------------
      // AGENTS.md Rule 37 & 77: Circular Dependencies - Forbidden
      // ----------------------------------------------------------------------
      'import-x/no-cycle': ['error', { maxDepth: 10, ignoreExternal: true }],

      // ----------------------------------------------------------------------
      // AGENTS.md Rule 5, 6, 9, 38 & Atomic Design System: Boundary Enforcement
      // Strict downward flow: Templates -> Organisms -> Molecules -> Atoms -> Tokens
      // ----------------------------------------------------------------------
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: ['app'],
              allow: [
                'features',
                'components-templates',
                'components-organisms',
                'components-molecules',
                'components-atoms',
                'components-layouts',
                'components-ui',
                'components-shared',
                'lib-server',
                'lib-client',
                'lib-shared',
                'hooks',
                'providers',
                'config',
                'types',
                'styles',
              ],
            },
            {
              from: ['features'],
              allow: [
                ['features', { featureName: '${from.featureName}' }],
                'components-templates',
                'components-organisms',
                'components-molecules',
                'components-atoms',
                'components-layouts',
                'components-ui',
                'components-shared',
                'lib-client',
                'lib-shared',
                'lib-server',
                'hooks',
                'config',
                'types',
                'styles',
              ],
            },
            // --- Atomic Design System Strict Downward Hierarchy ---
            {
              from: ['components-atoms'],
              // Atoms can ONLY import other atoms, types, and styles/tokens.
              // FORBIDDEN: molecules, organisms, templates, layouts, features, app, lib, hooks
              allow: ['components-atoms', 'types', 'styles'],
            },
            {
              from: ['components-molecules'],
              // Molecules can ONLY import atoms, other molecules, types, and styles/tokens.
              // FORBIDDEN: organisms, templates, layouts, features, app, lib
              allow: ['components-atoms', 'components-molecules', 'types', 'styles'],
            },
            {
              from: ['components-organisms'],
              // Organisms can import molecules, atoms, other organisms, types, styles, and safe client utils.
              // FORBIDDEN: templates, features (domain logic), app, lib-server
              allow: [
                'components-molecules',
                'components-atoms',
                'components-organisms',
                'types',
                'styles',
                'lib-client',
                'lib-shared',
                'hooks',
                'config',
              ],
            },
            {
              from: ['components-templates'],
              // Templates orchestrate wireframes & slots; can import organisms, molecules, atoms, layouts.
              // FORBIDDEN: features, app, lib-server
              allow: [
                'components-organisms',
                'components-molecules',
                'components-atoms',
                'components-layouts',
                'types',
                'styles',
                'lib-client',
                'lib-shared',
                'hooks',
                'config',
              ],
            },
            {
              from: ['components-layouts'],
              allow: [
                'components-organisms',
                'components-molecules',
                'components-atoms',
                'types',
                'styles',
                'lib-client',
                'lib-shared',
                'hooks',
              ],
            },
            // Legacy / Compat shims for components/ui and components/shared
            {
              from: ['components-ui'],
              allow: ['components-atoms', 'components-molecules', 'types', 'styles'],
            },
            {
              from: ['components-shared'],
              allow: [
                'components-atoms',
                'components-molecules',
                'components-organisms',
                'types',
                'styles',
                'lib-client',
                'lib-shared',
                'hooks',
              ],
            },
            {
              from: ['lib-server'],
              allow: ['lib-shared', 'lib-server', 'types', 'config'],
            },
            {
              from: ['lib-client'],
              allow: ['lib-shared', 'types', 'config'],
            },
            {
              from: ['lib-shared'],
              allow: ['lib-shared', 'types', 'config'],
            },
            {
              from: ['hooks'],
              allow: ['types', 'config', 'lib-client', 'lib-shared'],
            },
            {
              from: ['providers'],
              allow: [
                'types',
                'config',
                'lib-client',
                'lib-shared',
                'hooks',
                'components-atoms',
                'components-molecules',
                'components-ui',
              ],
            },
            {
              from: ['config'],
              allow: ['types'],
            },
          ],
        },
      ],

      // ----------------------------------------------------------------------
      // AGENTS.md Rule 18: React Hooks Rules
      // ----------------------------------------------------------------------
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // ----------------------------------------------------------------------
      // AGENTS.md Rule 31 & 64: Accessibility (A11y)
      // ----------------------------------------------------------------------
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
    },
  },

  // 4. AGENTS.md Rule 12: Disallow process.env anywhere inside src/ except src/lib/env/**
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Direct access to process.env is forbidden by AGENTS.md Rule 12. Use validated environment variables from "@/lib/env/server" or "@/lib/env/client".',
        },
      ],
    },
  },

  // 5. Override: Allow process.env strictly inside src/lib/env/*
  {
    files: ['src/lib/env/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  // 6. AGENTS.md Rule 72 & Atomic Design: Enforce Design Tokens (Colors, Spacing, Radii, Shadows)
  {
    files: ['src/components/**/*.ts', 'src/components/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        // 6a. Ban raw Hex colors in component files
        {
          selector: "Literal[value=/^#([0-9a-fA-F]{3}){1,2}$/]",
          message:
            'Arbitrary hardcoded hex colors are forbidden in components by AGENTS.md Rule 72 & Atomic Design principles. Consume design tokens via hsl(var(--...)) or var(--color-...).',
        },
        // 6b. Ban raw RGB/HSL color functions without CSS variables
        {
          selector: "Literal[value=/^(rgb|rgba|hsl|hsla)\\((?!.*var\\(--)/]",
          message:
            'Raw color functions missing CSS variables are forbidden. Consume design tokens via hsl(var(--...)).',
        },
        // 6c. Ban literal CSS color names in color-related style properties
        {
          selector:
            "Property[key.name=/^(color|backgroundColor|borderColor|borderTopColor|borderRightColor|borderBottomColor|borderLeftColor|fill|stroke)$/] > Literal[value=/^(red|blue|green|yellow|purple|orange|pink|gray|grey)$/i]",
          message:
            'Literal color names are forbidden. Consume design tokens via hsl(var(--...)) or var(--text-muted).',
        },
        // 6d. Ban hardcoded dimensional spacing strings (px/rem) where design tokens should be used
        {
          selector:
            "Property[key.name=/^(padding|paddingTop|paddingRight|paddingBottom|paddingLeft|margin|marginTop|marginRight|marginBottom|marginLeft|gap|rowGap|columnGap)$/] > Literal[value=/^(?!(0|0px|100%|auto|inherit|initial|unset)$)\\d+.*$/][value!=/var\\(--space-/]",
          message:
            'Hardcoded spacing dimensions are forbidden. Consume design tokens like var(--space-1) through var(--space-16).',
        },
        // 6e. Ban hardcoded border radii strings where design tokens should be used
        {
          selector:
            "Property[key.name=/^(borderRadius|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)$/] > Literal[value=/^(?!(0|0px|50%|9999px|inherit|initial|unset)$)\\d+.*$/][value!=/var\\(--radius-/]",
          message:
            'Hardcoded border-radii are forbidden. Consume design tokens like var(--radius-sm), var(--radius-md), var(--radius-lg), var(--radius-xl), or var(--radius-full).',
        },
        // 6f. Ban hardcoded shadow strings missing design tokens
        {
          selector:
            "Property[key.name=/^(boxShadow|textShadow)$/] > Literal[value=/^(?!none|inherit|initial|unset).*$/][value!=/var\\(--shadow-/]",
          message:
            'Hardcoded box/text shadows are forbidden. Consume design tokens like var(--shadow-sm), var(--shadow-md), var(--shadow-lg), var(--shadow-xl), or var(--shadow-glow).',
        },
      ],
    },
  },

  // 7. Override: Relax specific rules for tests
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // 8. Prettier config to disable conflicting formatting rules
  prettierConfig,
];


// Flat config. `npm run lint` needs node_modules; the static checks in
// `npm run check` deliberately do not, so a bare checkout can still be
// verified.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'src/data/packs/**'],
  },
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    // The engine must stay pure. This mirrors tools/check-imports.mjs so the
    // rule is enforced in the editor as well as in CI.
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'expo*', '**/ui/**', '**/store/**'],
              message: 'src/engine must stay pure — no React, React Native or Expo imports.',
            },
          ],
        },
      ],
    },
  },
];

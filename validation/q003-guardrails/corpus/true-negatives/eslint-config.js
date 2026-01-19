// ESLint configuration - NOT secrets
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'max-len': ['error', { code: 120 }],
  },
  env: {
    node: true,
    es2021: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.test.ts'],
};

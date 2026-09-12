import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import next from '@next/eslint-plugin-next';
import hooks from 'eslint-plugin-react-hooks';
export default defineConfig([
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...ts.configs.recommended],
    plugins: { '@next/next': next, 'react-hooks': hooks },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      ...hooks.configs.recommended.rules,
      // Full-document links intentionally preserve native anchor behavior and per-page static CSP.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]);

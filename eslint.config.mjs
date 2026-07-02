import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// On étend les presets Next.js (core-web-vitals + typescript). Le typage strict
// est assuré par `tsc --noEmit` en CI ; ESLint se concentre ici sur les
// détecteurs de bugs à fort signal. Les règles trop bruyantes pour cette base
// (usage assumé de `any`, variables inutilisées) restent en `warn` pour ne pas
// bloquer le build tout en restant visibles.
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Toléré : la base utilise volontairement `any` sur les payloads bruts.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // Site francophone : les apostrophes (l'association, d'un…) sont partout.
      // Cette règle purement stylistique n'apporte aucune sécurité et casserait
      // le build sur du contenu FR légitime — on la laisse désactivée.
      'react/no-unescaped-entities': 'off',

      // Détecteurs de bugs — on les réactive (ils étaient tous désactivés).
      'no-debugger': 'error', // aucun `debugger` ne doit atteindre la prod
      'no-unreachable': 'warn',
      'no-redeclare': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'prefer-const': 'warn',
    },
  },
]

export default eslintConfig

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'jsx-a11y'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react-refresh/only-export-components': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    /*
      Accesibilidad: conjunto estrecho a propósito, no `plugin:jsx-a11y/recommended`.

      Recommended destapa cientos de avisos sobre este código, y el ruido hace
      que nadie mire ninguno — es exactamente lo que ya pasa con los errores de
      tsc. Aquí solo están las reglas que cubren lo que se acaba de arreglar,
      para que no vuelva. Ampliar la lista a medida que se saneen más cosas.
    */
    'jsx-a11y/alt-text': 'error',
    // La regla busca palabras inglesas por omisión, y aquí los alt se escriben
    // en español. Sin esto no caza nada.
    'jsx-a11y/img-redundant-alt': [
      'error',
      { words: ['imagen', 'foto', 'fotografía', 'logo', 'logotipo', 'icono', 'escudo'] },
    ],
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/label-has-associated-control': ['error', { assert: 'either' }],
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/heading-has-content': 'error',
  },
}

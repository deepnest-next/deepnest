module.exports = {
  plugins: ['solid'],
  extends: [
    'eslint:recommended',
    'plugin:solid/typescript',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  rules: {
    // suppress errors for missing 'import React' in files
   "react/react-in-jsx-scope": "off",
    // allow jsx syntax in js files (for next.js project)
   "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }], //should add ".ts" if typescript project
  },
}

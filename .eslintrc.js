module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    },
    project: "./tsconfig.json"
  },
  plugins: [
    "@typescript-eslint",
    "react"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  },
  ignorePatterns: [
    "supabase/functions/**/*",
    "oauth-server.js",
    "node_modules/**/*",
    "*.config.js",
    "metro.config.js",
    "babel.config.js",
    "__mocks__/**/*",
    "jest.setup.js"
  ]
};

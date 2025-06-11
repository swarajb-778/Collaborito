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
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-require-imports": "error",
    "react/no-unescaped-entities": "error",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-expressions": "error"
  },
  overrides: [
    {
      files: ["*.js"],
      parser: "espree",
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "script"
      },
      rules: {
        "@typescript-eslint/no-require-imports": "off"
      }
    }
  ],
  ignorePatterns: [
    "supabase/functions/**/*",
    "oauth-server.js",
    "node_modules/**/*",
    "*.config.js",
    "metro.config.js",
    "babel.config.js",
    "__mocks__/**/*",
    "jest.setup.js",
    "check-supabase-fix.js",
    "check-supabase-update.js",
    "project-setup.js",
    "scripts/**/*.js",
    "proxy-server/**/*.js",
    "polyfills/**/*.js",
    "src/__tests__/**/*.js"
  ]
};

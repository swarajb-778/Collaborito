module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
    "react-native/react-native": true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    },
    project: "./tsconfig.json"
  },
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "react-native"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    // TypeScript rules
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    
    // React rules
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/display-name": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    // React Native specific rules
    "react-native/no-unused-styles": "warn",
    "react-native/split-platform-components": "warn",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    
    // General rules
    "prefer-const": "warn",
    "no-console": "off", // Allow console in React Native
    "no-debugger": "warn"
  },
  ignorePatterns: [
    "supabase/functions/**/*",
    "oauth-server.js",
    "node_modules/**/*",
    "*.config.js",
    "metro.config.js",
    "babel.config.js",
    "__mocks__/**/*",
    "jest.setup.js",
    "dist/**/*",
    ".expo/**/*",
    "ios/**/*",
    "android/**/*"
  ]
};

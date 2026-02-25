import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".expo/**",
      "node_modules/**",
      "web-build/**",
      "app.config.js",
      "babel.config.js",
      "metro.config.js",
      "tailwind.config.js",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/__tests__/**/*.js", "**/*.test.js"],
    languageOptions: { globals: { it: "readonly", expect: "readonly", describe: "readonly" } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { __dirname: "readonly", module: "readonly", require: "readonly" },
    },
    settings: { react: { version: "19" } },
    rules: {
      ...react.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/react-in-jsx-scope": "off",
    },
  }
);

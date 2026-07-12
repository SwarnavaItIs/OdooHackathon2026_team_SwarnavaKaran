import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      /*
       * These effects initialize modal state and start data fetching when a
       * route or dialog becomes active. They intentionally synchronize local
       * UI state with props/network state.
       */
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/context/AuthContext.jsx"],
    rules: {
      /* The provider and its consumer hook form one public context module. */
      "react-refresh/only-export-components": "off",
    },
  },
]);

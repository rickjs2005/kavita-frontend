const globals = require("globals");
const tseslint = require("typescript-eslint");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const importPlugin = require("eslint-plugin-import");
const nextPlugin = require("@next/eslint-plugin-next");

module.exports = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "eslint.config.cjs",
    ],
  },

  // ✅ 1) presets primeiro
  ...tseslint.config(
    ...tseslint.configs.recommended,

    // ✅ 2) override depois (vence)
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      languageOptions: {
        globals: { ...globals.browser, ...globals.node },
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    }
  ),

  // React / Next / A11y / Imports
  {
    files: ["**/*.{tsx,jsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
      "@next/next": nextPlugin,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": { typescript: true },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...(nextPlugin.configs["core-web-vitals"]?.rules || {}),

      "react/prop-types": "off",

      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",

      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",

      "react/react-in-jsx-scope": "off",
    },
  },

  // TS/JS puros
  {
    files: ["**/*.{ts,js}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
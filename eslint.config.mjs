import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import noUnsanitized from "eslint-plugin-no-unsanitized";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import vue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

import { documentation } from "./eslint/documentation.mjs";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      ".sync-cache/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: [".vue"] },
    },
  },
  {
    plugins: {
      documentation,
      jsdoc,
      nounsanitized: noUnsanitized,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { jsdoc: { mode: "typescript" } },
    rules: {
      /* TypeScript already reports undefined names, including Vite's build-time constants. */
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "vue/no-v-html": "error",
      "vue/require-default-prop": "off",
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",

      "jsdoc/check-alignment": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-property-names": "error",
      "jsdoc/check-tag-names": "error",
      "jsdoc/empty-tags": "error",
      "jsdoc/no-blank-block-descriptions": "error",
      "jsdoc/no-blank-blocks": "error",
      "jsdoc/no-multi-asterisks": "error",
      "jsdoc/reject-any-type": "error",
      "jsdoc/require-description": "error",
      "jsdoc/require-hyphen-before-param-description": [
        "error",
        "always",
        { tags: { property: "always", returns: "never" } },
      ],
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: false,
          contexts: [
            "ClassDeclaration",
            "FunctionDeclaration",
            "MethodDefinition",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
          ],
        },
      ],
      "jsdoc/require-param": "error",
      "jsdoc/require-param-name": "error",
      "jsdoc/require-returns": ["error", { forceRequireReturn: true }],
      "jsdoc/require-returns-description": "error",
      "jsdoc/valid-types": "error",
      "no-inline-comments": "error",

      "documentation/blank-line-before-jsdoc": "error",
      "documentation/no-line-comments": "error",
      "documentation/require-declaration-properties": "error",
      "documentation/require-named-function-jsdoc": "error",

      "nounsanitized/method": "error",
      "nounsanitized/property": "error",

      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["music/src/**/*.{ts,vue}"],
    ignores: ["music/src/repositories/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/data/*", "**/data/*.json"],
              message: "Read published data through PlaylistRepository.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["shared/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "**/music/**", "**/sync/**"],
              message: "The shared domain cannot depend on an app.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "documentation/require-named-function-jsdoc": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name=/^(it|test|describe)$/][property.name=/^(only|skip)$/]",
          message:
            "Commit runnable tests; focused and skipped suites hide regressions.",
        },
      ],
    },
  },
  prettier,
);

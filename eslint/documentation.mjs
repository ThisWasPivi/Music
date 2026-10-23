/**
 * Repository-local rules for documentation style, shared with TravelMap.
 */
export const documentation = {
  rules: {
    "blank-line-before-jsdoc": {
      meta: {
        type: "layout",
        docs: {
          description: "Require a blank line before every JSDoc block.",
        },
        fixable: "whitespace",
        messages: {
          missingBlankLine: "Add a blank line before this JSDoc block.",
        },
        schema: [],
      },

      /**
       * Creates visitors that enforce the repository's JSDoc spacing.
       * @param {import("eslint").Rule.RuleContext} context - The ESLint rule context
       * @returns {import("eslint").Rule.RuleListener} The rule listeners
       */
      create(context) {
        const sourceCode = context.sourceCode;

        return {
          /**
           * Checks every JSDoc block once the complete program is available.
           * @returns {void}
           */
          "Program:exit"() {
            for (const comment of sourceCode.getAllComments()) {
              if (comment.type !== "Block" || !comment.value.startsWith("*")) {
                continue;
              }

              const previousToken = sourceCode.getTokenBefore(comment, {
                includeComments: true,
              });
              /*
               * In a Vue SFC the first token of <script> follows the tag
               * itself, where Prettier forbids a blank line.
               */
              if (
                !previousToken ||
                /^<script\b/.test(previousToken.value) ||
                ["{", "[", "("].includes(previousToken.value) ||
                comment.loc.start.line - previousToken.loc.end.line > 1
              ) {
                continue;
              }

              context.report({
                loc: comment.loc,
                messageId: "missingBlankLine",
                fix: (fixer) => fixer.insertTextBefore(comment, "\n"),
              });
            }
          },
        };
      },
    },
    "no-line-comments": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Forbid human-authored line comments, which the repository writes as own-line block comments.",
        },
        messages: {
          lineComment:
            "Write rationale as an own-line block comment, not a // comment.",
        },
        schema: [],
      },

      /**
       * Creates visitors that reject prose written as line comments.
       * @param {import("eslint").Rule.RuleContext} context - The ESLint rule context
       * @returns {import("eslint").Rule.RuleListener} The rule listeners
       */
      create(context) {
        const sourceCode = context.sourceCode;
        /*
         * Syntax that only exists as a line comment: TypeScript and ESLint
         * directives, triple-slash references, and Prettier's ignore marker.
         */
        const directive =
          /^\s*(?:@ts-(?:expect-error|ignore|nocheck)|eslint-(?:disable|enable)|eslint\s|globals?\s|prettier-ignore|\/\s*<reference)/;

        return {
          /**
           * Checks every line comment once the complete program is available.
           * @returns {void}
           */
          "Program:exit"() {
            for (const comment of sourceCode.getAllComments()) {
              if (comment.type !== "Line" || directive.test(comment.value))
                continue;

              context.report({ loc: comment.loc, messageId: "lineComment" });
            }
          },
        };
      },
    },
    "require-named-function-jsdoc": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Require JSDoc on named arrow and function expressions.",
        },
        messages: {
          missingJsdoc: "Add JSDoc for this named function.",
        },
        schema: [],
      },

      /**
       * Creates visitors that require documentation on named function values.
       * @param {import("eslint").Rule.RuleContext} context - The ESLint rule context
       * @returns {import("eslint").Rule.RuleListener} The rule listeners
       */
      create(context) {
        const sourceCode = context.sourceCode;

        return {
          /**
           * Checks function expressions assigned through a variable declaration.
           * @param {object} node - The variable declaration
           * @returns {void}
           */
          VariableDeclaration(node) {
            const hasNamedFunction = node.declarations.some(
              (declaration) =>
                declaration.id.type === "Identifier" &&
                (declaration.init?.type === "ArrowFunctionExpression" ||
                  declaration.init?.type === "FunctionExpression"),
            );
            if (!hasNamedFunction) return;

            const target =
              node.parent.type === "ExportNamedDeclaration"
                ? node.parent
                : node;
            const comments = sourceCode.getCommentsBefore(target);
            const jsdoc = comments.findLast(
              (comment) =>
                comment.type === "Block" && comment.value.startsWith("*"),
            );
            if (
              jsdoc &&
              /^\s*$/.test(
                sourceCode.text.slice(jsdoc.range[1], target.range[0]),
              )
            ) {
              return;
            }

            context.report({ node: target, messageId: "missingJsdoc" });
          },
        };
      },
    },
    "require-declaration-properties": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Require an @property tag for every interface, object type, and enum member.",
        },
        messages: {
          missingProperty:
            "Document '{{name}}' with an @property tag in the declaration JSDoc.",
        },
        schema: [],
      },

      /**
       * Creates visitors that verify declaration-member documentation.
       * @param {import("eslint").Rule.RuleContext} context - The ESLint rule context
       * @returns {import("eslint").Rule.RuleListener} The rule listeners
       */
      create(context) {
        const sourceCode = context.sourceCode;

        /**
         * Reports declaration members missing from the attached JSDoc.
         * @param {object} node - The interface, type alias, or enum declaration
         * @param {object[]} members - The declaration members to verify
         * @returns {void}
         */
        function checkDeclarationProperties(node, members) {
          const target =
            node.parent.type === "ExportNamedDeclaration" ? node.parent : node;
          const jsdoc = sourceCode
            .getCommentsBefore(target)
            .findLast(
              (comment) =>
                comment.type === "Block" && comment.value.startsWith("*"),
            );
          if (!jsdoc) return;

          const documentedProperties = new Set(
            jsdoc.value.split(/\r?\n/).flatMap((line) => {
              const match = line.match(
                /@property\b.*\s\[?([A-Za-z_$][\w$]*)\]?\s+-/,
              );
              return match ? [match[1]] : [];
            }),
          );

          for (const member of members) {
            const key = member.key ?? member.id;
            const name =
              key?.type === "Identifier" || key?.type === "Literal"
                ? String(key.name ?? key.value)
                : null;
            if (!name || documentedProperties.has(name)) continue;

            context.report({
              node: member,
              messageId: "missingProperty",
              data: { name },
            });
          }
        }

        return {
          /**
           * Verifies the fields declared by an interface.
           * @param {object} node - The interface declaration
           * @returns {void}
           */
          TSInterfaceDeclaration(node) {
            checkDeclarationProperties(node, node.body.body);
          },

          /**
           * Verifies the members declared by an object-shaped type alias.
           * @param {object} node - The type-alias declaration
           * @returns {void}
           */
          TSTypeAliasDeclaration(node) {
            if (node.typeAnnotation.type === "TSTypeLiteral") {
              checkDeclarationProperties(node, node.typeAnnotation.members);
            }
          },

          /**
           * Verifies the values declared by an enum.
           * @param {object} node - The enum declaration
           * @returns {void}
           */
          TSEnumDeclaration(node) {
            checkDeclarationProperties(node, node.body.members);
          },
        };
      },
    },
  },
};

/* eslint-disable @typescript-eslint/no-require-imports */
import type { PluginObj, NodePath, types as t } from '@babel/core';

type BabelTypes = typeof t;

type PluginOptions = {
  root?: string;
};

type PluginState = {
  filename?: string;
  cwd?: string;
  opts?: PluginOptions;
};

const isUpperCase = (name: string): boolean => /^[A-Z]/.test(name);

const isComponentWrappingCall = (
  node: t.CallExpression,
  types: BabelTypes,
): boolean => {
  if (types.isIdentifier(node.callee)) {
    return ['memo', 'forwardRef'].includes(node.callee.name);
  }

  if (
    types.isMemberExpression(node.callee) &&
    types.isIdentifier(node.callee.property)
  ) {
    return ['memo', 'forwardRef'].includes(node.callee.property.name);
  }

  return false;
};

const isComponentInit = (
  init: t.Expression | null | undefined,
  types: BabelTypes,
): boolean => {
  if (!init) return false;

  if (
    types.isArrowFunctionExpression(init) ||
    types.isFunctionExpression(init)
  ) {
    return true;
  }

  if (types.isCallExpression(init) && isComponentWrappingCall(init, types)) {
    return true;
  }

  return false;
};

type SourceInfo = {
  fileName: string;
  lineNumber: number;
};

const makeRelative = (root: string, filename: string): string => {
  const normalizedRoot = root.endsWith('/') ? root : root + '/';

  if (filename.startsWith(normalizedRoot)) {
    return filename.slice(normalizedRoot.length);
  }

  return filename;
};

const isNodeModules = (filename: string): boolean =>
  /[/\\]node_modules[/\\]/.test(filename);

const computeRelativePath = (state: PluginState): string | null => {
  const filename = state.filename;
  if (!filename) return null;
  if (isNodeModules(filename)) return null;

  const root = state.opts?.root ?? state.cwd ?? '';
  return makeRelative(root, filename);
};

export const babelPlugin = (babel: {
  types: BabelTypes;
}): PluginObj<PluginState> => {
  const { types } = babel;

  return {
    name: 'radar-source-file',
    visitor: {
      'VariableDeclaration|FunctionDeclaration'(
        path: NodePath<t.Node>,
        state: PluginState,
      ) {
        if (!path.parentPath?.isProgram()) return;

        const relativePath = computeRelativePath(state);
        if (!relativePath) return;

        const makeSourceFileAssignment = (name: string) =>
          types.expressionStatement(
            types.assignmentExpression(
              '=',
              types.memberExpression(
                types.identifier(name),
                types.identifier('__sourceFile'),
              ),
              types.stringLiteral(relativePath),
            ),
          );

        const makeSourceAssignment = (name: string, source: SourceInfo) =>
          types.expressionStatement(
            types.assignmentExpression(
              '=',
              types.memberExpression(
                types.identifier(name),
                types.identifier('__source'),
              ),
              types.objectExpression([
                types.objectProperty(
                  types.identifier('fileName'),
                  types.stringLiteral(source.fileName),
                ),
                types.objectProperty(
                  types.identifier('lineNumber'),
                  types.numericLiteral(source.lineNumber),
                ),
              ]),
            ),
          );

        const insertAssignments = (
          name: string,
          lineNumber: number,
          insertAfter: (node: t.Statement) => void,
        ) => {
          insertAfter(makeSourceFileAssignment(name));
          insertAfter(
            makeSourceAssignment(name, {
              fileName: relativePath,
              lineNumber,
            }),
          );
        };

        if (types.isFunctionDeclaration(path.node)) {
          const name = path.node.id?.name;
          if (!name || !isUpperCase(name)) return;

          const lineNumber = path.node.loc?.start.line ?? 0;
          insertAssignments(name, lineNumber, node =>
            path.insertAfter(node),
          );
          return;
        }

        if (types.isVariableDeclaration(path.node)) {
          const declarations = path.node.declarations;

          for (let i = declarations.length - 1; i >= 0; i--) {
            const declarator = declarations[i];
            if (!types.isIdentifier(declarator.id)) continue;

            const name = declarator.id.name;
            if (!isUpperCase(name)) continue;
            if (!isComponentInit(declarator.init, types)) continue;

            const lineNumber = declarator.loc?.start.line ?? 0;
            insertAssignments(name, lineNumber, node =>
              path.insertAfter(node),
            );
          }
        }
      },
    },
  };
};

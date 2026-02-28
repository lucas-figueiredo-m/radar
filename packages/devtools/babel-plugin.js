'use strict';

const isUpperCase = (name) => /^[A-Z]/.test(name);

const isComponentWrappingCall = (node, types) => {
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

const isComponentInit = (init, types) => {
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

const makeRelative = (root, filename) => {
  const normalizedRoot = root.endsWith('/') ? root : root + '/';

  if (filename.startsWith(normalizedRoot)) {
    return filename.slice(normalizedRoot.length);
  }

  return filename;
};

const isNodeModules = (filename) => /[/\\]node_modules[/\\]/.test(filename);

const computeRelativePath = (state) => {
  const filename = state.filename;
  if (!filename) return null;
  if (isNodeModules(filename)) return null;

  const root = (state.opts && state.opts.root) || state.cwd || '';
  return makeRelative(root, filename);
};

module.exports = (babel) => {
  const { types } = babel;

  return {
    name: 'radar-source-file',
    visitor: {
      Program(path, state) {
        const root = (state.opts && state.opts.root) || state.cwd || '';
        if (!root) return;

        const hasRadarImport = path.node.body.some(
          (node) =>
            types.isImportDeclaration(node) &&
            node.source.value === '@radar/devtools',
        );
        if (!hasRadarImport) return;

        const assignment = types.expressionStatement(
          types.assignmentExpression(
            '=',
            types.memberExpression(
              types.identifier('globalThis'),
              types.identifier('__RADAR_PROJECT_ROOT__'),
            ),
            types.stringLiteral(root),
          ),
        );

        path.unshiftContainer('body', assignment);
      },

      'VariableDeclaration|FunctionDeclaration'(path, state) {
        if (!path.parentPath || !path.parentPath.isProgram()) return;

        const relativePath = computeRelativePath(state);
        if (!relativePath) return;

        const makeSourceFileAssignment = (name) =>
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

        const makeSourceAssignment = (name, lineNumber) =>
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
                  types.stringLiteral(relativePath),
                ),
                types.objectProperty(
                  types.identifier('lineNumber'),
                  types.numericLiteral(lineNumber),
                ),
              ]),
            ),
          );

        const insertAssignments = (name, lineNumber, insertAfter) => {
          insertAfter(makeSourceFileAssignment(name));
          insertAfter(makeSourceAssignment(name, lineNumber));
        };

        if (types.isFunctionDeclaration(path.node)) {
          const name = path.node.id && path.node.id.name;
          if (!name || !isUpperCase(name)) return;

          const lineNumber = (path.node.loc && path.node.loc.start.line) || 0;
          insertAssignments(name, lineNumber, (node) =>
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

            const lineNumber =
              (declarator.loc && declarator.loc.start.line) || 0;
            insertAssignments(name, lineNumber, (node) =>
              path.insertAfter(node),
            );
          }
        }
      },
    },
  };
};

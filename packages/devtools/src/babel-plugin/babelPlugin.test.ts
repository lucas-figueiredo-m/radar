import { describe, it, expect } from 'vitest';
import { transformSync } from '@babel/core';
import { babelPlugin } from './index';

const transform = (code: string, filename = '/project/src/App.tsx') =>
  transformSync(code, {
    plugins: [[babelPlugin, { root: '/project' }]],
    filename,
    configFile: false,
    babelrc: false,
  })?.code ?? '';

describe('babelPlugin', () => {
  it('injects __sourceFile for arrow function components', () => {
    const input = `const MyComponent = () => null;`;
    const output = transform(input);
    expect(output).toContain('MyComponent.__sourceFile = "src/App.tsx"');
  });

  it('injects __sourceFile for function declarations', () => {
    const input = `function MyComponent() { return null; }`;
    const output = transform(input);
    expect(output).toContain('MyComponent.__sourceFile = "src/App.tsx"');
  });

  it('injects __sourceFile for memo-wrapped components', () => {
    const input = `const MyComponent = memo(() => null);`;
    const output = transform(input);
    expect(output).toContain('MyComponent.__sourceFile = "src/App.tsx"');
  });

  it('injects __sourceFile for forwardRef-wrapped components', () => {
    const input = `const MyComponent = forwardRef((props, ref) => null);`;
    const output = transform(input);
    expect(output).toContain('MyComponent.__sourceFile = "src/App.tsx"');
  });

  it('injects __sourceFile for React.memo member expression', () => {
    const input = `const MyComponent = React.memo(() => null);`;
    const output = transform(input);
    expect(output).toContain('MyComponent.__sourceFile = "src/App.tsx"');
  });

  it('injects __sourceFile for React.forwardRef member expression', () => {
    const input = `const MyComponent = React.forwardRef((props, ref) => null);`;
    const output = transform(input);
    expect(output).toContain('MyComponent.__sourceFile = "src/App.tsx"');
  });

  it('skips lowercase names', () => {
    const input = `const helper = () => {};`;
    const output = transform(input);
    expect(output).not.toContain('__sourceFile');
  });

  it('skips non-component variable declarations', () => {
    const input = `const Config = { key: 'value' };`;
    const output = transform(input);
    expect(output).not.toContain('__sourceFile');
  });

  it('skips nested function declarations', () => {
    const input = `function outer() { function Inner() {} }`;
    const output = transform(input);
    expect(output).not.toContain('Inner.__sourceFile');
  });

  it('uses cwd as fallback root', () => {
    const code = `const App = () => null;`;
    const result =
      transformSync(code, {
        plugins: [babelPlugin],
        filename: '/workspace/src/App.tsx',
        cwd: '/workspace',
        configFile: false,
        babelrc: false,
      })?.code ?? '';
    expect(result).toContain('App.__sourceFile = "src/App.tsx"');
  });

  it('handles multiple declarations in one file', () => {
    const input = [
      'const Header = () => null;',
      'const Footer = () => null;',
    ].join('\n');
    const output = transform(input);
    expect(output).toContain('Header.__sourceFile = "src/App.tsx"');
    expect(output).toContain('Footer.__sourceFile = "src/App.tsx"');
  });

  it('handles function expression in variable declaration', () => {
    const input = `const MyComponent = function() { return null; };`;
    const output = transform(input);
    expect(output).toContain('MyComponent.__sourceFile = "src/App.tsx"');
  });

  it('skips files inside node_modules', () => {
    const input = `const View = () => null;`;
    const output = transform(
      input,
      '/project/node_modules/react-native/View/View.js',
    );
    expect(output).not.toContain('__sourceFile');
  });
});

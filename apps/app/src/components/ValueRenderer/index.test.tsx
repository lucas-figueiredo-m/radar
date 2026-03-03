import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValueRenderer } from './index';

vi.mock('@radar/design-system', () => ({
  colorValues: new Proxy(
    {},
    {
      get: (_: unknown, prop: string | symbol) =>
        typeof prop === 'string' ? '#000000' : undefined,
    },
  ),
}));

describe('ValueRenderer', () => {
  describe('primitives', () => {
    it('renders null', () => {
      render(<ValueRenderer value={null} />);
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('renders undefined', () => {
      render(<ValueRenderer value={undefined} />);
      expect(screen.getByText('undefined')).toBeInTheDocument();
    });

    it('renders a number', () => {
      render(<ValueRenderer value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders zero', () => {
      render(<ValueRenderer value={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders boolean true', () => {
      render(<ValueRenderer value={true} />);
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('renders boolean false', () => {
      render(<ValueRenderer value={false} />);
      expect(screen.getByText('false')).toBeInTheDocument();
    });
  });

  describe('strings', () => {
    it('renders inline string without quotes', () => {
      render(<ValueRenderer value="hello world" inline={true} />);
      const el = screen.getByText('hello world');
      expect(el).toBeInTheDocument();
      expect(el.textContent).not.toContain('"');
    });

    it('renders non-inline string with quotes', () => {
      const { container } = render(
        <ValueRenderer value="hello" inline={false} />,
      );
      expect(container.textContent).toContain('"hello"');
    });
  });

  describe('objects', () => {
    it('renders collapsed object with key preview', () => {
      render(
        <ValueRenderer value={{ name: 'Alice', age: 30 }} inline={false} />,
      );
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('age')).toBeInTheDocument();
    });

    it('expands object on click to show all entries', () => {
      render(<ValueRenderer value={{ x: 1, y: 2 }} inline={false} />);
      // Click the collapsed preview (the arrow area)
      const toggle = screen.getByText('▶');
      fireEvent.click(toggle);

      // After expansion, should show keys and "▼" indicator
      expect(screen.getByText('▼ 2 keys')).toBeInTheDocument();
      expect(screen.getByText('x')).toBeInTheDocument();
      expect(screen.getByText('y')).toBeInTheDocument();
    });

    it('collapses expanded object on click', () => {
      render(<ValueRenderer value={{ x: 1, y: 2 }} inline={false} />);
      // Expand
      fireEvent.click(screen.getByText('▶'));
      expect(screen.getByText('▼ 2 keys')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('▼ 2 keys'));
      expect(screen.getByText('▶')).toBeInTheDocument();
    });

    it('shows overflow indicator for objects with more than 3 keys', () => {
      render(
        <ValueRenderer
          value={{ a: 1, b: 2, c: 3, d: 4, e: 5 }}
          inline={false}
        />,
      );
      expect(screen.getByText(', ...+2')).toBeInTheDocument();
    });
  });

  describe('arrays', () => {
    it('renders empty array as []', () => {
      render(<ValueRenderer value={[]} inline={false} />);
      expect(screen.getByText('[]')).toBeInTheDocument();
    });

    it('renders collapsed array with inline preview', () => {
      render(<ValueRenderer value={[1, 2, 3]} inline={false} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('expands array on click', () => {
      render(<ValueRenderer value={[10, 20]} inline={false} />);
      fireEvent.click(screen.getByText('▶'));
      expect(screen.getByText('▼ 2 items')).toBeInTheDocument();
    });

    it('shows overflow indicator for arrays with more than 3 items', () => {
      render(<ValueRenderer value={[1, 2, 3, 4, 5]} inline={false} />);
      expect(screen.getByText(', ...+2')).toBeInTheDocument();
    });

    it('renders single item array with correct count', () => {
      render(<ValueRenderer value={['only']} inline={false} />);
      fireEvent.click(screen.getByText('▶'));
      expect(screen.getByText('▼ 1 item')).toBeInTheDocument();
    });
  });

  describe('marker objects', () => {
    it('renders Circular marker with keys preview', () => {
      const circular = { __type: 'Circular', keys: ['name', 'children'] };
      const { container } = render(
        <ValueRenderer value={circular} inline={false} />,
      );
      expect(container.textContent).toContain('[Circular: {name, children}]');
    });

    it('renders Circular marker without keys', () => {
      const circular = { __type: 'Circular', keys: [] };
      const { container } = render(
        <ValueRenderer value={circular} inline={false} />,
      );
      expect(container.textContent).toBe('[Circular]');
    });

    it('renders ReactElement with expandable props', () => {
      const element = {
        __type: 'ReactElement',
        name: 'MyText',
        props: { children: 'Hello' },
        key: null,
        ref: null,
      };
      const { container } = render(
        <ValueRenderer value={element} inline={false} />,
      );
      // Should show the element tag in collapsed state
      expect(container.textContent).toContain('<MyText />');
      // Should show key and ref in collapsed preview
      expect(container.textContent).toContain('key');
      expect(container.textContent).toContain('ref');
      expect(container.textContent).toContain('props');
    });

    it('expands ReactElement to show props, key, ref on separate lines', () => {
      const element = {
        __type: 'ReactElement',
        name: 'MyText',
        props: { children: 'Hello' },
        key: null,
        ref: null,
      };
      render(<ValueRenderer value={element} inline={false} />);
      // Click the first ▶ (the ReactElementEntry toggle)
      fireEvent.click(screen.getAllByText('▶')[0]);
      // After expansion, should show ▼ indicator
      expect(screen.getByText('▼')).toBeInTheDocument();
      // Should show props, key, ref labels
      expect(screen.getByText('props')).toBeInTheDocument();
      expect(screen.getByText('key')).toBeInTheDocument();
      expect(screen.getByText('ref')).toBeInTheDocument();
    });
  });

  describe('error objects', () => {
    it('renders error message', () => {
      const errorObj = {
        __type: 'Error' as const,
        message: 'boom',
        stack: 'at foo (bar.js:1:1)',
      };
      render(<ValueRenderer value={errorObj} inline={false} />);
      expect(screen.getByText(/Error: boom/)).toBeInTheDocument();
    });

    it('renders expandable stack trace', () => {
      const errorObj = {
        __type: 'Error' as const,
        message: 'kaboom',
        stack: 'at myFunction (app.js:10:5)\nat otherFunc (lib.js:20:3)',
      };
      render(<ValueRenderer value={errorObj} inline={false} />);

      // Stack toggle should show frame count
      expect(
        screen.getByText(/Show stack trace \(2 frames\)/),
      ).toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText(/Show stack trace/));
      expect(screen.getByText('myFunction')).toBeInTheDocument();
      expect(screen.getByText('otherFunc')).toBeInTheDocument();
      expect(screen.getByText(/Hide stack trace/)).toBeInTheDocument();
    });

    it('renders error without stack trace', () => {
      const errorObj = {
        __type: 'Error' as const,
        message: 'no stack',
      };
      render(<ValueRenderer value={errorObj} inline={false} />);
      expect(screen.getByText(/Error: no stack/)).toBeInTheDocument();
      expect(screen.queryByText(/stack trace/)).not.toBeInTheDocument();
    });

    it('collapses stack trace on second click', () => {
      const errorObj = {
        __type: 'Error' as const,
        message: 'err',
        stack: 'at fn (file.js:1:1)',
      };
      render(<ValueRenderer value={errorObj} inline={false} />);
      fireEvent.click(screen.getByText(/Show stack trace/));
      expect(screen.getByText('fn')).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Hide stack trace/));
      expect(screen.queryByText('fn')).not.toBeInTheDocument();
    });
  });
});

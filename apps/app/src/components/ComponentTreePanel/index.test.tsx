import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ComponentTreeNode } from '@radar/types';
import type { ComponentTreeState } from '../../types';
import { ComponentTreePanel } from '.';

vi.mock('@radar/design-system', () => ({
  colorValues: new Proxy(
    {},
    {
      get: (_: unknown, prop: string | symbol) =>
        typeof prop === 'string' ? '#000000' : undefined,
    },
  ),
}));

vi.mock('lucide-react', () => ({
  Maximize2: (props: Record<string, unknown>) => (
    <span data-testid="maximize-icon" {...props} />
  ),
  Minimize2: (props: Record<string, unknown>) => (
    <span data-testid="minimize-icon" {...props} />
  ),
  ChevronRight: (props: Record<string, unknown>) => (
    <span data-testid="chevron-right-icon" {...props} />
  ),
  ChevronDown: (props: Record<string, unknown>) => (
    <span data-testid="chevron-down-icon" {...props} />
  ),
  ChevronUp: (props: Record<string, unknown>) => (
    <span data-testid="chevron-up-icon" {...props} />
  ),
  Search: (props: Record<string, unknown>) => (
    <span data-testid="search-icon" {...props} />
  ),
}));

vi.mock('../ComponentInspector', () => ({
  ComponentInspector: () => <div data-testid="component-inspector" />,
}));

const makeNode = (
  id: string,
  name: string,
  children: ComponentTreeNode[] = [],
): ComponentTreeNode => ({
  id,
  name,
  key: null,
  children,
});

const makeTree = (rootNodes: ComponentTreeNode[]): ComponentTreeState => ({
  rootNodes,
  timestamp: Date.now(),
  deviceId: 'device-1',
});

const defaultProps = () => ({
  tree: null as ComponentTreeState | null,
  connected: false,
  selectedComponentId: null,
  inspectedComponent: null,
  onInspectComponent: vi.fn(),
  onClearInspection: vi.fn(),
});

describe('ComponentTreePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders waiting message when tree is null and not connected', () => {
    render(<ComponentTreePanel {...defaultProps()} />);

    expect(
      screen.getByText(
        'Waiting for React Native app to connect on port 8347...',
      ),
    ).toBeInTheDocument();
  });

  it('renders waiting for render message when tree is null and connected', () => {
    render(<ComponentTreePanel {...defaultProps()} connected={true} />);

    expect(
      screen.getByText('No component tree yet. Waiting for React to render...'),
    ).toBeInTheDocument();
  });

  it('renders tree nodes with component names', () => {
    const tree = makeTree([
      makeNode('1', 'App', [makeNode('2', 'Header'), makeNode('3', 'Content')]),
    ]);

    render(<ComponentTreePanel {...defaultProps()} tree={tree} />);

    expect(screen.getByText('App')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows component count in toolbar', () => {
    const tree = makeTree([
      makeNode('1', 'App', [makeNode('2', 'Header'), makeNode('3', 'Footer')]),
    ]);

    render(<ComponentTreePanel {...defaultProps()} tree={tree} />);

    expect(screen.getByText('3 components')).toBeInTheDocument();
  });

  it('expand all button expands all nodes', () => {
    const tree = makeTree([
      makeNode('1', 'App', [
        makeNode('2', 'Wrapper', [makeNode('3', 'DeepChild')]),
      ]),
    ]);

    render(<ComponentTreePanel {...defaultProps()} tree={tree} />);

    // DeepChild might not be visible initially if DEFAULT_EXPAND_DEPTH limits it
    // Click expand all
    fireEvent.click(screen.getByTitle('Expand All'));

    expect(screen.getByText('DeepChild')).toBeInTheDocument();
  });

  it('collapse all button collapses all nodes', () => {
    const tree = makeTree([
      makeNode('1', 'App', [
        makeNode('2', 'Child', [makeNode('3', 'GrandChild')]),
      ]),
    ]);

    render(<ComponentTreePanel {...defaultProps()} tree={tree} />);

    // First expand all
    fireEvent.click(screen.getByTitle('Expand All'));
    expect(screen.getByText('GrandChild')).toBeInTheDocument();

    // Then collapse all
    fireEvent.click(screen.getByTitle('Collapse All'));

    // After collapsing, children should not be visible (only root stays)
    expect(screen.queryByText('GrandChild')).not.toBeInTheDocument();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('search filters and shows match count', () => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = vi.fn();

    const tree = makeTree([
      makeNode('1', 'App', [
        makeNode('2', 'Header'),
        makeNode('3', 'Footer'),
        makeNode('4', 'Sidebar'),
      ]),
    ]);

    render(<ComponentTreePanel {...defaultProps()} tree={tree} />);

    const searchInput = screen.getByPlaceholderText('Search components...');
    fireEvent.change(searchInput, { target: { value: 'Header' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('1/1')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('calls onInspectComponent when a node is clicked', () => {
    const onInspectComponent = vi.fn();
    const tree = makeTree([makeNode('1', 'App')]);

    render(
      <ComponentTreePanel
        {...defaultProps()}
        tree={tree}
        onInspectComponent={onInspectComponent}
      />,
    );

    fireEvent.click(screen.getByText('App'));
    expect(onInspectComponent).toHaveBeenCalledWith('1');
  });

  it('shows inspector when inspectedComponent is provided', () => {
    const tree = makeTree([makeNode('1', 'App')]);

    render(
      <ComponentTreePanel
        {...defaultProps()}
        tree={tree}
        inspectedComponent={{
          id: '1',
          name: 'App',
          props: [],
          hooks: [],
        }}
      />,
    );

    expect(screen.getByTestId('component-inspector')).toBeInTheDocument();
  });
});

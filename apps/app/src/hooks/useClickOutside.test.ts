import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  let container: HTMLDivElement;
  let outside: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    outside = document.createElement('div');
    document.body.appendChild(container);
    document.body.appendChild(outside);
  });

  it('calls callback when clicking outside the ref element', () => {
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useClickOutside<HTMLDivElement>(callback),
    );

    // Attach ref to the container element
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true,
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call callback when clicking inside the ref element', () => {
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useClickOutside<HTMLDivElement>(callback),
    );

    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true,
    });

    act(() => {
      container.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    const callback = vi.fn();
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useClickOutside<HTMLDivElement>(callback),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    removeSpy.mockRestore();
  });
});

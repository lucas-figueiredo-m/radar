import { useEffect } from 'react';
import type { RefObject } from 'react';

export const useResizeObserver = (
  ref: RefObject<HTMLElement | null>,
  callback: (entry: ResizeObserverEntry) => void,
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) callback(entry);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, callback]);
};

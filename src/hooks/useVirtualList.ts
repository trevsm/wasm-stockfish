import { useState, useEffect, useRef } from "react";

export interface VirtualItem<T> {
  item: T;
  index: number;
  offsetTop: number;
}

interface UseVirtualListOptions {
  itemHeight: number;
  gap: number;
  overscan?: number;
}

export function useVirtualList<T>(
  items: T[],
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseVirtualListOptions
): {
  visibleItems: VirtualItem<T>[];
  totalHeight: number;
  rowHeight: number;
} {
  const { itemHeight, gap, overscan = 5 } = options;
  const rowHeight = itemHeight + gap;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const rafRef = useRef<number | null>(null);
  const scrollTopRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      scrollTopRef.current = el.scrollTop;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(scrollTopRef.current);
        rafRef.current = null;
      });
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    el.addEventListener("scroll", handleScroll, { passive: true });
    ro.observe(el);
    setScrollTop(el.scrollTop);
    setContainerHeight(el.clientHeight);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  const visibleItems = (() => {
    const totalHeight = Math.max(0, items.length * rowHeight - (items.length > 0 ? gap : 0));
    if (containerHeight <= 0 || items.length === 0) {
      return { visible: [] as VirtualItem<T>[], totalHeight };
    }

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - overscan
    );
    const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    const visible: VirtualItem<T>[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      visible.push({
        item: items[i],
        index: i,
        offsetTop: i * rowHeight,
      });
    }

    return { visible, totalHeight };
  })();

  return {
    visibleItems: visibleItems.visible,
    totalHeight: visibleItems.totalHeight,
    rowHeight,
  };
}

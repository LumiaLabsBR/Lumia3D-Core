// useVirtualGrid — windowed rendering for large item lists.
// Computes which rows are in view based on scrollTop + viewport height.
// Returns row range, total height, and per-row offset so the consumer
// can render only the visible slice.
//
// Usage:
//   const { containerProps, contentProps, items } = useVirtualGrid({
//     count, rowHeight, columns, overscan: 4,
//   });

import { useEffect, useRef, useState, useMemo } from 'react';

export function useVirtualGrid({ count, rowHeight, columns = 1, overscan = 3 }) {
  const ref = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(800);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    setViewportH(el.clientHeight);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  const rows = Math.ceil(count / columns);
  const totalHeight = rows * rowHeight;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(rows, Math.ceil((scrollTop + viewportH) / rowHeight) + overscan);
  const offsetY = startRow * rowHeight;

  const visible = useMemo(() => {
    const list = [];
    for (let r = startRow; r < endRow; r++) {
      for (let c = 0; c < columns; c++) {
        const i = r * columns + c;
        if (i < count) list.push({ index: i, row: r, col: c });
      }
    }
    return list;
  }, [startRow, endRow, columns, count]);

  return {
    containerRef: ref,
    totalHeight,
    offsetY,
    visible,
    startRow,
    endRow,
  };
}

// useVirtualList — single-column variant, simpler API.
export function useVirtualList({ count, rowHeight, overscan = 6 }) {
  return useVirtualGrid({ count, rowHeight, columns: 1, overscan });
}

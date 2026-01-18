import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout';
import type { GridItemMeta, WidgetRegistry } from '../../types';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGrid = WidthProvider(Responsive);

interface WidgetGridProps {
  className?: string;
  items: GridItemMeta[];       // layout + meta per item
  registry: WidgetRegistry;    // tilgjengelige widgets
  persistKey?: string;         // valgfritt: lagre layout i localStorage
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ className = '', items, registry, persistKey }) => {
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState<GridItemMeta[]>(items);

  // load persisted layout
  useEffect(() => {
    setMounted(true);
    if (persistKey) {
      const raw = localStorage.getItem(`grid:${persistKey}`);
      if (raw) {
        try {
          const parsed: GridItemMeta[] = JSON.parse(raw);
          setLayout(parsed);
        } catch {
          // Invalid JSON in localStorage - ignore and use default layout
        }
      }
    }
  }, [persistKey]);

  // save layout
  useEffect(() => {
    if (persistKey) {
      localStorage.setItem(`grid:${persistKey}`, JSON.stringify(layout));
    }
  }, [layout, persistKey]);

  // kompakt opp til venstre
  const compactLayout = useCallback((current: GridItemMeta[]) => {
    const sorted = [...current].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
    return sorted.map((item) => {
      let bestX = 0, bestY = 0, found = false;
      for (let y = 0; y <= 20 && !found; y++) {
        for (let x = 0; x <= 12 - item.w && !found; x++) {
          const collides = sorted
            .filter((o) => o.i !== item.i)
            .some((o) => x < o.x + o.w && x + item.w > o.x && y < o.y + o.h && y + item.h > o.y);
          if (!collides) { bestX = x; bestY = y; found = true; }
        }
      }
      return { ...item, x: bestX, y: bestY };
    });
  }, []);

  const onLayoutChange = useCallback((l: Layout[]) => {
    // flett posisjoner inn i vår meta
    setLayout((prev) => {
      const next = prev.map((it) => {
        const fromRgl = l.find((x) => x.i === it.i);
        return fromRgl ? { ...it, ...fromRgl } : it;
      });
      return compactLayout(next);
    });
  }, [compactLayout]);

  const visible = useMemo(() => layout, [layout]);

  return (
    <div className={`widget-grid-container ${className}`}>
      <ResponsiveGrid
        className="layout"
        layouts={{ lg: visible }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[8, 8]}
        containerPadding={[16, 16]}
        isDraggable
        isResizable
        measureBeforeMount={false}
        useCSSTransforms={mounted}
        compactType={null}
        preventCollision={false}
        resizeHandles={['se']}
        autoSize
        verticalCompact={false}
        isBounded
        maxRows={200}
        draggableHandle=".widget-drag-handle"
        onLayoutChange={(cur) => onLayoutChange(cur)}
      >
        {visible.map((it) => {
          const Cmp = registry[it.widget];
          if (!Cmp) return <div key={it.i} className="ws-card" />;
          return (
            <div key={it.i} className="widget-item">
              <Cmp
                id={it.i}
                title={it.title}
                onClose={() => setLayout((prev) => prev.filter((w) => w.i !== it.i))}
                titleIcon={it.icon}
              />
            </div>
          );
        })}
      </ResponsiveGrid>
    </div>
  );
};

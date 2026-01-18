// src/components/WidgetBase/WidgetHeader.tsx
import React from 'react';
import type { IconProps, IconComp } from '../../types';

export function WidgetHeader({
  title,
  onClose,
  showClose = true,
  TitleIcon,
}: {
  title: string;
  onClose?: () => void;
  showClose?: boolean;
  // Tillat både komponent (Users) og element (<Users />)
  TitleIcon?: IconComp | React.ReactElement<IconProps> | null;
}) {
  function renderIcon(icon?: IconComp | React.ReactElement<IconProps> | null) {
    if (!icon) return null;

    // Ferdig element (<Users />)
    if (React.isValidElement<IconProps>(icon)) {
      const prev = icon.props?.className ?? '';
      return React.cloneElement<IconProps>(icon, {
        size: 16,
        className: `ws-grip ${prev}`.trim(),
      });
    }

    // Komponent (Users) eller forwardRef-objekt fra lucide-react
    const maybe = icon as object;
    const isRenderableComponent =
      typeof icon === 'function' ||
      (typeof maybe === 'object' && maybe !== null && '$$typeof' in maybe);

    if (isRenderableComponent) {
      const Comp = icon as IconComp;
      return <Comp size={16} className="ws-grip" />;
    }

    // Hvis noen har sendt inn noe rart (et plain object), hopp over
    return null;
  }

  return (
    <div className="ws-card-header">
      <div className="flex items-center gap-2 flex-1 widget-drag-handle select-none">
        {renderIcon(TitleIcon)}
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ws-text)' }}>
          {title}
        </h3>
      </div>

      {showClose && onClose && (
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-black/5"
          aria-label="Close widget"
          title="Close"
          style={{ color: 'var(--ws-text-muted)' }}
        >
          ×
        </button>
      )}
    </div>
  );
}

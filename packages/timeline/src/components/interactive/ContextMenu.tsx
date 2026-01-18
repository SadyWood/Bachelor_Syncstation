// packages/timeline/src/components/interactive/ContextMenu.tsx
import React from 'react';
import ReactDOM from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  color?: string;
  onClick: () => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose?: () => void;
}

/**
 * Reusable context menu component
 * - Renders via React portal
 * - Provides menu options with icons and keyboard shortcuts
 * - Handles menu positioning and styling
 *
 * @example
 * <ContextMenu
 *   x={100}
 *   y={200}
 *   items={[
 *     { label: 'Rename', onClick: () => console.log('Rename') },
 *     { label: 'Delete', color: '#dc2626', onClick: () => console.log('Delete') },
 *   ]}
 *   onClose={() => setMenu(null)}
 * />
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => ReactDOM.createPortal(
  <div
    className="timeline-context-menu"
    style={{
      position: 'fixed',
      left: x,
      top: y,
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 9999,
      minWidth: '150px',
    }}
    onClick={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
  >
    {items.map((item) => (
      <button
        key={item.label}
        onClick={() => {
          item.onClick();
          onClose?.();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '13px',
          color: item.color || 'inherit',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = item.color ? '#fef2f2' : '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {item.icon && <span>{item.icon}</span>}
          {item.label}
        </span>
        {item.shortcut && (
          <span
            style={{
              fontSize: '11px',
              opacity: 0.6,
              marginLeft: '12px',
            }}
          >
            {item.shortcut}
          </span>
        )}
      </button>
    ))}
  </div>,
  document.body,
);

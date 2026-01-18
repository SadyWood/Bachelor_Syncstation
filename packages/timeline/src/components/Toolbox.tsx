import { MousePointer2, Scissors, Hand, Magnet } from 'lucide-react';
import React from 'react';
import type { ToolType } from '../core/models';
import './Toolbox.css';

/**
 * Gets CSS class for snap button based on state
 */
function getSnapButtonClass(
  temporarySnapOverride: boolean | null,
  snapEnabled: boolean,
): string {
  if (temporarySnapOverride !== null) {
    return temporarySnapOverride ? 'active temporary' : 'temporary';
  }
  return snapEnabled ? 'active' : '';
}

export interface ToolboxProps {
  selectedTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  temporaryTool?: ToolType; // Show this tool as temporarily active (e.g., middle-click pan)
  snapEnabled?: boolean; // Whether snapping is enabled
  temporarySnapOverride?: boolean | null; // Temporary snap override (null = no override)
  onSnapToggle?: (enabled: boolean) => void; // Callback when snap is toggled
}

export function Toolbox({
  selectedTool,
  onToolChange,
  temporaryTool,
  snapEnabled = false,
  temporarySnapOverride = null,
  onSnapToggle,
}: ToolboxProps) {
  const tools = [
    {
      id: 'select' as ToolType,
      icon: MousePointer2,
      label: 'Select',
      description: 'Select and move items',
    },
    {
      id: 'splice' as ToolType,
      icon: Scissors,
      label: 'Splice',
      description: 'Split items into two',
    },
    {
      id: 'pan' as ToolType,
      icon: Hand,
      label: 'Pan',
      description: 'Pan around the timeline',
    },
  ];

  return (
    <div className="toolbox">
      <div className="toolbox-header">
        <span className="toolbox-title">Tools</span>
      </div>
      <div className="toolbox-tools">
        {tools.map((tool) => {
          const Icon = tool.icon;
          // If there's a temporary tool active, show that as selected instead
          const isSelected = temporaryTool ? temporaryTool === tool.id : selectedTool === tool.id;

          return (
            <button
              key={tool.id}
              className={`toolbox-tool ${isSelected ? 'selected' : ''}`}
              onClick={() => onToolChange(tool.id)}
              title={`${tool.label} - ${tool.description}`}
              aria-label={tool.label}
              aria-pressed={isSelected}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="toolbox-tool-label">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Snap/Magnet toggle - separate section */}
      {onSnapToggle && (
        <div className="toolbox-options">
          <button
            className={`toolbox-option ${getSnapButtonClass(temporarySnapOverride, snapEnabled)}`}
            onClick={() => onSnapToggle(!snapEnabled)}
            title={
              temporarySnapOverride !== null
                ? `Snap temporarily ${temporarySnapOverride ? 'enabled' : 'disabled'} (ALT key)`
                : 'Snap to markers, playhead, and other items'
            }
            aria-label="Snap to items"
            aria-pressed={temporarySnapOverride !== null ? temporarySnapOverride : snapEnabled}
          >
            <Magnet size={18} strokeWidth={1.5} />
            <span className="toolbox-option-label">
              Snap{temporarySnapOverride !== null ? ' (ALT)' : ''}
            </span>
          </button>
        </div>
      )}

      {/* Keyboard shortcut hints */}
      <div className="toolbox-hints">
        <div className="toolbox-hint">
          <kbd>V</kbd> Select
        </div>
        <div className="toolbox-hint">
          <kbd>C</kbd> Splice
        </div>
        <div className="toolbox-hint">
          <kbd>H</kbd> Pan
        </div>
        {onSnapToggle && (
          <div className="toolbox-hint">
            <kbd>S</kbd> Snap
          </div>
        )}
      </div>
    </div>
  );
}

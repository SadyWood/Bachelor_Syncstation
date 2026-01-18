import React from 'react';
import { WidgetHeader } from './WidgetHeader';
import type { WidgetProps } from './WidgetTypes';
import type { ComponentType } from 'react';

interface BaseWidgetProps extends Omit<WidgetProps, 'id'> {
  children: React.ReactNode;
  showHeader?: boolean;
  showClose?: boolean;
  onClose?: () => void;
  className?: string;
  /** Ikonet som vises ved tittelen */
  titleIcon?: ComponentType<{ size?: number; className?: string }>;
}

export const BaseWidget: React.FC<BaseWidgetProps> = ({
  title,
  children,
  className = '',
  showHeader = true,
  showClose = true,
  onClose,
  titleIcon,
}) => (
  <div className={['ws-card h-full flex flex-col', className].join(' ')}>
    {showHeader && (
      <WidgetHeader title={title} onClose={onClose} showClose={showClose} TitleIcon={titleIcon} />
    )}
    <div className="flex-1 overflow-hidden">{children}</div>
  </div>
);

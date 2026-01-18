// src/types/components.ts

/**
 * UI component props - shared across all UI components
 */

// Button types
export type Appearance = 'solid' | 'outline' | 'soft';
export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type Size = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: Appearance;
  tone?: Tone;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

// Modal types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export type ModalAction = {
  label: string;
  tone?: 'default' | 'danger' | 'success' | 'info';
  appearance?: 'solid' | 'outline' | 'soft';
  disabled?: boolean;
  onClick?: () => void;
};

export type ModalProps = {
  open: boolean;
  title?: string;
  children?: React.ReactNode;
  actions?: ModalAction[];
  onClose?: () => void;
  size?: ModalSize;
};

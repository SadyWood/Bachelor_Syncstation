import { useAuth } from '../state/AuthContext';
import type React from 'react';

/**
 * Enkel gate-komponent for widgets/controls som krever en permission.
 * Brukes slik:
 *   <PermGate perm="content.edit">
 *     <Button>Edit</Button>
 *   </PermGate>
 */
export const PermGate: React.FC<{
  perm: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ perm, fallback = null, children }) => {
  const { can, accessLoaded } = useAuth();
  if (!accessLoaded) return null;
  return can(perm) ? children : fallback;
};

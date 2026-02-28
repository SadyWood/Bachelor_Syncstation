// src/components/Layout/PageShell.tsx
import React, { type PropsWithChildren } from 'react';

export default function PageShell({ children }: PropsWithChildren) {
  return (
    // Innholdskolonnen får egen vertikal scroll. SideNav er allerede fixed.
    <div className="flex-1 ml-16 overflow-y-auto custom-scrollbar">{children}</div>
  );
}

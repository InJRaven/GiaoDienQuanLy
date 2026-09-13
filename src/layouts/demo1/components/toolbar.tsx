import React, { ReactNode } from 'react';

export function Toolbar({ children }: { children?: ReactNode }) {
  return <div className="flex items-center justify-between py-3 px-6">{children}</div>;
}

export function ToolbarHeading({ children }: { children?: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function ToolbarActions({ children }: { children?: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

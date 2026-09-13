import React, { ReactNode } from 'react';

export function Breadcrumb({ children }: { children?: ReactNode }) {
  return <div className="flex items-center gap-1 text-xs text-muted-foreground">{children}</div>;
}

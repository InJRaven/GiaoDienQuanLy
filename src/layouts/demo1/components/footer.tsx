import React from 'react';

export function Footer() {
  return (
    <footer className="footer border-t border-border py-4 px-6 text-xs text-muted-foreground">
      &copy; {new Date().getFullYear()} Metronic. All rights reserved.
    </footer>
  );
}

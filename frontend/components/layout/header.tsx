import React from 'react';
import { Navbar } from './navbar';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center">
        <Navbar />
      </div>
    </header>
  );
}

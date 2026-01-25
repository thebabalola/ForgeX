'use client';

import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-6 md:gap-10">
        <Logo />
        <nav className="hidden gap-6 md:flex">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/create"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Create Vault
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for Wallet Connect Button */}
        <Button variant="outline" disabled>Connect Wallet</Button>
      </div>
    </div>
  );
}

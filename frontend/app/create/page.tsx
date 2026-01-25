'use client';

import React, { useState } from 'react';
import { useVaultFactory } from '@/hooks/useVaultFactory';
import { Button } from '@/components/ui/button';

export default function CreateVaultPage() {
  const { createVault } = useVaultFactory();
  const [asset, setAsset] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createVault(asset as `0x${string}`, name, symbol);
      alert('Vault creation transaction submitted!');
    } catch (error) {
      console.error(error);
      alert('Failed to create vault.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Vault</h1>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border p-6 bg-card shadow-sm">
        <div className="space-y-2">
          <label htmlFor="asset" className="text-sm font-medium leading-none">
            Asset Address (ERC-20)
          </label>
          <input
            id="asset"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="0x..."
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Vault Name
            </label>
            <input
              id="name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="My ForgeX Vault"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="symbol" className="text-sm font-medium leading-none">
              Symbol
            </label>
            <input
              id="symbol"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="fX-VAULT"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Deploy Vault'}
        </Button>
      </form>
    </div>
  );
}

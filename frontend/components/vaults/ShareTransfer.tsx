'use client';

import React, { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { parseUnits } from 'viem';
import ERC20ABI from '@/lib/abi/ERC20.json';

interface ShareTransferProps {
  vaultAddress: `0x${string}`;
}

export function ShareTransfer({ vaultAddress }: ShareTransferProps) {
  const { writeContractAsync } = useWriteContract();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    setIsLoading(true);
    try {
      await writeContractAsync({
        address: vaultAddress,
        abi: ERC20ABI,
        functionName: 'transfer',
        args: [recipient, parseUnits(amount, 18)],
      });
      alert('Transfer submitted!');
    } catch (error) {
      console.error(error);
      alert('Transfer failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-6 bg-card space-y-4 shadow-sm">
      <h3 className="text-lg font-bold">Transfer Shares</h3>
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Recipient Address</label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Share Amount</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button onClick={handleTransfer} disabled={isLoading} variant="outline" className="w-full">
          {isLoading ? 'Transferring...' : 'Transfer Shares'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import { formatUnits } from 'viem';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Transaction {
  id: string;
  hash: string;
  type: 'deposit' | 'withdraw' | 'mint' | 'redeem' | 'transfer';
  status: 'pending' | 'success' | 'failed';
  amount: bigint;
  timestamp: number;
  from: string;
  to?: string;
  blockNumber?: number;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  isLoading?: boolean;
  decimals?: number;
}

export function TransactionHistory({
  transactions = [],
  isLoading = false,
  decimals = 18,
}: TransactionHistoryProps) {
  // Sort transactions by timestamp (newest first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'withdraw':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'mint':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'redeem':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'transfer':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'failed':
        return '✕';
      case 'pending':
        return '⧗';
      default:
        return '−';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '−';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '−';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>No transactions yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-muted-foreground">
              Your vault transactions will appear here
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm">
                    {formatDate(tx.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(tx.type)}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className={getStatusColor(tx.status)}>
                        {getStatusIcon(tx.status)}
                      </span>
                      <span className="text-sm capitalize">{tx.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatUnits(tx.amount, decimals)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatAddress(tx.from)}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-mono"
                    >
                      {formatAddress(tx.hash)}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionHistory;

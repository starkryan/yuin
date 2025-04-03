'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowDown, ArrowUp, CreditCard, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, formatDate } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'REFUND';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string;
  reference: string | null;
  activationId: string | null;
  createdAt: string;
}

interface Activation {
  id: string;
  activationId: string;
  phone: string;
  operator: string;
  product: string;
  country: string;
  price: number;
  status: string;
  createdAt: string;
}

function AccountPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingActivations, setIsLoadingActivations] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchUserProfile();
      fetchTransactions();
      fetchActivations();
    }
  }, [isUserLoaded, user]);

  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch('/api/user/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      setUserProfile(data.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load account details');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const response = await fetch('/api/user/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const fetchActivations = async () => {
    setIsLoadingActivations(true);
    try {
      const response = await fetch('/api/user/activations');
      if (!response.ok) {
        throw new Error('Failed to fetch activations');
      }
      const data = await response.json();
      setActivations(data.data);
    } catch (error) {
      console.error('Error fetching activations:', error);
      toast.error('Failed to load activation history');
    } finally {
      setIsLoadingActivations(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessingDeposit(true);
    try {
      const response = await fetch('/api/user/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(depositAmount),
          description: 'Manual account deposit',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process deposit');
      }

      const data = await response.json();
      toast.success(`Successfully added ${formatPrice(Number(depositAmount))} to your balance`);
      setDepositAmount('');
      fetchUserProfile();
      fetchTransactions();
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast.error('Failed to process your deposit. Please try again.');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDown className="w-4 h-4 text-green-500" />;
      case 'WITHDRAWAL':
        return <ArrowUp className="w-4 h-4 text-red-500" />;
      case 'PURCHASE':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'REFUND':
        return <RotateCw className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (!isUserLoaded) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading your account...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="mb-4">You need to be signed in to view this page.</p>
          <Button asChild>
            <a href="/sign-in">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Overview */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Manage your account and balance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Welcome, {user.fullName || user.username || 'User'}</h3>
                    <p className="text-sm text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Balance</h3>
                    <p className="text-3xl font-bold">{formatPrice(userProfile?.balance || 0)}</p>
                  </div>

                  <form onSubmit={handleDeposit} className="space-y-3">
                    <Label htmlFor="depositAmount">Add Funds</Label>
                    <div className="flex gap-2">
                      <Input
                        id="depositAmount"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        disabled={isProcessingDeposit}
                      />
                      <Button type="submit" disabled={isProcessingDeposit}>
                        {isProcessingDeposit ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing
                          </>
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transaction History & Activations */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>View your transaction and activation history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="transactions">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="activations">Number History</TabsTrigger>
              </TabsList>
              <TabsContent value="transactions" className="space-y-4 pt-4">
                {isLoadingTransactions ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2">Loading transactions...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-6">
                    <p>No transactions found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-muted rounded-full mr-3">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.createdAt)} | {transaction.status}
                            </p>
                          </div>
                        </div>
                        <p className={`font-medium ${transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? '+' : '-'}
                          {formatPrice(transaction.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="activations" className="space-y-4 pt-4">
                {isLoadingActivations ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2">Loading activation history...</span>
                  </div>
                ) : activations.length === 0 ? (
                  <div className="text-center py-6">
                    <p>No activations found.</p>
                    <Button asChild className="mt-4">
                      <a href="/numbers">Purchase a Number</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activations.map((activation) => (
                      <div
                        key={activation.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{activation.phone}</p>
                          <p className="text-sm">{activation.product} | {activation.country}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(activation.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(activation.price)}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            activation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            activation.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                            activation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activation.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AccountPage; 
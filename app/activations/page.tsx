'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatPhoneNumber, getStatusColor, formatPrice } from '@/lib/utils';
import { Activation, getActivation } from '@/lib/api';
import { Input } from '@/components/ui/input';

// Function to fetch all activations - in a real app, you'd have an endpoint for this
// For now, we'll fetch activation IDs from localStorage as a temporary solution
const fetchActivationIds = (): number[] => {
  if (typeof window !== 'undefined') {
    try {
      const activationIdsStr = localStorage.getItem('activationIds');
      if (activationIdsStr) {
        return JSON.parse(activationIdsStr);
      }
    } catch (error) {
      console.error('Error parsing activationIds from localStorage:', error);
    }
  }
  return [];
};

// Function to save an activation ID to localStorage
export const saveActivationId = (id: number) => {
  if (typeof window !== 'undefined') {
    try {
      const existingIds = fetchActivationIds();
      if (!existingIds.includes(id)) {
        const updatedIds = [id, ...existingIds];
        localStorage.setItem('activationIds', JSON.stringify(updatedIds));
      }
    } catch (error) {
      console.error('Error saving activationId to localStorage:', error);
    }
  }
};

// Function to remove an activation ID from localStorage
export const removeActivationId = (id: number) => {
  if (typeof window !== 'undefined') {
    try {
      const existingIds = fetchActivationIds();
      const updatedIds = existingIds.filter(existingId => existingId !== id);
      localStorage.setItem('activationIds', JSON.stringify(updatedIds));
    } catch (error) {
      console.error('Error removing activationId from localStorage:', error);
    }
  }
};

// Utility function to remove country code from phone number
const getPhoneWithoutCountryCode = (phone: string): string => {
  // Remove the plus sign and any country code (assuming country codes are 1-3 digits)
  return phone.replace(/^\+\d{1,3}/, '');
};

function ActivationsPage() {
  const [activations, setActivations] = useState<Activation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch activations from the backend
    const fetchActivations = async () => {
      setIsLoading(true);
      try {
        // Get activation IDs from localStorage
        const activationIds = fetchActivationIds();
        
        if (activationIds.length === 0) {
          setActivations([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch each activation by ID
        const fetchedActivations: Activation[] = [];
        
        for (const id of activationIds) {
          try {
            const activation = await getActivation(id);
            fetchedActivations.push(activation);
          } catch (error) {
            console.error(`Error fetching activation ${id}:`, error);
            
            // If permission error, remove from localStorage
            if (error instanceof Error && 
                (error.message.includes('permission') || 
                 error.message.includes('not found'))) {
              console.log(`Removing activation ID ${id} from localStorage due to permission error`);
              removeActivationId(id);
            }
          }
        }
        
        setActivations(fetchedActivations);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching activations:', error);
        toast.error('Failed to load some activations. Please try again.');
        setIsLoading(false);
      }
    };

    fetchActivations();
  }, []);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Activations</h1>
        <Button asChild>
          <Link href="/numbers">Buy New Number</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading activations...</span>
        </div>
      ) : activations.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2">No activations found</h3>
          <p className="text-muted-foreground mb-6">You haven't purchased any phone numbers yet.</p>
          <Button asChild>
            <Link href="/numbers">Buy Your First Number</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activations.map((activation) => {
            const statusColor = getStatusColor(activation.status);
            return (
              <div key={activation.id} className="relative group">
                <Link href={`/activations/${activation.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            ID: {activation.id}
                          </CardTitle>
                          <p className="text-muted-foreground text-xs">
                            {activation.product} ({activation.country})
                          </p>
                        </div>
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                          {activation.status}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Phone Number Input with Copy Buttons */}
                      <div className="mb-3">
                        <div className="flex rounded-md overflow-hidden">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-r-none border-r-0 px-2 h-8"
                            onClick={(e) => copyToClipboard(activation.phone, e)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Input
                            value={getPhoneWithoutCountryCode(activation.phone)}
                            readOnly
                            className="rounded-none h-8 focus-visible:ring-0 text-center font-medium text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-l-none border-l-0 px-2 h-8"
                            onClick={(e) => copyToClipboard(getPhoneWithoutCountryCode(activation.phone), e)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{formatDate(activation.created_at, 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Price</p>
                          <p className="font-medium">{formatPrice(activation.price)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">SMS</p>
                          <p className="font-medium">{activation.sms?.length || 0} received</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Changed to directly export the component without the auth wrapper
// since we're removing authentication requirements
export default ActivationsPage; 
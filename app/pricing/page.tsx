'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import CountrySelector from '@/components/CountrySelector';
import { getProducts } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/context/AppContext';

interface PricingProduct {
  service: string;
  prices: {
    operatorId: string;
    operatorName: string;
    cost: number;
    count: number;
  }[];
}

export default function PricingPage() {
  const { selectedCountry } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<PricingProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<PricingProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (selectedCountry) {
      fetchProducts();
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(product => 
        product.service.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    if (!selectedCountry) return;
    
    setIsLoading(true);
    try {
      const data = await getProducts(selectedCountry);
      
      // Transform the data structure
      const countryData = data[selectedCountry] || {};
      const formattedProducts: PricingProduct[] = [];
      
      Object.entries(countryData).forEach(([service, operators]) => {
        const formattedPrices = Object.entries(operators).map(([opId, details]: [string, any]) => ({
          operatorId: opId,
          operatorName: `Operator ${opId.replace('virtual', '')}`,
          cost: details.cost || 0,
          count: details.count || 0,
        }));
        
        // Sort operators by price
        formattedPrices.sort((a, b) => a.cost - b.cost);
        
        formattedProducts.push({
          service,
          prices: formattedPrices,
        });
      });
      
      // Sort alphabetically by service name
      formattedProducts.sort((a, b) => a.service.localeCompare(b.service));
      
      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load pricing data. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleBuyNumber = (service: string) => {
    router.push(`/numbers?service=${service}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pricing</h1>
      <p className="text-muted-foreground mb-8 max-w-3xl">
        Our pricing is transparent and competitive. Choose a country below to see all available services and their prices.
        Prices are shown per activation in Indian Rupees (₹) and vary based on country, service, and operator.
      </p>

      <div className="mb-8 max-w-lg">
        <h2 className="text-lg font-medium mb-3">Select Country</h2>
        <CountrySelector />
      </div>

      {/* Search and filters */}
      <div className="mb-6 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for a service (e.g., Telegram, WhatsApp)"
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Pricing table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading pricing data...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2">No services found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? `No results for "${searchQuery}". Try a different search term.` : 'No services available for the selected country.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            // Get the lowest price operator
            const lowestPrice = product.prices.length > 0 ? product.prices[0] : null;
            
            return (
              <Card key={product.service} className="h-full">
                <CardHeader>
                  <CardTitle className="capitalize">{product.service}</CardTitle>
                  <CardDescription>
                    {product.prices.length} {product.prices.length === 1 ? 'operator' : 'operators'} available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lowestPrice ? (
                    <>
                      <div className="mb-4">
                        <p className="text-muted-foreground text-sm mb-1">Lowest price</p>
                        <p className="text-3xl font-bold text-primary">
                          {formatPrice(lowestPrice.cost)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          via {lowestPrice.operatorName}
                        </p>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">All prices:</p>
                        <ul className="space-y-1">
                          {product.prices.map((price) => (
                            <li key={price.operatorId} className="text-sm flex justify-between">
                              <span>{price.operatorName}</span>
                              <span className="font-medium">{formatPrice(price.cost)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No pricing information available</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleBuyNumber(product.service)}
                  >
                    Buy Number
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 
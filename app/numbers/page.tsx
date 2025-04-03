'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CountrySelector from '@/components/CountrySelector';
import { getProducts, getOperatorsForService, purchaseActivation } from '@/lib/api';

import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/context/AppContext';

interface Product {
  service: string;
  operators: {
    id: string;
    name: string;
    displayName: string;
    cost: number;
    count: number;
  }[];
}

function NumbersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedCountry, setSelectedCountry } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Check for URL parameters on initial load
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const countryParam = searchParams.get('country');
    
    if (serviceParam) {
      setSelectedService(serviceParam);
    }
    
    if (countryParam && countryParam !== selectedCountry) {
      setSelectedCountry(countryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedCountry) {
      fetchProducts();
    }
  }, [selectedCountry]);

  const fetchProducts = async () => {
    if (!selectedCountry) return;
    
    setIsLoading(true);
    try {
      const data = await getProducts(selectedCountry);
      
      // Add debugging to see the structure
      console.log("Products data:", data);
      
      // Transform the data structure
      const countryData = data[selectedCountry] || {};
      
      console.log("Country data for", selectedCountry, ":", countryData);
      
      const formattedProducts: Product[] = [];
      
      Object.entries(countryData).forEach(([service, operators]) => {
        // Add more resilient handling of the operators format
        // It could be an object or something else
        if (operators && typeof operators === 'object' && !Array.isArray(operators)) {
          const formattedOperators = Object.entries(operators).map(([opId, details]: [string, any]) => ({
            id: opId,
            name: opId,
            displayName: `Operator ${opId.replace('virtual', '')}`,
            cost: details.cost || 0,
            count: details.count || 0,
          }));
          
          formattedProducts.push({
            service,
            operators: formattedOperators,
          });
        } else {
          console.warn(`Invalid operators data for service ${service}:`, operators);
        }
      });
      
      // Sort by service name alphabetically
      formattedProducts.sort((a, b) => a.service.localeCompare(b.service));
      
      setProducts(formattedProducts);
      setIsLoading(false);
      
      // Auto-scroll to services section if service is pre-selected
      if (selectedService) {
        setTimeout(() => {
          const serviceElement = document.getElementById('service-selection');
          if (serviceElement) {
            serviceElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load services. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedCountry || !selectedService || !selectedOperator) {
      toast.error('Please select a country, service, and operator.');
      return;
    }

    setIsPurchasing(true);
    try {
      console.log(`Purchasing number: ${selectedCountry}/${selectedOperator}/${selectedService}`);
      
      const activation = await purchaseActivation(selectedCountry, selectedOperator, selectedService);
      
      console.log('Purchase successful:', activation);
      
      if (!activation || !activation.phone) {
        throw new Error('Received invalid activation data from server');
      }
      
      toast.success(`Successfully purchased number: ${activation.phone}`);
      
      // Save activation ID to localStorage
      if (typeof window !== 'undefined') {
        try {
          const existingIds = localStorage.getItem('activationIds');
          const ids = existingIds ? JSON.parse(existingIds) : [];
          if (!ids.includes(activation.id)) {
            ids.unshift(activation.id); // Add new ID at the beginning
            localStorage.setItem('activationIds', JSON.stringify(ids));
          }
        } catch (error) {
          console.error('Error saving activation ID to localStorage:', error);
        }
      }
      
      // Redirect to the activation details page
      router.push(`/activations/${activation.id}`);
    } catch (error: any) {
      console.error('Error purchasing number:', error);
      
      let errorMessage = 'Failed to purchase number. Please try again.';
      let isAuthError = false;
      
      if (error.name === 'ValidationError') {
        errorMessage = `Validation error: ${error.message}`;
      } else if (error.name === 'InsufficientBalanceError' || error.message.includes('Insufficient balance')) {
        errorMessage = 'Insufficient balance to complete this purchase.';
      } else if (error.name === 'AxiosError' && error.response) {
        // Handle API errors
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        if (statusCode === 401) {
          isAuthError = true;
          errorMessage = 'You need to be signed in to purchase a number.';
        } else {
          errorMessage = `API Error (${statusCode}): ${responseData?.error || responseData?.message || 'Unknown error'}`;
        }
        console.error('API error details:', responseData);
      } else if (error.message) {
        if (error.message.includes('sign in') || error.message.includes('authentication') || error.message.includes('Authentication required')) {
          isAuthError = true;
          errorMessage = 'You need to be signed in to purchase a number.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (isAuthError) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p>{errorMessage}</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" asChild>
                <a href="/sign-in">Sign In</a>
              </Button>
              <Button size="sm" variant="default" asChild>
                <a href="/sign-up">Sign Up</a>
              </Button>
            </div>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(errorMessage, {
          duration: 5000
        });
      }
      
      setIsPurchasing(false);
    }
  };

  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.service.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const selectedProduct = products.find(p => p.service === selectedService);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Purchase a Phone Number</h1>
        <p className="text-muted-foreground mb-8">
          Select a country, service, and operator to purchase a temporary phone number for SMS verification.
          All prices are shown in Indian Rupees (₹).
        </p>

        <div className="grid grid-cols-1 gap-6">
          {/* Step 1: Select Country */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">1</span>
                Select a Country
              </CardTitle>
              <CardDescription>
                Choose the country where you would like to receive your verification code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CountrySelector onSelect={(country) => {
                setSelectedOperator(null);
                if (selectedCountry !== country) {
                  // Reset the selected operator when changing the country
                  setSelectedOperator(null);
                }
              }} />
            </CardContent>
          </Card>

          {/* Step 2: Select Service */}
          <Card id="service-selection">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">2</span>
                Select a Service
              </CardTitle>
              <CardDescription>
                Choose the platform or service you need a verification number for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading services...</span>
                </div>
              ) : (
                <div>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedService
                          ? selectedService.charAt(0).toUpperCase() + selectedService.slice(1)
                          : "Select a service..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search services..." 
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandEmpty>No services found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {filteredProducts.map((product) => (
                            <CommandItem
                              key={product.service}
                              value={product.service}
                              onSelect={(value) => {
                                setSelectedService(value);
                                setSelectedOperator(null);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedService === product.service ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {product.service.charAt(0).toUpperCase() + product.service.slice(1)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Select Operator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">3</span>
                Select an Operator
              </CardTitle>
              <CardDescription>
                Choose the network operator with the best price and availability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : selectedService ? (
                <div>
                  <Popover open={operatorOpen} onOpenChange={setOperatorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={operatorOpen}
                        className="w-full justify-between"
                      >
                        {selectedOperator ? 
                          selectedProduct?.operators.find(op => op.id === selectedOperator)?.displayName || selectedOperator
                          : "Select an operator..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search operators..." />
                        <CommandEmpty>No operators found.</CommandEmpty>
                        <CommandGroup>
                          {selectedProduct?.operators.map((operator) => (
                            <CommandItem
                              key={operator.id}
                              value={operator.id}
                              onSelect={(value) => {
                                setSelectedOperator(value);
                                setOperatorOpen(false);
                              }}
                              disabled={operator.count === 0}
                              className={operator.count === 0 ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <div className="flex justify-between w-full items-center">
                                <div className="flex items-center">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedOperator === operator.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span>{operator.displayName}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs text-muted-foreground mr-2">
                                    {operator.count} available
                                  </span>
                                  <span className="font-medium text-sm">
                                    {formatPrice(operator.cost)}
                                  </span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Please select a service first.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Button */}
          <div className="flex justify-end mt-4">
            <Button
              size="lg"
              onClick={handlePurchase}
              disabled={!selectedCountry || !selectedService || !selectedOperator || isPurchasing}
              className="w-full md:w-auto"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Purchase Number"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumbersPage; 
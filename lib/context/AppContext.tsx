'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Remove the next-auth useSession import as we're removing authentication
// import { useSession } from 'next-auth/react';
import { getCountries, checkApiStatus, getUserProfile } from '../api';
import { Country } from '../api';
import { toast } from 'sonner';

interface AppContextType {
  countries: Record<string, Country> | null;
  selectedCountry: string | null;
  isLoading: boolean;
  error: string | null;
  apiStatus: {
    isOperational: boolean;
    balance: number;
    email: string;
  } | null;
  setSelectedCountry: (country: string) => void;
  isAuthenticated: boolean;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    balance?: number;
  } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Remove session logic and hardcode authentication status
  // const { data: session, status } = useSession();
  const [countries, setCountries] = useState<Record<string, Country> | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<AppContextType['apiStatus']>(null);
  
  // Always set isAuthenticated to true regardless of actual auth status
  const isAuthenticated = true; 
  // Create a default user object
  const user = {
    id: 'default-user-id',
    name: 'Default User',
    email: 'user@example.com',
    image: null,
    balance: 100 // Default balance
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch countries with retries
        let countriesData;
        try {
          const response = await getCountries();
          
          // Check the format of the response
          console.log("Countries response:", response);
          
          // Handle the response data based on its structure
          if (response && typeof response === 'object') {
            // If it's already an object with country codes as keys
            if (!Array.isArray(response)) {
              countriesData = response;
            } 
            // If it's an array of country objects, convert to Record
            else if (Array.isArray(response)) {
              countriesData = response.reduce((acc, country) => {
                if (country && country.country) {
                  acc[country.country] = country;
                }
                return acc;
              }, {} as Record<string, Country>);
            }
            // If it has a data property that's an object (from original 5sim API format)
            else if (response && 'data' in (response as any) && typeof (response as any).data === 'object') {
              countriesData = (response as any).data;
            }
            // Fallback
            else {
              throw new Error('Unexpected countries data format');
            }
          }
          
          setCountries(countriesData);
          
          // Set default country if none selected
          if (!selectedCountry && countriesData && Object.keys(countriesData).length > 0) {
            setSelectedCountry('usa'); // Default to USA or first country
          }
        } catch (countriesError: any) {
          console.error('Error fetching countries:', countriesError);
          // If countries can't be fetched, show a specific error but continue with other data
          toast.error('Failed to load countries data. Some features may be limited.');
        }
        
        // Check API status and fetch user profile for balance
        try {
          const isApiOperational = await checkApiStatus();
          
          // Fetch user profile to get balance and email
          if (isApiOperational) {
            const profileData = await getUserProfile();
            setApiStatus({
              isOperational: true,
              balance: profileData.balance,
              email: profileData.email
            });
          } else {
            setApiStatus({
              isOperational: false,
              balance: 0,
              email: ''
            });
          }
        } catch (statusError: any) {
          console.error('Error checking API status:', statusError);
          // Don't show a toast for this as it's not critical
        }

        // Remove the auth check since we're removing authentication
        // Just load everything by default
        try {
          console.log('App is now working without authentication');
        } catch (err) {
          console.error('Error in data loading:', err);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching initial data:', err);
        
        let errorMessage = 'Failed to load initial data. Please refresh the page.';
        
        // Customize error message for rate limits
        if (err.message && err.message.includes('Too many requests')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
        
        toast.error(errorMessage);
      }
    };

    fetchInitialData();
  }, [selectedCountry]); // Only depends on selectedCountry now, not authentication status

  return (
    <AppContext.Provider
      value={{
        countries,
        selectedCountry,
        isLoading,
        error,
        apiStatus,
        setSelectedCountry,
        isAuthenticated,
        user,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 
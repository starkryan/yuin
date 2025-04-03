import axios, { AxiosError } from 'axios';
// Remove the getSession import as we don't need it anymore
// import { getSession } from 'next-auth/react';

// Create a client-side axios instance that uses our Next.js API routes
const api = axios.create({
  baseURL: '/api', // Use relative URL to our own Next.js API routes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add type definitions at the top
type Country = {
  country: string;
  name: string;
  prefix?: string;
  iso?: string;
};

type Operator = {
  operator: string;
  name: string;
  country?: string;
};

type Product = {
  product: string;
  operator: string;
  cost: number;
  count: number;
  rate: number;
};

type Activation = {
  id: number;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: string;
  expires: string;
  country: string;
  created_at: string;
  sms: SmsMessage[] | null;
};

type SmsMessage = {
  id: number;
  created_at: string;
  date: string;
  sender: string;
  text: string;
  code?: string;
};

// Add UserProfile type definition
type UserProfile = {
  id: number;
  email: string;
  balance: number;
  rating: number;
  default_forwarding?: string;
  is_verified: boolean;
  block_no_countries: boolean;
  created_at: string;
};

// Add retryWithBackoff implementation
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

// General error handler
const handleApiError = (error: unknown, context: string): never => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    throw new Error(`${context}: ${error.response.data.message}`);
  }
  if (error instanceof Error) {
    throw new Error(`${context}: ${error.message}`);
  }
  throw new Error(`${context}: Unknown error`);
};

// 5SIM API functions
export const getCountries = async (): Promise<Country[]> => {
  try {
    const response = await api.get('/countries');
    return response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

export const getOperators = async (country: string): Promise<Operator[]> => {
  return retryWithBackoff(async () => {
    try {
      // Updated to use our new operators API route
      const response = await api.get('/operators', {
        params: { country }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch operators');
    }
  });
};

export const getOperatorsForService = async (country: string, service: string): Promise<Operator[]> => {
  return retryWithBackoff(async () => {
    try {
      // Updated to use our new operators API route
      const response = await api.get('/operators', {
        params: { country, service }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, `Failed to fetch operators for service ${service}`);
    }
  });
};

export const getProducts = async (country: string): Promise<Record<string, Record<string, Product>>> => {
  try {
    const response = await api.get(`/products?country=${country}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const purchaseNumber = async (country: string, operator: string, service: string): Promise<Activation | never> => {
  try {
    const response = await api.get(`/5sim/buy/${country}/${operator}/${service}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to purchase number');
  }
};

export const checkActivationStatus = async (id: number): Promise<Activation | never> => {
  try {
    const response = await api.get(`/5sim/status/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to check activation status for ID ${id}`);
  }
};

export const getSmsInbox = async (id: number): Promise<{ success: boolean, sms: SmsMessage[] } | never> => {
  try {
    const response = await api.get(`/5sim/sms/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch SMS inbox for ID ${id}`);
  }
};

export const cancelActivation = async (id: number): Promise<Activation | never> => {
  try {
    const response = await api.post(`/activation/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error canceling activation:', error);
    throw error;
  }
};

export const finishActivation = async (id: number): Promise<Activation | never> => {
  try {
    const response = await api.post(`/activation/${id}/finish`);
    return response.data;
  } catch (error) {
    console.error('Error finishing activation:', error);
    throw error;
  }
};

export const banActivation = async (id: number): Promise<Activation | never> => {
  try {
    const response = await api.post(`/activation/${id}/ban`);
    return response.data;
  } catch (error) {
    console.error('Error banning activation:', error);
    throw error;
  }
};

// New endpoint for user profile
export const getUserProfile = async (): Promise<UserProfile | never> => {
  try {
    const response = await api.get('/api/user/balance');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await api.get('/status');
    return response.data.isOperational === true;
  } catch (error) {
    console.error('Error checking API status:', error);
    return false;
  }
}

export async function purchaseActivation(country: string, operator: string, product: string): Promise<Activation> {
  try {
    console.log(`Requesting activation purchase: ${country}/${operator}/${product}`);
    
    const response = await api.post('/purchase', { 
      country, 
      operator, 
      product 
    });
    
    // Log successful response
    console.log('Purchase activation response:', response.data);
    
    if (!response.data || response.data.error) {
      console.error('Error in purchase response:', response.data);
      throw new Error(response.data?.error || 'Failed to purchase activation');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error purchasing activation:', error);
    
    // Enhance error details for better debugging and user experience
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      // Specifically handle authentication errors with a user-friendly message
      if (status === 401) {
        throw new Error('Please sign in to purchase a number. You can create an account or sign in to continue.');
      }
      
      throw new Error(`Purchase failed: ${errorData?.error || JSON.stringify(errorData)}`);
    }
    
    throw error;
  }
}

export async function getActivation(id: number): Promise<Activation> {
  try {
    const response = await api.get(`/activation/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activation:', error);
    throw error;
  }
}

export { type Country, type Operator, type Product, type Activation, type SmsMessage, type UserProfile };

export default api;
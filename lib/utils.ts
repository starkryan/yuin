import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Combine multiple class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into a human-readable format
 */
export function formatDate(date: string | Date | undefined | null, pattern = 'MMM d, yyyy h:mm a'): string {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), pattern);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format a price with currency symbol
 */
export function formatPrice(price: number, currency = 'INR'): string {
  // Convert from rubles to rupees (approximate conversion rate)
  // As of current data, 1 RUB ≈ 0.9 INR
  const conversionRate = 0.9; // Ruble to INR conversion rate
  const priceInRupees = price * conversionRate;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(priceInRupees);
}

/**
 * Format a phone number to a readable format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Check if the phone number already has a plus sign
  if (!phoneNumber.startsWith('+')) {
    phoneNumber = `+${phoneNumber}`;
  }
  
  // Simple formatting for international numbers
  // This is a basic implementation - you might want to use a library for more complex formatting
  return phoneNumber;
}

/**
 * Get the status color based on the activation status
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' };
    case 'RECEIVED':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' };
    case 'COMPLETED':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' };
    case 'CANCELED':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' };
    case 'BANNED':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' };
  }
}

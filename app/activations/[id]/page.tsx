'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Copy, CheckCircle, XCircle, Ban, RefreshCw, RotateCw, X } from 'lucide-react';
import { getActivation, finishActivation, cancelActivation, banActivation, Activation } from '@/lib/api';
import { formatDate, formatPhoneNumber, formatRelativeTime, getStatusColor, formatPrice } from '@/lib/utils';

function ActivationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const paramValues = React.use(params);
  const activationIdStr = paramValues.id;
  const activationId = parseInt(activationIdStr || '0');
  
  const [activation, setActivation] = useState<Activation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeTotal, setTimeTotal] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState<boolean>(false);

  useEffect(() => {
    // Only fetch if we have a valid ID
    if (activationId && !isNaN(activationId)) {
      fetchActivation();
      
      // Start continuous polling immediately
      const immediateCheck = setTimeout(() => {
        refreshActivation(true); // Force refresh on initial load
      }, 200); // Reduced to 200ms for faster initial check
      
      return () => clearTimeout(immediateCheck);
    } else {
      setErrorMessage('Invalid activation ID');
      setIsLoading(false);
    }
  }, [activationId]);

  useEffect(() => {
    if (activation) {
      const expiresDate = new Date(activation.expires);
      const createdDate = new Date(activation.created_at);
      const now = new Date();
      
      const totalTime = expiresDate.getTime() - createdDate.getTime();
      const remainingTime = expiresDate.getTime() - now.getTime();
      
      setTimeTotal(totalTime);
      setTimeRemaining(remainingTime > 0 ? remainingTime : 0);
      
      // Set up auto-refresh every 3 seconds if the activation is still active (was 10 seconds)
      let refreshInterval: NodeJS.Timeout | null = null;
      
      if (activation.status === 'RECEIVED' || activation.status === 'PENDING') {
        setPollingActive(true);
        refreshInterval = setInterval(() => {
          refreshActivation();
        }, 3000); // Reduced from 10000ms to 3000ms for faster updates
      } else {
        setPollingActive(false);
      }
      
      return () => {
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }
  }, [activation]);

  const fetchActivation = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Connect to the real API to fetch the activation - this already includes SMS data
      const data = await getActivation(activationId);
      console.log("Activation data received:", data);
      
      // Check if we have SMS data
      if (data.sms && data.sms.length > 0) {
        console.log("SMS messages from activation data:", data.sms);
      } else {
        console.log("No SMS messages found in activation data");
      }
      
      setActivation(data);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching activation:', error);
      if (error.name === 'ValidationError') {
        setErrorMessage(`Validation error: ${error.message}`);
      } else {
        setErrorMessage(error.message || 'Failed to load activation details. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch(err => console.log('Error playing sound:', err));
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  const extractVerificationCode = (text: string): string | null => {
    // Look for patterns like: "code is 1234" or "verification code: 1234" or just "1234" or "OTP is 1234"
    const codeMatch = text.match(/code\s+is\s+(\d+)/i) || 
                     text.match(/verification\s+code[:\s]+(\d+)/i) ||
                     text.match(/otp\s+is\s+(\d+)/i) ||
                     text.match(/otp[:\s]+(\d+)/i) ||
                     text.match(/(\d{4,6})/); // Match 4-6 digit numbers
    
    return codeMatch ? codeMatch[1] : null;
  };

  const refreshActivation = async (forceRefresh = false) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Make real API call to refresh the activation status - this already includes SMS data
      // Add a timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      const updatedActivation = await getActivation(activationId);
      console.log("Refreshed activation data:", updatedActivation);
      
      // Check if we have new SMS messages
      if (updatedActivation.sms && updatedActivation.sms.length > 0) {
        const oldSmsCount = activation?.sms?.length || 0;
        const newSmsCount = updatedActivation.sms.length;
        
        console.log("Refreshed SMS messages:", updatedActivation.sms);
        
        // If we have new messages or forcing a refresh to show OTP
        if (newSmsCount > oldSmsCount || forceRefresh) {
          const latestSms = updatedActivation.sms[0];
          const code = latestSms.code || (latestSms.text ? extractVerificationCode(latestSms.text) : null);
          
          // Display a notification with the code
          if (code) {
            // Play notification sound
            playNotificationSound();
            
            toast.success(`OTP RECEIVED: ${code}`, {
              duration: 10000, // Keep notification for 10 seconds
              style: { 
                background: '#10b981',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }
            });
            
            // Copy code to clipboard automatically
            navigator.clipboard.writeText(code)
              .then(() => console.log('Auto-copied code to clipboard'))
              .catch(err => console.error('Failed to auto-copy code', err));
          } else {
            toast.success(`New SMS received! Check message`, {
              duration: 5000
            });
          }
        }
      } else {
        console.log("No SMS messages found in refreshed activation data");
      }
      
      setActivation(updatedActivation);
      setIsRefreshing(false);
    } catch (error: any) {
      console.error('Error refreshing activation:', error);
      if (error.name === 'ValidationError') {
        toast.error(`Validation error: ${error.message}`);
      } else {
        toast.error(error.message || 'Failed to refresh activation status.');
      }
      setIsRefreshing(false);
    }
  };

  const handleFinish = async () => {
    try {
      if (!activation) return;
      
      // Make real API call to finish the activation
      const updatedActivation = await finishActivation(activationId);
      
      setActivation(updatedActivation);
      toast.success('Activation marked as completed.');
    } catch (error: any) {
      console.error('Error finishing activation:', error);
      if (error.name === 'ValidationError') {
        toast.error(`Validation error: ${error.message}`);
      } else {
        toast.error(error.message || 'Failed to finish the activation.');
      }
    }
  };

  const handleCancel = async () => {
    try {
      if (!activation) return;
      
      // Make real API call to cancel the activation
      const updatedActivation = await cancelActivation(activationId);
      
      setActivation(updatedActivation);
      toast.success('Activation has been canceled.');
    } catch (error: any) {
      console.error('Error canceling activation:', error);
      if (error.name === 'ValidationError') {
        toast.error(`Validation error: ${error.message}`);
      } else {
        toast.error(error.message || 'Failed to cancel the activation.');
      }
    }
  };

  const handleBan = async () => {
    try {
      if (!activation) return;
      
      // Make real API call to ban/report the activation
      const updatedActivation = await banActivation(activationId);
      
      setActivation(updatedActivation);
      toast.success('Number has been reported and banned.');
    } catch (error: any) {
      console.error('Error banning activation:', error);
      if (error.name === 'ValidationError') {
        toast.error(`Validation error: ${error.message}`);
      } else {
        toast.error(error.message || 'Failed to ban the number.');
      }
    }
  };

  const handlePurchaseAgain = async () => {
    if (!activation) return;
    
    try {
      // Check if the activation has SMS messages
      const hasSmsMessages = activation.sms && activation.sms.length > 0;
      
      // First, check if we need to finish or cancel the current activation
      if (['RECEIVED', 'PENDING'].includes(activation.status)) {
        if (hasSmsMessages) {
          // If we received SMS, we should finish the activation instead of canceling
          toast.info('Finishing current activation before purchasing a new one...');
          
          // Finish the current activation
          await finishActivation(activationId);
          
          toast.success('Current activation finished successfully.');
        } else {
          // No SMS received, we can cancel it
          toast.info('Canceling current activation before purchasing a new one...');
          
          // Cancel the current activation
          await cancelActivation(activationId);
          
          toast.success('Current activation canceled successfully.');
        }
      }
      
      // Redirect to the numbers page with country and service pre-selected
      const queryParams = new URLSearchParams({
        country: activation.country,
        service: activation.product
      }).toString();
      
      router.push(`/numbers?${queryParams}`);
      toast.info('Starting new purchase for ' + activation.product);
    } catch (error) {
      console.error('Error during purchase again flow:', error);
      toast.error('Failed to process current activation. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const progressPercentage = timeTotal > 0 ? ((timeTotal - timeRemaining) / timeTotal) * 100 : 0;
  const timeRemainingMinutes = Math.ceil(timeRemaining / (1000 * 60));
  const statusColor = activation ? getStatusColor(activation.status) : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' };

  // Add a function to get payment status display information
  const getPaymentStatusInfo = () => {
    if (!activation) return null;
    
    // Check for payment properties that might not be in the Activation type
    const pendingPayment = (activation as any).pendingPayment;
    const transaction = (activation as any).transaction;
    const hasSms = activation.sms && activation.sms.length > 0;
    
    if (!pendingPayment && !transaction) {
      // Regular payment (old system)
      return null;
    }
    
    if (transaction?.status === 'PENDING') {
      return {
        status: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        message: 'Your payment will only be processed if you receive an SMS. If no SMS is received before expiration, no charge will be applied.'
      };
    } else if (transaction?.status === 'COMPLETED') {
      return {
        status: 'Completed',
        color: 'bg-green-100 text-green-800 border-green-300',
        message: 'Your payment has been processed successfully after receiving SMS.'
      };
    } else if (transaction?.status === 'CANCELED') {
      return {
        status: 'Canceled',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        message: 'No SMS was received before this activation expired, so no payment was processed.'
      };
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading activation details...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !activation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p className="text-muted-foreground mb-6">{errorMessage || 'Activation not found'}</p>
          <Button asChild>
            <a href="/activations">Back to Activations</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.push('/activations')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Activations
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Activation Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {formatPhoneNumber(activation.phone)}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      ID: {activation.id}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                      {activation.status}
                    </div>
                    
                    {/* Add payment status indicator */}
                    {getPaymentStatusInfo() && (
                      <div className={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusInfo()?.color}`}>
                        Payment: {getPaymentStatusInfo()?.status}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-muted-foreground text-sm">Service</p>
                    <p className="font-medium capitalize">{activation.product}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Country</p>
                    <p className="font-medium capitalize">{activation.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Created</p>
                    <p className="font-medium">{formatDate(activation.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Operator</p>
                    <p className="font-medium">{activation.operator}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Price</p>
                    <p className="font-medium">{formatPrice(activation.price)}</p>
                  </div>
                </div>

                {(activation.status === 'RECEIVED' || activation.status === 'PENDING') && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Expires in</span>
                      <span className="font-medium">{timeRemainingMinutes} minutes</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(activation.phone)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Number
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refreshActivation(false)}
                    disabled={isRefreshing || !['RECEIVED', 'PENDING'].includes(activation.status)}
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  
                  {pollingActive && (
                    <div className="flex items-center ml-2 text-sm text-green-600 dark:text-green-400">
                      <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Auto-refreshing
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SMS Messages */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle>SMS Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {activation.sms && activation.sms.length > 0 ? (
                  <div className="space-y-4">
                    {activation.sms.map((message, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{message.sender}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(message.date)}
                          </div>
                        </div>
                        {(message.code || extractVerificationCode(message.text)) && (
                          <div className="bg-green-100 dark:bg-green-900 p-3 mb-2 rounded-md text-center">
                            <p className="text-xs text-green-800 dark:text-green-200">Verification Code:</p>
                            <p className="text-xl font-bold text-green-800 dark:text-green-200">
                              {message.code || extractVerificationCode(message.text)}
                            </p>
                          </div>
                        )}
                        <p className="text-sm mb-2">{message.text}</p>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-8"
                            onClick={() => copyToClipboard(message.text)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Text
                          </Button>
                          {(message.code || extractVerificationCode(message.text)) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-8"
                              onClick={() => {
                                const code = message.code || extractVerificationCode(message.text);
                                if (code) copyToClipboard(code);
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Code
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-background">
                    <p className="text-muted-foreground mb-2">
                      {activation.status === 'CANCELED' || activation.status === 'BANNED' 
                        ? 'This activation has been canceled or banned.'
                        : 'No SMS messages received yet.'}
                    </p>
                    {(activation.status === 'RECEIVED' || activation.status === 'PENDING') && (
                      <Button 
                        variant="outline"
                        onClick={() => refreshActivation(true)}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh Messages
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="default" 
                  className="w-full justify-start"
                  disabled={!['RECEIVED', 'PENDING'].includes(activation.status) || !activation.sms?.length}
                  onClick={handleFinish}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
                
                {/* Only show Cancel button if no SMS received */}
                {(!activation.sms?.length || activation.sms.length === 0) && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!['RECEIVED', 'PENDING'].includes(activation.status)}
                    onClick={handleCancel}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Activation
                  </Button>
                )}
                
                {/* Always show Purchase Again button, just disabled for COMPLETED status */}
                <Button 
                  variant="default" 
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  onClick={handlePurchaseAgain}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Purchase Again
                </Button>
                
                <Separator className="my-4" />
                
                {/* Only show Ban/Report button if no SMS received */}
                {(!activation.sms?.length || activation.sms.length === 0) && (
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={handleBan}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Report as Spam
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>
                  <strong>Mark as Completed:</strong> Confirm you've received the verification code and the number can be released.
                </p>
                {(!activation.sms?.length || activation.sms.length === 0) && (
                  <p>
                    <strong>Cancel Activation:</strong> End the activation early if you no longer need the number.
                  </p>
                )}
                <p>
                  <strong>Purchase Again:</strong> Cancel current activation (if active) and get a new number for the same service ({activation.product}).
                </p>
                {(!activation.sms?.length || activation.sms.length === 0) && (
                  <p>
                    <strong>Report as Spam:</strong> Report this number if you received spam or inappropriate messages.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* After the existing card content, add the payment info message */}
        {getPaymentStatusInfo() && (
          <CardContent className="pt-0">
            <div className={`border rounded-md p-3 mt-2 ${
              getPaymentStatusInfo()?.status === 'Pending' ? 'bg-yellow-50 border-yellow-200' :
              getPaymentStatusInfo()?.status === 'Completed' ? 'bg-green-50 border-green-200' :
              getPaymentStatusInfo()?.status === 'Canceled' ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <p className={`text-sm ${
                getPaymentStatusInfo()?.status === 'Pending' ? 'text-yellow-800' :
                getPaymentStatusInfo()?.status === 'Completed' ? 'text-green-800' :
                getPaymentStatusInfo()?.status === 'Canceled' ? 'text-blue-800' :
                'text-gray-800'
              }`}>
                <strong>Payment status:</strong> {getPaymentStatusInfo()?.message}
              </p>
            </div>
          </CardContent>
        )}
      </div>
    </div>
  );
}

export default function ActivationPageWithAuth({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ActivationPage params={params} />
  );
} 
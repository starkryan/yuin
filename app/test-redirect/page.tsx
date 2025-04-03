'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export default function TestRedirectPage() {
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const router = useRouter();
  const [status, setStatus] = useState<string>('Checking auth state...');

  useEffect(() => {
    if (userLoaded) {
      if (isSignedIn) {
        setStatus(`Signed in as ${user?.primaryEmailAddress?.emailAddress || 'unknown email'}`);
      } else {
        setStatus('Not signed in');
      }
    }
  }, [userLoaded, isSignedIn, user]);

  const handleSignInTest = async () => {
    if (!signInLoaded) return;
    try {
      const result = await signIn.create({
        identifier: 'test@example.com',
        password: 'test-password'
      });
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setStatus('Sign in complete - should redirect shortly...');
      } else {
        setStatus(`Sign in status: ${result.status}`);
      }
    } catch (error) {
      console.error('Error during sign in test:', error);
      setStatus(`Sign in error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSignUpTest = () => {
    router.push('/sign-up?redirect_url=/account');
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto bg-card border border-border p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Clerk Redirect Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <h2 className="font-semibold">Current Status:</h2>
            <p className="mt-2">{status}</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold">Test Options:</h2>
            <Button 
              onClick={handleSignUpTest} 
              className="w-full"
            >
              Test Sign Up with Redirect
            </Button>
            
            <Button 
              onClick={handleSignInTest} 
              variant="outline" 
              className="w-full"
              disabled={!signInLoaded}
            >
              Test Sign In Flow
            </Button>
            
            <Button 
              onClick={() => router.push('/account')} 
              variant="secondary" 
              className="w-full"
            >
              Go to Account Page
            </Button>
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            <p>Note: The Sign Up test will use the redirect_url parameter which should override the afterSignUpUrl setting.</p>
            <p className="mt-2">Sign In test uses the programmatic API which should respect the afterSignInUrl setting.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
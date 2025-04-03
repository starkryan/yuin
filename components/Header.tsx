'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

const Header = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="text-2xl font-bold text-primary">
            OTPMaya
          </Link>
        
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-4">
                <NavLink href="/" active={pathname === '/'} onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </NavLink>
                <NavLink href="/numbers" active={pathname.startsWith('/numbers')} onClick={() => setIsMobileMenuOpen(false)}>
                  Virtual Number
                </NavLink>
                <NavLink href="/pricing" active={pathname === '/pricing'} onClick={() => setIsMobileMenuOpen(false)}>
                  Pricing
                </NavLink>
                <SignedIn>
                  <NavLink href="/profile" active={pathname === '/profile'} onClick={() => setIsMobileMenuOpen(false)}>
                    My Profile
                  </NavLink>
                </SignedIn>
              </nav>
            </div>
          </div>
        )}

        <nav className="hidden md:flex items-center space-x-6">
          <NavLink href="/" active={pathname === '/'}>
            Home
          </NavLink>
          <NavLink href="/numbers" active={pathname.startsWith('/numbers')}>
            Virtual Number
          </NavLink>
          <NavLink href="/pricing" active={pathname === '/pricing'}>
            Pricing
          </NavLink>
          <SignedIn>
            <NavLink href="/profile" active={pathname === '/profile'}>
              My Profile
            </NavLink>
          </SignedIn>
        </nav>

        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink = ({ href, active, children, onClick }: NavLinkProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  );
};

export default Header; 
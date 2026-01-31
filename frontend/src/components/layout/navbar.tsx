'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Menu, X } from 'lucide-react';
import { Ticker } from './ticker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: '饰品预测', href: '/trade' },
  { label: '欧皇开箱', href: '/live' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="rounded-lg bg-gradient-to-br from-polygon to-purple-rare p-1.5">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="hidden sm:inline">PolyStrike</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 font-semibold transition-colors',
                  isActive ? 'text-polygon' : 'text-gray-400 hover:text-white'
                )}
              >
                {item.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-polygon to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={toggleWallet}
            variant={isConnected ? 'secondary' : 'primary'}
            size="sm"
            className="whitespace-nowrap text-xs sm:text-base"
          >
            {isConnected ? (
              <>
                <div className="h-2 w-2 rounded-full bg-profit" />
                <span className="hidden sm:inline">1,450 MATIC</span>
                <span className="sm:hidden">0x12...34</span>
              </>
            ) : (
              'Connect Wallet'
            )}
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="sm:hidden p-2 rounded-lg hover:bg-bg-secondary/50"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="sm:hidden border-t border-border-subtle bg-bg-secondary/50">
          <nav className="flex flex-col p-4 gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-semibold transition-colors',
                    isActive
                      ? 'bg-polygon/20 text-polygon'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
      <Ticker />
    </header>
  );
}

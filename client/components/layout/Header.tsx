'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  cartItemCount?: number;
}

const Header: React.FC<HeaderProps> = ({ cartItemCount = 0 }) => {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full h-[60px] bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link 
          href="/" 
          className="text-2xl font-bold uppercase tracking-wider text-black hover:opacity-80 transition-opacity"
        >
          Vault
        </Link>

        <nav className="flex items-center space-x-8">
          <Link 
            href="/products" 
            className={`uppercase text-sm text-black hover:opacity-80 transition-opacity ${
              pathname === '/products' ? 'font-bold' : ''
            }`}
          >
            Shop
          </Link>
          <Link 
            href="/about" 
            className={`uppercase text-sm text-black hover:opacity-80 transition-opacity ${
              pathname === '/about' ? 'font-bold' : ''
            }`}
          >
            About
          </Link>
          <Link 
            href="/cart" 
            className="relative text-black hover:opacity-80 transition-opacity"
          >
            <span className="uppercase text-sm">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-4 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header; 
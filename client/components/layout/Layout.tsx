import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  cartItemCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, cartItemCount = 0 }) => {
  return (
    <>
      <Header cartItemCount={cartItemCount} />
      <main className="mt-[60px] min-h-[calc(100vh-60px)] bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </>
  );
};

export default Layout; 
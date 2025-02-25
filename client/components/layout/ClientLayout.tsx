'use client';

import { CartProvider, useCart } from "../../context/CartContext";
import Header from "./Header";
import { useEffect, useState } from "react";

function HeaderWithCart() {
  const { itemCount } = useCart();
  return <Header cartItemCount={itemCount} />;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <CartProvider>
      <HeaderWithCart />
      <main className="pt-[60px]">
        {children}
      </main>
    </CartProvider>
  );
} 
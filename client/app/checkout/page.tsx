'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { OrderService } from '@/services/order.service';

interface AddressFormData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<AddressFormData>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [billingAddress, setBillingAddress] = useState<AddressFormData>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PAYPAL'>('CREDIT_CARD');
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');

  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      router.push('/cart');
    }
  }, [items.length, router, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate form data
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || 
          !shippingAddress.zipCode || !shippingAddress.country) {
        throw new Error('Please fill in all shipping address fields');
      }

      if (!useSameAddress && (!billingAddress.street || !billingAddress.city || 
          !billingAddress.state || !billingAddress.zipCode || !billingAddress.country)) {
        throw new Error('Please fill in all billing address fields');
      }

      const orderData = {
        items: OrderService.formatCartItemsForOrder(items),
        shippingAddress,
        billingAddress: useSameAddress ? shippingAddress : billingAddress,
        paymentMethod,
        shippingMethod
      };

      console.log('Submitting order:', orderData);
      const response = await OrderService.createOrder(orderData);
      
      if (response.success && response.data) {
        // Store the order ID before clearing the cart
        const orderId = response.data._id;
        
        // Navigate to the confirmation page
        router.push(`/order-confirmation/${orderId}`);
        
        // Clear the cart after starting navigation
        setTimeout(() => {
          clearCart();
        }, 100);
      } else {
        throw new Error(response.error || 'Failed to create order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Unable to connect to the server. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] bg-black flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-50 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/checkout/checkout-hero.jpg')" }}
        />
        <h1 className="relative text-4xl md:text-6xl font-bold uppercase text-white text-center tracking-wider">
          Checkout
        </h1>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Shipping Address */}
          <div className="bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold uppercase mb-6 tracking-wide text-black">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Street Address"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                required
              />
              <input
                type="text"
                placeholder="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                required
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                required
              />
              <input
                type="text"
                placeholder="Country"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-gray-50 p-8 rounded-lg">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-black">Billing Address</h2>
              <label className="ml-6 flex items-center">
                <input
                  type="checkbox"
                  checked={useSameAddress}
                  onChange={(e) => setUseSameAddress(e.target.checked)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-gray-600">Same as shipping</span>
              </label>
            </div>

            {!useSameAddress && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={billingAddress.street}
                  onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                  className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                  className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={billingAddress.state}
                  onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                  className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={billingAddress.zipCode}
                  onChange={(e) => setBillingAddress({ ...billingAddress, zipCode: e.target.value })}
                  className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={billingAddress.country}
                  onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                  className="border border-gray-200 p-3 w-full focus:outline-none focus:ring-2 focus:ring-black transition-all text-black placeholder-gray-400"
                  required
                />
              </div>
            )}
          </div>

          {/* Payment and Shipping Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Method */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold uppercase mb-6 tracking-wide text-black">Payment Method</h2>
              <div className="space-y-4">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition-colors">
                  <input
                    type="radio"
                    value="CREDIT_CARD"
                    checked={paymentMethod === 'CREDIT_CARD'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'CREDIT_CARD')}
                    className="mr-3 h-4 w-4"
                  />
                  <span className="text-lg text-black">Credit Card</span>
                </label>
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition-colors">
                  <input
                    type="radio"
                    value="PAYPAL"
                    checked={paymentMethod === 'PAYPAL'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'PAYPAL')}
                    className="mr-3 h-4 w-4"
                  />
                  <span className="text-lg text-black">PayPal</span>
                </label>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold uppercase mb-6 tracking-wide text-black">Shipping Method</h2>
              <div className="space-y-4">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition-colors">
                  <input
                    type="radio"
                    value="STANDARD"
                    checked={shippingMethod === 'STANDARD'}
                    onChange={(e) => setShippingMethod(e.target.value as 'STANDARD')}
                    className="mr-3 h-4 w-4"
                  />
                  <div>
                    <div className="text-lg text-black">Standard Shipping</div>
                    <div className="text-sm text-gray-700">5-7 business days</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition-colors">
                  <input
                    type="radio"
                    value="EXPRESS"
                    checked={shippingMethod === 'EXPRESS'}
                    onChange={(e) => setShippingMethod(e.target.value as 'EXPRESS')}
                    className="mr-3 h-4 w-4"
                  />
                  <div>
                    <div className="text-lg text-black">Express Shipping</div>
                    <div className="text-sm text-gray-700">2-3 business days</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold uppercase mb-6 tracking-wide text-black">Order Summary</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gray-100 mr-4">
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-black">{item.name}</div>
                      <div className="text-gray-700">Size: {item.size}</div>
                      <div className="text-gray-700">Quantity: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-black">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-xl font-bold text-black">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-6 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-black text-white py-6 uppercase text-lg tracking-wider font-semibold hover:opacity-80 transition-opacity ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
} 
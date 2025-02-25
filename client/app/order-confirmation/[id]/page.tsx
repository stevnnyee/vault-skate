'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OrderService } from '@/services/order.service';

interface OrderData {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function OrderConfirmation() {
  const params = useParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = params?.id as string;
        if (!orderId) {
          setError('Order ID is missing');
          return;
        }

        const response = await OrderService.getOrder(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          setError('Failed to fetch order details');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-8 text-red-500">Error</h1>
          <p className="text-gray-600 mb-8">{error || 'Order not found'}</p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-8 py-3 uppercase text-sm tracking-wider hover:opacity-80 transition-opacity"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[40vh] bg-black flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-50 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/checkout/checkout-hero.jpg')" }}
        />
        <div className="relative text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-wider mb-4">
            Order Confirmed
          </h1>
          <p className="text-lg md:text-xl tracking-wide">
            Thank you for shopping with us
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-block p-4 rounded-full bg-green-100 mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-black text-lg">
            We'll send you a confirmation email with your order details.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-100">
          {/* Order Header */}
          <div className="bg-black text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order #{order.orderNumber}</h2>
              <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium">
                {order.status}
              </span>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 uppercase tracking-wide text-black">Order Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-black">Order Date</span>
                      <span className="font-medium text-black">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Total Amount</span>
                      <span className="font-medium text-black">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 uppercase tracking-wide text-black">Shipping Address</h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <p className="text-black">{order.shippingAddress.street}</p>
                    <p className="text-black">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p className="text-black">{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h3 className="text-lg font-semibold mb-4 uppercase tracking-wide text-black">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-black">{item.name}</p>
                        <p className="text-black">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-black font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Total Section */}
          <div className="border-t border-gray-200 p-8 bg-gray-50">
            <div className="flex justify-between items-center text-xl font-bold text-black">
              <span>Total</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-block bg-black text-white px-8 py-4 rounded-none uppercase text-sm tracking-wider font-semibold hover:opacity-80 transition-opacity"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
} 
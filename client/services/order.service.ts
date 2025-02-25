import { CartItem } from '@/context/CartContext';

interface CreateOrderInput {
  items: {
    product: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    variant: {
      size: string;
      color?: string;
      sku: string;
    };
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL';
  shippingMethod: 'STANDARD' | 'EXPRESS';
}

interface CreateOrderResponse {
  success: boolean;
  data?: {
    _id: string;
    orderNumber: string;
    total: number;
  };
  error?: string;
}

interface OrderResponse {
  success: boolean;
  data?: {
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
  };
  error?: string;
}

export class OrderService {
  private static API_URL = 'http://localhost:3001/api';

  static async createOrder(orderData: CreateOrderInput): Promise<CreateOrderResponse> {
    try {
      console.log('Starting order creation with data:', JSON.stringify(orderData, null, 2));

      // Fetch product details one by one
      const validatedItems = [];
      
      for (const item of orderData.items) {
        // Ensure product ID is a string and log its details
        const productId = item.product;
        console.log('Item details:', {
          originalProduct: item.product,
          originalType: typeof item.product,
          productId: productId,
          productIdType: typeof productId
        });
        
        // Get product details from local endpoint
        const url = new URL(`${this.API_URL}/products/local/${productId}`);
        console.log('Fetching from URL:', {
          fullUrl: url.toString(),
          pathname: url.pathname,
          productId: productId
        });
        
        try {
          const response = await fetch(url);
          console.log('Response details:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error details:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText,
              url: response.url
            });
            throw new Error(`Failed to fetch product ${productId}: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Response data:', JSON.stringify(data, null, 2));
          
          if (!data.success || !data.data || !data.data.product) {
            throw new Error(`Invalid product data received for ${productId}`);
          }
          
          const product = data.data.product;
          console.log('Parsed product:', JSON.stringify(product, null, 2));
          
          // Add validated item
          validatedItems.push({
            product: product.id.toString(), // Ensure ID is a string
            name: product.name,
            sku: product.sku,
            quantity: item.quantity,
            price: product.price,
            variant: {
              ...item.variant,
              sku: `${product.sku}-${item.variant.size}`
            }
          });
        } catch (error) {
          console.error('Fetch error details:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: url.toString(),
            productId
          });
          throw error;
        }
      }

      const validatedOrderData = {
        ...orderData,
        items: validatedItems
      };

      console.log('Sending validated order data:', validatedOrderData);
      
      const response = await fetch(`${this.API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(validatedOrderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Order creation failed:', {
          status: response.status,
          data: errorData
        });
        throw new Error(errorData.error || `Failed to create order: ${response.status}`);
      }

      const data = await response.json();
      console.log('Order creation successful:', data);

      return data;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to connect to the server');
    }
  }

  static async getOrder(orderId: string): Promise<OrderResponse> {
    try {
      console.log('Fetching order:', orderId);
      
      const response = await fetch(`${this.API_URL}/orders/guest/${orderId}`);
      const data = await response.json();
      console.log('Order fetch response:', data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch order: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Order fetch error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to connect to the server');
    }
  }

  static formatCartItemsForOrder(items: CartItem[]): CreateOrderInput['items'] {
    return items.map(item => {
      // Generate a base SKU from the product name if not available
      const baseSku = item.sku || item.name.toUpperCase().replace(/\s+/g, '-');
      
      // Generate variant SKU
      const variantSku = `${baseSku}-${item.size}`;
      
      return {
        product: item.id.toString(), // Convert to string to ensure consistent format
        name: item.name,
        sku: baseSku,
        quantity: item.quantity,
        price: item.price,
        variant: {
          size: item.size,
          color: item.color || 'Black', // Use item color if available, fallback to Black
          sku: variantSku
        }
      };
    });
  }
} 
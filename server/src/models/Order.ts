import mongoose from 'mongoose';

// Enum for order status
export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

// Enum for payment methods
export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card',
  DEBIT_CARD = 'Debit Card',
  PAYPAL = 'PayPal',
  STRIPE = 'Stripe'
}

// Interface for order item
interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  variation?: {
    size?: string;
    color?: string;
  };
}

// Interface for Order model
interface IOrder extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
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
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Unpaid' | 'Paid' | 'Refunded';
  trackingNumber?: string;
  shippingMethod?: string;
  notes?: string;
  orderDate: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
}

// Order Schema
const OrderSchema = new mongoose.Schema<IOrder>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    variation: {
      size: String,
      color: String
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  billingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Refunded'],
    default: 'Unpaid'
  },
  trackingNumber: String,
  shippingMethod: String,
  notes: String,
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippedDate: Date,
  deliveredDate: Date
}, {
  timestamps: true
});

// Virtual for formatted total amount
OrderSchema.virtual('formattedTotal').get(function() {
  return `$${this.totalAmount.toFixed(2)}`;
});

// Static method to find orders by user
OrderSchema.statics.findByUser = function(userId: string) {
  return this.find({ user: userId }).sort({ orderDate: -1 });
};

// Static method to find orders by status
OrderSchema.statics.findByStatus = function(status: OrderStatus) {
  return this.find({ status }).sort({ orderDate: -1 });
};

// Create and export the Order model
const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
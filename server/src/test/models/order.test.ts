import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Order from '../../models/order';
import { 
  OrderStatus, 
  PaymentMethod, 
  PaymentStatus, 
  ShippingMethod 
} from '../../types/models/order.types';

describe('Order Model Test Suite', () => {
  let mongoServer: MongoMemoryServer;
  const mockUserId = new mongoose.Types.ObjectId();
  const mockProductId = new mongoose.Types.ObjectId();

  // Base mock order data for testing
  const mockOrderData = {
    user: mockUserId,
    orderNumber: `ORD${Date.now()}`,
    items: [{
      product: mockProductId,
      name: 'Test Product',
      quantity: 2,
      price: 29.99,
      subtotal: 59.98,
      sku: 'TEST-SKU-001',
      variant: {
        size: 'M',
        color: 'Black',
        sku: 'TEST-SKU-001'
      }
    }],
    totalAmount: 59.98,
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: true
    },
    billingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: false
    },
    paymentMethod: PaymentMethod.CREDIT_CARD,
    shippingMethod: ShippingMethod.STANDARD
  };

  // Connect to in-memory database before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create mock User model
    const userSchema = new mongoose.Schema({
      email: String,
      name: String
    });
    mongoose.model('User', userSchema);

    // Create mock Product model
    const productSchema = new mongoose.Schema({
      name: String,
      price: Number
    });
    mongoose.model('Product', productSchema);
  });

  // Clear database between tests
  beforeEach(async () => {
    await Order.deleteMany({});
    
    // Create mock user and product
    const User = mongoose.model('User');
    const Product = mongoose.model('Product');
    
    await User.create({
      _id: mockUserId,
      email: 'test@test.com',
      name: 'Test User'
    });

    await Product.create({
      _id: mockProductId,
      name: 'Test Product',
      price: 29.99
    });
  });

  // Disconnect and cleanup after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const User = mongoose.model('User');
    const Product = mongoose.model('Product');
    await User.deleteMany({});
    await Product.deleteMany({});
  });

  // Basic Order Creation Tests
  describe('Order Creation', () => {
    it('should create a new order successfully', async () => {
      const order = new Order(mockOrderData);
      const savedOrder = await order.save();
      
      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.status).toBe(OrderStatus.PENDING);
      expect(savedOrder.paymentStatus).toBe(PaymentStatus.UNPAID);
    });

    it('should fail without required fields', async () => {
      const orderWithoutRequired = new Order({});
      await expect(orderWithoutRequired.save()).rejects.toThrow();
    });

    it('should enforce unique order numbers', async () => {
      const order1 = new Order(mockOrderData);
      await order1.save();

      const order2 = new Order(mockOrderData);
      await expect(order2.save()).rejects.toThrow();
    });
  });

  // Order Status Management Tests
  describe('Order Status Management', () => {
    it('should update status correctly', async () => {
      const order = new Order(mockOrderData);
      await order.save();
      
      await order.updateStatus(OrderStatus.PROCESSING);
      expect(order.status).toBe(OrderStatus.PROCESSING);
    });

    it('should set shipped date when status changes to shipped', async () => {
      const order = new Order(mockOrderData);
      await order.save();
      
      await order.updateStatus(OrderStatus.SHIPPED);
      expect(order.shippedDate).toBeDefined();
    });
  });

  // Payment Processing Tests
  describe('Payment Processing', () => {
    it('should process refund correctly', async () => {
      const order = new Order(mockOrderData);
      await order.save();
      
      await order.processRefund(20);
      expect(order.refundAmount).toBe(20);
      expect(order.paymentStatus).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    });

    it('should handle full refund correctly', async () => {
      const order = new Order(mockOrderData);
      await order.save();
      
      await order.processRefund(order.totalAmount);
      expect(order.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });
  });

  // Shipping Calculation Tests
  describe('Shipping Calculations', () => {
    it('should calculate correct shipping cost', async () => {
      const order = new Order(mockOrderData);
      const shippingCost = order.calculateShipping();
      expect(shippingCost).toBe(5.99); // Standard shipping rate
    });

    it('should calculate estimated delivery date', async () => {
      const order = new Order(mockOrderData);
      await order.save();
      
      await order.updateEstimatedDelivery();
      expect(order.estimatedDeliveryDate).toBeDefined();
    });
  });

  // Virtual Fields Tests
  describe('Virtual Fields', () => {
    it('should format total amount correctly', async () => {
      const order = new Order(mockOrderData);
      expect(order.formattedTotal).toBe('$59.98');
    });

    it('should track shipping status correctly', async () => {
      const order = new Order(mockOrderData);
      expect(order.isFullyShipped).toBe(false);
      
      await order.updateStatus(OrderStatus.SHIPPED);
      expect(order.isFullyShipped).toBe(true);
    });
  });

  // Static Methods Tests
describe('Static Methods', () => {
  it('should find orders by user', async () => {
    const order = new Order({
      user: mockUserId,
      orderNumber: `ORD${Date.now()}`,
      items: [{
        product: mockProductId,
        name: 'Test Product',
        quantity: 2,
        price: 29.99,
        subtotal: 59.98,
        sku: 'TEST-SKU-001',
        variant: {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKU-001'
        }
      }],
      totalAmount: 59.98,
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: false
      },
      paymentMethod: PaymentMethod.CREDIT_CARD,
      shippingMethod: ShippingMethod.STANDARD
    });
    
    await order.save();
    
    const userOrders = await Order.findByUser(mockUserId.toString());
    expect(userOrders.length).toBe(1);
  });

  it('should find orders by status', async () => {
    const order = new Order({
      user: mockUserId,
      orderNumber: `ORD${Date.now()}`,
      items: [{
        product: mockProductId,
        name: 'Test Product',
        quantity: 2,
        price: 29.99,
        subtotal: 59.98,
        sku: 'TEST-SKU-001',
        variant: {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKU-001'
        }
      }],
      totalAmount: 59.98,
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: false
      },
      paymentMethod: PaymentMethod.CREDIT_CARD,
      shippingMethod: ShippingMethod.STANDARD
    });
    
    await order.save();
    
    const pendingOrders = await Order.findByStatus(OrderStatus.PENDING);
    expect(pendingOrders.length).toBe(1);
  });

  it('should generate order analytics', async () => {
    const order = new Order(mockOrderData);
    await order.save();
    
    const analytics = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    expect(analytics).toBeDefined();
    expect(analytics.length).toBe(1);
    expect(analytics[0].count).toBe(1);
    expect(analytics[0]._id).toBe(OrderStatus.PENDING);
    expect(analytics[0].totalRevenue).toBe(59.98);
  });
});
});
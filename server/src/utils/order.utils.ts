import Order from '../models/order';

export const generateOrderNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Get count of orders for today
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const count = await Order.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  });

  // Generate sequence number
  const sequence = (count + 1).toString().padStart(4, '0');
  
  // Format: YYMMDD-XXXX (e.g., 240315-0001)
  return `${year}${month}${day}-${sequence}`;
}; 
import Link from 'next/link';

export default function Cart() {
  return (
    <div className="py-8 px-4">
      <h1 className="text-3xl md:text-4xl font-bold uppercase text-center mb-12 text-black">
        Shopping Cart
      </h1>

      <div className="max-w-4xl mx-auto">
        {/* Empty Cart State */}
        <div className="text-center py-16">
          <p className="text-xl mb-8 text-gray-800">Your cart is empty</p>
          <Link 
            href="/products" 
            className="inline-block bg-black text-white px-8 py-3 uppercase text-sm tracking-wider hover:opacity-80 transition-opacity"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Cart Items (commented out for now) */}
        {/* <div className="space-y-8">
          <div className="flex items-center gap-8 pb-8 border-b border-gray-200">
            <div className="w-24 h-24 bg-gray-200 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold mb-2 text-black">Sample Product</h3>
              <p className="text-gray-600 mb-2">Size: M | Color: Black</p>
              <div className="flex items-center gap-4">
                <select className="border border-gray-200 p-2 w-20 text-black bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-black">
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <button className="text-sm text-gray-500 hover:text-black transition-colors">
                  Remove
                </button>
              </div>
            </div>
            <div className="text-lg font-semibold text-black">$99.99</div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex justify-between text-lg font-semibold mb-8 text-black">
            <span>Subtotal</span>
            <span>$99.99</span>
          </div>
          <button className="w-full bg-black text-white py-4 uppercase text-sm tracking-wider hover:opacity-80 transition-opacity">
            Checkout
          </button>
        </div> */}
      </div>
    </div>
  );
} 
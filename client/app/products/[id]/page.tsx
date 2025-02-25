'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

interface ProductVariant {
  size: string;
  inStock: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: 'COMPLETE_SKATEBOARD' | 'DECK' | 'ACCESSORIES';
  brand: 'ELEMENT' | 'BAKER' | 'SANTA_CRUZ' | 'SPITFIRE' | 'INDEPENDENT' | 'SUPREME';
  image: string;
  description: string;
  specs: string[];
  variants: ProductVariant[];
}

// This would typically come from your API/database
const products: Product[] = [
  {
    id: 1,
    name: 'Element Complete Skateboard',
    price: 129.99,
    category: 'COMPLETE_SKATEBOARD',
    brand: 'ELEMENT',
    image: '/images/products/complete-1.jpg',
    description: 'A complete skateboard setup from Element, featuring their signature quality and style. Perfect for both beginners and experienced skaters.',
    specs: ['8.0" Width', 'Element Trucks', 'Element Wheels', 'Abec 7 Bearings'],
    variants: [
      { size: '7.75"', inStock: true },
      { size: '8.0"', inStock: true },
      { size: '8.25"', inStock: false }
    ]
  },
  {
    id: 2,
    name: 'Baker Team Deck',
    price: 59.99,
    category: 'DECK',
    brand: 'BAKER',
    image: '/images/products/deck-1.jpg',
    description: 'Professional-grade skateboard deck from Baker Skateboards. Known for their durability and perfect pop.',
    specs: ['7-ply Maple Construction', 'Medium Concave', 'Double Kick'],
    variants: [
      { size: '8.0"', inStock: true },
      { size: '8.25"', inStock: true },
      { size: '8.5"', inStock: true }
    ]
  },
  {
    id: 3,
    name: 'Independent Stage 11 Trucks',
    price: 49.99,
    category: 'ACCESSORIES',
    brand: 'INDEPENDENT',
    image: '/images/products/trucks-1.jpg',
    description: 'Industry standard Independent Stage 11 trucks. Known for their stability and grind performance.',
    specs: ['Stage 11 Hollow', 'High Performance', 'Superior Grinding'],
    variants: [
      { size: '139mm', inStock: true },
      { size: '149mm', inStock: true },
      { size: '159mm', inStock: true }
    ]
  },
  {
    id: 4,
    name: 'Spitfire Formula Four Wheels',
    price: 34.99,
    category: 'ACCESSORIES',
    brand: 'SPITFIRE',
    image: '/images/products/wheels-1.jpg',
    description: 'Professional grade Spitfire Formula Four wheels. Perfect blend of speed and grip.',
    specs: ['99a Durometer', 'Formula Four Urethane', 'Flat Spot Resistant'],
    variants: [
      { size: '52mm', inStock: true },
      { size: '54mm', inStock: true },
      { size: '56mm', inStock: true }
    ]
  },
  {
    id: 5,
    name: 'Girl Skateboard Deck',
    price: 54.99,
    category: 'DECK',
    brand: 'BAKER',
    image: '/images/products/deck-2.jpg',
    description: 'Classic Girl Skateboard deck featuring iconic Girl branding and superior construction.',
    specs: ['7-ply Maple', 'Medium Concave', 'Double Kick'],
    variants: [
      { size: '8.0"', inStock: true },
      { size: '8.25"', inStock: true },
      { size: '8.5"', inStock: false }
    ]
  },
  {
    id: 6,
    name: 'Santa Cruz Complete',
    price: 119.99,
    category: 'COMPLETE_SKATEBOARD',
    brand: 'SANTA_CRUZ',
    image: '/images/products/complete-2.jpg',
    description: 'Complete Santa Cruz skateboard setup, featuring classic Santa Cruz styling and quality components.',
    specs: ['Santa Cruz Deck', 'Cruz Trucks', 'OJ Wheels', 'Abec 5 Bearings'],
    variants: [
      { size: '7.75"', inStock: true },
      { size: '8.0"', inStock: true },
      { size: '8.25"', inStock: true }
    ]
  },
  {
    id: 7,
    name: 'Supreme Box Logo Deck',
    price: 199.99,
    category: 'DECK',
    brand: 'SUPREME',
    image: '/images/products/supreme-deck-1.jpg',
    description: 'Limited edition Supreme Box Logo deck. Collector\'s item featuring the iconic Supreme branding.',
    specs: ['7-ply Maple', 'Medium Concave', 'Limited Edition'],
    variants: [
      { size: '8.0"', inStock: true },
      { size: '8.25"', inStock: false },
      { size: '8.5"', inStock: false }
    ]
  },
  {
    id: 8,
    name: 'Supreme Skateboard Tool',
    price: 29.99,
    category: 'ACCESSORIES',
    brand: 'SUPREME',
    image: '/images/products/supreme-tool-1.jpg',
    description: 'Premium Supreme skateboard tool. All-in-one tool for maintaining your setup.',
    specs: ['All-in-One Design', 'Premium Steel Construction', 'Supreme Branded'],
    variants: [
      { size: 'One Size', inStock: true }
    ]
  },
  {
    id: 9,
    name: 'Supreme Grip Tape',
    price: 24.99,
    category: 'ACCESSORIES',
    brand: 'SUPREME',
    image: '/images/products/supreme-grip-1.jpg',
    description: 'High-quality Supreme grip tape featuring signature Supreme branding.',
    specs: ['Superior Grip', 'Easy Application', 'Supreme Branded'],
    variants: [
      { size: '9" x 33"', inStock: true }
    ]
  }
];

export default function ProductDetail() {
  const params = useParams();
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const product = products.find(p => p.id === Number(params.id));

  if (!product) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Product Not Found</h1>
          <Link 
            href="/products"
            className="inline-block bg-black text-white px-8 py-3 uppercase text-sm tracking-wider hover:opacity-80 transition-opacity"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.variants.length > 0 && !selectedSize) {
      return; // Don't add if size is required but not selected
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      size: selectedSize || 'One Size'
    });

    // Reset form
    setQuantity(1);
    setSelectedSize('');

    // Optional: Show success message or redirect to cart
    alert('Added to cart successfully!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 overflow-hidden">
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${product.image})` }}
            />
          </div>

          {/* Product Details */}
          <div>
            <nav className="mb-8">
              <Link 
                href="/products"
                className="text-sm uppercase tracking-wide text-gray-500 hover:text-black transition-colors"
              >
                Back to Shop
              </Link>
            </nav>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4 text-black">{product.name}</h1>
              <p className="text-2xl font-semibold text-black mb-6">${product.price.toFixed(2)}</p>
              <p className="text-gray-600 mb-6">{product.description}</p>
              
              {/* Specifications */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-black">Specifications</h2>
                <ul className="list-disc list-inside text-gray-600">
                  {product.specs.map((spec, index) => (
                    <li key={index}>{spec}</li>
                  ))}
                </ul>
              </div>

              {/* Size Selection */}
              {product.variants.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4 text-black">Size</h2>
                  <div className="flex gap-4">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        className={`px-4 py-2 border ${
                          selectedSize === variant.size
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-black'
                        } ${
                          !variant.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-black'
                        }`}
                        onClick={() => variant.inStock && setSelectedSize(variant.size)}
                        disabled={!variant.inStock}
                      >
                        {variant.size}
                        {!variant.inStock && ' - Out of Stock'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selection */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-black">Quantity</h2>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-gray-200 p-2 w-20 text-black bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              {/* Add to Cart Button */}
              <button 
                className="w-full bg-black text-white py-4 uppercase text-sm tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={product.variants.length > 0 && !selectedSize}
                onClick={handleAddToCart}
              >
                {product.variants.length > 0 && !selectedSize 
                  ? 'Please Select a Size' 
                  : 'Add to Cart'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
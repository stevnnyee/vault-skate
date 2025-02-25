'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function Products() {
  // State for filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Sample product data - in a real app, this would come from your API
  const products: Product[] = [
    {
      id: 1,
      name: 'Element Complete Skateboard',
      price: 129.99,
      category: 'COMPLETE_SKATEBOARD',
      brand: 'ELEMENT',
      image: '/images/products/complete-1.jpg',
      description: 'A great skateboard for all levels',
      specs: ['High-quality maple wood', '100% recycled materials'],
      variants: [
        { size: '9.5', inStock: true },
        { size: '10', inStock: true },
        { size: '10.5', inStock: true }
      ]
    },
    {
      id: 2,
      name: 'Baker Team Deck',
      price: 59.99,
      category: 'DECK',
      brand: 'BAKER',
      image: '/images/products/deck-1.jpg',
      description: 'A durable and stylish deck',
      specs: ['7-layer maple construction', '100% recycled materials'],
      variants: [
        { size: '8.5', inStock: true },
        { size: '9', inStock: true },
        { size: '9.5', inStock: true }
      ]
    },
    {
      id: 3,
      name: 'Independent Stage 11 Trucks',
      price: 49.99,
      category: 'ACCESSORIES',
      brand: 'INDEPENDENT',
      image: '/images/products/trucks-1.jpg',
      description: 'A reliable and versatile truck',
      specs: ['Aluminum construction', 'Adjustable'],
      variants: [
        { size: '11', inStock: true },
        { size: '12', inStock: true },
        { size: '13', inStock: true }
      ]
    },
    {
      id: 4,
      name: 'Spitfire Formula Four Wheels',
      price: 34.99,
      category: 'ACCESSORIES',
      brand: 'SPITFIRE',
      image: '/images/products/wheels-1.jpg',
      description: 'A high-performance wheel',
      specs: ['85A durometer', '100% recycled materials'],
      variants: [
        { size: '44', inStock: true },
        { size: '45', inStock: true },
        { size: '46', inStock: true }
      ]
    },
    {
      id: 5,
      name: 'Girl Skateboard Deck',
      price: 54.99,
      category: 'DECK',
      brand: 'BAKER',
      image: '/images/products/deck-2.jpg',
      description: 'A fun and colorful deck',
      specs: ['7-layer maple construction', '100% recycled materials'],
      variants: [
        { size: '8.5', inStock: true },
        { size: '9', inStock: true },
        { size: '9.5', inStock: true }
      ]
    },
    {
      id: 6,
      name: 'Santa Cruz Complete',
      price: 119.99,
      category: 'COMPLETE_SKATEBOARD',
      brand: 'SANTA_CRUZ',
      image: '/images/products/complete-2.jpg',
      description: 'A complete skateboard for all levels',
      specs: ['High-quality maple wood', '100% recycled materials'],
      variants: [
        { size: '9.5', inStock: true },
        { size: '10', inStock: true },
        { size: '10.5', inStock: true }
      ]
    },
    {
      id: 7,
      name: 'Supreme Box Logo Deck',
      price: 199.99,
      category: 'DECK',
      brand: 'SUPREME',
      image: '/images/products/supreme-deck-1.jpg',
      description: 'A stylish and durable deck',
      specs: ['7-layer maple construction', '100% recycled materials'],
      variants: [
        { size: '8.5', inStock: true },
        { size: '9', inStock: true },
        { size: '9.5', inStock: true }
      ]
    },
    {
      id: 8,
      name: 'Supreme Skateboard Tool',
      price: 29.99,
      category: 'ACCESSORIES',
      brand: 'SUPREME',
      image: '/images/products/supreme-tool-1.jpg',
      description: 'A high-quality skateboard tool',
      specs: ['Aluminum construction', 'Adjustable'],
      variants: [
        { size: '1', inStock: true },
        { size: '2', inStock: true },
        { size: '3', inStock: true }
      ]
    },
    {
      id: 9,
      name: 'Supreme Grip Tape',
      price: 24.99,
      category: 'ACCESSORIES',
      brand: 'SUPREME',
      image: '/images/products/supreme-grip-1.jpg',
      description: 'A high-performance grip tape',
      specs: ['100% recycled materials', 'High-quality adhesive'],
      variants: [
        { size: '1', inStock: true },
        { size: '2', inStock: true },
        { size: '3', inStock: true }
      ]
    }
  ];

  // Filter and sort products
  useEffect(() => {
    let result = [...products];

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Apply brand filter
    if (selectedBrand) {
      result = result.filter(product => product.brand === selectedBrand);
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        // For now, keep original order for 'newest'
        break;
    }

    setFilteredProducts(result);
  }, [selectedCategory, selectedBrand, sortOption]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] bg-black flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-50 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/products/products-hero.jpg')" }}
        />
        <h1 className="relative text-4xl md:text-6xl font-bold uppercase text-white text-center tracking-wider">
          Shop
        </h1>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-12">
          <div className="flex gap-4">
            <select 
              className="border border-gray-200 p-2 text-sm uppercase bg-white text-black rounded-none focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="COMPLETE_SKATEBOARD">Complete Skateboards</option>
              <option value="DECK">Decks</option>
              <option value="ACCESSORIES">Accessories</option>
            </select>
            <select 
              className="border border-gray-200 p-2 text-sm uppercase bg-white text-black rounded-none focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              <option value="SUPREME">Supreme</option>
              <option value="ELEMENT">Element</option>
              <option value="BAKER">Baker</option>
              <option value="SPITFIRE">Spitfire</option>
              <option value="INDEPENDENT">Independent</option>
              <option value="SANTA_CRUZ">Santa Cruz</option>
            </select>
          </div>
          <select 
            className="border border-gray-200 p-2 text-sm uppercase bg-white text-black rounded-none focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredProducts.map((product) => (
            <Link 
              key={product.id}
              href={`/products/${product.id}`}
              className="group block"
            >
              <div className="aspect-square bg-gray-100 mb-4 overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url(${product.image})` }}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-black group-hover:opacity-70 transition-opacity">
                {product.name}
              </h3>
              <p className="text-gray-800 font-medium">
                ${product.price.toFixed(2)}
              </p>
            </Link>
          ))}
        </div>

        {/* No Results Message */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No products found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
} 
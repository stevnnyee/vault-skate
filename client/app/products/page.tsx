export default function Products() {
  // Sample product data - in a real app, this would come from your API
  const products = [
    {
      id: 1,
      name: 'Element Complete Skateboard',
      price: 129.99,
      category: 'COMPLETE_SKATEBOARD',
      image: '/images/products/complete-1.jpg'
    },
    {
      id: 2,
      name: 'Baker Team Deck',
      price: 59.99,
      category: 'DECK',
      image: '/images/products/deck-1.jpg'
    },
    {
      id: 3,
      name: 'Independent Stage 11 Trucks',
      price: 49.99,
      category: 'ACCESSORIES',
      image: '/images/products/trucks-1.jpg'
    },
    {
      id: 4,
      name: 'Spitfire Formula Four Wheels',
      price: 34.99,
      category: 'ACCESSORIES',
      image: '/images/products/wheels-1.jpg'
    },
    {
      id: 5,
      name: 'Girl Skateboard Deck',
      price: 54.99,
      category: 'DECK',
      image: '/images/products/deck-2.jpg'
    },
    {
      id: 6,
      name: 'Santa Cruz Complete',
      price: 119.99,
      category: 'COMPLETE_SKATEBOARD',
      image: '/images/products/complete-2.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[40vh] bg-black flex items-center justify-center">
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
            <select className="border border-gray-200 p-2 text-sm uppercase bg-white text-black rounded-none focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]">
              <option value="">Category</option>
              <option value="COMPLETE_SKATEBOARD">Complete Skateboards</option>
              <option value="DECK">Decks</option>
              <option value="ACCESSORIES">Accessories</option>
            </select>
            <select className="border border-gray-200 p-2 text-sm uppercase bg-white text-black rounded-none focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]">
              <option value="">Brand</option>
              <option value="ELEMENT">Element</option>
              <option value="BAKER">Baker</option>
              <option value="SPITFIRE">Spitfire</option>
              <option value="INDEPENDENT">Independent</option>
              <option value="SANTA_CRUZ">Santa Cruz</option>
            </select>
          </div>
          <select className="border border-gray-200 p-2 text-sm uppercase bg-white text-black rounded-none focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]">
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {products.map((product) => (
            <a 
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
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 
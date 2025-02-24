export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="h-screen relative flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-[url('/images/hero/hero.jpg')] bg-cover bg-center opacity-50" />
        </div>
        
        {/* Content */}
        <div className="relative text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold uppercase mb-8 text-white tracking-wider">
            Vault
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90 tracking-wide">
            Premium skateboarding gear and apparel
          </p>
          <a 
            href="/products" 
            className="inline-block bg-white text-black px-12 py-4 uppercase text-sm tracking-wider hover:bg-opacity-90 transition-all duration-200"
          >
            Shop Now
          </a>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold uppercase mb-16 text-center text-black tracking-wide">
            Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Complete Skateboards', slug: 'COMPLETE_SKATEBOARD', display: 'Completes', image: '/images/categories/complete_skateboard.jpg' },
              { name: 'Skateboard Decks', slug: 'DECK', display: 'Decks', image: '/images/categories/deck.jpg' },
              { name: 'Accessories', slug: 'ACCESSORIES', display: 'Accessories', image: '/images/categories/accessories.jpg' }
            ].map((category) => (
              <a 
                key={category.slug}
                href={`/products?category=${category.slug}`} 
                className="group block"
              >
                <div className="aspect-square bg-gray-200 mb-6 flex items-center justify-center relative overflow-hidden">
                  {/* Category Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${category.image})` }}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300" />
                  {/* Text */}
                  <span className="relative text-2xl md:text-3xl uppercase text-white font-bold tracking-wider">
                    {category.display}
                  </span>
                </div>
                <h3 className="text-xl font-bold uppercase text-black tracking-wide group-hover:opacity-70 transition-opacity">
                  {category.name}
                </h3>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 
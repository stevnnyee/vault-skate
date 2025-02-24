export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-black flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-50 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/about/about-hero.jpg')" }}
        />
        <h1 className="relative text-4xl md:text-6xl font-bold uppercase text-white text-center tracking-wider">
          About Us
        </h1>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Introduction */}
        <div className="mb-24">
          <p className="text-xl md:text-2xl font-light text-black leading-relaxed tracking-wide text-justify">
            Welcome to Vault, the most premier destination for high-quality skateboarding gear. 
            We're more than just a shop – we're skaters who understand the importance of quality 
            equipment in progressing your skills.
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-4 mb-24">
          <div 
            className="aspect-square bg-cover bg-center hover:opacity-90 transition-opacity"
            style={{ backgroundImage: "url('/images/about/store-1.jpg')" }}
          />
          <div 
            className="aspect-square bg-cover bg-center hover:opacity-90 transition-opacity"
            style={{ backgroundImage: "url('/images/about/store-2.jpg')" }}
          />
        </div>

        {/* Our Story */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold uppercase mb-8 text-black tracking-wide">
            Our Story
          </h2>
          <div className="space-y-6 text-lg text-gray-800 leading-relaxed">
            <p>
              Founded by passionate skaters, Vault emerged from a simple vision: 
              to provide fellow skateboarders with premium gear through a clean, 
              straightforward shopping experience.
            </p>
            <p>
              We believe that quality equipment shouldn't be complicated to find or understand.
              Every product in our collection is hand-selected for its quality, durability, and performance.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold uppercase mb-12 text-black tracking-wide">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="group">
              <div 
                className="aspect-video bg-cover bg-center mb-6 group-hover:opacity-90 transition-opacity"
                style={{ backgroundImage: "url('/images/categories/complete_skateboard.jpg')" }}
              />
              <h3 className="text-xl font-bold mb-4 text-black uppercase tracking-wide">
                Premium Selection
              </h3>
              <p className="text-gray-800 leading-relaxed">
                Carefully curated complete skateboards, decks, trucks, wheels, and accessories 
                from the most respected brands in skateboarding.
              </p>
            </div>
            <div className="group">
              <div 
                className="aspect-video bg-cover bg-center mb-6 group-hover:opacity-90 transition-opacity"
                style={{ backgroundImage: "url('/images/categories/deck.jpg')" }}
              />
              <h3 className="text-xl font-bold mb-4 text-black uppercase tracking-wide">
                Expert Guidance
              </h3>
              <p className="text-gray-800 leading-relaxed">
                Whether you're a beginner or an experienced skater, we're here to help you 
                find the perfect setup for your style and skill level.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-12">
          <h2 className="text-3xl font-bold uppercase mb-12 text-black tracking-wide text-center">
            Get In Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-6 text-black uppercase tracking-wide">
                Location
              </h3>
              <p className="text-gray-800 leading-relaxed">
                123 Skate Street<br />
                Queens, NY<br />
                NYC NY 11378
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-6 text-black uppercase tracking-wide">
                Hours
              </h3>
              <p className="text-gray-800 leading-relaxed">
                Monday - Friday<br />
                <span className="font-medium">10am - 7pm</span><br /><br />
                Saturday<br />
                <span className="font-medium">11am - 6pm</span><br /><br />
                Sunday<br />
                <span className="font-medium">12pm - 5pm</span>
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-6 text-black uppercase tracking-wide">
                Contact
              </h3>
              <p className="text-gray-800 leading-relaxed">
                <a href="tel:+13473220128" className="hover:text-black transition-colors">
                  (347) 322-0128
                </a><br />
                <a href="mailto:stevnn.yee@gmail.com" className="hover:text-black transition-colors">
                  stevnn.yee@gmail.com
                </a><br />
                <a href="https://www.instagram.com/stevnn.yee/" className="hover:text-black transition-colors">
                  @stevnn.yee
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
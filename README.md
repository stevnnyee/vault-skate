# Vault Skate - Modern Skateboarding E-commerce Platform

A full-stack e-commerce application built with Next.js and Node.js, specializing in skateboarding equipment and accessories. The platform offers a seamless shopping experience with modern design and robust functionality.

## Features

### Customer Features
- **Product Browsing & Search**
  - Browse through a curated collection of skateboarding products
  - Filter products by category, brand, and price
  - Responsive product grid with detailed product cards

- **Shopping Cart**
  - Add/remove items with size selection
  - Real-time cart updates
  - Persistent cart data across sessions

- **Checkout Process**
  - Guest checkout support
  - Multiple payment methods (Credit Card, PayPal)
  - Shipping method selection
  - Address management for shipping/billing

- **Order Management**
  - Real-time order confirmation
  - Order tracking and history
  - Detailed order summaries

### Technical Features
- **Modern UI/UX**
  - Responsive design for all devices
  - Clean and intuitive interface
  - Smooth transitions and animations
  - Dark mode support

- **Performance**
  - Server-side rendering with Next.js
  - Optimized images and assets
  - Fast page loads and transitions

- **Security**
  - Secure payment processing
  - Data encryption
  - Protected API endpoints

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (React Framework)
- TypeScript
- Tailwind CSS
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB
- TypeScript

### Infrastructure
- Vercel (Deployment)
- MongoDB Atlas (Database)

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/vault-skate.git
cd vault-skate
\`\`\`

2. Install dependencies for both client and server:
\`\`\`bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
\`\`\`

3. Set up environment variables:

Create a \`.env\` file in the server directory:
\`\`\`env
PORT=3001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
\`\`\`

Create a \`.env.local\` file in the client directory:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

4. Start the development servers:

For the client:
\`\`\`bash
cd client
npm run dev
\`\`\`

For the server:
\`\`\`bash
cd server
npm run dev
\`\`\`

## Deployment

### Deploying to Vercel

1. Install Vercel CLI:
\`\`\`bash
npm install -g vercel
\`\`\`

2. Login to Vercel:
\`\`\`bash
vercel login
\`\`\`

3. Deploy the application:
\`\`\`bash
vercel
\`\`\`

4. For production deployment:
\`\`\`bash
vercel --prod
\`\`\`

## Configuration

### Environment Variables

#### Server
- \`PORT\`: Server port (default: 3001)
- \`MONGODB_URI\`: MongoDB connection string
- \`JWT_SECRET\`: Secret key for JWT token generation

#### Client
- \`NEXT_PUBLIC_API_URL\`: Backend API URL

## API Documentation

### Products

- \`GET /api/products\`: Get all products
- \`GET /api/products/:id\`: Get product by ID
- \`GET /api/products/search\`: Search products
- \`POST /api/products\`: Create new product (admin)
- \`PUT /api/products/:id\`: Update product (admin)
- \`DELETE /api/products/:id\`: Delete product (admin)

### Orders

- \`POST /api/orders\`: Create new order
- \`GET /api/orders/guest/:id\`: Get guest order by ID
- \`GET /api/orders/:id\`: Get order by ID (authenticated)
- \`PATCH /api/orders/:id/status\`: Update order status (admin)
- \`GET /api/orders/history\`: Get order history (authenticated)

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

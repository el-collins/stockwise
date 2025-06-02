# StockWise Frontend

A modern, responsive React frontend for the StockWise inventory management system built with TypeScript, Tailwind CSS, and modern UI components.

## 🚀 Features

### Dashboard
- **Real-time Analytics**: Interactive charts showing stock levels and order status distribution
- **Key Metrics**: Total products, orders, revenue, and low stock alerts
- **Recent Activity**: Latest orders and low stock notifications
- **Beautiful Charts**: Bar charts for stock levels and pie charts for order status using Recharts

### Product Management
- **CRUD Operations**: Create, read, update, and delete products
- **Stock Management**: Quick stock updates with adjustment buttons
- **Search & Filter**: Real-time search by name/SKU and category filtering
- **Stock Status**: Visual indicators for stock levels (In Stock, Low Stock, Out of Stock)
- **Responsive Grid**: Beautiful card-based product display

### Order Management
- **Order Creation**: Multi-step order form with product selection
- **Order Tracking**: Status updates and order timeline
- **Customer Management**: Customer information and order history
- **Status Management**: Easy status updates with dropdown selectors
- **Order Details**: Comprehensive order information with item breakdown

## 🛠️ Tech Stack

- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack Query** - Powerful data fetching and caching
- **React Router** - Client-side routing
- **React Hook Form** - Performant forms with validation
- **Zod** - Schema validation
- **Recharts** - Beautiful charts and data visualization
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications
- **Axios** - HTTP client

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 🔧 Configuration

### API Configuration
Update the API base URL in `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'https://localhost:5001/api';
```

### Environment Variables
Create a `.env` file for environment-specific configuration:
```env
VITE_API_BASE_URL=https://localhost:5001/api
```

## 🎨 UI Components

The application uses a custom component library built on top of Radix UI primitives:

- **Button** - Various styles and sizes
- **Card** - Content containers
- **Dialog** - Modal dialogs
- **Input** - Form inputs
- **Label** - Form labels

All components are fully accessible and follow modern design patterns.

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## 🔍 Key Features

### Real-time Updates
- Automatic data refetching
- Optimistic updates
- Error handling with retry logic

### Modern UX
- Loading states
- Error boundaries
- Toast notifications
- Smooth animations

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## 🚀 Getting Started

1. **Prerequisites**:
   - Node.js 18+ 
   - npm or yarn
   - StockWise API running on `https://localhost:5001`

2. **Quick Start**:
   ```bash
   # Clone the repository
   git clone <repository-url>
   
   # Navigate to frontend directory
   cd stockwise.client
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5173`

## 📊 Performance

- **Bundle Size**: Optimized with Vite
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Intelligent query caching with TanStack Query
- **Lazy Loading**: Components loaded on demand

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks (if configured)

## 🔐 Security

- **Input Validation**: All forms use Zod schemas
- **XSS Protection**: React's built-in protection
- **HTTPS**: Secure API communication
- **Error Handling**: Graceful error boundaries

## 📈 Future Enhancements

- [ ] Dark mode support
- [ ] Offline functionality
- [ ] Real-time notifications via WebSocket
- [ ] Advanced filtering and sorting
- [ ] Export functionality
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using modern web technologies for the best user experience.

import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { productsApi, ordersApi } from '../lib/api';
import { OrderStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: productsApi.getLowStock,
  });

  // Calculate statistics
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const lowStockCount = lowStockProducts.length;
  const totalRevenue = orders
    .filter(order => order.status !== OrderStatus.Cancelled)
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Chart data
  const stockData = products.map(product => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    stock: product.stockQuantity,
    threshold: product.lowStockThreshold,
  }));

  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === OrderStatus.Pending).length, color: '#fbbf24' },
    { name: 'Confirmed', value: orders.filter(o => o.status === OrderStatus.Confirmed).length, color: '#3b82f6' },
    { name: 'Processing', value: orders.filter(o => o.status === OrderStatus.Processing).length, color: '#8b5cf6' },
    { name: 'Shipped', value: orders.filter(o => o.status === OrderStatus.Shipped).length, color: '#06b6d4' },
    { name: 'Delivered', value: orders.filter(o => o.status === OrderStatus.Delivered).length, color: '#10b981' },
    { name: 'Cancelled', value: orders.filter(o => o.status === OrderStatus.Cancelled).length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const statsCards = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      description: "Active products in inventory",
      trend: "+12% from last month"
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      description: "Orders processed",
      trend: "+8% from last month"
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount,
      icon: AlertTriangle,
      description: "Products below threshold",
      trend: lowStockCount > 0 ? "Attention needed" : "All good"
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Revenue from confirmed orders",
      trend: "+15% from last month"
    }
  ];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Pending: return 'text-yellow-600';
      case OrderStatus.Confirmed: return 'text-blue-600';
      case OrderStatus.Processing: return 'text-purple-600';
      case OrderStatus.Shipped: return 'text-cyan-600';
      case OrderStatus.Delivered: return 'text-green-600';
      case OrderStatus.Cancelled: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    return OrderStatus[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your inventory.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {card.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock Levels Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
            <CardDescription>
              Current stock vs. low stock thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
                <Bar dataKey="threshold" fill="#ef4444" name="Threshold" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of orders by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders from customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                    <p className={`text-xs ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </p>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>
              Products that need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {product.stockQuantity} left
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Threshold: {product.lowStockThreshold}
                    </p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All products are well stocked!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 
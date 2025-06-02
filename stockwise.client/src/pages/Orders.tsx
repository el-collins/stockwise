import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Eye, 
  // Edit, 
  X,
  ShoppingCart,
  Calendar,
  User,
  // DollarSign,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

import { ordersApi, productsApi } from '../lib/api';
import OrderForm from '../components/orders/OrderForm';
import OrderDetails from '../components/orders/OrderDetails';
import type { CreateOrderDto, Order } from '../types';
import { OrderStatus } from '../types';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateDialogOpen(false);
      toast.success('Order created successfully!');
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || 'Failed to create order');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      ordersApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully!');
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || 'Failed to update order status');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Order cancelled successfully!');
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || 'Failed to cancel order');
    },
  });

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = (data: CreateOrderDto) => {
    createMutation.mutate(data);
  };

  const handleUpdateStatus = (orderId: number, status: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status });
  };

  const handleCancelOrder = (orderId: number) => {
    if (confirm('Are you sure you want to cancel this order? This will restore the stock.')) {
      cancelMutation.mutate(orderId);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Pending: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.Confirmed: return 'bg-blue-100 text-blue-800';
      case OrderStatus.Processing: return 'bg-purple-100 text-purple-800';
      case OrderStatus.Shipped: return 'bg-cyan-100 text-cyan-800';
      case OrderStatus.Delivered: return 'bg-green-100 text-green-800';
      case OrderStatus.Cancelled: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.Confirmed: return 'Confirmed';
      case OrderStatus.Processing: return 'Processing';
      case OrderStatus.Shipped: return 'Shipped';
      case OrderStatus.Delivered: return 'Delivered';
      case OrderStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const statusOptions = [
    { value: OrderStatus.Pending, label: 'Pending' },
    { value: OrderStatus.Confirmed, label: 'Confirmed' },
    { value: OrderStatus.Processing, label: 'Processing' },
    { value: OrderStatus.Shipped, label: 'Shipped' },
    { value: OrderStatus.Delivered, label: 'Delivered' },
    { value: OrderStatus.Cancelled, label: 'Cancelled' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track their progress.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <OrderForm
              products={products}
              onSubmit={handleCreateOrder}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>{order.orderItems.length} item(s)</span>
                    </div>
                  </div>

                  <div className="text-lg font-semibold text-primary">
                    ${order.totalAmount.toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>

                  {order.status !== OrderStatus.Cancelled && order.status !== OrderStatus.Delivered && (
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, parseInt(e.target.value) as OrderStatus)}
                      className="px-3 py-1 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  )}

                  {(order.status === OrderStatus.Pending || order.status === OrderStatus.Confirmed) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== ''
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first order.'}
            </p>
            {!searchTerm && statusFilter === '' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Order
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <OrderDetails order={selectedOrder} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Orders; 
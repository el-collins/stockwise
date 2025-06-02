import { OrderStatus, type Order } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Calendar, User, Package, DollarSign } from 'lucide-react';

interface OrderDetailsProps {
  order: Order;
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
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
    return OrderStatus[status];
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{order.orderNumber}</h2>
          <p className="text-muted-foreground">
            Created on {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.customerEmail}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-medium">{order.orderItems.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium text-lg">${order.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(order.updatedAt).toLocaleDateString()} at{' '}
                {new Date(order.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
          <CardDescription>
            Items included in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{item.productName}</h4>
                  <p className="text-sm text-muted-foreground">SKU: {item.productSKU}</p>
                  <p className="text-sm text-muted-foreground">
                    Unit Price: ${item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-center min-w-[80px]">
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{item.quantity}</p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Order Total:</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Order Timeline
          </CardTitle>
          <CardDescription>
            Status updates and important events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Order Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Order {order.orderNumber} was created for {order.customerName}
                </p>
              </div>
            </div>

            {order.createdAt !== order.updatedAt && (
              <div className="flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  order.status === OrderStatus.Cancelled ? 'bg-red-600' : 'bg-green-600'
                }`}></div>
                <div>
                  <p className="font-medium">Status Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.updatedAt).toLocaleDateString()} at{' '}
                    {new Date(order.updatedAt).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Order status changed to: {getStatusText(order.status)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetails; 
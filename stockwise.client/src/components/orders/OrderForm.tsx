import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Minus, Search } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { CreateOrderDto, Product } from '../../types';

const orderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Name must be less than 100 characters'),
  customerEmail: z.string().email('Invalid email address'),
  orderItems: z.array(z.object({
    productId: z.number().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  products: Product[];
  onSubmit: (data: CreateOrderDto) => void;
  isLoading: boolean;
}

const OrderForm = ({ products, onSubmit, isLoading }: OrderFormProps) => {
  const [productSearch, setProductSearch] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    // setValue,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      orderItems: [{ productId: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'orderItems',
  });

  const watchedItems = watch('orderItems');

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getAvailableProducts = (currentIndex: number) => {
    const selectedProductIds = watchedItems
      .map((item, index) => index !== currentIndex ? item.productId : null)
      .filter(id => id !== null);
    
    return products.filter(product => 
      !selectedProductIds.includes(product.id) &&
      product.isActive &&
      product.stockQuantity > 0 &&
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  };

  const getMaxQuantity = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.stockQuantity : 0;
  };

  const handleFormSubmit = (data: OrderFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                {...register('customerName')}
                placeholder="Enter customer name"
                className={errors.customerName ? 'border-red-500' : ''}
              />
              {errors.customerName && (
                <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                placeholder="Enter customer email"
                className={errors.customerEmail ? 'border-red-500' : ''}
              />
              {errors.customerEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.customerEmail.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const availableProducts = getAvailableProducts(index);
              const selectedProduct = products.find(p => p.id === watchedItems[index]?.productId);
              const maxQuantity = selectedProduct ? getMaxQuantity(selectedProduct.id) : 0;

              return (
                <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor={`product-${index}`}>Product</Label>
                    <select
                      id={`product-${index}`}
                      {...register(`orderItems.${index}.productId`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value={0}>Select a product</option>
                      {availableProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${product.price.toFixed(2)} (Stock: {product.stockQuantity})
                        </option>
                      ))}
                    </select>
                    {errors.orderItems?.[index]?.productId && (
                      <p className="text-sm text-red-500 mt-1">Product is required</p>
                    )}
                  </div>

                  <div className="w-24">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      max={maxQuantity}
                      {...register(`orderItems.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="1"
                      className={errors.orderItems?.[index]?.quantity ? 'border-red-500' : ''}
                    />
                    {errors.orderItems?.[index]?.quantity && (
                      <p className="text-sm text-red-500 mt-1">{errors.orderItems[index]?.quantity?.message}</p>
                    )}
                  </div>

                  <div className="w-24 text-right">
                    {selectedProduct && (
                      <div className="text-sm font-medium">
                        ${(selectedProduct.price * (watchedItems[index]?.quantity || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            {errors.orderItems?.root && (
              <p className="text-sm text-red-500">{errors.orderItems.root.message}</p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ productId: 0, quantity: 1 })}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {watchedItems.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              if (!product || item.productId === 0) return null;

              return (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">
                    {product.name} × {item.quantity}
                  </span>
                  <span className="text-sm font-medium">
                    ${(product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading || calculateTotal() === 0}>
          {isLoading ? 'Creating Order...' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
};

export default OrderForm; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Product, CreateProductDto, UpdateProductDto } from '../../types';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stockQuantity: z.number().min(0, 'Stock quantity cannot be negative'),
  lowStockThreshold: z.number().min(0, 'Low stock threshold cannot be negative'),
  category: z.string().max(50, 'Category must be less than 50 characters').optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => void;
  isLoading: boolean;
  submitLabel: string;
}

const ProductForm = ({ initialData, onSubmit, isLoading, submitLabel }: ProductFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || '',
      sku: initialData.sku,
      price: initialData.price,
      stockQuantity: initialData.stockQuantity,
      lowStockThreshold: initialData.lowStockThreshold,
      category: initialData.category || '',
    } : {
      name: '',
      description: '',
      sku: '',
      price: 0,
      stockQuantity: 0,
      lowStockThreshold: 0,
      category: '',
    },
  });

  const handleFormSubmit = (data: ProductFormData) => {
    const submitData = {
      ...data,
      description: data.description || undefined,
      category: data.category || undefined,
    };
    
    // If this is an update (has initialData), we only include the fields that can be updated
    if (initialData) {
      const updateData: UpdateProductDto = {
        name: submitData.name,
        description: submitData.description,
        price: submitData.price,
        stockQuantity: submitData.stockQuantity,
        lowStockThreshold: submitData.lowStockThreshold,
        category: submitData.category,
      };
      onSubmit(updateData);
    } else {
      // For create, we need all fields including SKU
      const createData: CreateProductDto = {
        name: submitData.name,
        description: submitData.description,
        sku: submitData.sku,
        price: submitData.price,
        stockQuantity: submitData.stockQuantity,
        lowStockThreshold: submitData.lowStockThreshold,
        category: submitData.category,
      };
      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter product name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            {...register('sku')}
            placeholder="Enter SKU"
            disabled={!!initialData} // Disable SKU editing for updates
            className={errors.sku ? 'border-red-500' : ''}
          />
          {errors.sku && (
            <p className="text-sm text-red-500 mt-1">{errors.sku.message}</p>
          )}
          {initialData && (
            <p className="text-xs text-muted-foreground mt-1">SKU cannot be changed</p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            {...register('category')}
            placeholder="Enter category"
            className={errors.category ? 'border-red-500' : ''}
          />
          {errors.category && (
            <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            placeholder="0.00"
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && (
            <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="stockQuantity">Stock Quantity *</Label>
          <Input
            id="stockQuantity"
            type="number"
            {...register('stockQuantity', { valueAsNumber: true })}
            placeholder="0"
            className={errors.stockQuantity ? 'border-red-500' : ''}
          />
          {errors.stockQuantity && (
            <p className="text-sm text-red-500 mt-1">{errors.stockQuantity.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lowStockThreshold">Low Stock Threshold *</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            {...register('lowStockThreshold', { valueAsNumber: true })}
            placeholder="0"
            className={errors.lowStockThreshold ? 'border-red-500' : ''}
          />
          {errors.lowStockThreshold && (
            <p className="text-sm text-red-500 mt-1">{errors.lowStockThreshold.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Enter product description"
            rows={3}
            className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm; 
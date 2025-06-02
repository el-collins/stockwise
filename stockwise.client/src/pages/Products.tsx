import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Package,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';

import { productsApi } from '../lib/api';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';
import ProductForm from '../components/products/ProductForm';
import StockUpdateDialog from '../components/products/StockUpdateDialog';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateDialogOpen(false);
      toast.success('Product created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      toast.success('Product updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      productsApi.updateStock(id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsStockDialogOpen(false);
      setSelectedProduct(null);
      toast.success('Stock updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    },
  });

  // Filter products
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(products.map((p: Product) => p.category).filter(Boolean))];

  const handleCreateProduct = (data: CreateProductDto) => {
    createMutation.mutate(data);
  };

  const handleUpdateProduct = (data: UpdateProductDto) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data });
    }
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdateStock = (quantity: number) => {
    if (selectedProduct) {
      updateStockMutation.mutate({ id: selectedProduct.id, quantity });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    } else {
      return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and stock levels.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              onSubmit={handleCreateProduct}
              isLoading={createMutation.isPending}
              submitLabel="Create Product"
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
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((category: string) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product: Product) => {
          const stockStatus = getStockStatus(product);
          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      SKU: {product.sku}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-semibold">${product.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stock</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{product.stockQuantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsStockDialogOpen(true);
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>

                  {product.category && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="text-sm">{product.category}</span>
                    </div>
                  )}

                  {product.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || categoryFilter
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first product.'}
            </p>
            {!searchTerm && !categoryFilter && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              initialData={selectedProduct}
              onSubmit={handleUpdateProduct}
              isLoading={updateMutation.isPending}
              submitLabel="Update Product"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      {selectedProduct && (
        <StockUpdateDialog
          product={selectedProduct}
          open={isStockDialogOpen}
          onOpenChange={setIsStockDialogOpen}
          onSubmit={handleUpdateStock}
          isLoading={updateStockMutation.isPending}
        />
      )}
    </div>
  );
};

export default Products; 
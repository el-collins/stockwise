import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Product } from '../../types';


interface StockUpdateDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (quantity: number) => void;
  isLoading: boolean;
}

const StockUpdateDialog = ({
  product,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: StockUpdateDialogProps) => {
  const [quantity, setQuantity] = useState(product.stockQuantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity >= 0) {
      onSubmit(quantity);
    }
  };

  const handleQuickAdjust = (adjustment: number) => {
    setQuantity(Math.max(0, quantity + adjustment));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            <p className="text-sm text-muted-foreground">
              Current Stock: {product.stockQuantity}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="quantity">New Stock Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Enter new quantity"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Quick Adjustments:</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(-10)}
                >
                  -10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(-5)}
                >
                  -5
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(-1)}
                >
                  -1
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(1)}
                >
                  +1
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(5)}
                >
                  +5
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(10)}
                >
                  +10
                </Button>
              </div>
            </div>

            {quantity <= product.lowStockThreshold && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ This quantity is at or below the low stock threshold ({product.lowStockThreshold})
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Stock'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockUpdateDialog; 
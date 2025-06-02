export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  category?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  category?: string;
  isActive?: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

export interface CreateOrderDto {
  customerName: string;
  customerEmail: string;
  orderItems: CreateOrderItemDto[];
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSKU: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
}

export enum OrderStatus {
  Pending = 0,
  Confirmed = 1,
  Processing = 2,
  Shipped = 3,
  Delivered = 4,
  Cancelled = 5
}

export interface UpdateStockDto {
  quantity: number;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Authentication types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  expires: string;
  user: User;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
} 
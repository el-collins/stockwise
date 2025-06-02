import axios from 'axios';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  Order,
  CreateOrderDto,
  UpdateStockDto,
  UpdateOrderStatusDto,
  User,
  LoginDto,
  RegisterDto,
  AuthResponse,
  UpdateUserDto,
  ChangePasswordDto
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5127/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Accept self-signed certificates in development
  httpsAgent: import.meta.env.NODE_ENV === 'development' ? {
    rejectUnauthorized: false
  } : undefined
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized response
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: (data: LoginDto): Promise<AuthResponse> =>
    apiClient.post('/Auth/login', data).then(res => res.data),
    
  register: (data: RegisterDto): Promise<AuthResponse> =>
    apiClient.post('/Auth/register', data).then(res => res.data),
    
  getProfile: (): Promise<User> =>
    apiClient.get('/Auth/profile').then(res => res.data),
    
  updateProfile: (data: UpdateUserDto): Promise<User> =>
    apiClient.put('/Auth/profile', data).then(res => res.data),
    
  changePassword: (data: ChangePasswordDto): Promise<void> =>
    apiClient.post('/Auth/change-password', data).then(() => {}),
    
  logout: (): Promise<void> =>
    apiClient.post('/Auth/logout').then(() => {}),
    
  validateToken: (token: string): Promise<{ isValid: boolean }> =>
    apiClient.post('/Auth/validate-token', token).then(res => res.data),
};

// Products API
export const productsApi = {
  getAll: (): Promise<Product[]> => 
    apiClient.get('/products').then(res => res.data),
    
  getById: (id: number): Promise<Product> =>
    apiClient.get(`/products/${id}`).then(res => res.data),
    
  getBySku: (sku: string): Promise<Product> =>
    apiClient.get(`/products/sku/${sku}`).then(res => res.data),
    
  create: (data: CreateProductDto): Promise<Product> =>
    apiClient.post('/products', data).then(res => res.data),
    
  update: (id: number, data: UpdateProductDto): Promise<Product> =>
    apiClient.put(`/products/${id}`, data).then(res => res.data),
    
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/products/${id}`).then(() => {}),
    
  updateStock: (id: number, data: UpdateStockDto): Promise<void> =>
    apiClient.patch(`/products/${id}/stock`, data).then(() => {}),
    
  getLowStock: (): Promise<Product[]> =>
    apiClient.get('/products/low-stock').then(res => res.data),
};

// Orders API
export const ordersApi = {
  getAll: (): Promise<Order[]> =>
    apiClient.get('/orders').then(res => res.data),
    
  getById: (id: number): Promise<Order> =>
    apiClient.get(`/orders/${id}`).then(res => res.data),
    
  getByNumber: (orderNumber: string): Promise<Order> =>
    apiClient.get(`/orders/number/${orderNumber}`).then(res => res.data),
    
  create: (data: CreateOrderDto): Promise<Order> =>
    apiClient.post('/orders', data).then(res => res.data),
    
  updateStatus: (id: number, data: UpdateOrderStatusDto): Promise<Order> =>
    apiClient.patch(`/orders/${id}/status`, data).then(res => res.data),
    
  cancel: (id: number): Promise<void> =>
    apiClient.post(`/orders/${id}/cancel`).then(() => {}),
};

// Token management utilities
export const tokenUtils = {
  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
  
  removeToken: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },
  
  setUser: (user: User) => {
    localStorage.setItem('authUser', JSON.stringify(user));
  },
  
  getUser: (): User | null => {
    const userStr = localStorage.getItem('authUser');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};

export { apiClient }; 
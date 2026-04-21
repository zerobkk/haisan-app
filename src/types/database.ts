export type UserRole = 'admin' | 'staff';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  import_price: number;
  packaging: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  phone: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  is_low_stock: boolean;
  product?: Product;
}

export interface DailyStats {
  date: string;
  total_revenue: number;
  total_orders: number;
  total_profit: number;
}

export interface ProductStats {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
  total_profit: number;
}

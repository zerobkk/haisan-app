-- Database Schema for Hải Sản App
-- Run this in Supabase SQL Editor

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for admins to read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create policy for admins to update profiles
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create policy for insert (only by trigger)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  import_price NUMERIC NOT NULL DEFAULT 0,
  packaging TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Everyone can read products
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Auth users can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Auth users can manage customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Auth users can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. Order Items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  is_low_stock BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Auth users can manage order_items" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'staff');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  count_today INT;
  new_code TEXT;
BEGIN
  today := TO_CHAR(CURRENT_DATE, 'YYMMDD');

  SELECT COUNT(*) + 1 INTO count_today
  FROM customers
  WHERE customer_code LIKE 'KD-' || today || '-%';

  new_code := 'KD-' || today || '-' || LPAD(count_today::TEXT, 3, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

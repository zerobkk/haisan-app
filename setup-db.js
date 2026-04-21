const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

async function setupDatabase() {
  const tables = [
    {
      name: 'profiles',
      schema: `
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    },
    {
      name: 'products',
      schema: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        quantity NUMERIC NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'kg',
        import_price NUMERIC NOT NULL DEFAULT 0,
        packaging TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    },
    {
      name: 'customers',
      schema: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    },
    {
      name: 'orders',
      schema: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    },
    {
      name: 'order_items',
      schema: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity NUMERIC NOT NULL,
        unit_price NUMERIC NOT NULL,
        is_low_stock BOOLEAN NOT NULL DEFAULT FALSE
      `
    }
  ];

  for (const table of tables) {
    console.log(`Creating table: ${table.name}`);
  }

  console.log('\n=== Setup complete ===');
  console.log('Please run the SQL below in Supabase SQL Editor:\n');

  const sql = `-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  import_price NUMERIC NOT NULL DEFAULT 0,
  packaging TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Auth users can manage products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Auth users can manage customers" ON customers FOR ALL USING (auth.role() = 'authenticated');

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Auth users can manage orders" ON orders FOR ALL USING (auth.role() = 'authenticated');

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  is_low_stock BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Auth users can manage order_items" ON order_items FOR ALL USING (auth.role() = 'authenticated');

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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  console.log(sql);
}

setupDatabase().catch(console.error);
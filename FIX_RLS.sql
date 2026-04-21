-- Chạy SQL này trong Supabase SQL Editor để fix RLS
-- Xóa policies cũ và tạo policies mới cho phép đọc tất cả

-- Drop old policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new public read policy
CREATE POLICY "Public can read all profiles" ON profiles
  FOR SELECT USING (true);

-- Create policy for authenticated users to update (use API)
CREATE POLICY "Service can manage profiles" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant access to auth.users for the trigger
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON profiles TO postgres;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
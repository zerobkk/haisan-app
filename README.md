# Hải Sản - Quản lý bán hàng nội bộ

## Setup

### 1. Tạo Supabase Project

1. Vào https://supabase.com và tạo project mới
2. Lấy URL và ANON_KEY từ Settings > API

### 2. Setup Database

1. Mở Supabase Dashboard > SQL Editor
2. Copy nội dung trong `SUPABASE_SETUP.md` và chạy

### 3. Cấu hình Environment

```bash
cp .env.local.example .env.local
```

Sửa các giá trị trong `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: URL từ Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ANON_KEY từ Supabase

### 4. Chạy local

```bash
npm run dev
```

### 5. Deploy

Deploy lên Vercel (miễn phí):
1. Push code lên GitHub
2. Vào https://vercel.com, import project
3. Thêm environment variables trong Settings
4. Deploy

## Tính năng

- **Kho hàng**: Thêm/sửa/xóa sản phẩm, theo dõi tồn kho
- **Đơn hàng**: Tạo đơn, chọn khách hàng/sản phẩm, xác nhận đơn
- **Tài chính**: Thống kê doanh thu/lợi nhuận theo ngày/tuần/tháng
- **Admin**: Quản lý users, backup dữ liệu

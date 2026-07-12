# 🌱 GAG2 Shop — Grow A Garden 2

Shop bán item / seed / gear game Grow A Garden 2. Built with **Next.js** + **Supabase**, deploy lên **Vercel**.

## Kiến trúc

```
Frontend (Next.js)          →  Vercel
    ↓ fetch /api/*
Backend (API Routes)        →  Vercel Serverless Functions
    ↓ supabase-js
Database (Supabase)         →  PostgreSQL hosted
```

### Cấu trúc thư mục

```
├── app/
│   ├── api/
│   │   ├── products/route.ts   ← API sản phẩm
│   │   ├── orders/route.ts     ← API đơn hàng
│   │   └── contact/route.ts    ← API liên hệ
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                  ← UI components
├── lib/
│   ├── supabase.ts             ← Supabase client
│   ├── database.types.ts       ← TypeScript types
│   └── products.ts             ← Data types + API helpers
├── supabase/
│   └── schema.sql              ← Database schema
├── vercel.json
└── .env.example
```

## 🚀 Hướng dẫn Deploy

### Bước 1: Tạo Supabase Project

1. Vào [supabase.com](https://supabase.com) → **New Project**
2. Chọn region gần VN (Singapore)
3. Vào **SQL Editor** → paste nội dung file `supabase/schema.sql` → **Run**
4. Vào **Settings → API** → copy:
   - `Project URL` → đây là `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → đây là `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Bước 2: Push code lên GitHub

```bash
git init
git add .
git commit -m "GAG2 Shop - initial"
git remote add origin https://github.com/YOUR_USER/gag2-shop.git
git push -u origin main
```

### Bước 3: Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com) → **Import Project** → chọn repo GitHub
2. Framework: **Next.js** (tự detect)
3. Thêm **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL từ bước 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key từ bước 1
4. Bấm **Deploy** → xong!

### Bước 4: Truy cập

- Web sẽ có link dạng: `https://gag2-shop.vercel.app`
- Ai có link đều truy cập được, không giới hạn máy

## 🛠 Phát triển local

```bash
# Copy env
cp .env.example .env.local
# Sửa .env.local với Supabase credentials

# Install
npm install

# Dev server
npm run dev
# → http://localhost:3000
```

## 📋 Database Schema

Xem file `supabase/schema.sql` — gồm 3 bảng:
- **products**: Sản phẩm (seed, gear, item)
- **orders**: Đơn hàng
- **contact**: Thông tin liên hệ shop

Schema đã bao gồm:
- Row Level Security (RLS) policies
- Sample data (6 sản phẩm mặc định)
- Stored procedure `increment_sold` cho update stock

## ⚡ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React, CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Auth | Supabase RLS (public read) |
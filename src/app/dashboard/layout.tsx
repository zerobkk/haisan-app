'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard/kho-hang', label: 'Kho hàng', icon: '📦' },
    { href: '/dashboard/don-hang', label: 'Đơn hàng', icon: '📋' },
    { href: '/dashboard/tai-chinh', label: 'Tài chính', icon: '💰' },
    { href: '/dashboard/cai-dat', label: 'Cài đặt', icon: '⚙️' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: '#0f172a'}}>
      <nav className="sticky top-0 z-50" style={{background: '#1e293b', borderBottom: '1px solid #334155'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-white">🐟 Hải Sản</span>
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-600'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-400 hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-white"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden" style={{borderTop: '1px solid #334155'}}>
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-2 py-1 text-xs ${
                  pathname === item.href
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
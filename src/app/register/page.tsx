'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#0f172a'}}>
        <div className="max-w-md w-full text-center" style={{background: '#1e293b', padding: '2rem', borderRadius: '1rem'}}>
          <div className="bg-green-900/50 border border-green-600 text-green-300 px-4 py-3 rounded mb-4">
            Đăng ký thành công! Vui lòng kiểm tra email để xác thực.
          </div>
          <a
            href="/login"
            className="text-blue-400 hover:text-blue-300"
          >
            Quay lại đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#0f172a'}}>
      <div className="max-w-md w-full space-y-8" style={{background: '#1e293b', padding: '2rem', borderRadius: '1rem'}}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Đăng ký</h2>
          <p className="mt-2 text-sm text-slate-400">
            Tạo tài khoản mới
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
                style={{background: '#334155', border: '1px solid #475569', color: '#f1f5f9'}}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                style={{background: '#334155', border: '1px solid #475569', color: '#f1f5f9'}}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Nhập lại mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                style={{background: '#334155', border: '1px solid #475569', color: '#f1f5f9'}}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>

          <div className="text-center">
            <a href="/login" className="text-sm text-blue-400 hover:text-blue-300">
              Đã có tài khoản? Đăng nhập
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
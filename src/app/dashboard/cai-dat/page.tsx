'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export default function CaiDatPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const supabase = createClient();

  useEffect(() => {
    fetchProfiles();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('Profile data:', data, error);
      if (data) {
        setProfile(data);
        console.log('Profile role:', data.role);
      }
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'staff') => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    
    if (error) {
      setMessage({ type: 'error', text: 'Lỗi cập nhật quyền' });
    } else {
      setMessage({ type: 'success', text: 'Cập nhật thành công' });
      fetchProfiles();
      if (userId === profile?.id) {
        fetchCurrentUser();
      }
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) {
      setMessage({ type: 'error', text: 'Lỗi xóa người dùng' });
    } else {
      setMessage({ type: 'success', text: 'Xóa thành công' });
      fetchProfiles();
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const setUserAsAdmin = async (userId: string, email: string) => {
    if (!confirm(`Set ${email} thành Admin?`)) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchProfiles();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    
    setMessage({ 
      type: 'success', 
      text: `Đã copy link mời! Gửi link này cho ${inviteEmail} để đăng ký:` 
    });
    setShowInviteModal(false);
    setInviteEmail('');
    setTimeout(() => setMessage({ type: '', text: '' }), 8000);
  };

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Đang tải...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-black mb-2">Cài đặt</h1>
      <p className="text-sm text-slate-400 mb-6">Version 1.0.0</p>

      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-black">Tài khoản của bạn</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-black">{profile?.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Vai trò</div>
              <div className="font-medium text-black">
                {profile?.role === 'admin' ? '👑 Quản lý (Admin)' : '👤 Nhân viên (Staff)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-black">Vai trò & Quyền hạn</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👑</span>
                <span className="font-semibold text-black">Admin (Quản lý)</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Xem & quản lý tất cả đơn hàng</li>
                <li>✓ Xem báo cáo tài chính</li>
                <li>✓ Quản lý kho hàng</li>
                <li>✓ Quản lý người dùng</li>
                <li>✓ Xuất dữ liệu backup</li>
              </ul>
            </div>
            <div className="flex-1 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👤</span>
                <span className="font-semibold text-black">Staff (Nhân viên)</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Xem & tạo đơn hàng</li>
                <li>✓ Xem kho hàng</li>
                <li>✗ Không xem báo cáo tài chính</li>
                <li>✗ Không quản lý người dùng</li>
                <li>✗ Không xuất dữ liệu</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-black">Quản lý người dùng</h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              + Thêm người dùng
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày tham gia
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-black">{user.email}</div>
                      {user.id === profile?.id && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">(Bạn)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'staff')}
                        disabled={saving || user.id === profile?.id}
                        className={`text-sm border rounded px-2 py-1 disabled:opacity-50 ${
                          user.role === 'admin' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        <option value="admin">👑 Admin</option>
                        <option value="staff">👤 Staff</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => setUserAsAdmin(user.id, user.email)}
                          disabled={saving}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Set Admin
                        </button>
                      )}
                      {user.id !== profile?.id && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-black">Backup dữ liệu</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3">
            Dữ liệu được tự động backup hàng ngày bởi Supabase. Bạn có thể xuất dữ liệu thủ công bất kỳ lúc nào.
          </p>
          <button
            onClick={async () => {
              const { data: products } = await supabase.from('products').select('*');
              const { data: customers } = await supabase.from('customers').select('*');
              const { data: orders } = await supabase.from('orders').select('*');
              const { data: orderItems } = await supabase.from('order_items').select('*');
              
              const exportData = { products, customers, orders, orderItems, exportDate: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `haisan-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
          >
            📥 Xuất dữ liệu (JSON)
          </button>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Thêm người dùng mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Email người dùng
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Vai trò
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'staff')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                >
                  <option value="staff">👤 Nhân viên (Staff)</option>
                  <option value="admin">👑 Quản lý (Admin)</option>
                </select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-700">
                <strong>Lưu ý:</strong> Sau khi thêm, người dùng cần đăng ký tài khoản tại trang /register rồi bạn set quyền ở bảng trên.
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={!inviteEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
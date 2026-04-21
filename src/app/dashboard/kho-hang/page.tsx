'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Product } from '@/types/database';

export default function KhoHangPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'kg',
    import_price: 0,
    packaging: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id);
      
      if (!error) {
        fetchProducts();
        closeModal();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([formData]);
      
      if (!error) {
        fetchProducts();
        closeModal();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (!error) {
      fetchProducts();
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      import_price: product.import_price,
      packaging: product.packaging || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      quantity: 0,
      unit: 'kg',
      import_price: 0,
      packaging: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kho hàng</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Chưa có sản phẩm nào. Thêm sản phẩm đầu tiên!
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quy cách
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá nhập
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black font-semibold">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-black font-medium">
                      {product.quantity} {product.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {product.packaging || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-black font-medium">
                      {formatCurrency(product.import_price)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Tôm sú"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="kg">kg</option>
                    <option value="con">con</option>
                    <option value="hộp">hộp</option>
                    <option value="túi">túi</option>
                    <option value="phần">phần</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá nhập (VNĐ)
                </label>
                <input
                  type="number"
                  required
                  min="0"
value={formData.import_price}
                    onChange={(e) => setFormData({ ...formData, import_price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quy cách đóng gói
                </label>
                <input
                  type="text"
                  value={formData.packaging}
                  onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="1kg/hộp, 5 con/túi..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProduct ? 'Lưu' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
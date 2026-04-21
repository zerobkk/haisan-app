'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Order, Customer, Product } from '@/types/database';

export default function DonHangPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const supabase = createClient();

  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
    payment_status: 'unpaid' as 'unpaid' | 'partial' | 'paid',
    items: [] as { product_id: string; quantity: number; unit_price: number }[],
    shipping_address: '',
    shipping_phone: '',
    shipping_note: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*'),
    ]);

    if (ordersRes.data) {
      const ordersWithCustomers = await Promise.all(
        ordersRes.data.map(async (order) => {
          const customerRes = await supabase
            .from('customers')
            .select('*')
            .eq('id', order.customer_id)
            .single();
          const itemsRes = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          
          return {
            ...order,
            customer: customerRes.data,
            items: itemsRes.data || [],
          } as Order;
        })
      );
      setOrders(ordersWithCustomers);
    }

    if (customersRes.data) setCustomers(customersRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  };

  const generateCustomerCode = async () => {
    const today = new Date();
    const dateStr = `${String(today.getFullYear()).slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    const { data } = await supabase
      .from('customers')
      .select('customer_code')
      .like('customer_code', `KD-${dateStr}-%`)
      .order('customer_code', { ascending: false })
      .limit(1);
    
    const count = data?.length ? parseInt(data[0].customer_code.split('-')[2]) + 1 : 1;
    return `KD-${dateStr}-${String(count).padStart(3, '0')}`;
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert('Vui lòng nhập tên khách hàng');
      return;
    }

    const customer_code = await generateCustomerCode();
    const { data, error } = await supabase
      .from('customers')
      .insert([{ customer_code, name: newCustomerName.trim(), phone: newCustomerPhone }])
      .select()
      .single();
    
    if (error) {
      alert('Lỗi tạo khách hàng: ' + error.message);
      return;
    }

    setCustomers([data, ...customers]);
    setFormData({ ...formData, customer_id: data.id });
    setShowNewCustomer(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || formData.items.length === 0) {
      alert('Vui lòng chọn khách hàng và ít nhất một sản phẩm');
      return;
    }

    if (editingOrder) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_id: formData.customer_id,
          order_date: formData.order_date,
          notes: formData.notes,
          payment_status: formData.payment_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingOrder.id);

      if (orderError) {
        alert('Lỗi cập nhật đơn hàng');
        return;
      }

      await supabase.from('order_items').delete().eq('order_id', editingOrder.id);
      
      const itemsWithOrderId = formData.items.map(item => ({
        ...item,
        order_id: editingOrder.id,
        is_low_stock: checkLowStock(item.product_id, item.quantity),
      }));
      
      await supabase.from('order_items').insert(itemsWithOrderId);
    } else {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: formData.customer_id,
          order_date: formData.order_date,
          notes: formData.notes,
          payment_status: formData.payment_status,
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) {
        alert('Lỗi tạo đơn hàng');
        return;
      }

      const itemsWithOrderId = formData.items.map(item => ({
        ...item,
        order_id: orderData.id,
        is_low_stock: checkLowStock(item.product_id, item.quantity),
      }));
      
      await supabase.from('order_items').insert(itemsWithOrderId);
    }

    fetchData();
    closeModal();
  };

  const checkLowStock = (productId: string, quantity: number): boolean => {
    const product = products.find(p => p.id === productId);
    return product ? quantity > product.quantity : false;
  };

  const confirmOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.items) return;

    for (const item of order.items) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await supabase
          .from('products')
          .update({ quantity: product.quantity - item.quantity })
          .eq('id', item.product_id);
      }
    }

    await supabase
      .from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    fetchData();
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng?')) return;
    
    await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    
    fetchData();
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng?')) return;
    
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    
    fetchData();
  };

  const openEditModal = async (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id,
      order_date: order.order_date,
      notes: order.notes || '',
      payment_status: order.payment_status,
      items: order.items?.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })) || [],
      shipping_address: '',
      shipping_phone: '',
      shipping_note: '',
    });
    setShowModal(true);
  };

  const openNewOrderModal = () => {
    setEditingOrder(null);
    setFormData({
      customer_id: '',
      order_date: new Date().toISOString().split('T')[0],
      notes: '',
      payment_status: 'unpaid',
      items: [],
      shipping_address: '',
      shipping_phone: '',
      shipping_note: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setShowNewCustomer(false);
  };

  const addItem = () => {
    if (products.length > 0) {
      const product = products[0];
      setFormData({
        ...formData,
        items: [...formData.items, { product_id: product.id, quantity: 1, unit_price: product.import_price * 1.2 }],
      });
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.import_price * 1.2;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      unpaid: 'Chưa thanh toán',
      partial: 'Thanh toán thiếu',
      paid: 'Đã thanh toán',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.unpaid}`}>
        {labels[status] || status}
      </span>
    );
  };

  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Đơn hàng</h1>
        <button
          onClick={openNewOrderModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          + Tạo đơn mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Chưa có đơn hàng nào. Tạo đơn hàng đầu tiên!
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const total = calculateTotal(order.items || []);
            const hasLowStock = order.items?.some(item => item.is_low_stock);
            
            return (
              <div key={order.id} className={`bg-white rounded-lg shadow p-4 ${hasLowStock ? 'border-l-4 border-orange-400' : ''}`}>
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black">
                        {order.customer?.name || 'Khách hàng'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({order.customer?.customer_code})
                      </span>
                      {hasLowStock && (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                          Thiếu hàng
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(order.order_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(order.status)}
                    {getPaymentBadge(order.payment_status)}
                  </div>
                </div>

                <div className="border-t border-b border-gray-100 py-2 mb-3">
                  <div className="text-sm">
                    {(order.items || []).map((item, idx) => {
                      const product = products.find(p => p.id === item.product_id);
                      return (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-black">
                            {product?.name || 'Sản phẩm'} x {item.quantity}
                            {item.is_low_stock && <span className="text-orange-500 ml-1">(Thiếu)</span>}
                          </span>
                          <span className="text-black">
                            {formatCurrency(item.quantity * item.unit_price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="font-semibold text-lg text-black">
                    Tổng: {formatCurrency(total)}
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openEditModal(order)}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => confirmOrder(order.id)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Hủy
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-black mb-4">
              {editingOrder ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới'}
            </h2>
            
            {showNewCustomer ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-black">Thêm khách hàng mới</h3>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Tên khách hàng</label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                    placeholder="0xxx xxx xxx"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNewCustomer}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Thêm khách hàng
                  </button>
                  <button
                    onClick={() => setShowNewCustomer(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-black mb-1">Khách hàng</label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Chọn khách hàng</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.customer_code}) {c.phone ? `- ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    + Khách mới
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Ngày đặt</label>
                    <input
                      type="date"
                      required
                      value={formData.order_date}
                      onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Thanh toán</label>
                    <select
                      value={formData.payment_status}
                      onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                    >
                      <option value="unpaid">Chưa thanh toán</option>
                      <option value="partial">Thanh toán thiếu</option>
                      <option value="paid">Đã thanh toán</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Thông tin giao hàng (Ship)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Địa chỉ giao</label>
                      <input
                        type="text"
                        value={formData.shipping_address}
                        onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                        placeholder="Địa chỉ giao hàng"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Số điện thoại giao</label>
                      <input
                        type="text"
                        value={formData.shipping_phone}
                        onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                        placeholder="SĐT người nhận"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-black mb-1">Ghi chú giao hàng</label>
                    <input
                      type="text"
                      value={formData.shipping_note}
                      onChange={(e) => setFormData({ ...formData, shipping_note: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                      placeholder="Giờ giao, chỉ dẫn..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Sản phẩm</label>
                  {formData.items.map((item, index) => {
                    const product = products.find(p => p.id === item.product_id);
                    const isLowStock = product && item.quantity > product.quantity;
                    
                    return (
                      <div key={index} className={`flex gap-2 mb-2 items-end p-2 rounded ${isLowStock ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-black text-sm"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Còn: {p.quantity} {p.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-black text-sm"
                            placeholder="SL"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseInt(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-black text-sm"
                            placeholder="Giá"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 text-xl px-2"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    + Thêm sản phẩm
                  </button>
                  {formData.items.some((item) => {
                    const p = products.find(prod => prod.id === item.product_id);
                    return p && item.quantity > p.quantity;
                  }) && (
                    <p className="text-orange-600 text-sm mt-1">
                      ⚠️ Một số sản phẩm vượt quá tồn kho
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500"
                    rows={2}
                    placeholder="Ghi chú thêm..."
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
                    {editingOrder ? 'Lưu' : 'Tạo đơn'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
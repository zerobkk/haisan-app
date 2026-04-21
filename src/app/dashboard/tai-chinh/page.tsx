'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Order, OrderItem, Product } from '@/types/database';

type PeriodFilter = 'day' | 'week' | 'month';

export default function TaiChinhPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*').order('order_date', { ascending: false }),
      supabase.from('products').select('*'),
    ]);

    if (ordersRes.data) {
      const ordersWithItems = await Promise.all(
        ordersRes.data.map(async (order) => {
          const itemsRes = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          return { ...order, items: itemsRes.data || [] } as Order;
        })
      );
      setOrders(ordersWithItems);
    }
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  };

  const getDateRange = () => {
    const date = new Date(selectedDate);
    if (period === 'day') {
      return { start: date, end: date };
    } else if (period === 'week') {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    } else {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return { start, end };
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.order_date);
    const { start, end } = getDateRange();
    return orderDate >= start && orderDate <= end && order.status !== 'cancelled';
  });

  const calculateStats = () => {
    const productStats: Record<string, { name: string; sold: number; revenue: number; cost: number; profit: number }> = {};
    
    let totalRevenue = 0;
    let totalCost = 0;

    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        const productName = product?.name || 'Unknown';
        const cost = (product?.import_price || 0) * item.quantity;
        const revenue = item.quantity * item.unit_price;
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalCost += cost;

        if (!productStats[item.product_id]) {
          productStats[item.product_id] = {
            name: productName,
            sold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }
        productStats[item.product_id].sold += item.quantity;
        productStats[item.product_id].revenue += revenue;
        productStats[item.product_id].cost += cost;
        productStats[item.product_id].profit += profit;
      });
    });

    return {
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      productStats: Object.values(productStats),
    };
  };

  const stats = calculateStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN');
  };

  const getPeriodLabel = () => {
    const { start, end } = getDateRange();
    if (period === 'day') return formatDate(start);
    if (period === 'week') return `${formatDate(start)} - ${formatDate(end)}`;
    return `Tháng ${start.getMonth() + 1}/${start.getFullYear()}`;
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Đang tải...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tài chính</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kỳ báo cáo</label>
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as PeriodFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm rounded ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : 'Tháng'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn ngày</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-gray-500">{getPeriodLabel()}</div>
            <div className="text-lg font-semibold">{filteredOrders.length} đơn hàng</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Doanh thu</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Chi phí (Giá nhập)</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalCost)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Lợi nhuận</div>
          <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(stats.totalProfit)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Theo mặt hàng</h2>
        </div>
        {stats.productStats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Không có dữ liệu trong kỳ này
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mặt hàng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Đã bán
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Chi phí
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Lợi nhuận
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.productStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {item.sold}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(item.cost)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-sm">Tổng cộng</td>
                  <td className="px-4 py-3 text-sm text-right"></td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(stats.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(stats.totalCost)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.totalProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
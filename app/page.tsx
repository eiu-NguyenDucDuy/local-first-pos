'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, Store } from 'lucide-react';

export default function Home() {
  const [search, setSearch] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const products = useLiveQuery(async () => {
    if (!search.trim()) return await db.products.toArray();
    return await db.products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode?.includes(search) ?? false))
      .toArray();
  }, [search]);

  if (!isClient) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header đơn giản */}
        <div className="flex items-center justify-between bg-blue-700 text-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center gap-3">
            <Store size={40} />
            <div>
              <h1 className="text-3xl font-extrabold">Tra Cứu Giá Bán</h1>
              <p className="text-blue-100 text-lg">Dành cho người nhà bán hàng nhanh</p>
            </div>
          </div>
        </div>

        {/* Ô Tìm kiếm cực to */}
        <div className="relative">
          <Input 
            placeholder="Nhập tên mặt hàng hoặc quét mã vạch..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-14 py-5 text-2xl shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={32} />
        </div>

        {/* Danh sách Sản phẩm dưới dạng Thẻ (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products && products.length > 0 ? (
            products.map((p) => (
              <Card key={p.id} className="border-l-8 border-l-blue-600 flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-900">{p.name}</h2>
                  {p.barcode && <p className="text-gray-500 text-base font-mono">Mã: {p.barcode}</p>}
                  <p className="text-gray-600 text-lg">Tồn kho: <span className="font-semibold">{p.stock ?? 1}</span> {p.unit || 'Cái/Gói'}</p>
                </div>
                <div className="text-right">
                  <span className="block text-3xl font-black text-green-600">
                    {p.sellingPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 text-2xl font-semibold">
              Chưa có sản phẩm nào. Hãy chuyển sang trang Admin để tạo mới!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
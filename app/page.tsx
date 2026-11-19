'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { Search, Store } from 'lucide-react';
import { catalog, currentStock, matches } from '@/lib/catalog';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function Home() {
  const [search, setSearch] = useState('');
  const rows = useLiveQuery(catalog, []);
  const products = rows?.filter(p => !p.archivedAt && matches(p, search));

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between bg-blue-700 text-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center gap-3"><Store size={40} /><div>
            <h1 className="text-3xl font-extrabold">Tra Cứu Giá Bán</h1>
            <p className="text-blue-100 text-lg">Dành cho người nhà bán hàng nhanh</p>
          </div></div>
          <Link href="/admin/" prefetch={false} className="font-bold underline">Quản lý sản phẩm</Link>
        </div>
        <div className="relative">
          <Input aria-label="Tìm sản phẩm" placeholder="Nhập tên, mã vạch hoặc danh mục..."
            value={search} onChange={e => setSearch(e.target.value)} className="pl-14 py-5 text-2xl" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={32} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products?.map(p => <Card key={p.id} className="border-l-8 border-l-blue-600 flex flex-wrap gap-3 justify-between items-center">
            <div><h2 className="text-2xl font-bold text-gray-900">{p.name}</h2>
              {p.barcode && <p className="text-gray-600">Mã: {p.barcode}</p>}
              {p.category && <p className="text-gray-600">{p.category}</p>}
              <p className="text-gray-700">Tồn kho: <strong>{currentStock(p)}</strong> {p.unit || 'Cái/Gói'}</p></div>
            <strong className="text-3xl text-green-700">{p.sellingPrice.toLocaleString('vi-VN')} đ</strong>
          </Card>)}
          {!products && <p>Đang đọc dữ liệu…</p>}
          {products?.length === 0 && <p className="text-gray-700">{search.trim() ? 'Không tìm thấy sản phẩm.' : 'Chưa có sản phẩm đang bán.'}</p>}
        </div>
      </div>
    </main>
  );
}

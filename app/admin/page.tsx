'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState('1');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên sản phẩm!');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      setError('Vui lòng nhập giá bán hợp lệ!');
      return;
    }

    await db.products.add({
      name: name.trim(),
      sellingPrice: Number(sellingPrice),
      barcode: barcode.trim() || undefined,
      stock: Number(stock) || 1,
      createdAt: new Date()
    });

    // Reset Form
    setName('');
    setSellingPrice('');
    setBarcode('');
    setStock('1');
    setError('');
    alert('Thêm sản phẩm thành công!');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xl text-blue-600 font-bold">
          <ArrowLeft size={24} /> Quay lại trang Tra Cứu
        </Link>

        <Card>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
            <PlusCircle className="text-blue-600" size={32} /> Thêm Sản Phẩm Mới
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Tên Sản Phẩm (BẮT BUỘC) */}
            <Input 
              label="Tên sản phẩm (*)" 
              placeholder="VD: Mì Hảo Hảo, Coca Cola..." 
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
            />

            {/* 2. Price (mandatory) */}
            <Input 
              label="Giá bán (VNĐ) (*)" 
              type="number"
              placeholder="VD: 10000" 
              value={sellingPrice}
              onChange={(e) => {
                setSellingPrice(e.target.value);
                if (error) setError('');
              }}
            />

            {/* 3. Barcode (optional) */}
            <Input 
              label="Mã vạch (Tùy chọn)" 
              placeholder="Quét hoặc nhập mã vạch..." 
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />

            {/* 4. Inventory quantity (default 1) */}
            <Input 
              label="Số lượng ban đầu" 
              type="number"
              placeholder="Mặc định là 1" 
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />

            {error && <p className="text-red-600 font-bold text-xl">{error}</p>}

            <Button type="submit" className="w-full">
              Lưu Sản Phẩm Về Máy
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
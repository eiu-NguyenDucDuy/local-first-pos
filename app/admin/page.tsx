'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { catalog, CatalogError, currentStock, matches, recordCount, retireProduct, saveProduct, type CatalogRow } from '@/lib/catalog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const empty = { name: '', price: '', barcode: '', category: '' };
const version = (row: CatalogRow) => ({ id: row.id, revision: row.revision ?? 0 });

export default function AdminPage() {
  const rows = useLiveQuery(catalog, []);
  const [fields, setFields] = useState(empty);
  const [stock, setStock] = useState('1');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<CatalogRow>();
  const [mode, setMode] = useState<'add' | 'edit' | 'count' | 'history'>('add');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const logId = mode === 'history' ? selected?.id : undefined;
  const logs = useLiveQuery(() => logId === undefined ? [] : db.inventoryLogs.where('productId').equals(logId).reverse().toArray(), [logId]);

  function reset() {
    setMode('add'); setSelected(undefined); setFields(empty); setStock('1'); setReason('');
  }
  function select(row: CatalogRow, next: 'edit' | 'count' | 'history') {
    setMode(next); setSelected(row); setError(''); setMessage('');
    setFields({ name: row.name, price: String(row.sellingPrice), barcode: row.barcode ?? '', category: row.category });
    setStock(String(currentStock(row))); setReason('');
    document.getElementById('editor')?.focus();
  }
  async function write(operation: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true); setMessage(''); setError('');
    try {
      await operation(); reset(); setMessage(success);
    } catch (e) {
      setError(e instanceof CatalogError ? e.message : 'Không thể lưu trên thiết bị. Kiểm tra quyền và dung lượng lưu trữ rồi thử lại.');
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'count' && selected) {
      await write(() => recordCount(version(selected), stock, reason), 'Đã lưu kết quả kiểm kê.');
    } else if (mode === 'add' || (mode === 'edit' && selected)) {
      await write(() => saveProduct(fields, stock, selected ? version(selected) : undefined), 'Đã lưu sản phẩm.');
    }
  }
  const title = mode === 'add' ? 'Thêm sản phẩm' : mode === 'edit' ? 'Sửa sản phẩm' : mode === 'count' ? 'Kiểm kê' : 'Lịch sử kiểm kê';
  return <main className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8"><div className="max-w-3xl mx-auto space-y-6">
    <Link href="/" prefetch={false} className="inline-flex items-center gap-2 text-xl text-blue-700 font-bold"><ArrowLeft size={24}/>Quay lại tra cứu</Link>
    <Card><h1 id="editor" tabIndex={-1} className="text-3xl font-bold flex items-center gap-2 mb-5"><PlusCircle size={28}/>{title}</h1>
      {selected && <p className="mb-3 font-semibold">{selected.name}</p>}
      {mode === 'history' ? <div>
        {logs?.length === 0 && <p>Chưa có lịch sử đã ghi.</p>}
        <ul className="space-y-2">{logs?.map(log => <li key={log.id}>
          {log.previousStock} → {log.newStock} ({log.delta > 0 ? '+' : ''}{log.delta}) · {log.reason} · {log.createdAt.toLocaleString('vi-VN')}
        </li>)}</ul>
      </div> : <form noValidate onSubmit={submit}><fieldset disabled={busy} className="space-y-4">
        {mode !== 'count' && <>
          <Input label="Tên sản phẩm" required value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })}/>
          <Input label="Giá bán (VNĐ)" type="number" min="1" step="1" required value={fields.price} onChange={e => setFields({ ...fields, price: e.target.value })}/>
          <Input label="Mã vạch" value={fields.barcode} onChange={e => setFields({ ...fields, barcode: e.target.value })}/>
          <Input label="Danh mục" value={fields.category} onChange={e => setFields({ ...fields, category: e.target.value })}/>
        </>}
        {mode !== 'edit' && <Input label={mode === 'count' ? 'Số lượng thực tế' : 'Số lượng ban đầu'} type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)}/>}
        {mode === 'count' && <Input label="Lý do kiểm kê" required value={reason} onChange={e => setReason(e.target.value)}/>}
        <Button type="submit">{mode === 'count' ? 'Lưu kiểm kê' : 'Lưu sản phẩm'}</Button>
      </fieldset></form>}
      {mode !== 'add' && <button className="mt-4 underline" disabled={busy} onClick={() => { reset(); setError(''); }}>Quay lại thêm mới</button>}
      {error && <p className="text-red-700 font-bold mt-3" role="alert">{error}</p>}
      {message && <p role="status" className="mt-3 text-green-800">{message}</p>}
    </Card>
    <Card><h2 className="text-2xl font-bold mb-2">Danh sách quản lý</h2>
      <Input label="Lọc danh sách" value={search} onChange={e => setSearch(e.target.value)}/>
      <ul className="divide-y">{rows?.filter(p => matches(p, search)).map(p => <li key={p.id} className="py-3 space-y-2">
        <strong>{p.name}</strong> · {p.archivedAt ? 'Ngừng bán' : 'Tồn: ' + currentStock(p)}
        <div className="flex flex-wrap gap-4 text-blue-700">
          {!p.archivedAt && <>
            <button disabled={busy} onClick={() => select(p, 'edit')}>Sửa</button>
            <button disabled={busy} onClick={() => select(p, 'count')}>Kiểm kê</button>
            <button disabled={busy} onClick={() => {
              if (window.confirm('Ngừng bán ' + p.name + '? Lịch sử sẽ được giữ lại.')) {
                void write(() => retireProduct(version(p)), 'Đã ngừng bán sản phẩm.');
              }
            }}>Ngừng bán</button>
          </>}
          <button disabled={busy} onClick={() => select(p, 'history')}>Lịch sử</button>
        </div>
      </li>)}</ul>
    </Card>
  </div></main>;
}

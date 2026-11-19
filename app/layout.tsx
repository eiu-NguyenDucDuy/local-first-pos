import type { Metadata } from 'next';
import OfflineStatus from '@/components/OfflineStatus';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tra cứu giá và quản lý hàng hóa',
  description: 'Danh mục sản phẩm và kiểm kê lưu trên thiết bị của cửa hàng.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><OfflineStatus />{children}</body>
    </html>
  );
}

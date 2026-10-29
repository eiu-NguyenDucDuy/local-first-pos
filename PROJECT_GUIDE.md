# 🚀 HƯỚNG DẪN DỰ ÁN: LOCAL-FIRST POS FOR FAMILY GROCERY STORES
> **Capstone 1**: Khảo sát, Thiết kế & Xây dựng nền tảng Offline-First (Core & Local Storage)

---

## 📌 1. TỔNG QUAN ARCHITECTURE & TECH STACK

- **Framework**: Next.js (App Router) với cấu hình `output: 'export'` (Static Export - không dùng Node.js server khi chạy client).
- **Styling**: Tailwind CSS + Ant Design.
- **Database Cục bộ**: IndexedDB thông qua thư viện wrapper **Dexie.js**.
- **Nguyên tắc cốt lõi (Offline-First)**:
  - Tất cả dữ liệu sản phẩm, tồn kho đều lưu trực tiếp dưới IndexedDB trên trình duyệt của máy.
  - Ứng dụng phải chạy hoàn chỉnh ngay cả khi ngắt kết nối Internet (`Disable Network`).
  - Giao diện thiết kế cho người sử dụng: **Font chữ lớn, nút bấm to, giao diện tối giản**.

---

## 📁 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
src/
├── app/                  # Các trang chính (Page Router / App Router)
│   ├── page.tsx          # Trang chủ: Tra cứu giá nhanh (Dành cho người nhà)
│   └── admin/
│       └── page.tsx      # Trang Admin: Thêm/Quản lý sản phẩm
├── components/           # UI Components
│   ├── ui/               # Shared Components (Button, Input, Card, Modal,...)
│   └── HomeContent.tsx   # Nội dung trang chủ (Client Component)
└── lib/
    └── db.ts             # Khai báo Schema IndexedDB (Dexie) & Helper functions
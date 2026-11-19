'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="p-6 space-y-3"><h1 className="text-2xl">Không thể đọc dữ liệu trên thiết bị.</h1>
    <p>Kiểm tra quyền lưu trữ của trình duyệt rồi thử lại.</p><button onClick={reset}>Thử lại</button></main>;
}

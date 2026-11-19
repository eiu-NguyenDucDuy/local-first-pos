'use client';

import { useEffect, useState } from 'react';

export default function OfflineStatus() {
  const [message, setMessage] = useState('Đang chuẩn bị chế độ ngoại tuyến…');
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    let mounted = true;
    const show = (value: string) => { if (mounted) setMessage(value); };
    if (!('serviceWorker' in navigator)) {
      show('Trình duyệt chưa hỗ trợ mở lại ngoại tuyến.');
      return;
    }
    const sw = navigator.serviceWorker;
    const ready = () => {
      if (sw.controller) show('Sẵn sàng mở lại ngoại tuyến.');
    };
    const failed = () => show('Chưa sẵn sàng ngoại tuyến. Hãy kết nối và tải lại.');
    sw.addEventListener('controllerchange', ready);
    ready();
    sw.register('/sw.js').then(registration => {
      const worker = registration.installing;
      const check = () => {
        if (worker?.state === 'redundant' && !sw.controller) failed();
      };
      worker?.addEventListener('statechange', check);
      check();
      ready();
    }).catch(failed);
    return () => { mounted = false; sw.removeEventListener('controllerchange', ready); };
  }, []);
  if (process.env.NODE_ENV !== 'production') return null;
  return <p role="status" className="px-4 py-2 text-center text-sm text-gray-700 bg-gray-100">{message}</p>;
}

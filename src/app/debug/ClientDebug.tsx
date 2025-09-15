'use client';

import { useEffect, useState } from 'react';

type ClientInfo = {
  userAgent: string;
  viewport: { width: number; height: number };
  darkMode: boolean;
  devicePixelRatio: number;
  online: boolean;
};

export default function ClientDebug() {
  const [info, setInfo] = useState<ClientInfo | null>(null);

  useEffect(() => {
    const collect = () => {
      setInfo({
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
        devicePixelRatio: window.devicePixelRatio || 1,
        online: navigator.onLine,
      });
    };
    collect();
    window.addEventListener('resize', collect);
    window.addEventListener('online', collect);
    window.addEventListener('offline', collect);
    return () => {
      window.removeEventListener('resize', collect);
      window.removeEventListener('online', collect);
      window.removeEventListener('offline', collect);
    };
  }, []);

  if (!info) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow p-6">
      <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-3">Client</h3>
      <dl className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <div className="flex justify-between gap-4"><dt>User agent</dt><dd className="text-right break-all">{info.userAgent}</dd></div>
        <div className="flex justify-between gap-4"><dt>Viewport</dt><dd>{info.viewport.width} × {info.viewport.height}</dd></div>
        <div className="flex justify-between gap-4"><dt>Dark mode</dt><dd>{info.darkMode ? 'true' : 'false'}</dd></div>
        <div className="flex justify-between gap-4"><dt>Device pixel ratio</dt><dd>{info.devicePixelRatio}</dd></div>
        <div className="flex justify-between gap-4"><dt>Online</dt><dd>{info.online ? 'true' : 'false'}</dd></div>
      </dl>
    </div>
  );
}


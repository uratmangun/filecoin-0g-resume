import ClientDebug from './ClientDebug';

export default function DebugPage() {
  const now = new Date();
  const serverInfo = {
    node: process.version,
    env: process.env.NODE_ENV,
    time: now.toISOString(),
  } as const;

  const publicEnv = Object.entries(process.env)
    .filter(([k]) => k.startsWith('NEXT_PUBLIC_'))
    .map(([k, v]) => ({ key: k, value: String(v) }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Debug</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Quick diagnostics for server and client. Only public env vars are shown.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow p-6">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-3">Server</h3>
            <dl className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex justify-between gap-4"><dt>Node</dt><dd>{serverInfo.node}</dd></div>
              <div className="flex justify-between gap-4"><dt>Env</dt><dd>{serverInfo.env}</dd></div>
              <div className="flex justify-between gap-4"><dt>Time (ISO)</dt><dd className="text-right">{serverInfo.time}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow p-6">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-3">Public Env</h3>
            {publicEnv.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No NEXT_PUBLIC_* variables found.</p>
            ) : (
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                {publicEnv.map((e) => (
                  <li key={e.key} className="flex justify-between gap-3">
                    <span className="font-mono text-slate-500">{e.key}</span>
                    <span className="text-right break-all">{e.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ClientDebug />
        </div>
      </div>
    </div>
  );
}


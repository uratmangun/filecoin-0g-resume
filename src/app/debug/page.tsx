export default function DebugPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Debug</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Quick diagnostics for server and client. Only public env vars are shown.
          </p>
        </header>
        {/* Intentionally left blank per request to remove all debug cards */}
      </div>
    </div>
  );
}

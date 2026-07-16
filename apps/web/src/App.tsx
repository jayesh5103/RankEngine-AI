import { useState, useEffect } from 'react';
import type { CrawlJob, HealthCheckResponse } from '@rankengine/shared-types';

export default function App() {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate API fetch loading data matching our Shared Types definition
    const timer = setTimeout(() => {
      setJobs([
        {
          id: 'job-001',
          url: 'https://news.ycombinator.com',
          status: 'completed',
          userId: 'usr-admin',
          depth: 2,
          resultCount: 147,
          createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          completedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        },
        {
          id: 'job-002',
          url: 'https://github.com/trending',
          status: 'processing',
          userId: 'usr-admin',
          depth: 3,
          resultCount: 89,
          createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        },
        {
          id: 'job-003',
          url: 'https://docs.poetry.eustace.io',
          status: 'pending',
          userId: 'usr-analyst',
          depth: 1,
          resultCount: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'job-004',
          url: 'https://invalid-url-domain.xxx',
          status: 'failed',
          userId: 'usr-analyst',
          depth: 1,
          resultCount: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          completedAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
          error: 'DNS resolution failed',
        },
      ]);

      setHealth({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 1245.82,
        services: {
          database: 'connected',
          redis: 'connected',
        },
      });

      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              RE
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              RankEngine <span className="text-indigo-400">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
              v1.0.0-Scaffold
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Alert */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-900/30 p-6 sm:p-8 mb-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Monorepo Scaffolding Active
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            This dashboard demonstrates Vite + React, Tailwind CSS v4, and types imported from
            the local `@rankengine/shared-types` workspace package.
          </p>
        </div>

        {/* Infrastructure Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Backend Server
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-white">Express API</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1 text-xs text-slate-500">Port 3000 • Dev Mode</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Python Worker
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-white">FastAPI App</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1 text-xs text-slate-500">Port 8000 • Poetry</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              MongoDB Database
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-white">
                {loading ? 'Checking...' : health?.services.database === 'connected' ? 'Online' : 'Offline'}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">Docker • Port 27017</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Redis Cache
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-white">
                {loading ? 'Checking...' : health?.services.redis === 'connected' ? 'Online' : 'Offline'}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">Docker • Port 6379</div>
          </div>
        </div>

        {/* Crawl Jobs List */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Crawl Job Queue</h2>
              <p className="text-xs text-slate-400 mt-1">
                Mock crawl jobs displaying type integration with `@rankengine/shared-types`
              </p>
            </div>
            <button className="self-start sm:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow transition duration-150">
              New Crawl Job
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <div className="text-sm text-slate-400">Loading monorepo dashboard state...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-900">
                    <th className="px-6 py-4">Job ID</th>
                    <th className="px-6 py-4">Target URL</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Depth</th>
                    <th className="px-6 py-4 text-center">Pages Scraped</th>
                    <th className="px-6 py-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-400 font-medium">
                        {job.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white font-medium truncate max-w-xs sm:max-w-md">
                          {job.url}
                        </div>
                        {job.error && (
                          <div className="text-xs text-rose-500 mt-0.5 font-medium">
                            Error: {job.error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : job.status === 'processing'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                                : job.status === 'failed'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-300">
                        {job.depth}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-300">
                        {job.resultCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

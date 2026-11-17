import React, { useState, useEffect, useCallback } from 'react';
import { fashnService } from '../services/fashnService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { dash } from '../lib/utils';
import { TryOnUsagePage } from './TryOnUsagePage';
import {
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Maximize2,
} from 'lucide-react';

export function TryOnAIPage() {
  const [activeTab, setActiveTab] = useState('usage');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [lightboxItem, setLightboxItem] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fashnService.getGenerationLogs({
      search,
      status: statusFilter,
      page,
      limit: 8,
    });
    if (res.success) {
      setLogs(res.data.items);
      setStats(res.data.stats);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchLogs();
    fashnService.getConfig().then((res) => {
      if (res.success) setConfig(res.data);
    });
  }, [fetchLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-700">
              Customer try-ons
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-0.5">
            Try-On
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1 font-medium">
            See how many try-ons each customer used, what they paid, and what those generations cost in FASHN credits.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-sand-100 p-1.5 rounded-2xl border border-sand-300/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'usage'
                ? 'bg-white text-gold-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <span>Customer usage</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'jobs'
                ? 'bg-white text-gold-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-gold-600" />
            <span>Generation jobs</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[22px] border border-sand-300/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 mb-2">
            <span>FASHN Service Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
          </div>
          <div className="font-serif text-2xl font-bold text-charcoal-900 capitalize">
            {config?.status || '-'}
          </div>
          <span className="text-[11px] text-gold-700 font-medium block mt-1">
            Endpoint: api.fashn.ai/v1/run
          </span>
        </div>

        <div className="bg-white p-5 rounded-[22px] border border-sand-300/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 mb-2">
            <span>Neural Drape Model</span>
            <Cpu className="w-4 h-4 text-gold-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            {config?.modelName || '-'}
          </div>
          <span className="text-[11px] text-charcoal-400 block mt-1">
            Calibrated for Silk & Pleats
          </span>
        </div>

        <div className="bg-white p-5 rounded-[22px] border border-sand-300/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 mb-2">
            <span>Monthly Credit Quota</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            {config?.creditsRemaining ?? '-'}
          </div>
          <span className="text-[11px] text-charcoal-400 block mt-1">
            {config?.lowCredits ? 'Credits are low. Top up before customers generate drapes.' : `${config?.creditsUsed ?? 0} used`}
          </span>
        </div>

        <div className="bg-white p-5 rounded-[22px] border border-sand-300/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 mb-2">
            <span>Average Prediction Time</span>
            <Clock className="w-4 h-4 text-gold-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            {stats?.avgLatency || '-'}
          </div>
          <span className="text-[11px] text-gold-700 font-medium block mt-1">
            {stats?.successRate || '-'} Success Rate
          </span>
        </div>
      </div>

      {/* Customer usage, or the real generation jobs. */}
      {activeTab === 'usage' && <TryOnUsagePage embedded />}

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-[22px] border border-sand-300/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by customer, saree, or run ID..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-sand-300 focus:border-gold-500 text-charcoal-900"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 text-xs rounded-xl border border-sand-300 text-charcoal-800 bg-white"
              >
                <option value="all">All Run Statuses</option>
                <option value="completed">Completed Successfully</option>
                <option value="failed">Failed / Retried</option>
              </select>
            </div>
          </div>

          {/* Telemetry Table */}
          <div className="bg-white rounded-[24px] border border-sand-300/80 shadow-sm overflow-hidden">
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : logs.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No FASHN.ai generation runs recorded"
                description="Client try-on requests initiated from the customer mobile app will appear here with automated telemetry."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-50/80 border-b border-sand-200 text-charcoal-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3">Run ID</th>
                      <th className="py-3.5 px-3">Customer</th>
                      <th className="py-3.5 px-3">Target Saree</th>
                      <th className="py-3.5 px-3">Model Pose</th>
                      <th className="py-3.5 px-3">AI Output Render</th>
                      <th className="py-3.5 px-3">Latency</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200 text-charcoal-800">
                    {logs.map((run) => (
                      <tr key={run.id} className="hover:bg-sand-50/60 transition-colors">
                        <td className="py-3.5 pl-6 pr-3 font-mono font-semibold text-gold-800 text-[11px]">
                          {run.id}
                        </td>

                        <td className="py-3.5 px-3 font-medium text-charcoal-900">
                          {dash(run.customerName)}
                          <span className="text-[10px] text-charcoal-400 block font-mono">
                            {dash(run.customerId)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-charcoal-900 line-clamp-1 block">
                            {dash(run.sareeTitle)}
                          </span>
                          <span className="text-[10px] text-charcoal-400 font-mono">
                            {dash(run.sareeId)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {run.modelImage ? (
                            <img
                              src={run.modelImage}
                              alt="Model Pose"
                              className="w-8 h-10 rounded-lg object-cover ring-1 ring-sand-300"
                            />
                          ) : (
                            <span className="text-[10px] text-charcoal-400">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {run.outputImage ? (
                            <img
                              src={run.outputImage}
                              alt="Drape Output"
                              className="w-8 h-10 rounded-lg object-cover ring-1 ring-gold-400"
                            />
                          ) : (
                            <span className="text-[10px] text-charcoal-500">
                              {dash(run.errorMessage)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-charcoal-600 font-mono">
                          {run.latencySeconds && run.latencySeconds !== '-' ? `${run.latencySeconds}s` : '-'}
                        </td>

                        <td className="py-3.5 px-3">
                          <Badge
                            variant={run.status === 'completed' ? 'gold' : 'maroon'}
                            size="xs"
                          >
                            {run.status === 'completed' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {run.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 pl-3 pr-6 text-right">
                          {run.outputImage && (
                            <button
                              onClick={() => setLightboxItem(run)}
                              className="p-1.5 text-gold-700 hover:bg-gold-50 rounded-lg inline-flex items-center gap-1 font-semibold text-[11px]"
                              title="Inspect AI High Res Output"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={8}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <Modal
        isOpen={!!lightboxItem}
        onClose={() => setLightboxItem(null)}
        title={lightboxItem?.sareeTitle || 'FASHN.ai Output'}
        subtitle={`Prediction Run: ${lightboxItem?.id}`}
        maxWidth="max-w-4xl"
      >
        {lightboxItem && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-xs font-semibold text-charcoal-700 block mb-2">
                Input Model Portrait
              </span>
              {lightboxItem.modelImage ? (
                <img
                  src={lightboxItem.modelImage}
                  alt="Model"
                  className="w-full max-h-[60vh] object-contain rounded-xl bg-black"
                />
              ) : (
                <span className="w-full h-40 flex items-center justify-center text-charcoal-400">-</span>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-charcoal-700 block mb-2">
                FASHN.ai Synthesized Garment Fitting
              </span>
              {lightboxItem.outputImage || lightboxItem.productImage ? (
                <img
                  src={lightboxItem.outputImage || lightboxItem.productImage}
                  alt="AI Output"
                  className="w-full max-h-[60vh] object-contain rounded-xl bg-black border-2 border-gold-500"
                />
              ) : (
                <span className="w-full h-40 flex items-center justify-center text-charcoal-400">-</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

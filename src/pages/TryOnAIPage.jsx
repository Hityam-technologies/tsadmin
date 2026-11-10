import React, { useState, useEffect, useCallback } from 'react';
import { fashnService } from '../services/fashnService';
import { sareeService } from '../services/sareeService';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { dash } from '../lib/utils';
import {
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Maximize2,
  ShieldCheck,
  Settings,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

export function TryOnAIPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'sandbox' | 'config'
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

  // Lightbox
  const [lightboxItem, setLightboxItem] = useState(null);

  // Sandbox state
  const [catalogSarees, setCatalogSarees] = useState([]);
  const [selectedSaree, setSelectedSaree] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [sandboxMode, setSandboxMode] = useState('quality');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sandboxResult, setSandboxResult] = useState(null);

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
    sareeService.getSarees({ limit: 12 }).then((res) => {
      if (res.success && res.data.items.length > 0) {
        setCatalogSarees(res.data.items);
        setSelectedSaree(res.data.items[0]);
      }
    });
  }, [fetchLogs]);

  const handleRunSandbox = async () => {
    if (!selectedSaree) return;
    setIsGenerating(true);
    setSandboxResult(null);

    try {
      const res = await fashnService.runTestTryOn({
        sareeId: selectedSaree.id,
        sareeTitle: selectedSaree.title,
        productImage: selectedSaree.image,
        modelImage: selectedModel,
      });

      if (res.success) {
        setSandboxResult(res.data);
        showToast('FASHN.ai drape prediction completed', 'success');
        fetchLogs();
        const confRes = await fashnService.getConfig();
        if (confRes.success) setConfig(confRes.data);
      }
    } catch {
      showToast('Simulation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const modelOptions = [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-700">
              Automated AI Drape Engine
            </span>
            <Badge variant="gold" size="xs">
              <Zap className="w-3 h-3 text-gold-600" /> FASHN.ai v1.6 Max
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-0.5">
            Virtual Try-On AI Studio
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1 font-medium">
            Automated neural garment fitting via FASHN.ai REST API. Client drape physics are computed automatically without manual approval queues.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-sand-100 p-1.5 rounded-2xl border border-sand-300/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'telemetry'
                ? 'bg-white text-gold-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-gold-600" />
            <span>Telemetry & Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'sandbox'
                ? 'bg-white text-gold-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
            <span>Drape Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'config'
                ? 'bg-white text-gold-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-charcoal-600" />
            <span>API Settings</span>
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

      {/* VIEW 1: Telemetry & Generation Run Logs */}
      {activeTab === 'telemetry' && (
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

      {/* VIEW 2: Interactive Drape Testing Sandbox */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Panel */}
          <div className="bg-white p-6 rounded-[24px] border border-sand-300/80 shadow-sm space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">
                Atelier Playground
              </span>
              <h3 className="font-serif text-lg font-bold text-charcoal-900 mt-0.5">
                Simulate FASHN.ai Drape Prediction
              </h3>
              <p className="text-xs text-charcoal-500 mt-1">
                Select a catalog saree and mannequin pose to test the neural drape simulator.
              </p>
            </div>

            {/* Step 1: Select Saree Garment */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-2">
                1. Select Saree (`product_image`)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {catalogSarees.map((saree) => (
                  <button
                    key={saree.id}
                    type="button"
                    onClick={() => setSelectedSaree(saree)}
                    className={`p-1 rounded-xl border text-left transition-all ${
                      selectedSaree?.id === saree.id
                        ? 'border-gold-600 ring-2 ring-gold-400 bg-gold-50/40'
                        : 'border-sand-300 hover:border-sand-400'
                    }`}
                  >
                    {saree.image ? (
                      <img
                        src={saree.image}
                        alt={saree.title || '-'}
                        className="w-full h-16 object-cover rounded-lg mb-1"
                      />
                    ) : (
                      <span className="w-full h-16 rounded-lg mb-1 bg-sand-100 flex items-center justify-center text-charcoal-400">-</span>
                    )}
                    <span className="text-[10px] font-medium text-charcoal-900 block truncate">
                      {saree.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Model Pose */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-2">
                2. Select Model Pose (`model_image`)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {modelOptions.length === 0 ? <span className="text-xs text-charcoal-400">-</span> : null}
                {modelOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedModel(opt.url)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      selectedModel === opt.url
                        ? 'border-gold-600 ring-2 ring-gold-400 bg-gold-50/40'
                        : 'border-sand-300 hover:border-sand-400'
                    }`}
                  >
                    <img
                      src={opt.url}
                      alt={opt.label}
                      className="w-full h-20 object-cover rounded-lg mb-1"
                    />
                    <span className="text-[10px] font-medium text-charcoal-900 block truncate">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Generation Mode */}
            <div className="flex items-center justify-between pt-2 border-t border-sand-200">
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">
                  Rendering Mode
                </span>
                <span className="text-[10px] text-charcoal-500">
                  Quality preserves zari shine and border pleats
                </span>
              </div>
              <div className="flex items-center gap-2">
                {['performance', 'quality'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSandboxMode(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                      sandboxMode === m
                        ? 'bg-gold-600 text-white shadow-sm'
                        : 'bg-sand-100 text-charcoal-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunSandbox}
              disabled={isGenerating || !selectedSaree}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-gold-600/20 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Neural Drape with FASHN.ai (tryon-max)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run FASHN.ai Prediction</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display Canvas */}
          <div className="bg-white p-6 rounded-[24px] border border-sand-300/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-sand-200 pb-3 mb-4">
                <span className="font-serif font-bold text-sm text-charcoal-900">
                  Prediction Output Canvas
                </span>
                {sandboxResult && (
                  <Badge variant="gold" size="xs">
                    {sandboxResult.latencySeconds}s Latency
                  </Badge>
                )}
              </div>

              {isGenerating ? (
                <div className="h-80 rounded-2xl bg-sand-50 border border-dashed border-sand-300 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center animate-spin">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-charcoal-900">
                    FASHN.ai Processing
                  </h4>
                  <p className="text-xs text-charcoal-500 max-w-xs leading-relaxed">
                    Analyzing model silhouette, aligning saree pallu physics, and blending gold zari reflections...
                  </p>
                </div>
              ) : sandboxResult ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-500 block mb-1">
                      Input Saree (`product_image`)
                    </span>
                    {sandboxResult.productImage ? (
                      <img
                        src={sandboxResult.productImage}
                        alt="Input"
                        className="w-full h-72 object-cover rounded-xl border border-sand-300"
                      />
                    ) : (
                      <span className="w-full h-72 rounded-xl border border-sand-300 flex items-center justify-center text-charcoal-400">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-500 block mb-1">
                      Synthesized Output (`tryon-max`)
                    </span>
                    {sandboxResult.outputImage ? (
                      <img
                        src={sandboxResult.outputImage}
                        alt="Output"
                        className="w-full h-72 object-cover rounded-xl border-2 border-gold-500 shadow-md"
                      />
                    ) : (
                      <span className="w-full h-72 rounded-xl border-2 border-gold-500 flex items-center justify-center text-charcoal-400">-</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-80 rounded-2xl bg-sand-50/60 border border-dashed border-sand-300 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <ImageIcon className="w-8 h-8 text-sand-400" />
                  <span className="text-xs font-semibold text-charcoal-700">
                    No Prediction Generated Yet
                  </span>
                  <p className="text-[11px] text-charcoal-400 max-w-xs">
                    Select a saree from the left and click "Run FASHN.ai Prediction" to inspect the output.
                  </p>
                </div>
              )}
            </div>

            {sandboxResult && (
              <div className="p-3 rounded-xl bg-gold-50/70 border border-gold-200 mt-4 text-[11px] text-gold-900 flex items-center justify-between">
                <span>Model: {sandboxResult.modelName} &bull; Cost: 1 credit</span>
                <button
                  onClick={() => setLightboxItem(sandboxResult)}
                  className="font-semibold underline hover:text-gold-950"
                >
                  View Full Screen Lightbox
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: API Settings & Credentials */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-[24px] border border-sand-300/80 shadow-sm max-w-2xl space-y-5">
          <div className="border-b border-sand-200 pb-3">
            <h3 className="font-serif font-bold text-base text-charcoal-900">
              FASHN.ai Developer Integration Keys
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Production API credentials powering automated virtual try-on in the mobile app.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                FASHN API Secret Key
              </label>
              <input
                type="text"
                disabled
                value={config?.apiKeyMasked || '-'}
                className="w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-mono text-charcoal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                FASHN REST API Endpoint
              </label>
              <input
                type="text"
                disabled
                value="https://api.fashn.ai/v1/run"
                className="w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-mono text-charcoal-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Default Garment Category
                </label>
                <input
                  type="text"
                  disabled
                  value="one-pieces (Saree Drapes)"
                  className="w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-charcoal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Safety NSFW Filter
                </label>
                <div className="flex items-center gap-2 py-2">
                  <ShieldCheck className="w-4 h-4 text-gold-600" />
                  <span className="text-xs font-medium text-charcoal-900">
                    Strict Automated Filter
                  </span>
                </div>
              </div>
            </div>
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

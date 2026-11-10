import React, { useState, useEffect, useCallback } from 'react';
import { auditService } from '../services/auditService';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  History,
  Search,
} from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await auditService.getAuditLogs({
      search,
      action: actionFilter,
      page,
      limit: 12,
    });
    if (res.success) {
      setLogs(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [search, actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionVariants = {
    CREATE_SAREE: 'gold',
    UPDATE_SAREE: 'gold',
    DELETE_SAREE: 'maroon',
    UPDATE_PRICE: 'saffron',
    BLOCK_USER: 'maroon',
    UNBLOCK_USER: 'gold',
    MODERATE_LOOK: 'amber',
    UPDATE_SYSTEM_CONFIG: 'purple',
    LOGIN: 'blue',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-sand-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">
              Compliance & Security
            </span>
            <Badge variant="gold" size="xs">
              Immutable Records
            </Badge>
          </div>
          <h1 className="font-serif text-2xl font-bold text-charcoal-900 mt-0.5">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Complete cryptographic audit trail of staff actions, price adjustments, inventory updates, and role alterations.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-sand-300 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by actor, action description, or resource ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-sand-300 focus:border-gold-500 text-charcoal-900"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 text-xs rounded-xl border border-sand-300 text-charcoal-800 bg-white focus:border-gold-500"
          >
            <option value="all">All Action Types</option>
            <option value="UPDATE_PRICE">Price Updates</option>
            <option value="CREATE_SAREE">Saree Creations</option>
            <option value="DELETE_SAREE">Saree Deletions</option>
            <option value="BLOCK_USER">User Suspension</option>
            <option value="UPDATE_ENQUIRY_STATUS">Enquiry Statuses</option>
            <option value="UPDATE_SYSTEM_CONFIG">System Configuration</option>
            <option value="LOGIN">Staff Logins</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-sand-300 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit events found"
            description="No system records correspond to this filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50/80 border-b border-sand-200 text-charcoal-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Timestamp</th>
                  <th className="py-3.5 px-3">Staff Actor</th>
                  <th className="py-3.5 px-3">Action</th>
                  <th className="py-3.5 px-3">Resource Target</th>
                  <th className="py-3.5 pl-3 pr-6">Operational Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 text-charcoal-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="py-3.5 pl-6 pr-3 whitespace-nowrap text-charcoal-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-charcoal-900">{log.actorName}</div>
                      <span className="text-[10px] text-charcoal-400 capitalize">
                        {log.actorRole} &bull; {log.ipAddress}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <Badge variant={actionVariants[log.action] || 'default'} size="xs">
                        {log.action}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[11px] text-gold-900 whitespace-nowrap">
                      {log.resource}
                    </td>

                    <td className="py-3.5 pl-3 pr-6 text-charcoal-700">
                      {log.description}
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
          limit={12}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}

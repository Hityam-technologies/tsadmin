import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Heart,
  Eye,
  ChevronRight,
} from 'lucide-react';

export function UsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // User Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Block Modal State
  const [blockUserTarget, setBlockUserTarget] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await userService.getUsers({
      search,
      status: statusFilter,
      page,
      limit: 10,
    });
    if (res.success) {
      setUsers(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDetail = async (user) => {
    setIsDetailOpen(true);
    const res = await userService.getUserById(user.id);
    if (res.success) {
      setSelectedUser(res.data);
    }
  };

  const handleBlockClick = (user) => {
    setBlockUserTarget(user);
    setBlockReason(user.blockReason || '');
    setIsBlockModalOpen(true);
  };

  const confirmBlockToggle = async () => {
    if (!blockUserTarget) return;
    const isBlocking = !blockUserTarget.isBlocked;
    const res = await userService.toggleBlockUser(
      blockUserTarget.id,
      isBlocking,
      isBlocking ? blockReason : ''
    );
    if (res.success) {
      showToast(
        isBlocking
          ? `Account suspended for ${blockUserTarget.name}`
          : `Account reinstated for ${blockUserTarget.name}`,
        'info'
      );
      setIsBlockModalOpen(false);
      setBlockUserTarget(null);
      fetchUsers();
      if (selectedUser && selectedUser.id === blockUserTarget.id) {
        setSelectedUser({ ...selectedUser, isBlocked: isBlocking });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-700">
            Client Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-0.5">
            Registered Customers & Staff Accounts
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1 font-medium">
            Monitor client wishlists, 3D try-on looks, enquiries, and account security.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-sand-300 focus:border-gold-500 text-charcoal-900 font-medium"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-sand-300 text-charcoal-800 bg-white focus:border-gold-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="blocked">Blocked / Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="No clients or staff match your search and filter parameters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-sand-50/80 border-b border-sand-200 text-charcoal-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">User</th>
                  <th className="py-3.5 px-3">Contact</th>
                  <th className="py-3.5 px-3">Wishlist & Looks</th>
                  <th className="py-3.5 px-3">Account Status</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 text-charcoal-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleOpenDetail(user)}
                    className="hover:bg-sand-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sand-100 ring-1 ring-gold-400 flex items-center justify-center text-xs font-bold text-charcoal-500 flex-shrink-0">
                          {(user.name || '-').charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-charcoal-900">{user.name}</div>
                          <span className="text-[10px] text-charcoal-400 font-mono">
                            ID: {user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-charcoal-800">{user.phone}</div>
                      <div className="text-[10px] text-charcoal-400">{user.email}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3 text-xs text-charcoal-600">
                        <span className="flex items-center gap-1" title="Wishlisted Sarees">
                          <Heart className="w-3.5 h-3.5 text-saffron-600 fill-saffron-100" />
                          {user.wishlistCount ?? user.wishlist?.length ?? 0}
                        </span>
                        <span className="flex items-center gap-1" title="Saved 3D Virtual Try-On Looks">
                          <Eye className="w-3.5 h-3.5 text-gold-600" />
                          {user.savedLooksCount || 0}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {user.isBlocked ? (
                        <Badge variant="maroon" size="xs">
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="gold" size="xs">
                          Active
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 pl-3 pr-6 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(
                          <button
                            onClick={() => handleBlockClick(user)}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                              user.isBlocked
                                ? 'text-gold-800 hover:bg-gold-50'
                                : 'text-maroon-600 hover:bg-maroon-50'
                            }`}
                            title={user.isBlocked ? 'Reinstate Account' : 'Suspend Account'}
                          >
                            {user.isBlocked ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetail(user)}
                          className="p-1.5 text-gold-700 hover:bg-gold-50 rounded-lg"
                          title="View Full Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
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
          limit={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* User Detail Drawer / Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedUser?.name || 'User Profile'}
        subtitle={`Member since ${selectedUser?.joinedDate || selectedUser?.createdAt || '-'}`}
        maxWidth="max-w-3xl"
      >
        {selectedUser && (
          <div className="space-y-6 pt-1">
            {/* Profile Overview */}
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-sand-100 ring-2 ring-gold-400 flex items-center justify-center font-bold text-charcoal-500">
                  {(selectedUser.name || '-').charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-charcoal-900">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" size="xs">
                      Customer
                    </Badge>
                    {selectedUser.isBlocked && (
                      <Badge variant="maroon" size="xs">
                        Suspended
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Block reason if suspended */}
            {selectedUser.isBlocked && selectedUser.blockReason && (
              <div className="p-3 rounded-xl bg-maroon-50 border border-maroon-200 text-xs text-maroon-800">
                <span className="font-semibold block mb-0.5">Suspension Reason:</span>
                {selectedUser.blockReason}
              </div>
            )}

            {/* Wishlist Sarees */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-saffron-600 fill-saffron-100" />
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  Customer Wishlisted Sarees ({selectedUser.wishlistSarees?.length || 0})
                </span>
              </div>

              {selectedUser.wishlistSarees && selectedUser.wishlistSarees.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedUser.wishlistSarees.map((saree) => (
                    <div
                      key={saree.id}
                      className="p-3 rounded-xl bg-white border border-sand-200 flex items-center gap-3 shadow-sm"
                    >
                      {saree.image ? (
                        <img
                          src={saree.image}
                          alt={saree.title || '-'}
                          className="w-10 h-12 rounded object-cover ring-1 ring-sand-300"
                        />
                      ) : (
                        <span className="w-10 h-12 rounded ring-1 ring-sand-300 flex items-center justify-center text-charcoal-400">-</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-xs text-charcoal-900 block truncate">
                          {saree.title}
                        </span>
                        <span className="text-[11px] text-gold-700 font-semibold block">
                          {saree.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-charcoal-400">-</p>
              )}
            </div>

            {/* Saved Try-On Looks */}
            <div className="pt-2 border-t border-sand-200">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-gold-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  Saved Virtual Try-On Looks ({selectedUser.userLooks?.length || 0})
                </span>
              </div>

              {selectedUser.userLooks && selectedUser.userLooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedUser.userLooks.map((look) => (
                    <div
                      key={look.id}
                      className="rounded-xl overflow-hidden border border-sand-200 bg-sand-50 p-1"
                    >
                      {look.drapeImage ? (
                        <img
                          src={look.drapeImage}
                          alt={look.sareeTitle || '-'}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <span className="w-full h-24 rounded-lg flex items-center justify-center text-charcoal-400">-</span>
                      )}
                      <span className="text-[10px] text-charcoal-700 block truncate p-1 font-medium">
                        {look.sareeTitle || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-charcoal-400">-</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Block / Unblock Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={blockUserTarget?.isBlocked ? 'Reinstate Account' : 'Suspend Customer Account'}
        subtitle="Manage customer access to mobile purchases and concierge inquiries."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2">
          {!blockUserTarget?.isBlocked && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Reason for Account Suspension *
              </label>
              <textarea
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Fraudulent transaction attempts, chargeback dispute..."
                className="w-full rounded-xl border border-sand-300 p-2 text-xs"
              />
            </div>
          )}

          <p className="text-xs text-charcoal-500">
            {blockUserTarget?.isBlocked
              ? `Reactivating this account will restore mobile login access for ${blockUserTarget?.name}.`
              : `Suspending will immediately invalidate active app sessions for ${blockUserTarget?.name}.`}
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-sand-200">
            <button
              onClick={() => setIsBlockModalOpen(false)}
              className="px-3 py-1.5 rounded-xl border border-sand-300 text-xs text-charcoal-700"
            >
              Cancel
            </button>
            <button
              onClick={confirmBlockToggle}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm ${
                blockUserTarget?.isBlocked
                  ? 'bg-gold-600 hover:bg-gold-700'
                  : 'bg-maroon-600 hover:bg-maroon-700'
              }`}
            >
              {blockUserTarget?.isBlocked ? 'Confirm Reinstatement' : 'Suspend Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

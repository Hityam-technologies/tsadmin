import { apiRequest, db } from './apiClient';

export const dashboardService = {
  /**
   * Get Dashboard Aggregates & Trends
   * API: GET /admin/dashboard/stats
   */
  async getStats() {
    return apiRequest('/admin/dashboard/stats', { method: 'GET' }, async () => {
      const totalUsers = db.users.filter((u) => u.role === 'customer').length;
      const totalSarees = db.sarees.length;
      const openEnquiries = db.enquiries.filter(
        (e) => e.status === 'new' || e.status === 'contacted'
      ).length;
      const savedLooks = db.looks.length;
      const lowStockSarees = db.sarees.filter(
        (s) => s.stockQuantity !== undefined && s.stockQuantity <= 2
      );

      const recentEnquiries = db.enquiries.slice(0, 5);

      const monthlyTrends = [
        { month: 'Jun', enquiries: 42, tryOnLooks: 180, wishlistSaves: 320 },
        { month: 'Jul', enquiries: 58, tryOnLooks: 240, wishlistSaves: 410 },
        { month: 'Aug', enquiries: 74, tryOnLooks: 310, wishlistSaves: 520 },
        { month: 'Sep', enquiries: 65, tryOnLooks: 290, wishlistSaves: 480 },
        { month: 'Oct', enquiries: 92, tryOnLooks: 430, wishlistSaves: 670 },
        { month: 'Nov', enquiries: 118, tryOnLooks: 560, wishlistSaves: 890 },
      ];

      const categoryBreakdown = db.categories.map((cat) => {
        const matchingSarees = db.sarees.filter((s) => s.category === cat.id);
        const totalVal = matchingSarees.reduce((acc, curr) => acc + (curr.numericPrice || 0), 0);
        return {
          category: cat.label,
          count: matchingSarees.length,
          value: totalVal,
        };
      });

      return {
        counts: {
          totalUsers,
          totalSarees,
          openEnquiries,
          savedLooks,
          lowStockCount: lowStockSarees.length,
        },
        recentEnquiries,
        lowStockSarees,
        trends: {
          monthlyTrends,
          categoryBreakdown,
        },
      };
    });
  },
};


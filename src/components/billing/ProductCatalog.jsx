import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Plus, AlertCircle } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { Skeleton } from '../common/Skeleton';

export function ProductCatalog({
  products = [],
  cartItems = [],
  onAddToCart,
  categories = [],
  loading = false,
  error = '',
  onRetry,
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef(null);

  // Auto-focus search input on initial mount for fast counter billing
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter products locally for instant 0ms latency UI responsiveness
  // STRICT RULE: Items that got sold out (stockQuantity <= 0) are NOT shown in the POS billing catalog, only in the Sold Out Archive!
  const filteredProducts = products.filter((item) => {
    const stock = Number(item.stockQuantity) || 0;
    if (stock <= 0) return false;

    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      String(item.productCode || '').toLowerCase().includes(q) ||
      (item.title || '').toLowerCase().includes(q) ||
      (item.brand || '').toLowerCase().includes(q) ||
      (item.weave || '').toLowerCase().includes(q) ||
      (item.fabric || '').toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  // Handle barcode scanner simulated input / Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      const exactMatch = products.find(
        (p) =>
          String(p.productCode || '').toLowerCase() === search.trim().toLowerCase() ||
          p.id.toLowerCase() === search.trim().toLowerCase()
      );
      if (exactMatch && (exactMatch.stockQuantity || 0) > 0) {
        onAddToCart(exactMatch);
        setSearch('');
      } else if (filteredProducts.length === 1 && (filteredProducts[0].stockQuantity || 0) > 0) {
        onAddToCart(filteredProducts[0]);
        setSearch('');
      }
    }
  };

  const getCartQuantity = (productId) => {
    const found = cartItems.find((item) => item.sareeId === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full max-h-full bg-white/95 backdrop-blur-xl rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-4 sm:p-5 overflow-hidden">
      {/* =========================================================================
          FIXED TOP CONTROLS: Product Search (NEVER SCROLLS)
         ========================================================================= */}
      <div className="flex-shrink-0 space-y-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="h-4 w-4 text-charcoal-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search sarees by title, code, weave..."
              className="block w-full rounded-xl border border-sand-300 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors font-medium bg-white shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-3 flex items-center pr-1 text-xs text-charcoal-400 hover:text-charcoal-700 font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 border-t border-sand-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-charcoal-900 text-white shadow-xs'
                : 'bg-sand-50 hover:bg-white text-charcoal-700 hover:text-charcoal-900 border border-sand-200 shadow-2xs'
            }`}
          >
            All Weaves
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-charcoal-900 text-white shadow-xs'
                  : 'bg-sand-50 hover:bg-white text-charcoal-700 hover:text-charcoal-900 border border-sand-200 shadow-2xs'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          ONLY THIS AREA SCROLLS: Saree Catalog Grid with explicit scrollbar
         ========================================================================= */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1.5 billing-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 pb-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[3/4] sm:aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-sand-50/60 rounded-2xl border border-dashed border-sand-300">
            <AlertCircle className="w-8 h-8 text-charcoal-400 mb-2" />
            <p className="text-sm font-bold text-charcoal-800">The saree list could not be loaded</p>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold cursor-pointer"
              >
                Try again
              </button>
            )}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-sand-50/60 rounded-2xl border border-dashed border-sand-300">
            <AlertCircle className="w-8 h-8 text-charcoal-400 mb-2" />
            <p className="text-sm font-bold text-charcoal-800">No Sarees Found</p>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm">
              Try searching by 6-digit ID (e.g. 100001), weave type, or reset the filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 pb-4">
            {filteredProducts.map((product) => {
              const stock = Number(product.stockQuantity) || 0;
              const cartQty = getCartQuantity(product.id);
              const isOutOfStock = stock === 0;
              const isAtMaxStock = cartQty >= stock;
              const fallbackImage = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80';
              const image =
                (product.images && product.images[0]) ||
                product.image ||
                fallbackImage;

              return (
                <div
                  key={product.id}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-end aspect-[3/4] sm:aspect-[4/5] bg-charcoal-950 shadow-sm hover:shadow-xl ${
                    cartQty > 0
                      ? 'border-gold-500 ring-2 ring-gold-500/50 shadow-md'
                      : 'border-sand-200/90 hover:border-gold-400'
                  }`}
                >
                  {/* Full Background Saree Image */}
                  <img
                    src={image}
                    alt={product.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackImage;
                    }}
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Top Bar Badges (Floating on Image) */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-none">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-charcoal-950/80 text-white backdrop-blur-md border border-white/15 shadow-sm">
                      #{product.productCode || '100001'}
                    </span>

                    {/* Stock Alert - Only if Low Stock or Out of Stock */}
                    {isOutOfStock ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-maroon-700/95 text-white backdrop-blur-md shadow-sm">
                        Sold Out
                      </span>
                    ) : stock <= 2 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-saffron-600/95 text-white backdrop-blur-md shadow-sm">
                        Only {stock} Left
                      </span>
                    ) : null}
                  </div>

                  {/* Bottom Gradient Overlay (Smoothly fades in from bottom) */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(to top, rgba(15, 14, 13, 0.96) 0%, rgba(15, 14, 13, 0.78) 36%, rgba(15, 14, 13, 0.35) 65%, transparent 100%)',
                    }}
                  />

                  {/* Saree Details Positioned ON the Bottom Gradient */}
                  <div className="relative z-20 p-3 sm:p-3.5 space-y-2">
                    <div>
                      <h3
                        className="text-xs sm:text-sm font-semibold text-white line-clamp-2 drop-shadow-sm leading-snug"
                        title={product.title}
                      >
                        {product.title}
                      </h3>
                    </div>

                    {/* Price & Add Button */}
                    <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-1.5">
                      <span className="text-sm sm:text-base font-extrabold text-gold-300 font-mono drop-shadow-sm">
                        {formatINR(product.numericPrice || product.price)}
                      </span>

                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        disabled={isOutOfStock || isAtMaxStock}
                        className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                          isOutOfStock
                            ? 'bg-charcoal-700/80 text-charcoal-400 cursor-not-allowed border border-white/10'
                            : isAtMaxStock
                            ? 'bg-charcoal-700/80 text-charcoal-300 cursor-not-allowed border border-white/10'
                            : cartQty > 0
                            ? 'bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-extrabold shadow-gold-500/30'
                            : 'bg-white hover:bg-gold-50 text-charcoal-950'
                        }`}
                      >
                        {cartQty > 0 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added ({cartQty})</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

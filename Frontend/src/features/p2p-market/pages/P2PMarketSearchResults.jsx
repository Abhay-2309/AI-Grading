import React, { useState, useEffect, useMemo } from 'react';
import LocationPill from '../components/LocationPill';
import { distanceKm, formatDistance } from '../../../services/geo';

export default function P2PMarketSearchResults({
  p2pProducts,
  userLocation,
  onDetectLocation,
  initialQuery = '',
  initialCategory = 'All',
  initialFilter = '',
  onNavigate,
  onExit
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  
  // Sidebar Filters State
  const [sortBy, setSortBy] = useState('Recommended');
  const [maxPrice, setMaxPrice] = useState(100000);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('Anytime'); // Posting Date equivalent or Condition
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Sync state if initial props change
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialFilter === 'elite') {
      setShowVerifiedOnly(true);
    } else {
      setShowVerifiedOnly(false);
    }
  }, [initialFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Keep search query local to this view and trigger filter update
  };

  const sortByDistance = (a, b) => {
    if (a.distKm == null) return 1;
    if (b.distKm == null) return -1;
    return a.distKm - b.distKm;
  };

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    const haveLocation = userLocation?.status === 'done';
    let result = p2pProducts.map((p) => ({
      ...p,
      distKm: haveLocation && p.lat != null && p.lng != null
        ? distanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng)
        : null,
    }));

    // Filter by Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Filter by Category
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Filter by Price Min
    const minP = parseFloat(minPriceInput);
    if (!isNaN(minP)) {
      result = result.filter(p => p.price >= minP);
    }

    // Filter by Price Max (Slider / Input)
    const maxP = parseFloat(maxPriceInput);
    if (!isNaN(maxP)) {
      result = result.filter(p => p.price <= maxP);
    } else if (maxPrice > 0) {
      result = result.filter(p => p.price <= maxPrice);
    }

    // Filter by Verified Only
    if (showVerifiedOnly) {
      result = result.filter(p => p.verified);
    }

    // Sorting — nearest-first is the default "Recommended" order once we
    // know where the customer is, same as the Home page; still applies
    // under an active search query/category, not just the unfiltered feed.
    if (sortBy === 'Nearest to Farthest' || (sortBy === 'Recommended' && haveLocation)) {
      result.sort(sortByDistance);
    } else if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Newest Arrivals') {
      // simulate id sorting
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'Customer Rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [p2pProducts, searchQuery, activeCategory, sortBy, maxPrice, minPriceInput, maxPriceInput, showVerifiedOnly, userLocation]);

  const handleClearAll = () => {
    setSortBy('Recommended');
    setMaxPrice(100000);
    setMinPriceInput('');
    setMaxPriceInput('');
    setSelectedCondition('Anytime');
    setShowVerifiedOnly(false);
    setSearchQuery('');
    setActiveCategory('All');
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
      {/* TopNavBar */}
      <header className="bg-[#232F3E] text-white sticky top-0 z-50 shadow-md">
        {/* Upper Bar */}
        <div className="flex justify-between items-center w-full px-6 py-2.5 gap-6 max-w-[1440px] mx-auto">
          {/* Brand Logo */}
          <button 
            onClick={() => onNavigate('home')} 
            className="text-xl md:text-2xl font-black text-white hover:text-orange-400 transition-colors bg-transparent border-none cursor-pointer focus:outline-none shrink-0"
          >
            MarketConnect
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-grow max-w-2xl">
            <div className="flex items-center">
              <input
                className="w-full bg-white border-none rounded-l-md py-2 px-4 text-xs focus:outline-none text-slate-900 placeholder-slate-500"
                placeholder="Search for anything..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-[#febd69] hover:bg-[#f3a847] text-[#111111] px-5 py-2.5 rounded-r-md flex items-center justify-center transition-colors border-none cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[#111111] text-[18px]">search</span>
              </button>
            </div>
          </form>

          {/* Actions Cluster */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Location */}
            <LocationPill userLocation={userLocation} onDetectLocation={onDetectLocation} />

            {/* Hello, Sign in */}
            <div className="hidden md:flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all">
              <span className="text-[10px] opacity-75">Hello, Sign in</span>
              <span className="text-xs font-bold">Account & Lists</span>
            </div>

            {/* Returns & Orders */}
            <button 
              onClick={() => onNavigate('home')}
              className="bg-transparent border-none text-white hidden md:flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all text-left focus:outline-none"
            >
              <span className="text-[10px] opacity-75">Returns</span>
              <span className="text-xs font-bold">& Orders</span>
            </button>

            {/* Chat Link */}
            <button 
              onClick={() => onNavigate('messages')}
              className="bg-transparent border-none text-white flex flex-col items-center cursor-pointer hover:text-orange-400 transition-all focus:outline-none p-1"
            >
              <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
              <span className="text-[10px] font-bold mt-0.5">Chat</span>
            </button>

            {/* User Profile Avatar */}
            <div className="w-9 h-9 rounded-full border-2 border-[#febd69] overflow-hidden shrink-0 cursor-pointer">
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT9c2SyWdJm1WQnazqi8D3rkYonHWiVxVV2SRGPXh3UyIC0lShKamMfyOxom6kPDdDmYlgIFcCsKixg28TjNyZYvf3CUUMsfqSxOMqnzpXmDT9uihEX8H2aEcSrlv-C6LVLmwpOyRm5KtYb0-hTwZKEeeOFvYQivBnkOALPM759biUUjfax6Vck7rzyqTTKOb6nQ0FAfl4Ml32tIj6BKontw1nnEOCh6FfCb-evQVOY8sg7ToqfAly7Q" 
                alt="Profile Avatar" 
              />
            </div>

            {/* Sell Pill Button */}
            <button 
              onClick={() => onNavigate('sell')}
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-600 p-[2px] rounded-full hover:scale-105 transition-all cursor-pointer border-none shadow"
            >
              <div className="bg-white rounded-full px-4 py-1 flex items-center justify-center gap-1">
                <span className="text-base font-black text-[#0f3b8c] leading-none">+</span>
                <span className="text-xs font-black text-[#0f3b8c] tracking-wider leading-none">SELL</span>
              </div>
            </button>

            {/* Exit Portal */}
            <button 
              onClick={onExit}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer border-none shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Exit
            </button>
          </div>
        </div>

        {/* Lower Navigation links (Light Grey bg) */}
        <div className="bg-[#eaeded] border-b border-slate-200 py-1.5 text-slate-700">
          <div className="max-w-[1440px] mx-auto flex items-center gap-6 px-6 overflow-x-auto scrollbar-none">
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 text-slate-800 font-bold hover:text-orange-600 text-xs bg-transparent border-none cursor-pointer focus:outline-none"
            >
              <span className="material-symbols-outlined text-[16px]">menu</span> All
            </button>
            <nav className="flex items-center gap-6 whitespace-nowrap text-xs">
              {[
                { label: 'Deals', catValue: 'All' },
                { label: 'Groceries', catValue: 'Groceries' },
                { label: 'Fashion', catValue: 'Fashion' },
                { label: 'Electronics', catValue: 'Electronics' },
                { label: 'Home', catValue: 'Furniture' },
                { label: 'Sports', catValue: 'Photography' }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveCategory(item.catValue)}
                  className={`font-bold transition-colors cursor-pointer bg-transparent border-none focus:outline-none pb-0.5 ${
                    activeCategory === item.catValue 
                      ? 'text-slate-700 border-b-2 border-orange-500' 
                      : 'text-slate-650 hover:text-orange-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 mb-6 text-xs text-slate-500 font-medium">
          <button onClick={() => onNavigate('home')} className="hover:text-orange-600 cursor-pointer bg-transparent border-none p-0">Home</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="hover:text-orange-600">{activeCategory}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-800 font-bold">Search Results</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-md font-bold text-slate-800">Filters</h2>
              <button 
                onClick={handleClearAll}
                className="text-orange-600 text-xs font-bold hover:underline bg-transparent border-none cursor-pointer"
              >
                Clear all
              </button>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none cursor-pointer text-slate-700"
              >
                <option>Recommended</option>
                {userLocation?.status === 'done' && <option>Nearest to Farthest</option>}
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
                <option>Customer Rating</option>
              </select>
              {userLocation?.status === 'done' && sortBy === 'Recommended' && (
                <p className="text-[10px] text-emerald-600 font-semibold">Sorted nearest to {userLocation.label} first</p>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price Limit (₹{maxPrice.toLocaleString('en-IN')})</label>
              <div className="pt-2 px-1">
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between items-center mt-3 gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
                    <input 
                      type="number"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-5 pr-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <span className="text-slate-400 text-xs">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
                    <input 
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-5 pr-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Posting Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posting Date</label>
              <div className="space-y-1.5">
                {['Last 24 hours', 'Last 7 days', 'Anytime'].map((dateOption) => (
                  <label key={dateOption} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input 
                      type="radio"
                      name="date"
                      checked={selectedCondition === dateOption}
                      onChange={() => setSelectedCondition(dateOption)}
                      className="w-4 h-4 border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span>{dateOption}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4 mr-2"
                />
                <span className="text-xs font-semibold text-slate-800">Verified Sellers Only</span>
              </label>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="flex-grow min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
              <div>
                <h1 className="text-lg font-extrabold text-slate-800 leading-tight">
                  Showing {filteredProducts.length} results in <span className="text-orange-600">India</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">High-quality peer-to-peer finds tailored for you.</p>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-12 text-center space-y-4">
                <span className="material-symbols-outlined text-[48px] text-slate-300">search_off</span>
                <h3 className="text-base font-bold text-slate-800">No matching items found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your price filters, selecting a different category, or clearing your query.
                </p>
                <button 
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs border-none cursor-pointer transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Product Card Rendering */}
                {filteredProducts.map((product, index) => (
                  <React.Fragment key={product.id}>
                    {/* Render listings card */}
                    <div 
                      onClick={() => onNavigate('detail', { productId: product.id })}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200/50 hover:border-orange-500/30 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative h-44 overflow-hidden bg-slate-100">
                        <img 
                          className="w-full h-full object-cover" 
                          alt={product.title} 
                          src={product.image}
                        />
                        {product.verified && (
                           <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                             <div className="bg-orange-500 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                               Verified
                             </div>
                             {product.grade && (
                               <div className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                 Grade {product.grade}
                               </div>
                             )}
                           </div>
                         )}
                      </div>
                      <div className="p-3.5 space-y-1.5 flex-grow flex flex-col justify-between text-left">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h3 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">{product.title}</h3>
                            <span className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-bold text-slate-500 whitespace-nowrap">
                              {product.condition}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-none">{product.category}</p>
                          {product.distKm != null && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px]">near_me</span>
                              {formatDistance(product.distKm)}
                            </p>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-green-700 text-[10px] font-bold">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            <span>{product.seller}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                            <span className="text-sm font-extrabold text-orange-600">₹{product.price.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400">{product.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Insert Native Partner Ad at index 1 to break up cards nicely */}
                    {index === 1 && (
                      <div className="sm:col-span-2 bg-[#232F3E] rounded-xl overflow-hidden relative flex flex-col md:flex-row shadow-sm text-left">
                        <div className="p-6 flex-1 flex flex-col justify-center space-y-3 text-white z-10">
                          <div className="bg-orange-500 w-fit px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest">
                            Partner Ad
                          </div>
                          <h2 className="text-base font-bold leading-tight">Turn your unused items into instant cash.</h2>
                          <p className="text-[11px] text-slate-300">Join over 5,000 sellers in India this month. Listing takes less than 60 seconds.</p>
                          <button 
                            onClick={() => onNavigate('sell')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-xs w-fit border-none cursor-pointer transition-opacity flex items-center gap-1.5 mt-2"
                          >
                            Start Selling Now
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </div>
                        <div className="relative w-full md:w-1/2 h-36 md:h-full shrink-0">
                          <img 
                            className="w-full h-full object-cover" 
                            alt="Partner Ad seller" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmpvx66iGJ_heTujFkhvEyyq2DviX0p5bdSEjDLb6MDtGksX-FqJooC5syXs0Dv-YjnbzPFl3H5LLnYI_1R-TywhJgKLWeBVhsgOn8tnk_z-TuU2-jP49vEAtjEqJt_0gyIjcWsdAgE4a3VS5godi3pvnsPBVbnhQIk_R2-Fxlg0h-3v3wZ-r7ha0xThMeqbUTbaw9pC9LgcDANQdCCHNb0gIoHncL3lynlS10YL_IijDe_paMfJCCSA"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#232F3E] via-transparent to-transparent"></div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-50 cursor-pointer" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="w-8 h-8 bg-orange-500 text-white rounded-lg font-bold text-xs">1</button>
                <button className="w-8 h-8 hover:bg-slate-200 rounded-lg font-medium text-slate-700 text-xs cursor-pointer">2</button>
                <button className="w-8 h-8 hover:bg-slate-200 rounded-lg font-medium text-slate-700 text-xs cursor-pointer">3</button>
                <span className="px-1 text-slate-400 text-xs">...</span>
                <button className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800 text-left text-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full px-6 py-12 max-w-[1440px] mx-auto">
          <div className="space-y-3">
            <div className="font-bold text-orange-400 text-sm">
              MarketConnect
            </div>
            <p className="text-slate-400 leading-relaxed">The leading peer-to-peer marketplace for trusted transactions in India.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-300 uppercase text-[10px]">Company</h4>
            <nav className="flex flex-col gap-2">
              <a className="text-slate-400 hover:text-white" href="#">About Us</a>
              <a className="text-slate-400 hover:text-white" href="#">Careers</a>
            </nav>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-300 uppercase text-[10px]">Support</h4>
            <nav className="flex flex-col gap-2">
              <a className="text-slate-400 hover:text-white" href="#">Help Center</a>
              <a className="text-slate-400 hover:text-white" href="#">Safety Guidelines</a>
            </nav>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-300 uppercase text-[10px]">Legal</h4>
            <nav className="flex flex-col gap-2">
              <a className="text-slate-400 hover:text-white" href="#">Terms of Service</a>
              <a className="text-slate-400 hover:text-white" href="#">Privacy Policy</a>
            </nav>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 py-4 border-t border-slate-800 flex justify-between items-center text-slate-500">
          <p>© 2026 MarketConnect Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

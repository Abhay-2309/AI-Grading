import React, { useState, useMemo } from 'react';
import LocationPill from '../components/LocationPill';
import { distanceKm, formatDistance } from '../../../services/geo';

export default function P2PMarketHome({
  p2pProducts,
  userLocation,
  onDetectLocation,
  onNavigate,
  onExit
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery });
  };

  // Recommended products — nearest first once we know where the customer
  // is; items without coordinates sort to the end rather than being hidden.
  const sortedProducts = useMemo(() => {
    if (userLocation?.status !== 'done') return p2pProducts;
    return [...p2pProducts]
      .map((p) => ({
        ...p,
        distKm: p.lat != null && p.lng != null ? distanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng) : null,
      }))
      .sort((a, b) => {
        if (a.distKm == null) return 1;
        if (b.distKm == null) return -1;
        return a.distKm - b.distKm;
      });
  }, [p2pProducts, userLocation]);

  const recommendedProducts = sortedProducts.slice(0, 5);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
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
            <button className="flex items-center gap-1 text-slate-800 font-bold hover:text-orange-600 text-xs bg-transparent border-none cursor-pointer focus:outline-none">
              <span className="material-symbols-outlined text-[16px]">menu</span> All
            </button>
            <nav className="flex items-center gap-6 whitespace-nowrap text-xs">
              <button 
                type="button" 
                onClick={() => onNavigate('search', { category: 'All' })} 
                className="text-slate-700 hover:text-orange-600 font-bold bg-transparent border-none cursor-pointer focus:outline-none pb-0.5 border-b-2 border-orange-500"
              >
                Deals
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate('search', { category: 'Groceries' })} 
                className="text-slate-650 hover:text-orange-600 font-bold bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Groceries
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate('search', { category: 'Fashion' })} 
                className="text-slate-650 hover:text-orange-600 font-bold bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Fashion
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate('search', { category: 'Electronics' })} 
                className="text-slate-650 hover:text-orange-600 font-bold bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Electronics
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate('search', { category: 'Furniture' })} 
                className="text-slate-650 hover:text-orange-600 font-bold bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Home
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate('search', { category: 'Photography' })} 
                className="text-slate-650 hover:text-orange-600 font-bold bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Sports
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1440px] mx-auto px-6 py-8 flex gap-8 w-full flex-grow">
        {/* Sidebar Categories */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-8">
            <section>
              <h3 className="text-md font-bold text-slate-800 mb-4 tracking-tight">Categories</h3>
              <ul className="space-y-1">
                {['Electronics', 'Furniture', 'Vehicles', 'Clothing', 'Sports & Outdoors', 'Photography'].map((cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => onNavigate('search', { category: cat })}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-200/80 transition-colors group bg-transparent border-none text-left cursor-pointer focus:outline-none"
                    >
                      <span className="text-sm text-slate-600 group-hover:text-orange-600 font-medium">{cat}</span>
                      <span className="material-symbols-outlined text-[18px] opacity-40 group-hover:opacity-100 group-hover:text-orange-600 transition-opacity">chevron_right</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <h4 className="font-bold text-orange-800 text-xs mb-1">Featured Services</h4>
              <p className="text-xs text-orange-700 opacity-90 mb-3 leading-relaxed">
                Connect with local verified buyers &amp; sellers safely with MarketConnect Trust Assurance.
              </p>
              <button 
                type="button"
                onClick={() => onNavigate('messages')} 
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs border-none cursor-pointer transition-colors shadow-sm"
              >
                Open Inbox
              </button>
            </section>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow space-y-8 min-w-0">
          {/* Promo Banner */}
          <div className="relative w-full h-[320px] rounded-2xl overflow-hidden shadow-md">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAtsM3tmTdCW-9sLEE4gY5HEQQVmCrabSvr-K6SU7_mBW-2y3HR45BYcnr9piIrUidWtHWOt7NllnN3ReSy7kDxg1XKzFPENtjRWJZyygBqi7Vjbj3JGuVkOf_72XJ1WhOpWdjfipY_UTMSxpBc6XoJ1CeUWg0J1dTFackLTD4nMbjKqGL-9gk-56ws7QHDPJ_KNU8kki-xtJCi3GvCR7vV7jroH8LIUhjIPFHQJ1D7RABsq2wRnh2wCw')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center px-8 md:px-12">
              <div className="max-w-[448px] text-white">
                <span className="inline-block px-2.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded mb-3 uppercase tracking-wider">
                  Summer Promotion
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
                  Upgrade Your Home Workspace
                </h2>
                <p className="text-sm mb-6 text-slate-200 leading-relaxed">
                  Save up to 40% on top-tier electronics and ergonomic furniture. Deal directly with certified neighbors.
                </p>
                <button 
                  type="button"
                  onClick={() => onNavigate('search', { category: 'Electronics' })}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs border-none cursor-pointer transition-colors shadow-md"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </div>

          {/* Bento Featured Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Top Rated Near You</h3>
                <p className="text-xs text-slate-500">Hand-picked quality listings from elite sellers in your area.</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[sortedProducts[0], sortedProducts[1]].map((p, idx) =>
                  p ? (
                    <div
                      key={p.id}
                      onClick={() => onNavigate('detail', { productId: p.id })}
                      className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group cursor-pointer border border-slate-200/40"
                    >
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={p.title}
                        src={p.image}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                        ₹{p.price.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="aspect-square bg-slate-100 rounded-lg border border-slate-200/40" />
                  )
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">New Arrivals</h3>
                <p className="text-xs text-slate-500 mb-3">Freshly listed gems in your neighborhood.</p>
              </div>
              <div 
                onClick={() => onNavigate('search', { category: 'All' })}
                className="aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer relative group border border-slate-200/40"
              >
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  alt="New Books" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7yb6NmEUcImXm2008Fmd5dMH0wrYy9Q5a3j6_P8uMhcQ713-f4lX89QpaP9kk11-ygzIL6VNWVfYm3xvTsWO9YkWAfupyZWWb6VlcfzLS2kYltEBffCpD88zQx7poTvQL-qlAuWUPqzwWYrzFn187eHDNlWxbC4EfFwF6wqefFpQUoNE7JIvejAtXiRlMkDNjM01EA_jdouJJjlj6jASJsGEMABavwuWibG1lmp-OOt-GLFJb4msyLQ"
                />
              </div>
              <button 
                type="button"
                onClick={() => onNavigate('search', { category: 'All' })}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors mt-3 text-left bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Browse 200+ new items today
              </button>
            </div>

            <div className="bg-[#232F3E] p-6 rounded-xl shadow-md text-white flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-orange-400 text-[40px]">verified_user</span>
                <h3 className="text-base font-bold mt-3 mb-1">Elite Seller Program</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Buy with confidence from our most trusted and highly-rated community members.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => onNavigate('search', { filter: 'elite' })} 
                className="text-orange-400 hover:text-orange-300 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer mt-4 focus:outline-none"
              >
                View verified listings <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Main Product Grid */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-none">Recommended for You</h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  {userLocation?.status === 'done'
                    ? `Nearest listings to ${userLocation.label}`
                    : 'Based on your recent browsing history'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => onNavigate('search', { category: 'All' })}
                className="text-orange-600 hover:text-orange-700 text-xs font-bold hover:underline bg-transparent border-none cursor-pointer focus:outline-none"
              >
                View all results
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendedProducts.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => onNavigate('detail', { productId: product.id })}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-slate-200/50 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                    <img 
                      className="w-full h-full object-cover" 
                      alt={product.title} 
                      src={product.image}
                    />
                    {product.verified && (
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          VERIFIED
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 space-y-1.5 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                        {product.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">{product.location}</p>
                      {product.distKm != null && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">near_me</span>
                          {formatDistance(product.distKm)}
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mt-1 text-slate-400 text-[10px]">
                        <span className="material-symbols-outlined text-[12px] text-orange-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-bold text-slate-600">{product.rating}</span>
                        <span>({product.reviewsCount})</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
                        <span className="text-sm font-extrabold text-orange-600">₹{product.price.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {product.condition}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full px-6 py-12 max-w-[1440px] mx-auto text-xs">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="text-md font-bold text-orange-400">
              MarketConnect
            </div>
            <p className="text-slate-400 leading-relaxed max-w-[280px]">
              The leading peer-to-peer marketplace for trusted and secure transactions in your neighborhood.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Company</h4>
            <nav className="flex flex-col gap-2">
              <a className="text-slate-400 hover:text-white transition-colors" href="#">About Us</a>
              <a className="text-slate-400 hover:text-white transition-colors" href="#">Careers</a>
              <a className="text-slate-400 hover:text-white transition-colors" href="#">Press</a>
            </nav>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Support</h4>
            <nav className="flex flex-col gap-2">
              <a className="text-slate-400 hover:text-white transition-colors" href="#">Help Center</a>
              <a className="text-slate-400 hover:text-white transition-colors" href="#">Safety Guidelines</a>
              <a className="text-slate-400 hover:text-white transition-colors" href="#">Contact Us</a>
            </nav>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Legal</h4>
            <nav className="flex flex-col gap-2">
              <a className="text-slate-400 hover:text-white transition-colors" href="#">Terms of Service</a>
              <a className="text-slate-400 hover:text-white transition-colors" href="#">Privacy Policy</a>
            </nav>
          </div>
        </div>
        
        <div className="max-w-[1440px] mx-auto px-6 py-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 MarketConnect Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">language</span>
              English (US)
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">attach_money</span>
              INR
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import LocationPill from '../components/LocationPill';
import { distanceKm, formatDistance } from '../../../services/geo';

// ── AI Grade helpers (MarketConnect-specific — buyer-facing) ─────────────────
const GRADE_CONFIG = {
  'A+': { label: 'New (Sealed)',  bg: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50',  border: 'border-emerald-200', icon: 'new_releases' },
  A:    { label: 'Like New',      bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50',  border: 'border-emerald-200', icon: 'verified' },
  B:    { label: 'Very Good',     bg: 'bg-blue-500',    text: 'text-blue-700',    light: 'bg-blue-50',     border: 'border-blue-200',    icon: 'thumb_up' },
  C:    { label: 'Good',          bg: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50',    border: 'border-amber-200',   icon: 'star_half' },
  D:    { label: 'Acceptable',    bg: 'bg-orange-500',  text: 'text-orange-700',  light: 'bg-orange-50',   border: 'border-orange-200',  icon: 'warning' },
  F:    { label: 'Fair/Damaged',  bg: 'bg-red-500',     text: 'text-red-700',     light: 'bg-red-50',      border: 'border-red-200',     icon: 'broken_image' },
};

function getGradeConfig(grade) {
  if (!grade) return null;
  const g = grade.toUpperCase();
  if (g.startsWith('A+')) return GRADE_CONFIG['A+'];
  if (g.startsWith('A'))  return GRADE_CONFIG.A;
  if (g.startsWith('B'))  return GRADE_CONFIG.B;
  if (g.startsWith('C'))  return GRADE_CONFIG.C;
  if (g.startsWith('D'))  return GRADE_CONFIG.D;
  return GRADE_CONFIG.F;
}

const DEFECT_SEVERITY = {
  crack: { icon: 'broken_image',       color: 'text-red-600 bg-red-50',     label: 'Crack' },
  dent:  { icon: 'compress',           color: 'text-orange-600 bg-orange-50', label: 'Dent' },
  scratch: { icon: 'texture',          color: 'text-amber-600 bg-amber-50',  label: 'Scratch' },
  stain: { icon: 'water_drop',         color: 'text-blue-600 bg-blue-50',    label: 'Stain' },
  hole_tear: { icon: 'content_cut',    color: 'text-red-600 bg-red-50',      label: 'Hole/Tear' },
  pcb_defect: { icon: 'memory',        color: 'text-purple-600 bg-purple-50', label: 'PCB Defect' },
  structural_damage: { icon: 'warning', color: 'text-red-700 bg-red-50',    label: 'Structural Damage' },
};

export default function P2PMarketProductDetail({
  p2pProducts,
  productId,
  userLocation,
  onDetectLocation,
  greenCredits,
  onRevealPhone,
  onNavigate,
  onStartChat,
  onExit
}) {
  // Find product or fallback to the first one
  const product = useMemo(() => {
    return p2pProducts.find(p => p.id === productId) || p2pProducts[0];
  }, [p2pProducts, productId]);

  // Gallery state — hooks must run unconditionally, so guard the values they read
  const [activeImage, setActiveImage] = useState(product?.image);
  const [isFavorite, setIsFavorite] = useState(false);
  // 'hidden' | 'revealing' | 'revealed' | 'error'
  const [phoneState, setPhoneState] = useState({ status: 'hidden', phone: null, error: null });
  const [searchQuery, setSearchQuery] = useState('');

  const PHONE_REVEAL_COST = 10;

  // Don't leak a previously-revealed number when the customer navigates to
  // a different listing.
  useEffect(() => {
    setPhoneState({ status: 'hidden', phone: null, error: null });
  }, [productId]);

  const distanceToSeller = useMemo(() => {
    if (userLocation?.status !== 'done' || !product?.lat || !product?.lng) return null;
    return distanceKm(userLocation.lat, userLocation.lng, product.lat, product.lng);
  }, [userLocation, product]);

  const handleRevealPhone = async () => {
    setPhoneState({ status: 'revealing', phone: null, error: null });
    try {
      const phone = await onRevealPhone(product.id);
      setPhoneState({ status: 'revealed', phone, error: null });
    } catch (err) {
      setPhoneState({ status: 'error', phone: null, error: err.message || 'Failed to reveal the seller\'s number.' });
    }
  };

  // Fallback thumbnails if empty
  const thumbnails = useMemo(() => {
    if (!product) return [];
    if (product.thumbnails && product.thumbnails.length > 0) {
      return [product.image, ...product.thumbnails];
    }
    return [
      product.image,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCfLipch2qf0md_Uut5ekCZrMWsAScu5Ls8Xi5unzASeyPyucIvtvAHMKM6JTrfy6HX5OfHyCoalBochDXOV1QxW-rw0edJ_jx-MguUK6hgIl37MrHAooF0JjanH_7WpNr8soUUIGJQplO8ATYNfBZTNL-2Bi4ejYW7SjTUot7f9XTj60KMMv-e5o9XymhDh51cyOOG5Wkmo9UwJ78F0Rc5fS1Xc4VSGs4KAuvJXmbuvbGMdeQWejPiPw',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPTyCpDjBarbaeHgIJIc15CYyXqv_-UD8MFpmHlKKrujGj24a2H-D8GSI0Hw3yXed8hE-1t0r8HJyE5SJmUjLaL0AlU2rhrqDuRIHHbp6K_SERo_NK9VUGaYQU1OmDk7U4JkKULvAcjgiNS4nZkQQOAfL8PqcYxDnJYjDRhunjmTBA_j9wOfXzj-5trIMOVPMu3VPrDfqpMxhOOxuxxbsFLCgQAyO60MydEtUD_4E8mzTyYGdOvd-gEA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdH4b3MxZKT46-gYasKDOynnOMpUtHTSeefQagQ2esGP-aDa07qL1h8f711tDYiO8vm1ATCQZHFWQ5JBODkm13t048yRMeNvyxTOP-cNs3A8NkK9XVToE8g4I3oz1Mrg1NQktTfeidTVHgpMhYD7iDBjoXNbsPY9Rhpm1bcxmH7MuMcnAokzK_z1-3Y3ohqB8r-kDwu-buKNArknGuXwGxJpZnIz84COQ2jZ2PJ5cn7Oda_y4hXvhcRQ'
    ];
  }, [product]);

  // p2pProducts loads asynchronously now — render nothing crash-worthy while it's still empty.
  if (!product) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading product...
      </div>
    );
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery });
  };

  const handleChatClick = () => {
    onStartChat(
      product.seller,
      product.sellerImg || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuj-fzLZ3-qrINx7JWSoRwVRjrXGPF2nWjyfB3infTyfzgGLaO9_UWaRWKRzWzsESQUYndGvT7RTOAGxgm9SVFJ-C2Dge_bOTYn6jBeOuKpQY9raN6dIKmX3biCaqUoEw01ubhmSJPOLbEaUl0yDaWy8vV1CLnCuXjiUpK9YmSd4NItU0SqL5EatxeuA7XVn4E9CoeOGxY9ZS6X4eRhR-HEIUMlE_GZQXBNddzcEobITw64M3WSFZ13w',
      product.title,
      product.price,
      product.image
    );
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
              ].map((item) => {
                const isActive = product.category === item.catValue;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate('search', { category: item.catValue })}
                    className={`font-bold transition-colors cursor-pointer bg-transparent border-none focus:outline-none pb-0.5 ${
                      isActive 
                        ? 'text-slate-700 border-b-2 border-orange-500' 
                        : 'text-slate-650 hover:text-orange-600'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1440px] mx-auto px-6 py-8 flex-grow w-full">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-slate-500 mb-6 font-medium text-xs text-left">
          <button onClick={() => onNavigate('home')} className="hover:text-orange-600 cursor-pointer bg-transparent border-none p-0">Home</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => onNavigate('search', { category: product.category })} className="hover:text-orange-600 cursor-pointer bg-transparent border-none p-0">{product.category}</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-800 font-bold">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm aspect-[4/3] border border-slate-200/60 flex items-center justify-center p-4">
              <img 
                className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105" 
                alt={product.title} 
                src={activeImage}
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="bg-white/95 backdrop-blur shadow rounded-full p-2.5 hover:bg-slate-50 transition-colors border border-slate-200 text-red-500 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                    favorite
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {thumbnails.map((thumb, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImage(thumb)}
                  className={`min-w-[100px] h-20 bg-white rounded-lg p-1 border-2 transition-all cursor-pointer flex items-center justify-center overflow-hidden shrink-0 ${
                    activeImage === thumb ? 'border-orange-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img className="max-h-full max-w-full object-contain rounded" alt="Thumbnail" src={thumb} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info & CTAs */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Featured</span>
                  {product.grade && (
                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                      AI Verified
                    </span>
                  )}
                  {product.aiStatus === 'Pending' && !product.grade && (
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[12px]">pending</span>
                      AI Inspection Pending
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-xs">{product.timeAgo}</span>
              </div>

              <h1 className="text-lg md:text-xl font-extrabold text-slate-800 leading-tight">
                {product.title}
              </h1>
              <p className="text-slate-400 text-xs font-semibold">{product.location} • {product.category}</p>

              <div className="flex items-baseline gap-2 py-1">
                <span className="text-2xl font-black text-orange-600">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className="text-slate-400 text-sm line-through">₹{product.originalPrice.toLocaleString()}</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 w-fit px-2.5 py-1 rounded">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Verified Authentic</span>
                </div>
                {product.grade && (() => {
                  const cfg = getGradeConfig(product.grade);
                  return cfg ? (
                    <div className={`flex items-center gap-1.5 text-xs font-bold w-fit px-2.5 py-1 rounded ${cfg.light} ${cfg.text}`}>
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
              </div>

              {/* ── AI Condition Report — Buyer Facing ──────────────────────── */}
              {product.grade ? (() => {
                const cfg = getGradeConfig(product.grade);
                const defects = product.defects || [];
                return (
                  <div className={`pt-4 border-t border-slate-100 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                        AI Condition Report
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Powered by YOLO + Moondream</span>
                    </div>

                    {/* Grade card */}
                    <div className={`rounded-xl border ${cfg?.border || 'border-slate-200'} ${cfg?.light || 'bg-slate-50'} p-4 space-y-3`}>
                      {/* Grade badge row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl ${cfg?.bg || 'bg-slate-500'} flex items-center justify-center text-white shadow-md`}>
                            <span className="text-xl font-black">{product.grade?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className={`text-sm font-black ${cfg?.text || 'text-slate-700'}`}>{cfg?.label || product.condition}</p>
                            <p className="text-[10px] text-slate-500">AI-assessed condition grade</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Confidence</p>
                          <p className="text-sm font-black text-slate-700">High</p>
                        </div>
                      </div>

                      {/* What was scanned */}
                      {Object.keys(product.photos || {}).length > 0 && (
                        <div className="pt-2 border-t border-current/10">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Photos Analysed</p>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {Object.values(product.photos).map((src, idx) => (
                              <div key={idx} className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white">
                                <img src={src} alt={`angle-${idx}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Defects */}
                      {defects.length > 0 ? (
                        <div className="pt-2 border-t border-current/10 space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detected Defects</p>
                          <div className="space-y-1.5">
                            {defects.map((def, idx) => {
                              const typeKey = (def.defect_type || def.type || '').toLowerCase();
                              const sev = DEFECT_SEVERITY[typeKey];
                              return (
                                <div key={idx} className="flex items-start gap-2">
                                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${sev?.color || 'text-slate-600 bg-slate-100'}`}>
                                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                      {sev?.icon || 'error'}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700">{sev?.label || (def.defect_type || def.type)}</p>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">{def.description || def.desc || 'Detected by AI analysis'}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-current/10 flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <p className="text-[11px] font-bold text-emerald-700">No physical defects detected by AI analysis.</p>
                        </div>
                      )}
                    </div>

                    {/* Trust footer */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        This grade was assigned by our computer vision AI (YOLO + Moondream) and cannot be edited by the seller. It reflects the item's condition at the time of listing.
                      </p>
                    </div>
                  </div>
                );
              })() : (product.aiStatus && product.aiStatus !== 'COMPLETED') ? (
                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-[22px] animate-spin">sync</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800">AI Inspection In Progress</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">The seller has submitted this listing for AI grading. The condition report will appear here once analysis completes.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Seller Info Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-orange-500 p-0.5 overflow-hidden bg-white shrink-0">
                        <img 
                          className="w-full h-full rounded-full object-cover" 
                          src={product.sellerImg || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuj-fzLZ3-qrINx7JWSoRwVRjrXGPF2nWjyfB3infTyfzgGLaO9_UWaRWKRzWzsESQUYndGvT7RTOAGxgm9SVFJ-C2Dge_bOTYn6jBeOuKpQY9raN6dIKmX3biCaqUoEw01ubhmSJPOLbEaUl0yDaWy8vV1CLnCuXjiUpK9YmSd4NItU0SqL5EatxeuA7XVn4E9CoeOGxY9ZS6X4eRhR-HEIUMlE_GZQXBNddzcEobITw64M3WSFZ13w'} 
                          alt={product.seller}
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full h-3.5 w-3.5"></div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Posted By <span className="text-orange-600">{product.seller}</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Member since {product.sellerMemberSince || 'Jan 2021'}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="bg-[#232F3E] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] text-orange-400">workspace_premium</span>
                          ELITE SELLER
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-3 text-center">
                  <div>
                    <p className="text-sm font-bold text-orange-600">{product.sellerItemsCount || 24}</p>
                    <p className="text-[9px] text-slate-400">Items listed</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{product.rating || '4.8'}</p>
                    <p className="text-[9px] text-slate-400">Seller Rating</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-center">
                  <button 
                    onClick={handleChatClick}
                    className="w-full py-2.5 bg-[#232F3E] text-white hover:bg-[#37475A] font-bold text-xs rounded-lg transition-colors border-none cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    Chat with seller
                  </button>
                  <div className="flex flex-col items-center gap-1.5 mt-1 text-xs w-full">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-600 text-[18px]">call</span>
                      <span className="text-slate-800 font-bold font-mono">
                        {phoneState.status === 'revealed' ? phoneState.phone : '*** *** ****'}
                      </span>
                      {phoneState.status === 'hidden' && (
                        <button
                          onClick={handleRevealPhone}
                          className="text-orange-600 font-bold hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Show number ({PHONE_REVEAL_COST} credits)
                        </button>
                      )}
                      {phoneState.status === 'revealing' && (
                        <span className="text-slate-400 italic">Unlocking...</span>
                      )}
                    </div>
                    {phoneState.status === 'error' && (
                      <p className="text-red-600 text-[10px] font-semibold text-center">{phoneState.error}</p>
                    )}
                    {phoneState.status === 'revealed' && (
                      <p className="text-emerald-600 text-[10px] font-semibold">
                        -{PHONE_REVEAL_COST} Green Credits · Balance: {greenCredits}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Map visual */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Item Location</h3>
                <p className="text-xs text-slate-500 mb-1">{product.location}</p>
                {distanceToSeller != null ? (
                  <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">near_me</span>
                    {formatDistance(distanceToSeller)} from you
                  </p>
                ) : (
                  <button
                    onClick={onDetectLocation}
                    className="text-xs font-bold text-orange-600 hover:underline bg-transparent border-none cursor-pointer mb-2"
                  >
                    Detect my location to see distance
                  </button>
                )}
                <div className="rounded-xl overflow-hidden h-40 bg-slate-200 relative border border-slate-200">
                  <iframe
                    title="Seller location map"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${
                      product.lat && product.lng
                        ? `${product.lat},${product.lng}`
                        : encodeURIComponent(product.location || 'India')
                    }&z=12&output=embed`}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

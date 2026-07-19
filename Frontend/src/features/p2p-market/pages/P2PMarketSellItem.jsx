import React, { useState } from 'react';
import LocationPill from '../components/LocationPill';
import SellerAiInspection from '../components/SellerAiInspection';
import { apiFetch } from '../../../services/api';

const LISTING_FEE_CREDITS = 20;

export default function P2PMarketSellItem({
  onAddProduct,
  onProductGraded,
  userLocation,
  onDetectLocation,
  greenCredits,
  onNavigate,
  onExit,
  subcategoryTaxonomy,
}) {
  // Wizard steps:
  // 0 = Choose Category
  // 1 = Listing Details (title, price, description, phone — no photo)
  // 2 = AI Photo Inspection (SellerAiInspection — multi-angle photos + questions)
  // 3 = Shipping & Publish
  const [step, setStep] = useState(0);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Created product (after step 1 submits to backend)
  const [createdProduct, setCreatedProduct] = useState(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery });
  };

  // Step 1 → Step 2: create product in DB first, then open AI inspection
  const handleNextFromDetails = async () => {
    if (publishing) return;
    setPublishing(true);
    setPublishError('');
    const newProduct = {
      title,
      price: parseFloat(price) || 0,
      originalPrice: parseFloat(price) ? parseFloat(price) * 1.2 : 0,
      category,
      location: userLocation?.status === 'done' ? userLocation.label : 'India',
      lat: userLocation?.status === 'done' ? userLocation.lat : null,
      lng: userLocation?.status === 'done' ? userLocation.lng : null,
      sellerPhone: phone || null,
      seller: 'Me',
      verified: false,
      condition: 'Good',
      timeAgo: 'Just now',
      rating: 5.0,
      reviewsCount: 0,
      description,
      image: '',
      thumbnails: [],
    };

    try {
      const created = await onAddProduct(newProduct);
      setCreatedProduct(created);
      setStep(2);
    } catch (err) {
      setPublishError(err.message || 'Failed to create product listing.');
    } finally {
      setPublishing(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1) { await handleNextFromDetails(); return; }
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      if (publishing) return;
      setPublishing(true);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onNavigate('home');
        setPublishing(false);
      }, 2000);
    }
  };

  // Step 2 → Step 3: grading.js's /p2p/:id/submit + /result already wrote the
  // real image/photos/thumbnails/grade/aiStatus onto the product server-side
  // (see SellerAiInspection) — pull that down into local state now, since
  // nothing else re-fetches this product before it's shown elsewhere.
  const handleInspectionComplete = async () => {
    if (createdProduct?.id) {
      await onProductGraded?.(createdProduct.id);
    }
    setStep(3);
  };

  const handleBackStep = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else if (step === 1) setStep(0);
  };

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    setStep(1);
  };

  const canProceedFromDetails = Boolean(title.trim() && parseFloat(price) > 0);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
      {/* ── Top Navigation ──────────────────────────────────────────────────── */}
      <header className="bg-[#232F3E] text-white sticky top-0 z-50 shadow-md">
        {/* Upper bar */}
        <div className="flex justify-between items-center w-full px-6 py-2.5 gap-6 max-w-[1440px] mx-auto">
          {/* Brand */}
          <button
            onClick={() => onNavigate('home')}
            className="text-xl md:text-2xl font-black text-white hover:text-orange-400 transition-colors bg-transparent border-none cursor-pointer focus:outline-none shrink-0"
          >
            MarketConnect
          </button>

          {/* Search */}
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

          {/* Actions cluster */}
          <div className="flex items-center gap-6 shrink-0">
            <LocationPill userLocation={userLocation} onDetectLocation={onDetectLocation} />

            <div className="hidden md:flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all">
              <span className="text-[10px] opacity-75">Hello, Sign in</span>
              <span className="text-xs font-bold">Account &amp; Lists</span>
            </div>

            <button
              onClick={() => onNavigate('home')}
              className="bg-transparent border-none text-white hidden md:flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all text-left focus:outline-none"
            >
              <span className="text-[10px] opacity-75">Returns</span>
              <span className="text-xs font-bold">&amp; Orders</span>
            </button>

            <button
              onClick={() => onNavigate('messages')}
              className="bg-transparent border-none text-white flex flex-col items-center cursor-pointer hover:text-orange-400 transition-all focus:outline-none p-1"
            >
              <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
              <span className="text-[10px] font-bold mt-0.5">Chat</span>
            </button>

            <div className="w-9 h-9 rounded-full border-2 border-[#febd69] overflow-hidden shrink-0 cursor-pointer">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT9c2SyWdJm1WQnazqi8D3rkYonHWiVxVV2SRGPXh3UyIC0lShKamMfyOxom6kPDdDmYlgIFcCsKixg28TjNyZYvf3CUUMsfqSxOMqnzpXmDT9uihEX8H2aEcSrlv-C6LVLmwpOyRm5KtYb0-hTwZKEeeOFvYQivBnkOALPM759biUUjfax6Vck7rzyqTTKOb6nQ0FAfl4Ml32tIj6BKontw1nnEOCh6FfCb-evQVOY8sg7ToqfAly7Q"
                alt="Profile Avatar"
              />
            </div>

            <button
              onClick={() => onNavigate('sell')}
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-600 p-[2px] rounded-full hover:scale-105 transition-all cursor-pointer border-none shadow"
            >
              <div className="bg-white rounded-full px-4 py-1 flex items-center justify-center gap-1">
                <span className="text-base font-black text-[#0f3b8c] leading-none">+</span>
                <span className="text-xs font-black text-[#0f3b8c] tracking-wider leading-none">SELL</span>
              </div>
            </button>

            <button
              onClick={onExit}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer border-none shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Exit
            </button>
          </div>
        </div>

        {/* Lower nav */}
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
                { label: 'Sports', catValue: 'Photography' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate('search', { category: item.catValue })}
                  className="font-bold transition-colors cursor-pointer bg-transparent border-none focus:outline-none pb-0.5 text-slate-650 hover:text-orange-600"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Step 0: Choose Category ──────────────────────────────────────────── */}
      {step === 0 ? (
        <main className="flex-grow w-full px-4 py-10 flex flex-col items-center bg-slate-50">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-wide uppercase mb-2">
              Post Your Ad
            </h1>
            <p className="text-sm text-slate-500">Choose a category to get started. It's free and takes less than 2 minutes.</p>
          </div>

          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">Choose a Category</h2>
              <span className="text-[10px] text-slate-400 font-medium">10 categories</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Cars',                      icon: 'directions_car',  cat: 'Sports & Outdoors',  color: 'bg-blue-100 text-blue-600',       popular: true  },
                { label: 'Properties',                icon: 'domain',          cat: 'Home & Furniture',   color: 'bg-emerald-100 text-emerald-600', popular: false },
                { label: 'Mobiles',                   icon: 'smartphone',      cat: 'Electronics',        color: 'bg-violet-100 text-violet-600',   popular: true  },
                { label: 'Jobs',                      icon: 'work',            cat: 'Electronics',        color: 'bg-amber-100 text-amber-600',     popular: false },
                { label: 'Bikes',                     icon: 'two_wheeler',     cat: 'Sports & Outdoors',  color: 'bg-orange-100 text-orange-600',   popular: false },
                { label: 'Electronics & Appliances',  icon: 'tv',              cat: 'Electronics',        color: 'bg-cyan-100 text-cyan-600',       popular: true  },
                { label: 'Commercial Vehicles',       icon: 'local_shipping',  cat: 'Sports & Outdoors',  color: 'bg-slate-100 text-slate-600',     popular: false },
                { label: 'Furniture',                 icon: 'chair',           cat: 'Home & Furniture',   color: 'bg-lime-100 text-lime-700',       popular: false },
                { label: 'Fashion',                   icon: 'checkroom',       cat: 'Fashion',            color: 'bg-pink-100 text-pink-600',       popular: true  },
                { label: 'Books & Hobbies',           icon: 'menu_book',       cat: 'Books & Hobbies',    color: 'bg-teal-100 text-teal-600',       popular: false },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleCategorySelect(item.cat)}
                  className="relative bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md p-4 flex items-center gap-3 text-left cursor-pointer group transition-all duration-150 hover:-translate-y-0.5 shadow-sm"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors leading-tight truncate">{item.label}</p>
                    {item.popular && (
                      <span className="inline-block mt-1 text-[9px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-orange-400 text-base shrink-0 transition-colors">chevron_right</span>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-start gap-3 shadow-sm">
              <span className="material-symbols-outlined text-orange-500 text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
              <div>
                <p className="text-xs font-bold text-slate-700">Not sure which category to pick?</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Select the closest match — you can refine it later. Our team reviews all listings to ensure accurate categorization.</p>
              </div>
            </div>
          </div>
        </main>

      ) : (
        /* ── Steps 1–3: Wizard flow ─────────────────────────────────────────── */
        <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-6 py-8">
          {/* Stepper header */}
          <div className="max-w-3xl mx-auto mb-8 text-center">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 mb-6">Create a New Listing</h1>
            <div className="flex items-center justify-between px-6 md:px-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                <span className={`text-[10px] font-bold ${step >= 1 ? 'text-orange-600' : 'text-slate-400'}`}>Details</span>
              </div>
              <div className={`h-0.5 flex-grow mx-4 ${step >= 2 ? 'bg-orange-500' : 'bg-slate-200'}`} />

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                <span className={`text-[10px] font-bold ${step >= 2 ? 'text-orange-600' : 'text-slate-400'}`}>AI Inspection</span>
              </div>
              <div className={`h-0.5 flex-grow mx-4 ${step >= 3 ? 'bg-orange-500' : 'bg-slate-200'}`} />

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                <span className={`text-[10px] font-bold ${step >= 3 ? 'text-orange-600' : 'text-slate-400'}`}>Publish</span>
              </div>
            </div>
          </div>

          {/* Success banner */}
          {successMsg && (
            <div className="max-w-6xl mx-auto mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-sm font-bold shadow-sm justify-center">
              <span className="material-symbols-outlined text-green-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>Listing published successfully! Redirecting to Home...</span>
            </div>
          )}

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            {/* ── Left: Form panel ──────────────────────────────────────────── */}
            <section className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

              {/* ── Step 1: Listing Details ──────────────────────────────────── */}
              {step === 1 && (
                <form className="space-y-6">
                  {/* AI Inspection notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    <div>
                      <p className="text-xs font-bold text-blue-800">AI Photo Inspection — Next Step</p>
                      <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                        After filling in your listing details, you'll upload multiple product photos for our AI to analyse. The AI will grade your item and detect any damage so buyers trust your listing.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listing Title</label>
                    <input
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-800"
                      placeholder="e.g. Vintage 35mm Camera"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Category is chosen in Step 0 — show it read-only */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-orange-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>sell</span>
                      <span className="text-xs font-bold text-orange-700">{category}</span>
                      <span className="ml-auto text-[10px] text-orange-400">Selected in Step 0</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                    <input
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-800"
                      placeholder="0.00"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone Number</label>
                    <input
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-800"
                      placeholder="+91 98765 43210"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400">Buyers pay a small fee to reveal this — it's never shown for free.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                    <textarea
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-800 resize-none"
                      placeholder="Describe the item's condition, features, why you are selling..."
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </form>
              )}

              {/* ── Step 2: AI Photo Inspection ──────────────────────────────── */}
              {step === 2 && (
                <SellerAiInspection
                  productId={createdProduct?.id}
                  category={category}
                  subcategoryTaxonomy={subcategoryTaxonomy}
                  onNext={handleInspectionComplete}
                  onBack={() => setStep(1)}
                />
              )}

              {/* ── Step 3: Shipping & Publish ────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800 font-sans">Choose Shipping &amp; Meetup Options</h3>
                    <p className="text-xs text-slate-500">Enable how you prefer buyers to receive your item. We recommend enabling both for maximum coverage.</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-50/50">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Public Meetup</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Meet buyers in a well-lit public space, like a local park, store parking lot, or community center.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-50/50">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Northeastern Region Local Shipping</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ship via local logistics partners for ₹150 flat rate. Item will be tracking enabled.</p>
                    </div>
                  </label>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meetup Postal Code</label>
                    <input
                      type="text"
                      defaultValue="10001"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Location</label>
                    <p className="text-[10px] text-slate-500">Buyers sort listings by distance — attach your real location so nearby buyers find this faster.</p>
                    <button
                      type="button"
                      onClick={onDetectLocation}
                      disabled={userLocation?.status === 'locating'}
                      className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px] text-orange-500">
                        {userLocation?.status === 'locating' ? 'progress_activity' : 'my_location'}
                      </span>
                      {userLocation?.status === 'done'
                        ? `Location set: ${userLocation.label}`
                        : userLocation?.status === 'locating'
                        ? 'Detecting...'
                        : 'Use my current location'}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="max-w-[384px] mx-auto bg-orange-50 border border-orange-200 rounded-lg p-3 text-left flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-800">Listing fee</span>
                      <span className="text-sm font-black text-orange-600">{LISTING_FEE_CREDITS} Green Credits</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Your balance: <strong>{greenCredits}</strong> Green Credits</p>
                    {publishError && (
                      <p className="max-w-[384px] mx-auto text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{publishError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Nav buttons (only shown for steps 1 & 3; step 2 manages its own) */}
              {step !== 2 && (
                <div className="pt-6 border-t border-slate-100 flex justify-between items-center mt-6">
                  <button
                    type="button"
                    onClick={handleBackStep}
                    disabled={step === 0}
                    className="px-5 py-2 border border-slate-300 rounded-lg font-bold text-xs text-slate-650 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={publishing || (step === 1 && !canProceedFromDetails)}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold text-xs hover:bg-orange-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {step === 3
                      ? (publishing ? 'Publishing...' : `Publish Listing (${LISTING_FEE_CREDITS} credits)`)
                      : (publishing ? 'Saving...' : 'Next Step')}
                  </button>
                </div>
              )}
            </section>

            {/* ── Right: Live Preview ────────────────────────────────────────── */}
            <aside className="lg:col-span-5 flex flex-col gap-4 sticky top-24 h-fit">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Preview</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Updating live
                </span>
              </div>

              <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm text-left">
                {/* Preview image slot */}
                <div className="relative w-full aspect-video bg-slate-100 flex items-center justify-center p-2">
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <span className="material-symbols-outlined text-[40px]">photo_camera</span>
                    <span className="text-[10px] font-bold">Photos added in AI Inspection step</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 shadow rounded-full p-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">Featured</span>
                  </div>
                </div>

                {/* Preview content */}
                <div className="p-5 space-y-3.5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{category}</p>
                      <h3 className="text-xs font-bold text-slate-800 mt-1 line-clamp-2 leading-snug">{title || 'Untitled Listing'}</h3>
                    </div>
                    <p className="text-base font-black text-orange-600">₹{parseFloat(price || 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>

                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
                      <span className="material-symbols-outlined text-[12px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified Seller
                    </span>
                    <span className="flex items-center gap-1 text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
                      <span className="material-symbols-outlined text-[12px] text-slate-500">local_shipping</span>
                      Ships fast
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">{description || 'No description provided yet...'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs font-bold">
                    <div className="h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">Message</div>
                    <div className="h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center">Buy Now</div>
                  </div>
                </div>
              </div>

              {/* AI grading info callout */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  <span className="text-xs font-black text-blue-800">AI-Powered Inspection</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Our AI analyses <strong>multiple photos</strong> of your item using computer vision (YOLO + Moondream) to detect scratches, dents, cracks and other damage. Buyers see a verified condition grade before messaging you.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Grade A–F', 'Defect Detection', 'Buyer Trust', 'Multi-Angle'].map((tag) => (
                    <span key={tag} className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex gap-2">
                <span className="material-symbols-outlined text-orange-600 text-[18px]">lightbulb</span>
                <p className="text-orange-800 text-[10px] leading-relaxed text-left">
                  <strong>Pro Tip:</strong> Items with clear, high-resolution photos sell 40% faster on MarketConnect. Upload at least 3–6 angles for a more accurate AI grade.
                </p>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800 text-left text-xs">
        <div className="max-w-[1440px] mx-auto px-6 py-6 text-center text-slate-500">
          <p>© 2026 MarketConnect Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

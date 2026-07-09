import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import ProductReviewsSection from '../components/ProductReviewsSection';

// Tier styling for the personalized return-risk nudge — mirrors the palette
// used on the hub-admin Account Risk & Trust Score page so the same tier
// always reads the same way to a viewer, customer-facing or internal.
const RISK_TIER_STYLES = {
  Baseline: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-700', symbol: 'check_circle' },
  Elevated: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-700', symbol: 'info' },
  'Moderate Risk': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-700', symbol: 'warning' },
  'Critical Risk': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-700', symbol: 'error' },
};

// Return `reason` values in the DB are a mix of snake_case codes and
// free-form Title Case strings — normalize both into a readable phrase.
function humanizeReturnReason(reason) {
  if (!reason) return null;
  const spaced = reason.includes('_') ? reason.replace(/_/g, ' ') : reason;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export default function VirtualTryOn({ onBackToGateway }) {
  const [isOpen, setIsOpen] = useState(true);
  const [tryOnStep, setTryOnStep] = useState(1); // 1 = Upload/Prompt, 2 = Loading, 3 = Result, 4 = Error
  const [selectedMethod, setSelectedMethod] = useState('photo'); // 'photo' or 'model'
  const [cartCount, setCartCount] = useState(0);
  const [selectedSize, setSelectedSize] = useState('Select Size');

  const [recommendedSize, setRecommendedSize] = useState('');
  const [confidencePct, setConfidencePct] = useState(80);
  const [sampleSize, setSampleSize] = useState(0);
  const [reviewSizingNote, setReviewSizingNote] = useState('');

  // Personalized return-risk nudge — the customer's own order/return
  // history, fetched once so "Return rate for this item" can speak to
  // *their* likelihood of returning it, not a generic item-level stat.
  const [riskProfile, setRiskProfile] = useState(null);
  const [productAnalysis, setProductAnalysis] = useState(null);
  
  useEffect(() => {
    apiFetch('/api/profile/risk-score').then(setRiskProfile).catch(() => setRiskProfile(null));
    apiFetch('/api/products/apparel-prod-1/returns-analysis').then(setProductAnalysis).catch(() => setProductAnalysis(null));
    
    // Fetch apparel size recommendation based on reviews NLP and user profile
    apiFetch('/api/products/apparel-prod-1/fit-recommendation', {
      method: 'POST',
      body: JSON.stringify({
        chestCm: 94.0,
        heightCm: 175.0,
        weightKg: 70.0
      })
    })
      .then(data => {
        if (data.recommended_size) {
          setRecommendedSize(data.recommended_size);
          setConfidencePct(data.confidence_pct);
          setSampleSize(data.sample_size);
          setReviewSizingNote(data.review_sizing_note);
        }
      })
      .catch(err => {
        console.error('Fit recommendation error:', err);
      });
  }, []);

  // Hoodie images by color — the actual garment reference sent to the
  // compositing model, and shown in the gallery.
  const productImages = {
    charcoal: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzP3MGQw9GPzjY8z2kvUkEsCOJ0CL1L818iKzM0SpR0DPc2xfLInBNI3QEV90DXIxm_FB7J-ysTSG6Ia5j2B-C2XhgoA8ZI8UZihL3qwPWK2DJyZfEiwMpAzuYC9NvVi-O4MxMbj2p1LLhfkrSd7hOqeycANlAjVyb0edRR8qkp8KG8GFWK1PkEeXN2eyZNup4OZirUO4y8izkJuFTyws3Cm5DYvm8XVOjAXnBUzGKR5cbArvqXPOVVQ',
    navy: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrBoOImSWjEmrkGL0iml9GfRaznrxzOdkMwHDAk_-DiGtKLHuMRPYL-lhKJKrHwt1C3vZq0nFoBeu7O6arlwv-S-b1POVoVhoNZl9mvadHI_gZOEYln9OqAlIHCMlEdGrBGmN7IjnY9pHw6gW5iqXM0nN-bfUxrDUNJdjCyPNno27VBbjzNIhWBkgPNHhjDwLDXx-XR3suxaaF9yOlmxeeBc4Y_j21gRdbFseMTzNTzIAciJGoaqbOxA',
    black: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkskG9IgMPQQBGC8-VjnBGa9NszT8gGVPUKIIz_IZnTDjrBn3RBI05CxbdJaaLwBx1Qv1T330TrnWYpsT3fNd-RduuVu4HvjAR7e4FGtr0_mPjeLBUNHN4Wv1KBthWmdRM5Oha6cXaL_WTBEdfQrC9iT0JtZbDGtuUzfm1plMpcdfT6IU7TOAa2cZgUGO4MEzb2L3qBbB-tIYo0_KM9x7cbBgcQRS36N8TuPCi2JdmBM0G65MY2YDZJg'
  };

  const [activeColor, setActiveColor] = useState('charcoal');
  const [mainImage, setMainImage] = useState(productImages.charcoal);

  // Try-on generation state
  const [personFile, setPersonFile] = useState(null);
  const [modelPhotoUrl, setModelPhotoUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [tryOnError, setTryOnError] = useState('');
  const fileInputRef = useRef(null);

  // Calls the real AI compositing endpoint. `color` is passed explicitly
  // (rather than read from state) so a color swap can regenerate against
  // the *new* garment before React re-renders activeColor.
  const generate = async ({ file, keepSameModel, color } = {}) => {
    const garmentColor = color || activeColor;
    setTryOnStep(2);
    setTryOnError('');
    try {
      const form = new FormData();
      form.append('mode', selectedMethod);
      form.append('garmentImageUrl', productImages[garmentColor]);
      form.append('garmentLabel', `${garmentColor} hoodie`);
      if (selectedMethod === 'photo') {
        const f = file || personFile;
        if (!f) throw new Error('No photo selected yet.');
        form.append('personImage', f);
      } else if (keepSameModel && modelPhotoUrl) {
        form.append('pinnedModelPhotoUrl', modelPhotoUrl);
      }

      const result = await apiFetch('/api/tryon/generate', { method: 'POST', body: form });
      setResultImage(result.image);
      if (result.modelPhotoUrl) setModelPhotoUrl(result.modelPhotoUrl);
      setTryOnStep(3);
    } catch (err) {
      setTryOnError(err.message || 'Failed to generate your try-on preview.');
      setTryOnStep(4);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPersonFile(file);
    generate({ file });
  };

  const handleColorChange = (color) => {
    setActiveColor(color);
    setMainImage(productImages[color]);
    // Already showing a result? Regenerate against the new color so the
    // preview doesn't silently go stale.
    if (tryOnStep === 3) {
      if (selectedMethod === 'photo' && personFile) {
        generate({ file: personFile, color });
      } else if (selectedMethod === 'model') {
        generate({ keepSameModel: true, color });
      }
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setTryOnStep(1);
    setResultImage(null);
    setTryOnError('');
  };

  return (
    <div className="bg-white text-[#0F1111] antialiased w-full text-left font-sans">
      {/* Top Search Header Bar */}
      <header className="bg-[#131921] w-full flex items-center justify-between px-6 py-2 gap-4 h-16 text-white shrink-0">
        <div className="flex items-center gap-6">
          <div className="font-extrabold text-2xl tracking-tight cursor-pointer" onClick={onBackToGateway}>Amazon</div>
          <div className="hidden md:flex items-center hover:outline hover:outline-1 hover:outline-white p-1 rounded cursor-pointer gap-1 transition-all">
            <span className="material-symbols-outlined text-[20px]">location_on</span>
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="text-gray-300">Deliver to</span>
              <span className="font-bold text-sm">India</span>
            </div>
          </div>
        </div>

        <div className="flex-grow max-w-3xl px-4">
          <div className="flex w-full">
            <select className="bg-gray-100 text-[#0F1111] px-3 py-2 rounded-l-md border-r border-gray-300 text-xs cursor-pointer hover:bg-gray-200 focus:outline-none outline-none">
              <option>All Departments</option>
            </select>
            <input 
              className="w-full px-4 py-2 text-[#0F1111] focus:outline-none text-sm bg-white" 
              placeholder="Search Amazon" 
              type="text"
            />
            <button className="bg-[#febd69] hover:bg-[#f3a847] px-6 rounded-r-md transition-all cursor-pointer flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-800">search</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-white text-xs">
          <div className="hidden lg:block cursor-pointer p-1 rounded hover:outline hover:outline-1 hover:outline-white">
            <span className="block text-gray-300">Hello, sign in</span>
            <span className="block font-bold">Account &amp; Lists</span>
          </div>
          <div className="hidden lg:block cursor-pointer p-1 rounded hover:outline hover:outline-1 hover:outline-white">
            <span className="block text-gray-300">Returns</span>
            <span className="block font-bold">&amp; Orders</span>
          </div>
          <div 
            onClick={() => setCartCount(c => c + 1)}
            className="flex items-center cursor-pointer p-1 rounded hover:outline hover:outline-1 hover:outline-white relative"
          >
            <span className="material-symbols-outlined text-[32px]">shopping_cart</span>
            <span className="absolute top-0 right-0 bg-[#f08804] text-black text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center translate-x-1 -translate-y-1">
              {cartCount}
            </span>
            <span className="hidden lg:block font-bold mt-2 ml-1">Cart</span>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <nav className="bg-[#232f3e] text-white flex items-center px-6 py-2 gap-4 overflow-x-auto whitespace-nowrap text-sm shrink-0">
        <button 
          onClick={onBackToGateway}
          className="flex items-center font-bold gap-1 cursor-pointer p-1 border border-transparent hover:border-white text-xs uppercase bg-white/10 px-2 py-1 rounded"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Exit to Selector
        </button>
        <span className="p-1 border border-transparent hover:border-white cursor-pointer font-bold">Today's Deals</span>
        <span className="p-1 border border-transparent hover:border-white cursor-pointer">Customer Service</span>
        <span className="p-1 border border-transparent hover:border-white cursor-pointer font-bold text-[#febd69]">Fashion</span>
        <span className="p-1 border border-transparent hover:border-white cursor-pointer">Best Sellers</span>
        <span className="p-1 border border-transparent hover:border-white cursor-pointer">Sell</span>
      </nav>

      {/* Main Workspace Body */}
      <main className="max-w-[1500px] mx-auto px-6 py-6 mt-2">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-[#007185]">
          <span>Clothing, Shoes &amp; Accessories</span>
          <span>&gt;</span>
          <span>Men</span>
          <span>&gt;</span>
          <span>Clothing</span>
          <span>&gt;</span>
          <span>Activewear</span>
          <span>&gt;</span>
          <span className="font-bold text-[#565959]">Hoodies</span>
        </nav>

        {/* Core Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Gallery + Virtual Try-On */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-2 w-12 shrink-0">
                <div 
                  onClick={() => setMainImage(productImages.charcoal)}
                  className={`border-2 p-1 rounded cursor-pointer overflow-hidden transition-all ${
                    mainImage === productImages.charcoal ? 'border-[#e47911]' : 'border-gray-300'
                  }`}
                >
                  <img className="w-full aspect-[3/4] object-cover" alt="Charcoal hoodie thumb" src={productImages.charcoal} />
                </div>
                <div 
                  onClick={() => setMainImage(productImages.navy)}
                  className={`border p-1 rounded cursor-pointer overflow-hidden hover:border-gray-500 transition-all ${
                    mainImage === productImages.navy ? 'border-[#e47911]' : 'border-gray-300'
                  }`}
                >
                  <img className="w-full aspect-[3/4] object-cover" alt="Navy hoodie thumb" src={productImages.navy} />
                </div>
              </div>

              {/* Main Image Panel */}
              <div className="flex-grow border border-gray-300 rounded-sm relative bg-white flex items-center justify-center min-h-[480px]">
                <img 
                  className="max-w-full max-h-[500px] object-contain transition-all duration-300" 
                  alt="Main Product Hoodie" 
                  src={mainImage} 
                />
              </div>
            </div>

            {/* VIRTUAL TRY-ON CONTAINER */}
            <div className="border border-gray-300 rounded overflow-hidden bg-gray-50 shadow-sm" id="virtual-try-on">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer border-b border-gray-300 bg-white hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#007185] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    person_search
                  </span>
                  <span className="font-bold text-base flex items-center">
                    See It On You
                    <span className="text-[10px] font-bold bg-orange-100 text-[#c45500] px-2 py-0.5 rounded-full uppercase ml-2 border border-orange-200">
                      Beta
                    </span>
                  </span>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>

              {isOpen && (
                <div className="transition-all duration-300">
                  {/* Method Selector Tabs */}
                  <div className="flex p-3 gap-2 bg-white border-b border-gray-200">
                    <button
                      onClick={() => handleMethodSelect('photo')}
                      className={`flex-1 py-2 text-xs font-bold rounded shadow-sm border transition-all cursor-pointer ${
                        selectedMethod === 'photo'
                          ? 'bg-white border-[#e47911] text-[#0F1111]'
                          : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Use my photo
                    </button>
                    <button
                      onClick={() => handleMethodSelect('model')}
                      className={`flex-1 py-2 text-xs font-bold rounded shadow-sm border transition-all cursor-pointer ${
                        selectedMethod === 'model'
                          ? 'bg-white border-[#e47911] text-[#0F1111]'
                          : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Use a model
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Step 1: Upload Prompt (photo mode) / Generate Prompt (model mode) */}
                  {tryOnStep === 1 && selectedMethod === 'photo' && (
                    <div className="p-5 text-center bg-white space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 text-[48px]">add_a_photo</span>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-700">Drag and drop or</p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="amazon-btn-secondary px-6 py-2 rounded-full text-xs font-bold shadow-sm"
                          >
                            Choose photo
                          </button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          <span className="bg-white text-gray-600 px-3 py-1 rounded-full text-[10px] flex items-center gap-1 border border-gray-200">
                            <span className="material-symbols-outlined text-[14px] text-green-700 font-bold">check_circle</span> Front-facing
                          </span>
                          <span className="bg-white text-gray-600 px-3 py-1 rounded-full text-[10px] flex items-center gap-1 border border-gray-200">
                            <span className="material-symbols-outlined text-[14px] text-green-700 font-bold">check_circle</span> Good lighting
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 max-w-[280px] mx-auto">
                        <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">lock</span>
                        Your photo is sent to our AI try-on service only to generate this preview and is not stored.
                      </p>
                    </div>
                  )}

                  {tryOnStep === 1 && selectedMethod === 'model' && (
                    <div className="p-5 text-center bg-white space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 text-[48px]">diversity_3</span>
                        <p className="text-xs font-bold text-gray-700">We'll pick a random model to show this item on</p>
                        <button
                          onClick={() => generate()}
                          className="amazon-btn-secondary px-6 py-2 rounded-full text-xs font-bold shadow-sm"
                        >
                          Generate preview
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Loader Shimmer */}
                  {tryOnStep === 2 && (
                    <div className="p-5 text-center bg-white">
                      <div className="w-full h-80 bg-gray-100 rounded flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                        <div className="shimmer absolute inset-0 opacity-40"></div>
                        <div className="relative z-10 space-y-3">
                          <div className="w-12 h-12 border-4 border-[#007185] border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-xs font-bold text-gray-700">Generating your preview...</p>
                          <p className="text-[10px] text-gray-500">AI size modeling and drapery mapping engine active.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Error */}
                  {tryOnStep === 4 && (
                    <div className="p-5 text-center bg-white space-y-4">
                      <div className="border border-red-200 bg-red-50 rounded-lg p-6 flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 text-[36px]">error</span>
                        <p className="text-xs font-bold text-red-700">Couldn't generate your preview</p>
                        <p className="text-[11px] text-red-600 w-full max-w-[280px]">{tryOnError}</p>
                      </div>
                      <button
                        onClick={() => setTryOnStep(1)}
                        className="amazon-btn-secondary px-6 py-2 rounded-full text-xs font-bold shadow-sm"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {/* Step 3: Try-on Result */}
                  {tryOnStep === 3 && (
                    <div className="p-5 bg-white space-y-4">
                      <div className="relative w-full aspect-[4/5] bg-gray-100 border border-gray-300 rounded overflow-hidden group">
                        <img
                          className="w-full h-full object-contain transition-all duration-300"
                          alt="AI Try-on Preview"
                          src={resultImage}
                        />
                      </div>

                      <div className="flex flex-col gap-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">Update color in preview:</span>
                          {selectedMethod === 'photo' ? (
                            <button
                              onClick={() => setTryOnStep(1)}
                              className="text-[#007185] hover:text-[#e47911] font-bold text-[11px] hover:underline cursor-pointer"
                            >
                              Doesn't look right? Retake photo
                            </button>
                          ) : (
                            <button
                              onClick={() => generate()}
                              className="text-[#007185] hover:text-[#e47911] font-bold text-[11px] hover:underline cursor-pointer"
                            >
                              Try another model
                            </button>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1">
                          <button 
                            onClick={() => handleColorChange('charcoal')}
                            className={`w-8 h-8 rounded-full bg-[#232F3E] border-2 transition-all hover:scale-105 ${
                              activeColor === 'charcoal' ? 'border-[#e47911] ring-2 ring-offset-2 ring-[#e47911]' : 'border-gray-300'
                            }`}
                          />
                          <button 
                            onClick={() => handleColorChange('navy')}
                            className={`w-8 h-8 rounded-full bg-[#535F70] border-2 transition-all hover:scale-105 ${
                              activeColor === 'navy' ? 'border-[#e47911] ring-2 ring-offset-2 ring-[#e47911]' : 'border-gray-300'
                            }`}
                          />
                          <button 
                            onClick={() => handleColorChange('black')}
                            className={`w-8 h-8 rounded-full bg-[#111111] border-2 transition-all hover:scale-105 ${
                              activeColor === 'black' ? 'border-[#e47911] ring-2 ring-offset-2 ring-[#e47911]' : 'border-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle Column: Product Specifications */}
          <div className="lg:col-span-4 flex flex-col gap-4 text-left">
            <header className="space-y-1">
              <h1 className="text-[#0F1111] font-bold text-xl leading-snug">
                Amazon Essentials Men's Full-Zip Hooded Fleece Sweatshirt
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex text-[#febd69]">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]">star_half</span>
                </div>
                <span className="text-[#007185] hover:underline cursor-pointer">14,281 ratings</span>
              </div>
            </header>

            <div className="border-y border-gray-300 py-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-semibold">₹</span>
                <span className="text-2xl font-bold leading-none">2,069</span>
                <span className="text-xs font-semibold">00</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Prices include VAT. <span className="text-[#007185] hover:underline cursor-pointer">FREE Returns</span></p>

              {/* RETURN PREVENTION BADGE — personalized to the shopper's own
                  return history once loaded; falls back to the generic
                  item-level stat if the risk profile hasn't loaded (or has
                  no order history yet) so the section never looks broken. */}
              {(() => {
                const hasHistory = riskProfile && riskProfile.totalOrdersPlaced > 0;
                const style = hasHistory
                  ? RISK_TIER_STYLES[riskProfile.tier] || RISK_TIER_STYLES['Moderate Risk']
                  : { bg: 'bg-[#e7f4f5]', border: 'border-[#d5d9d9]', text: 'text-gray-800', icon: 'text-green-700', symbol: 'check_circle' };
                const pct = hasHistory ? Math.round(riskProfile.returnRate * 100) : null;
                const reason = hasHistory ? humanizeReturnReason(riskProfile.topReturnReason) : null;
                const isElevatedRisk = hasHistory && (riskProfile.tier === 'Moderate Risk' || riskProfile.tier === 'Critical Risk');

                return (
                  <div className={`mt-3 ${style.bg} border ${style.border} p-3 rounded-md flex items-center gap-3`}>
                    <span className={`material-symbols-outlined ${style.icon} text-[20px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {style.symbol}
                    </span>
                    {hasHistory ? (
                      <div>
                        <p className={`font-bold text-xs ${style.text}`}>
                          You've returned {riskProfile.totalReturns} of your last {riskProfile.totalOrdersPlaced} orders ({pct}%)
                        </p>
                        <p className="text-[11px] text-gray-600 leading-tight">
                          {reason
                            ? `Most often because: "${reason}".`
                            : ''}{' '}
                          {isElevatedRisk
                            ? `Returning this too could push your account further into ${riskProfile.tier} — double-check fit with the try-on below first.`
                            : 'Your return history is healthy — a quick try-on below keeps it that way.'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-xs text-gray-800">Return rate for this item: 8%</p>
                        <p className="text-[11px] text-gray-500 leading-tight">This is lower than average for similar items in Men's Hoodies.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Product Sizing & Return Insight Banner */}
              {productAnalysis && productAnalysis.returnSuggestion && (
                <div className="mt-2.5 bg-amber-50/50 border border-amber-250 p-3 rounded-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    warning
                  </span>
                  <div>
                    <p className="font-bold text-xs text-amber-900">
                      Product Return Insight
                    </p>
                    <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                      {productAnalysis.returnSuggestion}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-bold text-xs text-gray-800 mb-1">
                  Color: <span className="font-normal text-gray-600 uppercase">{activeColor} Swatch</span>
                </p>
                <div className="flex gap-2">
                  {Object.keys(productImages).map((color) => (
                    <div 
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`border-2 p-0.5 rounded cursor-pointer transition-all ${
                        activeColor === color ? 'border-[#e47911]' : 'border-gray-300'
                      }`}
                    >
                      <img className="w-10 h-12 object-cover" alt={`${color} swatch`} src={productImages[color]} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="font-bold text-xs text-gray-800 block mb-1">Size:</p>
                <select 
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="amazon-btn-secondary px-3 py-1.5 rounded text-xs w-full max-w-[200px] shadow-sm bg-white"
                >
                  <option>Select Size</option>
                  <option>Small (38)</option>
                  <option>Medium (40)</option>
                  <option>Large (42)</option>
                  <option>X-Large (44)</option>
                </select>

                {/* Sizing Recommendations Box */}
                {recommendedSize && (
                  <div className="bg-[#f7fafa] border border-[#007185]/20 p-3.5 rounded mt-2.5 text-left max-w-[280px]">
                    <div className="text-[#007185] font-bold text-xs mb-0.5">We recommend a {recommendedSize} in this style</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-orange-600 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      <span>{confidencePct}% Sizing Match Confidence</span>
                    </div>
                    {reviewSizingNote && (
                      <p className="text-[10px] text-gray-600 mt-1.5 italic leading-tight">
                        {reviewSizingNote}
                      </p>
                    )}
                    <button 
                      onClick={() => setSelectedSize(recommendedSize)}
                      className="mt-2.5 bg-[#FFA41C] border border-[#FF8F00] text-[#0f1111] hover:bg-[#F29F1B] rounded-full py-1.5 px-4 text-[10px] font-bold shadow-sm focus:outline-none cursor-pointer"
                    >
                      Select this size
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <h3 className="font-bold text-xs text-gray-800">About this item</h3>
                <ul className="list-disc ml-4 space-y-1.5 text-xs text-gray-700">
                  <li>Classic full-zip hoodie in a warm, comfortable fleece</li>
                  <li>9-ounce midweight fleece</li>
                  <li>Ribbed cuffs and waistband</li>
                  <li>Split kangaroo pocket</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Area */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 p-4 rounded-lg flex flex-col gap-4 bg-white text-left sticky top-24">
              <div>
                <span className="text-2xl font-bold">₹2,069.00</span>
                <p className="text-xs text-gray-600 mt-1">Get it <span className="font-bold text-gray-800">Tomorrow, 12 Oct</span></p>
                <p className="text-[10px] text-red-700">Order within 4 hrs 12 mins</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#007185] cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>Deliver to Mumbai 400001</span>
              </div>

              <p className="text-lg text-[#007600] font-bold">In Stock</p>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setCartCount(c => c + 1)}
                  className="amazon-btn-primary w-full py-2 rounded-full font-bold text-xs shadow-sm"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => alert(`Purchasing Hoodie color ${activeColor}`)}
                  className="bg-[#FFA41C] hover:bg-[#F29F1B] border border-[#FF8F00] w-full py-2 rounded-full font-bold text-xs shadow-sm cursor-pointer text-gray-900"
                >
                  Buy Now
                </button>
              </div>

              <div className="text-[11px] text-gray-500 space-y-1.5 pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Ships from</span>
                  <span className="text-gray-800">Amazon.in</span>
                </div>
                <div className="flex justify-between">
                  <span>Sold by</span>
                  <span className="text-gray-800">Amazon.in</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <ProductReviewsSection productId="apparel-prod-1" />
        </div>
      </main>

      {/* Footer Area */}
      <footer className="bg-[#232F3E] w-full flex flex-col items-center pt-8 pb-6 px-6 mt-20 text-white">
        <span 
          onClick={onBackToGateway}
          className="bg-[#37475a] text-center w-full block py-3 hover:bg-[#485769] transition-colors mb-8 text-sm font-semibold cursor-pointer"
        >
          Back to top
        </span>
        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left text-sm">
          <div className="space-y-2">
            <div className="font-bold text-sm mb-1 text-gray-200">Get to Know Us</div>
            <div className="flex flex-col gap-1.5 text-xs text-gray-300 hover:text-white cursor-pointer">
              <span>Careers</span>
              <span>About Amazon</span>
              <span>Investor Relations</span>
              <span>Amazon Science</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-sm mb-1 text-gray-200">Make Money with Us</div>
            <div className="flex flex-col gap-1.5 text-xs text-gray-300 hover:text-white cursor-pointer">
              <span>Sell on Amazon</span>
              <span>Supply to Amazon</span>
              <span>Become an Affiliate</span>
              <span>Protect Your Brand</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-sm mb-1 text-gray-200">Amazon Payment</div>
            <div className="flex flex-col gap-1.5 text-xs text-gray-300 hover:text-white cursor-pointer">
              <span>Amazon Business Card</span>
              <span>Shop with Points</span>
              <span>Reload Your Balance</span>
              <span>Amazon Currency Converter</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-sm mb-1 text-gray-200">Let Us Help You</div>
            <div className="flex flex-col gap-1.5 text-xs text-gray-300 hover:text-white cursor-pointer">
              <span>Your Account</span>
              <span>Your Orders</span>
              <span>Shipping Rates &amp; Policies</span>
              <span>Help</span>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-gray-700 pt-8 flex flex-col items-center gap-4">
          <div className="font-extrabold text-2xl tracking-tight">Amazon</div>
          <div className="flex gap-4 text-xs text-gray-300 flex-wrap justify-center">
            <div className="flex items-center gap-1 border border-gray-600 px-4 py-1.5 rounded-sm cursor-pointer hover:border-white">
              <span className="material-symbols-outlined text-[16px]">language</span> English
            </div>
            <div className="flex items-center gap-1 border border-gray-600 px-4 py-1.5 rounded-sm cursor-pointer hover:border-white">
              <span className="font-bold">₹</span> INR - Indian Rupee
            </div>
            <div className="flex items-center gap-1 border border-gray-600 px-4 py-1.5 rounded-sm cursor-pointer hover:border-white">
              <span className="material-symbols-outlined text-[16px]">flag</span> India
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-400">
            <span className="hover:underline cursor-pointer">Conditions of Use</span>
            <span className="hover:underline cursor-pointer">Privacy Notice</span>
            <span className="hover:underline cursor-pointer">Your Ads Privacy Choices</span>
          </div>
          <p className="text-[11px] text-gray-500 opacity-80 mt-2">© 1996-2026, Amazon.com, Inc. or its affiliates</p>
        </div>
      </footer>
    </div>
  );
}

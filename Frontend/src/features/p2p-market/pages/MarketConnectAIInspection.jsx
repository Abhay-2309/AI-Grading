/**
 * MarketConnectAIInspection
 * ─────────────────────────────────────────────────────────────────────────────
 * A fully independent, standalone page for the seller AI inspection step in
 * MarketConnect. This page is NOT a reuse of anything from the return-user
 * flow — it has its own MarketConnect-branded chrome and uses the
 * SellerAiInspection component which is already wired to the P2P grading
 * backend endpoints (/api/grading/p2p/:productId/*).
 *
 * This page is reachable via p2pPage === 'ai-inspect' in App.jsx and receives
 * the productId + category of a listing that was just created (step 1 of the
 * sell wizard already created the product row in the DB).
 *
 * The seller:
 *  1. Picks a subcategory (e.g. "Smartphone" under "Electronics")
 *  2. Uploads multi-angle photos (front / back / left / right / top / bottom)
 *     — exactly which angles depend on the subcategory
 *  3. Answers product-specific condition questions (powers on? battery health?
 *     cracks? charger included? etc.) drawn from conditionQuestions.js
 *  4. Submits → AI grades the product via YOLO + Moondream
 *  5. Sees the AI report (grade A–F + detected defects)
 *  6. Navigates to shipping / publish step
 */

import React, { useState } from 'react';
import LocationPill from '../components/LocationPill';
import SellerAiInspection from '../components/SellerAiInspection';

export default function MarketConnectAIInspection({
  productId,
  productTitle,
  category,
  subcategoryTaxonomy,
  userLocation,
  onDetectLocation,
  onNext,       // called when AI grading succeeds → move to shipping step
  onBack,       // called to go back to details editing
  onNavigate,
  onExit,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery });
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">

      {/* ── MarketConnect Top Navigation ────────────────────────────────────── */}
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

          {/* Actions */}
          <div className="flex items-center gap-6 shrink-0">
            <LocationPill userLocation={userLocation} onDetectLocation={onDetectLocation} />

            <div className="hidden md:flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all">
              <span className="text-[10px] opacity-75">Hello, Sign in</span>
              <span className="text-xs font-bold">Account &amp; Lists</span>
            </div>

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

      {/* ── Page Body ────────────────────────────────────────────────────────── */}
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-6 py-8">

        {/* Wizard progress bar */}
        <div className="max-w-3xl mx-auto mb-8 text-center">
          <h1 className="text-lg md:text-xl font-extrabold text-slate-800 mb-6">Create a New Listing</h1>
          <div className="flex items-center justify-between px-6 md:px-12">
            {/* Step 1 — complete */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600">Details</span>
            </div>
            <div className="h-0.5 flex-grow mx-4 bg-orange-500" />

            {/* Step 2 — active */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-orange-500 text-white ring-4 ring-orange-100">
                2
              </div>
              <span className="text-[10px] font-bold text-orange-600">AI Inspection</span>
            </div>
            <div className="h-0.5 flex-grow mx-4 bg-slate-200" />

            {/* Step 3 — pending */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-200 text-slate-500">3</div>
              <span className="text-[10px] font-bold text-slate-400">Publish</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left: AI Inspection Panel ─────────────────────────────────── */}
          <section className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

            {/* Listing context header */}
            {productTitle && (
              <div className="mb-4 pb-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-orange-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listing</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{productTitle}</p>
                </div>
                <span className="ml-auto text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                  Pending AI Grade
                </span>
              </div>
            )}

            {/* SellerAiInspection does all the heavy lifting:
                • subcategory picker (e.g. Smartphone / Laptop / Tablet)
                • required view photo slots (front / back / left / right / top / bottom)
                • condition question bank (coreFunction / completeness / structure / usage / originality)
                • extra subcategory-specific questions (powersOn?, batteryHealth, etc.)
                • POST /api/grading/p2p/:productId/submit
                • polls GET /api/grading/p2p/:productId/status
                • fetches GET /api/grading/p2p/:productId/result
                • shows grade badge + defect list on success */}
            <SellerAiInspection
              productId={productId}
              category={category}
              subcategoryTaxonomy={subcategoryTaxonomy}
              onNext={onNext}
              onBack={onBack}
            />
          </section>

          {/* ── Right: How It Works sidebar ───────────────────────────────── */}
          <aside className="lg:col-span-5 flex flex-col gap-4 sticky top-24 h-fit">

            {/* How AI grading works */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <h3 className="text-sm font-black text-slate-800">How AI Grading Works</h3>
              </div>

              <ol className="space-y-3">
                {[
                  {
                    icon: 'category',
                    color: 'text-violet-600 bg-violet-100',
                    title: 'Pick your subcategory',
                    desc: 'Narrows down which photos & questions apply to your specific item type.',
                  },
                  {
                    icon: 'add_a_photo',
                    color: 'text-blue-600 bg-blue-100',
                    title: 'Upload multiple angles',
                    desc: 'Front, back, sides, top & bottom — our AI needs every angle to detect damage accurately.',
                  },
                  {
                    icon: 'quiz',
                    color: 'text-amber-600 bg-amber-100',
                    title: 'Answer condition questions',
                    desc: 'Powers on? Battery health? Charger included? These answers boost grading accuracy.',
                  },
                  {
                    icon: 'psychology',
                    color: 'text-emerald-600 bg-emerald-100',
                    title: 'YOLO + Moondream analysis',
                    desc: 'Our computer vision models scan for scratches, dents, cracks & more.',
                  },
                  {
                    icon: 'grade',
                    color: 'text-orange-600 bg-orange-100',
                    title: 'Instant Grade A–F',
                    desc: 'Buyers see this grade before contacting you — builds trust and reduces haggling.',
                  },
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{s.title}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Grade legend */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Grade Legend</h3>
              <div className="space-y-2">
                {[
                  { grade: 'A',  label: 'Like New',   color: 'bg-emerald-600', desc: 'No visible defects detected' },
                  { grade: 'B',  label: 'Very Good',  color: 'bg-blue-500',    desc: 'Minor cosmetic wear' },
                  { grade: 'C',  label: 'Good',       color: 'bg-amber-500',   desc: 'Visible wear, fully functional' },
                  { grade: 'F',  label: 'Fair',       color: 'bg-red-500',     desc: 'Significant damage' },
                ].map(({ grade, label, color, desc }) => (
                  <div key={grade} className="flex items-center gap-3">
                    <span className={`${color} text-white text-[10px] font-extrabold px-2 py-0.5 rounded min-w-[28px] text-center`}>
                      {grade}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-2">
              <span className="material-symbols-outlined text-orange-500 text-[18px] shrink-0 mt-0.5">lightbulb</span>
              <p className="text-[11px] text-orange-800 leading-relaxed">
                <strong>Photo tips:</strong> Use natural daylight, avoid flash glare, keep the item on a plain background, and photograph all damage honestly — buyers trust verified sellers with accurate grades.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800 text-left text-xs">
        <div className="max-w-[1440px] mx-auto px-6 py-6 text-center text-slate-500">
          <p>© 2026 MarketConnect Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

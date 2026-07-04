import React, { useState } from 'react';

export default function GreenCreditsWallet({
  greenCredits,
  donationHistory,
  impactStats,
  redeemCredits,
  onNavigate,
  onExit
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  const handleRedeem = async (creditsNeeded, perkTitle) => {
    const success = await redeemCredits(creditsNeeded, perkTitle);
    if (success) {
      setRedeemSuccess(`Successfully redeemed: ${perkTitle}! Your wallet balance has been updated.`);
      setTimeout(() => {
        setRedeemSuccess('');
      }, 3000);
    } else {
      alert('Insufficient Green Credits balance to redeem this perk.');
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
      {/* TopNavBar */}
      <header className="bg-[#232F3E] text-white sticky top-0 z-50 shadow-md">
        {/* Upper Bar */}
        <div className="flex justify-between items-center w-full px-6 py-2.5 gap-6 max-w-[1440px] mx-auto">
          {/* Brand Logo */}
          <button 
            onClick={() => onNavigate('donation-home')} 
            className="text-xl md:text-2xl font-black text-white hover:text-green-400 transition-colors bg-transparent border-none cursor-pointer focus:outline-none shrink-0"
          >
            MarketConnect <span className="text-green-400">Cares</span>
          </button>

          {/* Search Bar */}
          <div className="flex-grow max-w-2xl">
            <div className="flex items-center">
              <input
                className="w-full bg-white border-none rounded-l-md py-2 px-4 text-xs focus:outline-none text-slate-900 placeholder-slate-500"
                placeholder="Search causes or NGOs..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={() => onNavigate('donation-home')}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-r-md flex items-center justify-center transition-colors border-none cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-white text-[18px]">search</span>
              </button>
            </div>
          </div>

          {/* Actions Cluster */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Location */}
            <div className="hidden lg:flex items-center gap-1.5 cursor-pointer hover:border hover:border-white p-1 rounded transition-all">
              <span className="material-symbols-outlined text-[18px] text-white">location_on</span>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] opacity-75">Deliver to</span>
                <span className="text-xs font-bold">India</span>
              </div>
            </div>

            {/* Wallet Link */}
            <button 
              onClick={() => onNavigate('green-credits')}
              className="bg-transparent border-none text-white flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all text-left focus:outline-none"
            >
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                Green Balance
              </span>
              <span className="text-xs font-black text-white">{greenCredits} Credits</span>
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

        {/* Lower Navigation links */}
        <div className="bg-[#eaeded] border-b border-slate-200 py-1.5 text-slate-700">
          <div className="max-w-[1440px] mx-auto flex items-center gap-6 px-6 overflow-x-auto scrollbar-none">
            <button 
              onClick={() => onNavigate('donation-home')}
              className="flex items-center gap-1 text-slate-800 font-bold hover:text-green-700 text-xs bg-transparent border-none cursor-pointer focus:outline-none"
            >
              <span className="material-symbols-outlined text-[16px]">menu</span> All Cares
            </button>
            <nav className="flex items-center gap-6 whitespace-nowrap text-xs">
              <button onClick={() => onNavigate('donation-home')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">Donate</button>
              <button onClick={() => onNavigate('ngo-profile')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">NGO Partners</button>
              <button onClick={() => onNavigate('green-credits')} className="font-bold text-green-700 border-b-2 border-green-700 pb-0.5 bg-transparent border-none">Green Credits Wallet</button>
              <button onClick={() => onNavigate('ngo-dashboard')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">NGO Dashboard Portal</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1440px] mx-auto px-6 py-8 w-full">
        {/* Balance Hero Header */}
        <section className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-xl p-8 md:p-12 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 text-left">
          <div className="space-y-2 flex-1">
            <h1 className="text-xl md:text-3xl font-black">Your Impact Portfolio</h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-[512px] leading-relaxed">
              Every Green Credit represents a verified step toward environmental sustainability. Use your credits to unlock platform benefits or reward your positive community choices.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-2xl text-center shadow-xl shrink-0 min-w-[280px]">
            <p className="text-[10px] font-bold tracking-wider text-green-400 uppercase mb-1">Available Balance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">🌿</span>
              <span className="text-4xl md:text-5xl font-black">{greenCredits}</span>
              <span className="text-sm font-bold text-green-400 self-end mb-1">Credits</span>
            </div>
            <button 
              onClick={() => onNavigate('donation-home')}
              className="w-full mt-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer border-none shadow"
            >
              Earn More Credits
            </button>
          </div>
        </section>

        {/* Success alert */}
        {redeemSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-xs font-bold shadow-sm justify-center">
            <span className="material-symbols-outlined text-green-650" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span>{redeemSuccess}</span>
          </div>
        )}

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Left Column: Redemption Perks and Guide */}
          <div className="lg:col-span-1 space-y-6">
            {/* Redemption Tiers */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">redeem</span>
                Redemption Tiers
              </h2>

              <div className="space-y-4">
                {/* 1 Free Listing */}
                <div 
                  onClick={() => handleRedeem(100, '1 Free Listing')}
                  className="bg-white border border-slate-200 p-5 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-600 group-hover:text-white text-green-700 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">list_alt</span>
                    </div>
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold">100 Credits</span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-800 group-hover:text-green-700 transition-colors">1 Free Listing Perk</h3>
                  <p className="text-slate-450 text-[10px] leading-relaxed mt-1">Promote one peer-to-peer listing for 30 days at no cost.</p>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-full w-full"></div>
                  </div>
                </div>

                {/* Priority Placement */}
                <div 
                  onClick={() => handleRedeem(250, 'Priority Placement')}
                  className="bg-white border border-slate-200 p-5 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-600 group-hover:text-white text-green-700 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">bolt</span>
                    </div>
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold">250 Credits</span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-800 group-hover:text-green-700 transition-colors">Priority Placement</h3>
                  <p className="text-slate-450 text-[10px] leading-relaxed mt-1">Boost your items to the top of category search listings for 7 days.</p>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-full w-full"></div>
                  </div>
                </div>

                {/* Impact Badge */}
                <div 
                  onClick={() => handleRedeem(500, 'Impact Badge')}
                  className="bg-white border border-slate-200 p-5 rounded-xl hover:shadow-md transition-all cursor-pointer group opacity-65 hover:opacity-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-600 group-hover:text-white text-green-700 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">workspace_premium</span>
                    </div>
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold">500 Credits</span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-800 group-hover:text-green-700 transition-colors">Impact Badge Verification</h3>
                  <p className="text-slate-450 text-[10px] leading-relaxed mt-1">Earn a permanent badge showing your environmental commitment to buyers.</p>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-full w-[64%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 space-y-4">
              <h2 className="text-xs font-bold text-green-900 uppercase tracking-wider">How it works</h2>
              <ul className="space-y-4 text-xs">
                <li className="flex gap-3">
                  <span className="font-extrabold text-green-700 text-sm">1.</span>
                  <div>
                    <p className="font-bold text-slate-800">Support Causes</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Donate pre-owned items to verified campaign needs or recycle packages.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-extrabold text-green-700 text-sm">2.</span>
                  <div>
                    <p className="font-bold text-slate-800">Receive Credits</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Green Credits are calculated automatically based on quantity and verified item status.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-extrabold text-green-700 text-sm">3.</span>
                  <div>
                    <p className="font-bold text-slate-800">Redeem Perks</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Spend credits on listing highlights, priority search matching, and badges.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: History Log and Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-green-605">history</span>
                Impact History Log
              </h2>
              <button 
                onClick={() => alert('Exporting PDF Impact Statement to downloads folder.')}
                className="flex items-center gap-1 bg-transparent border-none text-xs font-bold text-green-700 hover:text-green-800 cursor-pointer focus:outline-none"
              >
                <span className="material-symbols-outlined text-sm">download</span> Export Statement
              </button>
            </div>

            {/* History Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">NGO / Partner</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Balance Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {donationHistory.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{tx.date}</td>
                        <td className="px-5 py-3.5 font-bold">
                          <div className="flex items-center gap-2">
                            {tx.logo && <img className="w-6 h-6 rounded-full object-contain shrink-0 border border-slate-100 p-0.5 bg-white" alt="logo" src={tx.logo} />}
                            <span className="text-slate-800">{tx.ngo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">{tx.action}</td>
                        <td className="px-5 py-3.5 text-right font-black whitespace-nowrap">
                          <span className={tx.credits > 0 ? 'text-green-600' : 'text-red-500'}>
                            {tx.credits > 0 ? `+${tx.credits}` : tx.credits}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer">
                  Load Older History
                </button>
              </div>
            </div>

            {/* Stats Modules */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">park</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trees Planted</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{impactStats.treesPlanted}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Causes Helped</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{impactStats.causesHelped}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800 text-left text-xs">
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <span className="font-bold text-sm text-green-400">MarketConnect Cares</span>
            <p className="text-slate-500 text-[11px]">© 2026 MarketConnect Cares. Empowering global communities.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-slate-400">
            <a className="hover:text-white transition-colors cursor-pointer" href="#about">About Us</a>
            <a className="hover:text-white transition-colors cursor-pointer" href="#ngo">NGO Verification</a>
            <a className="hover:text-white transition-colors cursor-pointer" href="#receipts">Tax Receipts</a>
            <a className="hover:text-white transition-colors cursor-pointer" href="#privacy">Privacy Policy</a>
            <a className="hover:text-white transition-colors cursor-pointer" href="#support">Contact Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

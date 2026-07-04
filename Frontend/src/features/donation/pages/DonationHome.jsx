import React, { useState, useMemo } from 'react';
import NGODetailsModal from '../components/NGODetailsModal';

export default function DonationHome({
  donationCampaigns,
  greenCredits,
  onNavigate,
  onExit
}) {
  // Filters
  const [selectedCauses, setSelectedCauses] = useState({
    Education: false,
    'Food Security': false,
    'Emergency Shelter': false,
    Sustainability: false
  });
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('all'); // 'all', 'high'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCampaign, setViewingCampaign] = useState(null);

  // Real Indian states present in the actual campaign data, not a hardcoded list.
  const availableStates = useMemo(
    () => [...new Set(donationCampaigns.map((c) => c.state).filter(Boolean))].sort(),
    [donationCampaigns]
  );

  const toggleCause = (cause) => {
    setSelectedCauses(prev => ({
      ...prev,
      [cause]: !prev[cause]
    }));
  };

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return donationCampaigns.filter(camp => {
      // Search query
      if (searchQuery && !camp.title.toLowerCase().includes(searchQuery.toLowerCase()) && !camp.ngoName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Causes filter
      const activeCauses = Object.keys(selectedCauses).filter(c => selectedCauses[c]);
      if (activeCauses.length > 0 && !activeCauses.includes(camp.category)) {
        return false;
      }
      // Location filter — a real Indian state, dynamically derived from the campaign data
      if (selectedLocation !== 'All' && camp.state !== selectedLocation) {
        return false;
      }
      // Urgency filter
      if (urgencyFilter === 'high' && camp.urgency !== 'high') {
        return false;
      }
      return true;
    });
  }, [donationCampaigns, selectedCauses, selectedLocation, urgencyFilter, searchQuery]);

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
              <button onClick={() => onNavigate('donation-home')} className="font-bold text-green-700 border-b-2 border-green-700 pb-0.5 bg-transparent border-none">Donate</button>
              <button onClick={() => onNavigate('ngo-profile')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">NGO Partners</button>
              <button onClick={() => onNavigate('green-credits')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">Green Credits Wallet</button>
              <button onClick={() => onNavigate('ngo-dashboard')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">NGO Dashboard Portal</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 text-left">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-6">
            <section>
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Causes</h3>
              <div className="space-y-2.5">
                {['Education', 'Food Security', 'Emergency Shelter', 'Sustainability'].map(cause => (
                  <label key={cause} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer" 
                      type="checkbox"
                      checked={selectedCauses[cause]}
                      onChange={() => toggleCause(cause)}
                    />
                    <span className={`text-xs ${selectedCauses[cause] ? 'text-green-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'} transition-colors`}>
                      {cause}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Location</h3>
              <select 
                className="w-full bg-slate-50 border border-slate-300 rounded-lg text-xs py-2 px-3 focus:ring-green-500 focus:border-green-500 text-slate-700 cursor-pointer"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="All">All States</option>
                {availableStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </section>

            <section className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Urgency</h3>
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    className="border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer" 
                    name="urgency" 
                    type="radio"
                    checked={urgencyFilter === 'high'}
                    onChange={() => setUrgencyFilter('high')}
                  />
                  <span className="text-xs text-slate-600">High Priority</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    className="border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer" 
                    name="urgency" 
                    type="radio"
                    checked={urgencyFilter === 'all'}
                    onChange={() => setUrgencyFilter('all')}
                  />
                  <span className="text-xs text-slate-600">All Needs</span>
                </label>
              </div>
            </section>
          </div>

          {/* Green Credits Promo Card */}
          <div className="bg-gradient-to-br from-green-900 to-slate-900 text-white rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition-all shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-green-400 font-semibold">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="text-xs tracking-wider uppercase font-bold">Impact Bonus</span>
            </div>
            <p className="text-sm font-black mb-1">Earn ~30 Green Credits</p>
            <p className="text-[10px] text-slate-300 leading-relaxed">Support any active campaign today to gain credits redeemable for free marketplace listing perks.</p>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-7xl">forest</span>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="flex-grow space-y-6 text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800">Support Active Needs</h1>
              <p className="text-slate-400 text-xs mt-1">Transparency-first donations. 100% of your contributions go straight to verified NGOs.</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-655">
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Sort by: Most Urgent</span>
            </div>
          </div>

          {/* campaigns need grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCampaigns.map(camp => (
              <div 
                key={camp.id} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all flex flex-col group"
              >
                <div className="relative h-48 bg-slate-100">
                  <img className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" alt={camp.title} src={camp.image} />
                  {camp.urgency === 'high' && (
                    <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">
                      High Urgency
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-white/95 rounded-lg p-1 shadow border border-slate-100 flex items-center justify-center">
                    <img className="w-8 h-8 object-contain" alt="NGO Logo" src={camp.ngoLogo} />
                  </div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-2 text-xs text-green-700 font-bold">
                      <span className="material-symbols-outlined text-green-600 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span className="uppercase tracking-tight">{camp.ngoName}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 mb-2 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
                      {camp.title}
                    </h4>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                      {camp.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                        <span>Progress: {camp.received} / {camp.target} {camp.unit}</span>
                        <span>{camp.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 rounded-full progress-bar-glow" style={{ width: `${camp.progress}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingCampaign(camp)}
                        className="px-3 py-2.5 border border-slate-300 hover:border-slate-400 text-slate-650 hover:text-slate-800 font-bold text-xs rounded-lg transition-colors bg-transparent cursor-pointer"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onNavigate('donation-flow', { campaignId: camp.id })}
                        className="flex-grow bg-green-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        Donate Now
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredCampaigns.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                <p className="text-slate-400 text-sm mt-3 font-bold">No active needs matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800 text-left text-xs">
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <span className="font-bold text-sm text-green-400">MarketConnect Cares</span>
            <p className="text-slate-500 text-[11px]">© 2026 MarketConnect Cares. Empowering global communities through transparency.</p>
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

      <NGODetailsModal
        campaign={viewingCampaign}
        onClose={() => setViewingCampaign(null)}
        onDonate={viewingCampaign ? () => {
          onNavigate('donation-flow', { campaignId: viewingCampaign.id });
          setViewingCampaign(null);
        } : undefined}
      />
    </div>
  );
}

import React, { useState } from 'react';
import NGODetailsModal from '../components/NGODetailsModal';

export default function NGOProfile({
  donationCampaigns,
  greenCredits,
  onNavigate,
  onExit
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(12480);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCampaign, setViewingCampaign] = useState(null);

  const handleFollowToggle = () => {
    if (isFollowing) {
      setFollowCount(prev => prev - 1);
    } else {
      setFollowCount(prev => prev + 1);
    }
    setIsFollowing(!isFollowing);
  };

  // Only show campaigns hosted by 'GreenEarth Alliance' or 'Global Relief Food Bank' (representative for the profile)
  // Let's filter to campaigns matching "GreenEarth Alliance" for this specific NGO Profile page
  const ngoCampaigns = donationCampaigns.filter(c => c.ngoName === 'GreenEarth Alliance');
  // Founder/contact/address/mission are denormalized per-campaign (same
  // pattern as ngoName/ngoLogo) — any campaign from this NGO carries them.
  const ngoInfo = ngoCampaigns[0];
  const yearsActive = ngoInfo?.foundedYear ? new Date().getFullYear() - ngoInfo.foundedYear : null;

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
              <button onClick={() => onNavigate('ngo-profile')} className="font-bold text-green-700 border-b-2 border-green-700 pb-0.5 bg-transparent border-none">NGO Partners</button>
              <button onClick={() => onNavigate('green-credits')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">Green Credits Wallet</button>
              <button onClick={() => onNavigate('ngo-dashboard')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">NGO Dashboard Portal</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1440px] mx-auto px-6 py-8 w-full">
        {/* Hero Banner Section */}
        <section className="relative rounded-xl overflow-hidden mb-8 shadow-sm">
          <div className="h-[280px] w-full relative">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDwTFU74p6R5uVfGBbe9mQuek2qJeQ2EC_sK3_JUHDfwz1g8qTjyMJHKRFB0Or0oA90nLnOvMMsoUdIKps_yaE6ODU5yL8KhqZHOzenCKrcWtYrYkhaqkr_rQC_mHuooBESoLHaLeaf1wKf7qLauUesFzxVuXq4v79WRdLN8HmYzaFE7GZJUGgG_wqBIOTVxIX31uw6kj1qR8-IrhTH9xD4NZttFWMKkjx1ky0S_P0fZ-ZuyT4Izzl53w')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white p-2.5 shadow-lg border border-slate-200 shrink-0">
                  <img className="w-full h-full object-contain" alt="NGO Logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdBKOC5aGKXtP3QmmGYlZpUjq9T2MG1zN8WtjPPnTfgutZV_4uXWOq74g-nnrwSdOcXJfr5OzVmbt9EhRAHYCdo2jKGZBXonAdQM3QnJsSXhHeY7AeMWS59YFGlw4NdceAwvmkqtungcqlwV9IXmXt81EyBs1nWL6LI1k-lfFb2L7Jz0aIMiVjujT5aGyP95MXpPGUQ9wgVw-NtkMUJ3m0alWfgQfMNBwQ5ARFdte6DJbae3c-0T-X7A" />
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-lg md:text-2xl font-black">GreenEarth Alliance</h1>
                    <span className="material-symbols-outlined text-green-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <p className="text-xs md:text-sm opacity-90 font-medium">Global reforestation and community water security</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left Column: Mission, Stats, and Needs */}
          <div className="lg:col-span-8 space-y-8">
            {/* Mission Card */}
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Our Mission</h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                {ngoInfo?.missionStatement || 'Mission statement not on file yet.'}
              </p>
            </section>

            {/* Core Stats */}
            <section className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <span className="material-symbols-outlined text-green-600 text-3xl mb-1">history</span>
                <div className="text-base font-black text-slate-800">{yearsActive ? `${yearsActive}+` : 'N/A'}</div>
                <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Years Active</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <span className="material-symbols-outlined text-green-600 text-3xl mb-1">handshake</span>
                <div className="text-base font-black text-slate-800">84.2k</div>
                <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Needs Fulfilled</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <span className="material-symbols-outlined text-green-600 text-3xl mb-1">star_rate</span>
                <div className="text-base font-black text-slate-800">4.9/5</div>
                <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Donor Rating</div>
              </div>
            </section>

            {/* Active Needs */}
            <section className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Open Campaign Needs</h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{ngoCampaigns.length} campaigns</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ngoCampaigns.map(camp => (
                  <div key={camp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                    <div className="h-44 overflow-hidden relative">
                      <img className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" alt={camp.title} src={camp.image} />
                      {camp.urgency === 'high' && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">priority_high</span> High Urgency
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-green-600 text-[14px]">verified</span>
                          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Verified Needs</span>
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm leading-snug mb-2 line-clamp-2">{camp.title}</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed mb-4 line-clamp-2">{camp.description}</p>
                      </div>

                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                            <span>{camp.progress}% Funded</span>
                            <span>{camp.received} / {camp.target} {camp.unit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-600 rounded-full" style={{ width: `${camp.progress}%` }}></div>
                          </div>
                        </div>
                        <button 
                          onClick={() => onNavigate('donation-flow', { campaignId: camp.id })}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm text-center"
                        >
                          Donate Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Actions, Map, and Wallet Promo */}
          <aside className="lg:col-span-4 space-y-6">
            {/* NGO Interaction Panel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <button 
                onClick={() => alert('Community chat initialized with GreenEarth Alliance support team!')}
                className="w-full bg-[#232F3E] text-white hover:bg-[#37475A] py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors border-none cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">mail</span> Message NGO
              </button>
              <button 
                onClick={handleFollowToggle}
                className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  isFollowing 
                    ? 'border-slate-300 text-slate-600 hover:bg-slate-50' 
                    : 'border-green-600 hover:border-green-700 text-green-700 hover:text-green-800 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{isFollowing ? 'check_circle' : 'add_circle'}</span> 
                {isFollowing ? 'Following' : 'Follow NGO'}
              </button>

              <div className="pt-4 border-t border-slate-100 flex justify-around text-center text-slate-500">
                <div>
                  <div className="font-extrabold text-sm text-slate-800">{followCount.toLocaleString()}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Followers</div>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div>
                  <div className="font-extrabold text-sm text-slate-800">4,210</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Donors</div>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div>
                  <div className="font-extrabold text-sm text-slate-800">186</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Projects</div>
                </div>
              </div>
            </div>

            {/* Map Address Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">HQ Location</span>
                <span className="material-symbols-outlined text-green-600 text-sm">location_on</span>
              </div>
              <div className="h-44 relative bg-slate-100">
                <img className="w-full h-full object-cover" alt="HQ Map" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz6I1Wl6VTq1ZkubRPUQKcO7h1NyG5c6GnD8UhkKkpiG26u4uinXzoLR_kU2s14B9CzyFQu5u5jgn4gjniR3lhm40qLcM71EIIAiPwEJfJo01vN_DPoj242_JBzPeljsyXpgvIx7_SlCZMHuAjtIgInEcMq5Dno363qum8TLmYO4ZGc9rgybAgUH2blErN4UjR9e2w0tHXb5sY8edyJq6OmjjWaKUNKIVc28-W3t9OlxLHQFHIL_Ex-A" />
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-sm leading-tight text-center">
                  Riverside Drive, Westlands, Nairobi, Kenya
                </div>
              </div>
            </div>

            {/* Green Credits Promo Wallet */}
            <div className="bg-gradient-to-br from-green-900 to-emerald-950 p-5 rounded-xl text-white shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-full shrink-0">
                  <span className="material-symbols-outlined text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-green-400">Impact Rewards</div>
                  <p className="text-[10px] opacity-75">Convert donations into wallet credits</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                For every 1 item contribution to GreenEarth Alliance campaigns, earn 30 Green Credits to spend on priority listings.
              </p>
              <div className="bg-white/10 p-3 rounded-lg flex justify-between items-center text-xs">
                <span className="font-bold">Active Balance:</span>
                <span className="text-green-400 font-extrabold text-sm">{greenCredits} Credits</span>
              </div>
            </div>
          </aside>
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

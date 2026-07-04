import React, { useState, useMemo } from 'react';

export default function DonationFlow({
  donationCampaigns,
  greenCredits,
  donateToCampaign,
  campaignId,
  onNavigate,
  onExit
}) {
  // Find active campaign
  const campaign = useMemo(() => {
    return donationCampaigns.find(c => c.id === campaignId) || donationCampaigns[0];
  }, [donationCampaigns, campaignId]);

  // Form states
  const [step, setStep] = useState(2); // 2: Details, 3: Confirmation
  const [itemCategory, setItemCategory] = useState('School Supplies');
  const [quantity, setQuantity] = useState(5);
  const [logistics, setLogistics] = useState('dropoff'); // 'dropoff', 'pickup'
  const [personalNote, setPersonalNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Values calculation
  const estimatedValue = useMemo(() => {
    return quantity * 150; // ₹150 estimated value per item
  }, [quantity]);

  const creditsAwarded = useMemo(() => {
    return quantity * 30; // 30 Green Credits per item
  }, [quantity]);

  const handleConfirm = () => {
    donateToCampaign(campaign.id, itemCategory, quantity, logistics, personalNote);
    setStep(3);
    setTimeout(() => {
      onNavigate('donation-home');
    }, 2000);
  };

  // donationCampaigns loads asynchronously now — render nothing crash-worthy while it's still empty.
  if (!campaign) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading campaign...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased pb-20">
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
              <button onClick={() => onNavigate('donation-home')} className="font-bold text-green-700 border-b-2 border-green-700 pb-0.5 bg-transparent cursor-pointer focus:outline-none">Donate</button>
              <button onClick={() => onNavigate('ngo-profile')} className="font-bold text-slate-600 hover:text-green-700 bg-transparent border-none cursor-pointer focus:outline-none">NGO Partners</button>
              <button onClick={() => onNavigate('green-credits')} className="font-bold text-slate-600 hover:text-green-700 bg-transparent border-none cursor-pointer focus:outline-none">Green Credits Wallet</button>
              <button onClick={() => onNavigate('ngo-dashboard')} className="font-bold text-slate-600 hover:text-green-700 bg-transparent border-none cursor-pointer focus:outline-none">NGO Dashboard Portal</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-8">
        {/* Progress Stepper */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div className="relative z-10 flex flex-col items-center gap-1 bg-slate-50 px-2">
              <div className="w-8 h-8 rounded-full border-2 border-green-600 flex items-center justify-center text-green-600 font-bold text-xs bg-white">1</div>
              <span className="text-[10px] font-bold text-green-600">Select Cause</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 bg-slate-50 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2 ? 'bg-green-600 text-white' : 'border-2 border-slate-350 bg-white text-slate-400'
              }`}>2</div>
              <span className={`text-[10px] font-bold ${step >= 2 ? 'text-green-700' : 'text-slate-400'}`}>Donation Details</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 bg-slate-50 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 3 ? 'bg-green-600 text-white' : 'border-2 border-slate-350 bg-white text-slate-400'
              }`}>3</div>
              <span className={`text-[10px] font-bold ${step >= 3 ? 'text-green-700' : 'text-slate-400'}`}>Confirmation</span>
            </div>
          </div>
        </div>

        {step === 2 ? (
          /* Donation Details Entry */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-6xl mx-auto">
            {/* Left Column: Summary Card & Details form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Need Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex gap-4">
                <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <img className="w-full h-full object-cover" alt="Campaign need" src={campaign.image} />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="bg-red-50 text-red-600 font-black text-[9px] uppercase px-2 py-0.5 rounded tracking-wider">
                      {campaign.urgency === 'high' ? 'High Urgency' : 'Verified Cause'}
                    </span>
                    <h2 className="font-extrabold text-sm text-slate-800 leading-snug">{campaign.title}</h2>
                    <p className="text-slate-400 text-[10px] font-bold">Organized by {campaign.ngoName}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mb-1">
                      <span>Progress</span>
                      <span>{campaign.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 rounded-full" style={{ width: `${campaign.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contribution Form */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-green-600">inventory_2</span>
                  <h3 className="font-extrabold text-sm text-slate-800">Your Contribution</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Item Category</label>
                    <select 
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-700 cursor-pointer"
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                    >
                      <option>School Supplies</option>
                      <option>Gently Used Books</option>
                      <option>Electronic Devices</option>
                      <option>Educational Toys</option>
                      <option>Sustainability Tools</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Quantity / Count</label>
                    <input 
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-800"
                      type="number"
                      value={quantity}
                      min="1"
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </div>
                </div>

                {/* Credits / Value calculation block */}
                <div className="bg-slate-50 rounded-lg p-5 flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-200">
                  <div className="text-center md:text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Value</p>
                    <p className="text-lg font-black text-slate-800">₹{estimatedValue.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex items-center gap-3 bg-green-50 rounded-full px-5 py-2 border border-green-200">
                    <span className="material-symbols-outlined text-green-700" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                    <div className="text-left">
                      <p className="text-[9px] font-bold text-green-700 uppercase tracking-wider leading-none">Green Credits Reward</p>
                      <p className="text-sm font-black text-green-700">+{creditsAwarded} Credits</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Logistics and note */}
            <div className="lg:col-span-5 space-y-6">
              {/* Logistics Selector */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-green-600">local_shipping</span>
                  <h3 className="font-extrabold text-sm text-slate-800">Logistics Options</h3>
                </div>

                <div className="space-y-3">
                  {/* Drop off */}
                  <label className={`flex flex-col gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    logistics === 'dropoff' ? 'border-green-600 bg-green-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="radio" 
                          name="logistics" 
                          checked={logistics === 'dropoff'}
                          onChange={() => setLogistics('dropoff')}
                          className="text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Drop off at Hub</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                    </div>
                    <div className="h-32 rounded-lg overflow-hidden relative">
                      <img className="w-full h-full object-cover" alt="Hub map" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChtlHBC-pgmIpzP_WumQMNbKVKxRqV9K8_01vaVSIUYv9YiSSspqGEYIR6yXmSM0Bln1OzmYDM094I82wanEN2Ux_7g4DKfoK_bBcOpj2f4_ZKCjU_KEX6sYywXHrpKDCMBAng5XgDmvn2Q0QIFuQq8nLX_5h2psfulP3Kwzj2lovLcjXqTE9IaOvONXfTJlGCuzWqn9_Kfpl5YCHqubOE606AW8LMCfV5aOWCVr8RVCdLUuaXhpDDLw" />
                      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded text-[9px] font-semibold text-slate-700 leading-tight">
                        MarketConnect Hub North • Baker St, India Hub
                      </div>
                    </div>
                  </label>

                  {/* Pickup */}
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    logistics === 'pickup' ? 'border-green-600 bg-green-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="radio" 
                        name="logistics" 
                        checked={logistics === 'pickup'}
                        onChange={() => setLogistics('pickup')}
                        className="text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 block">Schedule Pickup</span>
                        <span className="text-[10px] text-slate-400">Available Tue &amp; Thu, 9 AM - 5 PM</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-sm">schedule</span>
                  </label>
                </div>
              </div>

              {/* Personal Note */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-2 text-slate-850">
                  <span className="material-symbols-outlined text-slate-450 text-sm">chat_bubble</span>
                  <h3 className="text-xs font-bold text-slate-800">Personal Note (Optional)</h3>
                </div>
                <textarea 
                  className="w-full h-24 rounded-lg border border-slate-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-xs p-3 outline-none text-slate-800 resize-none"
                  placeholder="Write a warm note to the beneficiaries or NGO staff..."
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        ) : (
          /* Confirmation Success Screen */
          <div className="flex-grow flex items-center justify-center py-12">
            <div className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-md p-10 text-center space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h2 className="text-xl font-black text-slate-800">Donation Confirmed!</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your contribution of <strong>{quantity} {itemCategory}</strong> has been registered. You've earned <strong className="text-green-600">{creditsAwarded} Green Credits</strong>!
              </p>
              <p className="text-xs text-slate-400">
                Your tax receipt is being generated and will be sent to your registered email address. Redirecting back to Donation Home...
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      {step === 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 py-4 px-6">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-left">
              <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-[10px] text-slate-500 font-medium">
                Your donation is eligible for a tax receipt and will be verified by the NGO within 48 hours.
              </span>
            </div>
            <button 
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 px-10 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-[0.98] border-none shrink-0"
            >
              Confirm Donation
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

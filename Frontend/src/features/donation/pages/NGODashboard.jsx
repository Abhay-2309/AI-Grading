import React, { useState, useMemo } from 'react';
import NGODetailsModal from '../components/NGODetailsModal';

// This dashboard simulates the login of one specific NGO — its own real
// (Indian) org details, reused as defaults whenever this NGO posts a new
// need, and never editable per-need (only Manage NGO Profile would change
// these — out of scope here).
const ACTIVE_NGO = {
  ngoName: 'Global Literacy Initiative',
  ngoLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwfTWCFM9JVbDdxCgRarK_1Q8t-zySJRyyLRLcTdrFVrre5z3bq7ZHaB31j7y1_OLqfIJbgCgU7nzxfrCm_7JNsgf8xWfV6kc5Zhm-qp_xnU-1puAVNVfcqIDOudMjQk6vZPTtIuRYrM46EMY5cWbqvSuABJYmp78evzSOznK-dWplmXgczBuozuUauY7uS5RJmAZQUt5C5jFKfvtdIueLjGG_Xs4lScCHmt5LAXL6TLyKNVOtfToi9g',
  founder: 'Rajesh Iyer',
  contactPerson: 'Priya Menon (Program Manager)',
  contactEmail: 'support@globalliteracyinitiative.org.in',
  contactPhone: '+91 22 5678 9012',
  registrationNumber: 'NGO Darpan MH/2013/0078901',
  foundedYear: 2013,
  address: '45 SV Road, Andheri West, Mumbai, Maharashtra 400058',
  missionStatement: 'Improving science education outcomes across under-resourced Indian secondary schools through hands-on lab equipment and teacher training.',
};

const BLANK_FORM = {
  title: '', category: 'Education', target: 100, unit: 'items',
  description: '', location: 'Mumbai, Maharashtra', state: 'Maharashtra',
};

export default function NGODashboard({
  donationCampaigns,
  greenCredits,
  addCampaignNeed,
  updateCampaignNeed,
  onNavigate,
  onExit
}) {
  // Modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null); // null = creating a new need
  const [viewingCampaign, setViewingCampaign] = useState(null);
  const [successAlert, setSuccessAlert] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Need Form state (shared by create + edit)
  const [form, setForm] = useState(BLANK_FORM);

  // Filter state
  const [filterQuery, setFilterQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter campaigns hosted by the active NGO: 'Global Literacy Initiative' or 'GreenEarth Alliance' (let's display all NGO campaigns for simulation, and filter by search)
  const activeNeeds = useMemo(() => {
    return donationCampaigns.filter(camp => {
      if (filterQuery && !camp.title.toLowerCase().includes(filterQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [donationCampaigns, filterQuery]);

  const openCreateModal = () => {
    setEditingCampaignId(null);
    setForm(BLANK_FORM);
    setFormError('');
    setShowPostModal(true);
  };

  const openEditModal = (camp) => {
    setEditingCampaignId(camp.id);
    setForm({
      title: camp.title,
      category: camp.category,
      target: camp.target,
      unit: camp.unit,
      description: camp.description || '',
      location: camp.location || '',
      state: camp.state || '',
    });
    setFormError('');
    setShowPostModal(true);
  };

  const handlePostNeedSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      setFormError('Please fill out the title and description.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      if (editingCampaignId) {
        await updateCampaignNeed(editingCampaignId, {
          title: form.title,
          category: form.category,
          target: parseInt(form.target, 10) || 100,
          unit: form.unit,
          description: form.description,
          location: form.location,
          state: form.state,
        });
        setSuccessAlert('Need updated successfully!');
      } else {
        await addCampaignNeed({
          ...ACTIVE_NGO,
          title: form.title,
          urgency: 'standard',
          category: form.category,
          target: parseInt(form.target, 10) || 100,
          unit: form.unit,
          description: form.description,
          location: form.location,
          state: form.state,
          image: ACTIVE_NGO.ngoLogo,
        });
        setSuccessAlert('New active need has been posted successfully!');
      }
      setShowPostModal(false);
      setForm(BLANK_FORM);
      setTimeout(() => setSuccessAlert(''), 3000);
    } catch (err) {
      setFormError(err.message || 'Failed to save this need. Please try again.');
    } finally {
      setSubmitting(false);
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
              <button onClick={() => onNavigate('green-credits')} className="font-bold text-slate-655 hover:text-green-700 bg-transparent border-none">Green Credits Wallet</button>
              <button onClick={() => onNavigate('ngo-dashboard')} className="font-bold text-green-700 border-b-2 border-green-700 pb-0.5 bg-transparent border-none">NGO Dashboard Portal</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col space-y-6 text-left">
          {/* Post A Need Button */}
          <button
            onClick={openCreateModal}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer shadow"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Post a New Need
          </button>

          <nav className="bg-white rounded-xl border border-slate-200 p-4 space-y-1 shadow-sm font-bold text-xs">
            <a className="flex items-center gap-3 px-3 py-2.5 bg-green-50 text-green-700 rounded-lg" href="#dashboard">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              Dashboard Overview
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="#analytics" onClick={() => alert('Impact Analytics Console is currently in simulation mode.')}>
              <span className="material-symbols-outlined text-sm">analytics</span>
              Impact Analytics
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="#donors" onClick={() => alert('NGO Donors roster loaded.')}>
              <span className="material-symbols-outlined text-sm">volunteer_activism</span>
              Donors List
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="#chat" onClick={() => alert('NGO community chat client opened.')}>
              <span className="material-symbols-outlined text-sm">chat</span>
              Community Chat
            </a>
            <div className="pt-4 border-t border-slate-100 mt-4">
              <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" href="#settings" onClick={() => alert('NGO profile settings.')}>
                <span className="material-symbols-outlined text-sm">settings</span>
                Manage NGO Profile
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Dashboard Panel */}
        <section className="flex-grow text-left space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-black text-slate-800">Global Literacy Initiative</h1>
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-green-200">
                  Verified NGO
                </span>
              </div>
              <p className="text-slate-400 text-xs">Empowering rural communities through structured education and resource accessibility.</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] text-slate-450 font-bold uppercase">Last data sync: Today, 10:45 AM</span>
              <button 
                onClick={() => alert('Refreshed latest donations and needs.')}
                className="flex items-center gap-1.5 text-green-700 hover:text-green-800 text-xs font-bold bg-transparent border-none cursor-pointer focus:outline-none"
              >
                <span className="material-symbols-outlined text-sm">refresh</span> Refresh Stats
              </button>
            </div>
          </div>

          {/* Success Notification Alert */}
          {successAlert && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-xs font-bold shadow-sm justify-center">
              <span className="material-symbols-outlined text-green-650" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>{successAlert}</span>
            </div>
          )}

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-slate-400">
                <span className="material-symbols-outlined text-xl p-1.5 bg-slate-50 border border-slate-200 rounded-lg">list_alt</span>
                <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider">+12%</span>
              </div>
              <span className="text-slate-450 text-[10px] font-bold uppercase block tracking-wider">Needs Posted</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{donationCampaigns.length}</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-slate-400">
                <span className="material-symbols-outlined text-xl p-1.5 bg-slate-50 border border-slate-200 rounded-lg">package_2</span>
                <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider">+48%</span>
              </div>
              <span className="text-slate-450 text-[10px] font-bold uppercase block tracking-wider">Items Received</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">1,842</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-slate-400">
                <span className="material-symbols-outlined text-xl p-1.5 bg-slate-50 border border-slate-200 rounded-lg">groups</span>
                <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider">+5%</span>
              </div>
              <span className="text-slate-450 text-[10px] font-bold uppercase block tracking-wider">Total Donors</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">412</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-slate-400">
                <span className="material-symbols-outlined text-xl p-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg">eco</span>
                <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider">+124</span>
              </div>
              <span className="text-slate-450 text-[10px] font-bold uppercase block tracking-wider">Green Credits</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">8,950</span>
            </div>
          </div>

          {/* Tab Menu Header & Needs Filter */}
          <div className="border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-0.5">
            <div className="flex gap-6 text-xs font-bold text-slate-550">
              <button className="pb-3 border-b-2 border-green-600 text-green-700 bg-transparent border-none flex items-center gap-1.5">
                Active NGO Needs
                <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {donationCampaigns.length}
                </span>
              </button>
              <button onClick={() => alert('Donations transactions list loaded.')} className="pb-3 hover:text-green-700 bg-transparent border-none transition-colors">Donations History</button>
              <button onClick={() => alert('NGO Inbox loaded.')} className="pb-3 hover:text-green-700 bg-transparent border-none transition-colors flex items-center gap-1.5">
                Messages
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              </button>
            </div>
            
            <div className="pb-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input 
                  className="pl-8 pr-4 py-1 border border-slate-300 rounded-full bg-slate-100/50 text-[11px] focus:outline-none focus:ring-1 focus:ring-green-500 w-52"
                  placeholder="Filter active needs..."
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Need List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeNeeds.map(camp => (
              <div key={camp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="h-44 relative bg-slate-100">
                  <img className="w-full h-full object-cover" alt={camp.title} src={camp.image} />
                  {camp.urgency === 'high' ? (
                    <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">
                      High Urgency
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-slate-800/90 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">
                      Standard Need
                    </div>
                  )}
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{camp.title}</h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{camp.description}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 mt-4">
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mb-1.5">
                        <span>{camp.received} of {camp.target} {camp.unit} received</span>
                        <span className="text-green-700">{camp.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 rounded-full" style={{ width: `${camp.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => openEditModal(camp)}
                        className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition-colors border-none cursor-pointer text-center"
                      >
                        Edit Need
                      </button>
                      <button
                        onClick={() => setViewingCampaign(camp)}
                        className="px-4 py-2 border border-slate-300 hover:border-slate-400 text-slate-650 hover:text-slate-800 font-bold text-xs rounded-lg transition-colors bg-transparent cursor-pointer text-center"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reforestation milestone promo badge */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow text-white">
                <span className="material-symbols-outlined text-2xl">celebration</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-green-400">Reforestation Milestone Reached!</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">
                  NGO campaigns collectively generated enough points to fund over 1,200 mangrove trees. Thank you to our 400+ active platform contributors!
                </p>
              </div>
            </div>
            <button 
              onClick={() => alert('Opening full Reforestation Roster report.')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer shrink-0 shadow"
            >
              View Impact Report
            </button>
          </div>
        </section>
      </main>

      {/* Post/Edit Need Dialog Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-[512px] w-full overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800">{editingCampaignId ? 'Edit Need' : 'Post a New Need'}</h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="material-symbols-outlined text-slate-400 hover:text-slate-855 bg-transparent border-none cursor-pointer focus:outline-none"
              >
                close
              </button>
            </div>

            <form onSubmit={handlePostNeedSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-bold text-red-700">{formError}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Need Title</label>
                <input
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-800"
                  placeholder="e.g. STEM Robotics Kits"
                  type="text"
                  value={form.title}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-700 cursor-pointer"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option>Education</option>
                    <option>Food Security</option>
                    <option>Emergency Shelter</option>
                    <option>Sustainability</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Qty</label>
                  <input
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-800"
                    type="number"
                    value={form.target}
                    min="1"
                    required
                    onChange={(e) => setForm((f) => ({ ...f, target: Math.max(1, parseInt(e.target.value, 10) || 100) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</label>
                  <input
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-800"
                    placeholder="e.g. kits, packages, units"
                    type="text"
                    value={form.unit}
                    required
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                  <input
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-800"
                    placeholder="e.g. Mumbai, Maharashtra"
                    type="text"
                    value={form.location}
                    required
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-slate-800 resize-none"
                  placeholder="Provide details about the items needed, how they will be utilized..."
                  rows="3"
                  value={form.description}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition-colors border-none cursor-pointer shadow disabled:opacity-50 disabled:cursor-wait"
                >
                  {submitting ? 'Saving...' : editingCampaignId ? 'Save Changes' : 'Submit Need'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <NGODetailsModal campaign={viewingCampaign} onClose={() => setViewingCampaign(null)} />

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

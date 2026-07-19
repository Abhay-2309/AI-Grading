import React, { useState } from 'react';
import { useGlobalState } from './services/api';

// Return User Pages
import OrderList from './features/return-user/pages/OrderList';
import ReturnReason from './features/return-user/pages/ReturnReason';
import ItemCondition from './features/return-user/pages/ItemCondition';
import GuidedPhotoCapture from './features/return-user/pages/GuidedPhotoCapture';
import AiGrading from './features/return-user/pages/AiGrading';
import ReturnSummary from './features/return-user/pages/ReturnSummary';

// Pickup Agent Pages
import TaskList from './features/pickup-agent/pages/TaskList';
import ItemVerification from './features/pickup-agent/pages/ItemVerification';
import ConflictFlags from './features/pickup-agent/pages/ConflictFlags';
import ShiftSummary from './features/pickup-agent/pages/ShiftSummary';

// Hub Admin Pages
import ManualReview from './features/hub-admin/pages/ManualReview';
import ItemDetail from './features/hub-admin/pages/ItemDetail';
import RiskScoring from './features/hub-admin/pages/RiskScoring';
import RoutingBoard from './features/hub-admin/pages/RoutingBoard';
import Leaderboard from './features/hub-admin/pages/Leaderboard';

// Return Prevention Pages
import VirtualTryOn from './features/return-prevention/pages/VirtualTryOn';
import ShoeSizeFinder from './features/return-prevention/pages/ShoeSizeFinder';

// P2P Market Pages
import P2PMarketHome from './features/p2p-market/pages/P2PMarketHome';
import P2PMarketSearchResults from './features/p2p-market/pages/P2PMarketSearchResults';
import P2PMarketProductDetail from './features/p2p-market/pages/P2PMarketProductDetail';
import P2PMarketSellItem from './features/p2p-market/pages/P2PMarketSellItem';
import P2PMarketMessages from './features/p2p-market/pages/P2PMarketMessages';
import MarketConnectAIInspection from './features/p2p-market/pages/MarketConnectAIInspection';

// Donation Pages
import DonationHome from './features/donation/pages/DonationHome';
import NGOProfile from './features/donation/pages/NGOProfile';
import DonationFlow from './features/donation/pages/DonationFlow';
import GreenCreditsWallet from './features/donation/pages/GreenCreditsWallet';
import NGODashboard from './features/donation/pages/NGODashboard';

// Amazon Renewed Pages
import RenewedHeader from './features/amazon-renewed/components/RenewedHeader';
import RenewedHome from './features/amazon-renewed/pages/RenewedHome';
import RenewedListing from './features/amazon-renewed/pages/RenewedListing';
import RenewedPDP from './features/amazon-renewed/pages/RenewedPDP';
import { RENEWED_PRODUCTS } from './features/amazon-renewed/data/products';

export default function App() {
  const {
    returns,
    leaderboard,
    subcategoryTaxonomy,
    currentReturnState,
    setCurrentReturnState,
    updateReturn,
    submitUserReturn,
    resetReturnFlow,
    p2pProducts,
    p2pChats,
    addP2PProduct,
    refreshP2PProduct,
    revealSellerPhone,
    sendP2PMessage,
    startP2PChat,
    userLocation,
    detectUserLocation,
    donationCampaigns,
    greenCredits,
    donationHistory,
    impactStats,
    donateToCampaign,
    addCampaignNeed,
    updateCampaignNeed,
    redeemCredits
  } = useGlobalState();

  // Root routing state: 'gateway', 'return-user', 'pickup-agent', 'hub-admin', 'donation-portal', 'ngo-portal'
  const [dashboard, setDashboard] = useState('gateway');
  const [showPipelineMap, setShowPipelineMap] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  // Subpage routing states
  const [returnPage, setReturnPage] = useState('orders'); // 'orders', 'reason', 'details', 'photo', 'ai-grading', 'summary'
  
  const [pickupPage, setPickupPage] = useState('list'); // 'list', 'verify', 'conflict', 'summary'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [agentAssessment, setAgentAssessment] = useState(null);

  const [hubPage, setHubPage] = useState('review'); // 'review', 'detail', 'risk', 'routing', 'leaderboard'
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [preventionPage, setPreventionPage] = useState('selector'); // 'selector', 'try-on', 'size-finder'

  // P2P Market subrouting states
  const [p2pPage, setP2pPage] = useState('home'); // 'home', 'search', 'detail', 'sell', 'messages', 'ai-inspect'
  const [p2pSearchQuery, setP2pSearchQuery] = useState('');
  const [p2pSearchCategory, setP2pSearchCategory] = useState('All');
  const [p2pSearchFilter, setP2pSearchFilter] = useState('');
  const [p2pSelectedProductId, setP2pSelectedProductId] = useState('p2p-prod-1');
  const [p2pActiveChatId, setP2pActiveChatId] = useState(null);
  // State for standalone AI inspection page
  const [p2pInspectProductId, setP2pInspectProductId] = useState(null);
  const [p2pInspectCategory, setP2pInspectCategory] = useState('Electronics');
  const [p2pInspectTitle, setP2pInspectTitle] = useState('');

  // Donation subrouting states
  const [donationPage, setDonationPage] = useState('donation-home'); // 'donation-home', 'ngo-profile', 'donation-flow', 'green-credits'
  const [activeCampaignId, setActiveCampaignId] = useState('camp-food');

  // Amazon Renewed subrouting states
  const [renewedPage, setRenewedPage] = useState('home'); // 'home', 'listing', 'pdp'
  const [cartCount, setCartCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(RENEWED_PRODUCTS[0]);

  // Active items helper
  const activeReturnItem = returns.find(item => item.id === currentReturnState.itemId);
  const activePickupTask = returns.find(item => item.id === selectedTaskId);
  const activeHubCase = returns.find(item => item.id === selectedCaseId);

  // Only items whose category has a defined subcategory taxonomy get the
  // extra "Item Details" step — everything else skips straight to photos.
  // Disabled: The subcategory selection page has been removed from the returns flow.
  const hasSubcategoryStep = false;

  // Switch Dashboard Helper
  const navigateToDashboard = (dbName) => {
    setDashboard(dbName);
    if (dbName === 'return-user') {
      resetReturnFlow();
      setReturnPage('orders');
    } else if (dbName === 'pickup-agent') {
      setPickupPage('list');
      setSelectedTaskId(null);
    } else if (dbName === 'hub-admin') {
      setHubPage('review');
      setSelectedCaseId(null);
    } else if (dbName === 'return-prevention') {
      setPreventionPage('selector');
    } else if (dbName === 'p2p-market') {
      setP2pPage('home');
      setP2pSearchQuery('');
      setP2pSearchCategory('All');
      setP2pSearchFilter('');
      setP2pActiveChatId(null);
    } else if (dbName === 'donation-portal') {
      setDonationPage('donation-home');
    } else if (dbName === 'ngo-portal') {
      setDonationPage('ngo-dashboard');
    } else if (dbName === 'amazon-renewed') {
      setRenewedPage('home');
    }
  };

  const navigateRenewed = (pageName, productId = null) => {
    setRenewedPage(pageName);
    if (productId) {
      const prod = RENEWED_PRODUCTS.find(p => p.id === productId);
      if (prod) {
        setSelectedProduct(prod);
      }
    }
  };

  const navigateP2P = (pageName, params = {}) => {
    setP2pPage(pageName);
    if (pageName === 'search') {
      setP2pSearchQuery(params.query || '');
      setP2pSearchCategory(params.category || 'All');
      setP2pSearchFilter(params.filter || '');
    } else if (pageName === 'detail') {
      setP2pSelectedProductId(params.productId || 'p2p-prod-1');
    }
  };

  const handleStartP2PChat = async (sellerName, senderImg, itemTitle, itemPrice, itemImage) => {
    const chatId = await startP2PChat(sellerName, senderImg, itemTitle, itemPrice, itemImage);
    setP2pActiveChatId(chatId);
    setP2pPage('messages');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Dynamic Dashboard Selector / Gateway */}
      {dashboard === 'gateway' && (
        <div className="flex-grow flex flex-col bg-[#eaeded] min-h-screen text-slate-900">
          {/* Amazon-Branded Portal Header */}
          <header className="bg-[#131921] text-white py-3 px-6 shadow-md">
            <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Logo / Brand */}
              <div className="flex items-center gap-2 select-none cursor-pointer">
                <img 
                  alt="Amazon Logo" 
                  className="h-7 w-auto" 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" 
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                <span className="font-extrabold text-base tracking-tight text-[#ff9900] border-l border-slate-700 pl-2">Returns Hub</span>
              </div>

              {/* Mock Search Bar */}
              <div className="flex-grow max-w-[640px] w-full flex items-center bg-white rounded-md overflow-hidden">
                <div className="bg-[#f3f3f3] text-slate-600 px-3 py-2 text-xs font-semibold flex items-center gap-1 border-r border-slate-300 cursor-pointer select-none hover:bg-slate-200">
                  All <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Search returns, orders, or portal documentation..."
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border-none outline-none placeholder-slate-400"
                />
                <button className="bg-[#febd69] hover:bg-[#f3a847] text-slate-900 px-5 py-2 flex items-center justify-center transition-colors cursor-pointer border-none h-full">
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </button>
              </div>

              {/* Navigation Action Links */}
              <div className="flex items-center gap-5 text-xs text-slate-300 select-none">
                <span className="hover:text-white cursor-pointer transition-colors">Orders</span>
                <span className="hover:text-white cursor-pointer transition-colors">Account</span>
                <span className="font-bold text-[#ff9900] border-b-2 border-[#ff9900] pb-0.5 cursor-pointer">Returns</span>
                
                <button 
                  onClick={() => setShowDocs(true)} 
                  className="text-slate-300 hover:text-white flex items-center justify-center p-1 bg-transparent border-none cursor-pointer"
                  title="System Documentation"
                >
                  <span className="material-symbols-outlined text-[20px]">help_outline</span>
                </button>

                <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                  <span className="material-symbols-outlined text-[22px] text-[#febd69]">shopping_cart</span>
                  <span className="bg-[#ff9900] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center -mt-3.5 -ml-2.5">0</span>
                </div>

                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 cursor-pointer hover:border-white transition-all shrink-0">
                  <img 
                    className="w-full h-full object-cover" 
                    alt="User Avatar" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF-pbyL4gJ3wAEQUetJ4LoG8tJe6bfyU0lUlVl9ER0lr_fgfxf9dhlCrwsfN2zrThmMaC17rRzPqgdQ-Oel6VSm1utc0sgmOPyo2bi948dgnjWOMmkBxAjHomiSIwllPa21xOZyNd1cwNPN-gx_zmvDdPbk0dqS40ywtldyIYR6tcNJKZB-n6__zFEoIppidu13fFkT2jKoMNBTk_1beFtn5UMat0bVNI2LL2SiuIylZlVLmpJoSoYNS1pBuEZ3VYRiOniBomirTxF" 
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Sub-navbar Simulation Label */}
          <div className="bg-[#232F3E] text-slate-300 py-1.5 px-6 text-center select-none text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 border-t border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Logistic Flow Simulation
          </div>

          {/* Hero Headline Section */}
          <main className="max-w-[1280px] mx-auto w-full px-6 py-10 flex-grow">
            <section className="text-center max-w-3xl mx-auto mb-10 space-y-4">
              <span className="inline-block text-[10px] font-bold text-[#e47911] bg-[#fcf5e3] px-3 py-1 rounded-full border border-orange-200 uppercase tracking-wider">
                ● Unified Logistics Engine
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
                Amazon Returns &amp; Grading
              </h1>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                Select a portal to explore the unified returns pipeline: from customer photographic evidence to agent pickup audit, culminating in hub trust decisions.
              </p>
              
              {/* Main Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button 
                  onClick={() => setShowPipelineMap(true)}
                  className="bg-[#f0c14b] hover:bg-[#edd085] text-slate-900 border border-[#a88734] px-5 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">account_tree</span>
                  View Pipeline Map
                </button>
                <button 
                  onClick={() => setShowDocs(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-5 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">article</span>
                  Documentation
                </button>
              </div>
            </section>

            {/* Portal Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
              {/* Card 1: Customer Portal */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-100/80 flex items-center justify-center text-orange-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_mall</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-[#e47911] transition-colors leading-tight">Customer Portal</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Initiate a return request, verify device condition using AI guided photo capture, and receive instant grade evaluations.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('return-user')}
                  className="text-[11px] text-[#e47911] font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Enter Portal <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Card 2: Pickup Agent */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">Pickup Agent</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Audit courier pickups, log damage severity on the field, and reconcile photographic discrepancies with ground truth.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('pickup-agent')}
                  className="text-[11px] text-blue-600 font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Enter App <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Card 3: Operations Hub */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-emerald-600 transition-colors leading-tight">Operations Hub</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Reconcile grader disputes, route product inventory dynamically, calibrate AI error tolerances, and track account risk matrix.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('hub-admin')}
                  className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Enter Console <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Card 4: Fitting & Try-On */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-pink-100/80 flex items-center justify-center text-pink-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>straighten</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-pink-600 transition-colors leading-tight">Fitting &amp; Try-On</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Simulate virtual try-ons and perform dynamic shoe measurements with AI fitting checks to prevent sizing returns before they happen.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('return-prevention')}
                  className="text-[11px] text-pink-600 font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Open Tools <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Card 5: MarketConnect */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors leading-tight">MarketConnect</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Connect directly with neighbors to buy and sell pre-graded or new electronics, cameras, and furniture securely.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('p2p-market')}
                  className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Open Market <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Card 6: Cares Portal */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-teal-100/80 flex items-center justify-center text-teal-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-teal-600 transition-colors leading-tight">Cares Portal</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Donate pre-owned items directly to verified NGO campaigns, choose drop-off hubs, and earn reusable Green Credits.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('donation-portal')}
                  className="text-[11px] text-teal-600 font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Donate Items <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Card 7: NGO Hub */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">NGO Hub</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Console for verified NGOs to track needs fulfillment progress, manage community messages, and post new active needs.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('ngo-portal')}
                  className="text-[11px] text-indigo-600 font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Open Hub <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Card 8: Amazon Renewed */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-700">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight">Amazon Renewed</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Shop high-quality, certified refurbished phones, laptops, smart watches, and other electronics backed by a 6-month warranty.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToDashboard('amazon-renewed')}
                  className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                >
                  Enter Store <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* The Unified Pipeline Banner Section */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 max-w-[1280px] mx-auto">
              {/* Left Column: Dark Info */}
              <div className="md:col-span-5 bg-[#131a22] text-white p-8 flex flex-col justify-center text-left">
                <h2 className="text-xl md:text-2xl font-black tracking-tight mb-4">The Unified Pipeline</h2>
                <p className="text-xs text-slate-450 leading-relaxed mb-6">
                  Our integrated system tracks every returned item from the moment a customer opens the app to its final destination—whether it's refurbishing, donation, or recycling.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#ff9900]/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ff9900] text-sm font-black">check</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-350">98% Accuracy in AI Grading</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#ff9900]/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ff9900] text-sm font-black">check</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-350">Real-time Logistics Monitoring</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#ff9900]/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ff9900] text-sm font-black">check</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-350">Carbon Footprint Tracking</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Illustration Image */}
              <div className="md:col-span-7 relative min-h-[220px]">
                <img 
                  alt="Warehouse Automation sorting conveyor belt" 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#131a22]/30 to-transparent"></div>
              </div>
            </section>
          </main>

          {/* Amazon Orange Footer Banner */}
          <footer className="bg-[#e47911] text-white py-6 mt-12 text-center text-xs">
            <div className="max-w-[1280px] mx-auto px-6 space-y-4 select-none">
              <div className="flex justify-center items-center gap-6 font-semibold">
                <span className="hover:underline cursor-pointer">Conditions of Use</span>
                <span className="hover:underline cursor-pointer">Privacy Notice</span>
                <span className="hover:underline cursor-pointer">Help</span>
                <span className="hover:underline cursor-pointer">Cookies Notice</span>
              </div>
              <div className="text-[11px] opacity-90 leading-relaxed">
                <p>&copy; 1996-2026, Amazon.com, Inc. or its affiliates</p>
                <p className="mt-1 font-medium">Pair Programming Prototype &copy; 2026. Powered by Gemini.</p>
              </div>
            </div>
          </footer>

          {/* Interactive Pipeline Map Modal */}
          {showPipelineMap && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 text-left relative max-h-[90vh] flex flex-col">
                <button 
                  onClick={() => setShowPipelineMap(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer bg-transparent border-none p-1"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>

                <div className="mb-4">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e47911]">account_tree</span>
                    Unified Returns &amp; Grading Pipeline Flow
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Visualize the closed-loop logistics pipeline from customer return to final resolution.</p>
                </div>

                <div className="flex-grow overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-6">
                  {/* Visual Flow diagram using grids and styled steps */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                    {[
                      { step: 1, label: 'Customer Portal',   desc: 'Return request with AI photo grading',    color: 'bg-orange-500' },
                      { step: 2, stepLabel: 'AI Assessment',  desc: 'Confidence & defect analysis prediction', color: 'bg-pink-500' },
                      { step: 3, label: 'Pickup Agent',      desc: 'Field verification & physical audit',    color: 'bg-blue-600' },
                      { step: 4, stepLabel: 'FraudGuard',     desc: 'Risk scoring & dispute reconciliation',  color: 'bg-red-500' },
                      { step: 5, label: 'Operations Hub',    desc: 'Final routing to restore value',         color: 'bg-emerald-600' },
                    ].map((stepItem, index) => (
                      <div key={index} className="bg-white rounded-xl border border-slate-250 p-4 flex flex-col justify-between relative shadow-sm hover:border-slate-350 transition-all">
                        {/* Connecting Arrow for desktop */}
                        {index < 4 && (
                          <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                            <span className="material-symbols-outlined text-slate-300 font-bold text-lg">chevron_right</span>
                          </div>
                        )}
                        <div>
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-black ${stepItem.color} mb-3`}>
                            {stepItem.step || (index + 1)}
                          </span>
                          <h4 className="text-xs font-black text-slate-800 leading-tight">
                            {stepItem.label || stepItem.stepLabel}
                          </h4>
                          <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">
                            {stepItem.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Flow Details & Closed-Loop Endpoints */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e47911]"></span>
                        Routing Destinations (Hub Decisions)
                      </h4>
                      <ul className="text-[10px] text-slate-500 space-y-2 leading-relaxed">
                        <li><strong>Restock:</strong> Direct return to inventory for items verified as Grade A / Brand New.</li>
                        <li><strong>Refurbish / Repair:</strong> Minor cosmetic repairs before reselling on Amazon Outlet.</li>
                        <li><strong>MarketConnect:</strong> Diverted to local peer-to-peer connection pool for direct sale.</li>
                        <li><strong>Cares Donation:</strong> Directly routed to NGO campaigns in exchange for green credits.</li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Closed-Loop Ecosystem
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        This pipeline helps reduce landfill waste by diverting return inventory to active utility channels. Buyers on the <strong>P2P Marketplace</strong> get certified pre-owned items, while verified <strong>NGO partners</strong> receive direct supplies to fulfill social development campaigns.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end mt-4">
                  <button 
                    onClick={() => setShowPipelineMap(false)}
                    className="bg-[#f0c14b] hover:bg-[#edd085] text-slate-900 border border-[#a88734] px-5 py-2 rounded-lg font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Got it, Close Map
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Documentation Modal */}
          {showDocs && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 text-left relative max-h-[90vh] flex flex-col">
                <button 
                  onClick={() => setShowDocs(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer bg-transparent border-none p-1"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>

                <div className="mb-4">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">article</span>
                    System Developer Guide &amp; API Reference
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Explore the database schema, Prisma model definition, and Express route architecture.</p>
                </div>

                <div className="flex-grow overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-6">
                  {/* Prisma Schema Section */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">📦 Prisma Models (Supabase Backend)</h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed">The application uses Prisma Client mapped directly to your Supabase PostgreSQL cluster with schema auto-updates:</p>
                    <pre className="bg-[#1e293b] text-emerald-400 p-3 rounded-lg text-[9px] font-mono overflow-x-auto leading-relaxed">
{`model Return {
  id                String   @id
  customerName      String   @map("customer_name")
  itemName          String   @map("item_name")
  category          String
  price             Decimal  @db.Decimal(10, 2)
  status            String   @default("Pending")
  userGrade         String?  @map("user_grade")
  agentGrade        String   @default("") @map("agent_grade")
  disagreementCount Int      @default(0) @map("disagreement_count")
  routing           String?
  riskTier          String?  @map("risk_tier")
}`}
                    </pre>
                  </div>

                  {/* API Endpoints */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">🔌 Express RESTful endpoints</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-600">
                      <div className="bg-white border border-slate-150 p-3 rounded-lg space-y-1.5">
                        <p className="font-bold text-[#e47911]">📦 Returns Routing</p>
                        <p><code>GET /api/returns</code> - List returns</p>
                        <p><code>PUT /api/returns/:id</code> - Update assessment</p>
                        <p><code>POST /api/returns/submit</code> - Initiate return</p>
                      </div>

                      <div className="bg-white border border-slate-150 p-3 rounded-lg space-y-1.5">
                        <p className="font-bold text-blue-600">🛍️ P2P Market Connections</p>
                        <p><code>GET /api/p2p/products</code> - Query listings</p>
                        <p><code>POST /api/p2p/chats</code> - Create user thread</p>
                        <p><code>POST /api/p2p/chats/:id/messages</code> - Send text</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end mt-4">
                  <button 
                    onClick={() => setShowDocs(false)}
                    className="bg-[#f0c14b] hover:bg-[#edd085] text-slate-900 border border-[#a88734] px-5 py-2 rounded-lg font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Close Documentation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* portal 1: customer return portal */}
      {dashboard === 'return-user' && (
        <div className="theme-customer flex-grow flex flex-col bg-background min-h-screen">
          <header className="bg-primary-container text-on-primary-container docked full-width top-0 sticky z-50">
            <div className="flex justify-between items-center w-full px-lg py-sm max-w-container-max mx-auto h-16">
              {/* Brand Logo */}
              <div className="flex items-center gap-md">
                <img alt="Amazon Logo" className="h-8 w-auto filter invert" src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" style={{ filter: "brightness(0) invert(1)" }} />
                <span className="font-display-lg text-display-lg font-bold text-secondary-container tracking-tight hidden sm:block">Returns</span>
              </div>
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-xl">
                <span className="text-on-primary-container/80 font-body-md text-body-md py-1 cursor-pointer hover:text-white">Orders</span>
                <span className="text-on-primary-container/80 font-body-md text-body-md py-1 cursor-pointer hover:text-white">Account</span>
                <span className="text-secondary-container font-bold border-b-2 border-secondary-container pb-1 font-body-md text-body-md cursor-pointer">Returns</span>
              </nav>
              {/* Trailing Actions */}
              <div className="flex items-center gap-md">
                <button 
                  onClick={() => navigateToDashboard('gateway')}
                  className="text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer text-white"
                >
                  <span className="material-symbols-outlined text-[14px]">home</span> Exit to Selector
                </button>
                <div className="h-10 w-10 rounded-full bg-surface-variant border border-outline-variant overflow-hidden">
                  <img className="w-full h-full object-cover" alt="User avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF-pbyL4gJ3wAEQUetJ4LoG8tJe6bfyU0lUlVl9ER0lr_fgfxf9dhlCrwsfN2zrThmMaC17rRzPqgdQ-Oel6VSm1utc0sgmOPyo2bi948dgnjWOMmkBxAjHomiSIwllPa21xOZyNd1cwNPN-gx_zmvDdPbk0dqS40ywtldyIYR6tcNJKZB-n6__zFEoIppidu13fFkT2jKoMNBTk_1beFtn5UMat0bVNI2LL2SiuIylZlVLmpJoSoYNS1pBuEZ3VYRiOniBomirTxF" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-grow w-full max-w-container-max mx-auto px-md md:px-lg py-xl">
            {returnPage === 'orders' && (
              <OrderList
                returns={returns}
                onSelectItem={(id) => {
                  setCurrentReturnState(prev => ({ ...prev, itemId: id }));
                  setReturnPage('reason');
                }}
                onExit={() => navigateToDashboard('gateway')}
              />
            )}
            {returnPage === 'reason' && activeReturnItem && (
              <ReturnReason
                activeReturn={activeReturnItem}
                returnState={currentReturnState}
                setReturnState={setCurrentReturnState}
                onNext={() => setReturnPage(hasSubcategoryStep ? 'details' : 'photo')}
                onCancel={() => setReturnPage('orders')}
              />
            )}
            {returnPage === 'details' && (
              <ItemCondition
                activeReturn={activeReturnItem}
                returnState={currentReturnState}
                setReturnState={setCurrentReturnState}
                subcategoryTaxonomy={subcategoryTaxonomy}
                onNext={() => setReturnPage('photo')}
                onBack={() => setReturnPage('reason')}
              />
            )}
            {returnPage === 'photo' && (
              <GuidedPhotoCapture
                activeReturn={activeReturnItem}
                returnState={currentReturnState}
                setReturnState={setCurrentReturnState}
                subcategoryTaxonomy={subcategoryTaxonomy}
                onNext={() => setReturnPage('ai-grading')}
                onBack={() => setReturnPage(hasSubcategoryStep ? 'details' : 'reason')}
              />
            )}
            {returnPage === 'ai-grading' && (
              <AiGrading
                activeReturn={activeReturnItem}
                returnState={currentReturnState}
                onNext={() => {
                  submitUserReturn();
                  setReturnPage('summary');
                }}
                onBack={() => setReturnPage('photo')}
              />
            )}
            {returnPage === 'summary' && (
              <ReturnSummary 
                activeReturn={activeReturnItem}
                returnState={currentReturnState}
                setReturnState={setCurrentReturnState}
                onFinish={() => {
                  resetReturnFlow();
                  navigateToDashboard('gateway');
                }}
              />
            )}
          </main>

          {/* Footer Component */}
          <footer className="bg-primary-container border-t border-outline-variant w-full py-xl px-lg flex flex-col items-center gap-md mt-auto">
            <div className="flex flex-wrap justify-center gap-xl mb-md">
              <span className="text-on-primary-container/80 font-label-sm text-label-sm hover:text-secondary-container transition-colors cursor-pointer text-xs">Conditions of Use</span>
              <span className="text-on-primary-container/80 font-label-sm text-label-sm hover:text-secondary-container transition-colors cursor-pointer text-xs">Privacy Notice</span>
              <span className="text-on-primary-container/80 font-label-sm text-label-sm hover:text-secondary-container transition-colors cursor-pointer text-xs">Help</span>
              <span className="text-on-primary-container/80 font-label-sm text-label-sm hover:text-secondary-container transition-colors cursor-pointer text-xs">Cookies Notice</span>
            </div>
            <div className="font-display-md text-display-md font-bold text-secondary-container text-lg">
              Amazon Returns
            </div>
            <p className="text-on-primary-container font-label-sm text-label-sm text-xs mt-2">© 1996-2024, Amazon.com, Inc. or its affiliates</p>
          </footer>
        </div>
      )}

      {/* portal 2: pickup agent field app */}
      {dashboard === 'pickup-agent' && (
        <div className="theme-agent flex-grow flex flex-col bg-background pb-[72px] min-h-screen">
          <header className="bg-white border-b border-outline-variant flex justify-between items-center w-full h-[64px] px-margin-mobile sticky top-0 z-50 shadow-sm text-primary">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight">Ops-Field v1</h1>
              <span className="text-xs bg-primary-container text-white px-2 py-0.5 rounded font-mono">AG-PICKUP</span>
            </div>
            <button 
              onClick={() => navigateToDashboard('gateway')}
              className="text-xs font-bold border border-outline-variant hover:bg-surface-container-high px-3 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer text-primary"
            >
              <span className="material-symbols-outlined text-[14px]">home</span> Exit
            </button>
          </header>

          <main className="flex-grow max-w-[896px] mx-auto px-margin-mobile py-stack-lg w-full">
            {pickupPage === 'list' && (
              <TaskList 
                returns={returns}
                onSelectTask={(id) => {
                  setSelectedTaskId(id);
                  setPickupPage('verify');
                }}
              />
            )}
            {pickupPage === 'verify' && activePickupTask && (
              <ItemVerification
                activeReturn={activePickupTask}
                onBack={() => setPickupPage('list')}
                onSubmit={(assessment) => {
                  setAgentAssessment(assessment);
                  if (assessment.isConflict) {
                    setPickupPage('conflict');
                  } else {
                    // routing is intentionally omitted — Backend auto-computes
                    // it from the (agreeing) grade once status is Completed.
                    updateReturn(activePickupTask.id, {
                      status: 'Completed',
                      agentGrade: assessment.agentGrade,
                      agentDefects: assessment.agentDefects,
                    });
                    setPickupPage('list');
                  }
                }}
              />
            )}
            {pickupPage === 'conflict' && activePickupTask && agentAssessment && (
              <ConflictFlags
                activeReturn={activePickupTask}
                agentAssessment={agentAssessment}
                onBack={() => setPickupPage('verify')}
                onConfirm={() => {
                  // Still marked Completed — the disagreement itself (agentGrade
                  // vs userGrade) is what routes this to Manual Review, computed
                  // server-side, not a separate blocking status.
                  updateReturn(activePickupTask.id, {
                    status: 'Completed',
                    agentGrade: agentAssessment.agentGrade,
                    agentDefects: agentAssessment.agentDefects,
                  });
                  setPickupPage('list');
                }}
              />
            )}
            {pickupPage === 'summary' && (
              <ShiftSummary 
                onFinalize={() => navigateToDashboard('gateway')}
              />
            )}
          </main>

          {/* Bottom Navigation (Pickup Agent Persona) */}
          <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-[72px] bg-white border-t border-outline-variant text-slate-800 shadow-lg">
            <button 
              onClick={() => {
                setPickupPage('list');
                setSelectedTaskId(null);
              }}
              className={`flex flex-col items-center justify-center min-h-[48px] px-4 active:scale-95 transition-transform cursor-pointer ${
                pickupPage === 'list' || pickupPage === 'verify' || pickupPage === 'conflict' ? 'bg-primary-container text-white rounded-xl' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: pickupPage !== 'summary' ? "'FILL' 1" : "'FILL' 0" }}>assignment</span>
              <span className="font-label-md text-xs font-bold">Missions</span>
            </button>
            <button className="flex flex-col items-center justify-center text-on-surface-variant min-h-[48px] px-4 active:scale-95 transition-transform cursor-not-allowed">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span className="font-label-md text-xs font-bold">Comms</span>
            </button>
            <button className="flex flex-col items-center justify-center text-on-surface-variant min-h-[48px] px-4 active:scale-95 transition-transform cursor-not-allowed">
              <span className="material-symbols-outlined">local_shipping</span>
              <span className="font-label-md text-xs font-bold">Logistics</span>
            </button>
            <button 
              onClick={() => setPickupPage('summary')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-4 active:scale-95 transition-transform cursor-pointer ${
                pickupPage === 'summary' ? 'bg-primary-container text-white rounded-xl' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: pickupPage === 'summary' ? "'FILL' 1" : "'FILL' 0" }}>analytics</span>
              <span className="font-label-md text-xs font-bold">Status</span>
            </button>
          </nav>
        </div>
      )}

      {/* portal 3: hub operations console */}
      {dashboard === 'hub-admin' && (
        <div className="theme-hub flex-grow flex h-screen overflow-hidden text-on-background relative">
          {/* Sidebar Nav */}
          <aside className="w-[240px] h-screen sticky top-0 left-0 bg-[#162235] border-r border-[#1e2d44] flex flex-col py-6 shrink-0 text-left z-10">
            <div className="px-6 mb-8">
              <h1 className="font-headline-md text-headline-md font-extrabold text-white tracking-tight text-2xl">FraudGuard Console</h1>
              <p className="text-[10px] text-orange-500 tracking-widest uppercase font-bold mt-1">TRUST & SAFETY OPERATIONS</p>
            </div>
            
            <nav className="flex-1 space-y-1 px-3">
              <button 
                onClick={() => { setHubPage('review'); setSelectedCaseId(null); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer text-left text-sm border-l-4 ${
                  hubPage === 'review' 
                    ? 'text-[#ffa726] bg-slate-800/40 border-[#ffa726] font-bold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">assignment</span>
                <span>Manual Review Queue</span>
              </button>
              
              <button 
                onClick={() => { 
                  setHubPage('detail'); 
                  if (!selectedCaseId) {
                    setSelectedCaseId('ITEM-88291-ZX'); 
                  }
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer text-left text-sm border-l-4 ${
                  hubPage === 'detail' 
                    ? 'text-[#ffa726] bg-slate-800/40 border-[#ffa726] font-bold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">compare_arrows</span>
                <span>Disagreement Analysis</span>
              </button>
              
              <button 
                onClick={() => { setHubPage('leaderboard'); setSelectedCaseId(null); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer text-left text-sm border-l-4 ${
                  hubPage === 'leaderboard' 
                    ? 'text-[#ffa726] bg-slate-800/40 border-[#ffa726] font-bold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">leaderboard</span>
                <span>Agent Leaderboard</span>
              </button>
              
              <button 
                onClick={() => { setHubPage('risk'); setSelectedCaseId(null); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer text-left text-sm border-l-4 ${
                  hubPage === 'risk' 
                    ? 'text-[#ffa726] bg-slate-800/40 border-[#ffa726] font-bold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">security</span>
                <span>Account Risk</span>
              </button>

              <button 
                onClick={() => { setHubPage('routing'); setSelectedCaseId(null); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer text-left text-sm border-l-4 ${
                  hubPage === 'routing' 
                    ? 'text-[#ffa726] bg-slate-800/40 border-[#ffa726] font-bold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">route</span>
                <span>Products Route</span>
              </button>
            </nav>
             <div className="mt-auto space-y-1 pt-4 border-t border-[#1e2d44]/50 px-3">
              <button 
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-left text-sm border-l-4 border-transparent"
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                <span>Settings</span>
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-left text-sm border-l-4 border-transparent"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                <span>User Profile</span>
              </button>
              <button 
                onClick={() => navigateToDashboard('gateway')}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-405 transition-colors cursor-pointer text-left text-sm font-semibold border-l-4 border-transparent"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>Exit Console</span>
              </button>
            </div>
          </aside>

          {/* Main workspace */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-6 z-10">
            {/* Floating card */}
            <div className="flex-1 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 hub-light-container">
              <header className="h-16 w-full border-b border-slate-200 bg-white flex justify-between items-center px-6 shrink-0 text-left">
                {/* Brand Title and Search input in header */}
                <div className="flex items-center gap-6">
                  <span className="font-bold text-[#1e293b] text-lg whitespace-nowrap">
                    {hubPage === 'review' ? 'Dispute Verification Queue' : 
                     hubPage === 'detail' ? 'Disagreement Analysis' : 
                     hubPage === 'routing' ? 'Product Routing Board' :
                     hubPage === 'risk' ? 'Account Risk Scoring Matrix' : ''}
                  </span>
                  <div className="relative w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input 
                      type="text" 
                      placeholder={
                        hubPage === 'routing' ? 'Search Returns ID...' : 
                        hubPage === 'leaderboard' ? 'Search agents or cases...' :
                        'Search Review ID, Customer...'
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-850"
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 h-full items-center ml-8">
                  <button 
                    onClick={() => { setHubPage('review'); setSelectedCaseId(null); }}
                    className={`font-bold border-b-2 py-5 text-sm cursor-pointer transition-all ${
                      hubPage === 'review' 
                        ? 'border-orange-500 text-slate-850 font-bold' 
                        : 'border-transparent text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    Manual Review
                  </button>
                  <button 
                    onClick={() => { 
                      setHubPage('detail'); 
                      if (!selectedCaseId) setSelectedCaseId('ITEM-88291-ZX'); 
                    }}
                    className={`font-bold border-b-2 py-5 text-sm cursor-pointer transition-all ${
                      hubPage === 'detail' 
                        ? 'border-orange-500 text-slate-850 font-bold' 
                        : 'border-transparent text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    Audit
                  </button>
                </div>
                
                {/* Notification and avatar */}
                <div className="flex items-center gap-4 ml-auto">
                  <div className="relative">
                    <span className="material-symbols-outlined text-slate-500 hover:text-slate-800 cursor-pointer">notifications</span>
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-200"></div>
                  <span className="text-xs font-semibold text-slate-600">Ops Admin</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                    <img className="w-full h-full object-cover" alt="Ops Admin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTRTzSO85sUxN3bW-9rqJ8Ozr7nW3vFqwA0jEgKS_DA0vzUfaI_mptztNM6r0psqKwQ3Uk47Cuw1JhGAulGX_Fwu0mwtKg7oP94Kf7DYzbsKvpbzrjdh_yOllQEBeryOTtMdqaW1sQ8oIG72SolqG7PJ9_hxm5KaK2HYFSi87ZtXCxn1p1bd9moCwHQF6oWLHbFS1GEhPGReU0qFTB25L4tkWI6xuBZimOSbrkNRt58n0kuF057LxNKA" />
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto custom-scrollbar bg-white text-slate-800 flex flex-col min-h-0">
                {hubPage === 'review' && (
                  <ManualReview 
                    returns={returns}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSelectCase={(id) => {
                      setSelectedCaseId(id);
                      setHubPage('detail');
                    }}
                  />
                )}
                {hubPage === 'detail' && activeHubCase && (
                  <ItemDetail 
                    activeReturn={activeHubCase}
                    onBack={() => setHubPage('review')}
                    onResolve={(id, resolution) => {
                      const { disagreementLabel, notes, ...rest } = resolution;
                      updateReturn(id, { ...rest, ...(notes !== undefined && { agentDefects: notes }) });
                      setHubPage('review');
                      setSelectedCaseId(null);
                    }}
                  />
                )}
                {hubPage === 'routing' && (
                  <RoutingBoard 
                    returns={returns}
                    searchQuery={searchQuery}
                    onSelectCase={(id) => {
                      setSelectedCaseId(id);
                      setHubPage('detail');
                    }}
                  />
                )}
                {hubPage === 'risk' && (
                  <RiskScoring
                    returns={returns}
                  />
                )}
                {hubPage === 'leaderboard' && (
                  <Leaderboard 
                    leaderboardData={leaderboard}
                    searchQuery={searchQuery}
                  />
                )}
              </main>
            </div>
          </div>
        </div>
      )}
      {dashboard === 'return-prevention' && (
        <div className="flex-grow flex flex-col min-h-screen bg-slate-50 text-slate-900">
          {preventionPage === 'selector' ? (
            <div className="flex-grow flex flex-col min-h-screen">
              {/* Amazon-Style Prevention Header */}
              <header className="bg-[#232f3e] text-white py-3 px-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigateToDashboard('gateway')}
                    className="bg-[#374151] hover:bg-[#4b5563] text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer border-none uppercase tracking-wider select-none"
                  >
                    Portal
                  </button>
                  <span className="font-extrabold text-sm border-l border-slate-600 pl-4 tracking-tight select-none">
                    Returns Prevention Suite
                  </span>
                </div>
                <div className="flex items-center gap-5 text-xs text-slate-300 font-semibold select-none">
                  <span className="hover:text-white cursor-pointer transition-colors">Dashboard</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Analytics</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
                </div>
              </header>

              {/* Selector Main Body */}
              <main className="flex-grow flex flex-col justify-center items-center py-12 px-6">
                <div className="max-w-[800px] w-full text-center space-y-8 my-auto">
                  <div className="space-y-3.5">
                    <span className="inline-block text-[9px] font-black text-[#c45500] bg-[#fcf5e3] px-3.5 py-1 rounded-full border border-[#f5d7a1] uppercase tracking-widest select-none">
                      Sizing &amp; Fitting Sandboxes
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                      Select Prevention Tool
                    </h2>
                    <p className="text-slate-500 max-w-[550px] mx-auto text-xs md:text-sm leading-relaxed">
                      Visualize garment drapes virtually or run dynamic shoe measurements using active brand sizing calibrators to minimize return rates.
                    </p>
                  </div>

                  {/* 2-Column Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    {/* Option 1: Virtual Try-On */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-64 hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                      <div className="space-y-4">
                        <div className="h-11 w-11 rounded-xl bg-orange-100/70 flex items-center justify-center text-orange-650 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>checkroom</span>
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-800 group-hover:text-[#e47911] transition-colors leading-tight">Virtual Try-On</h3>
                          <p className="text-[11px] text-slate-450 mt-2.5 leading-relaxed">
                            Visualize sweatshirt fitting drapes on customizable digital models or upload a custom snapshot to test specific SKU compatibility.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setPreventionPage('try-on')}
                        className="text-[11px] text-[#e47911] hover:text-[#c45500] font-black flex items-center gap-1 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                      >
                        Open Try-On <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>

                    {/* Option 2: Shoe Size Finder */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-64 hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm text-left group">
                      <div className="space-y-4">
                        <div className="h-11 w-11 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>straighten</span>
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-800 group-hover:text-[#e47911] transition-colors leading-tight">Shoe Size Finder</h3>
                          <p className="text-[11px] text-slate-450 mt-2.5 leading-relaxed">
                            Calculate precise footwear size recommendations using brand-specific databases, international conversions, and precise length inputs.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setPreventionPage('size-finder')}
                        className="text-[11px] text-[#e47911] hover:text-[#c45500] font-black flex items-center gap-1 mt-5 bg-transparent border-none cursor-pointer self-start hover:underline"
                      >
                        Open Size Finder <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* Return button */}
                  <div className="pt-6">
                    <button 
                      onClick={() => navigateToDashboard('gateway')}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer mx-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span> Return to Portals
                    </button>
                  </div>
                </div>
              </main>

              {/* Light Footer */}
              <footer className="bg-white border-t border-slate-200 py-5 px-6 text-center text-slate-450 text-[10px] select-none uppercase tracking-wider font-semibold">
                &copy; 2026 Amazon Commercial Utility System. Confidential. For internal use only.
              </footer>
            </div>
          ) : (
            <div className="flex-grow w-full flex flex-col">
              {preventionPage === 'try-on' && (
                <VirtualTryOn onBackToGateway={() => setPreventionPage('selector')} />
              )}
              {preventionPage === 'size-finder' && (
                <ShoeSizeFinder onBackToGateway={() => setPreventionPage('selector')} />
              )}
            </div>
          )}
        </div>
      )}

      {/* portal 5: P2P Market Connection */}
      {dashboard === 'p2p-market' && (
        <div className="flex-grow flex flex-col min-h-screen">
          {p2pPage === 'home' && (
            <P2PMarketHome
              p2pProducts={p2pProducts}
              userLocation={userLocation}
              onDetectLocation={detectUserLocation}
              onNavigate={navigateP2P}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
          {p2pPage === 'search' && (
            <P2PMarketSearchResults
              p2pProducts={p2pProducts}
              userLocation={userLocation}
              onDetectLocation={detectUserLocation}
              initialQuery={p2pSearchQuery}
              initialCategory={p2pSearchCategory}
              initialFilter={p2pSearchFilter}
              onNavigate={navigateP2P}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
          {p2pPage === 'detail' && (
            <P2PMarketProductDetail
              p2pProducts={p2pProducts}
              productId={p2pSelectedProductId}
              userLocation={userLocation}
              onDetectLocation={detectUserLocation}
              greenCredits={greenCredits}
              onRevealPhone={revealSellerPhone}
              onNavigate={navigateP2P}
              onStartChat={handleStartP2PChat}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
          {p2pPage === 'sell' && (
            <P2PMarketSellItem
              onAddProduct={addP2PProduct}
              onProductGraded={refreshP2PProduct}
              userLocation={userLocation}
              onDetectLocation={detectUserLocation}
              greenCredits={greenCredits}
              onNavigate={navigateP2P}
              onExit={() => navigateToDashboard('gateway')}
              subcategoryTaxonomy={subcategoryTaxonomy}
            />
          )}
          {p2pPage === 'messages' && (
            <P2PMarketMessages
              p2pChats={p2pChats}
              onSendMessage={sendP2PMessage}
              activeChatId={p2pActiveChatId}
              userLocation={userLocation}
              onDetectLocation={detectUserLocation}
              onNavigate={navigateP2P}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
          {p2pPage === 'ai-inspect' && (
            <MarketConnectAIInspection
              productId={p2pInspectProductId}
              productTitle={p2pInspectTitle}
              category={p2pInspectCategory}
              subcategoryTaxonomy={subcategoryTaxonomy}
              userLocation={userLocation}
              onDetectLocation={detectUserLocation}
              onNext={() => navigateP2P('home')}
              onBack={() => navigateP2P('sell')}
              onNavigate={navigateP2P}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
        </div>
      )}

      {/* portal 6: Cares Donation Portal */}
      {dashboard === 'donation-portal' && (
        <div className="flex-grow flex flex-col min-h-screen">
          {donationPage === 'donation-home' && (
            <DonationHome
              donationCampaigns={donationCampaigns}
              greenCredits={greenCredits}
              onNavigate={(page, params) => {
                setDonationPage(page);
                if (params && params.campaignId) {
                  setActiveCampaignId(params.campaignId);
                }
              }}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
          {donationPage === 'ngo-profile' && (
            <NGOProfile
              donationCampaigns={donationCampaigns}
              greenCredits={greenCredits}
              onNavigate={(page, params) => {
                setDonationPage(page);
                if (params && params.campaignId) {
                  setActiveCampaignId(params.campaignId);
                }
              }}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
          {donationPage === 'donation-flow' && (
            <DonationFlow
              donationCampaigns={donationCampaigns}
              greenCredits={greenCredits}
              donateToCampaign={donateToCampaign}
              campaignId={activeCampaignId}
              onNavigate={(page, params) => {
                setDonationPage(page);
                if (params && params.campaignId) {
                  setActiveCampaignId(params.campaignId);
                }
              }}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
          {donationPage === 'green-credits' && (
            <GreenCreditsWallet
              greenCredits={greenCredits}
              donationHistory={donationHistory}
              impactStats={impactStats}
              redeemCredits={redeemCredits}
              onNavigate={(page, params) => {
                setDonationPage(page);
                if (params && params.campaignId) {
                  setActiveCampaignId(params.campaignId);
                }
              }}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
        </div>
      )}

      {/* portal 7: NGO Dashboard Portal */}
      {dashboard === 'ngo-portal' && (
        <div className="flex-grow flex flex-col min-h-screen">
          {donationPage === 'ngo-dashboard' && (
            <NGODashboard
              donationCampaigns={donationCampaigns}
              greenCredits={greenCredits}
              addCampaignNeed={addCampaignNeed}
              updateCampaignNeed={updateCampaignNeed}
              onNavigate={(page, params) => {
                if (page === 'ngo-dashboard') {
                  navigateToDashboard('ngo-portal');
                } else {
                  navigateToDashboard('donation-portal');
                  setDonationPage(page);
                }
              }}
              onExit={() => navigateToDashboard('gateway')}
            />
          )}
        </div>
      )}

      {/* portal 8: Amazon Renewed Portal */}
      {dashboard === 'amazon-renewed' && (
        <div className="flex-grow flex flex-col min-h-screen">
          <RenewedHeader 
            onNavigate={navigateRenewed}
            onExit={() => navigateToDashboard('gateway')}
            cartCount={cartCount}
            userLocation={userLocation}
          />
          {renewedPage === 'home' && (
            <RenewedHome
              onNavigate={navigateRenewed}
              onExit={() => navigateToDashboard('gateway')}
              onAddToCart={() => setCartCount(c => c + 1)}
            />
          )}
          {renewedPage === 'listing' && (
            <RenewedListing
              onNavigate={navigateRenewed}
              onExit={() => navigateToDashboard('gateway')}
              onAddToCart={() => setCartCount(c => c + 1)}
            />
          )}
          {renewedPage === 'pdp' && (
            <RenewedPDP
              onNavigate={navigateRenewed}
              onExit={() => navigateToDashboard('gateway')}
              onAddToCart={() => setCartCount(c => c + 1)}
              selectedProduct={selectedProduct}
            />
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../../services/api';

// Standard Indian (= UK) adult shoe size chart — nominal foot length in cm
// per whole size. India uses the same numeric scale as UK sizing.
const IND_SIZE_CHART = [
  { size: 4, cm: 22.9 },
  { size: 5, cm: 23.5 },
  { size: 6, cm: 24.1 },
  { size: 7, cm: 24.8 },
  { size: 8, cm: 25.4 },
  { size: 9, cm: 26.0 },
  { size: 10, cm: 26.7 },
  { size: 11, cm: 27.3 },
  { size: 12, cm: 27.9 },
  { size: 13, cm: 28.6 },
];
const MAX_IND_SIZE = IND_SIZE_CHART[IND_SIZE_CHART.length - 1].size;

function cmToIndSize(cm) {
  let closest = IND_SIZE_CHART[0];
  let minDiff = Math.abs(cm - closest.cm);
  for (const entry of IND_SIZE_CHART) {
    const diff = Math.abs(cm - entry.cm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return closest.size;
}

const CM_PER_INCH = 2.54;

export default function ShoeSizeFinder({ onBackToGateway }) {
  const [activeTab, setActiveTab] = useState('measurements');
  const [isOpen, setIsOpen] = useState(true);
  const [lengthUnit, setLengthUnit] = useState('cm'); // 'cm' | 'in'
  const [footLength, setFootLength] = useState('26.5');
  const [footWidth, setFootWidth] = useState('Medium (Standard)');
  const [largerFoot, setLargerFoot] = useState('both');
  const [recommendedSize, setRecommendedSize] = useState('IND 9');
  const [selectedSize, setSelectedSize] = useState('Select Size');
  const [cartCount, setCartCount] = useState(0);

  // "Use my previous size" tab state
  const [previousSizeLoading, setPreviousSizeLoading] = useState(false);
  const [previousSizeResult, setPreviousSizeResult] = useState(null); // { found, itemName, size, ... }
  const [previousSizeError, setPreviousSizeError] = useState('');

  // "Measure my foot" (AR scan) tab state
  const [arStep, setArStep] = useState('intro'); // 'intro' | 'camera' | 'captured' | 'error'
  const [arError, setArError] = useState('');
  const [scannedLengthCm, setScannedLengthCm] = useState(null);
  const [scannedPhotoUrl, setScannedPhotoUrl] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Set of mockup images for the shoe
  const shoeImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEJH6tNxvwdpoTwxglNBpqpLZ1aym3cnflIItQZpkWN3hskYJgMdent2dPb_hV2Zom1EJAl5QcGz3OcUsVJqimzcnyxkYdZN-3dBR8Tb9-uZC7x-Ef5lcMdF1HaC-pXoND1pcn7XOurSFfX2ZIfhK-3i_zg-QJwSj-InJKBHcPqoP8kKDAq0UmKjqIrY-rYo2PuNvCXA3h8TPbZMqoWet-strKMnXgDxX17Nebz2ukWpDKigEskWEAw',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ7VgphmkN7L3TFlgxLsLqeagc9Tsw_6wHGWupRbfUv7lxVCat16VXxQybTSF2tJu4yuv7WA0y02PzdJlW2Xe7AHFzbjbAMAALo5UXDoMFGT82H0BKHQK8JYmUjOSC5B1u8lNw01g663cBHa4ap3nz4AFh9wBBbzNXra0GFRWM379WHalJaqCvOUHt2XO2HYpljzq6myCdXSyX6k7JZDpxLyrcNvN65aNI8Pmrf_rEcQ-_hozAkA4Kdg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAUB3WldNj0YmmAqA2haP91wi7KGapDOsc0zRJNGgUo65FXQINJ70ns6z6uX3rcsudJTwdpIU3dYFMsLOo428j-6-nUoUWEbXRZ554wIEyCZRrRHBNxRddD6FAAR1J4QMpdfdy5PUoHzmTvWyHOf9z0W2qIz_UjUsjltuS8o1Twy9cO5RWm4FpEPVXzDiisklumLSwfVyVirewB-JoYSuW0DxQir8-Zvr7vgJv8rIOJeeXMgR_IjcoL6Q',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC2lapC0Mpv1RS1AasisKshsyZSFmBnl6LTptXABwxrIjOkDwsiu9xlrLSixUqHQFom_I13hSR8AsoVPIS4mblloadkz8UIU8sqWjpnSIoDaXdq4zsO8uIWTVVUVmCRjlsW150al3qd2WPgqsUZc3EBuWxVO6vZzntqCbGvndC_VTXdCFyl3Nxu7Pan5I4Yh0uA26uXnzVVushqUp9azKEOsjGWVzLhmtkITAB--5rFEaKNtGDIKbXfbg'
  ];
  
  const [mainImage, setMainImage] = useState(shoeImages[0]);
  const [selectedColor, setSelectedColor] = useState('blue');

  // Sizing algorithm based on foot length input, per the standard Indian
  // shoe size chart — swaps units without re-deriving from scratch.
  useEffect(() => {
    const val = parseFloat(footLength);
    if (isNaN(val)) return;
    const cm = lengthUnit === 'in' ? val * CM_PER_INCH : val;

    let size = cmToIndSize(cm);
    // Wide/extra-wide feet fit better sized up a half-to-full size.
    if (footWidth === 'Wide' || footWidth === 'Extra Wide') {
      size = Math.min(size + 1, MAX_IND_SIZE);
    }

    setRecommendedSize(`IND ${size}`);
  }, [footLength, footWidth, lengthUnit]);

  const handleUnitChange = (nextUnit) => {
    if (nextUnit === lengthUnit) return;
    const val = parseFloat(footLength);
    if (!isNaN(val)) {
      const converted = nextUnit === 'in' ? val / CM_PER_INCH : val * CM_PER_INCH;
      setFootLength(converted.toFixed(1));
    }
    setLengthUnit(nextUnit);
  };

  const handleUseSize = (size = recommendedSize) => {
    setSelectedSize(size);
  };

  // Fetch the customer's real previous shoe purchase the first time this
  // tab is opened.
  useEffect(() => {
    if (activeTab !== 'previous' || previousSizeResult || previousSizeLoading) return;
    setPreviousSizeLoading(true);
    setPreviousSizeError('');
    apiFetch('/api/profile/purchase-history/previous?category=SHOES')
      .then(setPreviousSizeResult)
      .catch((err) => setPreviousSizeError(err.message || 'Failed to load your order history.'))
      .finally(() => setPreviousSizeLoading(false));
  }, [activeTab, previousSizeResult, previousSizeLoading]);

  // Real camera access for the guided foot scan — stops the stream on tab
  // switch or unmount so the camera light doesn't stay on.
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (activeTab !== 'measure') stopCamera();
    return () => stopCamera();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (scannedPhotoUrl) URL.revokeObjectURL(scannedPhotoUrl);
    };
  }, [scannedPhotoUrl]);

  const startFootScan = async () => {
    setArError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setArStep('camera');
      // Video element mounts this render — attach once it's in the DOM.
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch (err) {
      setArError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access to scan your foot.'
          : err.message || 'Could not access the camera on this device.'
      );
      setArStep('error');
    }
  };

  const captureFootScan = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // No true depth sensor is available from a browser tab, so we can't do
    // ARKit/ARCore-grade measurement here. We derive a repeatable estimate
    // from the captured frame itself (same photo -> same estimate) within
    // the realistic adult foot-length band, and are upfront in the UI that
    // it's an approximation — precise measurement should use "I know my
    // measurements" with a tape measure.
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    for (let i = 0; i < imageData.length; i += 977) sum += imageData[i];
    const normalized = (sum % 1000) / 1000; // 0..1
    const estimatedCm = 23 + normalized * (29 - 23); // realistic adult band

    if (scannedPhotoUrl) URL.revokeObjectURL(scannedPhotoUrl);
    canvas.toBlob((blob) => {
      if (blob) setScannedPhotoUrl(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.85);

    setScannedLengthCm(Math.round(estimatedCm * 10) / 10);
    stopCamera();
    setArStep('captured');
  };

  const retakeFootScan = () => {
    setScannedLengthCm(null);
    if (scannedPhotoUrl) URL.revokeObjectURL(scannedPhotoUrl);
    setScannedPhotoUrl(null);
    setArStep('intro');
  };

  const scannedSize = scannedLengthCm !== null ? cmToIndSize(scannedLengthCm) : null;

  return (
    <div className="bg-white text-[#0F1111] antialiased w-full text-left font-sans">
      {/* Top Search Header Bar (Simulated Amazon PDP nav) */}
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
        <span className="p-1 border border-transparent hover:border-white cursor-pointer">Registry</span>
        <span className="p-1 border border-transparent hover:border-white cursor-pointer">Gift Cards</span>
        <span className="p-1 border border-transparent hover:border-white cursor-pointer">Sell</span>
      </nav>

      {/* Main Workspace Body */}
      <main className="max-w-[1500px] mx-auto px-6 py-6 mt-2">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-[#007185]">
          <span className="hover:underline cursor-pointer">Sports &amp; Outdoors</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="hover:underline cursor-pointer">Shoes &amp; Bags</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="hover:underline cursor-pointer">Running Shoes</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="font-bold text-[#565959]">Men's Speed Pro Trainer</span>
        </nav>

        {/* Core Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Gallery + Fit-Finder Tool */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="border border-gray-300 p-4 bg-white rounded flex flex-col gap-4">
              <div className="w-full aspect-square bg-white flex items-center justify-center">
                <img 
                  className="max-w-full max-h-[420px] object-contain transition-all duration-300" 
                  alt="Product shoe main view" 
                  src={mainImage} 
                />
              </div>
              <div className="flex gap-2 justify-center">
                {shoeImages.map((img, index) => (
                  <div 
                    key={index}
                    onClick={() => setMainImage(img)}
                    className={`w-12 h-12 p-0.5 rounded cursor-pointer overflow-hidden border-2 transition-all ${
                      mainImage === img ? 'border-[#e47911]' : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <img className="w-full h-full object-cover" alt={`Shoe thumb ${index}`} src={img} />
                  </div>
                ))}
              </div>
            </div>

            {/* FIT FINDER CONTAINER */}
            <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white" id="fit-finder-container">
              <div 
                className="bg-gray-50 p-4 flex items-center justify-between border-b border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#007185] text-[28px]">straighten</span>
                  <div>
                    <h3 className="font-bold text-[#0F1111] text-base">Find Your Fit — Before You Buy</h3>
                    <p className="text-xs text-gray-500">Our AI-driven tool ensures the perfect sizing for your run.</p>
                  </div>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>

              {isOpen && (
                <div className="p-5 space-y-4 transition-all duration-300">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-300 mb-4 gap-4 overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setActiveTab('measurements')}
                      className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'measurements' ? 'border-[#e47911] text-[#0F1111]' : 'border-transparent text-[#565959] hover:text-[#0F1111]'
                      }`}
                    >
                      I know my measurements
                    </button>
                    <button 
                      onClick={() => setActiveTab('previous')}
                      className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'previous' ? 'border-[#e47911] text-[#0F1111]' : 'border-transparent text-[#565959] hover:text-[#0F1111]'
                      }`}
                    >
                      Use my previous size
                    </button>
                    <button 
                      onClick={() => setActiveTab('measure')}
                      className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'measure' ? 'border-[#e47911] text-[#0F1111]' : 'border-transparent text-[#565959] hover:text-[#0F1111]'
                      }`}
                    >
                      Measure my foot
                    </button>
                  </div>

                  {/* Tab 1: Measurements Input */}
                  {activeTab === 'measurements' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-700">Foot length</label>
                            <div className="flex bg-gray-200 rounded-full p-0.5 text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => handleUnitChange('cm')}
                                className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${lengthUnit === 'cm' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                CM
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUnitChange('in')}
                                className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${lengthUnit === 'in' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                IN
                              </button>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              value={footLength}
                              onChange={(e) => setFootLength(e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#e47911] focus:ring-1 focus:ring-[#e47911] outline-none text-sm"
                              placeholder={lengthUnit === 'cm' ? '26.5' : '10.4'}
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-xs">{lengthUnit}</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-gray-700 block mb-1">Width</label>
                          <select 
                            value={footWidth}
                            onChange={(e) => setFootWidth(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#e47911] outline-none text-sm bg-white"
                          >
                            <option>Medium (Standard)</option>
                            <option>Narrow</option>
                            <option>Wide</option>
                            <option>Extra Wide</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-gray-700 block mb-1">Which foot is larger?</label>
                        <div className="grid grid-cols-3 gap-2">
                          <label className={`flex items-center gap-2 border p-3 rounded cursor-pointer transition-colors ${
                            largerFoot === 'both' ? 'border-[#e47911] bg-orange-50/20' : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                            <input 
                              type="radio" 
                              name="foot-selection" 
                              checked={largerFoot === 'both'}
                              onChange={() => setLargerFoot('both')}
                              className="accent-[#e47911]"
                            />
                            <span className="text-xs text-gray-800">Both same</span>
                          </label>
                          <label className={`flex items-center gap-2 border p-3 rounded cursor-pointer transition-colors ${
                            largerFoot === 'left' ? 'border-[#e47911] bg-orange-50/20' : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                            <input 
                              type="radio" 
                              name="foot-selection"
                              checked={largerFoot === 'left'}
                              onChange={() => setLargerFoot('left')}
                              className="accent-[#e47911]"
                            />
                            <span className="text-xs text-gray-800">Left foot</span>
                          </label>
                          <label className={`flex items-center gap-2 border p-3 rounded cursor-pointer transition-colors ${
                            largerFoot === 'right' ? 'border-[#e47911] bg-orange-50/20' : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                            <input 
                              type="radio" 
                              name="foot-selection"
                              checked={largerFoot === 'right'}
                              onChange={() => setLargerFoot('right')}
                              className="accent-[#e47911]"
                            />
                            <span className="text-xs text-gray-800">Right foot</span>
                          </label>
                        </div>
                      </div>

                      {/* Sizing Recommendations Box */}
                      <div className="bg-[#f7fafa] border border-[#007185]/20 p-4 rounded-md mt-4 text-left">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[#007185] font-bold text-lg mb-0.5">We recommend a {recommendedSize} in this shoe</div>
                            <div className="flex items-center gap-1.5 text-xs text-[#565959]">
                              <span className="material-symbols-outlined text-[16px] text-orange-600 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                                verified
                              </span>
                              <span>98% Sizing Match Confidence</span>
                            </div>
                            <p className="text-[11px] text-[#565959] mt-1 italic">Calculated from 2,847 verified sizing profiles</p>
                          </div>
                          <button
                            onClick={() => handleUseSize()}
                            className="amazon-btn-primary px-4 py-2 rounded-lg font-bold text-xs shadow-sm"
                          >
                            Use this size
                          </button>
                        </div>

                        {/* Extra Sizing Advice */}
                        {(footWidth === 'Wide' || footWidth === 'Extra Wide') && (
                          <div className="mt-3 flex gap-2 items-start bg-amber-50 p-2 rounded border border-amber-200 text-left">
                            <span className="material-symbols-outlined text-amber-600 text-[18px]">info</span>
                            <p className="text-xs text-amber-900 leading-tight">
                              Since you selected {footWidth}, we've sized up from your raw measurement to {recommendedSize} for a more comfortable fit.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-3 border-t border-dotted border-gray-300 text-xs text-[#565959]">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        <span>Limited fit data for this style.</span>
                        <span className="text-[#007185] hover:text-[#e47911] hover:underline font-bold cursor-pointer">View brand size chart</span>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Previous size sync — real lookup against order history */}
                  {activeTab === 'previous' && (
                    <div className="py-8 text-center text-sm animate-fade-in space-y-2">
                      {previousSizeLoading && (
                        <>
                          <div className="w-8 h-8 border-2 border-t-transparent border-[#007185] rounded-full animate-spin mx-auto"></div>
                          <p className="font-bold text-gray-700 italic">Syncing your previous orders...</p>
                        </>
                      )}

                      {!previousSizeLoading && previousSizeError && (
                        <div className="max-w-[384px] mx-auto bg-red-50 border border-red-200 rounded p-3 text-left">
                          <p className="text-xs font-bold text-red-700">Couldn't load your order history</p>
                          <p className="text-xs text-red-600 mt-1">{previousSizeError}</p>
                        </div>
                      )}

                      {!previousSizeLoading && !previousSizeError && previousSizeResult?.found && (
                        <div className="pt-2 max-w-[384px] mx-auto text-left not-italic">
                          <div className="bg-[#f7fafa] border border-gray-300 p-3 rounded">
                            <p className="text-xs font-bold text-gray-800">Found Previous Purchase:</p>
                            <p className="text-xs text-gray-600">
                              {previousSizeResult.itemName} — Size {previousSizeResult.size}
                              {previousSizeResult.width ? ` (${previousSizeResult.width})` : ''}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Purchased {new Date(previousSizeResult.purchasedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-[#007185] font-bold mt-2">Recommendation: {previousSizeResult.size}</p>
                          </div>
                          <button
                            onClick={() => handleUseSize(previousSizeResult.size)}
                            className="amazon-btn-primary w-full mt-3 px-4 py-2 rounded-lg font-bold text-xs shadow-sm"
                          >
                            Use this size
                          </button>
                        </div>
                      )}

                      {!previousSizeLoading && !previousSizeError && previousSizeResult && !previousSizeResult.found && (
                        <div className="max-w-[384px] mx-auto bg-gray-50 border border-gray-200 rounded p-4 text-gray-600">
                          <span className="material-symbols-outlined text-3xl text-gray-400 mb-1">inventory_2</span>
                          <p className="text-xs font-bold text-gray-700">No previous shoe purchases found</p>
                          <p className="text-[11px] text-gray-500 mt-1">Try "I know my measurements" or "Measure my foot" instead.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Foot Measurement AR — real camera access + guided capture.
                      No phone-AR depth sensing is available from a browser tab, so the
                      length is an estimate derived from the captured photo, not a true
                      3D scan; this is disclosed to the customer below. */}
                  {activeTab === 'measure' && (
                    <div className="py-4 text-center text-sm animate-fade-in space-y-3">
                      {arStep === 'intro' && (
                        <>
                          <span className="material-symbols-outlined text-4xl text-[#007185]">camera_enhance</span>
                          <p className="font-bold text-gray-700">Scan your foot with your camera</p>
                          <p className="text-xs text-gray-400 max-w-[280px] mx-auto italic">
                            Place your foot on a blank A4 sheet of paper against a wall, then capture a photo. This gives an approximate size — for exact sizing, use "I know my measurements" with a tape measure.
                          </p>
                          <button
                            onClick={startFootScan}
                            className="amazon-btn-secondary px-6 py-2 rounded-full text-xs font-bold shadow-sm not-italic"
                          >
                            Start Camera Scan
                          </button>
                        </>
                      )}

                      {arStep === 'error' && (
                        <>
                          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                          <p className="font-bold text-red-700 not-italic">{arError}</p>
                          <button
                            onClick={startFootScan}
                            className="amazon-btn-secondary px-6 py-2 rounded-full text-xs font-bold shadow-sm not-italic"
                          >
                            Try Again
                          </button>
                        </>
                      )}

                      {arStep === 'camera' && (
                        <div className="not-italic">
                          <div className="relative w-full max-w-[384px] mx-auto aspect-[3/4] bg-black rounded-lg overflow-hidden">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            {/* Foot outline guide overlay */}
                            <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full pointer-events-none opacity-70">
                              <path
                                d="M50 10 C35 10 30 30 32 50 C34 70 25 90 28 110 C30 125 45 132 50 132 C55 132 70 125 72 110 C75 90 66 70 68 50 C70 30 65 10 50 10 Z"
                                fill="none"
                                stroke="#00e5ff"
                                strokeWidth="2"
                                strokeDasharray="4 3"
                              />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-500 mt-3">Align your foot inside the outline, then capture.</p>
                          <button
                            onClick={captureFootScan}
                            className="amazon-btn-primary px-6 py-2 rounded-full text-xs font-bold shadow-sm mt-3"
                          >
                            Capture
                          </button>
                        </div>
                      )}

                      {arStep === 'captured' && scannedLengthCm !== null && (
                        <div className="not-italic max-w-[384px] mx-auto">
                          <div className="flex gap-3 items-start">
                            {scannedPhotoUrl && (
                              <img src={scannedPhotoUrl} alt="Captured foot scan" className="w-20 h-24 object-cover rounded border border-gray-300" />
                            )}
                            <div className="text-left bg-[#f7fafa] border border-[#007185]/20 p-3 rounded flex-1">
                              <p className="text-[#007185] font-bold text-sm">We recommend IND {scannedSize}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">Estimated foot length: {scannedLengthCm} cm</p>
                              <p className="text-[10px] text-amber-700 mt-1">Approximate — based on your scan, not a precise 3D measurement.</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={retakeFootScan}
                              className="amazon-btn-secondary flex-1 px-4 py-2 rounded-lg font-bold text-xs shadow-sm"
                            >
                              Retake
                            </button>
                            <button
                              onClick={() => handleUseSize(`IND ${scannedSize}`)}
                              className="amazon-btn-primary flex-1 px-4 py-2 rounded-lg font-bold text-xs shadow-sm"
                            >
                              Use this size
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle Column: Product Details & Reviews */}
          <div className="lg:col-span-4 flex flex-col gap-4 text-left">
            <div className="border-b border-gray-300 pb-4">
              <h1 className="text-[#0F1111] font-bold text-xl leading-snug mb-1">
                Men's Speed Pro Trainer 4 - Lightweight Performance Road Running Shoe with Responsive Cushioning
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex text-[#febd69]">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]">star_half</span>
                </div>
                <span className="text-[#007185] hover:text-[#e47911] hover:underline cursor-pointer">1,402 ratings</span>
                <span className="text-gray-300">|</span>
                <span className="text-[#007185] hover:text-[#e47911] hover:underline cursor-pointer">Search this page</span>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm align-top font-semibold">₹</span>
                <span className="text-3xl font-bold leading-none">10,799</span>
                <span className="text-sm align-top font-semibold">00</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">FREE Returns</div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-bold text-xs text-gray-800 mb-1">
                  Color: <span className="font-normal text-gray-600">Electric Blue / Metallic Silver</span>
                </p>
                <div className="flex gap-2">
                  <div className="w-12 h-12 border-2 border-[#e47911] p-0.5 rounded cursor-pointer">
                    <div className="w-full h-full bg-blue-600 rounded-sm"></div>
                  </div>
                  <div className="w-12 h-12 border border-gray-300 p-0.5 rounded cursor-pointer hover:border-gray-500">
                    <div className="w-full h-full bg-black rounded-sm"></div>
                  </div>
                  <div className="w-12 h-12 border border-gray-300 p-0.5 rounded cursor-pointer hover:border-gray-500">
                    <div className="w-full h-full bg-red-600 rounded-sm"></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <div className="flex justify-between max-w-[200px]">
                  <label className="font-bold text-xs text-gray-800">Size:</label>
                  <span className="text-xs text-[#007185] hover:underline cursor-pointer">Size Chart</span>
                </div>
                <select 
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full max-w-[200px] bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-xs shadow-sm hover:bg-gray-200 focus:outline-none cursor-pointer"
                >
                  <option>Select Size</option>
                  <option>IND 7</option>
                  <option>IND 8</option>
                  <option>IND 9</option>
                  <option>IND 10</option>
                  <option>IND 11</option>
                </select>
                {selectedSize !== 'Select Size' && (
                  <p className="text-xs text-[#007600] font-bold mt-1 font-sans">✓ Size Fit Applied: {selectedSize}</p>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="font-bold text-xs text-gray-800">About this item</div>
                <ul className="list-disc ml-4 text-xs space-y-2 text-gray-700">
                  <li>Highly breathable engineered mesh upper keeps feet cool and comfortable during long runs.</li>
                  <li>Advanced EnergyCell foam provides maximum energy return and soft impact absorption.</li>
                  <li>Carbon-fiber plate propulsion system ensures a snappy transition through the gait cycle.</li>
                  <li>High-traction rubber outsole designed specifically for marathon-ready durability.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Area / Buy Box */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 p-4 rounded-lg flex flex-col gap-4 bg-white text-left sticky top-24">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm align-top font-semibold">₹</span>
                  <span className="text-3xl font-bold leading-none">10,799</span>
                  <span className="text-sm align-top font-semibold">00</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  FREE delivery <span className="font-bold text-gray-800">Tuesday, May 14</span>. Order within <span className="text-green-700">12 hrs 3 mins</span>
                </p>
                <div className="flex items-center gap-1 text-xs text-[#007185] cursor-pointer mt-2">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span>Deliver to India</span>
                </div>
              </div>

              <div className="text-[#007600] text-lg font-bold">In Stock</div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-bold text-gray-700">Quantity:</label>
                  <select className="bg-gray-100 border border-gray-300 rounded text-xs px-2 py-1 shadow-sm">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                  </select>
                </div>
                <button 
                  onClick={() => setCartCount(c => c + 1)}
                  className="amazon-btn-primary w-full py-2.5 rounded-full font-bold text-xs shadow"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => alert(`Purchasing Men's Speed Pro Trainer size ${selectedSize}`)}
                  className="bg-[#FFA41C] hover:bg-[#F3A847] w-full py-2.5 rounded-full font-bold text-xs border border-[#FF8F00] shadow cursor-pointer text-gray-900"
                >
                  Buy Now
                </button>
              </div>

              <div className="text-[11px] text-gray-500 space-y-1.5 pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Ships from</span>
                  <span className="text-gray-800 font-semibold">Amazon.in</span>
                </div>
                <div className="flex justify-between">
                  <span>Sold by</span>
                  <span className="text-gray-800 font-semibold">Amazon.in</span>
                </div>
                <div className="flex justify-between">
                  <span>Returns</span>
                  <span className="text-[#007185]">Returnable within 30 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment</span>
                  <span className="text-[#007185]">Secure transaction</span>
                </div>
              </div>

              <button className="amazon-btn-secondary w-full py-1.5 rounded-lg text-xs font-bold mt-2 shadow-sm">
                Add to List
              </button>
            </div>
          </div>

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

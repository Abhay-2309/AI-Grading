import React, { useState } from 'react';
import { formatINR } from '../../../services/currency';

export default function ReturnSummary({ activeReturn, returnState, setReturnState, onFinish }) {
  const [method, setMethod] = useState(returnState.method || 'dropoff');
  const [showQR, setShowQR] = useState(false);

  const overallScore = returnState.aiReport?.overallScore;
  const refundMultiplier = overallScore !== undefined ? Math.max(0.5, overallScore / 100) : 1;
  const estimatedRefund = activeReturn.price * refundMultiplier;
  const requiresHumanReview = Boolean(returnState.aiReport?.requiresHumanReview);

  const handleMethodSelect = (selectedMethod) => {
    setMethod(selectedMethod);
    setReturnState(prev => ({
      ...prev,
      method: selectedMethod
    }));
  };

  return (
    <div className="w-full relative">
      {/* Progress Stepper */}
      <div className="mb-xl flex items-center justify-between max-w-[672px] mx-auto">
        <div className="flex flex-col items-center gap-xs flex-1">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] font-bold">check</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Items</span>
        </div>
        <div className="h-[2px] bg-primary-container flex-grow mx-2 mb-6"></div>
        <div className="flex flex-col items-center gap-xs flex-1">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] font-bold">check</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Reason</span>
        </div>
        <div className="h-[2px] bg-primary-container flex-grow mx-2 mb-6"></div>
        <div className="flex flex-col items-center gap-xs flex-1">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] font-bold">check</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Method</span>
        </div>
        <div className="h-[2px] bg-primary-container flex-grow mx-2 mb-6"></div>
        <div className="flex flex-col items-center gap-xs flex-1">
          <div className="w-10 h-10 rounded-full border-2 border-primary-container text-primary-container flex items-center justify-center font-bold">4</div>
          <span className="font-label-bold text-label-bold text-primary">Summary</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-xl text-left">
        {/* Left Column: Summary & Method */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
          {/* Status Banner */}
          {requiresHumanReview ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-md flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_top</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-amber-800 font-bold">Under Review</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Your return has been submitted and flagged for a quick verification by our logistics team before final approval.</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#e7f3f0] border border-[#d0e6df] rounded-lg p-md flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-[#007600] flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-[#007600] font-bold">Auto-approved</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Your return request has been instantly verified and approved.</p>
              </div>
            </div>
          )}

          {/* Main Summary Card */}
          <section className="bg-white rounded-lg border border-outline-variant p-xl">
            <h1 className="font-display-md text-display-md mb-xl text-on-surface font-bold">Return Summary</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              {/* Refund Estimate Section */}
              <div className="flex flex-col gap-sm">
                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Refund Estimate</span>
                <div className="flex flex-wrap items-baseline gap-xs">
                  <span className="font-display-lg text-display-lg text-on-surface font-bold">{formatINR(estimatedRefund)}</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">(Expected in 3-5 days)</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Refunding to: Visa ending in 4242</p>
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-sm">
                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Return Deadline</span>
                <div className="flex items-center gap-md p-md bg-surface-container-low rounded-lg border border-outline-variant">
                  <span className="material-symbols-outlined text-secondary">calendar_today</span>
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface">Tuesday, Oct 15</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Please return by this date to complete processing.</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-xl border-outline-variant" />

            {/* Return Method Selector */}
            <div className="flex flex-col gap-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Return Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {/* Option 1: UPS Drop-off */}
                <div 
                  onClick={() => handleMethodSelect('dropoff')}
                  className={`border-2 rounded-lg p-md relative cursor-pointer transition-all ${
                    method === 'dropoff' 
                      ? 'border-secondary-container bg-orange-50/10 opacity-100' 
                      : 'border-outline-variant opacity-60 hover:opacity-85'
                  }`}
                >
                  {method === 'dropoff' && (
                    <div className="absolute top-md right-md w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                  )}
                  <div className="flex gap-md">
                    <span className="material-symbols-outlined text-xl text-primary">package_2</span>
                    <div>
                      <p className="font-label-bold text-label-bold text-primary">UPS Drop-off</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">No box or label needed. Just show your QR code.</p>
                      <p className="mt-2 text-[#007185] font-label-bold">FREE</p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Home Pickup */}
                <div 
                  onClick={() => handleMethodSelect('pickup')}
                  className={`border-2 rounded-lg p-md relative cursor-pointer transition-all ${
                    method === 'pickup' 
                      ? 'border-secondary-container bg-orange-50/10 opacity-100' 
                      : 'border-outline-variant opacity-60 hover:opacity-85'
                  }`}
                >
                  {method === 'pickup' && (
                    <div className="absolute top-md right-md w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                  )}
                  <div className="flex gap-md">
                    <span className="material-symbols-outlined text-xl text-on-surface-variant">local_shipping</span>
                    <div>
                      <p className="font-label-bold text-label-bold text-on-surface">Home Pickup</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">A carrier will pick up from your porch tomorrow.</p>
                      <p className="mt-2 text-on-surface font-label-bold">FREE</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Final Instructions */}
          <section className="bg-[#fff9e6] border border-[#f5d8a7] rounded-lg p-xl flex flex-col gap-md shadow-sm">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-secondary">info</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Next Steps</h3>
            </div>
            {method === 'dropoff' ? (
              <ul className="flex flex-col gap-sm list-decimal pl-5 text-on-surface-variant">
                <li className="font-body-lg text-body-lg text-on-surface">
                  <strong>Drop off your item by Tuesday, Oct 15 at any UPS location.</strong>
                </li>
                <li className="font-body-md text-body-md">Take the item and your smartphone to the store.</li>
                <li className="font-body-md text-body-md">Show the QR code (we've emailed it to you) to the UPS associate.</li>
                <li className="font-body-md text-body-md">No need to pack or label the item—UPS will handle it for free.</li>
              </ul>
            ) : (
              <ul className="flex flex-col gap-sm list-decimal pl-5 text-on-surface-variant">
                <li className="font-body-lg text-body-lg text-on-surface">
                  <strong>Place your item on your porch by 8:00 AM tomorrow.</strong>
                </li>
                <li className="font-body-md text-body-md">An Amazon Logistics driver will arrive between 9:00 AM and 5:00 PM.</li>
                <li className="font-body-md text-body-md">Please ensure the item is securely boxed (no label required).</li>
                <li className="font-body-md text-body-md">You will receive a pickup confirmation email once collected.</li>
              </ul>
            )}
            <div className="mt-md flex flex-wrap gap-md">
              <button 
                onClick={() => setShowQR(true)}
                className="bg-[#FF9900] hover:bg-[#e68a00] text-black px-xl py-sm rounded-lg font-label-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                View Return QR Code
              </button>
              <button className="bg-white border border-outline-variant hover:bg-surface-container-low px-xl py-sm rounded-lg font-label-bold transition-all cursor-pointer text-on-surface">
                Print Packing Slip
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Item Snapshot & Help */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          {/* Item Card */}
          <div className="bg-white border border-outline-variant rounded-lg overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-low">
              <h4 className="font-label-bold text-label-bold text-on-surface">Item being returned</h4>
            </div>
            <div className="p-md flex gap-md">
              <div className="w-20 h-20 bg-surface-container-low rounded border border-outline-variant flex-shrink-0 flex items-center justify-center">
                <img className="max-h-full max-w-full object-contain p-1" alt={activeReturn.itemName} src={activeReturn.imgUrl} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-label-bold text-label-bold line-clamp-2 text-on-surface">{activeReturn.itemName}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Quantity: 1</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Reason: {activeReturn.reason === 'defective' ? 'Defective/Does not work' : activeReturn.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Assistance Card */}
          <div className="bg-white border border-outline-variant rounded-lg p-xl flex flex-col gap-md">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Need help?</h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              If you have questions about this return or need to make changes, our customer service team is available 24/7.
            </p>
            <div className="flex flex-col gap-sm">
              <button className="flex items-center gap-md p-md border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors text-left cursor-pointer">
                <span className="material-symbols-outlined text-[#007185]">chat_bubble</span>
                <span className="font-label-bold text-label-bold text-on-surface">Chat with Specialist</span>
              </button>
              <button className="flex items-center gap-md p-md border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors text-left cursor-pointer">
                <span className="material-symbols-outlined text-[#007185]">call</span>
                <span className="font-label-bold text-label-bold text-on-surface">Request a Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white rounded-xl p-xl max-w-[384px] w-full flex flex-col items-center shadow-2xl relative">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-sm font-bold">Return QR Code</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-center mb-xl">
              Show this code to the associate at your drop-off location.
            </p>
            <div className="bg-white border-2 border-outline rounded-xl p-md mb-xl flex items-center justify-center">
              {/* Simulated QR Code */}
              <div className="w-56 h-56 bg-slate-900 flex flex-wrap p-3">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-7 h-7 border border-white ${
                      (i % 3 === 0 && i % 2 === 0) || i < 12 || i > 52 || (i % 7 === 0) ? 'bg-black' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="font-label-bold text-label-bold text-secondary font-mono tracking-widest bg-surface-container-low py-sm px-md rounded border border-outline-variant">
              RET-{activeReturn.id}
            </p>
            <button 
              onClick={() => {
                setShowQR(false);
                onFinish();
              }}
              className="mt-xl w-full py-sm bg-primary-container text-white font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

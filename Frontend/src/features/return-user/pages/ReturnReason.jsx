import React from 'react';
import { formatINR } from '../../../services/currency';

export default function ReturnReason({ activeReturn, returnState, setReturnState, onNext, onCancel }) {
  const reasons = [
    { value: 'damaged', label: 'Damaged during shipping' },
    { value: 'wrong_item', label: 'Wrong item was sent' },
    { value: 'no_longer_needed', label: 'No longer needed' },
    { value: 'defective', label: 'Defective / Does not work properly' },
    { value: 'mismatch', label: "Doesn't match description" },
    { value: 'other', label: 'Other' }
  ];

  const handleReasonChange = (value) => {
    setReturnState(prev => ({
      ...prev,
      reason: value
    }));
  };

  const handleCommentsChange = (e) => {
    setReturnState(prev => ({
      ...prev,
      comments: e.target.value
    }));
  };

  const isFormValid = returnState.reason !== '';

  return (
    <div className="flex flex-col gap-xl">
      {/* Progress Stepper (Style Guidance) */}
      <div className="mb-xl flex items-center justify-center">
        <div className="flex items-center w-full max-w-[672px] text-on-surface">
          <div className="flex flex-col items-center flex-1">
            <span className="material-symbols-outlined text-secondary font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-label-bold font-label-bold mt-1 text-on-surface text-xs font-bold">Select Item</span>
          </div>
          <div className="h-px bg-primary-container flex-grow mx-2 mb-5"></div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-[12px] font-bold">2</div>
            <span className="text-label-bold font-label-bold mt-1 text-primary-container text-xs font-bold">Return Reason</span>
          </div>
          <div className="h-px bg-outline-variant flex-grow mx-2 mb-5"></div>
          <div className="flex flex-col items-center flex-1 opacity-40">
            <div className="w-6 h-6 rounded-full bg-outline-variant text-white flex items-center justify-center text-[12px] font-bold">3</div>
            <span className="text-label-bold font-label-bold mt-1 text-outline text-xs font-bold">Resolution</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-xl items-start">
        {/* Left Column: Item Selection Snapshot */}
        <div className="md:col-span-4 lg:col-span-3">
        <div className="bg-white border border-outline-variant rounded-lg p-md overflow-hidden transition-all duration-300">
          <h3 className="font-headline-sm text-headline-sm mb-md text-on-surface font-bold text-left">Item to Return</h3>
          <div className="flex flex-col gap-md">
            <div className="w-full aspect-square bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex items-center justify-center">
              <img 
                className="max-h-full object-contain" 
                alt={activeReturn.itemName} 
                src={activeReturn.imgUrl} 
              />
            </div>
            <div className="text-left">
              <p className="font-body-lg text-body-lg font-bold text-on-surface line-clamp-2">{activeReturn.itemName}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 text-xs">Condition: Like New</p>
              <p className="font-display-md text-display-md text-secondary font-bold mt-2 text-xl">{formatINR(activeReturn.price)}</p>
            </div>
          </div>
          <div className="mt-md pt-md border-t border-outline-variant text-left">
            <button className="text-tertiary-fixed-variant font-label-bold hover:underline flex items-center gap-1 cursor-pointer text-xs font-bold text-teal-700">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Change item
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Return Flow Form */}
      <div className="md:col-span-8 lg:col-span-9 bg-white border border-outline-variant rounded-lg p-xl text-left">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-xl font-bold text-2xl">Why are you returning this?</h1>
        <div className="space-y-base" id="returnForm">
          {/* Radio Options */}
          <div className="space-y-1">
            {reasons.map((r) => {
              const isChecked = returnState.reason === r.value;
              return (
                <label 
                  key={r.value} 
                  className={`flex items-center p-md border rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors group ${
                    isChecked ? 'bg-surface-container-low border-secondary-container' : 'border-outline-variant'
                  }`}
                >
                  <input 
                    className="form-radio h-5 w-5 border-outline-variant focus:ring-0 focus:ring-offset-0 text-[#007185] rounded-full accent-[#007185] amazon-radio" 
                    name="return_reason" 
                    type="radio" 
                    value={r.value}
                    checked={isChecked}
                    onChange={() => handleReasonChange(r.value)}
                  />
                  <span className="ml-md font-body-lg text-body-lg text-on-surface ml-3 text-sm">{r.label}</span>
                </label>
              );
            })}
          </div>

          {/* Additional Details (Hidden until reason selected) */}
          {returnState.reason && (
            <div className="mt-xl animate-fade-in">
              <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2 text-xs font-bold" htmlFor="comments">
                Comments (Optional)
              </label>
              <textarea 
                className="w-full border border-outline-variant rounded-lg p-md focus:border-tertiary-container focus:ring-1 focus:ring-tertiary-container outline-none transition-all text-on-surface bg-white text-sm" 
                id="comments" 
                value={returnState.comments}
                onChange={handleCommentsChange}
                placeholder="Tell us more about the issue..." 
                rows="3"
              />
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="mt-xl pt-xl border-t border-outline-variant flex flex-col sm:flex-row gap-md justify-between items-center">
            <button 
              className="order-2 sm:order-1 font-body-md text-body-md text-on-surface hover:underline px-md py-2 cursor-pointer text-sm" 
              type="button"
              onClick={onCancel}
            >
              Back
            </button>
            <button 
              className={`order-1 sm:order-2 w-full sm:w-auto px-xl py-3 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer text-sm ${
                isFormValid 
                  ? 'bg-secondary-container text-on-secondary-fixed hover:bg-opacity-95' 
                  : 'bg-secondary-container/50 text-on-secondary-fixed/50 opacity-50 cursor-not-allowed'
              }`} 
              disabled={!isFormValid}
              onClick={onNext}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

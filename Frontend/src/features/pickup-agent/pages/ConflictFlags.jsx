import React from 'react';

export default function ConflictFlags({ activeReturn, agentAssessment, onConfirm, onBack }) {
  return (
    <div className="flex-grow flex flex-col items-center justify-center py-xl px-margin-mobile text-left">
      {/* Conflict Resolution Card */}
      <div className="w-full max-w-[512px] bg-white border border-[#D1D5DB] p-stack-lg rounded-xl flex flex-col items-center gap-stack-lg shadow-lg">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            notification_important
          </span>
        </div>

        {/* Content Area */}
        <div className="text-center space-y-stack-sm">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary uppercase font-bold tracking-wider">
            Conflict Identified
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Your assessment differs from the initial AI grade. This item will be sent for manual review.
          </p>
        </div>

        {/* Data Breakdown */}
        <div className="w-full bg-surface-container-low p-4 border border-[#D1D5DB] rounded-lg space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-outline-variant">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs">AI Assessment</span>
            <span className="font-label-lg text-label-lg text-primary font-bold">
              {activeReturn.userGrade} (Used, Minor Wear)
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs">Agent Assessment</span>
            <span className="font-label-lg text-label-lg text-secondary font-bold">
              Grade {agentAssessment.agentGrade}
            </span>
          </div>
        </div>

        {/* Action Zone */}
        <div className="w-full flex flex-col gap-stack-md mt-stack-md">
          <button 
            onClick={onConfirm}
            className="w-full min-h-[48px] bg-primary text-white hover:bg-slate-800 font-bold uppercase tracking-widest active:scale-95 transition-all cursor-pointer border border-[#D1D5DB]"
          >
            Confirm submission
          </button>
          <button 
            onClick={onBack}
            className="w-full min-h-[48px] border-2 border-primary text-primary hover:bg-surface-container bg-white font-bold uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
          >
            Go back
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mt-stack-sm">
          <div className="inline-flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded border border-outline-variant">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">history</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs">Pending Manual Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}

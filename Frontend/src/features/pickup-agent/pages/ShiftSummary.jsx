import React from 'react';

export default function ShiftSummary({ onFinalize }) {
  return (
    <div className="max-w-[672px] mx-auto w-full space-y-stack-lg text-left py-stack-lg px-margin-mobile">
      {/* Accuracy Hero Section */}
      <section className="flex flex-col items-center justify-center py-stack-lg space-y-stack-sm text-center">
        <h2 className="font-label-lg text-on-surface-variant uppercase tracking-widest text-xs font-bold">Shift Accuracy</h2>
        <div className="relative flex flex-col items-center">
          <span className="font-display text-[84px] leading-none text-primary font-extrabold">94%</span>
          <div className="flex items-center gap-1 mt-stack-sm text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold transition-all">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            <span className="font-label-md text-label-md">+2.4% from avg</span>
          </div>
        </div>
      </section>

      {/* Stats Grid (Bento Style) */}
      <div className="grid grid-cols-2 gap-gutter">
        {/* Stats Card 1 */}
        <div className="bg-white rounded-xl p-stack-md flex flex-col justify-between min-h-[140px] border border-outline-variant shadow-sm">
          <div>
            <span className="material-symbols-outlined text-secondary">local_shipping</span>
            <p className="font-label-md text-label-md text-on-surface-variant mt-stack-sm text-xs uppercase tracking-wide">Pickups Completed Today</p>
          </div>
          <p className="font-headline-lg text-headline-lg text-primary font-bold text-3xl">42</p>
        </div>

        {/* Stats Card 2 */}
        <div className="bg-white rounded-xl p-stack-md flex flex-col justify-between min-h-[140px] border border-outline-variant shadow-sm">
          <div>
            <span className="material-symbols-outlined text-error">flag</span>
            <p className="font-label-md text-label-md text-on-surface-variant mt-stack-sm text-xs uppercase tracking-wide">Flagged for Review</p>
          </div>
          <p className="font-headline-lg text-headline-lg text-error font-bold text-3xl">03</p>
        </div>
      </div>

      {/* Shift History / Quick Insight */}
      <section className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant">
          <h3 className="font-label-lg text-label-lg text-primary font-bold">Key Performance Insight</h3>
        </div>
        <div className="p-stack-md flex items-start gap-stack-md">
          <div className="bg-primary-container p-2 rounded-lg text-white">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div>
            <p className="font-body-md text-body-md text-on-surface">
              Peak performance maintained during the 14:00 logistics cycle. Accuracy remained above threshold throughout high-volume transit periods.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Action */}
      <button 
        onClick={onFinalize}
        className="w-full bg-primary-container text-white h-touch-target-min rounded-xl flex items-center justify-center gap-stack-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 cursor-pointer py-3 shadow-md"
      >
        <span className="font-bold font-label-lg text-on-primary">Finalize Shift Logs</span>
        <span className="material-symbols-outlined">check_circle</span>
      </button>
    </div>
  );
}

import React, { useState } from 'react';
import { formatINR } from '../../../services/currency';

export default function ItemDetail({ activeReturn, onResolve, onBack }) {
  const [disagreementLabel, setDisagreementLabel] = useState('Genuine Ambiguity');
  const [selectedCondition, setSelectedCondition] = useState(activeReturn.agentGrade || 'Minor Wear');

  const handleResolveAction = (actionType) => {
    // Resolve the dispute
    let nextStatus = 'Completed';
    let refundApproved = false;

    if (actionType === 'approve') {
      nextStatus = 'Completed';
      refundApproved = true;
    } else if (actionType === 'deny') {
      nextStatus = 'Completed';
      refundApproved = false;
    } else {
      nextStatus = 'Manual Review Escalated';
    }

    onResolve(activeReturn.id, {
      status: nextStatus,
      disagreementLabel,
      agentGrade: selectedCondition,
      notes: `Dispute resolved via FraudGuard. Resolution action: ${actionType.toUpperCase()}. Decision basis: ${disagreementLabel}.`
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 text-left relative h-full p-6">
      {/* Top Banner */}
      <div className="bg-surface-container border border-outline-variant p-4 flex items-center justify-between shadow-sm mb-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-surface-container-high rounded-full text-on-surface mr-2 cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="bg-error-container/20 text-error px-3 py-1 rounded text-xs font-bold font-mono">
            CASE ID: #FG-{activeReturn.id.replace('ITEM-', '')}
          </div>
          <div className="h-8 w-[1px] bg-outline-variant"></div>
          <div>
            <p className="text-on-surface-variant font-label-caps uppercase text-[10px]">Customer Stated Reason</p>
            <p className="font-headline-md text-primary font-bold text-lg">{activeReturn.reason === 'defective' ? 'Defective / Does not work' : activeReturn.reason}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-on-surface-variant font-label-caps uppercase text-[10px]">Item Value</p>
          <p className="font-data-mono text-on-surface text-lg font-bold font-mono">{formatINR(activeReturn.price)}</p>
        </div>
      </div>

      {/* Comparison Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-lg">
        {/* Left Column: Stage 1 AI Grade */}
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-outline-variant flex justify-between items-center bg-surface-container-high text-on-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
              <span className="font-label-bold text-xs uppercase tracking-wider">Stage 1 AI Grade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-data-mono text-primary font-bold">{activeReturn.userConfidence}</span>
              <span className="text-on-surface-variant font-label-caps text-[10px]">CONFIDENCE</span>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="relative w-full aspect-video border border-outline-variant bg-black overflow-hidden group rounded-lg">
              <img 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                alt="AI analyzed item" 
                src={activeReturn.imgUrl} 
              />
              <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
              
              {/* AI Annotation Mockup */}
              <div className="absolute top-[30%] left-[45%] w-12 h-12 border-2 border-primary rounded-full animate-pulse flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              </div>
              <div className="absolute top-[30%] left-[55%] bg-primary/95 text-white px-2 py-1 text-[10px] font-bold font-mono rounded">
                CRITICAL_FRACTURE_L4
              </div>
            </div>

            <div className="space-y-2 text-on-surface">
              <h4 className="font-label-bold text-on-surface-variant border-b border-outline-variant pb-1 text-xs uppercase tracking-wider">
                AI DETECTED ANOMALIES
              </h4>
              <ul className="space-y-1.5 text-xs text-on-surface-variant">
                {activeReturn.defects.map((def, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                    <span>{def.type}: {def.description}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span>Non-OEM adhesive residue detected around sensor housing.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Stage 2 Agent Grade */}
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-outline-variant flex justify-between items-center bg-surface-container-high text-on-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">person_check</span>
              <span className="font-label-bold text-xs uppercase tracking-wider">Stage 2 Agent Grade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-data-mono text-tertiary font-bold">98%</span>
              <span className="text-on-surface-variant font-label-caps text-[10px]">ACCURACY RATING</span>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <label className="block text-slate-500 font-bold mb-2 text-xs uppercase tracking-wider">
                DETERMINED CONDITION
              </label>
              <select 
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded focus:ring-0 focus:outline-none appearance-none cursor-pointer font-medium pr-10"
              >
                <option value="Like New">Like New</option>
                <option value="Minor Wear">Minor Wear</option>
                <option value="Defective">Defective</option>
                <option value="Tampered / Swapped">Tampered / Swapped</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-3 border border-outline-variant rounded-lg">
                <p className="text-on-surface-variant font-label-caps text-[10px] uppercase">Assigned Agent</p>
                <div className="flex items-center gap-2 mt-1 text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">account_circle</span>
                  <span className="text-body-md font-bold">M. Smith</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 border border-outline-variant rounded-lg">
                <p className="text-on-surface-variant font-label-caps text-[10px] uppercase">Review Duration</p>
                <div className="flex items-center gap-2 mt-1 text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">timer</span>
                  <span className="text-body-md font-bold font-mono">04m 12s</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-on-surface">
              <label className="font-label-bold text-on-surface-variant block text-xs uppercase tracking-wider">AGENT FIELD NOTES</label>
              <div className="bg-surface-container-lowest border border-outline-variant p-3 text-xs italic text-on-surface/80 leading-relaxed min-h-[100px] rounded-lg">
                "{activeReturn.comments || 'Visual inspection confirms light scratching on the external body. However, the defective claim could not be replicated in the automated test rig.'}"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account History Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-100 text-slate-700">
          <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Account History: {activeReturn.customerName}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            activeReturn.riskTier === 'Critical Risk' 
              ? 'bg-red-50 text-red-700 border-red-100' 
              : activeReturn.riskTier === 'Moderate Risk'
              ? 'bg-amber-50 text-amber-700 border-amber-150'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            {activeReturn.riskTier.toUpperCase()}
          </span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-slate-450 font-bold text-[10px] uppercase">Return Frequency</p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-slate-800 text-2xl font-bold font-mono">12%</span>
                <div className="w-24 h-10 bg-slate-100/50 relative overflow-hidden rounded border border-slate-200 flex items-center justify-center">
                  {/* Sparkline */}
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path d="M0 35 Q 10 30, 20 32 T 40 10 T 60 25 T 80 5 T 100 15" fill="none" stroke="#ef4444" strokeWidth="2"></path>
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-red-650 mt-1 font-bold">↑ 4% vs Category Avg</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-slate-450 font-bold text-[10px] uppercase">Past Disagreements</p>
            <p className="text-slate-800 text-xl font-bold font-mono">{activeReturn.disagreementCount}</p>
            <p className="text-slate-500 text-xs">2 upheld, 2 overturned</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-450 font-bold text-[10px] uppercase">Resale Downgrades</p>
            <p className="text-slate-800 text-xl font-bold font-mono">07</p>
            <p className="text-slate-500 text-xs">LTM aggregate</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-450 font-bold text-[10px] uppercase">Estimated Fraud Loss</p>
            <p className="text-slate-800 text-xl font-bold font-mono">₹34,650.00</p>
            <p className="text-red-500 text-xs font-bold">Potential recovery target</p>
          </div>
        </div>
      </div>

      {/* Bottom Decision Panel (Non-Fixed inside Card) */}
      <div className="mt-auto border-t border-slate-200 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between bg-white w-full">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <div>
            <label className="block text-slate-400 text-[10px] mb-1 font-bold uppercase tracking-wider">
              LABEL DISAGREEMENT
            </label>
            <div className="relative w-64">
              <select 
                value={disagreementLabel}
                onChange={(e) => setDisagreementLabel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-md focus:ring-0 focus:outline-none appearance-none font-bold text-xs cursor-pointer pr-10"
              >
                <option value="Genuine Ambiguity">Genuine Ambiguity</option>
                <option value="Agent Error">Agent Error</option>
                <option value="AI Error">AI Error</option>
                <option value="Likely Fraud">Likely Fraud</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
          <div className="text-slate-400 text-xs italic hidden md:block">
            Final reviewer action will be logged to Audit Trail.
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={() => handleResolveAction('escalate')}
            className="px-5 py-2 border border-slate-250 text-slate-700 hover:bg-slate-50 transition-colors font-bold uppercase text-[11px] tracking-wider cursor-pointer rounded-md"
          >
            Escalate
          </button>
          <button 
            onClick={() => handleResolveAction('deny')}
            className="px-5 py-2 border border-red-500 text-red-500 hover:bg-red-50 transition-colors font-bold uppercase text-[11px] tracking-wider cursor-pointer rounded-md"
          >
            Deny Claim
          </button>
          <button 
            onClick={() => handleResolveAction('approve')}
            className="px-6 py-2 bg-[#ffa726] hover:bg-[#fb8c00] text-slate-950 font-bold uppercase text-[11px] tracking-wider cursor-pointer rounded-md"
          >
            Approve Refund
          </button>
        </div>
      </div>
    </div>
  );
}

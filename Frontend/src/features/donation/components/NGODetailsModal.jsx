import React from 'react';

// Shared "View Details" modal — shows the full NGO profile (founder,
// contact, registration) alongside the specific need's own stats. Used from
// both the NGO Hub's own dashboard and the donor-facing Cares Portal, so
// both sides see the exact same verified information.
export default function NGODetailsModal({ campaign, onClose, onDonate }) {
  if (!campaign) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-[640px] w-full max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {campaign.ngoLogo && (
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 shrink-0 p-1.5">
                <img className="w-full h-full object-contain" alt={campaign.ngoName} src={campaign.ngoLogo} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-slate-800">{campaign.ngoName}</h3>
                <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                {campaign.registrationNumber || 'Registration pending'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-slate-400 hover:text-slate-855 bg-transparent border-none cursor-pointer focus:outline-none shrink-0"
          >
            close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mission */}
          {campaign.missionStatement && (
            <section>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mission</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{campaign.missionStatement}</p>
            </section>
          )}

          {/* Founder & Contact */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Founder</p>
              <p className="text-xs font-bold text-slate-800">{campaign.founder || 'Not on file'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Founded</p>
              <p className="text-xs font-bold text-slate-800">{campaign.foundedYear || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 col-span-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Person</p>
              <p className="text-xs font-bold text-slate-800">{campaign.contactPerson || 'Not on file'}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600">
                {campaign.contactEmail && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-green-600">mail</span>
                    {campaign.contactEmail}
                  </span>
                )}
                {campaign.contactPhone && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-green-600">call</span>
                    {campaign.contactPhone}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 col-span-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Office</p>
              <p className="text-xs text-slate-700 leading-relaxed">{campaign.address || campaign.location || 'Address not on file'}</p>
            </div>
          </section>

          {/* This specific need */}
          <section className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Active Need</h4>
              {campaign.urgency === 'high' && (
                <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded">High Urgency</span>
              )}
            </div>
            <h3 className="font-extrabold text-sm text-slate-800 mb-1.5">{campaign.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">{campaign.description}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span>{campaign.received} of {campaign.target} {campaign.unit} received</span>
                <span className="text-green-700">{campaign.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: `${campaign.progress}%` }} />
              </div>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors bg-transparent cursor-pointer"
          >
            Close
          </button>
          {onDonate && (
            <button
              onClick={onDonate}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition-colors border-none cursor-pointer shadow"
            >
              Donate Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

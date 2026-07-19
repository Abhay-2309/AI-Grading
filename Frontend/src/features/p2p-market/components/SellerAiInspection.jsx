import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../../services/api';
import {
  taxonomyKeyFor,
  resolveRequiredViews,
  BASE_VIEW_LABELS,
  getSellQuestions,
} from '../data/conditionQuestions';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 360; // ~900s ceiling — CPU-only inference measured at ~158s/view, serialized per view on the Python engine; matches AI1's 900s stuck-request sweeper

const ANSWER_OPTIONS = [
  { val: 'yes', tone: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' },
  { val: 'partial', tone: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' },
  { val: 'no', tone: 'bg-red-500 hover:bg-red-600 text-white border-red-500' },
];

// MarketConnect's own independent "AI Inspection" step: pick a subcategory,
// capture every angle the AI needs, answer a few condition questions, then
// submit straight to AI1's grading pipeline. This is a listing-specific page
// — it does not reuse the Return flow's photo-capture / question / grading
// screens, though it talks to the same backend grading service.
export default function SellerAiInspection({ productId, category, subcategoryTaxonomy, onNext, onBack }) {
  const taxonomyKey = taxonomyKeyFor(category);
  const bucket = subcategoryTaxonomy?.[taxonomyKey];
  const subcategories = bucket?.subcategories || [];

  const [subcategory, setSubcategory] = useState(subcategories.length === 1 ? subcategories[0].key : '');
  const { views: requiredViews, labels: viewLabelOverrides } = resolveRequiredViews(taxonomyKey, subcategory, subcategoryTaxonomy);
  const viewLabel = (field) => viewLabelOverrides[field] || BASE_VIEW_LABELS[field] || field;
  const selectedLeaf = subcategories.find((s) => s.key === subcategory) || null;
  const sellQuestions = getSellQuestions(taxonomyKey);

  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [answers, setAnswers] = useState({});
  const [extraAnswers, setExtraAnswers] = useState({});
  const [phase, setPhase] = useState('form'); // 'form' | 'uploading' | 'analyzing' | 'completed' | 'failed'
  const [statusText, setStatusText] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const fileInputRefs = useRef({});
  const previewsRef = useRef({});

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Changing subcategory can change which views/photos are required — drop
  // any captured photo for a view that's no longer asked for.
  const handleSubcategoryChange = (key) => {
    setSubcategory(key);
    setExtraAnswers({});
  };

  const handleFileSelect = (view, file) => {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [view]: file }));
    setPreviews((prev) => {
      if (prev[view]) URL.revokeObjectURL(prev[view]);
      return { ...prev, [view]: URL.createObjectURL(file) };
    });
  };

  const removePhoto = (view) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[view];
      return next;
    });
    setPreviews((prev) => {
      if (prev[view]) URL.revokeObjectURL(prev[view]);
      const next = { ...prev };
      delete next[view];
      return next;
    });
  };

  const allViewsSelected = requiredViews.every((view) => files[view]);
  const needsSubcategoryPick = subcategories.length > 1 && !subcategory;

  const pollStatus = async () => {
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const status = await apiFetch(`/api/grading/p2p/${productId}/status`);
      setStatusText(`${status.status} — ${status.progress}%`);
      if (status.status === 'COMPLETED') return { ok: true };
      if (status.status === 'FAILED') return { ok: false, failureReason: status.failureReason };
    }
    return { ok: false, failureReason: 'Grading is taking longer than expected. Please try again.' };
  };

  const handleSubmit = async () => {
    setPhase('uploading');
    setStatusText('SUBMITTING PHOTOS — 10%');
    setFailureReason('');
    try {
      const form = new FormData();
      requiredViews.forEach((view) => form.append(view, files[view]));
      if (subcategory) form.append('subcategory', subcategory);

      const filteredAnswers = {};
      Object.entries(answers).forEach(([key, val]) => {
        if (val) filteredAnswers[key] = val;
      });
      if (Object.keys(filteredAnswers).length > 0) {
        form.append('conditionAnswers', JSON.stringify(filteredAnswers));
      }

      const filteredExtra = {};
      Object.entries(extraAnswers).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') filteredExtra[key] = val;
      });
      if (Object.keys(filteredExtra).length > 0) {
        form.append('extraAnswers', JSON.stringify(filteredExtra));
      }

      const submitResult = await apiFetch(`/api/grading/p2p/${productId}/submit`, {
        method: 'POST',
        body: form,
      });

      if (submitResult.status === 'FAILED') {
        setFailureReason(submitResult.failureReason || 'Photo quality check failed.');
        setPhase('failed');
        return;
      }

      setPhase('analyzing');
      setStatusText('ANALYZING — 60%');
      const result = await pollStatus();

      if (!result.ok) {
        setFailureReason(result.failureReason || 'Grading failed. Please try again.');
        setPhase('failed');
        return;
      }

      const resultBody = await apiFetch(`/api/grading/p2p/${productId}/result`);
      setAiReport(resultBody.report);
      setPhase('completed');
    } catch (err) {
      setFailureReason(err.message || 'Failed to reach the grading service.');
      setPhase('failed');
    }
  };

  const mapGradeToCondition = (grade) => {
    if (!grade) return 'Good';
    const g = grade.toUpperCase();
    if (g.startsWith('A+')) return 'New (Sealed)';
    if (g.startsWith('A')) return 'Like New';
    if (g.startsWith('B')) return 'Very Good';
    if (g.startsWith('C')) return 'Good';
    if (g.startsWith('D')) return 'Acceptable';
    return 'Unsalvageable';
  };

  if (phase === 'completed' && aiReport) {
    return (
      <div className="space-y-6 py-2 flex flex-col items-center text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[64px] text-green-500">verified_user</span>
          <h3 className="text-base font-bold text-slate-800 font-sans">AI Verification Successful!</h3>
          <p className="text-xs text-slate-500 max-w-[384px] text-center">
            We analyzed your {requiredViews.length} photos and graded this listing.
          </p>
        </div>

        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-3 text-left w-full max-w-[448px]">
          <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
            <span className="text-xs text-slate-600 font-semibold">Assigned Quality Grade:</span>
            <span className="bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded shadow-sm">
              GRADE {aiReport.grade}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
            <span className="text-xs text-slate-600 font-semibold">Condition Rating:</span>
            <span className="text-xs font-extrabold text-slate-800">{mapGradeToCondition(aiReport.grade)}</span>
          </div>

          {aiReport.damages && aiReport.damages.length > 0 ? (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-sans">Detected Flaws / Damages:</span>
              <ul className="list-disc list-inside text-xs text-slate-650 space-y-1">
                {aiReport.damages.map((d, idx) => (
                  <li key={idx}>
                    <span className="font-bold text-slate-800">{d.defect_type || d.type}</span>: {d.description || d.desc}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-emerald-650">check_circle</span>
              No physical defects detected! Perfect condition.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2 w-full max-w-[448px]">
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow"
          >
            Continue to Shipping
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="space-y-4 flex flex-col items-center text-center py-6">
        <span className="material-symbols-outlined text-[64px] text-red-500">warning</span>
        <h3 className="text-base font-bold text-slate-800 font-sans">Inspection Rejected</h3>
        <p className="text-xs font-semibold text-red-650 max-w-[384px] text-center w-full bg-red-50 border border-red-200 rounded-lg p-3">
          {failureReason}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 border border-slate-300 rounded-lg font-bold text-xs text-slate-650 hover:bg-slate-100 cursor-pointer"
          >
            Edit Listing Details
          </button>
          <button
            type="button"
            onClick={() => setPhase('form')}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Retake Photos / Change Answers
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'uploading' || phase === 'analyzing') {
    return (
      <div className="space-y-4 py-10 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-[64px] text-orange-500 animate-spin">sync</span>
        <h3 className="text-base font-bold text-slate-800 font-sans">AI Vision Inspection in Progress</h3>
        <p className="text-xs text-slate-500 max-w-[384px] text-center">
          Our Computer Vision engine is evaluating your {requiredViews.length} photos for category verification and physical defects.
        </p>
        <p className="text-xs font-semibold text-slate-600">{statusText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 text-left">
      <div>
        <h3 className="text-sm font-bold text-slate-800 font-sans mb-1">AI Photo Inspection</h3>
        <p className="text-xs text-slate-500">
          Upload every angle our AI needs and answer a few quick questions — this is how buyers know the real condition of your item before they message you.
        </p>
      </div>

      {subcategories.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">What kind of item is this?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subcategories.map((s) => (
              <label
                key={s.key}
                className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-xs font-semibold ${
                  subcategory === s.key ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="subcategory"
                  checked={subcategory === s.key}
                  onChange={() => handleSubcategoryChange(s.key)}
                  className="accent-orange-500"
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {!needsSubcategoryPick && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Photos ({Object.keys(files).length}/{requiredViews.length})
              </label>
              <span className="text-[10px] text-slate-400">Clear photos = a faster, higher grade</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {requiredViews.map((view) => (
                <div key={view} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[view]?.click()}
                    className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-orange-400 transition-colors cursor-pointer flex flex-col items-center justify-center"
                  >
                    {previews[view] ? (
                      <img className="w-full h-full object-cover" alt={`${viewLabel(view)} preview`} src={previews[view]} />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-slate-400 text-[22px]">add_a_photo</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">Required</span>
                      </>
                    )}
                    {previews[view] && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(view);
                        }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 text-[10px] material-symbols-outlined cursor-pointer hover:bg-black"
                      >
                        close
                      </span>
                    )}
                  </button>
                  <input
                    ref={(el) => (fileInputRefs.current[view] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(view, e.target.files?.[0])}
                  />
                  <span className="text-[10px] font-bold text-slate-600 text-center">{viewLabel(view)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">A few quick questions</label>
            {sellQuestions.map((q) => {
              const current = answers[q.key];
              return (
                <div key={q.key} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-700">{q.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ANSWER_OPTIONS.map((opt) => {
                      const optLabel = opt.val === 'yes' ? q.good : opt.val === 'partial' ? q.medium : q.bad;
                      const active = current === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt.val }))}
                          className={`px-2.5 h-7 rounded-md text-[10px] font-bold border cursor-pointer transition-colors ${
                            active ? opt.tone : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {optLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedLeaf && selectedLeaf.conditionQuestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Extra details for this item type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedLeaf.conditionQuestions.map((q) => (
                  <div key={q.key} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500">{q.label}</label>
                    {q.type === 'boolean' ? (
                      <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 w-fit">
                        {['Yes', 'No'].map((opt) => {
                          const val = opt === 'Yes';
                          const active = extraAnswers[q.key] === val;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setExtraAnswers((prev) => ({ ...prev, [q.key]: val }))}
                              className={`px-3 h-7 rounded-md text-[10px] font-bold cursor-pointer ${
                                active ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={extraAnswers[q.key] ?? ''}
                        onChange={(e) => setExtraAnswers((prev) => ({ ...prev, [q.key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-orange-400 w-full max-w-[140px]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-xs text-slate-650 hover:bg-slate-100 cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={needsSubcategoryPick || !allViewsSelected}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold text-xs hover:bg-orange-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit for AI Grading
        </button>
      </div>
    </div>
  );
}

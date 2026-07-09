import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../../services/api';

const FRONT_BACK_ONLY_CATEGORIES = ['APPAREL', 'BOOKS'];
const ALL_VIEWS = ['front', 'back', 'left', 'right', 'top', 'bottom'];

const QUESTION_MAPPING = {
  electronics: [
    { key: 'coreFunction', label: "Does it turn on and work properly?", good: "Works fully", medium: "Turns on, but something doesn't work", bad: "Does not turn on" },
    { key: 'completeness', label: "Do you have everything that came in the box? (charger, cable, etc.)", good: "Have everything", medium: "Small thing missing (like manual)", bad: "Charger or main part missing" },
    { key: 'structure', label: "Is anything broken or cracked?", good: "Nothing broken", medium: "Small crack, still works", bad: "Screen or body broken" },
    { key: 'usage', label: "Did you use it?", good: "Never used", medium: "Used 1-2 times", bad: "Used a lot" },
    { key: 'originality', label: "Did anyone open or repair it?", good: "Never opened", medium: "Seal broken, but no repair", bad: "Yes, it was repaired" }
  ],
  apparel: [
    { key: 'coreFunction', label: "Can you still wear it? (zip, buttons, sole are fine)", good: "Yes, fully", medium: "One small problem, but can wear", bad: "Cannot wear it" },
    { key: 'completeness', label: "Do you have everything? (both shoes, belt, laces)", good: "Have everything", medium: "Extra buttons/bag missing", bad: "One shoe or main piece missing" },
    { key: 'structure', label: "Is there any tear, hole, or broken part?", good: "No tear", medium: "Small loose thread", bad: "Torn or broken" },
    { key: 'usage', label: "Did you wear or wash it?", good: "Never wore it", medium: "Tried once", bad: "Wore or washed it" },
    { key: 'originality', label: "Are the price tags still on it? Did you change anything?", good: "Tags still on", medium: "Tags removed, nothing changed", bad: "Tags gone and item changed" }
  ],
  books: [
    { key: 'coreFunction', label: "Can you read all the pages?", good: "All pages fine", medium: "Few pages folded, still readable", bad: "Pages missing or can't read" },
    { key: 'completeness', label: "Do you have everything? (cover, CD, code)", good: "Have everything", medium: "Paper cover missing", bad: "Code used or CD missing" },
    { key: 'structure', label: "Are pages falling out? Is the spine broken?", good: "Book is strong", medium: "Spine has lines, pages okay", bad: "Pages falling out" },
    { key: 'usage', label: "Did you write, mark, or fold anything in it?", good: "Clean book", medium: "Small pencil marks", bad: "Lots of writing or stains" },
    { key: 'originality', label: "Is it the original book? Still sealed?", good: "Sealed / original", medium: "Opened, but original", bad: "Photocopy / fake" }
  ],
  home: [
    { key: 'coreFunction', label: "Does it work properly?", good: "Works fully", medium: "A bit tight or hard to use", bad: "Does not work / broken" },
    { key: 'completeness', label: "Do you have all the parts? (lid, screws, handle)", good: "All parts here", medium: "Extra part missing", bad: "Main part missing" },
    { key: 'structure', label: "Is it bent, cracked, or dented?", good: "No damage", medium: "Small dent, still works", bad: "Bent or cracked" },
    { key: 'usage', label: "Is there any rust or dirt on it? Did you use it?", good: "New, no rust", medium: "Small marks, can be cleaned", bad: "Rusty or burnt" },
    { key: 'originality', label: "Did anyone repair, paint, or change it?", good: "Original, untouched", medium: "Paint scratched, no repair", bad: "Repaired or parts changed" }
  ]
};

const getCategoryQuestionsList = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.startsWith('electronics') || cat.startsWith('accessories')) return QUESTION_MAPPING.electronics;
  if (cat.startsWith('apparel')) return QUESTION_MAPPING.apparel;
  if (cat.startsWith('books')) return QUESTION_MAPPING.books;
  if (cat.startsWith('home')) return QUESTION_MAPPING.home;
  return QUESTION_MAPPING.electronics;
};

const BASE_VIEW_LABELS = {
  front: 'Front',
  back: 'Back',
  left: 'Left side',
  right: 'Right side',
  top: 'Top',
  bottom: 'Bottom',
};

// Subcategory taxonomy (from Backend, via GET /api/config/subcategories)
// takes priority when it has an entry for this item's category+subcategory;
// otherwise falls back to today's flat 2-bucket category-level behavior.
function getRequiredFields(category, subcategory, subcategoryTaxonomy) {
  const bucket = subcategoryTaxonomy?.[(category || '').toUpperCase()];
  const leaf = bucket?.subcategories?.find((s) => s.key === subcategory);
  if (leaf) return { fields: leaf.requiredViews, labels: leaf.viewLabels || {} };

  const fields = FRONT_BACK_ONLY_CATEGORIES.includes((category || '').toUpperCase())
    ? ['front', 'back']
    : ALL_VIEWS;
  return { fields, labels: {} };
}

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 100; // ~250s ceiling — covers the rare band-edge re-run (N=1 -> N=3) on CPU-only inference, while staying under AI1's 300s stuck-request sweeper

export default function GuidedPhotoCapture({ activeReturn, returnState, setReturnState, subcategoryTaxonomy, onNext, onBack }) {
  const { fields: requiredViews, labels: viewLabelOverrides } = getRequiredFields(
    activeReturn.category,
    returnState.subcategory,
    subcategoryTaxonomy
  );
  const viewLabel = (field) => viewLabelOverrides[field] || BASE_VIEW_LABELS[field] || field;
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [phase, setPhase] = useState('capture'); // 'capture' | 'questions' | 'uploading' | 'analyzing' | 'failed'
  const [statusText, setStatusText] = useState('');
  const [failureReason, setFailureReason] = useState('');
  // Distinguishes a real AI-driven photo rejection ('quality') from the
  // grading service being unreachable/slow ('service') — the two look
  // identical in a bare error string but need very different messaging,
  // since only one of them means the photos themselves are the problem.
  const [failureKind, setFailureKind] = useState('quality');
  const [answers, setAnswers] = useState({
    coreFunction: null,
    completeness: null,
    structure: null,
    usage: null,
    originality: null,
  });
  const fileInputRefs = useRef({});
  const previewsRef = useRef({});

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Revoke every remaining blob URL only on unmount — not on every selection,
  // which would revoke previews still being displayed on screen.
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const allViewsSelected = requiredViews.every((view) => files[view]);

  const handleFileSelect = (view, file) => {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [view]: file }));
    setPreviews((prev) => {
      if (prev[view]) URL.revokeObjectURL(prev[view]);
      return { ...prev, [view]: URL.createObjectURL(file) };
    });
  };

  const pollStatus = async () => {
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const status = await apiFetch(`/api/grading/${activeReturn.id}/status`);
      setStatusText(`${status.status} — ${status.progress}%`);
      if (status.status === 'COMPLETED') return { ok: true };
      if (status.status === 'FAILED') return { ok: false, kind: 'quality', failureReason: status.failureReason };
    }
    return { ok: false, kind: 'service', failureReason: 'Grading is taking longer than expected. Please try again.' };
  };

  const handleSubmit = async (skipAll = false) => {
    setPhase('uploading');
    setFailureReason('');
    setFailureKind('quality');
    try {
      const form = new FormData();
      requiredViews.forEach((view) => form.append(view, files[view]));
      // The subcategory chosen back on the Item Details step only lives in
      // this wizard's in-memory returnState — it was never persisted to the
      // Return row, so the backend must be told here or it falls back to
      // the generic (and broader) category and expects views we never asked for.
      if (returnState.subcategory) form.append('subcategory', returnState.subcategory);

      if (!skipAll) {
        const filteredAnswers = {};
        Object.entries(answers).forEach(([key, val]) => {
          if (val !== null) {
            filteredAnswers[key] = val;
          }
        });
        if (Object.keys(filteredAnswers).length > 0) {
          form.append('conditionAnswers', JSON.stringify(filteredAnswers));
        }
      }

      const submitResult = await apiFetch(`/api/grading/${activeReturn.id}/submit`, {
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
        setFailureKind(result.kind || 'quality');
        setFailureReason(result.failureReason || 'Grading failed. Please try again.');
        setPhase('failed');
        return;
      }

      const resultBody = await apiFetch(`/api/grading/${activeReturn.id}/result`);
      setReturnState((prev) => ({
        ...prev,
        aiReport: { ...resultBody.report, images: resultBody.images },
        photos: requiredViews,
      }));
      onNext();
    } catch (err) {
      setFailureKind('service');
      setFailureReason(err.message || 'Failed to reach the grading service.');
      setPhase('failed');
    }
  };

  const handleRetake = () => {
    setFiles({});
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    setPreviews({});
    setPhase('capture');
    setFailureReason('');
  };

  return (
    <div className="max-w-[672px] w-full flex flex-col items-center text-center mx-auto relative text-left">
      {/* Progress Stepper */}
      <div className="w-full mb-xl">
        <div className="flex items-center justify-between mb-xs">
          <span className="font-label-bold text-label-bold text-primary font-bold text-xs uppercase">Step 3 of 5</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">Photo Evidence</span>
        </div>
        <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-primary-container w-[60%] rounded-full"></div>
        </div>
      </div>

      <h1 className="font-display-md text-display-md mb-sm text-on-surface font-bold text-2xl text-center w-full">
        Upload photos of your {activeReturn.itemName}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-xl text-sm text-center w-full">
        We need {requiredViews.length} photo{requiredViews.length === 1 ? '' : 's'} to fully assess condition: {requiredViews.map(viewLabel).join(', ')}.
      </p>

      {(phase === 'capture' || phase === 'failed') && (
        <>
          {phase === 'failed' && (
            <div className="w-full bg-error-container/20 border border-error/30 rounded-lg p-md mb-lg flex items-start gap-md">
              <span className="material-symbols-outlined text-error mt-0.5">
                {failureKind === 'service' ? 'cloud_off' : 'error'}
              </span>
              <div>
                <p className="font-label-bold text-label-bold text-error">
                  {failureKind === 'service'
                    ? "Couldn't reach the grading service"
                    : (failureReason.toLowerCase().includes('mismatch')
                        ? "Category Mismatch Detected"
                        : "Photos didn't pass the quality check")
                  }
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">{failureReason}</p>
                {failureKind === 'service' && (
                  <p className="text-label-sm text-on-surface-variant mt-1">This isn't a problem with your photos — please try again in a moment.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-md w-full mb-xl">
            {requiredViews.map((view) => (
              <div key={view} className="flex flex-col gap-xs">
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[view]?.click()}
                  className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-outline-variant bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex flex-col items-center justify-center"
                >
                  {previews[view] ? (
                    <img className="w-full h-full object-cover" alt={`${viewLabel(view)} preview`} src={previews[view]} />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-on-surface-variant text-[32px]">add_a_photo</span>
                      <span className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-wide">Required</span>
                    </>
                  )}
                </button>
                <input
                  ref={(el) => (fileInputRefs.current[view] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(view, e.target.files?.[0])}
                />
                <span className="font-label-bold text-label-bold text-on-surface text-xs text-center">{viewLabel(view)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {(phase === 'uploading' || phase === 'analyzing') && (
        <div className="w-full aspect-[3/2] bg-black rounded-xl overflow-hidden shadow-lg mb-xl flex flex-col items-center justify-center p-lg">
          <div className="w-16 h-16 border-4 border-secondary-container border-t-transparent rounded-full animate-spin mb-md"></div>
          <p className="font-headline-sm text-headline-sm text-white mb-2">
            {phase === 'uploading' ? 'Uploading photos...' : 'AI Assessment in Progress'}
          </p>
          <p className="text-secondary-container font-label-bold tracking-wider animate-pulse">{statusText}</p>
        </div>
      )}

      {phase === 'questions' && (
        <div className="w-full flex flex-col gap-lg text-left animate-fade-in">
          <h1 className="font-display-md text-display-md mb-sm text-on-surface font-bold text-2xl text-center w-full">
            Just a few quick questions
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-xl text-sm text-center w-full">
            Help us verify details that photos can't show to process your return faster.
          </p>

          <div className="flex flex-col gap-md w-full mb-xl">
            {getCategoryQuestionsList(activeReturn.category).map((q) => {
              const currentValue = answers[q.key];
              return (
                <div key={q.key} className="bg-white border border-outline-variant rounded-xl p-md flex flex-col gap-md shadow-sm">
                  <span className="font-body-lg text-body-lg text-on-surface text-sm font-medium leading-relaxed w-full">
                    {q.label}
                  </span>
                  <div className="flex flex-wrap gap-xs w-full border-t border-outline-variant/20 pt-md">
                    {[
                      { val: 'yes', label: q.good, class: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' },
                      { val: 'partial', label: q.medium, class: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' },
                      { val: 'no', label: q.bad, class: 'bg-red-500 hover:bg-red-600 text-white border-red-500' },
                    ].map((opt) => {
                      const active = currentValue === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setAnswers(prev => ({ ...prev, [q.key]: opt.val }))}
                          className={`px-md h-9 rounded-md font-label-bold text-xs transition-colors border cursor-pointer ${
                            active 
                              ? opt.class 
                              : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.key]: null }))}
                      className={`px-md h-9 rounded-md font-label-bold text-xs transition-colors border border-outline-variant cursor-pointer ${
                        currentValue === null
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions for Questions Phase */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-md mt-sm border-t border-outline-variant pt-md">
            <button
              className="text-on-surface hover:underline font-body-md text-body-md cursor-pointer"
              type="button"
              onClick={() => setPhase('capture')}
            >
              Back to Photos
            </button>
            <div className="flex flex-col sm:flex-row gap-md w-full sm:w-auto">
              <button
                onClick={() => handleSubmit(true)}
                className="w-full sm:w-auto px-lg py-md border border-outline-variant hover:bg-surface-container-low font-label-bold text-label-bold rounded-lg transition-all cursor-pointer text-sm"
              >
                Skip All
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="w-full sm:w-auto px-xl py-md bg-secondary-container text-on-secondary-fixed font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-all cursor-pointer text-sm font-bold shadow-sm"
              >
                Submit for AI Grading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      {phase !== 'questions' && (
        <div className="w-full flex items-center justify-between px-md mt-sm">
          <button
            className="text-on-surface hover:underline font-body-md text-body-md"
            type="button"
            onClick={onBack}
            disabled={phase === 'uploading' || phase === 'analyzing'}
          >
            Back
          </button>
          {phase === 'failed' ? (
            <button
              onClick={handleRetake}
              className="px-xl py-md bg-secondary-container text-on-secondary-fixed font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
            >
              Retake Photos
            </button>
          ) : (
            <button
              onClick={() => setPhase('questions')}
              disabled={!allViewsSelected || phase === 'uploading' || phase === 'analyzing'}
              className={`px-xl py-md font-label-bold text-label-bold rounded-lg transition-all ${
                allViewsSelected && phase === 'capture'
                  ? 'bg-secondary-container text-on-secondary-fixed hover:opacity-90 cursor-pointer'
                  : 'bg-secondary-container/50 text-on-secondary-fixed/50 cursor-not-allowed'
              }`}
            >
              {phase === 'capture' ? 'Continue to Questions' : 'Processing...'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

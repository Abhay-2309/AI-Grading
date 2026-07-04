import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../../services/api';

// Mirrors AI1's GRADE_VALUES (src/schemas/grading-report.schema.ts) — KEEP IN SYNC.
const GRADE_VALUES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];

// Reasons that don't inherently imply the item itself is damaged.
const NON_DAMAGE_REASONS = ['wrong_item', 'no_longer_needed', 'mismatch'];

export default function ItemVerification({ activeReturn, onSubmit, onBack }) {
  const defects = activeReturn.defects || [];
  const isNonDamageReason = NON_DAMAGE_REASONS.includes(activeReturn.reason);
  const aiFlaggedConcern = activeReturn.aiNotesContradict || activeReturn.aiRequiresHumanReview;
  // Fast-path only when reason, AI defect count, AND AI's own contradiction/
  // review flags all agree the item is clean — any one signal disagreeing
  // sends it to the full checklist.
  const isSimpleEligible = isNonDamageReason && defects.length === 0 && !aiFlaggedConcern;

  const [mode, setMode] = useState(isSimpleEligible ? 'simple' : 'full');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState(null);
  const cameraInputRef = useRef(null);

  // Stage 1 reference photo — the customer's actual AI-grading capture,
  // fetched fresh each time since AI1 never stores S3 URLs (they're
  // presigned and expire); falls back to the catalog image if no grading
  // request was ever made for this return (e.g. legacy/demo data).
  const [stage1Loading, setStage1Loading] = useState(true);
  const [stage1Photo, setStage1Photo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStage1Loading(true);
    setStage1Photo(null);
    apiFetch(`/api/grading/${activeReturn.id}/result`)
      .then((body) => {
        if (cancelled) return;
        const images = body?.images || [];
        const preferred =
          images.find((img) => img.view?.toLowerCase() === 'front') || images[0];
        if (preferred) {
          setStage1Photo({
            url: preferred.thumbnailUrl || preferred.originalUrl,
            view: preferred.view,
          });
        }
      })
      .catch(() => {
        // No grading request on file for this return (or AI1 unreachable) —
        // the fallback to activeReturn.imgUrl below covers this.
      })
      .finally(() => {
        if (!cancelled) setStage1Loading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeReturn.id]);

  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    };
  }, [capturedPreviewUrl]);

  // Full-checklist state
  const [defectVerdicts, setDefectVerdicts] = useState(() =>
    Object.fromEntries(defects.map((_, idx) => [idx, 'confirmed']))
  );
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [finalGrade, setFinalGrade] = useState(activeReturn.userGrade || GRADE_VALUES[GRADE_VALUES.length - 1]);

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraFileSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow retaking the same file again later
    if (!file) return;
    setIsCapturing(true);
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    const url = URL.createObjectURL(file);
    // Brief processing beat so the capture doesn't feel instantaneous/fake —
    // the photo itself is real, taken from the device camera or file picker.
    setTimeout(() => {
      setCapturedPreviewUrl(url);
      setIsCapturing(false);
      setPhotoTaken(true);
    }, 400);
  };

  const handleRetakePhoto = () => {
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    setCapturedPreviewUrl(null);
    setPhotoTaken(false);
  };

  const handlePass = () => {
    onSubmit({ agentGrade: activeReturn.userGrade, agentDefects: '', isConflict: false });
  };

  const handleFail = () => {
    // The agent found something despite the AI/reason suggesting a clean
    // item — drop into the full checklist so they can describe it and pick
    // a real grade, rather than a bare rejection with no record.
    setMode('full');
  };

  const handleFullSubmit = (e) => {
    e.preventDefault();
    const confirmedParts = defects
      .filter((_, idx) => defectVerdicts[idx] === 'confirmed')
      .map((d) => `${d.type} (${d.severity}, ${d.view}): ${d.description}`);
    const deniedCount = defects.filter((_, idx) => defectVerdicts[idx] === 'not_present').length;

    const agentDefects = [
      ...confirmedParts,
      deniedCount > 0 ? `${deniedCount} AI-reported defect(s) not confirmed on physical inspection.` : null,
      additionalNotes ? `Additional: ${additionalNotes}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    onSubmit({
      agentGrade: finalGrade,
      agentDefects: agentDefects || 'No defects found on physical inspection.',
      isConflict: finalGrade !== activeReturn.userGrade,
    });
  };

  return (
    <div className="max-w-[896px] mx-auto px-margin-mobile py-stack-lg text-left">
      <h2 className="font-headline-lg text-headline-lg text-primary font-bold mb-md">Verify Return Item</h2>
      <p className="font-body-md text-on-surface-variant mb-xl">
        {mode === 'simple'
          ? "AI grading found no issues and the customer's stated reason isn't damage-related — just confirm the photo matches."
          : "Verify camera condition against the customer's AI-detected defects."}
      </p>

      {/* Comparison Section */}
      <section className="grid grid-cols-2 gap-gutter h-64 md:h-80 mb-lg">
        <div className="relative group rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low">
          <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded tracking-widest">
            {stage1Photo ? `Stage 1 Reference — ${stage1Photo.view}` : 'Stage 1 Reference'}
          </div>
          {stage1Loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-on-surface-variant">Loading customer photo...</span>
            </div>
          ) : (
            <img
              className="w-full h-full object-cover"
              alt="Customer photo reference"
              src={stage1Photo?.url || activeReturn.imgUrl}
            />
          )}
          {!stage1Loading && !stage1Photo && (
            <div className="absolute bottom-2 left-2 right-2 bg-amber-600/90 text-white text-[10px] px-2 py-1 rounded">
              No AI-grading capture on file — showing catalog photo instead.
            </div>
          )}
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraFileSelected}
        />

        {isCapturing ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant bg-surface-container-low rounded-xl p-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="font-label-lg text-primary text-center">Processing photo...</span>
          </div>
        ) : photoTaken ? (
          <div className="relative rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low">
            <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded tracking-widest">
              Agent Capture
            </div>
            <img
              className="w-full h-full object-cover"
              alt="Agent capture photo"
              src={capturedPreviewUrl}
            />
            <button
              onClick={handleRetakePhoto}
              className="absolute bottom-2 right-2 bg-black/60 hover:bg-black text-white text-xs py-1 px-2 rounded flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span> Retake
            </button>
          </div>
        ) : (
          <button
            onClick={handleTakePhoto}
            className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all rounded-xl p-4 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-4 text-on-primary shadow-lg">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            </div>
            <span className="font-label-lg text-label-lg text-primary text-center">Take comparison photo</span>
            <span className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-tight">Required for Verification</span>
          </button>
        )}
      </section>

      {/* AI Readout Card */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-md flex items-center justify-between mb-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface-container-high rounded-lg">
            <span className="material-symbols-outlined text-primary">analytics</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase text-xs">Stage 1 AI Grade</p>
            <p className="font-headline-md text-headline-md text-primary font-semibold">
              {activeReturn.userGrade} — {defects.length === 0 ? 'No defects detected' : `${defects.length} defect(s) detected`}
            </p>
          </div>
        </div>
        <div className="hidden md:block px-3 py-1 bg-surface-container-high rounded border border-outline-variant text-on-surface-variant font-label-md">
          Non-Editable
        </div>
      </section>

      {mode === 'simple' ? (
        <div className="space-y-stack-lg">
          <div className="bg-secondary-fixed/20 border border-secondary-fixed-dim rounded-xl p-md flex items-start gap-md">
            <span className="material-symbols-outlined text-secondary mt-0.5">bolt</span>
            <p className="text-body-md text-on-secondary-fixed-variant">
              Fast-path verification: customer's reason ("{activeReturn.reason}") and AI grading both indicate a clean
              item. Confirm the photo matches and this routes straight to the warehouse at the AI's grade.
            </p>
          </div>

          <div className="pt-xl flex gap-md justify-between items-center">
            <button type="button" onClick={onBack} className="px-xl py-3 border-2 border-outline-variant hover:bg-surface-container font-bold rounded-xl cursor-pointer text-on-surface">
              Back
            </button>
            <div className="flex gap-md flex-grow justify-end">
              <button
                type="button"
                disabled={!photoTaken}
                onClick={handleFail}
                className={`px-xl h-14 font-bold rounded-xl border-2 transition-all ${
                  photoTaken ? 'border-error text-error hover:bg-error-container/20 cursor-pointer' : 'border-outline-variant text-on-surface-variant/50 cursor-not-allowed'
                }`}
              >
                Fail — Found Damage
              </button>
              <button
                type="button"
                disabled={!photoTaken}
                onClick={handlePass}
                className={`px-xl h-14 font-bold rounded-xl flex items-center gap-2 transition-all ${
                  photoTaken ? 'bg-primary text-white hover:opacity-90 cursor-pointer' : 'bg-primary/50 text-white/50 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined">verified</span>
                Pass — Send to Warehouse
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFullSubmit} className="space-y-stack-lg">
          {defects.length > 0 && (
            <div className="space-y-stack-sm">
              <label className="font-label-lg text-label-lg text-primary flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-sm">fact_check</span>
                Verify each AI-detected defect
              </label>
              <div className="flex flex-col gap-sm">
                {defects.map((d, idx) => (
                  <div key={idx} className="border border-outline-variant rounded-xl p-md flex items-start justify-between gap-md">
                    <div>
                      <p className="font-label-bold text-label-bold text-on-surface">{d.type} — {d.severity} ({d.view})</p>
                      <p className="text-label-sm text-on-surface-variant">{d.description}</p>
                    </div>
                    <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant shrink-0">
                      {[
                        { key: 'confirmed', label: 'Confirmed' },
                        { key: 'not_present', label: 'Not Present' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setDefectVerdicts((prev) => ({ ...prev, [idx]: opt.key }))}
                          className={`px-md h-9 rounded-md font-label-bold text-xs transition-colors cursor-pointer ${
                            defectVerdicts[idx] === opt.key ? 'bg-primary-container text-white' : 'text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-stack-sm">
            <label className="font-label-lg text-label-lg text-primary flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-sm">edit_note</span>
              {defects.length > 0 ? 'Additional defects not caught by AI (optional)' : 'What did you find?'}
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full min-h-[100px] bg-white border-2 border-outline-variant focus:border-primary rounded-xl p-4 font-body-md text-on-surface outline-none"
              placeholder="Describe any damage found on physical inspection..."
            />
          </div>

          <div className="space-y-stack-sm">
            <label className="font-label-lg text-label-lg text-primary flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-sm">grade</span>
              Final Grade
            </label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-base">
              {GRADE_VALUES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFinalGrade(g)}
                  className={`h-touch-target-min rounded-xl border flex items-center justify-center font-label-lg transition-all cursor-pointer ${
                    finalGrade === g
                      ? 'border-2 border-primary bg-primary-container text-white font-bold'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {finalGrade !== activeReturn.userGrade && (
              <p className="text-label-sm text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                Differs from AI grade ({activeReturn.userGrade}) — will be routed to Manual Review.
              </p>
            )}
          </div>

          <div className="pt-xl flex gap-md justify-between items-center">
            <button type="button" onClick={onBack} className="px-xl py-3 border-2 border-outline-variant hover:bg-surface-container font-bold rounded-xl cursor-pointer text-on-surface">
              Back
            </button>
            <button
              type="submit"
              disabled={!photoTaken}
              className={`flex-grow h-[56px] font-bold rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-xl ${
                photoTaken ? 'bg-primary text-white cursor-pointer hover:opacity-90' : 'bg-primary/50 text-white/50 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="material-symbols-outlined">verified</span>
              Submit Verification
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

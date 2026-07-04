import React from 'react';
import { formatINR } from '../../../services/currency';

const CONDITION_LABELS = {
  New: 'New',
  Excellent: 'Excellent Condition',
  Good: 'Good, Minor Wear',
  Fair: 'Fair, Visible Wear',
  Poor: 'Poor Condition',
  Unusable: 'Unusable',
};

// overallScore already reflects grade caps/ceilings from AI1's rules engine —
// floor at 50% so even an F-grade item gets some salvage value estimate.
function estimateRefundMultiplier(overallScore) {
  return Math.max(0.5, overallScore / 100);
}

export default function AiGrading({ activeReturn, returnState, onNext, onBack }) {
  const report = returnState?.aiReport;

  if (!report) {
    return (
      <div className="max-w-[576px] mx-auto text-center py-2xl">
        <span className="material-symbols-outlined text-error text-[48px] mb-md">error_outline</span>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-sm">No grading report available</h1>
        <p className="text-on-surface-variant mb-lg">Please go back and submit photos for AI grading first.</p>
        <button
          onClick={onBack}
          className="px-xl py-md bg-secondary-container text-on-secondary-fixed font-label-bold rounded-lg cursor-pointer"
        >
          Back to Photo Capture
        </button>
      </div>
    );
  }

  const estimatedRefund = activeReturn.price * estimateRefundMultiplier(report.overallScore);

  const annotatedThumbnails = (report.images || []).map((img) => ({
    view: img.view,
    url: img.thumbnailUrl || img.originalUrl,
    damages: report.damages.filter((d) => d.view.toLowerCase() === img.view.toLowerCase()),
  }));

  const showMismatchNotice = report.notesContradictImages || report.mismatchFlag;
  const showReviewBadge = report.requiresHumanReview;
  const reviewReasonLabels = {
    wrong_item_suspected: 'Wrong Item Suspected',
    evidence_mismatch: 'Evidence Mismatch (Fraud Check)',
    insufficient_evidence: 'Insufficient Evidence',
    low_confidence: 'Low Confidence Assessment',
    partial_detection: 'Partial Image Detection',
    band_edge: 'Borderline Grade Review',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
      {/* Main Assessment Content */}
      <div className="lg:col-span-8 flex flex-col gap-lg">
        {/* Result Header Card */}
        <div className="bg-white border border-outline-variant rounded-xl p-lg">
          {showReviewBadge && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-md text-left text-sm mb-md flex items-start gap-md">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
              <div>
                <p className="font-bold">Pending Logistics Verification ({reviewReasonLabels[report.humanReviewReason] || report.humanReviewReason || 'Standard Review'})</p>
                <p className="text-xs text-amber-800 mt-1">
                  {report.humanReviewReason === 'evidence_mismatch'
                    ? 'A significant gap exists between photo evidence and reported condition answers. Field agent verification is required.'
                    : report.humanReviewReason === 'wrong_item_suspected'
                    ? 'The uploaded item photos do not match the expected product category. Item flagged for suspected wrong item fraud.'
                    : report.humanReviewReason === 'insufficient_evidence'
                    ? 'Low-quality photos were submitted without confirming the condition questions. Manual review will be performed.'
                    : 'Standard quality assurance flags were triggered (e.g. edge score or low model confidence). Refund will be processed normally after field check.'}
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-md">
            <h1 className="font-display-lg text-display-lg text-on-surface">Grading Assessment Complete</h1>
            <div className="flex flex-wrap items-center gap-sm">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-md py-1 rounded-full font-label-bold text-label-bold">
                Grade {report.grade} — {CONDITION_LABELS[report.condition] || report.condition}
              </span>
              <span className="bg-surface-container-high text-on-surface-variant px-sm py-1 rounded-full text-label-sm font-label-sm border border-outline-variant">
                {Math.round(report.overallConfidence * 100)}% AI Confidence
              </span>
            </div>
          </div>
          <p className="text-on-surface-variant font-body-lg text-body-lg text-left">
            {report.summary}
          </p>
        </div>

        {/* Evidence Breakdown Card */}
        <div className="bg-white border border-outline-variant rounded-xl p-lg text-left">
          <h2 className="font-headline-sm text-headline-sm mb-md flex items-center gap-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary">balance</span>
            Deterministic Evidence Blend
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
            {/* Vision Channel */}
            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
              <span className="font-label-bold text-label-bold block text-on-surface text-xs font-bold">Vision Channel</span>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-display-md text-on-surface font-bold text-lg">{report.visionScore ?? 100}</span>
                <span className="text-label-sm text-on-surface-variant font-medium text-xs">/ 100</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-primary-container h-full rounded-full" 
                  style={{ width: `${report.visionScore ?? 100}%` }}
                />
              </div>
              <span className="text-[10px] text-on-surface-variant mt-2 block">
                Photo Quality Trust (w): {Math.round((report.blendWeight ?? 0.9) * 100)}%
              </span>
            </div>

            {/* Reason Channel */}
            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
              <span className="font-label-bold text-label-bold block text-on-surface text-xs font-bold">Reason Channel</span>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-display-md text-on-surface font-bold text-lg">{report.reasonScore ?? 100}</span>
                <span className="text-label-sm text-on-surface-variant font-medium text-xs">/ 100</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-secondary-container h-full rounded-full" 
                  style={{ width: `${report.reasonScore ?? 100}%` }}
                />
              </div>
              <span className="text-[10px] text-on-surface-variant mt-2 block">
                Band: {report.reasonBand ?? 'NO_DEFECT'}
              </span>
            </div>

            {/* Question Channel */}
            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
              <span className="font-label-bold text-label-bold block text-on-surface text-xs font-bold">Question Channel</span>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-display-md text-on-surface font-bold text-lg">{report.questionScore ?? 100}</span>
                <span className="text-label-sm text-on-surface-variant font-medium text-xs">/ 100</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-tertiary-fixed-dim h-full rounded-full" 
                  style={{ width: `${report.questionScore ?? 100}%` }}
                />
              </div>
              <span className="text-[10px] text-on-surface-variant mt-2 block">
                Stated attributes questionnaire
              </span>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant text-xs">
            Blended Score = w × VisionScore + (1 − w) × min(ReasonScore, QuestionScore) = <strong>{report.overallScore}</strong>.
          </p>
        </div>

        {/* Defect Analysis Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md text-left">
          {/* Detected Issues */}
          <div className="bg-white border border-outline-variant rounded-xl p-lg">
            <h2 className="font-headline-sm text-headline-sm mb-md flex items-center gap-xs text-on-surface">
              <span className="material-symbols-outlined text-secondary">analytics</span>
              Detected Defects
            </h2>
            <ul className="flex flex-col gap-md">
              {report.damages.length > 0 ? (
                report.damages.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-error mt-0.5">error_outline</span>
                    <div>
                      <span className="font-label-bold text-label-bold block text-on-surface">
                        {d.type} ({d.severity}) — {d.view}
                      </span>
                      <p className="text-label-sm text-on-surface-variant">{d.description}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-secondary-container mt-0.5">check_circle</span>
                  <div>
                    <span className="font-label-bold text-label-bold block text-on-surface">No defects detected</span>
                    <p className="text-label-sm text-on-surface-variant">The item matches factory condition specifications.</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Product Details Summary */}
          <div className="bg-white border border-outline-variant rounded-xl p-lg flex flex-col justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm mb-md flex items-center gap-xs text-on-surface">
                <span className="material-symbols-outlined text-secondary">inventory_2</span>
                Return Item
              </h2>
              <div className="flex gap-md items-start">
                <div className="w-16 h-16 bg-surface-container-low rounded border border-outline-variant flex-shrink-0 flex items-center justify-center">
                  <img className="max-h-full max-w-full object-contain p-1" alt={activeReturn.itemName} src={activeReturn.imgUrl} />
                </div>
                <div>
                  <p className="font-label-bold text-label-bold line-clamp-2 text-on-surface">{activeReturn.itemName}</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">SKU: {activeReturn.sku}</p>
                </div>
              </div>
            </div>
            <div className="mt-md pt-md border-t border-outline-variant flex justify-between items-center">
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Estimated Refund</span>
              <span className="font-display-md text-display-md text-on-surface font-bold">{formatINR(estimatedRefund)}</span>
            </div>
          </div>
        </div>

        {/* Annotated Thumbnails */}
        {annotatedThumbnails.length > 0 && (
          <div className="bg-white border border-outline-variant rounded-xl p-lg text-left">
            <h2 className="font-headline-sm text-headline-sm mb-md text-on-surface">Annotated Defect Views</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
              {annotatedThumbnails.map((thumb) => (
                <div key={thumb.view} className="relative group cursor-zoom-in rounded-lg overflow-hidden border border-outline-variant aspect-square bg-surface-container-low">
                  <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={`${thumb.view} view`} src={thumb.url} />
                  {thumb.damages.map((d, idx) =>
                    d.boundingBox ? (
                      <div
                        key={idx}
                        className="absolute border-2 border-secondary-container bg-secondary-container/20 shadow-md"
                        style={{
                          top: `${d.boundingBox.y * 100}%`,
                          left: `${d.boundingBox.x * 100}%`,
                          width: `${d.boundingBox.width * 100}%`,
                          height: `${d.boundingBox.height * 100}%`,
                        }}
                      />
                    ) : null
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-[10px] backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform capitalize">
                    {thumb.view} {thumb.damages.length > 0 ? `— ${thumb.damages.map((d) => d.type).join(', ')}` : '— No defects'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Notice */}
        {showMismatchNotice && (
          <div className="bg-secondary-fixed/20 border border-secondary-fixed-dim rounded-xl p-md flex items-start gap-md text-left">
            <span className="material-symbols-outlined text-secondary mt-0.5">warning</span>
            <p className="text-body-md text-on-secondary-fixed-variant">
              {report.notesContradictImages
                ? "Your stated return reason doesn't fully match what our AI sees in the photos — "
                : ''}
              this return may need a closer look by our warehouse team once received. This could delay your refund processing by 2-3 business days.
            </p>
          </div>
        )}

        {/* Primary Action */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-md mt-sm">
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-xl py-md bg-surface-container-high border border-outline-variant rounded-lg font-label-bold text-label-bold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            Edit Photos
          </button>
          <button
            onClick={onNext}
            className="w-full sm:w-auto px-xl py-md bg-secondary-container text-on-secondary-fixed font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-all shadow-sm cursor-pointer"
          >
            Confirm and Submit Return
          </button>
        </div>
      </div>

      {/* Sidebar Support */}
      <aside className="lg:col-span-4 flex flex-col gap-lg text-left">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg">
          <h3 className="font-headline-sm text-headline-sm mb-md text-on-surface">Why this grade?</h3>
          <p className="text-label-sm text-on-surface-variant mb-md">AI Grading ensures a transparent return experience. By identifying defects now, we can offer immediate resolution options.</p>
          <div className="flex flex-col gap-sm">
            <div className={`p-sm rounded border ${['A+', 'A'].includes(report.grade) ? 'bg-tertiary-fixed/40 border-tertiary-fixed-dim' : 'bg-white border-outline-variant opacity-60'}`}>
              <p className="font-label-bold text-label-bold text-on-surface">Grade A: Like New</p>
              <p className="text-[11px] text-on-surface-variant">No visible wear, all packaging included.</p>
            </div>
            <div className={`p-sm rounded border ${['B+', 'B'].includes(report.grade) ? 'bg-tertiary-fixed/40 border-tertiary-fixed-dim' : 'bg-white border-outline-variant opacity-60'}`}>
              <p className="font-label-bold text-label-bold text-on-tertiary-fixed-variant">Grade B: Used, Minor Wear</p>
              <p className="text-[11px] text-on-surface-variant">Light scratches or 1 missing minor accessory.</p>
            </div>
            <div className={`p-sm rounded border ${['C', 'D', 'F'].includes(report.grade) ? 'bg-tertiary-fixed/40 border-tertiary-fixed-dim' : 'bg-white border-outline-variant opacity-60'}`}>
              <p className="font-label-bold text-label-bold text-on-surface">Grade C-F: Significant Wear</p>
              <p className="text-[11px] text-on-surface-variant">Deep scratches, dents, cracks, or major missing parts.</p>
            </div>
          </div>
          {report.gradeCapApplied && (
            <p className="text-[11px] text-on-surface-variant mt-md pt-md border-t border-outline-variant">
              Note: this grade was capped from the model's raw assessment of <strong>{report.rawGrade}</strong> due to: {report.capReasons.join(', ')}.
            </p>
          )}
        </div>

        <div className="bg-primary-container text-on-primary p-lg rounded-xl flex flex-col gap-md relative overflow-hidden">
          <div className="z-10">
            <h3 className="font-headline-sm text-headline-sm text-white">Need help?</h3>
            <p className="text-label-sm opacity-80 mt-1">If you disagree with the AI assessment, you can request a manual review after submission.</p>
            <button className="mt-md text-secondary-container font-label-bold text-label-bold flex items-center gap-xs hover:underline">
              Chat with an agent
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-on-primary-container/20 rounded-full blur-2xl"></div>
        </div>
      </aside>
    </div>
  );
}

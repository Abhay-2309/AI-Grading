import React, { useEffect, useState } from 'react';

export default function ItemCondition({ activeReturn, returnState, setReturnState, subcategoryTaxonomy, onNext, onBack }) {
  const bucket = subcategoryTaxonomy[(activeReturn.category || '').toUpperCase()];
  const subcategories = bucket?.subcategories || [];
  const selectedLeaf = subcategories.find((s) => s.key === returnState.subcategory) || null;

  const [answers, setAnswers] = useState(returnState.conditionAnswers || {});

  // Defensive: if this category has no taxonomy entry, there's nothing to
  // ask — don't strand the customer on an empty page.
  useEffect(() => {
    if (subcategories.length === 0) onNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSubcategory = (key) => {
    setReturnState((prev) => ({ ...prev, subcategory: key, conditionAnswers: {} }));
    setAnswers({});
  };

  const handleAnswerChange = (key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    setReturnState((prev) => ({ ...prev, conditionAnswers: next }));
  };

  const isFormValid = Boolean(returnState.subcategory);

  if (subcategories.length === 0) return null;

  return (
    <div className="flex flex-col gap-xl">
      <div className="mb-xl flex items-center justify-center">
        <div className="flex items-center w-full max-w-[672px] text-on-surface">
          <div className="flex flex-col items-center flex-1">
            <span className="material-symbols-outlined text-secondary font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-label-bold font-label-bold mt-1 text-on-surface text-xs font-bold">Return Reason</span>
          </div>
          <div className="h-px bg-primary-container flex-grow mx-2 mb-5"></div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-[12px] font-bold">2</div>
            <span className="text-label-bold font-label-bold mt-1 text-primary-container text-xs font-bold">Item Details</span>
          </div>
          <div className="h-px bg-outline-variant flex-grow mx-2 mb-5"></div>
          <div className="flex flex-col items-center flex-1 opacity-40">
            <div className="w-6 h-6 rounded-full bg-outline-variant text-white flex items-center justify-center text-[12px] font-bold">3</div>
            <span className="text-label-bold font-label-bold mt-1 text-outline text-xs font-bold">Photo Evidence</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-lg p-xl text-left max-w-[896px] mx-auto w-full">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-md font-bold text-2xl">
          What kind of {activeReturn.category?.toLowerCase()} item is this?
        </h1>
        <p className="text-on-surface-variant mb-lg text-sm">
          This helps us ask for the right photos and details to grade it accurately.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
          {subcategories.map((s) => {
            const isChecked = returnState.subcategory === s.key;
            return (
              <label
                key={s.key}
                className={`flex items-center p-md border rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors ${
                  isChecked ? 'bg-surface-container-low border-secondary-container' : 'border-outline-variant'
                }`}
              >
                <input
                  className="form-radio h-5 w-5 border-outline-variant focus:ring-0 text-[#007185] rounded-full accent-[#007185]"
                  type="radio"
                  name="subcategory"
                  checked={isChecked}
                  onChange={() => handleSelectSubcategory(s.key)}
                />
                <span className="ml-3 font-body-lg text-body-lg text-on-surface text-sm">{s.label}</span>
              </label>
            );
          })}
        </div>

        {selectedLeaf && selectedLeaf.conditionQuestions.length > 0 && (
          <div className="border-t border-outline-variant pt-lg animate-fade-in">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">
              A few details a photo can't show
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {selectedLeaf.conditionQuestions.map((q) => (
                <div key={q.key} className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold text-on-surface-variant text-xs">{q.label}</label>
                  {q.type === 'boolean' ? (
                    <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant w-fit">
                      {['Yes', 'No'].map((opt) => {
                        const val = opt === 'Yes';
                        const active = answers[q.key] === val;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerChange(q.key, val)}
                            className={`px-lg h-9 rounded-md font-label-bold text-xs transition-colors cursor-pointer ${
                              active ? 'bg-primary-container text-white' : 'text-on-surface hover:bg-surface-container'
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
                      value={answers[q.key] ?? ''}
                      onChange={(e) => handleAnswerChange(q.key, e.target.value === '' ? '' : Number(e.target.value))}
                      className="border border-outline-variant rounded-lg px-md py-2 text-sm outline-none focus:border-secondary-container w-full max-w-[160px]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-xl pt-xl border-t border-outline-variant flex flex-col sm:flex-row gap-md justify-between items-center">
          <button
            className="order-2 sm:order-1 font-body-md text-body-md text-on-surface hover:underline px-md py-2 cursor-pointer text-sm"
            type="button"
            onClick={onBack}
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
  );
}

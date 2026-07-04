# Summary of Changes — Weighted-Blend Grading Strategy

This document summarizes the changes made to the AI grading service (`AI1`), Express backend, and React frontend to implement the Unified Weighted-Blend Grading Strategy.

---

## Touched Files

### 1. Schemas & Database
- **[NEW]** [`src/schemas/condition-answers.schema.ts`](file:///c:/Amazon_HackON/AI1/src/schemas/condition-answers.schema.ts): Defines the Zod validation schema and TypeScript types for the 5 universal condition dimensions (`coreFunction`, `completeness`, `structure`, `usage`, `originality`).
- **[MODIFY]** [`src/schemas/grade-request.schema.ts`](file:///c:/Amazon_HackON/AI1/src/schemas/grade-request.schema.ts): Adds the optional `conditionAnswers` JSON string validation and transforms it into the typed `ConditionAnswers` object.
- **[MODIFY]** [`src/schemas/final-report.schema.ts`](file:///c:/Amazon_HackON/AI1/src/schemas/final-report.schema.ts): Adds new report metadata fields: `visionScore`, `reasonScore`, `questionScore`, `reasonBand`, `blendWeight`, and `mismatchFlag`.
- **[MODIFY]** [`src/services/db/schema.ts`](file:///c:/Amazon_HackON/AI1/src/services/db/schema.ts): Expands request database records to include parsed `conditionAnswers`.

### 2. Grading Engine
- **[NEW]** [`src/services/grading/reasonScore.ts`](file:///c:/Amazon_HackON/AI1/src/services/grading/reasonScore.ts): Computes keyword-based band scores (SAFETY, MAJOR_FAILURE, etc.) on return reasons and notes, with fallback defaults and customer reported damages tightening.
- **[NEW]** [`src/services/grading/questionScore.ts`](file:///c:/Amazon_HackON/AI1/src/services/grading/questionScore.ts): Computes points across the 5 condition dimensions and handles mismatch overrides.
- **[NEW]** [`src/services/grading/blend.ts`](file:///c:/Amazon_HackON/AI1/src/services/grading/blend.ts): Computes the final rounded clamped blended score based on trust weight `w`.
- **[MODIFY]** [`src/services/grading/scoring.ts`](file:///c:/Amazon_HackON/AI1/src/services/grading/scoring.ts): Splits off visual-only damage scoring logic from full deductions calculation.
- **[MODIFY]** [`src/services/grading/rules.ts`](file:///c:/Amazon_HackON/AI1/src/services/grading/rules.ts): Enforces visual damage caps separately, adds new caps based on customer answers, and checks photo quality thresholds.
- **[MODIFY]** [`src/services/grading/computeGrade.ts`](file:///c:/Amazon_HackON/AI1/src/services/grading/computeGrade.ts): Integrates new scoring and cap logic, computes final scores, and sets human review triggers according to the priority order.

### 3. Pipeline & API Controllers
- **[MODIFY]** [`src/services/validation/quality.ts`](file:///c:/Amazon_HackON/AI1/src/services/validation/quality.ts): Relaxes the image quality check rules so that only blurry or corrupted images cause a validation failure. Measurements for too dark, too bright, low contrast, and resolution are still performed for the report scores but do not trigger validation failures. In addition, contrast normalization is applied before the blur check to avoid false-positive blur detections on dark or bright images.
- **[MODIFY]** [`tests/services/validation/quality.test.ts`](file:///c:/Amazon_HackON/AI1/tests/services/validation/quality.test.ts): Updates assertions to reflect the flexible quality checks.
- **[MODIFY]** [`src/services/grading/pipeline.ts`](file:///c:/Amazon_HackON/AI1/src/services/grading/pipeline.ts): Computes photo quality as the minimum score across all views, aggregates category matching with logical AND, and passes return details to the grading engine.
- **[MODIFY]** [`src/api/controllers/grade.controller.ts`](file:///c:/Amazon_HackON/AI1/src/api/controllers/grade.controller.ts): Routes parsed condition answers into database creation flows.

### 4. Express Backend Router
- **[MODIFY]** [`Backend/routes/grading.js`](file:///c:/Amazon_HackON/Backend/routes/grading.js): Parses, merges, forwards, and persists condition answers in PostgreSQL.

### 5. Frontend Client
- **[MODIFY]** [`GuidedPhotoCapture.jsx`](file:///c:/Amazon_HackON/Frontend/src/features/return-user/pages/GuidedPhotoCapture.jsx): Injects the universal condition questions step before final submit and handles skip flows.
- **[MODIFY]** [`AiGrading.jsx`](file:///c:/Amazon_HackON/Frontend/src/features/return-user/pages/AiGrading.jsx): Visualizes the three-part evidence breakdown with progress bars, warning flags, and detailed logs.

---

## New FinalReport Schema Fields

Every field has been added additively with fallback defaults:
1. `visionScore` (number): The raw score based strictly on visual damages.
2. `reasonScore` (number): The raw score based on keyword analysis of return reasons and notes.
3. `questionScore` (number): The raw score based on the 5 condition dimensions questionnaire.
4. `reasonBand` (string): The detected reason severity band (e.g. `SAFETY`, `MAJOR_FAILURE`, `COSMETIC`, `NO_DEFECT`).
5. `blendWeight` (number): The photo quality trust weight `w` (0.0 to 1.0) utilized in the final blend.
6. `mismatchFlag` (boolean): Flag indicating a mismatch was detected between the reported reason and condition answers.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GeminiGrader } from '../src/services/ai/clients/geminiGrader.js';
import { GemmaGrader } from '../src/services/ai/clients/gemmaGrader.js';
import { FallbackOrchestrator } from '../src/services/ai/orchestrator.js';
import { deduplicateCrossViewDamages } from '../src/services/ai/dedup.js';
import { voteMergeDamages } from '../src/services/ai/voting.js';
import { computeGrade } from '../src/services/grading/computeGrade.js';
import type { DetectionResult, DetectedDamage } from '../src/schemas/grading-report.schema.js';
import type { GradingImageInput } from '../src/services/ai/clients/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestItemMetadata {
  category: string;
  returnReason: string;
  customerNotes?: string;
}

interface RunResultInfo {
  runIndex: number;
  grade: string;
  score: number;
  condition: string;
  damageCount: number;
  damages: DetectedDamage[];
  modelUsed: string;
}

interface ItemConsistencyResult {
  itemId: string;
  runs: RunResultInfo[];
  exactGradeAgreementPct: number;
  scoreMean: number;
  scoreStdDev: number;
  passedAcceptance: boolean;
}

function calculateMean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function calculateStdDev(numbers: number[], mean: number): number {
  if (numbers.length <= 1) return 0;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let itemsDir = path.join(__dirname, '../tests/fixtures/test-items');
  let runs = 5;
  let mode = 'perception';

  for (const arg of args) {
    if (arg.startsWith('--items=')) {
      itemsDir = arg.replace('--items=', '');
    } else if (arg.startsWith('--runs=')) {
      runs = parseInt(arg.replace('--runs=', ''), 10);
    } else if (arg.startsWith('--mode=')) {
      mode = arg.replace('--mode=', '');
    }
  }

  return { itemsDir, runs, mode };
}

async function runHarness() {
  const { itemsDir, runs: R, mode } = parseArgs();
  console.log(`\n=================================================`);
  console.log(`  5-RUN AI CONSISTENCY HARNESS (Target: Agreement ≥95%, σ ≤ 3)`);
  console.log(`  Mode: ${mode.toUpperCase()} | Runs per item: ${R}`);
  console.log(`=================================================\n`);

  const orchestrator = new FallbackOrchestrator(new GeminiGrader(), new GemmaGrader());

  let itemDirs: string[] = [];
  try {
    const files = await fs.readdir(itemsDir);
    const hasImages = files.some((f) => /\.(jpe?g|png|webp)$/i.test(f));

    if (hasImages) {
      itemDirs = [itemsDir];
    } else {
      const entries = await fs.readdir(itemsDir, { withFileTypes: true });
      itemDirs = entries.filter((e) => e.isDirectory()).map((e) => path.join(itemsDir, e.name));
    }
  } catch (err) {
    console.log(`No test items directory found at ${itemsDir}:`, err);
    process.exit(1);
  }

  const overallResults: ItemConsistencyResult[] = [];

  for (const itemDir of itemDirs) {
    const itemId = path.basename(itemDir);
    console.log(`Testing Item [${itemId}] across ${R} runs...`);

    let metadata: TestItemMetadata = {
      category: 'electronics',
      returnReason: 'Defective screen',
      customerNotes: 'Screen has hairline cracks',
    };

    const metaPath = path.join(itemDir, 'metadata.json');
    try {
      const metaText = await fs.readFile(metaPath, 'utf-8');
      metadata = JSON.parse(metaText);
    } catch {
      // default metadata used
    }

    const files = await fs.readdir(itemDir);
    const imageFiles = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

    const images: GradingImageInput[] = await Promise.all(
      imageFiles.map(async (filename) => {
        const view = path.basename(filename, path.extname(filename)).toLowerCase();
        const buffer = await fs.readFile(path.join(itemDir, filename));
        const mimetype = filename.endsWith('.png')
          ? 'image/png'
          : filename.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
        return { view, buffer, mimetype };
      })
    );

    const itemRuns: RunResultInfo[] = [];

    for (let r = 0; r < R; r++) {
      process.stdout.write(`  Run ${r + 1}/${R}... `);

      const detectionResults: DetectionResult[] = [];
      let modelUsed: 'gemini' | 'gemma' = 'gemini';

      // Perform single-view per-view detection calls concurrently
      const settled = await Promise.allSettled(
        images.map(async (img, idx) => {
          if (idx > 0) await new Promise((resolve) => setTimeout(resolve, idx * 300));
          return orchestrator.detectSingleView({
            requestId: `harness-${itemId}-${r}`,
            category: metadata.category,
            returnReason: metadata.returnReason,
            customerNotes: metadata.customerNotes,
            image: img,
          });
        })
      );

      const damages: DetectedDamage[] = [];
      for (const res of settled) {
        if (res.status === 'fulfilled') {
          modelUsed = res.value.modelUsed;
          if (res.value.result.damages) damages.push(...res.value.result.damages);
        }
      }

      detectionResults.push({
        damages,
        itemMatchesCategory: true,
        visibilityIssues: [],
        imageQualityScore: 0.9,
      });

      // Vote & Dedup
      const voteRes = voteMergeDamages(detectionResults, { runs: 1 });
      const deduped = deduplicateCrossViewDamages(voteRes.votedDamages);

      // Compute grade
      const finalReport = computeGrade({
        damages: deduped,
        customerNotes: metadata.customerNotes,
        imageQualityScore: 0.9,
        modelUsed,
      });

      console.log(`Grade: ${finalReport.grade} | Score: ${finalReport.overallScore} | Defects: ${deduped.length}`);

      itemRuns.push({
        runIndex: r + 1,
        grade: finalReport.grade,
        score: finalReport.overallScore,
        condition: finalReport.condition,
        damageCount: deduped.length,
        damages: deduped,
        modelUsed,
      });
    }

    const grades = itemRuns.map((r) => r.grade);
    const scores = itemRuns.map((r) => r.score);

    // Calculate mode grade frequency
    const gradeCounts: Record<string, number> = {};
    for (const g of grades) gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    const maxFreq = Math.max(...Object.values(gradeCounts));
    const exactGradeAgreementPct = Number(((maxFreq / R) * 100).toFixed(1));

    const scoreMean = Number(calculateMean(scores).toFixed(1));
    const scoreStdDev = Number(calculateStdDev(scores, scoreMean).toFixed(2));

    const passedAcceptance = exactGradeAgreementPct >= 95.0 && scoreStdDev <= 3.0;

    overallResults.push({
      itemId,
      runs: itemRuns,
      exactGradeAgreementPct,
      scoreMean,
      scoreStdDev,
      passedAcceptance,
    });
  }

  console.log(`\n=================================================`);
  console.log(`  CONSISTENCY HARNESS REPORT SUMMARY`);
  console.log(`=================================================`);
  for (const res of overallResults) {
    const status = res.passedAcceptance ? '✅ PASSED' : '⚠️ HIGH VARIATION';
    const gradesList = res.runs.map((r) => r.grade).join(', ');
    console.log(`Item [${res.itemId}]: ${status}`);
    console.log(`  Grades across runs:  [ ${gradesList} ]`);
    console.log(`  Grade Agreement:     ${res.exactGradeAgreementPct}% (Target: ≥95%)`);
    console.log(`  Score Mean ± σ:      ${res.scoreMean} ± ${res.scoreStdDev} (Target: σ ≤ 3.0)`);
    console.log(`-------------------------------------------------`);
  }
}

runHarness().catch((err) => {
  console.error('Harness error:', err);
  process.exit(1);
});

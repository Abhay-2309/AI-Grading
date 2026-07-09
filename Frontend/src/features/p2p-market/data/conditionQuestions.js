// MarketConnect's own seller-facing photo/question configuration — kept
// independent from the Return flow's question set on purpose (separate
// features, separate copy, separate UI), even though both ultimately feed
// AI1's identical 5-dimension grading schema (coreFunction/completeness/
// structure/usage/originality).

// Maps this feature's free-text category labels (chosen in the "Post Your
// Ad" category grid / dropdown) onto the shared Backend subcategory
// taxonomy's bucket keys (GET /api/config/subcategories).
const CATEGORY_TAXONOMY_KEY = {
  ELECTRONICS: 'ELECTRONICS',
  PHOTOGRAPHY: 'ELECTRONICS',
  FASHION: 'APPAREL',
  'HOME & FURNITURE': 'HOME',
  'SPORTS & OUTDOORS': 'SPORTS',
  'BOOKS & HOBBIES': 'BOOKS',
  'BOOKS AND HOBBIES': 'BOOKS',
  BOOKS: 'BOOKS',
};

const FRONT_BACK_ONLY_BUCKETS = ['APPAREL', 'BOOKS'];
const ALL_SIX_VIEWS = ['front', 'back', 'left', 'right', 'top', 'bottom'];

export function taxonomyKeyFor(category) {
  return CATEGORY_TAXONOMY_KEY[(category || '').toUpperCase()] || 'ELECTRONICS';
}

// Picks the photo views a seller must capture: the chosen subcategory's own
// requirement if the shared taxonomy has one, otherwise a default for the
// bucket (apparel/books only need front+back; everything else needs all
// six angles).
export function resolveRequiredViews(taxonomyKey, subcategoryKey, subcategoryTaxonomy) {
  const bucket = subcategoryTaxonomy?.[taxonomyKey];
  const leaf = bucket?.subcategories?.find((s) => s.key === subcategoryKey);
  if (leaf) return { views: leaf.requiredViews, labels: leaf.viewLabels || {} };
  const views = FRONT_BACK_ONLY_BUCKETS.includes(taxonomyKey) ? ['front', 'back'] : ALL_SIX_VIEWS;
  return { views, labels: {} };
}

export const BASE_VIEW_LABELS = {
  front: 'Front',
  back: 'Back',
  left: 'Left side',
  right: 'Right side',
  top: 'Top',
  bottom: 'Bottom',
};

// Plain-language questions a seller answers before AI grading — phrased for
// a non-technical audience selling a used item peer-to-peer. Each answer
// maps to one of AI1's five condition dimensions, scored yes=20/partial=10/no=0.
const SELL_QUESTION_BANK = {
  electronics: [
    { key: 'coreFunction', label: 'Does it power on and work as expected?', good: 'Works perfectly', medium: 'Powers on, minor issue', bad: 'Does not power on' },
    { key: 'completeness', label: 'Are the charger, cables, and box included?', good: 'Everything included', medium: 'Missing a minor item', bad: 'Charger or main accessory missing' },
    { key: 'structure', label: 'Any cracks, dents, or broken parts?', good: 'No damage', medium: 'Minor cosmetic wear', bad: 'Cracked or broken' },
    { key: 'usage', label: 'How much was it used?', good: 'Barely used', medium: 'Regularly used, well kept', bad: 'Heavily used' },
    { key: 'originality', label: 'Has it ever been opened or repaired by someone other than you?', good: 'Never opened', medium: 'Opened, no repair', bad: 'Repaired / parts replaced' },
  ],
  apparel: [
    { key: 'coreFunction', label: 'Is it wearable — zips, buttons, and soles intact?', good: 'Fully wearable', medium: 'One small issue', bad: 'Not wearable' },
    { key: 'completeness', label: 'Are all matching pieces included (pair, belt, liner)?', good: 'Complete set', medium: 'Minor extra missing', bad: 'Main piece missing' },
    { key: 'structure', label: 'Any tears, holes, or stains?', good: 'No damage', medium: 'Minor loose thread', bad: 'Torn or stained' },
    { key: 'usage', label: 'How much wear has it seen?', good: 'Like new / unworn', medium: 'Worn a few times', bad: 'Worn frequently' },
    { key: 'originality', label: 'Are the original tags still attached?', good: 'Tags on', medium: 'Tags removed, unaltered', bad: 'Altered / tailored' },
  ],
  books: [
    { key: 'coreFunction', label: 'Are all pages present and readable?', good: 'All pages fine', medium: 'A few pages creased', bad: 'Pages missing / unreadable' },
    { key: 'completeness', label: 'Is the cover, dust jacket, and any access code included?', good: 'Everything included', medium: 'Dust jacket missing', bad: 'Code used / parts missing' },
    { key: 'structure', label: 'Is the spine intact and binding solid?', good: 'Spine solid', medium: 'Slight crease on spine', bad: 'Pages falling out' },
    { key: 'usage', label: 'Any writing, highlighting, or markings inside?', good: 'Clean copy', medium: 'A few pencil marks', bad: 'Heavy writing / stains' },
    { key: 'originality', label: 'Is this the original publisher copy?', good: 'Original, sealed or unread', medium: 'Original, opened', bad: 'Photocopy / duplicate' },
  ],
  home: [
    { key: 'coreFunction', label: 'Does it function normally?', good: 'Works fully', medium: 'Slightly stiff / hard to use', bad: 'Broken / non-functional' },
    { key: 'completeness', label: 'Are all parts, screws, and accessories included?', good: 'All parts present', medium: 'Minor part missing', bad: 'Main part missing' },
    { key: 'structure', label: 'Any dents, cracks, or bent parts?', good: 'No damage', medium: 'Small cosmetic dent', bad: 'Bent or cracked' },
    { key: 'usage', label: 'Any rust, stains, or heavy-use marks?', good: 'Like new', medium: 'Light, cleanable marks', bad: 'Rusted / heavily used' },
    { key: 'originality', label: 'Has it been repaired, repainted, or modified?', good: 'Original, untouched', medium: 'Minor scratch, no repair', bad: 'Repaired / modified' },
  ],
};

export function getSellQuestions(taxonomyKey) {
  if (taxonomyKey === 'APPAREL') return SELL_QUESTION_BANK.apparel;
  if (taxonomyKey === 'BOOKS') return SELL_QUESTION_BANK.books;
  if (taxonomyKey === 'HOME' || taxonomyKey === 'SPORTS') return SELL_QUESTION_BANK.home;
  return SELL_QUESTION_BANK.electronics;
}

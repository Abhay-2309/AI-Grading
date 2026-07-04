export const CATEGORIES = [
  'electronics',
  'apparel',
  'books',
  'home',
  'toys',
  'sports',
  'other',
  // Finer-grained subcategories — additive, alongside the flat categories
  // above (never replacing them). Each still draws only from the same
  // VIEWS/CLOSEUP_FIELDS names below; no new image field names are ever
  // introduced by a subcategory.
  'electronics_mobile',
  'electronics_laptop',
  'electronics_camera',
  'apparel_shirt',
  'apparel_saree',
  'apparel_footwear',
  'accessories_watch',
  'accessories_bag',
  'home_appliance',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const VIEWS = ['front', 'back', 'left', 'right', 'top', 'bottom'] as const;
export type View = (typeof VIEWS)[number];

export const MAX_CLOSEUPS = 6;
export const CLOSEUP_FIELDS = Array.from(
  { length: MAX_CLOSEUPS },
  (_, i) => `closeup_${i + 1}`
);

export const ALL_IMAGE_FIELDS = [...VIEWS, ...CLOSEUP_FIELDS] as const;

const ALL_SIX: readonly string[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
const FRONT_BACK: readonly string[] = ['front', 'back'];

// Required image fields per category — may be a base view name or a
// closeup_N slot (for subcategories needing one extra targeted shot, e.g.
// a laptop's screen powered on, instead of a generic angle).
export const REQUIRED_VIEWS: Record<Category, readonly string[]> = {
  electronics: ALL_SIX,
  books: FRONT_BACK,
  apparel: FRONT_BACK,
  home: ALL_SIX,
  toys: ALL_SIX,
  sports: ALL_SIX,
  other: ALL_SIX,
  electronics_mobile: ['front', 'back', 'left', 'right', 'closeup_1'],
  electronics_laptop: ['front', 'back', 'left', 'right', 'closeup_1'],
  electronics_camera: [...ALL_SIX, 'closeup_1'],
  apparel_shirt: FRONT_BACK,
  apparel_saree: ['front', 'back', 'closeup_1'],
  apparel_footwear: ['front', 'back', 'left', 'right'],
  accessories_watch: ['front', 'back', 'closeup_1'],
  accessories_bag: ['front', 'back', 'closeup_1'],
  home_appliance: ['front', 'back', 'left', 'right', 'closeup_1'],
};

// Human-readable label used only for the grading prompt's header sentence.
export const CATEGORY_LABELS: Record<Category, string> = {
  electronics: 'electronics',
  books: 'book',
  apparel: 'apparel',
  home: 'home item',
  toys: 'toy',
  sports: 'sports item',
  other: 'item',
  electronics_mobile: 'mobile phone',
  electronics_laptop: 'laptop',
  electronics_camera: 'camera',
  apparel_shirt: 'shirt',
  apparel_saree: 'saree',
  apparel_footwear: 'pair of shoes',
  accessories_watch: 'watch',
  accessories_bag: 'bag',
  home_appliance: 'home appliance',
};

export function isImageField(field: string): boolean {
  return (ALL_IMAGE_FIELDS as readonly string[]).includes(field);
}

export function isView(field: string): field is View {
  return (VIEWS as readonly string[]).includes(field);
}

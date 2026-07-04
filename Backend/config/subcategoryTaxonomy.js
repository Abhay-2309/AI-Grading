// Single source of truth for category -> subcategory -> {required photos,
// structured condition questions}. Backend uses this to pick AI1's category
// string and build customerNotes; Frontend fetches it via GET /api/config/subcategories
// and renders whatever it's given, with no hardcoded taxonomy of its own.
//
// Every top-level category has at least one real subcategory plus a
// generic "Other" leaf so nothing falls through with zero coverage.
//
// requiredViews here must exactly match AI1's REQUIRED_VIEWS for the same
// aiCategory — KEEP IN SYNC WITH AI1/src/config/required-views.ts. "Other"
// leaves intentionally reuse AI1's existing flat category (electronics/
// apparel/books/home/toys/sports/other) rather than inventing a new one,
// since their photo requirements don't actually differ from today's default.
export const SUBCATEGORY_TAXONOMY = {
  ELECTRONICS: {
    subcategories: [
      {
        key: 'mobile',
        label: 'Mobile Phone',
        aiCategory: 'electronics_mobile',
        requiredViews: ['front', 'back', 'left', 'right', 'closeup_1'],
        viewLabels: { closeup_1: 'Screen ON (unlocked home screen)' },
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on?', type: 'boolean' },
          { key: 'batteryHealth', label: 'Battery health (%)', type: 'number' },
          { key: 'chargerIncluded', label: 'Charger/cable included?', type: 'boolean' },
        ],
      },
      {
        key: 'laptop',
        label: 'Laptop',
        aiCategory: 'electronics_laptop',
        requiredViews: ['front', 'back', 'left', 'right', 'closeup_1'],
        viewLabels: { closeup_1: 'Screen open, powered on' },
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on?', type: 'boolean' },
          { key: 'batteryHealth', label: 'Battery health (%)', type: 'number' },
          { key: 'chargerIncluded', label: 'Charger/adapter included?', type: 'boolean' },
        ],
      },
      {
        key: 'camera',
        label: 'Camera',
        aiCategory: 'electronics_camera',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom', 'closeup_1'],
        viewLabels: { closeup_1: 'Lens close-up (front element)' },
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on?', type: 'boolean' },
          { key: 'shutterCount', label: 'Shutter count (if known)', type: 'number' },
          { key: 'chargerIncluded', label: 'Battery/charger included?', type: 'boolean' },
        ],
      },
      {
        key: 'other_electronics',
        label: 'Other Electronics',
        aiCategory: 'electronics',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on?', type: 'boolean' },
          { key: 'accessoriesIncluded', label: 'Original accessories included?', type: 'boolean' },
        ],
      },
    ],
  },
  APPAREL: {
    subcategories: [
      {
        key: 'shirt',
        label: 'Shirt / Top',
        aiCategory: 'apparel_shirt',
        requiredViews: ['front', 'back'],
        conditionQuestions: [
          { key: 'tagsAttached', label: 'Original tags attached?', type: 'boolean' },
        ],
      },
      {
        key: 'saree',
        label: 'Saree',
        aiCategory: 'apparel_saree',
        requiredViews: ['front', 'back', 'closeup_1'],
        viewLabels: { closeup_1: 'Pallu / border close-up' },
        conditionQuestions: [
          { key: 'blousePieceIncluded', label: 'Blouse piece included?', type: 'boolean' },
        ],
      },
      {
        key: 'footwear',
        label: 'Shoes / Footwear',
        aiCategory: 'apparel_footwear',
        requiredViews: ['front', 'back', 'left', 'right'],
        conditionQuestions: [
          { key: 'soleWear', label: 'Visible sole wear?', type: 'boolean' },
          { key: 'boxIncluded', label: 'Original box included?', type: 'boolean' },
        ],
      },
      {
        key: 'other_apparel',
        label: 'Other Apparel',
        aiCategory: 'apparel',
        requiredViews: ['front', 'back'],
        conditionQuestions: [
          { key: 'tagsAttached', label: 'Original tags attached?', type: 'boolean' },
        ],
      },
    ],
  },
  ACCESSORIES: {
    subcategories: [
      {
        key: 'watch',
        label: 'Watch',
        aiCategory: 'accessories_watch',
        requiredViews: ['front', 'back', 'closeup_1'],
        viewLabels: { closeup_1: 'Face/screen close-up' },
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on / keep time?', type: 'boolean' },
          { key: 'strapCondition', label: 'Strap/band in original condition?', type: 'boolean' },
        ],
      },
      {
        key: 'bag',
        label: 'Bag',
        aiCategory: 'accessories_bag',
        requiredViews: ['front', 'back', 'closeup_1'],
        viewLabels: { closeup_1: 'Interior lining / zipper close-up' },
        conditionQuestions: [
          { key: 'zippersWork', label: 'All zippers/clasps functional?', type: 'boolean' },
        ],
      },
      {
        key: 'other_accessories',
        label: 'Other Accessory',
        aiCategory: 'other',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [
          { key: 'accessoriesIncluded', label: 'Original accessories included?', type: 'boolean' },
        ],
      },
    ],
  },
  BOOKS: {
    subcategories: [
      {
        key: 'book',
        label: 'Book',
        aiCategory: 'books',
        requiredViews: ['front', 'back'],
        conditionQuestions: [
          { key: 'writingInside', label: 'Any writing/highlighting inside?', type: 'boolean' },
          { key: 'dustJacketIncluded', label: 'Dust jacket included (if applicable)?', type: 'boolean' },
        ],
      },
    ],
  },
  HOME: {
    subcategories: [
      {
        key: 'appliance',
        label: 'Appliance',
        aiCategory: 'home_appliance',
        requiredViews: ['front', 'back', 'left', 'right', 'closeup_1'],
        viewLabels: { closeup_1: 'Rating label / power cord close-up' },
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on?', type: 'boolean' },
          { key: 'accessoriesIncluded', label: 'Original accessories/manual included?', type: 'boolean' },
        ],
      },
      {
        key: 'furniture',
        label: 'Furniture',
        aiCategory: 'home',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [
          { key: 'structuralDamage', label: 'Any structural damage (wobbling, cracks)?', type: 'boolean' },
        ],
      },
      {
        key: 'other_home',
        label: 'Other Home Item',
        aiCategory: 'home',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [],
      },
    ],
  },
  TOYS: {
    subcategories: [
      {
        key: 'electronic_toy',
        label: 'Electronic / Battery-Powered Toy',
        aiCategory: 'toys',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on?', type: 'boolean' },
          { key: 'batteriesIncluded', label: 'Batteries included?', type: 'boolean' },
        ],
      },
      {
        key: 'other_toy',
        label: 'Other Toy',
        aiCategory: 'toys',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [
          { key: 'missingPieces', label: 'Any missing pieces?', type: 'boolean' },
        ],
      },
    ],
  },
  SPORTS: {
    subcategories: [
      {
        key: 'equipment',
        label: 'Sports Equipment',
        aiCategory: 'sports',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [
          { key: 'structuralDamage', label: 'Any structural damage or wear?', type: 'boolean' },
        ],
      },
      {
        key: 'fitness_gear',
        label: 'Fitness Gear',
        aiCategory: 'sports',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [
          { key: 'powersOn', label: 'Does it power on (if electronic)?', type: 'boolean' },
        ],
      },
    ],
  },
  OTHER: {
    subcategories: [
      {
        key: 'other',
        label: 'Other Item',
        aiCategory: 'other',
        requiredViews: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        conditionQuestions: [],
      },
    ],
  },
};

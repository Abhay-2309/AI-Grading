// Currency utility: Convert USD to INR and format as ₹
const USD_TO_INR = 84;

/**
 * Convert a USD amount to INR
 */
export function toINR(usdAmount) {
  return usdAmount * USD_TO_INR;
}

/**
 * Format a USD amount as Indian Rupee string (₹)
 * e.g., formatINR(1249) => "₹1,04,916.00"
 */
export function formatINR(usdAmount) {
  const inrAmount = usdAmount * USD_TO_INR;
  return '₹' + inrAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format an already-INR amount (no conversion)
 */
export function formatINRDirect(inrAmount) {
  return '₹' + Number(inrAmount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

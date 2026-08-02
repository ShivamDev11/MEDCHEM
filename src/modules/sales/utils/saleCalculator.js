/**
 * Calculates the totals for a given shopping cart.
 * @param {Array} cart - Array of cart items (requires quantity and unitPrice/sellingPrice)
 * @param {number} discountPercent - Discount percentage to apply (default 0)
 * @param {number} taxPercent - Tax percentage to apply (default 0)
 * @returns {Object} { subtotal, discountAmount, taxAmount, grandTotal }
 */
export const calculateCartTotals = (cart = [], discountPercent = 0, taxPercent = 0) => {
  const subtotal = cart.reduce((acc, item) => {
    const price = Number(item.sellingPrice || item.unitPrice || 0);
    const qty = Number(item.quantity || 0);
    return acc + (price * qty);
  }, 0);

  const discountAmount = (subtotal * Number(discountPercent)) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * Number(taxPercent)) / 100;
  const grandTotal = afterDiscount + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2))
  };
};

/**
 * Calculates the subtotal for a single item.
 */
export const calculateItemSubtotal = (price, quantity) => {
  return Number((Number(price || 0) * Number(quantity || 0)).toFixed(2));
};

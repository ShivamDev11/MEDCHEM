export const validateSale = (cart, paymentMethod) => {
  const errors = [];

  if (!cart || cart.length === 0) {
    errors.push("Cart is empty. Cannot complete sale.");
    return { isValid: false, errors };
  }

  if (!paymentMethod) {
    errors.push("Payment method is required.");
  }

  cart.forEach((item, index) => {
    const displayName = item.medicineName || item.name;
    const availableStock = item.currentStock ?? item.quantity ?? 0;

    if (!item.id || !displayName) {
      errors.push(`Item at index ${index} is missing medicine details.`);
    }
    
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`${displayName || 'Medicine'} has invalid quantity.`);
    }

    if (item.quantity > availableStock) {
      errors.push(`Quantity for ${displayName} exceeds available stock (${availableStock}).`);
    }

    if (item.expiryDate) {
      const expiry = new Date(item.expiryDate);
      const today = new Date();
      // Reset times to compare dates properly
      today.setHours(0, 0, 0, 0);
      if (expiry < today) {
        errors.push(`Medicine ${displayName} is expired and cannot be sold.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCartItem = (medicine, quantity) => {
  const availableStock = medicine.currentStock ?? medicine.quantity ?? 0;

  if (quantity <= 0) return "Quantity must be greater than 0.";
  if (quantity > availableStock) return `Only ${availableStock} available in stock.`;
  
  if (medicine.expiryDate) {
    const expiry = new Date(medicine.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry < today) return "Cannot add expired medicine to cart.";
  }
  
  return null; // Null means valid
};

import { useState, useCallback, useMemo } from 'react';
import { searchMedicines, completeSale } from '../services/salesService';
import { validateSale, validateCartItem } from '../validators/saleValidator';
import { calculateCartTotals, calculateItemSubtotal } from '../utils/saleCalculator';
import useAuth from '../../auth/hooks/useAuth';

const useSales = () => {
  const { currentUser } = useAuth();
  
  // State
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0); // e.g., 5 for 5% GST
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Totals
  const totals = useMemo(() => calculateCartTotals(cart, discountPercent, taxPercent), [cart, discountPercent, taxPercent]);

  // Actions
  const addToCart = useCallback((medicine, quantity = 1) => {
    setError(null);
    const existingItem = cart.find(item => item.id === medicine.id);
    const totalQty = existingItem ? existingItem.quantity + quantity : quantity;
    
    const validationError = validateCartItem(medicine, totalQty);
    if (validationError) {
      setError(validationError);
      return false;
    }

    if (existingItem) {
      setCart(cart.map(item => 
        item.id === medicine.id 
          ? { ...item, quantity: totalQty, subtotal: calculateItemSubtotal(item.sellingPrice, totalQty) }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...medicine, 
        quantity, 
        subtotal: calculateItemSubtotal(medicine.sellingPrice, quantity) 
      }]);
    }
    return true;
  }, [cart]);

  const updateQuantity = useCallback((medicineId, quantity) => {
    setError(null);
    if (quantity <= 0) return;
    
    const item = cart.find(i => i.id === medicineId);
    if (!item) return;
    
    const validationError = validateCartItem(item, quantity);
    if (validationError) {
      setError(validationError);
      return false;
    }

    setCart(cart.map(i => 
      i.id === medicineId 
        ? { ...i, quantity, subtotal: calculateItemSubtotal(i.sellingPrice, quantity) }
        : i
    ));
    return true;
  }, [cart]);

  const removeFromCart = useCallback((medicineId) => {
    setCart(cart.filter(item => item.id !== medicineId));
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercent(0);
    setTaxPercent(0);
    setError(null);
  }, []);

  const handleCompleteSale = async (paymentMethod, customerName = '') => {
    setError(null);
    setIsProcessing(true);
    
    const { isValid, errors } = validateSale(cart, paymentMethod);
    
    if (!isValid) {
      setError(errors.join(' '));
      setIsProcessing(false);
      return { success: false, error: errors.join(' ') };
    }

    try {
      const saleData = {
        customerName,
        paymentMethod,
        ...totals
      };
      
      const result = await completeSale(cart, saleData, currentUser);
      clearCart();
      return result;
    } catch (err) {
      const msg = err.message || "An error occurred while completing the sale.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async (term) => {
    try {
      return await searchMedicines(term);
    } catch (err) {
      setError("Failed to search medicines.");
      return [];
    }
  };

  return {
    cart,
    totals,
    isProcessing,
    error,
    discountPercent,
    setDiscountPercent,
    taxPercent,
    setTaxPercent,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    handleCompleteSale,
    handleSearch
  };
};

export default useSales;

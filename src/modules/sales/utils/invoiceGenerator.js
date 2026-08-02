/**
 * Generates a professional invoice number.
 * Format: INV-YYYYMMDD-XXXX (e.g., INV-20231027-0001)
 * In a real-world scenario with high concurrency, the sequence number (XXXX) 
 * should be generated transactionally via Firestore, but this utility creates 
 * a timestamp-based or UUID-based deterministic fallback.
 */
export const generateInvoiceNumber = (sequence = null) => {
  const date = new Date();
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const dateString = `${year}${month}${day}`;

  if (sequence !== null) {
    const seqStr = String(sequence).padStart(4, '0');
    return `INV-${dateString}-${seqStr}`;
  }

  // Fallback if no sequential counter is provided: use random alphanumeric string
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateString}-${randomStr}`;
};

/**
 * Formats a given date for display on invoices.
 */
export const formatInvoiceDate = (dateParam) => {
  if (!dateParam) return '';
  const date = dateParam instanceof Date ? dateParam : new Date(dateParam.toDate ? dateParam.toDate() : dateParam);
  
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

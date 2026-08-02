import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  runTransaction, 
  serverTimestamp, 
  orderBy, 
  limit
} from 'firebase/firestore';
import db from '../../../firebase/firestore';
import { SALES_COLLECTIONS, SALE_STATUS, NOTIFICATION_TYPES, ACTION_TYPES, MODULES } from '../constants/salesConstants';
import { generateInvoiceNumber } from '../utils/invoiceGenerator';

/**
 * Searches inventory for available medicines.
 * Queries the 'medicines' collection and matches medicineName, genericName, barcode, category.
 */
export const searchMedicines = async (searchTerm) => {
  try {
    const medicinesRef = collection(db, SALES_COLLECTIONS.MEDICINES);
    // Fetch active medicines
    const q = query(medicinesRef, where('status', '==', 'ACTIVE'));
    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (e) {
      // Fallback query if status field is missing on some documents
      querySnapshot = await getDocs(medicinesRef);
    }
    
    const term = searchTerm.trim().toLowerCase();
    const results = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Exclude soft-deleted items if any returned from fallback
      if (data.status && data.status !== 'ACTIVE') return;

      const medName = data.medicineName || data.name || '';
      const genericName = data.genericName || '';
      const barcode = data.barcode || '';
      const category = data.category || '';
      const stock = Number(data.quantity ?? data.currentStock ?? 0);

      // Only include medicines with stock > 0
      if (stock <= 0) return;

      const match = 
        medName.toLowerCase().includes(term) ||
        genericName.toLowerCase().includes(term) ||
        barcode.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term);
        
      if (match) {
        results.push({
          id: docSnap.id,
          ...data,
          // Unified normalized fields for cross-component compatibility
          name: medName,
          medicineName: medName,
          genericName: genericName,
          barcode: barcode,
          category: category,
          batchNumber: data.batchNumber || 'N/A',
          expiryDate: data.expiryDate || '',
          sellingPrice: Number(data.sellingPrice || 0),
          purchasePrice: Number(data.purchasePrice || 0),
          quantity: stock,
          currentStock: stock,
          minimumStock: Number(data.minimumStock || 10)
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error("Error searching medicines:", error);
    throw new Error("Failed to search medicines.");
  }
};

/**
 * Completes a sale using an atomic Firestore transaction.
 */
export const completeSale = async (cart, saleData, user) => {
  try {
    const saleId = doc(collection(db, SALES_COLLECTIONS.SALES)).id;
    const invoiceNumber = generateInvoiceNumber();

    await runTransaction(db, async (transaction) => {
      // 1. Read all inventory items first (Firestore rule: Reads must happen before Writes in transactions)
      const inventoryRefs = cart.map(item => doc(db, SALES_COLLECTIONS.MEDICINES, item.id));
      const inventoryDocs = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));

      // Validate stock limits during transaction
      inventoryDocs.forEach((invDoc, index) => {
        if (!invDoc.exists()) {
          const medName = cart[index].medicineName || cart[index].name;
          throw new Error(`Medicine ${medName} does not exist in inventory.`);
        }
        const docData = invDoc.data();
        const availableStock = Number(docData.quantity ?? docData.currentStock ?? 0);
        if (availableStock < cart[index].quantity) {
          const medName = cart[index].medicineName || cart[index].name;
          throw new Error(`Insufficient stock for ${medName}. Available: ${availableStock}`);
        }
      });

      const timestamp = serverTimestamp();

      // 2. Perform all writes
      
      // Create Sale Document
      const subtotalVal = Number(saleData.subtotal || 0);
      const discountVal = Number(saleData.discount ?? saleData.discountAmount ?? 0);
      const taxVal = Number(saleData.tax ?? saleData.taxAmount ?? 0);
      const netAmountVal = Number(saleData.netAmount ?? saleData.grandTotal ?? 0);

      // Calculate total items in this sale for dashboard aggregation
      const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

      const saleRef = doc(db, SALES_COLLECTIONS.SALES, saleId);
      transaction.set(saleRef, {
        id: saleId,
        invoiceNumber,
        date: timestamp,
        pharmacistId: user?.uid || 'Unknown',
        customerName: saleData.customerName || 'Walk-in Customer',
        paymentMethod: saleData.paymentMethod || 'Cash',
        subtotal: subtotalVal,
        discount: discountVal,
        tax: taxVal,
        netAmount: netAmountVal,
        totalItems,
        status: SALE_STATUS.COMPLETED
      });

      cart.forEach((item, index) => {
        const invDocData = inventoryDocs[index].data();
        const prevStock = Number(invDocData.quantity ?? invDocData.currentStock ?? 0);
        const newStock = prevStock - item.quantity;
        const invRef = inventoryRefs[index];
        const medName = item.medicineName || item.name || 'Unknown Medicine';

        // Update Inventory (update both quantity and currentStock for full compatibility)
        transaction.update(invRef, { 
          quantity: newStock,
          currentStock: newStock
        });

        // Create Sale Item Document
        const saleItemRef = doc(collection(db, SALES_COLLECTIONS.SALE_ITEMS));
        transaction.set(saleItemRef, {
          saleId,
          medicineId: item.id || '',
          medicineName: medName,
          batchNumber: item.batchNumber || 'N/A',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.sellingPrice || 0),
          subtotal: Number(item.subtotal || 0)
        });

        // Create Inventory Log
        const invLogRef = doc(collection(db, SALES_COLLECTIONS.INVENTORY_LOGS));
        transaction.set(invLogRef, {
          medicineId: item.id || '',
          previousStock: prevStock,
          soldQuantity: Number(item.quantity || 1),
          newStock: newStock,
          saleId,
          userId: user?.uid || 'Unknown',
          timestamp
        });

        // Create Notification if stock is low
        const minStock = Number(invDocData.minimumStock || 10);
        if (newStock <= minStock) {
          const notifRef = doc(collection(db, SALES_COLLECTIONS.NOTIFICATIONS));
          transaction.set(notifRef, {
            type: NOTIFICATION_TYPES.LOW_STOCK,
            message: `Low stock alert for ${medName}. Only ${newStock} remaining.`,
            medicineId: item.id || '',
            isRead: false,
            timestamp
          });
        }
      });

      // Create Activity Log
      const activityLogRef = doc(collection(db, SALES_COLLECTIONS.ACTIVITY_LOGS));
      transaction.set(activityLogRef, {
        action: ACTION_TYPES.SALE_CREATED,
        module: MODULES.SALES,
        performedBy: user?.uid || 'Unknown',
        date: timestamp,
        details: `Sale completed: ${invoiceNumber}`
      });

    });

    return { success: true, saleId, invoiceNumber };
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error; // Re-throw to handle in UI
  }
};

/**
 * Fetches recent sales history
 */
export const getSalesHistory = async (limitCount = 500) => {
  try {
    const salesRef = collection(db, SALES_COLLECTIONS.SALES);
    const q = query(salesRef, orderBy('date', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    const sales = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      date: docSnap.data().date?.toDate() || new Date()
    }));

    // ── Back-fill totalItems for historical sales that predate the field ──
    // New sales always have totalItems written by completeSale().
    // Old sales won't have it, so we fetch their saleItems and sum quantities
    // using a single batched 'in' query (chunked to Firestore's 30-item limit).
    const missingSales = sales.filter(
      s => s.totalItems === undefined || s.totalItems === null
    );

    if (missingSales.length > 0) {
      const missingSaleIds = missingSales.map(s => s.id);

      // Build saleId → totalQuantity map via batched queries
      const itemsMap = {};

      // Firestore 'in' operator supports at most 30 values per query
      const CHUNK_SIZE = 30;
      const chunks = [];
      for (let i = 0; i < missingSaleIds.length; i += CHUNK_SIZE) {
        chunks.push(missingSaleIds.slice(i, i + CHUNK_SIZE));
      }

      await Promise.all(
        chunks.map(async (chunk) => {
          const itemsRef = collection(db, SALES_COLLECTIONS.SALE_ITEMS);
          const itemsQ   = query(itemsRef, where('saleId', 'in', chunk));
          const itemsSnap = await getDocs(itemsQ);
          itemsSnap.forEach(d => {
            const data = d.data();
            const sid  = data.saleId;
            itemsMap[sid] = (itemsMap[sid] || 0) + Number(data.quantity || 1);
          });
        })
      );

      // Attach computed totalItems to the in-memory sale objects
      return sales.map(s => {
        if (s.totalItems === undefined || s.totalItems === null) {
          return { ...s, totalItems: itemsMap[s.id] || 0 };
        }
        return s;
      });
    }

    return sales;
  } catch (error) {
    console.error("Error fetching sales history:", error);
    throw new Error("Failed to fetch sales history.");
  }
};

export const getSaleItems = async (saleId) => {
  try {
    const itemsRef = collection(db, SALES_COLLECTIONS.SALE_ITEMS);
    const q = query(itemsRef, where('saleId', '==', saleId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching sale items:", error);
    throw new Error("Failed to fetch sale items.");
  }
};

/**
 * Fetches low stock and expired counts for dashboard cards.
 */
export const getInventoryMetrics = async () => {
  try {
    const medicinesRef = collection(db, SALES_COLLECTIONS.MEDICINES);
    const snapshot = await getDocs(query(medicinesRef, where('status', '==', 'ACTIVE')));
    
    let lowStockCount = 0;
    let expiredCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const stock = Number(data.quantity ?? data.currentStock ?? 0);
      const minStock = Number(data.minimumStock || 10);
      const expiry = data.expiryDate || '';

      if (stock <= minStock) lowStockCount++;
      if (expiry && expiry < todayStr) expiredCount++;
    });

    return { lowStockCount, expiredCount };
  } catch (err) {
    console.error("Error fetching inventory metrics:", err);
    return { lowStockCount: 0, expiredCount: 0 };
  }
};

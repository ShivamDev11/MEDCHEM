/**
 * @file        aiDataService.js
 * @module      AI
 * @purpose     Intelligent data retrieval layer for Module 8 (Chatbot).
 *              Analyzes user questions, queries relevant Firestore collections
 *              using MedChem's existing services, and extracts factual data
 *              to serve as ground truth for Google Gemini.
 * @dependencies inventoryService, expiryService, salesService
 */

import { getDashboardInventoryData, getMedicines } from "../../inventory/services/inventoryService";
import { getAllExpiredAndExpiring } from "../../expiry/services/expiryService";
import { getSalesHistory } from "../../sales/services/salesService";

/**
 * Normalizes text for keyword matching.
 */
const normalize = (text) => (text || "").toLowerCase().trim();

/**
 * Common stop words to ignore when attempting to identify medicine names.
 */
const STOP_WORDS = new Set([
  "how", "many", "much", "is", "are", "there", "the", "a", "an", "of", "in", "for",
  "what", "which", "who", "whom", "where", "when", "why", "do", "does", "did", "can",
  "could", "would", "should", "will", "available", "left", "remaining", "stock", "stocks",
  "medicine", "medicines", "drug", "drugs", "tablet", "tablets", "syrup", "syrups",
  "capsule", "capsules", "injection", "injections", "item", "items", "details", "price",
  "cost", "rate", "expiry", "expiring", "expired", "date", "status", "low", "out",
  "current", "currently", "total", "count", "sales", "sale", "revenue", "tell", "me",
  "give", "show", "check", "find", "get", "please", "we", "have", "any"
]);

/**
 * Extracts potential medicine search terms from a natural language question.
 */
const extractSearchCandidate = (question) => {
  const words = question
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  return words.join(" ");
};

/**
 * Fetches relevant live Firestore data based on the question's content.
 * 
 * @param {string} question - The user's natural language input
 * @returns {Promise<{ category: string, summaryContext: object }>}
 */
export const fetchFirestoreContextForQuestion = async (question) => {
  const q = normalize(question);
  const todayStr = new Date().toISOString().split("T")[0];

  // ── 1. EXPIRY INTENT ────────────────────────────────────────────────────────
  // e.g. "which medicines are expired?", "what is expiring soon?", "expiry status"
  const isExpiryQuery =
    q.includes("expir") ||
    q.includes("shelf life") ||
    q.includes("near expiry");

  // ── 2. SALES & REVENUE INTENT ───────────────────────────────────────────────
  // e.g. "how many sales were made?", "total revenue", "items sold", "sales today"
  const isSalesQuery =
    q.includes("sale") ||
    q.includes("revenue") ||
    q.includes("sold") ||
    q.includes("income") ||
    q.includes("turnover") ||
    q.includes("transaction") ||
    q.includes("bill") ||
    q.includes("earning");

  // ── 3. LOW STOCK / OUT OF STOCK INTENT ──────────────────────────────────────
  // e.g. "which medicines are low in stock?", "out of stock", "shortage"
  const isLowStockQuery =
    (q.includes("low") && q.includes("stock")) ||
    q.includes("running out") ||
    q.includes("shortage") ||
    q.includes("reorder") ||
    q.includes("minimum stock");

  const isOutOfStockQuery =
    q.includes("out of stock") ||
    q.includes("zero stock") ||
    q.includes("empty stock") ||
    q.includes("finished");

  // ── 4. TOTAL MEDICINES / INVENTORY COUNT INTENT ─────────────────────────────
  // e.g. "how many medicines are available?", "total medicines count"
  const isTotalMedicinesQuery =
    (q.includes("how many") && (q.includes("medicine") || q.includes("drug") || q.includes("item"))) ||
    q.includes("total medicine") ||
    q.includes("inventory count") ||
    q.includes("how many items");

  // ── 5. CHECK SPECIFIC MEDICINE NAME CANDIDATE ──────────────────────────────
  const searchCandidate = extractSearchCandidate(question);

  // ── EXECUTE RELEVANT FIRESTORE SERVICE CALLS ───────────────────────────────

  // Case A: Expiry Query
  if (isExpiryQuery && !searchCandidate) {
    const expiredAndExpiring = await getAllExpiredAndExpiring();
    const expiredList = expiredAndExpiring.filter((m) => m.daysRemaining < 0);
    const criticalList = expiredAndExpiring.filter((m) => m.daysRemaining >= 0 && m.daysRemaining <= 30);
    const upcomingList = expiredAndExpiring.filter((m) => m.daysRemaining > 30 && m.daysRemaining <= 90);

    return {
      category: "EXPIRY",
      summaryContext: {
        todayDate: todayStr,
        totalExpiredCount: expiredList.length,
        expiredMedicines: expiredList.map((m) => ({
          medicineName: m.medicineName,
          genericName: m.genericName,
          batchNumber: m.batchNumber,
          expiryDate: m.expiryDate,
          stockRemaining: m.quantity ?? m.currentStock ?? 0,
        })),
        criticalExpiringIn30DaysCount: criticalList.length,
        criticalExpiringList: criticalList.slice(0, 15).map((m) => ({
          medicineName: m.medicineName,
          batchNumber: m.batchNumber,
          expiryDate: m.expiryDate,
          daysLeft: m.daysRemaining,
          stock: m.quantity ?? m.currentStock ?? 0,
        })),
        upcomingExpiringIn90DaysCount: upcomingList.length,
      },
    };
  }

  // Case B: Sales & Revenue Query
  if (isSalesQuery && !searchCandidate) {
    const sales = await getSalesHistory(500);
    const completedSales = sales.filter((s) => s.status !== "Cancelled");
    
    const totalSalesCount = completedSales.length;
    const totalRevenue = completedSales.reduce((acc, s) => acc + Number(s.netAmount || 0), 0);
    const totalUnitsSold = completedSales.reduce((acc, s) => acc + Number(s.totalItems || 1), 0);

    // Today's specific sales
    const todaySales = completedSales.filter((s) => {
      const d = s.date instanceof Date ? s.date : (s.date?.toDate ? s.date.toDate() : null);
      return d && d.toISOString().split("T")[0] === todayStr;
    });
    const todayRevenue = todaySales.reduce((acc, s) => acc + Number(s.netAmount || 0), 0);

    // Payment method breakdown
    const paymentMethods = completedSales.reduce((acc, s) => {
      const method = s.paymentMethod || "Cash";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    return {
      category: "SALES",
      summaryContext: {
        todayDate: todayStr,
        totalCompletedSalesCount: totalSalesCount,
        totalRevenueRupees: Math.round(totalRevenue * 100) / 100,
        totalUnitsSold,
        todaySalesCount: todaySales.length,
        todayRevenueRupees: Math.round(todayRevenue * 100) / 100,
        paymentMethodsBreakdown: paymentMethods,
        recentSalesPreview: completedSales.slice(0, 5).map((s) => ({
          invoiceNumber: s.invoiceNumber,
          customerName: s.customerName,
          netAmount: s.netAmount,
          paymentMethod: s.paymentMethod,
          totalItems: s.totalItems,
        })),
      },
    };
  }

  // Case C: Low Stock or Out of Stock Query
  if ((isLowStockQuery || isOutOfStockQuery) && !searchCandidate) {
    const inv = await getDashboardInventoryData();
    return {
      category: isOutOfStockQuery ? "OUT_OF_STOCK" : "LOW_STOCK",
      summaryContext: {
        todayDate: todayStr,
        outOfStockCount: inv.outOfStockList.length,
        outOfStockMedicines: inv.outOfStockList.map((m) => ({
          medicineName: m.medicineName,
          genericName: m.genericName,
          category: m.category,
          batchNumber: m.batchNumber,
          minimumStock: m.minimumStock,
        })),
        lowStockCount: inv.lowStockList.length,
        lowStockMedicines: inv.lowStockList.map((m) => ({
          medicineName: m.medicineName,
          genericName: m.genericName,
          currentStock: m.quantity ?? m.currentStock ?? 0,
          minimumStock: m.minimumStock,
          category: m.category,
          supplier: m.supplier,
        })),
      },
    };
  }

  // Case D: General Total Inventory Count
  if (isTotalMedicinesQuery && !searchCandidate) {
    const inv = await getDashboardInventoryData();
    return {
      category: "INVENTORY_TOTAL",
      summaryContext: {
        todayDate: todayStr,
        totalMedicinesCount: inv.totalMedicines,
        lowStockCount: inv.lowStockList.length,
        outOfStockCount: inv.outOfStockList.length,
        expiringSoonCount: inv.expiringSoonList.length,
      },
    };
  }

  // Case E: Search for Specific Medicine or Salt
  // Fetch active medicines catalog
  const { medicines } = await getMedicines("createdAt", "desc", 1); // fetches all active medicines
  
  if (searchCandidate) {
    const candidateLower = searchCandidate.toLowerCase();
    const candidateParts = candidateLower.split(" ").filter((p) => p.length > 2);

    // Search by medicineName, genericName, manufacturer, category
    const matchedMedicines = medicines.filter((m) => {
      const name = (m.medicineName || "").toLowerCase();
      const generic = (m.genericName || "").toLowerCase();
      const cat = (m.category || "").toLowerCase();
      const mfg = (m.manufacturer || "").toLowerCase();

      return (
        name.includes(candidateLower) ||
        generic.includes(candidateLower) ||
        candidateParts.some((part) => name.includes(part) || generic.includes(part) || cat.includes(part) || mfg.includes(part))
      );
    });

    if (matchedMedicines.length > 0) {
      return {
        category: "SPECIFIC_MEDICINE",
        summaryContext: {
          searchQuery: searchCandidate,
          matchedCount: matchedMedicines.length,
          medicines: matchedMedicines.slice(0, 10).map((m) => ({
            medicineName: m.medicineName,
            genericName: m.genericName,
            stockQuantity: Number(m.quantity ?? m.currentStock ?? 0),
            minimumStockThreshold: Number(m.minimumStock || 10),
            sellingPrice: Number(m.sellingPrice || 0),
            purchasePrice: Number(m.purchasePrice || 0),
            expiryDate: m.expiryDate || "N/A",
            isExpired: m.expiryDate ? m.expiryDate < todayStr : false,
            batchNumber: m.batchNumber || "N/A",
            category: m.category || "General",
            manufacturer: m.manufacturer || "N/A",
            supplier: m.supplier || "N/A",
          })),
        },
      };
    }
  }

  // Case F: Fallback / Comprehensive Pharmacy Snapshot
  // When question is broad (e.g. "Give me a summary of the pharmacy", "Status report", etc.)
  const inv = await getDashboardInventoryData();
  const sales = await getSalesHistory(50);
  const completedSales = sales.filter((s) => s.status !== "Cancelled");
  const totalRevenue = completedSales.reduce((acc, s) => acc + Number(s.netAmount || 0), 0);

  return {
    category: "GENERAL_OVERVIEW",
    summaryContext: {
      todayDate: todayStr,
      inventorySummary: {
        totalMedicinesCount: inv.totalMedicines,
        lowStockCount: inv.lowStockList.length,
        outOfStockCount: inv.outOfStockList.length,
        expiringSoonCount: inv.expiringSoonList.length,
        lowStockSample: inv.lowStockList.slice(0, 5).map((m) => m.medicineName),
        outOfStockSample: inv.outOfStockList.slice(0, 5).map((m) => m.medicineName),
      },
      salesSummary: {
        totalCompletedSales: completedSales.length,
        totalRevenueRupees: Math.round(totalRevenue * 100) / 100,
      },
    },
  };
};

/**
 * @file        aiDataService.js
 * @module      AI
 * @purpose     Intelligent data retrieval and execution layer for MedChem AI Chatbot.
 *              Validates and executes structured query plans, retrieves ONLY the required
 *              Firestore data, performs aggregations and calculations in application code,
 *              and produces minimal, strictly filtered context for Gemini.
 *
 * KEY RULES:
 *  - Do NOT fetch all medicines if medicine data is not needed.
 *  - Specific medicine lookups search active medicines collection directly (never Expiry Tracker).
 *  - Ambiguous medicine names trigger a clarification question.
 *  - Numeric calculations (counts, sums, aggregations) happen in JS, never in Gemini.
 *  - Context contains ONLY the requested fields for specific medicine queries.
 *  - Read-only: Never modifies any Firestore documents.
 */

import { collection, getDocs, query, where, limit as firestoreLimit } from "firebase/firestore";
import db from "../../../firebase/firestore";
import { getDashboardInventoryData } from "../../inventory/services/inventoryService";
import { getAllExpiredAndExpiring } from "../../expiry/services/expiryService";
import { getSalesHistory } from "../../sales/services/salesService";

// ─────────────────────────────────────────────────────────────────────────────
// SHORT-LIVED IN-MEMORY CACHE (30 seconds TTL)
// Avoids repeated full collections reads during rapid conversational turns.
// ─────────────────────────────────────────────────────────────────────────────
let cachedActiveMedicines = null;
let cacheExpiryTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Fetches all active medicines from Firestore, using a short-lived cache when valid.
 */
export const fetchAllActiveMedicines = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedActiveMedicines && now < cacheExpiryTime) {
    return cachedActiveMedicines;
  }

  const medicinesRef = collection(db, "medicines");
  const q = query(medicinesRef, where("status", "==", "ACTIVE"));
  const snapshot = await getDocs(q);
  const medicines = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  cachedActiveMedicines = medicines;
  cacheExpiryTime = now + CACHE_TTL_MS;
  return medicines;
};

/**
 * Fetches recent saleItems collection documents for item-level sales analysis.
 */
export const fetchRecentSaleItems = async (maxCount = 500) => {
  try {
    const saleItemsRef = collection(db, "saleItems");
    const q = query(saleItemsRef, firestoreLimit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("[aiDataService] Failed to fetch saleItems:", err);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ALLOWED CONSTANTS & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
export const ALLOWED_AGGREGATION_TYPES = new Set([
  "single_medicine",
  "list",
  "count",
  "revenue",
  "sales_count",
  "items_sold",
  "top_selling",
  "medicine_sales",
  "combined_stats",
  "overview",
  "greeting",
  "out_of_scope",
]);

export const ALLOWED_MEDICINE_FIELDS = new Set([
  "medicineName",
  "genericName",
  "stock",
  "expiryDate",
  "sellingPrice",
  "purchasePrice",
  "manufacturer",
  "supplier",
  "category",
  "batchNumber",
  "all",
]);

export const ALLOWED_DATE_RANGES = new Set([
  "today",
  "thisWeek",
  "thisMonth",
  "lastMonth",
  "last7Days",
  "last30Days",
]);

/**
 * Validates and sanitizes a raw query plan object returned by Gemini or fallback.
 */
export const validateAndSanitizePlan = (rawPlan) => {
  if (!rawPlan || typeof rawPlan !== "object") {
    return {
      needsMedicines: false,
      needsSales: false,
      needsSaleItems: false,
      medicineNameQuery: null,
      resolveFromContext: false,
      requestedMedicineFields: ["stock"],
      medicineFilters: {},
      salesFilters: {},
      aggregationType: "out_of_scope",
      isOutOfScope: true,
      clarificationNeeded: null,
    };
  }

  // Sanitize aggregationType
  let aggType = String(rawPlan.aggregationType || "").toLowerCase().trim();
  if (!ALLOWED_AGGREGATION_TYPES.has(aggType)) {
    aggType = rawPlan.isOutOfScope ? "out_of_scope" : "overview";
  }

  // Sanitize requestedMedicineFields
  let fields = Array.isArray(rawPlan.requestedMedicineFields)
    ? rawPlan.requestedMedicineFields.map((f) => String(f).trim()).filter((f) => ALLOWED_MEDICINE_FIELDS.has(f))
    : [];
  if (fields.length === 0) {
    fields = ["stock"];
  }

  // Sanitize dateRange
  let dateRange = rawPlan.salesFilters?.dateRange;
  if (dateRange && !ALLOWED_DATE_RANGES.has(dateRange)) {
    dateRange = null;
  }

  return {
    needsMedicines: Boolean(rawPlan.needsMedicines),
    needsSales: Boolean(rawPlan.needsSales),
    needsSaleItems: Boolean(rawPlan.needsSaleItems),
    medicineNameQuery: typeof rawPlan.medicineNameQuery === "string" ? rawPlan.medicineNameQuery.trim() : null,
    resolveFromContext: Boolean(rawPlan.resolveFromContext),
    requestedMedicineFields: fields,
    medicineFilters: {
      lowStock: Boolean(rawPlan.medicineFilters?.lowStock),
      outOfStock: Boolean(rawPlan.medicineFilters?.outOfStock),
      expiredOnly: Boolean(rawPlan.medicineFilters?.expiredOnly),
      expiringSoonDays: typeof rawPlan.medicineFilters?.expiringSoonDays === "number"
        ? Math.max(1, Math.min(365, rawPlan.medicineFilters.expiringSoonDays))
        : null,
    },
    salesFilters: {
      groupByMedicine: Boolean(rawPlan.salesFilters?.groupByMedicine),
      dateRange,
    },
    aggregationType: aggType,
    isOutOfScope: Boolean(rawPlan.isOutOfScope),
    clarificationNeeded: rawPlan.clarificationNeeded ? String(rawPlan.clarificationNeeded).trim() : null,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT / PRONOUN & MEDICINE MATCHING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const norm = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

/**
 * Finds the last mentioned medicine from chat history.
 */
export const getLastMedicineFromHistory = (chatHistory = []) => {
  if (!Array.isArray(chatHistory) || chatHistory.length === 0) return null;
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    const msg = chatHistory[i];
    if (msg.role === "user" && msg._detectedMedicine) {
      return msg._detectedMedicine;
    }
  }
  return null;
};

/**
 * Searches active medicines for candidate string.
 * Returns: { match: object|null, ambiguousMatches: object[]|null }
 */
export const findMedicineMatches = (candidate, medicines) => {
  if (!candidate || !medicines || medicines.length === 0) {
    return { match: null, ambiguousMatches: null };
  }

  const queryNorm = norm(candidate);

  // 1. Exact match on medicineName
  const exactName = medicines.find((m) => norm(m.medicineName) === queryNorm);
  if (exactName) return { match: exactName, ambiguousMatches: null };

  // 2. Exact match on genericName
  const exactGeneric = medicines.find((m) => norm(m.genericName) === queryNorm);
  if (exactGeneric) return { match: exactGeneric, ambiguousMatches: null };

  // 3. Starts with medicineName
  const startsWithName = medicines.filter((m) => norm(m.medicineName).startsWith(queryNorm));
  if (startsWithName.length === 1) return { match: startsWithName[0], ambiguousMatches: null };
  if (startsWithName.length > 1) {
    return { match: null, ambiguousMatches: startsWithName };
  }

  // 4. Includes medicineName
  const includesName = medicines.filter((m) => norm(m.medicineName).includes(queryNorm));
  if (includesName.length === 1) return { match: includesName[0], ambiguousMatches: null };
  if (includesName.length > 1) {
    return { match: null, ambiguousMatches: includesName };
  }

  // 5. Includes genericName
  const includesGeneric = medicines.filter((m) => norm(m.genericName).includes(queryNorm));
  if (includesGeneric.length === 1) return { match: includesGeneric[0], ambiguousMatches: null };
  if (includesGeneric.length > 1) {
    return { match: null, ambiguousMatches: includesGeneric };
  }

  // 6. Token matching for multi-word candidate (e.g. "baby shampoo" for "Johnson's Baby Shampoo")
  const tokens = queryNorm.split(" ").filter((t) => t.length > 2);
  if (tokens.length > 1) {
    const multiMatch = medicines.filter((m) => {
      const fullText = norm(`${m.medicineName} ${m.genericName || ""}`);
      return tokens.every((t) => fullText.includes(t));
    });
    if (multiMatch.length === 1) return { match: multiMatch[0], ambiguousMatches: null };
    if (multiMatch.length > 1) return { match: null, ambiguousMatches: multiMatch };
  }

  return { match: null, ambiguousMatches: null };
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE RANGE BOUNDS
// ─────────────────────────────────────────────────────────────────────────────
export const getDateRangeBounds = (dateRange) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (dateRange) {
    case "today": {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "thisWeek": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "thisMonth": {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "lastMonth": {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0); // Last day of previous month
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "last7Days": {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "last30Days": {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    }
    default:
      return null;
  }

  return { start, end };
};

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE MEDICINE MINIMAL CONTEXT BUILDER
// Sends ONLY the requested field(s), never full objects or extra fields.
// ─────────────────────────────────────────────────────────────────────────────
const buildSpecificMedicineContext = (medicine, requestedFields = ["stock"]) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const medicineName = medicine.medicineName;
  const isExpired = medicine.expiryDate ? medicine.expiryDate < todayStr : false;

  // "all" requests get a clean curated summary — NOT the raw Firestore object
  if (requestedFields.includes("all")) {
    return {
      medicineName,
      genericName: medicine.genericName || "N/A",
      category: medicine.category || "N/A",
      stockQuantity: Number(medicine.quantity ?? medicine.currentStock ?? 0),
      minimumStock: Number(medicine.minimumStock || 0),
      sellingPrice: Number(medicine.sellingPrice || 0),
      purchasePrice: Number(medicine.purchasePrice || 0),
      expiryDate: medicine.expiryDate || "N/A",
      isExpired,
      batchNumber: medicine.batchNumber || "N/A",
      manufacturer: medicine.manufacturer || "N/A",
      supplier: medicine.supplier || "N/A",
    };
  }

  const contextData = { medicine: medicineName };

  requestedFields.forEach((field) => {
    switch (field) {
      case "stock":
        contextData.stock = Number(medicine.quantity ?? medicine.currentStock ?? 0);
        break;
      case "expiryDate":
        contextData.expiryDate = medicine.expiryDate || "N/A";
        contextData.isExpired = isExpired;
        break;
      case "sellingPrice":
        contextData.sellingPrice = Number(medicine.sellingPrice || 0);
        break;
      case "purchasePrice":
        contextData.purchasePrice = Number(medicine.purchasePrice || 0);
        break;
      case "manufacturer":
        contextData.manufacturer = medicine.manufacturer || "N/A";
        break;
      case "supplier":
        contextData.supplier = medicine.supplier || "N/A";
        break;
      case "category":
        contextData.category = medicine.category || "N/A";
        break;
      case "batchNumber":
        contextData.batchNumber = medicine.batchNumber || "N/A";
        break;
      case "genericName":
        contextData.genericName = medicine.genericName || "N/A";
        break;
      default:
        break;
    }
  });

  return contextData;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE QUERY PLAN
// The core application orchestrator that retrieves, filters, aggregates,
// and packages the minimal context for Gemini.
// ─────────────────────────────────────────────────────────────────────────────
export const executeQueryPlan = async (plan, chatHistory = []) => {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. OUT OF SCOPE
  if (plan.isOutOfScope || plan.aggregationType === "out_of_scope") {
    return {
      category: "OUT_OF_SCOPE",
      summaryContext: {
        message: "The question is outside the scope of MedChem pharmacy data. Explain politely what you can help with.",
      },
    };
  }

  // 2. GREETING
  if (plan.aggregationType === "greeting") {
    return {
      category: "GREETING",
      summaryContext: {
        message: "User is greeting. Introduce yourself briefly as the MedChem pharmacy assistant.",
      },
    };
  }

  // 3. CLARIFICATION NEEDED
  if (plan.clarificationNeeded) {
    return {
      category: "CLARIFICATION",
      summaryContext: {
        clarificationQuestion: plan.clarificationNeeded,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. SINGLE MEDICINE LOOKUP
  // Searches medicines collection directly (never Expiry Tracker!).
  // ───────────────────────────────────────────────────────────────────────────
  if (plan.aggregationType === "single_medicine") {
    let targetName = plan.medicineNameQuery;

    // Resolve context/pronoun if needed
    if (!targetName || plan.resolveFromContext) {
      const historyMed = getLastMedicineFromHistory(chatHistory);
      if (historyMed) {
        targetName = historyMed;
      }
    }

    if (!targetName) {
      return {
        category: "CLARIFICATION",
        summaryContext: {
          clarificationQuestion: "Which medicine would you like to know about?",
        },
      };
    }

    // Fetch active medicines (cached)
    const medicines = await fetchAllActiveMedicines();
    const { match, ambiguousMatches } = findMedicineMatches(targetName, medicines);

    // Handle ambiguous match
    if (ambiguousMatches && ambiguousMatches.length > 1) {
      const options = ambiguousMatches.slice(0, 4).map((m) => m.medicineName).join(", ");
      return {
        category: "CLARIFICATION",
        summaryContext: {
          clarificationQuestion: `I found multiple medicines matching "${targetName}": ${options}. Which one do you mean?`,
        },
      };
    }

    // Handle not found
    if (!match) {
      return {
        category: "MEDICINE_NOT_FOUND",
        summaryContext: {
          searchedFor: targetName,
          message: `${targetName} was not found in the current active inventory.`,
        },
      };
    }

    // Found exact medicine
    const filteredContext = buildSpecificMedicineContext(match, plan.requestedMedicineFields);
    return {
      category: "SINGLE_MEDICINE",
      summaryContext: filteredContext,
      detectedMedicine: match.medicineName, // Save for future follow-up context
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. MEDICINE LISTS & COMBINED FILTERS
  // E.g. low stock, out of stock, expired, expiring soon, or combinations
  // ───────────────────────────────────────────────────────────────────────────
  if (plan.aggregationType === "list") {
    const medicines = await fetchAllActiveMedicines();
    const { lowStock, outOfStock, expiredOnly, expiringSoonDays } = plan.medicineFilters;

    let filtered = [...medicines];

    if (outOfStock) {
      filtered = filtered.filter((m) => Number(m.quantity ?? m.currentStock ?? 0) <= 0);
    } else if (lowStock) {
      filtered = filtered.filter((m) => {
        const qty = Number(m.quantity ?? m.currentStock ?? 0);
        const min = Number(m.minimumStock || 10);
        return qty > 0 && qty <= min;
      });
    }

    if (expiredOnly) {
      filtered = filtered.filter((m) => m.expiryDate && m.expiryDate < todayStr);
    } else if (expiringSoonDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringSoonDays);
      const futureStr = futureDate.toISOString().split("T")[0];
      filtered = filtered.filter((m) => m.expiryDate && m.expiryDate >= todayStr && m.expiryDate <= futureStr);
    }

    return {
      category: "MEDICINE_LIST",
      summaryContext: {
        totalFound: filtered.length,
        filterDescription: [
          lowStock ? "low stock" : null,
          outOfStock ? "out of stock" : null,
          expiredOnly ? "expired" : null,
          expiringSoonDays ? `expiring within ${expiringSoonDays} days` : null,
        ].filter(Boolean).join(" and ") || "inventory",
        medicines: filtered.slice(0, 20).map((m) => ({
          name: m.medicineName,
          stock: Number(m.quantity ?? m.currentStock ?? 0),
          expiryDate: m.expiryDate || "N/A",
        })),
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. TOTAL COUNT & COMBINED STATS
  // Aggregated in JS code, never guessed by Gemini.
  // ───────────────────────────────────────────────────────────────────────────
  if (plan.aggregationType === "count" || plan.aggregationType === "combined_stats") {
    // If only total medicines asked
    if (plan.needsMedicines && !plan.medicineFilters.lowStock && !plan.medicineFilters.expiredOnly) {
      const invData = await getDashboardInventoryData();
      return {
        category: "COUNT",
        summaryContext: {
          totalMedicines: invData.totalMedicines,
        },
      };
    }

    // Combined stats (e.g. "how many are expired and how many are low stock?")
    const invData = await getDashboardInventoryData();
    const expiryData = await getAllExpiredAndExpiring();
    const expiredList = expiryData.filter((m) => m.daysRemaining < 0);
    const expiringSoonList = expiryData.filter((m) => m.daysRemaining >= 0 && m.daysRemaining <= 30);

    return {
      category: "COMBINED_STATS",
      summaryContext: {
        totalActiveMedicines: invData.totalMedicines,
        lowStockCount: invData.lowStockList.length,
        outOfStockCount: invData.outOfStockList.length,
        expiredCount: expiredList.length,
        expiringSoonCount: expiringSoonList.length,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. SALES TRANSACTIONS & REVENUE
  // Filtered by date range in application code.
  // ───────────────────────────────────────────────────────────────────────────
  if (plan.aggregationType === "revenue" || plan.aggregationType === "sales_count" || plan.aggregationType === "items_sold") {
    const rawSales = await getSalesHistory(500);
    const completedSales = rawSales.filter((s) => s.status !== "Cancelled");

    let targetSales = completedSales;
    const dateBounds = getDateRangeBounds(plan.salesFilters?.dateRange);
    if (dateBounds) {
      targetSales = completedSales.filter((s) => {
        const saleDate = s.date instanceof Date ? s.date : new Date(s.date);
        return saleDate >= dateBounds.start && saleDate <= dateBounds.end;
      });
    }

    if (plan.aggregationType === "revenue") {
      const totalRevenue = targetSales.reduce((sum, s) => sum + Number(s.netAmount || 0), 0);
      return {
        category: "REVENUE",
        summaryContext: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          currency: "INR (₹)",
          dateRange: plan.salesFilters?.dateRange || "all-time",
          salesCount: targetSales.length,
        },
      };
    }

    if (plan.aggregationType === "sales_count") {
      return {
        category: "SALES_COUNT",
        summaryContext: {
          totalSales: targetSales.length,
          dateRange: plan.salesFilters?.dateRange || "all-time",
        },
      };
    }

    if (plan.aggregationType === "items_sold") {
      const totalUnits = targetSales.reduce((sum, s) => sum + Number(s.totalItems || 0), 0);
      return {
        category: "ITEMS_SOLD",
        summaryContext: {
          totalUnitsSold: totalUnits,
          dateRange: plan.salesFilters?.dateRange || "all-time",
        },
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. SALE ITEMS (TOP-SELLING MEDICINE / MEDICINE SALES BREAKDOWN)
  // ───────────────────────────────────────────────────────────────────────────
  if (plan.aggregationType === "top_selling" || plan.aggregationType === "medicine_sales") {
    const saleItems = await fetchRecentSaleItems(500);

    // Aggregate units sold by medicineName
    const tally = {};
    saleItems.forEach((item) => {
      const name = item.medicineName || "Unknown";
      const qty = Number(item.quantity || 1);
      tally[name] = (tally[name] || 0) + qty;
    });

    const sortedMeds = Object.entries(tally)
      .map(([name, unitsSold]) => ({ name, unitsSold }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    if (plan.aggregationType === "top_selling") {
      const topMedicine = sortedMeds[0] || null;
      return {
        category: "TOP_SELLING",
        summaryContext: {
          topSellingMedicine: topMedicine ? topMedicine.name : "No sales recorded yet",
          unitsSold: topMedicine ? topMedicine.unitsSold : 0,
          topRankings: sortedMeds.slice(0, 5),
        },
      };
    }

    if (plan.aggregationType === "medicine_sales") {
      const searchTarget = norm(plan.medicineNameQuery || "");
      const matched = sortedMeds.find((m) => norm(m.name).includes(searchTarget));
      return {
        category: "MEDICINE_SALES",
        summaryContext: {
          medicineName: plan.medicineNameQuery || "Specified medicine",
          unitsSold: matched ? matched.unitsSold : 0,
          hasSalesRecords: Boolean(matched),
        },
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. PHARMACY OVERVIEW
  // ───────────────────────────────────────────────────────────────────────────
  if (plan.aggregationType === "overview") {
    const invData = await getDashboardInventoryData();
    const expiryData = await getAllExpiredAndExpiring();
    const sales = await getSalesHistory(100);
    const completedSales = sales.filter((s) => s.status !== "Cancelled");
    const totalRev = completedSales.reduce((acc, s) => acc + Number(s.netAmount || 0), 0);

    return {
      category: "OVERVIEW",
      summaryContext: {
        totalMedicines: invData.totalMedicines,
        lowStockCount: invData.lowStockList.length,
        outOfStockCount: invData.outOfStockList.length,
        expiredCount: expiryData.filter((m) => m.daysRemaining < 0).length,
        expiringSoonCount: expiryData.filter((m) => m.daysRemaining >= 0 && m.daysRemaining <= 30).length,
        totalSales: completedSales.length,
        totalRevenue: Math.round(totalRev * 100) / 100,
        currency: "INR (₹)",
      },
    };
  }

  // Default fallback
  return {
    category: "OUT_OF_SCOPE",
    summaryContext: {
      message: "Could not map query to MedChem data. Explain politely what you can assist with.",
    },
  };
};

/**
 * Backward-compatibility wrapper for any direct callers.
 */
export const fetchFirestoreContextForQuestion = async (question, chatHistory = []) => {
  // Simple default plan
  return executeQueryPlan({
    needsMedicines: true,
    needsSales: true,
    aggregationType: "overview",
  }, chatHistory);
};

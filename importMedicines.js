/**
 * @file        importMedicines.js
 * @purpose     Node.js seed script to populate Firestore with realistic pharmacy inventory data
 *              (medicines, personal care, baby care, nutrition, medical devices, first aid).
 * @usage       node importMedicines.js
 * @dependencies firebase/firestore, firebase/auth, ./src/firebase/firestore.js, ./src/firebase/auth.js
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import db from "./src/firebase/firestore.js";
import auth from "./src/firebase/auth.js";

// Reference date for expiry generation: 2026-08-04
const MEDICINES_DATA = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PRESCRIPTION & OTC MEDICINES (Tablets, Capsules, Syrups, Injections, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    medicineName: "Dolo 650mg Tablet",
    genericName: "Paracetamol",
    category: "Tablets",
    manufacturer: "Micro Labs Ltd",
    supplier: "Apollo Supply Chain",
    batchNumber: "DL2026-A1",
    barcode: "8901234500001",
    expiryDate: "2026-06-15", // Expired
    purchasePrice: 22.50,
    sellingPrice: 30.00,
    quantity: 5, // Low stock
    currentStock: 5,
    minimumStock: 20,
    description: "Fast relief from fever, mild to moderate pain and headache.",
    status: "ACTIVE",
  },
  {
    medicineName: "Crocin Advance 500mg Tablet",
    genericName: "Paracetamol",
    category: "Tablets",
    manufacturer: "GlaxoSmithKline",
    supplier: "MedPlus Distributors",
    batchNumber: "CR2026-B2",
    barcode: "8901234500002",
    expiryDate: "2026-08-15", // Expiring within 30 days
    purchasePrice: 15.00,
    sellingPrice: 20.50,
    quantity: 200, // High stock
    currentStock: 200,
    minimumStock: 30,
    description: "Effective fever and pain relief with Optizorb technology.",
    status: "ACTIVE",
  },
  {
    medicineName: "Augmentin 625 Duo Tablet",
    genericName: "Amoxicillin & Clavulanic Acid",
    category: "Tablets",
    manufacturer: "GlaxoSmithKline",
    supplier: "Sun Pharmaceutical Distributors",
    batchNumber: "AUG-625-X",
    barcode: "8901234500003",
    expiryDate: "2026-09-15", // Expiring within 60 days
    purchasePrice: 160.00,
    sellingPrice: 201.50,
    quantity: 45, // Medium stock
    currentStock: 45,
    minimumStock: 20,
    description: "Broad-spectrum antibiotic for bacterial respiratory and skin infections.",
    status: "ACTIVE",
  },
  {
    medicineName: "Azithral 500 Tablet",
    genericName: "Azithromycin",
    category: "Tablets",
    manufacturer: "Alembic Pharmaceuticals",
    supplier: "National Medical Agencies",
    batchNumber: "AZ-500-09",
    barcode: "8901234500004",
    expiryDate: "2026-10-15", // Expiring within 90 days
    purchasePrice: 95.00,
    sellingPrice: 119.00,
    quantity: 8, // Low stock
    currentStock: 8,
    minimumStock: 15,
    description: "Macrolide antibiotic for throat, lung, and ear infections.",
    status: "ACTIVE",
  },
  {
    medicineName: "Pantocid 40 Tablet",
    genericName: "Pantoprazole",
    category: "Tablets",
    manufacturer: "Sun Pharma",
    supplier: "Sun Pharmaceutical Distributors",
    batchNumber: "PAN40-881",
    barcode: "8901234500005",
    expiryDate: "2027-05-20", // Safe
    purchasePrice: 120.00,
    sellingPrice: 155.00,
    quantity: 150, // High stock
    currentStock: 150,
    minimumStock: 25,
    description: "Proton pump inhibitor for hyperacidity, GERD, and stomach ulcers.",
    status: "ACTIVE",
  },
  {
    medicineName: "Shelcal 500 Tablet",
    genericName: "Calcium & Vitamin D3",
    category: "Tablets",
    manufacturer: "Torrent Pharmaceuticals",
    supplier: "Vardhman Health",
    batchNumber: "SHL-500-12",
    barcode: "8901234500006",
    expiryDate: "2027-08-10", // Safe
    purchasePrice: 90.00,
    sellingPrice: 118.00,
    quantity: 180, // High stock
    currentStock: 180,
    minimumStock: 30,
    description: "Calcium supplement for bone health, osteoporosis, and joint support.",
    status: "ACTIVE",
  },
  {
    medicineName: "Becosules Z Capsule",
    genericName: "B-Complex with Vitamin C & Zinc",
    category: "Capsules",
    manufacturer: "Pfizer India",
    supplier: "Apollo Supply Chain",
    batchNumber: "BEC-Z-441",
    barcode: "8901234500007",
    expiryDate: "2026-07-01", // Expired
    purchasePrice: 35.00,
    sellingPrice: 48.00,
    quantity: 30, // Medium stock
    currentStock: 30,
    minimumStock: 15,
    description: "Multivitamin supplement for mouth ulcers, stamina, and skin health.",
    status: "ACTIVE",
  },
  {
    medicineName: "Pan 40 Tablet",
    genericName: "Pantoprazole",
    category: "Tablets",
    manufacturer: "Alkem Laboratories",
    supplier: "MedPlus Distributors",
    batchNumber: "PAN-ALK-03",
    barcode: "8901234500008",
    expiryDate: "2026-08-20", // Expiring within 30 days
    purchasePrice: 115.00,
    sellingPrice: 148.00,
    quantity: 4, // Low stock
    currentStock: 4,
    minimumStock: 20,
    description: "Effective antacid for acid reflux, heartburn, and gas problems.",
    status: "ACTIVE",
  },
  {
    medicineName: "Combiflam Tablet",
    genericName: "Ibuprofen & Paracetamol",
    category: "Tablets",
    manufacturer: "Sanofi India",
    supplier: "Religare Wellness Distribution",
    batchNumber: "CMB-7721",
    barcode: "8901234500009",
    expiryDate: "2027-11-05", // Safe
    purchasePrice: 30.00,
    sellingPrice: 41.50,
    quantity: 250, // High stock
    currentStock: 250,
    minimumStock: 40,
    description: "Dual action painkiller for body ache, muscle spasm, and joint inflammation.",
    status: "ACTIVE",
  },
  {
    medicineName: "Allegra 120mg Tablet",
    genericName: "Fexofenadine Hydrochloride",
    category: "Tablets",
    manufacturer: "Sanofi India",
    supplier: "National Medical Agencies",
    batchNumber: "ALG-120-04",
    barcode: "8901234500010",
    expiryDate: "2026-09-25", // Expiring within 60 days
    purchasePrice: 150.00,
    sellingPrice: 192.00,
    quantity: 90, // High stock
    currentStock: 90,
    minimumStock: 20,
    description: "Non-drowsy antihistamine for allergic rhinitis, sneezing, and hives.",
    status: "ACTIVE",
  },
  {
    medicineName: "Zocon 150 Tablet",
    genericName: "Fluconazole",
    category: "Tablets",
    manufacturer: "FDC Ltd",
    supplier: "Vardhman Health",
    batchNumber: "ZOC-150-77",
    barcode: "8901234500011",
    expiryDate: "2027-04-12", // Safe
    purchasePrice: 12.00,
    sellingPrice: 16.50,
    quantity: 6, // Low stock
    currentStock: 6,
    minimumStock: 10,
    description: "Single dose antifungal treatment for skin, nail, and candidal infections.",
    status: "ACTIVE",
  },
  {
    medicineName: "Benadryl Cough Syrup 100ml",
    genericName: "Diphenhydramine Hydrochloride",
    category: "Syrups",
    manufacturer: "Johnson & Johnson",
    supplier: "Apollo Supply Chain",
    batchNumber: "BND-SYP-11",
    barcode: "8901234500012",
    expiryDate: "2026-05-30", // Expired
    purchasePrice: 90.00,
    sellingPrice: 115.00,
    quantity: 3, // Low stock
    currentStock: 3,
    minimumStock: 10,
    description: "Soothes dry cough, throat irritation, and chest congestion.",
    status: "ACTIVE",
  },
  {
    medicineName: "Ascoril LS Syrup 100ml",
    genericName: "Levosalbutamol & Ambroxol",
    category: "Syrups",
    manufacturer: "Glenmark Pharmaceuticals",
    supplier: "MedPlus Distributors",
    batchNumber: "ASC-LS-99",
    barcode: "8901234500013",
    expiryDate: "2026-08-28", // Expiring within 30 days
    purchasePrice: 88.00,
    sellingPrice: 112.00,
    quantity: 85, // High stock
    currentStock: 85,
    minimumStock: 15,
    description: "Expectorant cough syrup for productive cough and bronchial asthma.",
    status: "ACTIVE",
  },
  {
    medicineName: "Zebexid 200mg Injection",
    genericName: "Linezolid",
    category: "Injections",
    manufacturer: "Sun Pharma",
    supplier: "Sun Pharmaceutical Distributors",
    batchNumber: "ZBX-INJ-02",
    barcode: "8901234500014",
    expiryDate: "2027-09-18", // Safe
    purchasePrice: 350.00,
    sellingPrice: 420.00,
    quantity: 2, // Low stock
    currentStock: 2,
    minimumStock: 5,
    description: "Oxazolidinone antibiotic for severe hospital-acquired pneumonia.",
    status: "ACTIVE",
  },
  {
    medicineName: "Monocef 1g Injection",
    genericName: "Ceftriaxone Sodium",
    category: "Injections",
    manufacturer: "Aristo Pharmaceuticals",
    supplier: "National Medical Agencies",
    batchNumber: "MNC-1G-55",
    barcode: "8901234500015",
    expiryDate: "2026-10-20", // Expiring within 90 days
    purchasePrice: 48.00,
    sellingPrice: 62.00,
    quantity: 25, // Medium stock
    currentStock: 25,
    minimumStock: 10,
    description: "Injectable third-generation cephalosporin for typhoid and surgical prophylaxis.",
    status: "ACTIVE",
  },
  {
    medicineName: "Betadine 10% Ointment 15g",
    genericName: "Povidone Iodine",
    category: "Ointments",
    manufacturer: "Win-Medicare",
    supplier: "Vardhman Health",
    batchNumber: "BTD-TNT-09",
    barcode: "8901234500016",
    expiryDate: "2027-12-01", // Safe
    purchasePrice: 42.00,
    sellingPrice: 55.00,
    quantity: 120, // High stock
    currentStock: 120,
    minimumStock: 20,
    description: "Antiseptic microbicidal ointment for minor cuts, burns, and wound dressing.",
    status: "ACTIVE",
  },
  {
    medicineName: "Quadriderm RF Cream 10g",
    genericName: "Beclomethasone & Neomycin",
    category: "Creams",
    manufacturer: "Sun Pharma",
    supplier: "Sun Pharmaceutical Distributors",
    batchNumber: "QDR-RF-33",
    barcode: "8901234500017",
    expiryDate: "2026-09-18", // Expiring within 60 days
    purchasePrice: 72.00,
    sellingPrice: 94.00,
    quantity: 35, // Medium stock
    currentStock: 35,
    minimumStock: 15,
    description: "Triple action cream for fungal, bacterial, and inflammatory dermatoses.",
    status: "ACTIVE",
  },
  {
    medicineName: "Ciplox 0.3% Eye Drops 10ml",
    genericName: "Ciprofloxacin",
    category: "Eye Drops",
    manufacturer: "Cipla Ltd",
    supplier: "Apollo Supply Chain",
    batchNumber: "CPX-EYE-88",
    barcode: "8901234500018",
    expiryDate: "2026-07-20", // Expired
    purchasePrice: 16.00,
    sellingPrice: 22.00,
    quantity: 5, // Low stock
    currentStock: 5,
    minimumStock: 12,
    description: "Antibacterial eye drops for conjunctivitis, corneal ulcers, and eye infections.",
    status: "ACTIVE",
  },
  {
    medicineName: "Otrivin Adult Nasal Spray 10ml",
    genericName: "Xylometazoline Hydrochloride",
    category: "Nasal Sprays",
    manufacturer: "GlaxoSmithKline",
    supplier: "MedPlus Distributors",
    batchNumber: "OTR-NSL-14",
    barcode: "8901234500019",
    expiryDate: "2027-07-22", // Safe
    purchasePrice: 78.00,
    sellingPrice: 98.00,
    quantity: 70, // High stock
    currentStock: 70,
    minimumStock: 15,
    description: "Fast decongestant spray relieving nasal blockage within 2 minutes.",
    status: "ACTIVE",
  },
  {
    medicineName: "Waxonil Ear Drops 10ml",
    genericName: "Paradichlorobenzene & Benzocaine",
    category: "Ear Drops",
    manufacturer: "Cipla Ltd",
    supplier: "Religare Wellness Distribution",
    batchNumber: "WXN-EAR-02",
    barcode: "8901234500020",
    expiryDate: "2027-10-10", // Safe
    purchasePrice: 45.00,
    sellingPrice: 60.00,
    quantity: 20, // Medium stock
    currentStock: 20,
    minimumStock: 10,
    description: "Softens earwax and relieves minor earache.",
    status: "ACTIVE",
  },
  {
    medicineName: "Volini Gel 30g",
    genericName: "Diclofenac Diethylamine & Menthol",
    category: "Gels",
    manufacturer: "Sun Pharma",
    supplier: "Sun Pharmaceutical Distributors",
    batchNumber: "VLN-GEL-40",
    barcode: "8901234500021",
    expiryDate: "2026-08-30", // Expiring within 30 days
    purchasePrice: 110.00,
    sellingPrice: 140.00,
    quantity: 95, // High stock
    currentStock: 95,
    minimumStock: 20,
    description: "Deep penetrating formula for joint pain, backache, and sprains.",
    status: "ACTIVE",
  },
  {
    medicineName: "Prevenar 13 Vaccine 0.5ml",
    genericName: "Pneumococcal Conjugate Vaccine",
    category: "Vaccines",
    manufacturer: "Pfizer India",
    supplier: "National Medical Agencies",
    batchNumber: "PRV-13-901",
    barcode: "8901234500022",
    expiryDate: "2026-10-28", // Expiring within 90 days
    purchasePrice: 3200.00,
    sellingPrice: 3800.00,
    quantity: 3, // Low stock
    currentStock: 3,
    minimumStock: 5,
    description: "Pneumococcal conjugate vaccine against pneumonia and meningitis.",
    status: "ACTIVE",
  },
  {
    medicineName: "Revital H Capsule",
    genericName: "Multivitamins, Minerals & Ginseng",
    category: "Capsules",
    manufacturer: "Sun Pharma",
    supplier: "Apollo Supply Chain",
    batchNumber: "RVT-H-600",
    barcode: "8901234500023",
    expiryDate: "2027-11-15", // Safe
    purchasePrice: 240.00,
    sellingPrice: 310.00,
    quantity: 110, // High stock
    currentStock: 110,
    minimumStock: 25,
    description: "Daily health supplement for energy, mental alertness, and immunity.",
    status: "ACTIVE",
  },
  {
    medicineName: "Evion 400 Capsule",
    genericName: "Vitamin E",
    category: "Capsules",
    manufacturer: "Procter & Gamble",
    supplier: "MedPlus Distributors",
    batchNumber: "EVN-400-19",
    barcode: "8901234500024",
    expiryDate: "2026-06-25", // Expired
    purchasePrice: 28.00,
    sellingPrice: 37.50,
    quantity: 10, // Low stock
    currentStock: 10,
    minimumStock: 30,
    description: "Antioxidant supplement for muscle health, skin repair, and hair nourishment.",
    status: "ACTIVE",
  },
  {
    medicineName: "Taxim O 200 Tablet",
    genericName: "Cefixime",
    category: "Tablets",
    manufacturer: "Alkem Laboratories",
    supplier: "Vardhman Health",
    batchNumber: "TXM-O200-8",
    barcode: "8901234500025",
    expiryDate: "2026-09-10", // Expiring within 60 days
    purchasePrice: 85.00,
    sellingPrice: 108.00,
    quantity: 50, // Medium stock
    currentStock: 50,
    minimumStock: 20,
    description: "Oral cephalosporin antibiotic for urinary tract and respiratory infections.",
    status: "ACTIVE",
  },
  {
    medicineName: "Supradyn Daily Multivitamin Tablet",
    genericName: "Multivitamins & Minerals with Zinc",
    category: "Tablets",
    manufacturer: "Bayer India",
    supplier: "Apollo Supply Chain",
    batchNumber: "SPR-DLY-77",
    barcode: "8901234500026",
    expiryDate: "2028-01-10", // Safe
    purchasePrice: 42.00,
    sellingPrice: 54.00,
    quantity: 160, // High stock
    currentStock: 160,
    minimumStock: 30,
    description: "Comprehensive daily micronutrient supplement for overall vitality.",
    status: "ACTIVE",
  },
  {
    medicineName: "Gelusil MPS Antacid Syrup 200ml",
    genericName: "Aluminium Hydroxide & Magnesium",
    category: "Syrups",
    manufacturer: "Pfizer India",
    supplier: "Religare Wellness Distribution",
    batchNumber: "GLS-MPS-44",
    barcode: "8901234500027",
    expiryDate: "2027-06-15", // Safe
    purchasePrice: 92.00,
    sellingPrice: 118.00,
    quantity: 75, // High stock
    currentStock: 75,
    minimumStock: 15,
    description: "Sugar-free antacid liquid relieving stomach gas and indigestion.",
    status: "ACTIVE",
  },
  {
    medicineName: "Corex DX Cough Syrup 100ml",
    genericName: "Dextromethorphan & Chlorpheniramine",
    category: "Syrups",
    manufacturer: "Pfizer India",
    supplier: "MedPlus Distributors",
    batchNumber: "CRX-DX-100",
    barcode: "8901234500028",
    expiryDate: "2026-08-12", // Expiring within 30 days
    purchasePrice: 95.00,
    sellingPrice: 122.00,
    quantity: 7, // Low stock
    currentStock: 7,
    minimumStock: 15,
    description: "Non-narcotic cough suppressant for allergic dry cough.",
    status: "ACTIVE",
  },
  {
    medicineName: "Neurobion Forte Tablet",
    genericName: "Vitamin B-Complex with B12",
    category: "Tablets",
    manufacturer: "Procter & Gamble",
    supplier: "National Medical Agencies",
    batchNumber: "NRB-FRT-01",
    barcode: "8901234500029",
    expiryDate: "2027-10-25", // Safe
    purchasePrice: 28.00,
    sellingPrice: 38.00,
    quantity: 300, // High stock
    currentStock: 300,
    minimumStock: 50,
    description: "Nerve care supplement supporting healthy nerve function and energy.",
    status: "ACTIVE",
  },
  {
    medicineName: "Limcee 500mg Chewable Tablet",
    genericName: "Vitamin C (Ascorbic Acid)",
    category: "Tablets",
    manufacturer: "Abbott India",
    supplier: "Apollo Supply Chain",
    batchNumber: "LMC-500-33",
    barcode: "8901234500030",
    expiryDate: "2027-09-05", // Safe
    purchasePrice: 18.00,
    sellingPrice: 24.50,
    quantity: 220, // High stock
    currentStock: 220,
    minimumStock: 40,
    description: "Orange flavored Vitamin C chewable tablet for immune defense.",
    status: "ACTIVE",
  },
  {
    medicineName: "Digene Acidity Relief Gel 200ml",
    genericName: "Magnesium Hydroxide & Simethicone",
    category: "Gels",
    manufacturer: "Abbott India",
    supplier: "Vardhman Health",
    batchNumber: "DGN-GEL-88",
    barcode: "8901234500031",
    expiryDate: "2026-10-08", // Expiring within 90 days
    purchasePrice: 105.00,
    sellingPrice: 135.00,
    quantity: 40, // Medium stock
    currentStock: 40,
    minimumStock: 15,
    description: "Fast-acting mint flavored antacid for acidity and bloated stomach.",
    status: "ACTIVE",
  },
  {
    medicineName: "Tobradex Eye Drops 5ml",
    genericName: "Tobramycin & Dexamethasone",
    category: "Eye Drops",
    manufacturer: "Alcon Laboratories",
    supplier: "National Medical Agencies",
    batchNumber: "TBD-EYE-05",
    barcode: "8901234500032",
    expiryDate: "2027-05-18", // Safe
    purchasePrice: 180.00,
    sellingPrice: 225.00,
    quantity: 4, // Low stock
    currentStock: 4,
    minimumStock: 10,
    description: "Steroid and antibiotic combination for post-operative eye inflammation.",
    status: "ACTIVE",
  },
  {
    medicineName: "Solvin Decongestant Syrup 60ml",
    genericName: "Phenylephrine & Chlorpheniramine",
    category: "Syrups",
    manufacturer: "IPCA Laboratories",
    supplier: "MedPlus Distributors",
    batchNumber: "SLV-DCG-12",
    barcode: "8901234500033",
    expiryDate: "2026-07-15", // Expired
    purchasePrice: 50.00,
    sellingPrice: 65.00,
    quantity: 6, // Low stock
    currentStock: 6,
    minimumStock: 10,
    description: "Pediatric cold and nasal decongestant syrup.",
    status: "ACTIVE",
  },
  {
    medicineName: "Dynapar AQ 1ml Injection",
    genericName: "Diclofenac Sodium",
    category: "Injections",
    manufacturer: "Troikaa Pharmaceuticals",
    supplier: "Religare Wellness Distribution",
    batchNumber: "DNP-AQ-100",
    barcode: "8901234500034",
    expiryDate: "2027-11-20", // Safe
    purchasePrice: 22.00,
    sellingPrice: 29.00,
    quantity: 30, // Medium stock
    currentStock: 30,
    minimumStock: 15,
    description: "Painless injectable NSAID for acute post-surgical and renal pain.",
    status: "ACTIVE",
  },
  {
    medicineName: "Skinlite Cream 25g",
    genericName: "Hydroquinone, Tretinoin & Mometasone",
    category: "Creams",
    manufacturer: "Zydus Healthcare",
    supplier: "Sun Pharmaceutical Distributors",
    batchNumber: "SKN-LTE-45",
    barcode: "8901234500035",
    expiryDate: "2026-09-05", // Expiring within 60 days
    purchasePrice: 140.00,
    sellingPrice: 178.00,
    quantity: 9, // Low stock
    currentStock: 9,
    minimumStock: 15,
    description: "Depigmenting cream for hyperpigmentation and melasma.",
    status: "ACTIVE",
  },
  {
    medicineName: "Sinarest Tablet",
    genericName: "Paracetamol, Phenylephrine & Chlorpheniramine",
    category: "Tablets",
    manufacturer: "Centaur Pharmaceuticals",
    supplier: "Apollo Supply Chain",
    batchNumber: "SNR-TAB-89",
    barcode: "8901234500036",
    expiryDate: "2027-08-14", // Safe
    purchasePrice: 55.00,
    sellingPrice: 72.00,
    quantity: 190, // High stock
    currentStock: 190,
    minimumStock: 30,
    description: "Multi-symptom cold, fever, and sinus headache formula.",
    status: "ACTIVE",
  },
  {
    medicineName: "Cyclopam Tablet",
    genericName: "Dicyclomine & Paracetamol",
    category: "Tablets",
    manufacturer: "Indoco Remedies",
    supplier: "Vardhman Health",
    batchNumber: "CYC-PAM-67",
    barcode: "8901234500037",
    expiryDate: "2027-12-10", // Safe
    purchasePrice: 40.00,
    sellingPrice: 52.00,
    quantity: 140, // High stock
    currentStock: 140,
    minimumStock: 20,
    description: "Antispasmodic tablet for abdominal pain and menstrual cramps.",
    status: "ACTIVE",
  },
  {
    medicineName: "Liv 52 Syrup 200ml",
    genericName: "Herbal Liver Care Extract",
    category: "Syrups",
    manufacturer: "Himalaya Wellness",
    supplier: "Apollo Supply Chain",
    batchNumber: "LIV-52-999",
    barcode: "8901234500038",
    expiryDate: "2028-02-15", // Safe
    purchasePrice: 130.00,
    sellingPrice: 165.00,
    quantity: 80, // High stock
    currentStock: 80,
    minimumStock: 15,
    description: "Ayurvedic hepato-protective syrup improving appetite and digestion.",
    status: "ACTIVE",
  },
  {
    medicineName: "Septilin Tablet",
    genericName: "Herbal Immunomodulator",
    category: "Tablets",
    manufacturer: "Himalaya Wellness",
    supplier: "MedPlus Distributors",
    batchNumber: "SPT-TAB-21",
    barcode: "8901234500039",
    expiryDate: "2026-10-18", // Expiring within 90 days
    purchasePrice: 110.00,
    sellingPrice: 142.00,
    quantity: 55, // Medium stock
    currentStock: 55,
    minimumStock: 20,
    description: "Natural resistance builder against recurrent upper respiratory tract infections.",
    status: "ACTIVE",
  },
  {
    medicineName: "Zinetac 150mg Tablet",
    genericName: "Ranitidine Hydrochloride",
    category: "Tablets",
    manufacturer: "GlaxoSmithKline",
    supplier: "National Medical Agencies",
    batchNumber: "ZNT-150-00",
    barcode: "8901234500040",
    expiryDate: "2026-04-10", // Expired
    purchasePrice: 10.00,
    sellingPrice: 14.00,
    quantity: 0, // Low stock (Out of stock)
    currentStock: 0,
    minimumStock: 20,
    description: "H2 blocker reducing gastric acid production.",
    status: "ACTIVE",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PERSONAL CARE (Face Wash, Sunscreen, Shampoo, Soaps, Oral Care)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    medicineName: "Himalaya Purifying Neem Face Wash 150ml",
    genericName: "Neem & Turmeric Cleanser",
    category: "Personal Care",
    manufacturer: "Himalaya Wellness",
    supplier: "Apollo Supply Chain",
    batchNumber: "HIM-NFW-01",
    barcode: "8901234500041",
    expiryDate: "2028-03-20", // Safe
    purchasePrice: 140.00,
    sellingPrice: 180.00,
    quantity: 60, // High stock
    currentStock: 60,
    minimumStock: 10,
    description: "Soap-free herbal face wash preventing pimples and clearing impurities.",
    status: "ACTIVE",
  },
  {
    medicineName: "Cetaphil Gentle Skin Cleanser 250ml",
    genericName: "Dermatological Sensitive Cleanser",
    category: "Personal Care",
    manufacturer: "Galderma India",
    supplier: "Religare Wellness Distribution",
    batchNumber: "CTP-GSC-88",
    barcode: "8901234500042",
    expiryDate: "2028-06-15", // Safe
    purchasePrice: 420.00,
    sellingPrice: 535.00,
    quantity: 25, // Medium stock
    currentStock: 25,
    minimumStock: 8,
    description: "Hydrating non-irritating cleanser recommended by dermatologists.",
    status: "ACTIVE",
  },
  {
    medicineName: "Nivea Soft Light Moisturizer 100ml",
    genericName: "Vitamin E & Jojoba Oil Cream",
    category: "Personal Care",
    manufacturer: "Nivea India",
    supplier: "MedPlus Distributors",
    batchNumber: "NIV-SFT-33",
    barcode: "8901234500043",
    expiryDate: "2026-09-30", // Expiring within 60 days
    purchasePrice: 150.00,
    sellingPrice: 199.00,
    quantity: 45, // High stock
    currentStock: 45,
    minimumStock: 10,
    description: "Non-greasy light moisturizing cream for face, hands and body.",
    status: "ACTIVE",
  },
  {
    medicineName: "Neutrogena Ultra Sheer Dry-Touch Sunblock SPF 50+",
    genericName: "Helioplex Broad Spectrum Sunscreen",
    category: "Personal Care",
    manufacturer: "Johnson & Johnson",
    supplier: "Apollo Supply Chain",
    batchNumber: "NTG-SPF-50",
    barcode: "8901234500044",
    expiryDate: "2027-11-30", // Safe
    purchasePrice: 520.00,
    sellingPrice: 650.00,
    quantity: 5, // Low stock
    currentStock: 5,
    minimumStock: 10,
    description: "Water resistant matte finish sunscreen preventing UVA/UVB damage.",
    status: "ACTIVE",
  },
  {
    medicineName: "Dove Intense Repair Shampoo 180ml",
    genericName: "Keratin Repair Shampoo",
    category: "Personal Care",
    manufacturer: "Hindustan Unilever",
    supplier: "Vardhman Health",
    batchNumber: "DOV-SHP-12",
    barcode: "8901234500045",
    expiryDate: "2028-01-20", // Safe
    purchasePrice: 135.00,
    sellingPrice: 175.00,
    quantity: 50, // High stock
    currentStock: 50,
    minimumStock: 12,
    description: "Nourishes heat-damaged hair and prevents split ends.",
    status: "ACTIVE",
  },
  {
    medicineName: "Head & Shoulders Anti-Dandruff Shampoo 180ml",
    genericName: "Zinc Pyrithione Shampoo",
    category: "Personal Care",
    manufacturer: "Procter & Gamble",
    supplier: "MedPlus Distributors",
    batchNumber: "HND-SHP-99",
    barcode: "8901234500046",
    expiryDate: "2026-10-25", // Expiring within 90 days
    purchasePrice: 145.00,
    sellingPrice: 185.00,
    quantity: 40, // High stock
    currentStock: 40,
    minimumStock: 10,
    description: "Removes up to 100% visible dandruff flakes and relieves itchy scalp.",
    status: "ACTIVE",
  },
  {
    medicineName: "Dettol Liquid Hand Wash Refill 750ml",
    genericName: "Antibacterial Liquid Soap",
    category: "Personal Care",
    manufacturer: "Reckitt Benckiser",
    supplier: "Apollo Supply Chain",
    batchNumber: "DTL-HW-750",
    barcode: "8901234500047",
    expiryDate: "2028-04-10", // Safe
    purchasePrice: 95.00,
    sellingPrice: 119.00,
    quantity: 100, // High stock
    currentStock: 100,
    minimumStock: 20,
    description: "10x better germ protection liquid handwash refill.",
    status: "ACTIVE",
  },
  {
    medicineName: "Colgate Total 12 Whole Mouth Protection Toothpaste 150g",
    genericName: "Fluoride Antibacterial Toothpaste",
    category: "Personal Care",
    manufacturer: "Colgate-Palmolive",
    supplier: "Vardhman Health",
    batchNumber: "CLG-TTL-15",
    barcode: "8901234500048",
    expiryDate: "2028-05-15", // Safe
    purchasePrice: 115.00,
    sellingPrice: 145.00,
    quantity: 120, // High stock
    currentStock: 120,
    minimumStock: 25,
    description: "12-hour antibacterial defense for teeth, tongue, cheeks and gums.",
    status: "ACTIVE",
  },
  {
    medicineName: "Listerine Cool Mint Mouthwash 250ml",
    genericName: "Antiseptic Oral Rinse",
    category: "Personal Care",
    manufacturer: "Johnson & Johnson",
    supplier: "MedPlus Distributors",
    batchNumber: "LST-MNT-25",
    barcode: "8901234500049",
    expiryDate: "2026-08-22", // Expiring within 30 days
    purchasePrice: 125.00,
    sellingPrice: 160.00,
    quantity: 6, // Low stock
    currentStock: 6,
    minimumStock: 15,
    description: "Kills 99.9% germs that cause bad breath and plaque.",
    status: "ACTIVE",
  },
  {
    medicineName: "Pears Pure & Gentle Glycerin Soap 125g",
    genericName: "Glycerin Bathing Soap",
    category: "Personal Care",
    manufacturer: "Hindustan Unilever",
    supplier: "Apollo Supply Chain",
    batchNumber: "PRS-SOP-01",
    barcode: "8901234500050",
    expiryDate: "2028-02-10", // Safe
    purchasePrice: 48.00,
    sellingPrice: 62.00,
    quantity: 90, // High stock
    currentStock: 90,
    minimumStock: 20,
    description: "Transparent bathing bar enriched with 98% pure glycerin and natural oils.",
    status: "ACTIVE",
  },
  {
    medicineName: "Bajaj Almond Drops Hair Oil 200ml",
    genericName: "Vitamin E Nourishing Hair Oil",
    category: "Personal Care",
    manufacturer: "Bajaj Consumer Care",
    supplier: "Religare Wellness Distribution",
    batchNumber: "BJJ-ALM-20",
    barcode: "8901234500051",
    expiryDate: "2028-07-01", // Safe
    purchasePrice: 130.00,
    sellingPrice: 168.00,
    quantity: 55, // High stock
    currentStock: 55,
    minimumStock: 10,
    description: "Light non-sticky hair oil with 6x Vitamin E for strong hair.",
    status: "ACTIVE",
  },
  {
    medicineName: "Nivea Fresh Active Deodorant Roll-On 50ml",
    genericName: "Ocean Extracts Antiperspirant",
    category: "Personal Care",
    manufacturer: "Nivea India",
    supplier: "National Medical Agencies",
    batchNumber: "NIV-DEO-50",
    barcode: "8901234500052",
    expiryDate: "2026-06-30", // Expired
    purchasePrice: 140.00,
    sellingPrice: 185.00,
    quantity: 2, // Low stock
    currentStock: 2,
    minimumStock: 8,
    description: "48-hour body odor protection with refreshing ocean extracts.",
    status: "ACTIVE",
  },
  {
    medicineName: "Biotique Bio Kelp Protein Shampoo 200ml",
    genericName: "Herbal Kelp & Neem Shampoo",
    category: "Personal Care",
    manufacturer: "Bio Veda Action Research",
    supplier: "Vardhman Health",
    batchNumber: "BTQ-KLP-09",
    barcode: "8901234500053",
    expiryDate: "2027-10-15", // Safe
    purchasePrice: 130.00,
    sellingPrice: 165.00,
    quantity: 18, // Medium stock
    currentStock: 18,
    minimumStock: 5,
    description: "Intense hair growth and therapeutic sea kelp nourishing cleanser.",
    status: "ACTIVE",
  },
  {
    medicineName: "Sensodyne Rapid Relief Toothpaste 80g",
    genericName: "Potassium Nitrate Sensitivity Relief",
    category: "Personal Care",
    manufacturer: "GlaxoSmithKline",
    supplier: "Apollo Supply Chain",
    batchNumber: "SNS-RPD-80",
    barcode: "8901234500054",
    expiryDate: "2027-12-20", // Safe
    purchasePrice: 160.00,
    sellingPrice: 210.00,
    quantity: 65, // High stock
    currentStock: 65,
    minimumStock: 15,
    description: "Clinically proven fast relief for sensitive tooth pain in 60 seconds.",
    status: "ACTIVE",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BABY CARE (Shampoo, Wipes, Diapers, Lotion, Powder)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    medicineName: "Johnson's Baby Shampoo 200ml",
    genericName: "No More Tears Baby Cleanser",
    category: "Baby Care",
    manufacturer: "Johnson & Johnson",
    supplier: "Apollo Supply Chain",
    batchNumber: "JNJ-SHP-20",
    barcode: "8901234500055",
    expiryDate: "2028-04-01", // Safe
    purchasePrice: 170.00,
    sellingPrice: 215.00,
    quantity: 35, // High stock
    currentStock: 35,
    minimumStock: 10,
    description: "Mild soap-free baby shampoo gentle on newborn eyes and scalp.",
    status: "ACTIVE",
  },
  {
    medicineName: "Johnson's Baby Lotion 200ml",
    genericName: "Gentle Coconut Oil Baby Lotion",
    category: "Baby Care",
    manufacturer: "Johnson & Johnson",
    supplier: "MedPlus Distributors",
    batchNumber: "JNJ-LTN-20",
    barcode: "8901234500056",
    expiryDate: "2026-09-12", // Expiring within 60 days
    purchasePrice: 165.00,
    sellingPrice: 205.00,
    quantity: 20, // Medium stock
    currentStock: 20,
    minimumStock: 8,
    description: "24-hour delicate skin moisture lock formula for infants.",
    status: "ACTIVE",
  },
  {
    medicineName: "Pampers Premium Care Diaper Pants (Medium 44 Pack)",
    genericName: "Soft Absorbent Baby Diapers",
    category: "Baby Care",
    manufacturer: "Procter & Gamble",
    supplier: "Vardhman Health",
    batchNumber: "PMP-MED-44",
    barcode: "8901234500057",
    expiryDate: "2028-08-10", // Safe
    purchasePrice: 750.00,
    sellingPrice: 899.00,
    quantity: 40, // High stock
    currentStock: 40,
    minimumStock: 10,
    description: "360-degree soft cottony diaper pants with wetness indicator.",
    status: "ACTIVE",
  },
  {
    medicineName: "Himalaya Gentle Baby Wipes (72 Wipes Pack)",
    genericName: "Aloe Vera & Lotus Baby Wipes",
    category: "Baby Care",
    manufacturer: "Himalaya Wellness",
    supplier: "Religare Wellness Distribution",
    batchNumber: "HIM-WPS-72",
    barcode: "8901234500058",
    expiryDate: "2027-09-15", // Safe
    purchasePrice: 140.00,
    sellingPrice: 180.00,
    quantity: 50, // High stock
    currentStock: 50,
    minimumStock: 12,
    description: "Alcohol-free hydrating baby wipes for diaper change routine.",
    status: "ACTIVE",
  },
  {
    medicineName: "Himalaya Baby Powder 200g",
    genericName: "Herbal Yashada Bhasma Powder",
    category: "Baby Care",
    manufacturer: "Himalaya Wellness",
    supplier: "Apollo Supply Chain",
    batchNumber: "HIM-PWD-20",
    barcode: "8901234500059",
    expiryDate: "2026-07-05", // Expired
    purchasePrice: 110.00,
    sellingPrice: 140.00,
    quantity: 4, // Low stock
    currentStock: 4,
    minimumStock: 10,
    description: "Keeps baby skin cool, dry and prevents diaper rash.",
    status: "ACTIVE",
  },
  {
    medicineName: "Sebamed Baby Protective Facial Cream 50ml",
    genericName: "pH 5.5 Protective Lipid Cream",
    category: "Baby Care",
    manufacturer: "Sebamed India",
    supplier: "National Medical Agencies",
    batchNumber: "SBM-FAC-50",
    barcode: "8901234500060",
    expiryDate: "2027-11-20", // Safe
    purchasePrice: 650.00,
    sellingPrice: 800.00,
    quantity: 3, // Low stock
    currentStock: 3,
    minimumStock: 5,
    description: "Dermatological facial cream shielding against dryness and saliva rash.",
    status: "ACTIVE",
  },
  {
    medicineName: "Chicco NaturalFeeling Feeding Bottle 150ml",
    genericName: "BPA-Free Silicone Nipple Bottle",
    category: "Baby Care",
    manufacturer: "Artsana India (Chicco)",
    supplier: "MedPlus Distributors",
    batchNumber: "CHC-BTL-15",
    barcode: "8901234500061",
    expiryDate: "2029-01-01", // Safe
    purchasePrice: 480.00,
    sellingPrice: 590.00,
    quantity: 12, // Medium stock
    currentStock: 12,
    minimumStock: 5,
    description: "Angled teat feeding bottle mimicking natural breastfeeding feel.",
    status: "ACTIVE",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. NUTRITION & HEALTH SUPPLEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    medicineName: "Ensure Vanilla Balanced Nutrition Powder 400g",
    genericName: "Adult Complete Protein Supplement",
    category: "Nutrition",
    manufacturer: "Abbott Healthcare",
    supplier: "Apollo Supply Chain",
    batchNumber: "NSR-VAN-40",
    barcode: "8901234500062",
    expiryDate: "2027-07-10", // Safe
    purchasePrice: 580.00,
    sellingPrice: 710.00,
    quantity: 30, // High stock
    currentStock: 30,
    minimumStock: 8,
    description: "Complete balanced nutrition with 32 essential nutrients for muscle strength.",
    status: "ACTIVE",
  },
  {
    medicineName: "Horlicks Classic Malt Health Drink 500g",
    genericName: "Malted Milk Micronutrient Powder",
    category: "Nutrition",
    manufacturer: "Hindustan Unilever",
    supplier: "Vardhman Health",
    batchNumber: "HRL-CL-500",
    barcode: "8901234500063",
    expiryDate: "2026-10-12", // Expiring within 90 days
    purchasePrice: 210.00,
    sellingPrice: 260.00,
    quantity: 40, // High stock
    currentStock: 40,
    minimumStock: 10,
    description: "Clinically proven to make kids taller, stronger and sharper.",
    status: "ACTIVE",
  },
  {
    medicineName: "Pediasure Chocolate Growth Powder 400g",
    genericName: "Pediatric Growth & Immunity Drink",
    category: "Nutrition",
    manufacturer: "Abbott Healthcare",
    supplier: "Religare Wellness Distribution",
    batchNumber: "PDS-CHO-40",
    barcode: "8901234500064",
    expiryDate: "2027-08-25", // Safe
    purchasePrice: 560.00,
    sellingPrice: 690.00,
    quantity: 22, // Medium stock
    currentStock: 22,
    minimumStock: 6,
    description: "Nutritional supplement supporting 50% faster child height growth.",
    status: "ACTIVE",
  },
  {
    medicineName: "Protinex Original High Protein Powder 400g",
    genericName: "Hydrolyzed Soy Protein Supplement",
    category: "Nutrition",
    manufacturer: "Danone India",
    supplier: "MedPlus Distributors",
    batchNumber: "PRT-ORG-40",
    barcode: "8901234500065",
    expiryDate: "2026-08-26", // Expiring within 30 days
    purchasePrice: 520.00,
    sellingPrice: 630.00,
    quantity: 5, // Low stock
    currentStock: 5,
    minimumStock: 10,
    description: "High protein drink with 34% protein content for recovery and stamina.",
    status: "ACTIVE",
  },
  {
    medicineName: "Ostocalcium Plus Chewable Tablet 30s",
    genericName: "Calcium & Vitamin D3 Chewable",
    category: "Nutrition",
    manufacturer: "GlaxoSmithKline",
    supplier: "National Medical Agencies",
    batchNumber: "OST-CHEW-3",
    barcode: "8901234500066",
    expiryDate: "2027-12-05", // Safe
    purchasePrice: 140.00,
    sellingPrice: 178.00,
    quantity: 70, // High stock
    currentStock: 70,
    minimumStock: 15,
    description: "Chewable calcium supplement for growing kids and bone strength.",
    status: "ACTIVE",
  },
  {
    medicineName: "Dexorange Syrup 200ml",
    genericName: "Ferric Ammonium Citrate & B12",
    category: "Nutrition",
    manufacturer: "Franco-Indian Pharmaceuticals",
    supplier: "Apollo Supply Chain",
    batchNumber: "DXR-SYP-20",
    barcode: "8901234500067",
    expiryDate: "2027-09-18", // Safe
    purchasePrice: 120.00,
    sellingPrice: 154.00,
    quantity: 60, // High stock
    currentStock: 60,
    minimumStock: 15,
    description: "Hematinic syrup for iron deficiency anemia and general fatigue.",
    status: "ACTIVE",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MEDICAL DEVICES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    medicineName: "Omron HEM 7120 Fully Automatic Digital BP Monitor",
    genericName: "Oscillometric Blood Pressure Monitor",
    category: "Medical Devices",
    manufacturer: "Omron Healthcare",
    supplier: "Apollo Supply Chain",
    batchNumber: "OMR-BP-712",
    barcode: "8901234500068",
    expiryDate: "2030-01-01", // Safe (Device durable)
    purchasePrice: 1750.00,
    sellingPrice: 2200.00,
    quantity: 15, // Medium stock
    currentStock: 15,
    minimumStock: 5,
    description: "One-touch accurate digital upper arm blood pressure & pulse monitor.",
    status: "ACTIVE",
  },
  {
    medicineName: "Accu-Chek Active Blood Glucose Monitor Kit",
    genericName: "Blood Glucose Test Kit with 10 Strips",
    category: "Medical Devices",
    manufacturer: "Roche Diagnostics",
    supplier: "National Medical Agencies",
    batchNumber: "ACU-ACT-10",
    barcode: "8901234500069",
    expiryDate: "2028-06-30", // Safe
    purchasePrice: 850.00,
    sellingPrice: 1099.00,
    quantity: 4, // Low stock
    currentStock: 4,
    minimumStock: 5,
    description: "Painless self-monitoring blood sugar testing kit with lancets.",
    status: "ACTIVE",
  },
  {
    medicineName: "Dr. Morepen Flexi Tip Digital Thermometer (MT-220)",
    genericName: "Waterproof Oral & Axillary Thermometer",
    category: "Medical Devices",
    manufacturer: "Dr. Morepen",
    supplier: "Vardhman Health",
    batchNumber: "MRP-THM-22",
    barcode: "8901234500070",
    expiryDate: "2030-01-01", // Safe
    purchasePrice: 190.00,
    sellingPrice: 260.00,
    quantity: 45, // High stock
    currentStock: 45,
    minimumStock: 10,
    description: "Flexible tip fast reading digital fever thermometer with beep alert.",
    status: "ACTIVE",
  },
  {
    medicineName: "Beurer PO30 Fingertip Pulse Oximeter",
    genericName: "SpO2 & Heart Rate Monitor",
    category: "Medical Devices",
    manufacturer: "Beurer India",
    supplier: "Religare Wellness Distribution",
    batchNumber: "BRR-OX-300",
    barcode: "8901234500071",
    expiryDate: "2030-01-01", // Safe
    purchasePrice: 1200.00,
    sellingPrice: 1550.00,
    quantity: 3, // Low stock
    currentStock: 3,
    minimumStock: 5,
    description: "Non-invasive oxygen saturation SpO2 and arterial pulse measurement device.",
    status: "ACTIVE",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. FIRST AID & GENERAL HEALTHCARE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    medicineName: "Dettol Antiseptic Liquid 250ml",
    genericName: "Chloroxylenol Antiseptic Solution",
    category: "First Aid",
    manufacturer: "Reckitt Benckiser",
    supplier: "Apollo Supply Chain",
    batchNumber: "DTL-ANT-25",
    barcode: "8901234500072",
    expiryDate: "2028-05-10", // Safe
    purchasePrice: 110.00,
    sellingPrice: 138.00,
    quantity: 80, // High stock
    currentStock: 80,
    minimumStock: 15,
    description: "Concentrated wound disinfectant, floor cleaner and laundry sanitizer.",
    status: "ACTIVE",
  },
  {
    medicineName: "Hansaplast Washproof Bandages (100 Strips Box)",
    genericName: "Adhesive Sterile Bandages",
    category: "First Aid",
    manufacturer: "Beiersdorf India",
    supplier: "MedPlus Distributors",
    batchNumber: "HNS-BDG-100",
    barcode: "8901234500073",
    expiryDate: "2028-10-01", // Safe
    purchasePrice: 160.00,
    sellingPrice: 200.00,
    quantity: 50, // High stock
    currentStock: 50,
    minimumStock: 10,
    description: "Waterproof breathable adhesive strips protecting small wounds from dirt.",
    status: "ACTIVE",
  },
  {
    medicineName: "Moov Pain Relief Specialist Cream 50g",
    genericName: "Ayurvedic Turpentine & Nilgiri Oil",
    category: "First Aid",
    manufacturer: "Reckitt Benckiser",
    supplier: "Vardhman Health",
    batchNumber: "MOV-CRM-50",
    barcode: "8901234500074",
    expiryDate: "2026-09-22", // Expiring within 60 days
    purchasePrice: 135.00,
    sellingPrice: 175.00,
    quantity: 65, // High stock
    currentStock: 65,
    minimumStock: 15,
    description: "100% natural herbal formula relieving lower back pain and stiff muscles.",
    status: "ACTIVE",
  },
  {
    medicineName: "ORSL Electrolyte Rehydration Drink 200ml",
    genericName: "Oral Rehydration Salt Liquid",
    category: "First Aid",
    manufacturer: "Johnson & Johnson",
    supplier: "Apollo Supply Chain",
    batchNumber: "ORSL-APL-2",
    barcode: "8901234500075",
    expiryDate: "2027-04-30", // Safe
    purchasePrice: 28.00,
    sellingPrice: 36.00,
    quantity: 120, // High stock
    currentStock: 120,
    minimumStock: 25,
    description: "Ready to drink apple flavored electrolyte juice restoring fluid balance.",
    status: "ACTIVE",
  },
  {
    medicineName: "Savlon Antiseptic Liquid 500ml",
    genericName: "Cetrimide & Chlorhexidine Gluconate",
    category: "First Aid",
    manufacturer: "ITC Ltd",
    supplier: "Religare Wellness Distribution",
    batchNumber: "SVL-ANT-50",
    barcode: "8901234500076",
    expiryDate: "2028-03-15", // Safe
    purchasePrice: 140.00,
    sellingPrice: 175.00,
    quantity: 30, // Medium stock
    currentStock: 30,
    minimumStock: 10,
    description: "Sting-free antiseptic liquid for cuts, grazes and hygienic wash.",
    status: "ACTIVE",
  }
];

async function importMedicines() {
  console.log("🚀 Starting import of realistic pharmacy dataset into Firestore...");
  console.log(`Total products to import: ${MEDICINES_DATA.length}\n`);

  // Ensure authentication before write operations
  try {
    console.log("🔑 Authenticating with Firebase...");
    await signInAnonymously(auth);
    console.log("✅ Authenticated session established.");
  } catch (authError) {
    try {
      await signInWithEmailAndPassword(auth, "admin@medchem.com", "admin123");
      console.log("✅ Signed in with admin credentials.");
    } catch (loginError) {
      console.warn("⚠️ Authentication warning (proceeding as guest):", authError.message || loginError.message);
    }
  }

  const medicinesRef = collection(db, "medicines");
  let importedCount = 0;
  let errorCount = 0;

  for (const medicine of MEDICINES_DATA) {
    try {
      await addDoc(medicinesRef, {
        ...medicine,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      importedCount++;
      console.log(`[${importedCount}/${MEDICINES_DATA.length}] ✅ Added: ${medicine.medicineName} (${medicine.category})`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to add "${medicine.medicineName}":`, error.message);
    }
  }

  console.log("\n=================================================");
  if (errorCount === 0) {
    console.log(`🎉 50 Medicines Imported Successfully (${importedCount} Products Added)`);
  } else {
    console.log(`⚠️ Imported ${importedCount} items, but encountered ${errorCount} errors.`);
  }
  console.log("=================================================\n");

  process.exit(0);
}

// Execute seed script
importMedicines();

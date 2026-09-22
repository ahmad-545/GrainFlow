import { connectToDatabase } from "./db";
import {
  Product,
  DailyRate,
  Supplier,
  Purchase,
  Customer,
  Sale,
  CashBook,
  ActivityLog,
} from "./models";
import { ensureDefaultAdmin } from "./auth";

export async function seedDatabase(force = false) {
  await connectToDatabase();
  await ensureDefaultAdmin();

  const productCount = await Product.countDocuments();
  if (productCount > 0 && !force) {
    return { success: true, message: "Database already contains data." };
  }

  if (force) {
    await Product.deleteMany({});
    await DailyRate.deleteMany({});
    await Supplier.deleteMany({});
    await Purchase.deleteMany({});
    await Customer.deleteMany({});
    await Sale.deleteMany({});
    await CashBook.deleteMany({});
    await ActivityLog.deleteMany({});
  }

  // 1. Seed Products (Grain Types)
  const products = await Product.insertMany([
    {
      name: "Wheat (Gandum)",
      nameUrdu: "گندم (پنجاب گولڈن)",
      unit: "maund",
      currentStock: 450, // 450 maunds (~18,000 kg)
      minStockAlert: 50,
      grades: [
        { name: "Grade A (Clean Sharbati)", nameUrdu: "گریڈ اے (صاف گندم)", rateAdjustment: 150, stock: 250 },
        { name: "Grade B (Standard Mill Quality)", nameUrdu: "گریڈ بی (مل کوالٹی)", rateAdjustment: 0, stock: 200 },
      ],
      bagStock: { emptyBags: 320, filledBags: 450, bagCapacityKg: 50 },
      wastageRecords: [
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          quantity: 4,
          reason: "drying_weight_loss",
          notes: "Moisture drying after monsoon unloading",
        },
      ],
      notes: "Fresh harvest season wheat, stored in dry shed #1",
    },
    {
      name: "Super Basmati Rice",
      nameUrdu: "سپر باسمتی چاول",
      unit: "maund",
      currentStock: 280,
      minStockAlert: 40,
      grades: [
        { name: "Super Kernel Extra Long", nameUrdu: "سپر کرنل ایکسٹرا", rateAdjustment: 400, stock: 160 },
        { name: "Basmati Regular", nameUrdu: "باسمتی ریگولر", rateAdjustment: 0, stock: 120 },
      ],
      bagStock: { emptyBags: 200, filledBags: 280, bagCapacityKg: 50 },
      wastageRecords: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          quantity: 2,
          reason: "handling",
          notes: "Bag punctured during fork loading",
        },
      ],
      notes: "Aged 1 year basmati, premium export quality",
    },
    {
      name: "Yellow Corn (Makai)",
      nameUrdu: "مکئی زرد",
      unit: "maund",
      currentStock: 35, // Low stock alert triggered! (min is 40)
      minStockAlert: 40,
      grades: [
        { name: "Poultry Feed Grade", nameUrdu: "پولٹری فیڈ گریڈ", rateAdjustment: 0, stock: 35 },
      ],
      bagStock: { emptyBags: 80, filledBags: 35, bagCapacityKg: 50 },
      wastageRecords: [],
      notes: "Dry yellow corn, moisture level 13%",
    },
    {
      name: "Black Chickpeas (Kala Chana)",
      nameUrdu: "کالا چنا (دیسی)",
      unit: "maund",
      currentStock: 95,
      minStockAlert: 25,
      grades: [
        { name: "Bold Grain Premium", nameUrdu: "موٹا دانہ اعلیٰ", rateAdjustment: 200, stock: 60 },
        { name: "Standard Grade", nameUrdu: "عام دانہ", rateAdjustment: 0, stock: 35 },
      ],
      bagStock: { emptyBags: 110, filledBags: 95, bagCapacityKg: 50 },
      wastageRecords: [],
      notes: "Thal desert fresh pulse crop",
    },
    {
      name: "Mustard Seeds (Sarson)",
      nameUrdu: "سرسوں (تیل دار)",
      unit: "maund",
      currentStock: 65,
      minStockAlert: 20,
      grades: [
        { name: "High Oil Content", nameUrdu: "خالص تیل دار", rateAdjustment: 0, stock: 65 },
      ],
      bagStock: { emptyBags: 90, filledBags: 65, bagCapacityKg: 40 },
      wastageRecords: [],
      notes: "Oil mill grade yellow & black mixed seeds",
    },
  ]);

  // 2. Seed Suppliers
  const suppliers = await Supplier.insertMany([
    {
      name: "Chaudhry Agro Traders",
      phone: "0300-1234567",
      address: "Galla Mandi Gate 2, Sahiwal",
      totalPaid: 850000,
      totalPayable: 140000,
      notes: "Primary supplier for Sharbati wheat and corn",
    },
    {
      name: "Al-Rehman Grain Commission Agent",
      phone: "0321-7654321",
      address: "Chak 45/RB, Faisalabad",
      totalPaid: 1200000,
      totalPayable: 220000,
      notes: "Specializes in Super Basmati & Kainat paddy",
    },
    {
      name: "Kisan Farmer Group (Zulqarnain)",
      phone: "0345-9876543",
      address: "Depalpur Road, Okara",
      totalPaid: 450000,
      totalPayable: 0,
      notes: "Direct farmer procurement, cash payments on unloading",
    },
  ]);

  // 3. Seed Customers
  const customers = await Customer.insertMany([
    {
      name: "Haji Abdul Rasheed Flour Mills",
      phone: "0301-4455667",
      address: "Industrial Area, Lahore Road",
      isRegular: true,
      discountRate: 30, // Rs 30 off per maund
      totalPaid: 1450000,
      totalPending: 320000, // Udhaar
      advanceBalance: 0,
      ranking: "VIP",
      notes: "Bulk buyer of wheat, pays bi-weekly",
    },
    {
      name: "Malik Grain & Feed Industry",
      phone: "0333-8899001",
      address: "Bypass Chowk, Multan Road",
      isRegular: true,
      discountRate: 20,
      totalPaid: 920000,
      totalPending: 185000,
      advanceBalance: 0,
      ranking: "Gold",
      notes: "Regular yellow corn & broken rice buyer",
    },
    {
      name: "Tariq Kiryana Store",
      phone: "0312-5566778",
      address: "Main Bazaar, Old Mandi",
      isRegular: true,
      discountRate: 15,
      totalPaid: 380000,
      totalPending: 45000,
      advanceBalance: 50000, // Has advance payment booked!
      ranking: "Silver",
      notes: "Takes Basmati rice and Kala Chana bags",
    },
  ]);

  // 4. Seed Daily Rates for last 7 days to generate rich trends
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  const rateHistory = [
    { pIdx: 0, todayRate: 3950, yesterdayRate: 3900, status: "up" as const, diff: 50 },
    { pIdx: 1, todayRate: 11200, yesterdayRate: 11300, status: "down" as const, diff: -100 },
    { pIdx: 2, todayRate: 2850, yesterdayRate: 2850, status: "same" as const, diff: 0 },
    { pIdx: 3, todayRate: 6800, yesterdayRate: 6700, status: "up" as const, diff: 100 },
    { pIdx: 4, todayRate: 7400, yesterdayRate: 7350, status: "up" as const, diff: 50 },
  ];

  for (const r of rateHistory) {
    // Yesterday's rate
    await DailyRate.create({
      productId: products[r.pIdx]._id,
      productName: products[r.pIdx].name,
      rate: r.yesterdayRate,
      date: yesterdayStr,
      changeStatus: "same",
      changeDiff: 0,
      notes: "Closing market settlement",
    });
    // Today's rate
    await DailyRate.create({
      productId: products[r.pIdx]._id,
      productName: products[r.pIdx].name,
      rate: r.todayRate,
      date: todayStr,
      changeStatus: r.status,
      changeDiff: r.diff,
      notes: "Morning auction rate set by mandi committee",
    });
  }

  // 5. Seed Purchases
  const purchases = await Purchase.insertMany([
    {
      supplierId: suppliers[0]._id,
      supplierName: suppliers[0].name,
      productId: products[0]._id,
      productName: products[0].name,
      grade: "Grade A (Clean Sharbati)",
      quantity: 100,
      unit: "maund",
      rate: 3850,
      totalAmount: 385000,
      paidAmount: 300000,
      dueAmount: 85000,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: "Truck # LES-4589 delivered at warehouse",
    },
    {
      supplierId: suppliers[1]._id,
      supplierName: suppliers[1].name,
      productId: products[1]._id,
      productName: products[1].name,
      grade: "Super Kernel Extra Long",
      quantity: 60,
      unit: "maund",
      rate: 11000,
      totalAmount: 660000,
      paidAmount: 500000,
      dueAmount: 160000,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      notes: "Paddy processed milled rice",
    },
  ]);

  // 6. Seed Sales (Walk-in Local & Regular Customer)
  const sales = await Sale.insertMany([
    {
      invoiceNumber: "GF-2026-0001",
      customerType: "regular",
      customerId: customers[0]._id,
      customerName: customers[0].name,
      customerPhone: customers[0].phone,
      customerAddress: customers[0].address,
      items: [
        {
          productId: products[0]._id,
          productName: products[0].name,
          grade: "Grade A (Clean Sharbati)",
          quantity: 40,
          unit: "maund",
          rate: 3950,
          discount: 30,
          total: (3950 - 30) * 40, // 156,800
        },
      ],
      totalAmount: 158000,
      discountAmount: 1200,
      netAmount: 156800,
      paidAmount: 100000,
      dueAmount: 56800,
      paymentMethod: "bank",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: "Sent to Lahore mill gate via Mazda",
    },
    {
      invoiceNumber: "GF-2026-0002",
      customerType: "local",
      customerName: "Muhammad Imran (Walk-in)",
      customerPhone: "0305-1122334",
      customerAddress: "Chak 12/L",
      items: [
        {
          productId: products[1]._id,
          productName: products[1].name,
          grade: "Super Kernel Extra Long",
          quantity: 5,
          unit: "maund",
          rate: 11200,
          discount: 0,
          total: 56000,
        },
      ],
      totalAmount: 56000,
      discountAmount: 0,
      netAmount: 56000,
      paidAmount: 56000,
      dueAmount: 0,
      paymentMethod: "cash",
      date: new Date(),
      notes: "Spot cash sale with slip printed",
    },
    {
      invoiceNumber: "GF-2026-0003",
      customerType: "regular",
      customerId: customers[1]._id,
      customerName: customers[1].name,
      customerPhone: customers[1].phone,
      customerAddress: customers[1].address,
      items: [
        {
          productId: products[2]._id,
          productName: products[2].name,
          grade: "Poultry Feed Grade",
          quantity: 25,
          unit: "maund",
          rate: 2850,
          discount: 20,
          total: (2850 - 20) * 25, // 70,750
        },
      ],
      totalAmount: 71250,
      discountAmount: 500,
      netAmount: 70750,
      paidAmount: 50000,
      dueAmount: 20750,
      paymentMethod: "cash",
      date: new Date(),
      notes: "Partial payment received",
    },
  ]);

  // 7. Seed Cash Book Entries
  await CashBook.insertMany([
    {
      type: "income",
      category: "sale_payment",
      amount: 56000,
      paymentMethod: "cash",
      description: "Cash received from Walk-in sale (GF-2026-0002)",
      referenceId: "GF-2026-0002",
      date: new Date(),
    },
    {
      type: "income",
      category: "sale_payment",
      amount: 50000,
      paymentMethod: "cash",
      description: "Cash received from Malik Grain & Feed (GF-2026-0003)",
      referenceId: "GF-2026-0003",
      date: new Date(),
    },
    {
      type: "expense",
      category: "labor",
      amount: 4500,
      paymentMethod: "cash",
      description: "Hamali (Labor) charges for unloading 100 bags wheat",
      date: new Date(),
    },
    {
      type: "expense",
      category: "transport",
      amount: 12000,
      paymentMethod: "cash",
      description: "Mazda freight rent from Okara godown",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      type: "expense",
      category: "packing",
      amount: 8500,
      paymentMethod: "cash",
      description: "Purchased 100 Jute Bags (Bardana) @ Rs 85/bag",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      type: "expense",
      category: "electricity",
      amount: 6800,
      paymentMethod: "bank",
      description: "Shop electricity bill for warehouse lighting & fan",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ]);

  // 8. Seed Activity Log
  await ActivityLog.insertMany([
    { action: "SYSTEM_INIT", entity: "System", details: "GrainFlow initialized with Mandi defaults" },
    { action: "RATE_UPDATE", entity: "DailyRate", details: "Today's wheat rate adjusted to Rs 3,950/maund (+50)" },
    { action: "PURCHASE_ENTRY", entity: "Purchase", details: "100 maund wheat purchased from Chaudhry Agro" },
    { action: "SALE_ENTRY", entity: "Sale", details: "Slip GF-2026-0002 issued to Muhammad Imran (Walk-in)" },
  ]);

  return { success: true, message: "Database seeded successfully with mandi sample data!" };
}

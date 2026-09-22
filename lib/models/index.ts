import mongoose, { Schema, Document, Model } from "mongoose";

// ==========================================
// 1. PRODUCT (GRAIN TYPE)
// ==========================================
export interface IWastageRecord {
  date: Date;
  quantity: number;
  reason: "damage" | "rodents" | "drying_weight_loss" | "handling" | "other";
  notes?: string;
}

export interface IGrade {
  name: string;
  nameUrdu?: string;
  rateAdjustment: number; // e.g. +100 or -50 compared to base rate
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  nameUrdu: string;
  unit: "maund" | "kg" | "bag"; // Standard mandi unit (1 maund = 40kg)
  currentStock: number; // in base unit (kg or maund)
  openingStock: number; // initial stock set at creation
  openingStockUnit: "maund" | "kg" | "bag";
  initialRate: number; // rate per unit at setup
  openingStockValue: number; // initial capital value = openingStock * initialRate
  minStockAlert: number;
  grades: IGrade[];
  bagStock: {
    emptyBags: number;
    filledBags: number;
    bagCapacityKg: number;
  };
  wastageRecords: IWastageRecord[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    nameUrdu: { type: String, default: "" },
    unit: { type: String, enum: ["maund", "kg", "bag"], default: "maund" },
    currentStock: { type: Number, default: 0, min: 0 },
    openingStock: { type: Number, default: 0, min: 0 },
    openingStockUnit: { type: String, enum: ["maund", "kg", "bag"], default: "maund" },
    initialRate: { type: Number, default: 0, min: 0 },
    openingStockValue: { type: Number, default: 0, min: 0 },
    minStockAlert: { type: Number, default: 20 },
    grades: [
      {
        name: { type: String, required: true },
        nameUrdu: { type: String, default: "" },
        rateAdjustment: { type: Number, default: 0 },
        stock: { type: Number, default: 0 },
      },
    ],
    bagStock: {
      emptyBags: { type: Number, default: 100 },
      filledBags: { type: Number, default: 0 },
      bagCapacityKg: { type: Number, default: 50 },
    },
    wastageRecords: [
      {
        date: { type: Date, default: Date.now },
        quantity: { type: Number, required: true },
        reason: {
          type: String,
          enum: ["damage", "rodents", "drying_weight_loss", "handling", "other"],
          default: "damage",
        },
        notes: { type: String, default: "" },
      },
    ],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 1 });

// ==========================================
// 2. DAILY GRAIN RATE
// ==========================================
export interface IDailyRate extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  rate: number;
  date: string; // YYYY-MM-DD
  changeStatus: "up" | "down" | "same";
  changeDiff: number;
  notes?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyRateSchema = new Schema<IDailyRate>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, index: true }, // Format YYYY-MM-DD
    changeStatus: { type: String, enum: ["up", "down", "same"], default: "same" },
    changeDiff: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    updatedBy: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

// ==========================================
// 3. SUPPLIER
// ==========================================
export interface ISupplier extends Document {
  name: string;
  phone: string;
  address: string;
  totalPaid: number;
  totalPayable: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    totalPaid: { type: Number, default: 0, min: 0 },
    totalPayable: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

SupplierSchema.index({ name: 1 });
SupplierSchema.index({ totalPayable: -1 });

// ==========================================
// 4. PURCHASE
// ==========================================
export interface IPurchase extends Document {
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  grade: string;
  quantity: number;
  unit: "maund" | "kg" | "bag";
  rate: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: Date;
  notes?: string;
  returnDetails?: {
    isReturned: boolean;
    returnQuantity: number;
    returnAmount: number;
    returnDate?: Date;
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    grade: { type: String, default: "Standard" },
    quantity: { type: Number, required: true, min: 0.1 },
    unit: { type: String, enum: ["maund", "kg", "bag"], default: "maund" },
    rate: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    returnDetails: {
      isReturned: { type: Boolean, default: false },
      returnQuantity: { type: Number, default: 0 },
      returnAmount: { type: Number, default: 0 },
      returnDate: { type: Date },
      reason: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

PurchaseSchema.index({ supplierId: 1, date: -1 });
PurchaseSchema.index({ productId: 1, date: -1 });
PurchaseSchema.index({ date: -1 });

// ==========================================
// 5. CUSTOMER
// ==========================================
export interface ICustomer extends Document {
  name: string;
  phone: string;
  address: string;
  isRegular: boolean;
  discountRate: number; // percentage or fixed rate adjustment
  totalPaid: number;
  totalPending: number; // Udhaar / Credit
  advanceBalance: number; // Advance payments
  ranking: "Bronze" | "Silver" | "Gold" | "VIP";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    isRegular: { type: Boolean, default: false },
    discountRate: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    totalPending: { type: Number, default: 0 },
    advanceBalance: { type: Number, default: 0, min: 0 },
    ranking: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "VIP"],
      default: "Bronze",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ isRegular: 1, totalPending: -1 });
CustomerSchema.index({ totalPending: -1 });

// ==========================================
// 6. SALE
// ==========================================
export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  grade: string;
  quantity: number;
  unit: "maund" | "kg" | "bag";
  rate: number;
  discount: number;
  total: number;
}

export interface ISale extends Document {
  invoiceNumber: string;
  customerType: "local" | "regular";
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: ISaleItem[];
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: "cash" | "bank" | "cheque" | "advance";
  date: Date;
  notes?: string;
  returnDetails?: {
    isReturned: boolean;
    returnQuantity: number;
    returnAmount: number;
    returnDate?: Date;
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerType: { type: String, enum: ["local", "regular"], default: "local" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    customerAddress: { type: String, default: "" },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        grade: { type: String, default: "Standard" },
        quantity: { type: Number, required: true, min: 0.1 },
        unit: { type: String, enum: ["maund", "kg", "bag"], default: "maund" },
        rate: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "cheque", "advance"],
      default: "cash",
    },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    returnDetails: {
      isReturned: { type: Boolean, default: false },
      returnQuantity: { type: Number, default: 0 },
      returnAmount: { type: Number, default: 0 },
      returnDate: { type: Date },
      reason: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

SaleSchema.index({ customerId: 1, date: -1 });
SaleSchema.index({ customerType: 1, date: -1 });
SaleSchema.index({ date: -1 });

// ==========================================
// 7. CASH BOOK (ROZNAMCHA)
// ==========================================
export interface ICashBook extends Document {
  type: "income" | "expense";
  category:
    | "sale_payment"
    | "supplier_payment"
    | "transport"
    | "labor"
    | "rent"
    | "electricity"
    | "packing"
    | "other";
  amount: number;
  paymentMethod: "cash" | "bank" | "cheque";
  description: string;
  referenceId?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CashBookSchema = new Schema<ICashBook>(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    category: {
      type: String,
      enum: [
        "sale_payment",
        "supplier_payment",
        "transport",
        "labor",
        "rent",
        "electricity",
        "packing",
        "other",
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cash", "bank", "cheque"], default: "cash" },
    description: { type: String, default: "" },
    referenceId: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CashBookSchema.index({ type: 1, date: -1 });
CashBookSchema.index({ category: 1, date: -1 });
CashBookSchema.index({ referenceId: 1 });
CashBookSchema.index({ date: -1 });
DailyRateSchema.index({ productId: 1, date: -1 });

// ==========================================
// 8. USER / ADMIN
// ==========================================
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: "admin";
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  lastLogin?: Date;
  resetOtp?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLogin: { type: Date },
    resetOtp: { type: String, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true, strict: false }
);

if (mongoose.models.User) {
  delete (mongoose.models as any).User;
}

// ==========================================
// 9. ACTIVITY LOG
// ==========================================
export interface IActivityLog extends Document {
  action: string;
  entity: string;
  details: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    details: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Compile or reuse models (recompile in development to register new schema fields)
if (process.env.NODE_ENV === "development" && mongoose.models?.Product) {
  delete (mongoose.models as any).Product;
}
export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export const DailyRate: Model<IDailyRate> =
  mongoose.models.DailyRate || mongoose.model<IDailyRate>("DailyRate", DailyRateSchema);

export const Supplier: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);

export const Purchase: Model<IPurchase> =
  mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export const CashBook: Model<ICashBook> =
  mongoose.models.CashBook || mongoose.model<ICashBook>("CashBook", CashBookSchema);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

// ==========================================
// 10. SHOP SETTINGS
// ==========================================
export interface IShopSettings extends Document {
  shopName: string;
  shopNameUrdu?: string;
  shopAddress: string;
  shopPhone: string;
  shopLicense: string;
  receiptFooterNote?: string;
  updatedAt: Date;
}

const ShopSettingsSchema = new Schema<IShopSettings>(
  {
    shopName: { type: String, default: "Al-Rehman Grain Commission Shop" },
    shopNameUrdu: { type: String, default: "الرحمٰن غلہ کمیشن شاپ - غلہ منڈی" },
    shopAddress: { type: String, default: "Shop #42, Main Galla Mandi, Gate 1" },
    shopPhone: { type: String, default: "0300-1234567, 0321-7654321" },
    shopLicense: { type: String, default: "MANDI-FSD-2026-904" },
    receiptFooterNote: {
      type: String,
      default: "کمیشن شاپ پر مال تسلی بخش تولا اور بیچا جاتا ہے۔ کمپیوٹرائزڈ پرچہ منڈی",
    },
  },
  { timestamps: true }
);

export const ShopSettings: Model<IShopSettings> =
  mongoose.models.ShopSettings ||
  mongoose.model<IShopSettings>("ShopSettings", ShopSettingsSchema);


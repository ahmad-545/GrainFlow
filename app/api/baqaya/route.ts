import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Customer, Sale, Purchase, Supplier, CashBook, ActivityLog } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // 1. Fetch regular customers with outstanding balance (totalPending > 0)
    const regularCustomers = await Customer.find({ isRegular: true, totalPending: { $gt: 0 } })
      .sort({ totalPending: -1 })
      .lean();

    // Attach their pending orders
    const customerIds = regularCustomers.map((c) => c._id);
    const pendingSales = await Sale.find({
      customerId: { $in: customerIds },
      dueAmount: { $gt: 0 },
    })
      .sort({ date: -1 })
      .lean();

    const customerSalesMap: { [key: string]: any[] } = {};
    pendingSales.forEach((s) => {
      const cId = String(s.customerId);
      if (!customerSalesMap[cId]) customerSalesMap[cId] = [];
      customerSalesMap[cId].push(s);
    });

    const enrichedCustomers = regularCustomers.map((c) => ({
      ...c,
      pendingOrders: customerSalesMap[String(c._id)] || [],
    }));

    // 2. Fetch local walk-in sales with dueAmount > 0
    const localSales = await Sale.find({
      customerType: "local",
      dueAmount: { $gt: 0 },
    })
      .sort({ date: -1 })
      .lean();

    // 3. Fetch suppliers with payable balance > 0
    const suppliers = await Supplier.find({ totalPayable: { $gt: 0 } })
      .sort({ totalPayable: -1 })
      .lean();

    // Purchases with dueAmount > 0
    const pendingPurchases = await Purchase.find({ dueAmount: { $gt: 0 } })
      .sort({ date: -1 })
      .lean();

    // 4. Calculate Top Totals
    const totalCustomerBaqaya = regularCustomers.reduce((acc, c) => acc + (c.totalPending || 0), 0);
    const totalLocalBaqaya = localSales.reduce((acc, s) => acc + (s.dueAmount || 0), 0);
    const totalSupplierBaqaya = suppliers.reduce((acc, sp) => acc + (sp.totalPayable || 0), 0);
    const totalOverallBaqaya = totalCustomerBaqaya + totalLocalBaqaya;

    return NextResponse.json({
      summary: {
        totalCustomerBaqaya,
        totalLocalBaqaya,
        totalSupplierBaqaya,
        totalOverallBaqaya,
        countCustomers: regularCustomers.length,
        countLocalSlips: localSales.length,
        countSuppliers: suppliers.length,
      },
      regularCustomers: enrichedCustomers,
      localSales,
      suppliers,
      pendingPurchases,
    });
  } catch (error: any) {
    console.error("GET /api/baqaya error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Baqaya records", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action } = body;

    if (action === "clear_local_sale") {
      const { saleId, amount, paymentMethod = "cash", notes = "" } = body;

      const sale = await Sale.findById(saleId);
      if (!sale) {
        return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      }

      const payAmount = Number(amount) > 0 ? Math.min(Number(amount), sale.dueAmount) : sale.dueAmount;
      if (payAmount <= 0) {
        return NextResponse.json({ error: "No due amount to clear" }, { status: 400 });
      }

      sale.paidAmount += payAmount;
      sale.dueAmount = Math.max(0, sale.dueAmount - payAmount);
      if (notes) {
        sale.notes = sale.notes ? `${sale.notes} | Baqaya paid: ${notes}` : `Baqaya paid: ${notes}`;
      }
      await sale.save();

      // Log income to CashBook
      await CashBook.create({
        type: "income",
        category: "sale_payment",
        amount: payAmount,
        paymentMethod,
        description: `Walk-in Sale #${sale.invoiceNumber} Baqaya Cleared (${sale.customerName})`,
        referenceId: String(sale._id),
        date: new Date(),
      });

      // Activity log
      await ActivityLog.create({
        action: "BAQAYA_CLEARED",
        entity: "Sale",
        details: `Walk-in sale #${sale.invoiceNumber} baqaya of Rs ${payAmount.toLocaleString()} paid via ${paymentMethod}`,
      });

      return NextResponse.json({
        success: true,
        message: `Sale #${sale.invoiceNumber} baqaya payment of Rs ${payAmount.toLocaleString()} recorded!`,
        sale,
      });
    }

    if (action === "pay_supplier") {
      const { supplierId, purchaseId, amount, paymentMethod = "cash", notes = "" } = body;

      const supp = await Supplier.findById(supplierId);
      if (!supp) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      const payAmount = Number(amount);
      if (payAmount <= 0) {
        return NextResponse.json({ error: "Please enter a valid payment amount" }, { status: 400 });
      }

      supp.totalPayable = Math.max(0, supp.totalPayable - payAmount);
      await supp.save();

      if (purchaseId) {
        const pur = await Purchase.findById(purchaseId);
        if (pur) {
          pur.paidAmount += payAmount;
          pur.dueAmount = Math.max(0, pur.dueAmount - payAmount);
          await pur.save();
        }
      }

      // Log expense in CashBook
      await CashBook.create({
        type: "expense",
        category: "supplier_payment",
        amount: payAmount,
        paymentMethod,
        description: `Supplier Payment to ${supp.name} (${supp.phone || ""})`,
        referenceId: String(supp._id),
        date: new Date(),
      });

      await ActivityLog.create({
        action: "SUPPLIER_PAYMENT",
        entity: "Supplier",
        details: `Paid supplier ${supp.name} Rs ${payAmount.toLocaleString()} via ${paymentMethod}`,
      });

      return NextResponse.json({
        success: true,
        message: `Payment of Rs ${payAmount.toLocaleString()} to ${supp.name} recorded!`,
        supplier: supp,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/baqaya error:", error);
    return NextResponse.json(
      { error: "Failed to process Baqaya action", details: error.message },
      { status: 500 }
    );
  }
}

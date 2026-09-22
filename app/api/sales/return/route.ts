import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Sale, Product, Customer, CashBook, ActivityLog } from "@/lib/models";
import { convertQuantity } from "@/lib/units";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { saleId, returnQuantity, returnAmount, reason, refundCash } = body;
    const returnQty = Number(returnQuantity);
    const returnVal = Number(returnAmount);

    if (!saleId || returnQty <= 0) {
      return NextResponse.json(
        { error: "Sale ID and valid return quantity are required" },
        { status: 400 }
      );
    }

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // 1. Add stock back to first matching item's product
    const item = sale.items[0];
    if (item && item.productId) {
      const product = await Product.findById(item.productId);
      if (product) {
        const itemUnit = (item.unit || product.unit || "maund").toLowerCase();
        const productUnit = (product.unit || "maund").toLowerCase();
        const returnQtyInBase = convertQuantity(
          returnQty,
          itemUnit,
          productUnit,
          product.bagStock?.bagCapacityKg || 50
        );
        product.currentStock = Number((product.currentStock + returnQtyInBase).toFixed(3));
        await product.save();
      }
    }

    // 2. Adjust customer balance or cash refund
    if (sale.customerId) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        // If customer had pending balance, reduce pending balance
        if (customer.totalPending > 0) {
          customer.totalPending = Math.max(0, customer.totalPending - returnVal);
        }
        await customer.save();
      }
    }

    // If cash was refunded directly
    if (refundCash && returnVal > 0) {
      await CashBook.create({
        type: "expense",
        category: "other",
        amount: returnVal,
        paymentMethod: "cash",
        description: `Sale Return refund for Invoice #${sale.invoiceNumber}`,
        referenceId: sale.invoiceNumber,
        date: new Date(),
      });
    }

    // 3. Mark return on sale
    sale.returnDetails = {
      isReturned: true,
      returnQuantity: returnQty,
      returnAmount: returnVal,
      returnDate: new Date(),
      reason: reason || "Grain returned by customer",
    };
    await sale.save();

    await ActivityLog.create({
      action: "SALE_RETURN",
      entity: "Sale",
      details: `Processed return on slip #${sale.invoiceNumber} (${returnQty} units returned, Rs ${returnVal} adjusted)`,
    });

    return NextResponse.json({ success: true, sale });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

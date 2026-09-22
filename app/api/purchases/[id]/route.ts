import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Purchase, Product, Supplier, CashBook, ActivityLog } from "@/lib/models";
import { convertQuantity } from "@/lib/units";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const purchase = await Purchase.findById(id).lean();
    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const body = await request.json();
    const {
      supplierId,
      productId,
      grade,
      quantity,
      unit,
      rate,
      totalAmount,
      paidAmount,
      paymentMethod,
      date,
      notes,
    } = body;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    const newQty = Number(quantity);
    const newRate = Number(rate);
    const newTotal = Number(totalAmount) || newQty * newRate;
    const newPaid = Number(paidAmount) || 0;
    const newDue = Math.max(0, newTotal - newPaid);

    if (newQty <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than zero" }, { status: 400 });
    }

    // 1. Revert old stock from previous product
    const oldProduct = await Product.findById(purchase.productId);
    if (oldProduct) {
      const oldQtyInBase = convertQuantity(
        purchase.quantity,
        purchase.unit || oldProduct.unit || "maund",
        oldProduct.unit || "maund",
        oldProduct.bagStock?.bagCapacityKg || 50
      );
      oldProduct.currentStock = Math.max(
        0,
        Number((oldProduct.currentStock - oldQtyInBase).toFixed(3))
      );
      if (oldProduct.bagStock && oldProduct.bagStock.filledBags > 0) {
        const oldBags = Math.round(
          convertQuantity(
            purchase.quantity,
            purchase.unit || "maund",
            "bag",
            oldProduct.bagStock.bagCapacityKg || 50
          )
        );
        oldProduct.bagStock.filledBags = Math.max(0, oldProduct.bagStock.filledBags - oldBags);
      }
      await oldProduct.save();
    }

    // 2. Add new stock to new/target product
    const targetProductId = productId || purchase.productId;
    const newProduct = await Product.findById(targetProductId);
    if (!newProduct) {
      return NextResponse.json({ error: "Grain product not found" }, { status: 404 });
    }

    const targetUnit = unit || purchase.unit || newProduct.unit || "maund";
    const newQtyInBase = convertQuantity(
      newQty,
      targetUnit,
      newProduct.unit || "maund",
      newProduct.bagStock?.bagCapacityKg || 50
    );
    newProduct.currentStock = Number((newProduct.currentStock + newQtyInBase).toFixed(3));
    if (newProduct.bagStock) {
      const newBags = Math.round(
        convertQuantity(newQty, targetUnit, "bag", newProduct.bagStock.bagCapacityKg || 50)
      );
      newProduct.bagStock.filledBags += newBags;
    }
    await newProduct.save();

    // 3. Adjust Supplier Ledgers
    const targetSupplierId = supplierId || purchase.supplierId;
    const oldSupplier = await Supplier.findById(purchase.supplierId);
    const newSupplier = await Supplier.findById(targetSupplierId);

    if (oldSupplier && targetSupplierId.toString() === purchase.supplierId.toString()) {
      // Same supplier: adjust difference
      oldSupplier.totalPaid += (newPaid - purchase.paidAmount);
      oldSupplier.totalPayable += (newDue - purchase.dueAmount);
      await oldSupplier.save();
    } else {
      // Revert old supplier
      if (oldSupplier) {
        oldSupplier.totalPaid = Math.max(0, oldSupplier.totalPaid - purchase.paidAmount);
        oldSupplier.totalPayable = Math.max(0, oldSupplier.totalPayable - purchase.dueAmount);
        await oldSupplier.save();
      }
      // Apply to new supplier
      if (newSupplier) {
        newSupplier.totalPaid += newPaid;
        newSupplier.totalPayable += newDue;
        await newSupplier.save();
      }
    }

    // 4. Update CashBook expense entry
    const cashEntry = await CashBook.findOne({ referenceId: purchase._id.toString() });
    if (cashEntry) {
      if (newPaid > 0) {
        cashEntry.amount = newPaid;
        cashEntry.paymentMethod = paymentMethod || "cash";
        cashEntry.description = `Payment to ${newSupplier?.name || purchase.supplierName} for ${newQty} ${targetUnit} ${newProduct.name}`;
        if (date) cashEntry.date = new Date(date);
        await cashEntry.save();
      } else {
        await CashBook.findByIdAndDelete(cashEntry._id);
      }
    } else if (newPaid > 0) {
      await CashBook.create({
        type: "expense",
        category: "supplier_payment",
        amount: newPaid,
        paymentMethod: paymentMethod || "cash",
        description: `Payment to ${newSupplier?.name || purchase.supplierName} for ${newQty} ${targetUnit} ${newProduct.name}`,
        referenceId: purchase._id.toString(),
        date: date ? new Date(date) : purchase.date,
      });
    }

    // 5. Update Purchase Document
    purchase.supplierId = targetSupplierId;
    purchase.supplierName = newSupplier?.name || purchase.supplierName;
    purchase.productId = targetProductId;
    purchase.productName = newProduct.name;
    purchase.grade = grade || purchase.grade || "Standard";
    purchase.quantity = newQty;
    purchase.unit = targetUnit;
    purchase.rate = newRate;
    purchase.totalAmount = newTotal;
    purchase.paidAmount = newPaid;
    purchase.dueAmount = newDue;
    if (date) purchase.date = new Date(date);
    if (notes !== undefined) purchase.notes = notes;

    await purchase.save();

    await ActivityLog.create({
      action: "UPDATE_PURCHASE",
      entity: "Purchase",
      details: `Updated purchase #${purchase._id} for ${purchase.supplierName} (Total: Rs ${newTotal}, Paid: Rs ${newPaid})`,
    });

    return NextResponse.json(purchase);
  } catch (error: unknown) {
    console.error("Purchase update error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // 1. Deduct stock from inventory
    const product = await Product.findById(purchase.productId);
    if (product) {
      const qtyInBase = convertQuantity(
        purchase.quantity,
        purchase.unit || product.unit || "maund",
        product.unit || "maund",
        product.bagStock?.bagCapacityKg || 50
      );
      product.currentStock = Math.max(0, Number((product.currentStock - qtyInBase).toFixed(3)));
      if (product.bagStock && product.bagStock.filledBags > 0) {
        const bags = Math.round(
          convertQuantity(
            purchase.quantity,
            purchase.unit || "maund",
            "bag",
            product.bagStock.bagCapacityKg || 50
          )
        );
        product.bagStock.filledBags = Math.max(0, product.bagStock.filledBags - bags);
      }
      await product.save();
    }

    // 2. Revert Supplier Ledger
    const supplier = await Supplier.findById(purchase.supplierId);
    if (supplier) {
      supplier.totalPaid = Math.max(0, supplier.totalPaid - purchase.paidAmount);
      supplier.totalPayable = Math.max(0, supplier.totalPayable - purchase.dueAmount);
      await supplier.save();
    }

    // 3. Remove CashBook expense entry
    await CashBook.deleteMany({ referenceId: purchase._id.toString() });

    // 4. Delete Purchase Record
    await Purchase.findByIdAndDelete(id);

    await ActivityLog.create({
      action: "DELETE_PURCHASE",
      entity: "Purchase",
      details: `Deleted purchase invoice for ${purchase.supplierName} (${purchase.quantity} ${purchase.unit} ${purchase.productName}) and reduced inventory stock.`,
    });

    return NextResponse.json({
      success: true,
      message: `Purchase invoice deleted and stock adjusted successfully.`,
    });
  } catch (error: unknown) {
    console.error("Purchase deletion error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

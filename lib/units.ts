/**
 * Mandi Unit Conversion Utility
 * Standard Pakistan Grain Market Units:
 * 1 Maund (من / Mann) = 40 KG (کلو)
 * 1 Bag (بوری / Bori) = Default 50 KG (or product bagCapacityKg)
 */

export function convertQuantity(
  qty: number,
  fromUnit: string = "maund",
  toUnit: string = "maund",
  bagCapacityKg: number = 50
): number {
  if (!qty || isNaN(qty)) return 0;
  const f = (fromUnit || "maund").toLowerCase().trim();
  const t = (toUnit || "maund").toLowerCase().trim();

  if (f === t) return qty;

  // Step 1: Normalize source unit to KG
  let inKg = qty;
  if (f === "maund") {
    inKg = qty * 40;
  } else if (f === "bag") {
    inKg = qty * (bagCapacityKg > 0 ? bagCapacityKg : 50);
  } else if (f === "kg") {
    inKg = qty;
  }

  // Step 2: Convert KG to target unit
  if (t === "maund") {
    return inKg / 40;
  } else if (t === "bag") {
    return inKg / (bagCapacityKg > 0 ? bagCapacityKg : 50);
  } else if (t === "kg") {
    return inKg;
  }

  return qty;
}

/**
 * Helper to display human-friendly stock & weight representations
 */
export function formatWeightPreview(qty: number, unit: "maund" | "kg" | string): string {
  if (!qty || isNaN(qty)) return "";
  const u = (unit || "maund").toLowerCase().trim();

  if (u === "kg") {
    const inMaund = qty / 40;
    const roundedMaund = Number.isInteger(inMaund) ? inMaund : Number(inMaund.toFixed(2));
    let urduText = "";
    if (qty === 40) urduText = "ایک من (1 Maund)";
    else if (qty === 20) urduText = "آدھا من (0.5 Maund)";
    else if (qty === 10) urduText = "پاؤ من (10 kg)";
    else urduText = `${roundedMaund} من (Maund)`;
    return `${qty} kg = ${urduText}`;
  } else if (u === "maund") {
    const inKg = qty * 40;
    return `${qty} من = ${inKg.toLocaleString()} kg`;
  }

  return `${qty} ${unit}`;
}

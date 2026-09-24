import { db } from "../prisma/db";

const StockLevel = db.orm.public.StockLevel;

// Only stock actually held has value, so rows sitting at zero are left out.
// Products and locations come along so the report reads without further lookups.
const findValuedLevels = async (locationId?: string | undefined) => {
  let levels = StockLevel.where((level) => level.onHand.gt(0));

  if (locationId) {
    levels = levels.where({ locationId });
  }

  return levels
    .include("product", (product) =>
      product.select("id", "sku", "name", "averageCostCents"),
    )
    .include("location", (location) => location.select("id", "code", "name"))
    .all();
};

export { findValuedLevels };

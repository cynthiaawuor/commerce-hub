// What stock is worth: quantity on hand × what it cost on average. Reserved stock is
// still ours until it is sold, so valuation counts onHand, not available.
type ValuedLevel = {
  locationId: string;
  locationCode: string;
  locationName: string;
  productId: string;
  sku: string;
  productName: string;
  onHand: number;
  averageCostCents: number;
};

type ValuationLine = ValuedLevel & { valueCents: number };

const valueOf = (level: ValuedLevel) => level.onHand * level.averageCostCents;

// One line per product and location, most valuable first: the lines that matter to a
// stocktake are the ones holding the money.
const toValuationLines = (levels: ValuedLevel[]): ValuationLine[] =>
  levels
    .map((level) => ({ ...level, valueCents: valueOf(level) }))
    .sort((a, b) => b.valueCents - a.valueCents);

const summarise = (levels: ValuedLevel[]) => {
  const lines = toValuationLines(levels);

  const byLocation = new Map<
    string,
    { locationId: string; code: string; name: string; units: number; valueCents: number }
  >();

  for (const line of lines) {
    const entry = byLocation.get(line.locationId) ?? {
      locationId: line.locationId,
      code: line.locationCode,
      name: line.locationName,
      units: 0,
      valueCents: 0,
    };

    entry.units += line.onHand;
    entry.valueCents += line.valueCents;
    byLocation.set(line.locationId, entry);
  }

  return {
    totalValueCents: lines.reduce((total, line) => total + line.valueCents, 0),
    totalUnits: lines.reduce((total, line) => total + line.onHand, 0),
    locations: [...byLocation.values()].sort(
      (a, b) => b.valueCents - a.valueCents,
    ),
  };
};

export { summarise, toValuationLines, type ValuationLine, type ValuedLevel };

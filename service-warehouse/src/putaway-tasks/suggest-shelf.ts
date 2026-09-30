// freeUnits already leaves out space promised to
// other goods still waiting at the dock.
type ShelfOption = {
  code: string;
  distanceFromDock: number;
  freeUnits: number;
  holdsProduct: boolean;
};

const nearestFirst = (a: ShelfOption, b: ShelfOption) =>
  a.distanceFromDock - b.distanceFromDock || a.code.localeCompare(b.code);

// Where should these goods go?
// 1. A shelf that already holds this product and has room for all of it, so a product
//    is kept together and easy to find.
// 2. Otherwise the shelf nearest the dock with room for all of it, so the walk is short.
// 3. Otherwise nothing: the goods are not split across shelves, and a supervisor chooses.
const suggestShelf = (shelves: ShelfOption[], quantity: number): string | null => {
  const withRoom = shelves.filter((shelf) => shelf.freeUnits >= quantity);

  const alreadyHoldsProduct = withRoom
    .filter((shelf) => shelf.holdsProduct)
    .sort(nearestFirst);

  if (alreadyHoldsProduct[0]) {
    return alreadyHoldsProduct[0].code;
  }

  return withRoom.sort(nearestFirst)[0]?.code ?? null;
};

export { suggestShelf, type ShelfOption };

import { db } from "../prisma/db";

const ShelfLocation = db.orm.public.ShelfLocation;

type NewShelfLocation = {
  code: string;
  zone: string;
  distanceFromDock: number;
  capacityUnits: number;
};

// Nearest the dock first: the order a worker walks them
const findAll = async () =>
  ShelfLocation.include("products", (product) =>
    product.orderBy((p) => p.productName.asc()),
  )
    .orderBy([(shelf) => shelf.distanceFromDock.asc(), (shelf) => shelf.code.asc()])
    .all();

const findByCode = async (code: string) => ShelfLocation.where({ code }).first();

const insert = async (shelf: NewShelfLocation) => ShelfLocation.create(shelf);

export { findAll, findByCode, insert };

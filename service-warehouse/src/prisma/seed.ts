import { db } from "./db";

// A small warehouse to demo with: zone A by the dock, zone B further back.
// Safe to run twice: shelves that already exist are left alone.
const SHELVES = [
  { code: "A-01", zone: "A", distanceFromDock: 5, capacityUnits: 50 },
  { code: "A-02", zone: "A", distanceFromDock: 5, capacityUnits: 50 },
  { code: "A-03", zone: "A", distanceFromDock: 10, capacityUnits: 50 },
  { code: "B-01", zone: "B", distanceFromDock: 30, capacityUnits: 200 },
  { code: "B-02", zone: "B", distanceFromDock: 30, capacityUnits: 200 },
  { code: "B-03", zone: "B", distanceFromDock: 40, capacityUnits: 200 },
];

const seed = async () => {
  for (const shelf of SHELVES) {
    const existing = await db.orm.public.ShelfLocation.where({ code: shelf.code }).first();

    if (existing) {
      console.log(`${shelf.code} already exists`);
      continue;
    }

    await db.orm.public.ShelfLocation.create(shelf);
    console.log(`Added ${shelf.code}`);
  }
};

seed()
  .then(() => db.close())
  .catch(async (err) => {
    console.error(err);
    await db.close();
    process.exit(1);
  });

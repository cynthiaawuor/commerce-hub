#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/8b8659f1792cff8fc4d17d8b78fc3206a023f788631aeada420353ce9643bd75/contract";
import endContract from "../../snapshots/8b8659f1792cff8fc4d17d8b78fc3206a023f788631aeada420353ce9643bd75/contract.json" with { type: "json" };
import type { Contract as Start } from "../../snapshots/c3b27c20677af3d584796711549ed532059e1bc78a0bdf118797f2daf9f1804c/contract";
import startContract from "../../snapshots/c3b27c20677af3d584796711549ed532059e1bc78a0bdf118797f2daf9f1804c/contract.json" with { type: "json" };
import { Migration, MigrationCLI, col } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({
        schema: "public",
        table: "catalogItem",
        column: "unitsInStock",
      }),
      this.addColumn({
        schema: "public",
        table: "catalogItem",
        column: col("leadTimeDays", "int4", {
          codecRef: { codecId: "pg/int4@1" },
        }),
      }),
      this.dataTransform(endContract, "backfill-catalogItem-leadTimeDays", {
        check: () =>
          `SELECT 1 FROM "CatalogItem" WHERE "leadTimeDays" IS NULL LIMIT 1;`,
        run: () =>
          `UPDATE "CatalogItem" SET "leadTimeDays" = 0 WHERE "leadTimeDays" IS NULL;`,
      }),
      this.setNotNull({
        schema: "public",
        table: "catalogItem",
        column: "leadTimeDays",
      }),
      this.addColumn({
        schema: "public",
        table: "catalogItem",
        column: col("productId", "text", {
          codecRef: { codecId: "pg/text@1" },
        }),
      }),
      this.dataTransform(endContract, "backfill-catalogItem-productId", {
        check: () =>
          `SELECT 1 FROM "CatalogItem" WHERE "productId" IS NULL LIMIT 1;`,
        run: () =>
          `UPDATE "CatalogItem" SET "productId" = 'YOUR_VALID_PRODUCT_ID' WHERE "productId" IS NULL;`,
      }),
      this.setNotNull({
        schema: "public",
        table: "catalogItem",
        column: "productId",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0f1829e6bc5019fb5a420494a5672f9b2edc67248c68173a7ee431e55f039414/contract';
import endContract from '../../snapshots/0f1829e6bc5019fb5a420494a5672f9b2edc67248c68173a7ee431e55f039414/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/bfc1f324952bc169e64b3f044e35af3262ddaa7b2b43313f67b85d2450e726a9/contract';
import startContract from '../../snapshots/bfc1f324952bc169e64b3f044e35af3262ddaa7b2b43313f67b85d2450e726a9/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

const columnExists = (table: string, column: string) => ({
  description: `column "${column}" exists on "${table}"`,
  sql: 'SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3) AS "result"',
  params: ['public', table, column],
});

const renameColumn = (table: string) =>
  rawSql({
    id: `column.${table}.poNumber.rename`,
    label: `Rename "${table}"."poNumber" to "purchaseOrderNumber"`,
    operationClass: 'destructive',
    target: {
      id: 'postgres',
      details: { schema: 'public', objectType: 'column', name: 'purchaseOrderNumber', table },
    },
    precheck: [columnExists(table, 'poNumber')],
    execute: [
      {
        description: `rename "${table}"."poNumber"`,
        sql: `ALTER TABLE "public"."${table}" RENAME COLUMN "poNumber" TO "purchaseOrderNumber"`,
        params: [],
      },
    ],
    postcheck: [columnExists(table, 'purchaseOrderNumber')],
  });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  // A rename, not a drop and add: the planner cannot tell the two apart, and drop+add
  // would lose every stored order number. RENAME COLUMN keeps the data where it is.
  override get operations() {
    return [renameColumn('expectedDelivery'), renameColumn('goodsReceivedNote')];
  }
}

MigrationCLI.run(import.meta.url, M);

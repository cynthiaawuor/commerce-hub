#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0aaab3cc61bc53339dba568aef86ba322b96b3bd37947de6c978a39b4a26914c/contract';
import endContract from '../../snapshots/0aaab3cc61bc53339dba568aef86ba322b96b3bd37947de6c978a39b4a26914c/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'processedEvent',
        columns: [
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('handledAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'putawayTask',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('completedBy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('goodsReceivedNoteNumber', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('shelfCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('suggestedShelfCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'putawayTask_status_check_c62c2a0e',
            "\"status\" IN ('PENDING', 'COMPLETED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'shelfLocation',
        columns: [
          col('capacityUnits', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('distanceFromDock', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('occupiedUnits', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('zone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'shelf_location_within_capacity_f688a2b1',
            '"occupiedUnits" >= 0 AND "occupiedUnits" <= "capacityUnits"',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'shelfProduct',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('shelfLocationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'putawayTask',
        constraint: 'putawayTask_goodsReceivedNoteNumber_productId_key',
        columns: ['goodsReceivedNoteNumber', 'productId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'shelfLocation',
        constraint: 'shelfLocation_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'shelfProduct',
        constraint: 'shelfProduct_shelfLocationId_productId_key',
        columns: ['shelfLocationId', 'productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'putawayTask',
        index: 'putawayTask_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shelfProduct',
        index: 'shelfProduct_shelfLocationId_idx_33ce421c',
        columns: ['shelfLocationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shelfProduct',
        foreignKey: {
          name: 'shelfProduct_shelfLocationId_fkey',
          columns: ['shelfLocationId'],
          references: { schema: 'public', table: 'shelfLocation', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

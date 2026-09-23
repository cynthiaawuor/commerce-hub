#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/190fa07dfcb260a7655186213e9ff6beedfacc708ab36e8eee232d0ad46760b0/contract';
import startContract from '../../snapshots/190fa07dfcb260a7655186213e9ff6beedfacc708ab36e8eee232d0ad46760b0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/feecd77b591efd877a00f18ec9ad6f7b2912c7eabc96ad5e35de80afdac4b287/contract';
import endContract from '../../snapshots/feecd77b591efd877a00f18ec9ad6f7b2912c7eabc96ad5e35de80afdac4b287/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'reorderSuggestion',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dismissReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('dismissedBy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastReportedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('locationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quantityAvailable', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reorderPoint', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('suggestedQuantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'reorderSuggestion_status_check_818f8949',
            "\"status\" IN ('OPEN', 'DISMISSED', 'CONVERTED')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'reorderSuggestion',
        constraint: 'reorderSuggestion_productId_locationId_key',
        columns: ['productId', 'locationId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

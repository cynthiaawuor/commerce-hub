#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/683a1d77577d9653973c8a7ed611758316b5a94a82a0924d314dd6eb4a160e2f/contract';
import endContract from '../../snapshots/683a1d77577d9653973c8a7ed611758316b5a94a82a0924d314dd6eb4a160e2f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'supplier',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paymentTerms', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'supplierCatalog',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('leadTimeDays', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitCost', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'supplierPerformance',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('daysLate', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('qtyOrdered', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('qtyReceived', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'supplier',
        constraint: 'supplier_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'supplierCatalog',
        constraint: 'supplierCatalog_supplierId_productId_key',
        columns: ['supplierId', 'productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supplierCatalog',
        index: 'supplierCatalog_supplierId_idx_c4d9a8b9',
        columns: ['supplierId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supplierPerformance',
        index: 'supplierPerformance_supplierId_idx_c4d9a8b9',
        columns: ['supplierId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'supplierCatalog',
        foreignKey: {
          name: 'supplierCatalog_supplierId_fkey',
          columns: ['supplierId'],
          references: { schema: 'public', table: 'supplier', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'supplierPerformance',
        foreignKey: {
          name: 'supplierPerformance_supplierId_fkey',
          columns: ['supplierId'],
          references: { schema: 'public', table: 'supplier', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5151cc09931549c870d99069294959a312117f1adb0ba7fa5947df7de9593cff/contract';
import endContract from '../../snapshots/5151cc09931549c870d99069294959a312117f1adb0ba7fa5947df7de9593cff/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'catalogItem',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitPrice', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('unitsInStock', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'delivery',
        columns: [
          col('actualDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
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
          col('expectedDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'deliveryMetric',
        columns: [
          col('catalogItemId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('deliveryId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('qtyOrdered', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('qtyReceived', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('qtyRejected', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
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
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
      this.addUnique({
        schema: 'public',
        table: 'supplier',
        constraint: 'supplier_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'catalogItem',
        index: 'catalogItem_supplierId_idx_c4d9a8b9',
        columns: ['supplierId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery',
        index: 'delivery_supplierId_idx_c4d9a8b9',
        columns: ['supplierId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'deliveryMetric',
        index: 'deliveryMetric_catalogItemId_idx_1f6910ce',
        columns: ['catalogItemId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'deliveryMetric',
        index: 'deliveryMetric_deliveryId_idx_ebc950f6',
        columns: ['deliveryId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'catalogItem',
        foreignKey: {
          name: 'catalogItem_supplierId_fkey',
          columns: ['supplierId'],
          references: { schema: 'public', table: 'supplier', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'delivery',
        foreignKey: {
          name: 'delivery_supplierId_fkey',
          columns: ['supplierId'],
          references: { schema: 'public', table: 'supplier', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'deliveryMetric',
        foreignKey: {
          name: 'deliveryMetric_deliveryId_fkey',
          columns: ['deliveryId'],
          references: { schema: 'public', table: 'delivery', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'deliveryMetric',
        foreignKey: {
          name: 'deliveryMetric_catalogItemId_fkey',
          columns: ['catalogItemId'],
          references: { schema: 'public', table: 'catalogItem', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

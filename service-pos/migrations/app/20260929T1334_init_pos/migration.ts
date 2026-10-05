#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/71f02473bb7e240e43a1960e25514d7ef7ad872f4e7d58823880a9c3dff71695/contract';
import endContract from '../../snapshots/71f02473bb7e240e43a1960e25514d7ef7ad872f4e7d58823880a9c3dff71695/contract.json' with { type: 'json' };
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
        table: 'outboxEvent',
        columns: [
          col('aggregateId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('attempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deadAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nextAttemptAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('payload', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('publishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'outboxEvent_status_check_3f162824',
            "\"status\" IN ('PENDING', 'PUBLISHED', 'DEAD')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payment',
        columns: [
          col('amountCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('method', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('saleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('payment_method_check_1239a7a7', "\"method\" IN ('CASH', 'CARD')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'productPrice',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('priceCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updatedBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('product_price_positive_89df90a0', '"priceCents" > 0'),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'sale',
        columns: [
          col('cashierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('changeCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paidCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('registerCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('saleNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('taxCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('totalCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'sale_status_check_335e9174',
            "\"status\" IN ('OPEN', 'COMPLETED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'saleProduct',
        columns: [
          col('committedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reservationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('saleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('totalCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('unitPriceCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'productPrice',
        constraint: 'productPrice_productId_key',
        columns: ['productId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'productPrice',
        constraint: 'productPrice_sku_key',
        columns: ['sku'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sale',
        constraint: 'sale_saleNumber_key',
        columns: ['saleNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'outboxEvent',
        index: 'outboxEvent_status_nextAttemptAt_idx_8ba20615',
        columns: ['status', 'nextAttemptAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_saleId_idx_b4c0fb73',
        columns: ['saleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sale',
        index: 'sale_registerCode_status_idx_eec3ba0a',
        columns: ['registerCode', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'saleProduct',
        index: 'saleProduct_saleId_idx_b4c0fb73',
        columns: ['saleId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment',
        foreignKey: {
          name: 'payment_saleId_fkey',
          columns: ['saleId'],
          references: { schema: 'public', table: 'sale', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'saleProduct',
        foreignKey: {
          name: 'saleProduct_saleId_fkey',
          columns: ['saleId'],
          references: { schema: 'public', table: 'sale', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

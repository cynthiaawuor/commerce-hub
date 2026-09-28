#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/bfc1f324952bc169e64b3f044e35af3262ddaa7b2b43313f67b85d2450e726a9/contract';
import endContract from '../../snapshots/bfc1f324952bc169e64b3f044e35af3262ddaa7b2b43313f67b85d2450e726a9/contract.json' with { type: 'json' };
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
        table: 'expectedDelivery',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('poNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('supplierName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'expectedDelivery_status_check_32214e16',
            "\"status\" IN ('OPEN', 'CLOSED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'expectedProduct',
        columns: [
          col('expectedDeliveryId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantityOrdered', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantityReceived', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('unitCostCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'goodsReceivedNote',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expectedDeliveryId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('goodsReceivedNoteNumber', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locationCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('poNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('receivedBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'goodsReceivedNoteProduct',
        columns: [
          col('discrepancy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('goodsReceivedNoteId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantityAccepted', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantityDamaged', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('quantityDelivered', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantityExpected', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('unitCostCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'goodsReceivedNoteProduct_discrepancy_check_12e0bbed',
            "\"discrepancy\" IN ('NONE', 'LESS', 'MORE', 'NOT_ORDERED')",
          ),
        ],
      }),
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
      this.addUnique({
        schema: 'public',
        table: 'expectedDelivery',
        constraint: 'expectedDelivery_purchaseOrderId_key',
        columns: ['purchaseOrderId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'expectedProduct',
        constraint: 'expectedProduct_expectedDeliveryId_productId_key',
        columns: ['expectedDeliveryId', 'productId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'goodsReceivedNote',
        constraint: 'goodsReceivedNote_goodsReceivedNoteNumber_key',
        columns: ['goodsReceivedNoteNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expectedProduct',
        index: 'expectedProduct_expectedDeliveryId_idx_f6880cbc',
        columns: ['expectedDeliveryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goodsReceivedNote',
        index: 'goodsReceivedNote_expectedDeliveryId_idx_f6880cbc',
        columns: ['expectedDeliveryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goodsReceivedNoteProduct',
        index: 'goodsReceivedNoteProduct_goodsReceivedNoteId_idx_05284e9f',
        columns: ['goodsReceivedNoteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'outboxEvent',
        index: 'outboxEvent_status_nextAttemptAt_idx_8ba20615',
        columns: ['status', 'nextAttemptAt'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'expectedProduct',
        foreignKey: {
          name: 'expectedProduct_expectedDeliveryId_fkey',
          columns: ['expectedDeliveryId'],
          references: { schema: 'public', table: 'expectedDelivery', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'goodsReceivedNote',
        foreignKey: {
          name: 'goodsReceivedNote_expectedDeliveryId_fkey',
          columns: ['expectedDeliveryId'],
          references: { schema: 'public', table: 'expectedDelivery', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'goodsReceivedNoteProduct',
        foreignKey: {
          name: 'goodsReceivedNoteProduct_goodsReceivedNoteId_fkey',
          columns: ['goodsReceivedNoteId'],
          references: { schema: 'public', table: 'goodsReceivedNote', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/e7306534296be3c04579cdb84c43b20bd7c1b45f0cb2b2b4ed3231216de5bf3e/contract';
import endContract from '../../snapshots/e7306534296be3c04579cdb84c43b20bd7c1b45f0cb2b2b4ed3231216de5bf3e/contract.json' with { type: 'json' };
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
        table: 'location',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
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
      this.createTable({
        schema: 'public',
        table: 'product',
        columns: [
          col('averageCostCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('depthMm', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('heightMm', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reorderPoint', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('reorderQuantity', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitOfMeasure', 'text', {
            notNull: true,
            default: lit('each'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('weightG', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('widthMm', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'reservation',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reservedBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('resolvedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
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
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'reservation_status_check_f2701be1',
            "\"status\" IN ('ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'stockLevel',
        columns: [
          col('allocated', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('onHand', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('onOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'stockMovement',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('onHandAfter', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recordedBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'stockMovement_type_check_ad7a60c5',
            "\"type\" IN ('RECEIPT', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'location',
        constraint: 'location_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'product',
        constraint: 'product_sku_key',
        columns: ['sku'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'stockLevel',
        constraint: 'stockLevel_productId_locationId_key',
        columns: ['productId', 'locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'outboxEvent',
        index: 'outboxEvent_status_nextAttemptAt_idx_8ba20615',
        columns: ['status', 'nextAttemptAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reservation',
        index: 'reservation_locationId_idx_7aae3038',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reservation',
        index: 'reservation_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reservation',
        index: 'reservation_status_expiresAt_idx_c206f415',
        columns: ['status', 'expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stockLevel',
        index: 'stockLevel_locationId_idx_7aae3038',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stockLevel',
        index: 'stockLevel_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stockMovement',
        index: 'stockMovement_locationId_idx_7aae3038',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stockMovement',
        index: 'stockMovement_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stockMovement',
        index: 'stockMovement_productId_locationId_createdAt_idx_89d8a47a',
        columns: ['productId', 'locationId', 'createdAt'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reservation',
        foreignKey: {
          name: 'reservation_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'product', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reservation',
        foreignKey: {
          name: 'reservation_locationId_fkey',
          columns: ['locationId'],
          references: { schema: 'public', table: 'location', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stockLevel',
        foreignKey: {
          name: 'stockLevel_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'product', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stockLevel',
        foreignKey: {
          name: 'stockLevel_locationId_fkey',
          columns: ['locationId'],
          references: { schema: 'public', table: 'location', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stockMovement',
        foreignKey: {
          name: 'stockMovement_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'product', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stockMovement',
        foreignKey: {
          name: 'stockMovement_locationId_fkey',
          columns: ['locationId'],
          references: { schema: 'public', table: 'location', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

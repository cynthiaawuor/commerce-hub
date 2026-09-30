#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1a7c281f4ab84acf5c00a3eae89e5911f3979b03b363593e0c73fcbfbb24590e/contract';
import endContract from '../../snapshots/1a7c281f4ab84acf5c00a3eae89e5911f3979b03b363593e0c73fcbfbb24590e/contract.json' with { type: 'json' };
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
        table: 'recordedSale',
        columns: [
          col('cardCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('cashCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('cashierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('registerDayId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('saleNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('soldAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('totalCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'registerDay',
        columns: [
          col('businessDate', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('cardDifferenceCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('cashDifferenceCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('checkedWithPos', 'bool', { codecRef: { codecId: 'pg/bool@1' } }),
          col('closedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('closedBy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('countedCardCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('countedCashCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expectedCardCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('expectedCashCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('explanation', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('registerCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('salesAfterClose', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('salesCount', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('registerDay_status_check_32214e16', "\"status\" IN ('OPEN', 'CLOSED')"),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'recordedSale',
        constraint: 'recordedSale_saleNumber_key',
        columns: ['saleNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'registerDay',
        constraint: 'registerDay_registerCode_businessDate_key',
        columns: ['registerCode', 'businessDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'outboxEvent',
        index: 'outboxEvent_status_nextAttemptAt_idx_8ba20615',
        columns: ['status', 'nextAttemptAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'recordedSale',
        index: 'recordedSale_registerDayId_idx_6aab2438',
        columns: ['registerDayId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'registerDay',
        index: 'registerDay_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'recordedSale',
        foreignKey: {
          name: 'recordedSale_registerDayId_fkey',
          columns: ['registerDayId'],
          references: { schema: 'public', table: 'registerDay', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4ae23b214c696df9c31e93b2a1a2309a19f1fe8b295713715e94c00e12a8349c/contract';
import endContract from '../../snapshots/4ae23b214c696df9c31e93b2a1a2309a19f1fe8b295713715e94c00e12a8349c/contract.json' with { type: 'json' };
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
        table: 'purchaseOrder',
        columns: [
          col('approvedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('approvedBy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('currency', 'text', {
            notNull: true,
            default: lit('KES'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('paymentTerms', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('poNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('supplierName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('totalCents', 'int8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int8number@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'purchaseOrder_status_check_59c79f23',
            "\"status\" IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'purchaseOrderLine',
        columns: [
          col('catalogItemId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('leadTimeDays', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantityOrdered', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantityReceived', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('unitCostCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'purchaseOrderStatusChange',
        columns: [
          col('changedBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fromStatus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('toStatus', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'purchaseOrderStatusChange_fromStatus_check_e037b017',
            "\"fromStatus\" IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED')",
          ),
          checkExpression(
            'purchaseOrderStatusChange_toStatus_check_393e1d5d',
            "\"toStatus\" IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'purchaseOrder',
        constraint: 'purchaseOrder_poNumber_key',
        columns: ['poNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'purchaseOrderLine',
        constraint: 'purchaseOrderLine_purchaseOrderId_productId_key',
        columns: ['purchaseOrderId', 'productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrderLine',
        index: 'purchaseOrderLine_purchaseOrderId_idx_3e3a8c45',
        columns: ['purchaseOrderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrderStatusChange',
        index: 'purchaseOrderStatusChange_purchaseOrderId_idx_3e3a8c45',
        columns: ['purchaseOrderId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchaseOrderLine',
        foreignKey: {
          name: 'purchaseOrderLine_purchaseOrderId_fkey',
          columns: ['purchaseOrderId'],
          references: { schema: 'public', table: 'purchaseOrder', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchaseOrderStatusChange',
        foreignKey: {
          name: 'purchaseOrderStatusChange_purchaseOrderId_fkey',
          columns: ['purchaseOrderId'],
          references: { schema: 'public', table: 'purchaseOrder', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

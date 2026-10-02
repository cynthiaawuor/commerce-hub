#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c4f4694cc346d88bd5c89dbb8315be20399bb6efa153683dd53dd96f7785b6b9/contract';
import endContract from '../../snapshots/c4f4694cc346d88bd5c89dbb8315be20399bb6efa153683dd53dd96f7785b6b9/contract.json' with { type: 'json' };
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
        table: 'journalEntry',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('occurredAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('source', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('storeCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'journalEntry_source_check_42ab6a30',
            "\"source\" IN ('GOODS_RECEIVED', 'SALE', 'SALE_COST', 'DAY_CLOSED', 'SUPPLIER_PAYMENT')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'journalLine',
        columns: [
          col('accountCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('creditCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('debitCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('journalEntryId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('occurredAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
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
        table: 'purchaseCommitment',
        columns: [
          col('approvedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('paymentTerms', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('receivedCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('supplierId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('supplierName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('totalCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['purchaseOrderId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'sale',
        columns: [
          col('costAttempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('costCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('costStatus', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastCostError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('netCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('registerCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('saleNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('soldAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('storeCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('taxCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('totalCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'sale_costStatus_check_6049b7c3',
            "\"costStatus\" IN ('PENDING', 'COSTED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'saleProduct',
        columns: [
          col('costCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('revenueCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('saleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('soldAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('storeCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitCostCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'supplierBill',
        columns: [
          col('amountCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dueDate', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('goodsReceivedNoteNumber', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paidCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('paymentTerms', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('receivedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('supplierId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('supplierName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('supplierBill_status_check_f6faacac', "\"status\" IN ('OPEN', 'PAID')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'supplierPayment',
        columns: [
          col('amountCents', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('journalEntryId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paidAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('paidBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('supplierBillId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sale',
        constraint: 'sale_saleNumber_key',
        columns: ['saleNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'supplierBill',
        constraint: 'supplierBill_goodsReceivedNoteNumber_key',
        columns: ['goodsReceivedNoteNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'journalEntry',
        index: 'journalEntry_occurredAt_idx_c6b89167',
        columns: ['occurredAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'journalEntry',
        index: 'journalEntry_source_idx_c937a07d',
        columns: ['source'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'journalLine',
        index: 'journalLine_accountCode_occurredAt_idx_505ed1fa',
        columns: ['accountCode', 'occurredAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'journalLine',
        index: 'journalLine_journalEntryId_idx_9f65b209',
        columns: ['journalEntryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sale',
        index: 'sale_costStatus_idx_223aba25',
        columns: ['costStatus'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sale',
        index: 'sale_soldAt_idx_a04fbeab',
        columns: ['soldAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'saleProduct',
        index: 'saleProduct_saleId_idx_b4c0fb73',
        columns: ['saleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'saleProduct',
        index: 'saleProduct_sku_idx_506e4b93',
        columns: ['sku'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'saleProduct',
        index: 'saleProduct_storeCode_soldAt_idx_8e178b83',
        columns: ['storeCode', 'soldAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supplierBill',
        index: 'supplierBill_purchaseOrderId_idx_3e3a8c45',
        columns: ['purchaseOrderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supplierBill',
        index: 'supplierBill_status_dueDate_idx_ec56e113',
        columns: ['status', 'dueDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supplierBill',
        index: 'supplierBill_supplierId_idx_c4d9a8b9',
        columns: ['supplierId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supplierPayment',
        index: 'supplierPayment_supplierBillId_idx_f6888116',
        columns: ['supplierBillId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'journalLine',
        foreignKey: {
          name: 'journalLine_journalEntryId_fkey',
          columns: ['journalEntryId'],
          references: { schema: 'public', table: 'journalEntry', columns: ['id'] },
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
      this.addForeignKey({
        schema: 'public',
        table: 'supplierPayment',
        foreignKey: {
          name: 'supplierPayment_supplierBillId_fkey',
          columns: ['supplierBillId'],
          references: { schema: 'public', table: 'supplierBill', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

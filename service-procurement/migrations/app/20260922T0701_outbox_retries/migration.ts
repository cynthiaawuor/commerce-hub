#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7908adbc6b612e162ba7c7fc53e2f3ab4b81254dcaf88c1c4a84122e308d0888/contract';
import endContract from '../../snapshots/7908adbc6b612e162ba7c7fc53e2f3ab4b81254dcaf88c1c4a84122e308d0888/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/feecd77b591efd877a00f18ec9ad6f7b2912c7eabc96ad5e35de80afdac4b287/contract';
import startContract from '../../snapshots/feecd77b591efd877a00f18ec9ad6f7b2912c7eabc96ad5e35de80afdac4b287/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropIndex({
        schema: 'public',
        table: 'outboxEvent',
        index: 'outboxEvent_publishedAt_createdAt_idx_e43e9da7',
      }),
      this.addColumn({
        schema: 'public',
        table: 'outboxEvent',
        column: col('deadAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'outboxEvent',
        column: col('nextAttemptAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'outboxEvent',
        column: col('status', 'text', {
          notNull: true,
          default: lit('PENDING'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'outboxEvent',
        constraint: 'outboxEvent_status_check_3f162824',
        expression: "\"status\" IN ('PENDING', 'PUBLISHED', 'DEAD')",
      }),
      this.createIndex({
        schema: 'public',
        table: 'outboxEvent',
        index: 'outboxEvent_status_nextAttemptAt_idx_8ba20615',
        columns: ['status', 'nextAttemptAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

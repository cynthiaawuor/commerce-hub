#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/35acbc927f05a792076593c970686c9418574b36739bd979153137ed1d7bc769/contract';
import endContract from '../../snapshots/35acbc927f05a792076593c970686c9418574b36739bd979153137ed1d7bc769/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7908adbc6b612e162ba7c7fc53e2f3ab4b81254dcaf88c1c4a84122e308d0888/contract';
import startContract from '../../snapshots/7908adbc6b612e162ba7c7fc53e2f3ab4b81254dcaf88c1c4a84122e308d0888/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

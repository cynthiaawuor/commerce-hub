#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/190fa07dfcb260a7655186213e9ff6beedfacc708ab36e8eee232d0ad46760b0/contract';
import endContract from '../../snapshots/190fa07dfcb260a7655186213e9ff6beedfacc708ab36e8eee232d0ad46760b0/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/6b7fb0c04ad8b619fb411d8cd87e33a494736185d86e527d270d20bb9a185320/contract';
import startContract from '../../snapshots/6b7fb0c04ad8b619fb411d8cd87e33a494736185d86e527d270d20bb9a185320/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('payload', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('publishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'outboxEvent',
        index: 'outboxEvent_publishedAt_createdAt_idx_e43e9da7',
        columns: ['publishedAt', 'createdAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5151cc09931549c870d99069294959a312117f1adb0ba7fa5947df7de9593cff/contract';
import endContract from '../../snapshots/5151cc09931549c870d99069294959a312117f1adb0ba7fa5947df7de9593cff/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/83623b6d6ed9dbb32d1a4dc8f4d84de3304e56b4441eff9b62b104c5e974953e/contract';
import startContract from '../../snapshots/83623b6d6ed9dbb32d1a4dc8f4d84de3304e56b4441eff9b62b104c5e974953e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropDefault({ schema: 'public', table: 'supplier', column: 'updatedAt' })];
  }
}

MigrationCLI.run(import.meta.url, M);

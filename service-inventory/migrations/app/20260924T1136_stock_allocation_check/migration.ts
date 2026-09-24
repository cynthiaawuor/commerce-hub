#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b55b1bccc29b669e6bcb870842e3a29e60cd221278deee7125673056b4c02458/contract';
import endContract from '../../snapshots/b55b1bccc29b669e6bcb870842e3a29e60cd221278deee7125673056b4c02458/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e7306534296be3c04579cdb84c43b20bd7c1b45f0cb2b2b4ed3231216de5bf3e/contract';
import startContract from '../../snapshots/e7306534296be3c04579cdb84c43b20bd7c1b45f0cb2b2b4ed3231216de5bf3e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addCheckConstraint({
        schema: 'public',
        table: 'stockLevel',
        constraint: 'stock_level_allocated_within_on_hand_46d1460c',
        expression: '"allocated" >= 0 AND "allocated" <= "onHand"',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

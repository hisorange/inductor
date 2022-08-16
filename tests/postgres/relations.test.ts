import { PostgresColumnType } from '../../src';
import { PostgresForeignAction } from '../../src/interface/blueprint/postgres/postgres.foreign-action';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresDriver } from './util/create-connection';

describe('[Postgres] Relations', () => {
  const driver = createPostgresDriver();

  afterAll(() => driver.close());

  test('should create a belongs to relation', async () => {
    const tableNameA = `relation_belongsto_a`;
    const tableNameB = `relation_belongsto_b`;

    const blueprintA = createBlueprint(tableNameA);
    blueprintA.columns = {
      a_id_1: {
        ...createPostgresColumnWithType(PostgresColumnType.UUID),
        isPrimary: true,
      },
      a_id_2: {
        ...createPostgresColumnWithType(PostgresColumnType.TEXT),
        isPrimary: true,
      },
    };

    const blueprintB = createBlueprint(tableNameB);
    blueprintB.relations = {
      belongs_to_a: {
        columns: ['b_id_1', 'b_id_2'],
        references: {
          table: tableNameA,
          columns: ['a_id_1', 'a_id_2'],
        },
        isLocalUnique: true,
        onDelete: PostgresForeignAction.SET_NULL,
        onUpdate: PostgresForeignAction.CASCADE,
      },
    };

    blueprintB.columns = {
      b_id_1: {
        ...createPostgresColumnWithType(PostgresColumnType.UUID),
        isPrimary: true,
      },
      b_id_2: {
        ...createPostgresColumnWithType(PostgresColumnType.TEXT),
        isPrimary: true,
      },
    };

    // Remove blueprint if exists from a previous test
    await driver.migrator.dropBlueprint(blueprintB);
    await driver.migrator.dropBlueprint(blueprintA);

    // Apply the new state
    await driver.migrate([blueprintA, blueprintB]);

    expect(blueprintA).toStrictEqual((await driver.reverse([tableNameA]))[0]);
    expect(blueprintB).toStrictEqual((await driver.reverse([tableNameB]))[0]);

    // Cleanup
    await driver.migrator.dropBlueprint(blueprintB);
    await driver.migrator.dropBlueprint(blueprintA);
  });
});

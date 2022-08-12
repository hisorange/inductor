import { PostgresColumnType } from '../../src';
import { PostgresForeignAction } from '../../src/interface/blueprint/postgres/postgres.foreign-action';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Relations', () => {
  const inductor = createTestInstance();

  afterAll(() => inductor.close());

  test('should create a belongs to relation', async () => {
    const tableNameA = `relation_belongsto_a`;
    const tableNameB = `relation_belongsto_b`;

    const blueprintA = createBlueprint(tableNameA);
    blueprintA.columns = {
      a_id_1: {
        ...createColumnWithType(PostgresColumnType.UUID),
        isPrimary: true,
      },
      a_id_2: {
        ...createColumnWithType(PostgresColumnType.TEXT),
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
        ...createColumnWithType(PostgresColumnType.UUID),
        isPrimary: true,
      },
      b_id_2: {
        ...createColumnWithType(PostgresColumnType.TEXT),
        isPrimary: true,
      },
    };

    // Remove blueprint if exists from a previous test
    await inductor.driver.migrator.dropBlueprint(blueprintB);
    await inductor.driver.migrator.dropBlueprint(blueprintA);

    // Apply the new state
    await inductor.setState([blueprintA, blueprintB]);

    expect((await inductor.readState([tableNameA]))[0]).toStrictEqual(
      blueprintA,
    );
    expect((await inductor.readState([tableNameB]))[0]).toStrictEqual(
      blueprintB,
    );

    // Cleanup
    await inductor.driver.migrator.dropBlueprint(blueprintB);
    await inductor.driver.migrator.dropBlueprint(blueprintA);
  });
});

import { PostgresColumnType } from '../../src';
import { PostgresForeignAction } from '../../src/interface/schema/postgres/postgres.foreign-action';
import { createSchema } from '../../src/util/create-schema';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Relations', () => {
  const inductor = createTestInstance();

  afterAll(() => inductor.close());

  test('should create a belongs to relation', async () => {
    const tableNameA = `relation_belongsto_a`;
    const tableNameB = `relation_belongsto_b`;

    const testSchemaA = createSchema(tableNameA);
    testSchemaA.columns = {
      a_id_1: {
        ...createColumnWithType(PostgresColumnType.UUID),
        isPrimary: true,
      },
      a_id_2: {
        ...createColumnWithType(PostgresColumnType.TEXT),
        isPrimary: true,
      },
    };

    const testSchemaB = createSchema(tableNameB);
    testSchemaB.relations = {
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

    testSchemaB.columns = {
      b_id_1: {
        ...createColumnWithType(PostgresColumnType.UUID),
        isPrimary: true,
      },
      b_id_2: {
        ...createColumnWithType(PostgresColumnType.TEXT),
        isPrimary: true,
      },
    };

    // Remove schema if exists from a previous test
    await inductor.driver.migrator.dropSchema(testSchemaB);
    await inductor.driver.migrator.dropSchema(testSchemaA);

    // Apply the new state
    await inductor.setState([testSchemaA, testSchemaB]);

    expect((await inductor.readState([tableNameA]))[0]).toStrictEqual(
      testSchemaA,
    );
    expect((await inductor.readState([tableNameB]))[0]).toStrictEqual(
      testSchemaB,
    );

    // Cleanup
    await inductor.driver.migrator.dropSchema(testSchemaB);
    await inductor.driver.migrator.dropSchema(testSchemaA);
  });
});

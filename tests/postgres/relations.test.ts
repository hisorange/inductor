import { Inductor, ISchema, PostgresColumnType } from '../../src';
import { PostgresForeignAction } from '../../src/driver/postgres/postgres.foreign-action';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Relations', () => {
  let inductor: Inductor;

  beforeAll(async () => {
    inductor = createTestInstance(['relation_.+']);
  });

  afterAll(async () => {
    await inductor.close();
  });

  test('should create a belongs to relation', async () => {
    const tableNameA = `relation_belongsto_a`;
    const tableNameB = `relation_belongsto_b`;

    const testSchemaA: ISchema = {
      tableName: tableNameA,
      kind: 'table',
      uniques: {},
      indexes: {},
      relations: {},
      columns: {
        a_id_1: {
          ...createColumnWithType(PostgresColumnType.UUID),
          isPrimary: true,
        },
        a_id_2: {
          ...createColumnWithType(PostgresColumnType.TEXT),
          isPrimary: true,
        },
      },
    };

    const testSchemaB: ISchema = {
      tableName: tableNameB,
      kind: 'table',
      uniques: {},
      indexes: {},
      relations: {
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
      },
      columns: {
        b_id_1: {
          ...createColumnWithType(PostgresColumnType.UUID),
          isPrimary: true,
        },
        b_id_2: {
          ...createColumnWithType(PostgresColumnType.TEXT),
          isPrimary: true,
        },
      },
    };

    // Remove schema if exists from a previous test
    await inductor.driver.migrator.dropSchema(testSchemaB);
    await inductor.driver.migrator.dropSchema(testSchemaA);

    // Apply the new state
    await inductor.setState([testSchemaA, testSchemaB]);

    // Read the state and compare the results
    const currentState = await inductor.readState();
    const reverseSchemaA = currentState.find(
      t => t.tableName === testSchemaA.tableName,
    );

    expect(reverseSchemaA).toBeDefined();
    expect(reverseSchemaA).toStrictEqual(testSchemaA);

    const reverseSchemaB = currentState.find(
      t => t.tableName === testSchemaB.tableName,
    );

    expect(reverseSchemaB).toBeDefined();
    expect(reverseSchemaB).toStrictEqual(testSchemaB);

    // Cleanup
    await inductor.driver.migrator.dropSchema(testSchemaB);
    await inductor.driver.migrator.dropSchema(testSchemaA);
  });
});

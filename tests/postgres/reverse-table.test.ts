import { Inductor, ISchema, PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/driver/postgres/postgres.index-type';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('Reverse Table', () => {
  let inductor: Inductor;
  const testTables = ['reverse_1'];

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(name),
      ),
    );
  });

  afterAll(async () => {
    await inductor.close();
  });

  test('should be able to reverse a complex table', async () => {
    const schema: ISchema = {
      tableName: 'reverse_1',
      kind: 'table',
      uniques: {},
      indexes: {},
      columns: {
        int_col: createColumnWithType(PostgresColumnType.INTEGER),
        text_col: createColumnWithType(PostgresColumnType.TEXT),
        json_col: createColumnWithType(PostgresColumnType.JSON),
        id: {
          ...createColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        unq_col: {
          ...createColumnWithType(PostgresColumnType.TEXT),
          isUnique: true,
        },
        btree_idx_col: {
          ...createColumnWithType(PostgresColumnType.TEXT),
          isIndexed: PostgresIndexType.BTREE,
        },
        hash_idx_col: {
          ...createColumnWithType(PostgresColumnType.TEXT),
          isIndexed: PostgresIndexType.HASH,
        },
        gin_idx_col: {
          ...createColumnWithType(PostgresColumnType.JSONB),
          isIndexed: PostgresIndexType.GIN,
        },
        brin_idx_col: {
          ...createColumnWithType(PostgresColumnType.TIMESTAMP),
          isIndexed: PostgresIndexType.BRIN,
        },
        gist_idx_col: {
          ...createColumnWithType(PostgresColumnType.POINT),
          isIndexed: PostgresIndexType.GIST,
        },
        spgist_idx_col: {
          ...createColumnWithType(PostgresColumnType.INET),
          isIndexed: PostgresIndexType.SPGIST,
        },
      },
    };

    await inductor.setState([schema]);

    // Read the state and compare the same table
    const state = await inductor.readState();
    const rschema = state.find(t => t.tableName === schema.tableName);

    expect(rschema).toBeDefined();
    expect(rschema).toStrictEqual(schema);
  });
});

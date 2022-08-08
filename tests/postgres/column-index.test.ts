import { Inductor, ISchema, PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/driver/postgres/postgres.index-type';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Column Indexing', () => {
  let inductor: Inductor;

  beforeAll(async () => {
    inductor = createTestInstance(['column_index_.+']);
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each([
    ['btree', PostgresColumnType.TEXT, PostgresIndexType.BTREE],
    ['hash', PostgresColumnType.TEXT, PostgresIndexType.HASH],
    ['gist', PostgresColumnType.POINT, PostgresIndexType.GIST],
    ['gin', PostgresColumnType.JSONB, PostgresIndexType.GIN],
    ['brin', PostgresColumnType.TIMESTAMP, PostgresIndexType.BRIN],
    ['brin', PostgresColumnType.DATE, PostgresIndexType.BRIN],
    ['spgist', PostgresColumnType.INET, PostgresIndexType.SPGIST],
  ])(
    'should create [%s] index on [%s] column',
    async (
      tableSuffix: string,
      columnType: PostgresColumnType,
      indexType: PostgresIndexType,
    ) => {
      const tableName = `column_index_${tableSuffix}`;

      const testSchema: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        relations: {},
        columns: {
          primary_column: {
            ...createColumnWithType(PostgresColumnType.SERIAL),
            isPrimary: true,
          },
          unique_column: {
            ...createColumnWithType(PostgresColumnType.TEXT),
            isUnique: true,
          },
          index_column: {
            ...createColumnWithType(columnType),
            isIndexed: indexType,
          },
        },
      };

      // Remove schema if exists from a previous test
      await inductor.driver.migrator.dropSchema(testSchema);
      // Apply the new state
      await inductor.setState([testSchema]);

      // Read the state and compare the results
      const currentState = await inductor.readState();
      const reverseSchema = currentState.find(
        t => t.tableName === testSchema.tableName,
      );

      expect(reverseSchema).toBeDefined();
      expect(reverseSchema).toStrictEqual(testSchema);

      // Cleanup
      await inductor.driver.migrator.dropSchema(testSchema);
    },
  );
});

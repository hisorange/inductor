import { Inductor, ISchema, PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/driver/postgres/postgres.index-type';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Compositive Indexing', () => {
  let inductor: Inductor;

  beforeAll(async () => {
    inductor = createTestInstance(['comp_index.+']);
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each([
    ['btree', PostgresColumnType.TEXT, PostgresIndexType.BTREE],
    ['gist', PostgresColumnType.POINT, PostgresIndexType.GIST],
    ['gin', PostgresColumnType.JSONB, PostgresIndexType.GIN],
    ['brin', PostgresColumnType.TIMESTAMP, PostgresIndexType.BRIN],
    ['brin', PostgresColumnType.DATE, PostgresIndexType.BRIN],
  ])(
    'should create [%s] compositive index with [%s] column',
    async (
      tableSuffix: string,
      columnType: PostgresColumnType,
      indexType: PostgresIndexType,
    ) => {
      const tableName = `column_index_${tableSuffix}`;
      const columnSafeType = columnType.replace(/\s/g, '_');
      const indexName = `${tableName}_${columnSafeType}_${indexType}`;

      const testSchema: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {
          [indexName]: {
            type: indexType,
            columns: ['pair_column', `${columnSafeType}_column`],
          },
        },
        columns: {
          primary_column: {
            ...createColumnWithType(PostgresColumnType.SERIAL),
            isPrimary: true,
          },
          unique_column: {
            ...createColumnWithType(PostgresColumnType.TEXT),
            isUnique: true,
          },
          idx2_column: {
            ...createColumnWithType(PostgresColumnType.TEXT),
            isIndexed: PostgresIndexType.BTREE,
          },
          pair_column: {
            ...createColumnWithType(columnType),
          },
          [`${columnSafeType}_column`]: {
            ...createColumnWithType(columnType),
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

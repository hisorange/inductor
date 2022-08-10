import { PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/interface/schema/postgres/postgres.index-type';
import { createSchema } from '../../src/util/create-schema';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Compositive Indexing', () => {
  const inductor = createTestInstance();

  afterAll(() => inductor.close());

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

      const testSchema = createSchema(tableName);
      testSchema.indexes = {
        [indexName]: {
          type: indexType,
          columns: ['pair_column', `${columnSafeType}_column`],
        },
      };

      testSchema.columns = {
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
      };

      // Remove schema if exists from a previous test
      await inductor.driver.migrator.dropSchema(testSchema);
      await inductor.setState([testSchema]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        testSchema,
      );

      // Cleanup
      await inductor.driver.migrator.dropSchema(testSchema);
    },
  );
});

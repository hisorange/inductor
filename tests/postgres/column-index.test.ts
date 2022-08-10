import { PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/interface/schema/postgres/postgres.index-type';
import { createSchema } from '../../src/util/create-schema';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Column Indexing', () => {
  const inductor = createTestInstance();

  afterAll(() => inductor.close());

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

      const testSchema = createSchema(tableName);
      testSchema.columns = {
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
      };

      // Remove schema if exists from a previous test
      await inductor.driver.migrator.dropTable(tableName);
      await inductor.setState([testSchema]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        testSchema,
      );

      // Cleanup
      await inductor.driver.migrator.dropTable(tableName);
    },
  );
});

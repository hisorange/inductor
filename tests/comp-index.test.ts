import { ColumnType, IndexType } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Composite Indexing', () => {
  const driver = createTestDriver();

  afterAll(() => driver.closeConnection());

  test.each([
    ['btree', ColumnType.TEXT, IndexType.BTREE],
    ['gist', ColumnType.POINT, IndexType.GIST],
    ['gin', ColumnType.JSONB, IndexType.GIN],
    ['brin', ColumnType.TIMESTAMP_WITH_TIMEZONE, IndexType.BRIN],
    ['brin', ColumnType.DATE, IndexType.BRIN],
  ])(
    'should create [%s] composite index with [%s] column',
    async (
      tableSuffix: string,
      columnType: ColumnType,
      indexType: IndexType,
    ) => {
      const columnSafeType = columnType.replace(/\s/g, '_');
      const tableName = `cpm_itest_${tableSuffix}_${columnSafeType.substring(
        0,
        10,
      )}`;
      const indexName = `${tableName}_${columnSafeType}_${indexType}`;

      const schema = InitiateSchema(tableName);
      schema.indexes = {
        [indexName]: {
          type: indexType,
          columns: ['pair_column', `${columnSafeType}_column`],
        },
      };

      schema.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        unique_column: {
          ...createTestColumn(ColumnType.TEXT),
          isUnique: true,
        },
        idx2_column: {
          ...createTestColumn(ColumnType.TEXT),
          isIndexed: IndexType.BTREE,
        },
        pair_column: {
          ...createTestColumn(columnType),
        },
        [`${columnSafeType}_column`]: {
          ...createTestColumn(columnType),
        },
      };

      // Remove schema if exists from a previous test
      await driver.migrator.dropSchema(schema);
      await driver.setState([schema]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schema);

      // Cleanup
      await driver.migrator.dropSchema(schema);
    },
  );
});

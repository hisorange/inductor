import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { IndexType } from '../src/types/index-type.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Composite Indexing', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

  afterAll(() => driver.close());

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

      const table = InitiateTable(tableName);
      table.indexes = {
        [indexName]: {
          type: indexType,
          columns: ['pair_column', `${columnSafeType}_column`],
        },
      };

      table.columns = {
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

      await toEqual(table);
      await driver.migrator.drop(table.name);
    },
  );
});

import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { IndexType } from '../src/types/index-type.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Column Indexing', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

  afterAll(() => driver.close());

  test.each([
    ['btree', ColumnType.TEXT, IndexType.BTREE],
    ['hash', ColumnType.TEXT, IndexType.HASH],
    ['gist', ColumnType.POINT, IndexType.GIST],
    ['gin', ColumnType.JSONB, IndexType.GIN],
    ['brin', ColumnType.TIMESTAMP, IndexType.BRIN],
    ['brin', ColumnType.DATE, IndexType.BRIN],
    ['spgist', ColumnType.INET, IndexType.SPGIST],
  ])(
    'should create [%s] index on [%s] column',
    async (
      tableSuffix: string,
      columnType: ColumnType,
      indexType: IndexType,
    ) => {
      const tableName = `column_index_${tableSuffix}`;

      const table = InitiateTable(tableName);
      table.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        unique_column: {
          ...createTestColumn(ColumnType.TEXT),
          isUnique: true,
        },
        index_column: {
          ...createTestColumn(columnType),
          isIndexed: indexType,
        },
      };

      await toEqual(table);
      await driver.migrator.drop(tableName);
    },
  );
});

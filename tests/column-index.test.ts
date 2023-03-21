import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { IndexType } from '../src/types/index-type.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Column Indexing', () => {
  const driver = createTestDriver();

  afterAll(() => driver.closeConnection());

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

      // Remove table if exists from a previous test
      await driver.migrator.dropTable(tableName);
      await driver.setState([table]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(table);

      // Cleanup
      await driver.migrator.dropTable(tableName);
    },
  );
});

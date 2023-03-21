import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { IColumn } from '../src/types/column.interface';
import { ColumnTools } from '../src/utils/column-tools';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Column Adding', () => {
  const driver = createTestDriver();
  const cases: [string, IColumn][] = ColumnTools.listColumnTypes()
    .filter(type => type !== ColumnType.BIT_VARYING)
    .map(type => [type, createTestColumn(type)]);

  afterAll(() => driver.closeConnection());

  test.each(cases)(
    'should add [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `column_add_${columnSlug}`;

      const table = InitiateTable(tableName);
      table.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
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

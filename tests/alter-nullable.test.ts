import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { IColumn } from '../src/types/column.interface';
import { ColumnTools } from '../src/utils/column-tools';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Alter Nullable', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

  const cases: [string, IColumn][] = ColumnTools.listColumnTypes()
    .map(type => [type, createTestColumn(type)] as [string, IColumn])
    .filter(([type, col]) => !ColumnTools.isSerialType(col))
    .filter(([type, col]) => ![ColumnType.BIT_VARYING].includes(type as any));

  afterAll(() => driver.close());

  test.each(cases)(
    'should alter nullable flag for [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `alter_nullable_${columnSlug}`;

      const table = InitiateTable(tableName);
      table.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove table if exists from a previous test
      await driver.migrator.drop(tableName);
      await toEqual(table);

      // Continue with a true state
      table.columns[columnName].isNullable = true;
      table.columns[columnName].defaultValue = null;
      await toEqual(table);

      // Continue with a false state
      table.columns[columnName].isNullable = false;
      table.columns[columnName].defaultValue = undefined;
      await toEqual(table);

      // Cleanup
      await driver.migrator.drop(table.name);
    },
  );
});

import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { IColumn } from '../src/types/column.interface';
import { ColumnTools } from '../src/utils/column-tools';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Alter Nullable', () => {
  const driver = createTestDriver();

  const cases: [string, IColumn][] = ColumnTools.listColumnTypes()
    .map(type => [type, createTestColumn(type)] as [string, IColumn])
    .filter(([type, col]) => !ColumnTools.isSerialType(col))
    .filter(([type, col]) => ![ColumnType.BIT_VARYING].includes(type as any));

  afterAll(() => driver.closeConnection());

  test.each(cases)(
    'should alter nullable flag for [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `alter_nullable_${columnSlug}`;

      const tableRV1 = InitiateTable(tableName);
      tableRV1.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove table if exists from a previous test
      await driver.migrator.dropTable(tableName);
      await driver.setState([tableRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(tableRV1);

      // Continue with a true state
      tableRV1.columns[columnName].isNullable = true;
      tableRV1.columns[columnName].defaultValue = null;
      await driver.setState([tableRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(tableRV1);

      // Continue with a false state
      tableRV1.columns[columnName].isNullable = false;
      tableRV1.columns[columnName].defaultValue = undefined;
      await driver.setState([tableRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(tableRV1);

      // Cleanup
      await driver.migrator.dropTable(tableRV1.name);
    },
  );
});

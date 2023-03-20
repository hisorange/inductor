import { ColumnType, IColumn } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { ColumnTools } from '../src/tools/column-tools';
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

      const schemaRV1 = InitiateSchema(tableName);
      schemaRV1.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove schema if exists from a previous test
      await driver.migrator.dropTable(tableName);
      await driver.setState([schemaRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaRV1);

      // Continue with a true state
      schemaRV1.columns[columnName].isNullable = true;
      schemaRV1.columns[columnName].defaultValue = null;
      await driver.setState([schemaRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaRV1);

      // Continue with a false state
      schemaRV1.columns[columnName].isNullable = false;
      schemaRV1.columns[columnName].defaultValue = undefined;
      await driver.setState([schemaRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaRV1);

      // Cleanup
      await driver.migrator.dropSchema(schemaRV1);
    },
  );
});

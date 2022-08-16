import { ColumnType, IColumn } from '../src';
import { initBlueprint } from '../src/blueprint/blueprint.initiator';
import { ColumnTools } from '../src/tools/column-tools';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Alter Nullable', () => {
  const driver = createTestDriver();

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

      const blueprintRV1 = initBlueprint(tableName);
      blueprintRV1.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove blueprint if exists from a previous test
      await driver.migrator.dropTable(tableName);
      await driver.migrate([blueprintRV1]);

      expect((await driver.reverse([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      // Continue with a true state
      blueprintRV1.columns[columnName].isNullable = true;
      blueprintRV1.columns[columnName].defaultValue = null;
      await driver.migrate([blueprintRV1]);

      expect((await driver.reverse([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      // Continue with a false state
      blueprintRV1.columns[columnName].isNullable = false;
      blueprintRV1.columns[columnName].defaultValue = undefined;
      await driver.migrate([blueprintRV1]);

      expect((await driver.reverse([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      // Cleanup
      await driver.migrator.dropBlueprint(blueprintRV1);
    },
  );
});

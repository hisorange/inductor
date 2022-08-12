import { ColumnTools, IColumn, PostgresColumnType } from '../../src';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Alter Nullable', () => {
  const inductor = createTestInstance();

  const cases: [string, IColumn][] = (
    ColumnTools.postgres.listColumnTypes() as PostgresColumnType[]
  )
    .map(type => [type, createColumnWithType(type)] as [string, IColumn])
    .filter(([type, col]) => !ColumnTools.postgres.isSerialType(col))
    .filter(
      ([type, col]) => ![PostgresColumnType.BIT_VARYING].includes(type as any),
    );

  afterAll(() => inductor.close());

  test.each(cases)(
    'should alter nullable flag for [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `alter_nullable_${columnSlug}`;

      const blueprintRV1 = createBlueprint(tableName);
      blueprintRV1.columns = {
        primary_column: {
          ...createColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove blueprint if exists from a previous test
      await inductor.driver.migrator.dropTable(tableName);
      await inductor.setState([blueprintRV1]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      // Continue with a true state
      blueprintRV1.columns[columnName].isNullable = true;
      blueprintRV1.columns[columnName].defaultValue = null;
      await inductor.setState([blueprintRV1]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      // Continue with a false state
      blueprintRV1.columns[columnName].isNullable = false;
      blueprintRV1.columns[columnName].defaultValue = undefined;
      await inductor.setState([blueprintRV1]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      // Cleanup
      await inductor.driver.migrator.dropBlueprint(blueprintRV1);
    },
  );
});

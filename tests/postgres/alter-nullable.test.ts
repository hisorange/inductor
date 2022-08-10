import { ColumnTools, IColumn, PostgresColumnType } from '../../src';
import { createSchema } from '../../src/util/create-schema';
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

      const testSchema = createSchema(tableName);
      testSchema.columns = {
        primary_column: {
          ...createColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove schema if exists from a previous test
      await inductor.driver.migrator.dropTable(tableName);
      await inductor.setState([testSchema]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        testSchema,
      );

      // Continue with a true state
      testSchema.columns[columnName].isNullable = true;
      testSchema.columns[columnName].defaultValue = null;
      await inductor.setState([testSchema]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        testSchema,
      );

      // Continue with a false state
      testSchema.columns[columnName].isNullable = false;
      testSchema.columns[columnName].defaultValue = undefined;
      await inductor.setState([testSchema]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        testSchema,
      );

      // Cleanup
      await inductor.driver.migrator.dropSchema(testSchema);
    },
  );
});

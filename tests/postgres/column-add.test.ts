import { ColumnTools, IColumn, PostgresColumnType } from '../../src';
import { createSchema } from '../../src/util/create-schema';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Column Adding', () => {
  const inductor = createTestInstance();
  const cases: [string, IColumn][] = (
    ColumnTools.postgres.listColumnTypes() as PostgresColumnType[]
  )
    .filter(type => type !== PostgresColumnType.BIT_VARYING)
    .map(type => [type, createColumnWithType(type)]);

  afterAll(() => inductor.close());

  test.each(cases)(
    'should add [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `column_add_${columnSlug}`;

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

      // Cleanup
      await inductor.driver.migrator.dropTable(tableName);
    },
  );
});

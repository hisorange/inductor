import { ColumnTools, IColumn, PostgresColumnType } from '../../src';
import { createBlueprint } from '../../src/util/create-blueprint';
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

      const blueprint = createBlueprint(tableName);
      blueprint.columns = {
        primary_column: {
          ...createColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove blueprint if exists from a previous test
      await inductor.driver.migrator.dropTable(tableName);
      await inductor.setState([blueprint]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        blueprint,
      );

      // Cleanup
      await inductor.driver.migrator.dropTable(tableName);
    },
  );
});

import { ColumnTools, IColumn, PostgresColumnType } from '../../src';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresTestInstance } from './util/create-connection';

describe('[Postgres] Column Adding', () => {
  const inductor = createPostgresTestInstance();
  const cases: [string, IColumn][] = (
    ColumnTools.postgres.listColumnTypes() as PostgresColumnType[]
  )
    .filter(type => type !== PostgresColumnType.BIT_VARYING)
    .map(type => [type, createPostgresColumnWithType(type)]);

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
          ...createPostgresColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove blueprint if exists from a previous test
      await inductor.driver.migrator.dropTable(tableName);
      await inductor.migrate([blueprint]);

      expect((await inductor.reverse([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await inductor.driver.migrator.dropTable(tableName);
    },
  );
});

import { IColumn, PostgresColumnType } from '../../src';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Enumerated Column', () => {
  const inductor = createTestInstance();

  afterAll(() => inductor.close());

  test.each([
    ['single', ['one']],
    ['text', ['a', 'b', 'c']],
    ['vary', ['1', 'b', 'c']],
  ])(
    'should add [%s] type column with values [%s]',
    async (setType: string, setValues: any[]) => {
      const columnName = `enum_${setType}`;
      const tableName = `enum_col_${setType}`;

      const blueprint = createBlueprint(tableName);
      blueprint.columns = {
        primary_column: {
          ...createColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: {
          ...createColumnWithType(PostgresColumnType.ENUM, {
            values: setValues,
          }),
        } as IColumn,
      };

      // Remove blueprint if exists from a previous test
      await inductor.driver.migrator.dropBlueprint(blueprint);
      await inductor.setState([blueprint]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        blueprint,
      );

      // Cleanup
      await inductor.driver.migrator.dropBlueprint(blueprint);
    },
  );
});

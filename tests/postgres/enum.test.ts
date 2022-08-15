import cloneDeep from 'lodash.clonedeep';
import { EnumColumnType, IColumn, PostgresColumnType } from '../../src';
import { ColumnKind } from '../../src/interface/blueprint';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresTestInstance } from './util/create-connection';

describe('[Postgres] Enumerated Column', () => {
  const inductor = createPostgresTestInstance();

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
          ...createPostgresColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: {
          ...createPostgresColumnWithType(PostgresColumnType.ENUM, {
            values: setValues,
          }),
        } as IColumn,
      };

      // Remove blueprint if exists from a previous test
      await inductor.driver.migrator.dropBlueprint(blueprint);
      await inductor.migrate([blueprint]);

      expect((await inductor.reverse([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await inductor.driver.migrator.dropBlueprint(blueprint);
    },
  );

  // We will change an enumeration values and check if the change is reflected in the database
  test.skip('should change an enumeration value', async () => {
    const tableName = 'enum_change_v1';
    const blueprintV1 = createBlueprint(tableName);
    blueprintV1.columns = {
      primary_column: {
        ...createPostgresColumnWithType(PostgresColumnType.SERIAL),
      },
      enum_column: {
        kind: ColumnKind.COLUMN,
        type: {
          name: PostgresColumnType.ENUM,
          values: ['a', 'b', 'c'],
          nativeName: 'enum_rv_1',
        },
        isNullable: false,
        isUnique: false,
        isPrimary: false,
        isIndexed: false,
        defaultValue: undefined,
      },
    };

    await inductor.driver.migrator.dropTable(tableName);
    await inductor.migrate([blueprintV1]);
    expect((await inductor.reverse([tableName]))[0]).toStrictEqual(blueprintV1);

    const blueprintV2 = cloneDeep(blueprintV1);
    (blueprintV2.columns.enum_column.type as EnumColumnType).values = [
      'a',
      'b',
      'd',
    ];
    await inductor.migrate([blueprintV2]);

    expect((await inductor.reverse([tableName]))[0]).toStrictEqual(blueprintV2);
  });
});

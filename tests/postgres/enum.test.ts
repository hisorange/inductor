import cloneDeep from 'lodash.clonedeep';
import { EnumColumnType, IColumn, PostgresColumnType } from '../../src';
import { ColumnKind } from '../../src/interface/blueprint';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresDriver } from './util/create-connection';

describe('[Postgres] Enumerated Column', () => {
  const driver = createPostgresDriver();

  afterAll(() => driver.close());

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
      await driver.migrator.dropBlueprint(blueprint);
      await driver.migrate([blueprint]);

      expect((await driver.reverse([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await driver.migrator.dropBlueprint(blueprint);
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

    await driver.migrator.dropTable(tableName);
    await driver.migrate([blueprintV1]);
    expect((await driver.reverse([tableName]))[0]).toStrictEqual(blueprintV1);

    const blueprintV2 = cloneDeep(blueprintV1);
    (blueprintV2.columns.enum_column.type as EnumColumnType).values = [
      'a',
      'b',
      'd',
    ];
    await driver.migrate([blueprintV2]);

    expect((await driver.reverse([tableName]))[0]).toStrictEqual(blueprintV2);
  });
});

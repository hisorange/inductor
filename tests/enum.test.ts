import cloneDeep from 'lodash.clonedeep';
import { ColumnKind, ColumnType, EnumColumnType, IColumn } from '../src';
import { initBlueprint } from '../src/blueprint/blueprint.initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Enumerated Column', () => {
  const driver = createTestDriver();

  afterAll(() => driver.closeConnection());

  test.each([
    ['single', ['one']],
    ['text', ['a', 'b', 'c']],
    ['vary', ['1', 'b', 'c']],
  ])(
    'should add [%s] type column with values [%s]',
    async (setType: string, setValues: any[]) => {
      const columnName = `enum_${setType}`;
      const tableName = `enum_col_${setType}`;

      const blueprint = initBlueprint(tableName);
      blueprint.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: {
          ...createTestColumn(ColumnType.ENUM, {
            values: setValues,
          }),
        } as IColumn,
      };

      // Remove blueprint if exists from a previous test
      await driver.migrationManager.dropBlueprint(blueprint);
      await driver.setState([blueprint]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await driver.migrationManager.dropBlueprint(blueprint);
    },
  );

  // We will change an enumeration values and check if the change is reflected in the database
  test.skip('should change an enumeration value', async () => {
    const tableName = 'enum_change_v1';
    const blueprintV1 = initBlueprint(tableName);
    blueprintV1.columns = {
      primary_column: {
        ...createTestColumn(ColumnType.SERIAL),
      },
      enum_column: {
        kind: ColumnKind.COLUMN,
        type: {
          name: ColumnType.ENUM,
          values: ['a', 'b', 'c'],
          nativeName: 'enum_rv_1',
        },
        isNullable: false,
        isUnique: false,
        isPrimary: false,
        isIndexed: false,
        defaultValue: undefined,
        capabilities: [],
      },
    };

    await driver.migrationManager.dropTable(tableName);
    await driver.setState([blueprintV1]);
    expect((await driver.readState([tableName]))[0]).toStrictEqual(blueprintV1);

    const blueprintV2 = cloneDeep(blueprintV1);
    (blueprintV2.columns.enum_column.type as EnumColumnType).values = [
      'a',
      'b',
      'd',
    ];
    await driver.setState([blueprintV2]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(blueprintV2);
  });
});

import cloneDeep from 'lodash.clonedeep';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { EnumColumnType, IColumn } from '../src/types/column.interface';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Enumerated Column', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

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

      const table = InitiateTable(tableName);
      table.columns = {
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

      // RegTypes are failing when the native typename contains upper case letters
      // But we map it back from the internal lowercase aliases
      (
        table.columns[columnName].type as EnumColumnType
      ).nativeName = `enum_${setType}_CapitalHit`;

      // Remove table if exists from a previous test
      await driver.migrator.drop(table.name);
      await toEqual(table);

      // Cleanup
      await driver.migrator.drop(table.name);
    },
  );

  // We will change an enumeration values and check if the change is reflected in the database
  test.skip('should change an enumeration value', async () => {
    const tableName = 'enum_change_v1';
    const tableRV1 = InitiateTable(tableName);
    tableRV1.columns = {
      primary_column: {
        ...createTestColumn(ColumnType.SERIAL),
      },
      enum_column: {
        type: {
          name: ColumnType.ENUM,
          values: ['a', 'b', 'c'],
          nativeName: 'enum_RV_1',
        },
        isNullable: false,
        isUnique: false,
        isPrimary: false,
        isIndexed: false,
        defaultValue: undefined,
        meta: {},
      },
    };

    await driver.migrator.drop(tableName);
    await toEqual(tableRV1);

    const tableRV2 = cloneDeep(tableRV1);
    (tableRV2.columns.enum_column.type as EnumColumnType).values = [
      'a',
      'b',
      'd',
    ];
    await toEqual(tableRV2);
  });
});

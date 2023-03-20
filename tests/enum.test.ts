import cloneDeep from 'lodash.clonedeep';
import { ColumnKind, ColumnType, EnumColumnType, IColumn } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
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

      const schema = InitiateSchema(tableName);
      schema.columns = {
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
        schema.columns[columnName].type as EnumColumnType
      ).nativeName = `enum_${setType}_CapitalHit`;

      // Remove schema if exists from a previous test
      await driver.migrator.dropSchema(schema);
      await driver.setState([schema]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schema);

      // Cleanup
      await driver.migrator.dropSchema(schema);
    },
  );

  // We will change an enumeration values and check if the change is reflected in the database
  test.skip('should change an enumeration value', async () => {
    const tableName = 'enum_change_v1';
    const schemaV1 = InitiateSchema(tableName);
    schemaV1.columns = {
      primary_column: {
        ...createTestColumn(ColumnType.SERIAL),
      },
      enum_column: {
        kind: ColumnKind.COLUMN,
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
        capabilities: [],
      },
    };

    await driver.migrator.dropTable(tableName);
    await driver.setState([schemaV1]);
    expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaV1);

    const schemaV2 = cloneDeep(schemaV1);
    (schemaV2.columns.enum_column.type as EnumColumnType).values = [
      'a',
      'b',
      'd',
    ];
    await driver.setState([schemaV2]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaV2);
  });
});

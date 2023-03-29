import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Default Value', () => {
  const driver = createTestDriver();

  afterAll(() => driver.close());

  test.each([
    [ColumnType.TEXT, 'string', 'abc'],
    [ColumnType.INTEGER, 'number', 123],
    [ColumnType.DOUBLE, 'float', 5.5],
    [ColumnType.REAL, 'float', 3.4],
    [ColumnType.BOOLEAN, 'true', true],
    [ColumnType.BOOLEAN, 'false', false],
    [ColumnType.JSON, 'array', ['a', 'b', 'c']],
    [ColumnType.JSONB, 'object', { a: 1, b: 2, c: 3 }],
    [ColumnType.JSONB, 'number', 564],
    [ColumnType.JSONB, 'true', true],
    [ColumnType.JSONB, 'false', false],
    [ColumnType.BOOLEAN, 'null', null],
    [ColumnType.BYTEA, 'null', null],
    [ColumnType.INTEGER, 'null', null],
    [ColumnType.CHAR, 'null', null],
    [ColumnType.TEXT, 'null', null],
    [ColumnType.DATE, 'null', null],
    [ColumnType.JSONB, 'null', null],
    // TODO [ColumnType.DATE, 'now', 'NOW()'],
    // TODO [ColumnType.DATE, 'CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP'],
  ])(
    'should create [%s] type column with [%s] default value',
    async (columnType: ColumnType, valueType: string, defaultValue: any) => {
      const tableName = `create_def_value_${columnType.replace(
        /\s/g,
        '',
      )}_${valueType}`;

      const table = InitiateTable(tableName);
      table.columns = {
        test_column: {
          ...createTestColumn(columnType),
          defaultValue,
          isNullable: defaultValue === null,
        },
      };

      // Remove table if exists from a previous test
      await driver.migrator.drop(table.name);
      await driver.set([table]);

      expect((await driver.read([tableName]))[0]).toStrictEqual(table);

      // Cleanup
      await driver.migrator.drop(table.name);
    },
  );
});

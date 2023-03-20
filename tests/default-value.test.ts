import { ColumnType } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Default Value', () => {
  const driver = createTestDriver();

  afterAll(() => driver.closeConnection());

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

      const blueprint = InitiateSchema(tableName);
      blueprint.columns = {
        test_column: {
          ...createTestColumn(columnType),
          defaultValue,
          isNullable: defaultValue === null,
        },
      };

      // Remove blueprint if exists from a previous test
      await driver.migrator.dropBlueprint(blueprint);
      await driver.setState([blueprint]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await driver.migrator.dropBlueprint(blueprint);
    },
  );
});

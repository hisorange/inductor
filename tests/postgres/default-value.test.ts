import { PostgresColumnType } from '../../src';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresDriver } from './util/create-connection';

describe('[Postgres] Default Value', () => {
  const driver = createPostgresDriver();

  afterAll(() => driver.close());

  test.each([
    [PostgresColumnType.TEXT, 'string', 'abc'],
    [PostgresColumnType.INTEGER, 'number', 123],
    [PostgresColumnType.DOUBLE, 'float', 5.5],
    [PostgresColumnType.REAL, 'float', 3.4],
    [PostgresColumnType.BOOLEAN, 'true', true],
    [PostgresColumnType.BOOLEAN, 'false', false],
    [PostgresColumnType.JSON, 'array', ['a', 'b', 'c']],
    [PostgresColumnType.JSONB, 'object', { a: 1, b: 2, c: 3 }],
    [PostgresColumnType.JSONB, 'number', 564],
    [PostgresColumnType.JSONB, 'true', true],
    [PostgresColumnType.JSONB, 'false', false],
    [PostgresColumnType.BOOLEAN, 'null', null],
    [PostgresColumnType.BYTEA, 'null', null],
    [PostgresColumnType.INTEGER, 'null', null],
    [PostgresColumnType.CHAR, 'null', null],
    [PostgresColumnType.TEXT, 'null', null],
    [PostgresColumnType.DATE, 'null', null],
    [PostgresColumnType.JSONB, 'null', null],
    // TODO [PostgresColumnType.DATE, 'now', 'NOW()'],
    // TODO [PostgresColumnType.DATE, 'CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP'],
  ])(
    'should create [%s] type column with [%s] default value',
    async (
      columnType: PostgresColumnType,
      valueType: string,
      defaultValue: any,
    ) => {
      const tableName = `create_def_value_${columnType.replace(
        /\s/g,
        '',
      )}_${valueType}`;

      const blueprint = createBlueprint(tableName);
      blueprint.columns = {
        test_column: {
          ...createPostgresColumnWithType(columnType),
          defaultValue,
          isNullable: defaultValue === null,
        },
      };

      // Remove blueprint if exists from a previous test
      await driver.migrator.dropBlueprint(blueprint);
      await driver.migrate([blueprint]);

      expect((await driver.reverse([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await driver.migrator.dropBlueprint(blueprint);
    },
  );
});

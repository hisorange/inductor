import { PostgresColumnType } from '../../src';
import { createSchema } from '../../src/util/create-schema';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Default Value', () => {
  const inductor = createTestInstance();

  afterAll(() => inductor.close());

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
      const tableName = `create_def_value_${columnType}_${valueType}`;

      const testSchema = createSchema(tableName);
      testSchema.columns = {
        test_column: {
          ...createColumnWithType(columnType),
          defaultValue,
          isNullable: defaultValue === null,
        },
      };

      // Remove schema if exists from a previous test
      await inductor.driver.migrator.dropSchema(testSchema);
      await inductor.setState([testSchema]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        testSchema,
      );

      // Cleanup
      await inductor.driver.migrator.dropSchema(testSchema);
    },
  );
});

import { IColumn, PostgresColumnType } from '../../src';
import { createSchema } from '../../src/util/create-schema';
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

      const testSchema = createSchema(tableName);
      testSchema.columns = {
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

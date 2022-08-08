import { IColumn, Inductor, ISchema, PostgresColumnType } from '../../src';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Enumerated Column', () => {
  let inductor: Inductor;

  beforeAll(async () => {
    inductor = createTestInstance(['enum_col_.+']);
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each([
    ['text', ['a', 'b', 'c']],
    ['vary', ['1', 'b', 'c']],
  ])(
    'should add [%s] type column with values [%s]',
    async (setType: string, setValues: any[]) => {
      const columnName = `enum_${setType}`;
      const tableName = `enum_col_${setType}`;

      const testSchema: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        relations: {},
        columns: {
          primary_column: {
            ...createColumnWithType(PostgresColumnType.SERIAL),
            isPrimary: true,
          },
          [columnName]: {
            ...createColumnWithType(PostgresColumnType.ENUM),
            values: setValues,
          } as IColumn,
        },
      };

      // Remove schema if exists from a previous test
      await inductor.driver.migrator.dropSchema(testSchema);
      // Apply the new state
      await inductor.setState([testSchema]);

      // Read the state and compare the results
      const currentState = await inductor.readState();
      const reverseSchema = currentState.find(
        t => t.tableName === testSchema.tableName,
      );

      expect(reverseSchema).toBeDefined();
      expect(reverseSchema).toStrictEqual(testSchema);

      // Cleanup
      await inductor.driver.migrator.dropSchema(testSchema);
    },
  );
});

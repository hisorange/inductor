import {
  ColumnTools,
  IColumn,
  Inductor,
  ISchema,
  PostgresColumnType,
} from '../../src';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Column Adding', () => {
  let inductor: Inductor;
  const cases: [string, IColumn][] = (
    ColumnTools.postgres.listColumnTypes() as PostgresColumnType[]
  ).map(type => [type, createColumnWithType(type)]);

  beforeAll(async () => {
    inductor = createTestInstance(['column_add_.+']);
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each(cases)(
    'should be able to add [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `column_add_${columnSlug}`;

      const testSchema: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          primary_column: {
            ...createColumnWithType(PostgresColumnType.SERIAL),
            isPrimary: true,
          },
          [columnName]: columnDef,
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

import {
  ColumnTools,
  IColumn,
  Inductor,
  ISchema,
  PostgresColumnType,
} from '../../src';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Alter Nullable', () => {
  let inductor: Inductor;

  const cases: [string, IColumn][] = (
    ColumnTools.postgres.listColumnTypes() as PostgresColumnType[]
  )
    .map(type => [type, createColumnWithType(type)] as [string, IColumn])
    .filter(([type, col]) => !ColumnTools.postgres.isSerialType(col))
    .filter(
      ([type, col]) => ![PostgresColumnType.BIT_VARYING].includes(type as any),
    );

  beforeAll(async () => {
    inductor = createTestInstance(['alter_nullable_.+']);
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each(cases)(
    'should alter nullable flag for [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `alter_nullable_${columnSlug}`;

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
          [columnName]: columnDef,
        },
      };

      // Remove schema if exists from a previous test
      await inductor.driver.migrator.dropSchema(testSchema);
      // Apply the new state
      await inductor.setState([testSchema]);

      // Read the state and compare the results
      const baseState = await inductor.readState();
      const baseReverseSchema = baseState.find(
        t => t.tableName === testSchema.tableName,
      );

      expect(baseReverseSchema).toBeDefined();
      expect(baseReverseSchema).toStrictEqual(testSchema);

      // Continue with a true state
      testSchema.columns[columnName].isNullable = true;
      testSchema.columns[columnName].defaultValue = null;
      // Apply the new state
      await inductor.setState([testSchema]);

      // Read the state and compare the results
      const trueState = await inductor.readState();
      const trueReverseSchema = trueState.find(
        t => t.tableName === testSchema.tableName,
      );

      expect(trueReverseSchema).toBeDefined();
      expect(trueReverseSchema).toStrictEqual(testSchema);

      // Continue with a false state
      testSchema.columns[columnName].isNullable = false;
      testSchema.columns[columnName].defaultValue = undefined;
      // Apply the new state
      await inductor.setState([testSchema]);

      // Read the state and compare the results
      const falseState = await inductor.readState();
      const falseReverseSchema = falseState.find(
        t => t.tableName === testSchema.tableName,
      );

      expect(falseReverseSchema).toBeDefined();
      expect(falseReverseSchema).toStrictEqual(testSchema);

      // Cleanup
      await inductor.driver.migrator.dropSchema(testSchema);
    },
  );
});

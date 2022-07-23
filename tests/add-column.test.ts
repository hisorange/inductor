import cloneDeep from 'lodash.clonedeep';
import { PostgresColumnType } from '../src/driver/postgres/postgres.column-type';
import { Inductor } from '../src/inductor';
import { ISchema } from '../src/interface/schema.interface';
import { createTestInstance } from './util/create-connection';

describe('Add Column', () => {
  let inductor: Inductor;

  const columns: ISchema['columns'] = {
    col_var_1: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: true,
    },
    col_var_2: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: true,
      isUnique: false,
      isPrimary: false,
    },
    col_var_3: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: true,
      isPrimary: false,
    },
    col_var_4: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: false,
    },
  };

  const testTables = Object.keys(columns).map(name => `drop_column_${name}`);

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name => inductor.knex.schema.dropTableIfExists(name)),
    );
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each(Object.keys(columns))(
    'should be able to add the [%s] column',
    async col => {
      const tableName = `add_column_${col}`;

      // Create the table without the column
      const schemaRV1: ISchema = {
        tableName,
        kind: 'table',
        columns: cloneDeep(columns),
        uniques: {},
        indexes: {},
      };
      delete schemaRV1.columns[col];

      // Apply the state
      await inductor.setState([schemaRV1]);

      const columnRV1 = await inductor.driver.inspector.hasColumn(
        tableName,
        col,
      );
      // Has to check LENGTH because the hasColumn returns an empty array if the column doesn't exist
      expect(columnRV1?.length).toBeFalsy();

      const schemaRV2 = cloneDeep(schemaRV1);
      schemaRV2.columns = columns;

      // Apply the changes
      await inductor.setState([schemaRV2]);
      const columnRV2 = await inductor.driver.inspector.hasColumn(
        tableName,
        col,
      );

      expect(columnRV2).toBeTruthy();
    },
    5_000,
  );
});

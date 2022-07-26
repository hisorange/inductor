import cloneDeep from 'lodash.clonedeep';
import { PostgresColumnType } from '../src/driver/postgres/postgres.column-type';
import { PostgresIndexType } from '../src/driver/postgres/postgres.index-type';
import { Inductor } from '../src/inductor';
import { ISchema } from '../src/interface/schema.interface';
import { createTestInstance } from './util/create-connection';

describe('Drop Column', () => {
  let inductor: Inductor;

  const columns: ISchema['columns'] = {
    col_var_1: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: true,
      isIndexed: false,
    },
    col_var_2: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: true,
      isUnique: false,
      isPrimary: false,
      isIndexed: false,
    },
    col_var_3: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: true,
      isPrimary: false,
      isIndexed: false,
    },
    col_var_4: {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: false,
      isIndexed: PostgresIndexType.BTREE,
    },
  };

  const testTables = Object.keys(columns).map(name => `drop_column_${name}`);

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(name),
      ),
    );
  });

  afterAll(async () => {
    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(name),
      ),
    );

    await inductor.close();
  });

  test.each(Object.keys(columns))(
    'should be able to drop the [%s] column',
    async col => {
      const tableName = `drop_column_${col}`;

      // Create the table
      const schemaRV1: ISchema = {
        tableName,
        kind: 'table',
        columns,
        uniques: {},
        indexes: {},
      };
      // Apply the state
      await inductor.setState([schemaRV1]);

      const columnRV1 = await inductor.driver.inspector.hasColumn(
        tableName,
        col,
      );
      expect(columnRV1).toBeTruthy();

      const schemaRV2 = cloneDeep(schemaRV1);
      delete schemaRV2.columns[col];

      // Apply the changes
      await inductor.setState([schemaRV2]);
      const columnRV2 = await inductor.driver.inspector.hasColumn(
        tableName,
        col,
      );

      // Has to check LENGTH because the hasColumn returns an empty array if the column doesn't exist
      expect(columnRV2?.length).toBeFalsy();
    },
    5_000,
  );
});
